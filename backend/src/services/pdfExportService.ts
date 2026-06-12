import pool from "../config/database";
import { computeCrcResults, CrcResults } from "../utils/crcScoring";
import { generateAndValidateNarrative, limitSentences } from "./narrativeValidator";

const NARRATIVE_SYSTEM_PROMPT = `You are a compliance assistant for MATUR.ai.
Generate a narrative summary based ONLY on the provided section data.
CONSTRAINTS:
- Use plain prose only. Do NOT use markdown, bullet points, headers, lists, or bold text.
- Do NOT use forbidden words/phrases: "certified", "audited by MATUR", "verified", "compliant", "compliance achieved", "fully compliant".
- State facts directly from the data. Do NOT extrapolate, speculate, or introduce external concepts.
- Keep the summary clear, executive-grade, and concise.`;

/**
 * Aggregates all project details, compliance stats, risks, components, vendors, and fairness metrics.
 */
async function getRawProjectData(projectId: string) {
    // 1. Project name and description
    const projectRes = await pool.query(
        "SELECT name, description FROM projects WHERE id = $1",
        [projectId]
    );
    if (projectRes.rows.length === 0) {
        throw new Error("Project not found");
    }
    const project = projectRes.rows[0];

    // 2. Wizard profiles & engine outputs
    const profileRes = await pool.query(
        "SELECT * FROM wizard_profiles WHERE project_id = $1",
        [projectId]
    );
    const profile = profileRes.rows[0] || null;

    const outputRes = await pool.query(
        "SELECT * FROM wizard_engine_outputs WHERE project_id = $1",
        [projectId]
    );
    const engineOutput = outputRes.rows[0] || null;

    // 3. CRC Results (Hero metrics, Category scores, framework scores, risk summaries)
    const crcResults: CrcResults = await computeCrcResults(projectId);

    // 4. Risks
    const risksRes = await pool.query(
        `SELECT title, category, rating, status, owner, description, mitigation_plan 
         FROM crc_risks 
         WHERE project_id = $1 AND status = 'Open' 
         ORDER BY id ASC`,
        [projectId]
    );
    const risks = risksRes.rows;

    // 5. Component Inventory & Vendor Assessments
    const componentsRes = await pool.query(
        `SELECT ci.*, va.score AS vendor_score, va.risk_tier AS vendor_risk_tier, va.status AS vendor_assessment_status
         FROM component_inventory ci
         LEFT JOIN vendor_assessments va ON ci.id = va.component_id
         WHERE ci.project_id = $1
         ORDER BY ci.component_id ASC`,
         [projectId]
    );
    const components = componentsRes.rows;

    // 6. Bias Testing (Fairness Evaluations)
    const fairnessRes = await pool.query(
        `SELECT bias_score, toxicity_score, relevancy_score, faithfulness_score, overall_score 
         FROM fairness_evaluations 
         WHERE project_id = $1`,
        [projectId]
    );
    const evaluations = fairnessRes.rows;

    // 7. Dataset reports count
    const datasetReportsCountRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM dataset_fairness_reports WHERE project_id = $1",
        [projectId]
    );
    const datasetReportsCount = datasetReportsCountRes.rows[0]?.count || 0;

    // 8. API test reports count
    const apiReportsCountRes = await pool.query(
        "SELECT COUNT(*)::int as count FROM api_test_reports WHERE project_id = $1",
        [projectId]
    );
    const apiReportsCount = apiReportsCountRes.rows[0]?.count || 0;

    // 9. Full control list with response details and flags
    const controlsRes = await pool.query(
        `SELECT c.control_id,
                c.category_id,
                cat.name AS category_name,
                r.value AS response_value,
                r.evidence_status,
                r.evidence_url,
                r.audit_ready,
                r.notes,
                c.control_title
         FROM crc_controls c
         LEFT JOIN crc_categories cat ON cat.id = c.category_id
         LEFT JOIN crc_assessment_responses r
                ON r.control_id = c.id AND r.project_id = $1
         WHERE c.status = 'Published'
         ORDER BY c.control_id ASC`,
         [projectId]
    );
    const controls = controlsRes.rows;

    return {
        project,
        profile,
        engineOutput,
        crcResults,
        risks,
        components,
        evaluations,
        datasetReportsCount,
        apiReportsCount,
        controls
    };
}

/**
 * Format raw response value into standard string text for reports
 */
function formatResponseValue(value: any): string {
    if (value === null || value === undefined) return "Unanswered";
    const num = Number(value);
    if (num === 0) return "No";
    if (num === 0.5) return "Partially";
    if (num === 1) return "Yes";
    if (num === 2) return "N/A";
    if (num === 3) return "Not Sure";
    return "Unanswered";
}

/**
 * Formats a list of categories to highlight top strengths and priority gaps
 */
function getStrengthsAndGaps(categories: any[]) {
    // Filter categories with valid percentages
    const scoredCategories = categories
        .filter(c => c.percentage !== null)
        .map(c => ({
            categoryName: c.categoryName,
            percentage: Math.round(c.percentage)
        }));

    // Sort descending for strengths
    const strengths = [...scoredCategories]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);

    // Sort ascending for gaps
    const gaps = [...scoredCategories]
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 3);

    return { strengths, gaps };
}

export async function generateFullPdfData(projectId: string) {
    const data = await getRawProjectData(projectId);
    const timestamp = new Date().toISOString();
    const projectName = data.project.name;
    const projectDescription = data.project.description || "";

    // Build the sections for Claude narrative calls
    const systemProfileData = {
        name: projectName,
        description: projectDescription,
        governanceScope: data.profile?.governance_scope || "Not specified",
        useCase: data.profile?.use_case || "Not specified",
        regulatoryRole: data.profile?.regulatory_role || "Not specified",
        scale: data.profile?.scale || "Not specified",
        usesThirdPartyModels: data.profile?.uses_third_party_models || "Not specified",
        automationLevel: data.profile?.automation_level || "Not specified",
        biometricUse: data.profile?.biometric_use || "Not specified",
        affectsChildren: data.profile?.affects_children || "Not specified",
        euRiskTier: data.engineOutput?.eu_risk_tier || "MINIMAL",
        internalRiskTier: data.engineOutput?.internal_risk_tier || "LOW",
        euRiskReason: data.engineOutput?.eu_risk_reason || "",
        dataCategories: data.profile?.data_categories || [],
        geographicScope: data.profile?.geographic_scope || [],
        thirdPartyProviders: data.profile?.third_party_providers || [],
        existingCertifications: data.profile?.existing_certifications || [],
        annexIDomains: data.profile?.annex_iii_domains || []
    };

    const heroMetricsData = {
        overallPercentage: data.crcResults.overall.percentage !== null ? Math.round(data.crcResults.overall.percentage) : null,
        totalControls: data.crcResults.overall.totalControls,
        answeredControls: data.crcResults.overall.answeredControls,
        scoredControls: data.crcResults.overall.scoredControls,
        naCount: data.crcResults.overall.naCount,
        applicableControls: data.crcResults.overall.applicableControls,
        averageScore: data.crcResults.overall.averageScore !== null ? Math.round(data.crcResults.overall.averageScore * 100) / 100 : null,
        evidencePercentage: data.crcResults.evidenceProgress?.percentage || 0,
        openRisksCount: data.risks.length
    };

    const frameworkReadinessData = {
        euAiAct: {
            percentage: data.crcResults.frameworks.eu_ai_act.percentage !== null ? Math.round(data.crcResults.frameworks.eu_ai_act.percentage) : null,
            applicable: data.crcResults.frameworks.eu_ai_act.applicableControls,
            scored: data.crcResults.frameworks.eu_ai_act.scoredControls
        },
        nistAiRmf: {
            percentage: data.crcResults.frameworks.nist_ai_rmf.percentage !== null ? Math.round(data.crcResults.frameworks.nist_ai_rmf.percentage) : null,
            applicable: data.crcResults.frameworks.nist_ai_rmf.applicableControls,
            scored: data.crcResults.frameworks.nist_ai_rmf.scoredControls
        },
        iso42001: {
            percentage: data.crcResults.frameworks.iso_42001.percentage !== null ? Math.round(data.crcResults.frameworks.iso_42001.percentage) : null,
            applicable: data.crcResults.frameworks.iso_42001.applicableControls,
            scored: data.crcResults.frameworks.iso_42001.scoredControls
        }
    };

    const categoryBreakdownData = {
        categories: data.crcResults.categories.map(c => ({
            categoryName: c.categoryName,
            percentage: c.percentage !== null ? Math.round(c.percentage) : null,
            totalControls: c.totalControls,
            answeredControls: c.answeredControls
        }))
    };

    const riskRegisterData = {
        counts: data.crcResults.riskSummary,
        totalOpenRisks: data.risks.length,
        risks: data.risks.map(r => ({
            title: r.title,
            category: r.category,
            rating: r.rating,
            owner: r.owner || "Unassigned",
            description: r.description
        }))
    };

    const componentInventoryData = {
        totalComponents: data.components.length,
        components: data.components.map(c => ({
            componentName: c.component_name,
            componentType: c.component_type,
            provider: c.provider,
            roleInSystem: c.role_in_system,
            riskTier: c.risk_tier,
            status: c.status
        }))
    };

    const vendorAssessmentsData = {
        vendors: data.components
            .filter(c => c.vendor_assessment_status)
            .map(c => ({
                vendorName: c.provider,
                componentName: c.component_name,
                score: c.vendor_score || 0,
                riskTier: c.vendor_risk_tier || "Low",
                status: c.vendor_assessment_status || "Not Started"
            }))
    };

    // Calculate fairness metrics
    const validBiasScores = data.evaluations.map(e => e.bias_score).filter(s => s !== null) as number[];
    const validToxicityScores = data.evaluations.map(e => e.toxicity_score).filter(s => s !== null) as number[];
    const validRelevancyScores = data.evaluations.map(e => e.relevancy_score).filter(s => s !== null) as number[];
    const validFaithfulnessScores = data.evaluations.map(e => e.faithfulness_score).filter(s => s !== null) as number[];
    const validOverallScores = data.evaluations.map(e => e.overall_score).filter(s => s !== null) as number[];

    const getAverage = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;

    const biasAndVulnerabilityData = {
        evaluationsCount: data.evaluations.length,
        datasetReportsCount: data.datasetReportsCount,
        apiReportsCount: data.apiReportsCount,
        averageScores: {
            bias: getAverage(validBiasScores),
            toxicity: getAverage(validToxicityScores),
            relevancy: getAverage(validRelevancyScores),
            faithfulness: getAverage(validFaithfulnessScores),
            overall: getAverage(validOverallScores)
        }
    };

    // Parallel calls to Claude for all 8 narratives
    const narrativeCalls = [
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing the system profile details. Mention regulatory role, risks, and governance scope. Do not exceed 6 sentences.`,
            sectionData: systemProfileData,
            projectName,
            sectionLabel: "System Profile"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summary analyzing the overall readiness level, evidence compliance rate, and current open risks count. Do not exceed 6 sentences.`,
            sectionData: heroMetricsData,
            projectName,
            sectionLabel: "Hero Metrics"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing the framework readiness percentages and metrics across EU AI Act, NIST AI RMF, and ISO 42001. Do not exceed 6 sentences.`,
            sectionData: frameworkReadinessData,
            projectName,
            sectionLabel: "Framework Readiness"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing the category-level readiness. Highlight areas of strength and those that need focus. Do not exceed 6 sentences.`,
            sectionData: categoryBreakdownData,
            projectName,
            sectionLabel: "Category Breakdown"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing the risk register profile, severities, and high-level risk items. Do not exceed 6 sentences.`,
            sectionData: riskRegisterData,
            projectName,
            sectionLabel: "Risk Register"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing the component inventory, model categories, and risk distribution. Do not exceed 6 sentences.`,
            sectionData: componentInventoryData,
            projectName,
            sectionLabel: "Component Inventory"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing third-party vendor risk assessments and their security posture. Do not exceed 6 sentences.`,
            sectionData: vendorAssessmentsData,
            projectName,
            sectionLabel: "Vendor Assessments"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a narrative summarizing bias testing, toxicity findings, and dataset verification reports. Do not exceed 6 sentences.`,
            sectionData: biasAndVulnerabilityData,
            projectName,
            sectionLabel: "Bias & Vulnerability"
        })
    ];

    const results = await Promise.allSettled(narrativeCalls);

    const narratives = results.map((r, index) => {
        if (r.status === "fulfilled") {
            return r.value.narrative;
        }
        console.error(`Narrative call ${index} failed:`, (r as any).reason);
        return "Section data is available below";
    });

    const anyFailed = results.some(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));

    // Map control flags from wizard outputs
    const controlFlags = data.engineOutput?.control_flags || {};

    const formattedControls = data.controls.map(c => {
        const flagObj = controlFlags[c.control_id];
        return {
            controlId: c.control_id,
            controlTitle: c.control_title,
            categoryName: c.category_name || "Uncategorized",
            flag: (flagObj?.flag || "OPTIONAL") as "MANDATORY" | "RECOMMENDED" | "OPTIONAL",
            answer: formatResponseValue(c.response_value),
            evidenceStatus: c.evidence_status || "No Evidence",
            auditReady: !!c.audit_ready,
            notes: c.notes ? (c.notes.length > 100 ? c.notes.substring(0, 97) + "..." : c.notes) : ""
        };
    });

    return {
        success: true,
        anyFailed,
        payload: {
            projectName,
            projectDescription,
            timestamp,
            systemProfile: {
                narrative: narratives[0],
                data: systemProfileData
            },
            heroMetrics: {
                narrative: narratives[1],
                ...heroMetricsData
            },
            frameworkReadiness: {
                narrative: narratives[2],
                ...frameworkReadinessData
            },
            categoryBreakdown: {
                narrative: narratives[3],
                categories: categoryBreakdownData.categories
            },
            controlList: formattedControls,
            riskRegister: {
                narrative: narratives[4],
                risks: data.risks.map(r => ({
                    title: r.title,
                    category: r.category,
                    rating: r.rating,
                    status: r.status,
                    owner: r.owner || "Unassigned",
                    description: r.description || "",
                    mitigationPlan: r.mitigation_plan || ""
                }))
            },
            componentInventory: {
                narrative: narratives[5],
                components: data.components.map(c => ({
                    componentName: c.component_name,
                    componentType: c.component_type,
                    provider: c.provider,
                    roleInSystem: c.role_in_system,
                    dataCategoriesSent: c.data_categories_sent || [],
                    riskTier: c.risk_tier,
                    status: c.status
                }))
            },
            vendorAssessments: {
                narrative: narratives[6],
                vendors: vendorAssessmentsData.vendors
            },
            biasAndVulnerability: {
                narrative: narratives[7],
                ...biasAndVulnerabilityData
            }
        }
    };
}

export async function generateSummaryPdfData(projectId: string) {
    const data = await getRawProjectData(projectId);
    const timestamp = new Date().toISOString();
    const projectName = data.project.name;
    const projectDescription = data.project.description || "";

    // System Profile Summary
    const systemProfileSummary = {
        name: projectName,
        governanceScope: data.profile?.governance_scope || "Not specified",
        regulatoryRole: data.profile?.regulatory_role || "Not specified",
        euRiskTier: data.engineOutput?.eu_risk_tier || "MINIMAL",
        internalRiskTier: data.engineOutput?.internal_risk_tier || "LOW"
    };

    // Hero Metrics Summary
    const heroMetricsSummary = {
        overallPercentage: data.crcResults.overall.percentage !== null ? Math.round(data.crcResults.overall.percentage) : null,
        applicableControls: data.crcResults.overall.applicableControls,
        answeredControls: data.crcResults.overall.answeredControls,
        evidencePercentage: data.crcResults.evidenceProgress?.percentage || 0,
        openRisksCount: data.risks.length
    };

    // Framework Readiness Summary
    const frameworkReadinessSummary = {
        euAiAct: data.crcResults.frameworks.eu_ai_act.percentage !== null ? Math.round(data.crcResults.frameworks.eu_ai_act.percentage) : null,
        nistAiRmf: data.crcResults.frameworks.nist_ai_rmf.percentage !== null ? Math.round(data.crcResults.frameworks.nist_ai_rmf.percentage) : null,
        iso42001: data.crcResults.frameworks.iso_42001.percentage !== null ? Math.round(data.crcResults.frameworks.iso_42001.percentage) : null
    };

    // Strengths and Gaps sorting
    const { strengths: topStrengths, gaps: topGaps } = getStrengthsAndGaps(data.crcResults.categories);

    // Risk Register Summary
    const riskRegisterSummary = {
        counts: {
            critical: data.crcResults.riskSummary.critical,
            high: data.crcResults.riskSummary.high,
            medium: data.crcResults.riskSummary.medium,
            low: data.crcResults.riskSummary.low,
            total: data.risks.length
        },
        risks: data.risks.slice(0, 3).map(r => ({ title: r.title, rating: r.rating }))
    };

    // Component Inventory Summary
    const criticalComponents = data.components.filter(c => c.risk_tier === "Critical").length;
    const highComponents = data.components.filter(c => c.risk_tier === "High").length;
    const componentSummary = {
        totalComponents: data.components.length,
        criticalRiskComponents: criticalComponents,
        highRiskComponents: highComponents
    };

    // Parallel calls to Claude for Summary PDF (7 narratives)
    const narrativeCalls = [
        // System profile - STRICT 2 sentences
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a concise, EXACTLY 2-sentence summary of the system profile. Sentence 1: describe system name, role, and use. Sentence 2: state its EU and internal risk tiers. Do NOT write more than 2 sentences.`,
            sectionData: systemProfileSummary,
            projectName,
            sectionLabel: "System Profile Summary"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate an executive narrative summary of overall readiness, evidence completion, and open risks. Limit to 3 sentences.`,
            sectionData: heroMetricsSummary,
            projectName,
            sectionLabel: "Hero Metrics Summary"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a concise narrative summary of framework alignment percentages. Limit to 3 sentences.`,
            sectionData: frameworkReadinessSummary,
            projectName,
            sectionLabel: "Framework Readiness Summary"
        }),
        // Top strengths explanation
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Explain the top 3 strengths (highest-scoring governance categories) in a single executive paragraph. Do not exceed 3 sentences.`,
            sectionData: topStrengths,
            projectName,
            sectionLabel: "Strengths Narrative"
        }),
        // Priority gaps explanation
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Explain the top 3 priority compliance gaps (lowest-scoring governance categories) in a single executive paragraph. Do not exceed 3 sentences.`,
            sectionData: topGaps,
            projectName,
            sectionLabel: "Gaps Narrative"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a brief executive narrative on the system risk register posture. Limit to 3 sentences.`,
            sectionData: riskRegisterSummary,
            projectName,
            sectionLabel: "Risk Snapshot Narrative"
        }),
        generateAndValidateNarrative({
            systemPrompt: NARRATIVE_SYSTEM_PROMPT,
            userPrompt: `Generate a brief executive narrative on the system component inventory and vendor risk posture. Limit to 3 sentences.`,
            sectionData: componentSummary,
            projectName,
            sectionLabel: "Component Snapshot Narrative"
        })
    ];

    const results = await Promise.allSettled(narrativeCalls);

    const narratives = results.map((r, index) => {
        if (r.status === "fulfilled") {
            return r.value.narrative;
        }
        console.error(`Summary narrative call ${index} failed:`, (r as any).reason);
        return "Section data is available below";
    });

    const anyFailed = results.some(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));

    // Ensure the system profile narrative is strictly limited to 2 sentences
    const systemProfileNarrative = limitSentences(narratives[0], 2);

    return {
        success: true,
        anyFailed,
        payload: {
            projectName,
            projectDescription,
            timestamp,
            systemProfile: {
                narrative: systemProfileNarrative,
                euRiskTier: systemProfileSummary.euRiskTier,
                internalRiskTier: systemProfileSummary.internalRiskTier,
                governanceScope: systemProfileSummary.governanceScope,
                regulatoryRole: systemProfileSummary.regulatoryRole
            },
            heroMetrics: {
                narrative: narratives[1],
                ...heroMetricsSummary
            },
            frameworkReadiness: {
                narrative: narratives[2],
                ...frameworkReadinessSummary
            },
            strengthsAndGaps: {
                strengths: topStrengths.map((s, idx) => ({ ...s, narrative: narratives[3] })),
                gaps: topGaps.map((g, idx) => ({ ...g, narrative: narratives[4] }))
            },
            riskRegisterSnapshot: {
                narrative: narratives[5],
                counts: riskRegisterSummary.counts
            },
            componentSnapshot: {
                narrative: narratives[6],
                ...componentSummary
            }
        }
    };
}
