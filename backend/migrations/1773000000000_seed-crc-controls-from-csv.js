/* eslint-disable camelcase */
exports.shorthands = undefined;
// Static data generated from CSV to avoid file parsing in production
const CONTROLS_DATA = [
  {
    "control_id": "GOV-3P-01",
    "control_title": "Third-Party AI Risk Management",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess, document, and manage AI-related risks arising from third-party entities including vendors, partners, and open-source components, with specific attention to intellectual property, data rights, and responsible AI alignment.",
    "control_objective": "Extend AI risk management to the supply chain by ensuring third parties meet organizational standards for responsible AI.",
    "risk_description": "Third-party AI failures become organizational incidents. IP infringement creates legal liability. Vendor biases transfer to systems.",
    "implementation": {
      "requirements": [
        "Third-Party Risk Assessment Template defining evaluation criteria, risk scoring methodology, and approval workflow",
        "Vendor AI Due Diligence Checklist covering vendor capabilities, data practices, compliance posture, and risk factors",
        "IP and Licensing Review with documented scope, methodology, and acceptance criteria",
        "Vendor Risk Register capturing risk descriptions, likelihood/impact scores, owners, and mitigation status"
      ],
      "steps": [
        "Develop Third-Party Risk Assessment Template incorporating stakeholder input and industry best practices",
        "Create Vendor AI Due Diligence Checklist with documented requirements and quality criteria",
        "Establish IP and Licensing Review process with documented approval and stakeholder sign-off",
        "Integrate AI provisions into contracts ensuring consistency with existing governance processes",
        "Maintain Vendor Risk Register with periodic reviews and version-controlled updates"
      ],
      "timeline": "Templates within 60 days; apply to new vendors immediately."
    },
    "evidence_requirements": [
      "Third-Party Risk Assessment Template",
      "Vendor AI Due Diligence Checklist",
      "IP and Licensing Review",
      "Supplier Contract AI Provisions",
      "Vendor Risk Register"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports supply chain due diligence"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.6.1",
          "context": "Address AI risks from third-party entities"
        },
        {
          "ref": "MAP.4.1",
          "context": "Map legal risks of third-party components"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.10.3",
          "context": "Establish process for supplier alignment"
        },
        {
          "ref": "Clause A.10.2",
          "context": "Allocate responsibilities with third parties"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Third-Party Risk",
      "maturity_enhancement": "Extends governance to supply chain for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-3P-02",
    "control_title": "Third-Party Contingency and Incident Response",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish contingency procedures for responding to third-party AI failures, including incident response coordination, failover mechanisms, and alternative provider activation to maintain business continuity.",
    "control_objective": "Ensure organizational resilience against third-party AI disruptions through prepared response procedures and backup capabilities.",
    "risk_description": "Third-party outages cascade into service disruptions. Lack of failover extends downtime. Unprepared response leads to chaos.",
    "implementation": {
      "requirements": [
        "Third-Party Incident Response Plan with milestones, responsible parties, resource needs, and success criteria",
        "Backup/Failover Procedures detailing workflows, decision points, roles, and documentation requirements",
        "Vendor Escalation Path Document with version control, approval signatures, and distribution records",
        "Alternative Provider Assessment with defined methodology, criteria, and documented findings"
      ],
      "steps": [
        "Identify critical third-party AI dependencies through structured analysis and stakeholder consultation",
        "Develop Third-Party Incident Response Plan incorporating stakeholder input and industry best practices",
        "Establish Backup/Failover Procedures with documented approval and stakeholder sign-off",
        "Document Vendor Escalation Paths with version control and stakeholder review",
        "Conduct Alternative Provider Assessment using standardized methodology and document findings"
      ],
      "timeline": "Plans within 90 days; testing within 180 days."
    },
    "evidence_requirements": [
      "Third-Party Incident Response Plan",
      "Backup/Failover Procedures",
      "Vendor Escalation Path Document",
      "Alternative Provider Assessment",
      "Contingency Test Results"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports operational resilience"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.6.2",
          "context": "Establish contingency processes for third-party failures"
        },
        {
          "ref": "MANAGE.2.3",
          "context": "Respond to previously unknown risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.10.3",
          "context": "Require supplier corrective actions"
        },
        {
          "ref": "Clause 10.2",
          "context": "React to nonconformity and correct"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Business Continuity",
      "maturity_enhancement": "Ensures operational resilience for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-3P-03",
    "control_title": "Supplier AI Component Quality Assurance",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement quality assurance processes for AI components sourced from third parties, including incoming inspection, performance validation, and ongoing monitoring with corrective action mechanisms.",
    "control_objective": "Ensure third-party AI components meet organizational quality standards before integration and throughout operational use.",
    "risk_description": "Defective third-party components introduce errors. Lack of inspection allows substandard components into production.",
    "implementation": {
      "requirements": [
        "Supplier Quality Requirements with documented scope, methodology, and acceptance criteria",
        "Supplier Assessment Checklist covering all required evaluation criteria and evidence checkpoints",
        "Supplier Audit capability with documented scope, methodology, and acceptance criteria",
        "Supplier Corrective Action Request process defining inputs, decision points, quality gates, and output criteria"
      ],
      "steps": [
        "Define Supplier Quality Requirements with measurable criteria and documented rationale",
        "Create Supplier Assessment Checklist with documented requirements and quality criteria",
        "Establish Supplier Audit program with documented approval and stakeholder sign-off",
        "Implement SCAR process with pilot validation and phased organizational rollout",
        "Develop Supplier Performance Scorecard incorporating stakeholder input and industry best practices"
      ],
      "timeline": "Requirements within 60 days; apply to new procurements immediately."
    },
    "evidence_requirements": [
      "Supplier Quality Requirements",
      "Supplier Assessment Checklist",
      "Supplier Audit Results",
      "Supplier Corrective Action Requests",
      "Supplier Performance Scorecard"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports quality management system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.6.1",
          "context": "Address AI risks from third-party entities"
        },
        {
          "ref": "MANAGE.3.1",
          "context": "Monitor third-party AI risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.10.3",
          "context": "Ensure supplier alignment"
        },
        {
          "ref": "require corrective actions",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Supplier Quality",
      "maturity_enhancement": "Extends quality management to supply chain for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-ACC-01",
    "control_title": "AI Governance Committee and Structure",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish a cross-functional AI Governance Committee with defined charter, membership, authority, and operating procedures to provide strategic oversight, risk decisions, and policy direction for all AI activities.",
    "control_objective": "Create an authoritative governance body with clear mandate and executive sponsorship to ensure consistent, accountable AI decision-making.",
    "risk_description": "Absence of formal governance leads to fragmented decisions, inconsistent risk acceptance, and unclear accountability.",
    "implementation": {
      "requirements": [
        "AI Governance Committee Charter defining membership, authority, decision rights, and operating procedures",
        "Executive Sponsor designation with documented authority, budget ownership, and reporting accountability",
        "Regular meeting cadence with defined frequency, quorum rules, agenda templates, and minute-keeping process",
        "Escalation Procedures defining trigger conditions, escalation tiers, response timelines, and authority levels"
      ],
      "steps": [
        "Draft Charter using corporate governance template applicable framework templates and expert review",
        "Secure executive sponsor with documented selection criteria and formal appointment",
        "Recruit cross-functional membership ensuring cross-functional representation and documented selection",
        "Establish meeting infrastructure with documented approval and stakeholder sign-off",
        "Develop Escalation Procedures incorporating stakeholder input and industry best practices"
      ],
      "timeline": "Establish prior to significant AI deployments; operational within 90 days."
    },
    "evidence_requirements": [
      "AI Governance Committee Charter",
      "Executive Sponsor Designation Letter",
      "Committee Membership Roster",
      "Meeting Minutes",
      "Escalation Procedures Document"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(m)",
          "context": "QMS shall include accountability framework"
        },
        {
          "ref": "Article 26(1)",
          "context": "Deployers shall designate responsible person"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.1",
          "context": "Document roles and lines of communication"
        },
        {
          "ref": "GOVERN.2.3",
          "context": "Executive takes responsibility for AI risk"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 5.1",
          "context": "Top management demonstrate leadership"
        },
        {
          "ref": "Clause 5.3",
          "context": "Assign responsibilities and authorities"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Organizational Structure",
      "maturity_enhancement": "Core requirement for Level 2 (Managed) maturity"
    }
  },
  {
    "control_id": "GOV-ACC-02",
    "control_title": "AI System Ownership, Accountability, and RACI Assignment",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assign and document named owners for each AI system with explicit accountability for system performance, risk management, and compliance throughout the AI lifecycle, supported by comprehensive RACI matrices.",
    "control_objective": "Ensure every AI system has unambiguous human accountability with clearly defined responsibilities across all lifecycle phases.",
    "risk_description": "Unclear ownership creates accountability gaps. Regulatory enforcement finds no designated individual, increasing liability.",
    "implementation": {
      "requirements": [
        "Named AI System Owner for each system with documented scope, methodology, and acceptance criteria",
        "AI Lifecycle RACI Matrix mapping roles, responsibilities, and accountability assignments",
        "Human-AI Collaboration Guide specifying standards, decision criteria, and worked examples",
        "Decision Authority Matrix mapping roles, responsibilities, and accountability assignments"
      ],
      "steps": [
        "Define AI System Owner role with measurable criteria and documented rationale",
        "Assign named owners with documented responsibilities and escalation contacts",
        "Develop RACI Matrix template incorporating stakeholder input and industry best practices",
        "Create Accountability Agreements with documented requirements and quality criteria",
        "Establish Human-AI Collaboration Guide with documented approval and stakeholder sign-off"
      ],
      "timeline": "Ownership at project initiation; RACI before development; reviewed at each gate."
    },
    "evidence_requirements": [
      "Project Charter with Named Owner",
      "AI Lifecycle RACI Matrix",
      "Signed Accountability Agreements",
      "Human-AI Collaboration Guide",
      "Decision Authority Matrix"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(1)",
          "context": "High-risk AI designed for human oversight"
        },
        {
          "ref": "Article 17(1)(m)",
          "context": "Accountability framework required"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.1",
          "context": "Document roles and responsibilities"
        },
        {
          "ref": "GOVERN.3.2",
          "context": "Define human-AI configurations"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 5.3",
          "context": "Assign responsibility and authority"
        },
        {
          "ref": "Clause A.3.2",
          "context": "Define and allocate AI roles"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Accountability Framework",
      "maturity_enhancement": "Essential for Level 2 maturity; enables audit trail"
    }
  },
  {
    "control_id": "GOV-ACC-03",
    "control_title": "Executive Leadership AI Oversight",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure executive leadership actively oversees AI risk decisions, provides documented approval for high-risk AI deployments, and receives regular briefings on AI portfolio status and compliance posture.",
    "control_objective": "Establish executive-level visibility and accountability for AI risks, ensuring strategic decisions proceed with appropriate leadership engagement.",
    "risk_description": "Executive detachment creates governance gaps. Leadership claims plausible deniability when incidents occur, damaging credibility.",
    "implementation": {
      "requirements": [
        "Executive AI Risk Briefing quarterly with documented scope, methodology, and acceptance criteria",
        "Documented executive sign-off for high-risk AI with version control, approval signatures, and distribution records",
        "Leadership Accountability Statement with documented scope, methodology, and acceptance criteria",
        "Board-level AI reporting documenting methodology, findings, conclusions, and recommended actions"
      ],
      "steps": [
        "Develop Executive AI Risk Briefing template incorporating stakeholder input and industry best practices",
        "Establish deployment approval workflow with documented approval and stakeholder sign-off",
        "Draft Leadership Accountability Statement using applicable framework templates and expert review",
        "Configure board reporting package with validation testing and documented configuration baseline",
        "Implement executive dashboard with pilot validation and phased organizational rollout"
      ],
      "timeline": "Quarterly briefings within first quarter; approval workflows before high-risk deployments."
    },
    "evidence_requirements": [
      "Executive AI Risk Briefing Deck",
      "Board AI Oversight Minutes",
      "Executive Sign-off Records",
      "Leadership Accountability Statement",
      "Executive Dashboard Screenshots"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(a)",
          "context": "Providers ensure high-risk AI compliant"
        },
        {
          "ref": "Article 16(f)",
          "context": "Undergo conformity assessment"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.3",
          "context": "Executive takes responsibility for AI risk"
        },
        {
          "ref": "MANAGE.1.1",
          "context": "Determine whether deployment should proceed"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 5.1",
          "context": "Top management demonstrate leadership"
        },
        {
          "ref": "Clause 9.3.1",
          "context": "Review AIMS at planned intervals"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Executive Engagement",
      "maturity_enhancement": "Critical for Level 3 (Defined) maturity"
    }
  },
  {
    "control_id": "GOV-COMM-01",
    "control_title": "Communication Planning",
    "category": "AI Governance & Strategy",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish a comprehensive communication plan defining internal and external communication requirements for AI activities, including stakeholder identification, communication channels, frequency, content, and escalation protocols.",
    "control_objective": "Ensure effective and timely communication with all relevant parties regarding AI system status, risks, incidents, and decisions.",
    "risk_description": "Poor internal communication leads to misaligned AI efforts. Inadequate external communication damages stakeholder relationships.",
    "implementation": {
      "requirements": [
        "Communication Plan with milestones, responsible parties, resource needs, and success criteria",
        "Stakeholder Communication Matrix mapping roles, responsibilities, and accountability assignments",
        "Internal Communication Protocol with documented scope, methodology, and acceptance criteria",
        "External Communication Guidelines specifying standards, decision criteria, and worked examples"
      ],
      "steps": [
        "Identify all stakeholders requiring AI-related communication",
        "Develop Communication Plan specifying what, when, with whom, how",
        "Create Stakeholder Communication Matrix with documented requirements and quality criteria",
        "Establish Internal Communication Protocol with documented approval and stakeholder sign-off",
        "Draft External Communication Guidelines using applicable framework templates and expert review"
      ],
      "timeline": "Plan within 45 days; reviewed quarterly."
    },
    "evidence_requirements": [
      "Communication Plan",
      "Stakeholder Communication Matrix",
      "Internal Communication Protocol",
      "External Communication Guidelines",
      "Communication Effectiveness Review"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(j)",
          "context": "Handling of communication with authorities and other parties"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.1",
          "context": "Document lines of communication"
        },
        {
          "ref": "GOVERN.4.2",
          "context": "Communicate AI impacts broadly"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 7.4",
          "context": "Determine need for internal and external communications"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Communication Management",
      "maturity_enhancement": "Structured communication supports Level 2 maturity"
    }
  },
  {
    "control_id": "GOV-COMP-01",
    "control_title": "AI Training and Competency Program",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive AI training and competency program that ensures all personnel involved in AI development, deployment, and oversight possess the required knowledge and skills for their roles.",
    "control_objective": "Build organizational AI capability by ensuring personnel are competent to fulfill their AI-related responsibilities safely and effectively.",
    "risk_description": "Untrained personnel make errors that introduce risks. Lack of AI literacy leads to inappropriate adoption decisions.",
    "implementation": {
      "requirements": [
        "AI Training Curriculum with role-based content, competency benchmarks, and completion tracking",
        "Role-Based Training Matrix mapping roles, responsibilities, and accountability assignments",
        "Competency Assessment mechanisms with proficiency rubrics, passing thresholds, and remediation pathways",
        "Training Effectiveness metrics tracking completion rates, knowledge retention, and behavioral application"
      ],
      "steps": [
        "Conduct training needs analysis using standardized methodology and document findings",
        "Develop AI Training Curriculum incorporating stakeholder input and industry best practices",
        "Create Role-Based Training Matrix with documented requirements and quality criteria",
        "Implement competency assessments with pilot validation and phased organizational rollout",
        "Deploy training via LMS with phased rollout, validation testing, and rollback plan"
      ],
      "timeline": "Curriculum within 60 days; training before AI project assignment."
    },
    "evidence_requirements": [
      "AI Training Curriculum",
      "Role-Based Training Matrix",
      "Training Completion Records",
      "Competency Assessment Results",
      "Training Effectiveness Survey"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports Article 14 human oversight competence"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.2",
          "context": "Provide AI risk management training"
        },
        {
          "ref": "MAP.3.4",
          "context": "Define processes for operator proficiency"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 7.2",
          "context": "Determine necessary competence"
        },
        {
          "ref": "Clause 7.3",
          "context": "Ensure persons aware of AI policy"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Human Capital",
      "maturity_enhancement": "Enables skilled workforce essential for Level 2 maturity"
    }
  },
  {
    "control_id": "GOV-CULT-01",
    "control_title": "Safety Culture and Critical Thinking",
    "category": "AI Governance & Strategy",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL foster a safety-first culture that encourages critical thinking about AI risks, enables personnel to raise concerns without fear of retaliation, and requires teams to document and broadly communicate AI-related risks and impacts.",
    "control_objective": "Create an organizational environment where AI risks are surfaced early, discussed openly, and addressed proactively through psychological safety and accountability.",
    "risk_description": "Suppressed concerns allow risks to escalate. Fear of retaliation prevents early warning. Lack of lessons learned leads to repeated mistakes.",
    "implementation": {
      "requirements": [
        "Safety Culture Assessment with defined methodology, criteria, and documented findings",
        "Risk Escalation Procedure defining trigger conditions, escalation tiers, response timelines, and authority levels",
        "Speak-Up Policy establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Lessons Learned Repository with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Conduct Safety Culture Assessment using standardized methodology and document findings",
        "Establish Risk Escalation Procedure with documented approval and stakeholder sign-off",
        "Publish Speak-Up Policy through approved distribution channels with version control",
        "Create Lessons Learned Repository with documented requirements and quality criteria",
        "Integrate safety metrics into leadership evaluations"
      ],
      "timeline": "Assessment within 60 days; policies within 90 days."
    },
    "evidence_requirements": [
      "Safety Culture Assessment",
      "Risk Escalation Procedure",
      "Speak-Up Policy",
      "Lessons Learned Repository",
      "Psychological Safety Survey Results"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports quality and risk management obligations"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.1",
          "context": "Foster critical thinking and safety-first mindset"
        },
        {
          "ref": "GOVERN.4.2",
          "context": "Require teams to document and communicate risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.3.3",
          "context": "Define process to report concerns"
        },
        {
          "ref": "Clause 7.3",
          "context": "Aware of implications of not conforming"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Organizational Culture",
      "maturity_enhancement": "Cultural foundation for Level 3 (Defined) maturity"
    }
  },
  {
    "control_id": "GOV-CUST-01",
    "control_title": "Customer Requirements Management",
    "category": "AI Governance & Strategy",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish processes to systematically elicit, document, analyze, and integrate customer requirements and expectations into AI system design and deployment, ensuring customer needs drive AI capability development.",
    "control_objective": "Ensure AI systems are designed and operated in alignment with customer expectations, needs, and use case requirements.",
    "risk_description": "AI systems that fail to meet customer expectations result in rejection. Undocumented requirements lead to scope disputes.",
    "implementation": {
      "requirements": [
        "Customer Requirements Document with version control, approval signatures, and distribution records",
        "Customer Expectation Analysis with defined methodology, criteria, and documented findings",
        "Customer Feedback Integration Log recording events with timestamps, responsible parties, and resolution status",
        "Customer-Specific Risk Communication with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Develop customer requirements elicitation methodology",
        "Create Customer Requirements Document template with documented requirements and quality criteria",
        "Conduct Customer Expectation Analysis sessions using standardized methodology and document findings",
        "Establish Customer Feedback Integration process with documented approval and stakeholder sign-off",
        "Develop Customer Limitation Disclosure templates incorporating stakeholder input and industry best practices"
      ],
      "timeline": "Requirements gathered during project initiation; feedback integration ongoing."
    },
    "evidence_requirements": [
      "Customer Requirements Document",
      "Customer Expectation Analysis",
      "Customer Feedback Integration Log",
      "Customer-Specific Risk Communication",
      "Customer Limitation Disclosure"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports transparency and user-centered design"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.1.6",
          "context": "Elicit system requirements from relevant AI actors"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.10.4",
          "context": "Ensure responsible AI approach considers customer expectations"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Customer Relations",
      "maturity_enhancement": "Customer-centric development supports Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-DECOM-01",
    "control_title": "AI Decommissioning and Phase-Out Procedures",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and execute documented procedures for safely decommissioning AI systems, including data retention/deletion requirements, stakeholder communication, transition planning, and verification of complete system shutdown.",
    "control_objective": "Ensure AI systems are retired in a controlled, compliant manner that protects data, maintains business continuity, and eliminates residual risks from orphaned systems.",
    "risk_description": "Orphaned AI systems continue operating without oversight. Improper data deletion exposes to privacy breaches. Abrupt shutdowns disrupt business.",
    "implementation": {
      "requirements": [
        "Decommissioning Checklist covering all required evaluation criteria and evidence checkpoints",
        "Data Retention/Deletion Plan with milestones, responsible parties, resource needs, and success criteria",
        "Transition Plan to Alternative Systems with milestones, responsible parties, resource needs, and success criteria",
        "Stakeholder Communication Plan with milestones, responsible parties, resource needs, and success criteria"
      ],
      "steps": [
        "Develop comprehensive Decommissioning Checklist incorporating stakeholder input and industry best practices",
        "Create Data Retention/Deletion Plan with documented requirements and quality criteria",
        "Establish transition procedures with documented approval and stakeholder sign-off",
        "Execute stakeholder communication",
        "Verify complete shutdown"
      ],
      "timeline": "Initiate 90 days before planned shutdown."
    },
    "evidence_requirements": [
      "Decommissioning Checklist",
      "Data Retention/Deletion Plan",
      "Transition Plan",
      "Stakeholder Communication Plan",
      "System Shutdown Verification Record"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Aligns with general quality management obligations"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.7",
          "context": "Establish processes for decommissioning"
        },
        {
          "ref": "MANAGE.2.4",
          "context": "Establish mechanisms to deactivate AI"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.5",
          "context": "Document deployment plan including decommissioning"
        },
        {
          "ref": "Clause 8.1",
          "context": "Control planned changes"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Lifecycle Management Domain",
      "area": "Retirement",
      "maturity_enhancement": "Completes full lifecycle governance; essential for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-DIV-01",
    "control_title": "Diverse and Inclusive AI Teams",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure AI development and governance teams include diverse representation spanning demographics, disciplines, expertise domains, and perspectives, including meaningful engagement with communities affected by AI systems.",
    "control_objective": "Reduce blind spots in AI development by incorporating diverse viewpoints that identify risks, biases, and impacts that homogeneous teams might overlook.",
    "risk_description": "Homogeneous teams produce AI with blind spots harming underrepresented groups. Missing community input results in deployment resistance.",
    "implementation": {
      "requirements": [
        "Team Diversity Report documenting methodology, findings, conclusions, and recommended actions",
        "Multidisciplinary Expertise Matrix mapping roles, responsibilities, and accountability assignments",
        "Inclusive Recruitment Policy establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Affected Group Consultation Log recording events with timestamps, responsible parties, and resolution status"
      ],
      "steps": [
        "Baseline current AI team composition",
        "Identify representation gaps through structured analysis and stakeholder consultation",
        "Establish Inclusive Recruitment Policy with documented approval and stakeholder sign-off",
        "Create Multidisciplinary Expertise Matrix with documented requirements and quality criteria",
        "Implement Affected Group Consultation with pilot validation and phased organizational rollout"
      ],
      "timeline": "Baseline within 30 days; policies within 60 days."
    },
    "evidence_requirements": [
      "Team Diversity Report",
      "Multidisciplinary Expertise Matrix",
      "Inclusive Recruitment Policy",
      "Community Engagement Records",
      "Affected Group Consultation Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports fairness and non-discrimination"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.3.1",
          "context": "AI risk management informed by diverse teams"
        },
        {
          "ref": "MAP.1.2",
          "context": "Assemble interdisciplinary AI actors"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.4.6",
          "context": "Document human resources and competences"
        },
        {
          "ref": "Clause A.5.4",
          "context": "Consult experts and affected groups"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Team Composition",
      "maturity_enhancement": "Enables comprehensive risk identification for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-DOC-01",
    "control_title": "Documented Information Control",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a documented information control system for all AI-related documentation, including version control, approval workflows, access controls, and retention policies ensuring documentation integrity and availability.",
    "control_objective": "Ensure AI documentation is accurate, current, controlled, and accessible to authorized personnel while maintaining audit trails for regulatory compliance.",
    "risk_description": "Uncontrolled documentation leads to using outdated procedures. Missing audit trails prevent demonstrating compliance.",
    "implementation": {
      "requirements": [
        "Document Control Procedure detailing workflows, decision points, roles, and documentation requirements",
        "Document Naming Convention with version control, approval signatures, and distribution records",
        "Version Control System with documented scope, methodology, and acceptance criteria",
        "Document Approval Workflow with version control, approval signatures, and distribution records",
        "Document Access Control Matrix mapping roles, responsibilities, and accountability assignments"
      ],
      "steps": [
        "Establish Document Control Procedure aligned with ISO 42001",
        "Implement Document Naming Convention with pilot validation and phased organizational rollout",
        "Deploy Version Control System with phased rollout, validation testing, and rollback plan",
        "Configure Document Approval Workflow with validation testing and documented configuration baseline",
        "Create Document Access Control Matrix with documented requirements and quality criteria"
      ],
      "timeline": "Procedure within 60 days; system operational within 90 days."
    },
    "evidence_requirements": [
      "Document Control Procedure",
      "Document Naming Convention",
      "Version Control System",
      "Document Approval Workflow",
      "Document Access Control Matrix"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 11(1)",
          "context": "Technical documentation shall be drawn up and kept up-to-date"
        },
        {
          "ref": "Article 17(1)(k)",
          "context": "Systems and procedures for record-keeping"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.2",
          "context": "Require teams to document risks"
        },
        {
          "ref": "MAP.2.1",
          "context": "Document system tasks and methods"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 7.5.1",
          "context": "AIMS shall include documented information"
        },
        {
          "ref": "Clause 7.5.2",
          "context": "Creating and updating documented information"
        },
        {
          "ref": "Clause 7.5.3",
          "context": "Control of documented information"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Information Management",
      "maturity_enhancement": "Document control foundational for Level 2 maturity; enables repeatability and audit readiness"
    }
  },
  {
    "control_id": "GOV-INV-01",
    "control_title": "AI System Inventory and Registry",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive inventory of all AI systems developed, procured, or deployed, including complete metadata enabling risk assessment, compliance tracking, and lifecycle management.",
    "control_objective": "Achieve complete visibility into the organization's AI portfolio, enabling effective governance and regulatory compliance across all AI assets.",
    "risk_description": "Unknown AI systems operate outside governance. Regulatory audits reveal unregistered high-risk systems requiring remediation.",
    "implementation": {
      "requirements": [
        "AI System Registry with documented scope, methodology, and acceptance criteria",
        "System Classification Matrix mapping roles, responsibilities, and accountability assignments",
        "AI Asset Metadata Repository with documented scope, methodology, and acceptance criteria",
        "Lifecycle Stage Tracker with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Define AI system scope criteria with measurable criteria and documented rationale",
        "Design registry schema following established patterns and documented requirements",
        "Conduct initial inventory discovery using standardized methodology and document findings",
        "Populate registry with comprehensive descriptions and supporting evidence",
        "Establish maintenance procedures with documented approval and stakeholder sign-off"
      ],
      "timeline": "Initial inventory within 90 days; continuous maintenance."
    },
    "evidence_requirements": [
      "AI System Registry extract",
      "System Classification Matrix",
      "Registry Maintenance Procedure",
      "Inventory Validation Report",
      "Shadow AI Discovery Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 49(1)",
          "context": "Comply with registration obligations"
        },
        {
          "ref": "Article 16(i)",
          "context": "Register high-risk AI in EU database"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.6",
          "context": "Establish mechanisms to inventory AI systems"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.3",
          "context": "Determine scope of AIMS"
        },
        {
          "ref": "Clause A.4.2",
          "context": "Identify resources relevant to AI"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Asset Management",
      "maturity_enhancement": "Prerequisite for Level 1 to Level 2 transition"
    }
  },
  {
    "control_id": "GOV-INV-02",
    "control_title": "AI System Classification by Risk Level",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL classify all registered AI systems according to a documented risk classification framework that aligns with regulatory requirements and organizational risk tolerance, applying appropriate controls commensurate with assigned risk levels.",
    "control_objective": "Enable risk-proportionate governance by categorizing AI systems into defined risk tiers that trigger appropriate levels of oversight.",
    "risk_description": "Without classification, high-risk AI may deploy without safeguards. Under-classification exposes to enforcement; over-classification wastes resources.",
    "implementation": {
      "requirements": [
        "Risk Classification Procedure detailing workflows, decision points, roles, and documentation requirements",
        "System Risk Tier Assignments with documented scope, methodology, and acceptance criteria",
        "High-Risk Determination Checklist covering all required evaluation criteria and evidence checkpoints",
        "Classification Review Records capturing dates, decisions, responsible parties, and supporting evidence"
      ],
      "steps": [
        "Develop Risk Classification Procedure incorporating stakeholder input and industry best practices",
        "Create High-Risk Determination Checklist with documented requirements and quality criteria",
        "Establish classification workflow with documented approval and stakeholder sign-off",
        "Document classification rationale with version control and stakeholder review",
        "Configure control requirements by tier with validation testing and documented configuration baseline"
      ],
      "timeline": "Classification during registration; reviewed annually."
    },
    "evidence_requirements": [
      "Risk Classification Procedure",
      "System Risk Tier Assignments",
      "High-Risk Determination Checklist",
      "Classification Review Records",
      "Control Requirements Matrix"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex III",
          "context": "Defines high-risk AI categories"
        },
        {
          "ref": "Article 6",
          "context": "Classification rules for high-risk AI"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.3",
          "context": "Define risk categorization schema"
        },
        {
          "ref": "MAP.5.1",
          "context": "Identify likelihood and magnitude of impacts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.2",
          "context": "AI risk assessment including identification, analysis, evaluation"
        },
        {
          "ref": "Clause A.5.2",
          "context": "Process to assess potential consequences"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Classification",
      "maturity_enhancement": "Enables risk-proportionate governance for Level 2 maturity"
    }
  },
  {
    "control_id": "GOV-POL-01",
    "control_title": "AI Policy Establishment and Documentation",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish, document, and formally approve a comprehensive AI Policy that articulates trustworthy AI principles, risk management commitments, and ethical guidelines applicable to all AI system development, procurement, and deployment activities.",
    "control_objective": "Ensure organizational commitment to responsible AI is codified in an authoritative policy document that provides clear direction for all AI-related activities.",
    "risk_description": "Without formal AI Policy, organization lacks authoritative guidance, creating regulatory exposure under EU AI Act Article 17 and potential reputational damage.",
    "implementation": {
      "requirements": [
        "AI Policy Document signed by C-suite executive",
        "AI Ethics Charter articulating core ethical values, prohibited uses, fairness commitments, and decision-making principles",
        "Policy distribution mechanism ensuring all stakeholders receive current versions with read-receipt confirmation",
        "Annual review cycle with defined trigger events, review scope, approval gates, and update procedures"
      ],
      "steps": [
        "Conduct stakeholder interviews using standardized methodology and document findings",
        "Draft AI Policy using ISO/IEC 42001 framework applicable framework templates and expert review",
        "Establish governance workflow with documented approval and stakeholder sign-off",
        "Deploy via LMS with phased rollout, validation testing, and rollback plan",
        "Configure annual review with validation testing and documented configuration baseline"
      ],
      "timeline": "Prior to AI development; reviewed annually."
    },
    "evidence_requirements": [
      "AI Policy Document with executive signature",
      "AI Ethics Charter with board resolution",
      "Policy Distribution Log",
      "Annual Policy Review Minutes",
      "Policy Change Request Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)",
          "context": "Requires documented quality management system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.2",
          "context": "Integrate trustworthy AI into policies"
        },
        {
          "ref": "GOVERN.1.4",
          "context": "Establish transparent risk management policies"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 5.2",
          "context": "Top management shall establish AI policy"
        },
        {
          "ref": "Clause A.2.2",
          "context": "Document policy for AI systems"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Policy Framework",
      "maturity_enhancement": "Establishes foundational governance for Level 2 (Managed) maturity"
    }
  },
  {
    "control_id": "GOV-POL-02",
    "control_title": "AI Policy Alignment with Organizational Strategy",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL align its AI Policy and AI objectives with the overall organizational mission, strategic plan, and business objectives, ensuring AI investments directly support documented corporate priorities.",
    "control_objective": "Guarantee that AI initiatives are strategically coherent with organizational direction and resource allocation decisions are traceable to business value drivers.",
    "risk_description": "Misaligned AI investments result in wasted resources. Strategic drift creates AI initiatives outside organizational risk appetite.",
    "implementation": {
      "requirements": [
        "Strategic AI Alignment Document with version control, approval signatures, and distribution records",
        "Board-approved AI Strategy defining objectives, approach, resource allocation, and success metrics",
        "AI Objectives Matrix mapping roles, responsibilities, and accountability assignments",
        "Cross-functional review with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Extract strategic objectives",
        "Conduct AI strategy workshop using standardized methodology and document findings",
        "Develop AI Objectives Matrix using OKR incorporating stakeholder input and industry best practices",
        "Perform policy compatibility analysis applying defined criteria and documenting results",
        "Present to board with supporting evidence and actionable recommendations"
      ],
      "timeline": "During annual strategic planning cycle."
    },
    "evidence_requirements": [
      "Strategic AI Alignment Document",
      "Board Resolution approving AI Strategy",
      "AI Objectives Matrix with OKR linkages",
      "Mission-AI Alignment Assessment",
      "Policy Compatibility Review Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(a)",
          "context": "QMS shall include strategy for regulatory compliance"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.2",
          "context": "Embed trustworthy AI into standards"
        },
        {
          "ref": "MAP.1.3",
          "context": "Document organization mission and AI goals"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 5.1",
          "context": "Ensure AI policy compatible with strategic direction"
        },
        {
          "ref": "Clause 5.2",
          "context": "AI policy appropriate to purpose"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Strategic Alignment",
      "maturity_enhancement": "Progresses from ad-hoc to strategically managed; prerequisite for Level 3"
    }
  },
  {
    "control_id": "GOV-POL-03",
    "control_title": "AI Policy Review and Update Process",
    "category": "AI Governance & Strategy",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and execute a documented process for periodic review, assessment, and update of AI policies, ensuring policies remain current with regulatory changes, technological evolution, and organizational learning.",
    "control_objective": "Maintain AI policy relevance and effectiveness through systematic review cycles that incorporate stakeholder feedback, regulatory updates, and lessons learned.",
    "risk_description": "Stale policies create compliance gaps. Outdated guidance leads to inconsistent practices. Failure to incorporate lessons perpetuates weaknesses.",
    "implementation": {
      "requirements": [
        "Policy Review Schedule establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Standardized review process defining inputs, decision points, quality gates, and output criteria",
        "Policy Change Log establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Feedback mechanism with defined channels, response procedures, and effectiveness measurement"
      ],
      "steps": [
        "Establish policy review calendar in GRC platform with documented approval and stakeholder sign-off",
        "Configure regulatory monitoring with validation testing and documented configuration baseline",
        "Deploy effectiveness survey with phased rollout, validation testing, and rollback plan",
        "Conduct structured review meeting using standardized methodology and document findings",
        "Process approved changes"
      ],
      "timeline": "Annual minimum; ad-hoc for significant changes."
    },
    "evidence_requirements": [
      "Policy Review Schedule",
      "Annual Policy Review Report",
      "Policy Change Log",
      "Stakeholder Feedback Summary",
      "Regulatory Change Impact Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)",
          "context": "QMS shall be reviewed and maintained"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.5",
          "context": "Plan ongoing monitoring and periodic review"
        },
        {
          "ref": "MEASURE.1.2",
          "context": "Assess appropriateness of metrics"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.3.1",
          "context": "Review AI management system at planned intervals"
        },
        {
          "ref": "Clause A.2.4",
          "context": "AI policy reviewed at planned intervals"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Continuous Improvement",
      "maturity_enhancement": "Enables adaptive governance; supports Level 4 maturity"
    }
  },
  {
    "control_id": "GOV-POL-04",
    "control_title": "Legal and Regulatory Compliance Framework",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL identify, document, and maintain a comprehensive inventory of all legal, regulatory, and contractual requirements applicable to its AI systems, and SHALL establish processes to monitor compliance and respond to regulatory changes.",
    "control_objective": "Ensure complete visibility into the legal and regulatory landscape affecting AI operations, enabling proactive compliance management.",
    "risk_description": "Regulatory blind spots expose to enforcement actions, fines (up to €35M or 7% global turnover), and operational restrictions.",
    "implementation": {
      "requirements": [
        "Legal Requirements Register with structured entries, status tracking, ownership, and review dates",
        "Regulatory Applicability Matrix mapping roles, responsibilities, and accountability assignments",
        "Compliance Gap Analysis comparing current state against target requirements with prioritized remediation actions",
        "Jurisdiction-Specific Checklists covering all required evaluation criteria and evidence checkpoints"
      ],
      "steps": [
        "Engage Legal for regulatory scan",
        "Build Legal Requirements Register in GRC",
        "Map AI systems to requirements ensuring complete traceability and coverage",
        "Conduct Compliance Gap Analysis using standardized methodology and document findings",
        "Establish regulatory monitoring with documented approval and stakeholder sign-off"
      ],
      "timeline": "Initial prior to deployment; continuous monitoring with quarterly refresh."
    },
    "evidence_requirements": [
      "Legal Requirements Register",
      "Regulatory Applicability Matrix",
      "Compliance Gap Analysis Report",
      "Jurisdiction-Specific Checklists",
      "Quarterly Regulatory Update Briefing"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 8(1)",
          "context": "High-risk AI shall comply with Chapter 2"
        },
        {
          "ref": "Article 8(2)",
          "context": "Ensure full compliance with Union legislation"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.1",
          "context": "Understand all legal and regulatory requirements"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.1",
          "context": "Determine external issues affecting AIMS"
        },
        {
          "ref": "Clause 4.2",
          "context": "Determine interested party requirements"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Regulatory Compliance",
      "maturity_enhancement": "Establishes compliance infrastructure for Level 2 maturity"
    }
  },
  {
    "control_id": "GOV-REPORT-01",
    "control_title": "Concern Reporting Mechanism",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish accessible mechanisms for personnel and external parties to report concerns, potential incidents, and ethical issues related to AI systems, with protections against retaliation for good-faith reporters.",
    "control_objective": "Enable early identification of AI risks and issues through channels that encourage reporting without fear of negative consequences.",
    "risk_description": "Unreported concerns allow AI risks to escalate into incidents. Fear of retaliation suppresses valuable risk information.",
    "implementation": {
      "requirements": [
        "Concern Reporting Procedure detailing workflows, decision points, roles, and documentation requirements",
        "Anonymous Reporting Channel documenting methodology, findings, conclusions, and recommended actions",
        "Whistleblower Protection Policy establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Concern Investigation Process defining inputs, decision points, quality gates, and output criteria",
        "Concern Resolution Tracking log recording each concern, investigation actions, resolution outcomes, and closure dates"
      ],
      "steps": [
        "Develop Concern Reporting Procedure with multiple intake channels",
        "Implement Anonymous Reporting Channel with pilot validation and phased organizational rollout",
        "Publish Whistleblower Protection Policy through approved distribution channels with version control",
        "Establish Concern Investigation Process with documented approval and stakeholder sign-off",
        "Deploy Concern Resolution Tracking system"
      ],
      "timeline": "Channels operational within 60 days; policy published within 30 days."
    },
    "evidence_requirements": [
      "Concern Reporting Procedure",
      "Anonymous Reporting Channel",
      "Whistleblower Protection Policy",
      "Concern Investigation Process",
      "Concern Resolution Tracking"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports quality management and internal controls"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.1",
          "context": "Foster safety-first mindset enabling concerns"
        },
        {
          "ref": "GOVERN.4.3",
          "context": "Establish incident reporting mechanisms"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.3.3",
          "context": "Define process to report concerns about responsible AI"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Reporting Infrastructure",
      "maturity_enhancement": "Reporting mechanisms essential for Level 3 maturity enabling proactive risk identification"
    }
  },
  {
    "control_id": "GOV-RISK-01",
    "control_title": "AI Risk Tolerance and Appetite Definition",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define, document, and obtain board approval for AI risk appetite and tolerance thresholds that guide AI investment decisions, risk acceptance, and operational boundaries.",
    "control_objective": "Establish clear organizational boundaries for acceptable AI risk enabling consistent decision-making and resource prioritization.",
    "risk_description": "Without defined risk appetite, AI decisions are inconsistent. Inability to articulate tolerance demonstrates governance weakness.",
    "implementation": {
      "requirements": [
        "Risk Appetite Statement with documented scope, methodology, and acceptance criteria",
        "Risk Tolerance Thresholds Document with version control, approval signatures, and distribution records",
        "Risk Categorization Schema with documented scope, methodology, and acceptance criteria",
        "Board-Approved Risk Framework establishing methodology, evaluation criteria, and decision processes"
      ],
      "steps": [
        "Conduct risk appetite workshop using standardized methodology and document findings",
        "Define AI risk categories with measurable criteria and documented rationale",
        "Establish tolerance thresholds with documented approval and stakeholder sign-off",
        "Document Risk Appetite Statement with version control and stakeholder review",
        "Present to board for approval with supporting evidence and actionable recommendations"
      ],
      "timeline": "Establish during AI program initiation; review annually."
    },
    "evidence_requirements": [
      "Risk Appetite Statement with board approval",
      "Risk Tolerance Thresholds Document",
      "Risk Categorization Schema",
      "Board Resolution",
      "Risk Appetite Application Examples"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(5)",
          "context": "Risk measures consider whether residual risk acceptable"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.3",
          "context": "Establish processes based on risk tolerance"
        },
        {
          "ref": "MAP.1.5",
          "context": "Document organizational risk tolerances"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.1",
          "context": "Determine risks and opportunities"
        },
        {
          "ref": "Clause 6.1.2",
          "context": "AI risk assessment shall establish criteria"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Framework",
      "maturity_enhancement": "Foundational for Level 2; enables quantitative management for Level 4"
    }
  },
  {
    "control_id": "GOV-SCOPE-01",
    "control_title": "AI Management System Scope Definition",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define and document the boundaries, applicability, and scope of the AI Management System, specifying which AI systems, processes, organizational units, and external interfaces are included within the governance framework.",
    "control_objective": "Establish clear boundaries for AI governance to ensure comprehensive coverage while avoiding scope creep and enabling focused resource allocation.",
    "risk_description": "Undefined scope leads to governance gaps. Overly broad scope wastes resources. Regulators may challenge scope exclusions.",
    "implementation": {
      "requirements": [
        "AIMS Scope Statement with documented scope, methodology, and acceptance criteria",
        "Boundary Definition Document with version control, approval signatures, and distribution records",
        "Interface and Dependency Map with documented scope, methodology, and acceptance criteria",
        "Scope Applicability Matrix mapping roles, responsibilities, and accountability assignments"
      ],
      "steps": [
        "Conduct scope discovery workshops using standardized methodology and document findings",
        "Document organizational boundaries with version control and stakeholder review",
        "Map external interfaces ensuring complete traceability and coverage",
        "Create Scope Applicability Matrix with documented requirements and quality criteria",
        "Obtain executive approval with documented justification and authorization chain"
      ],
      "timeline": "Define during AI program initiation; review annually."
    },
    "evidence_requirements": [
      "AIMS Scope Statement with executive approval",
      "Boundary Definition Document",
      "Interface and Dependency Map",
      "Scope Applicability Matrix",
      "Scope Review Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 8(1)",
          "context": "High-risk AI comply taking into account intended purpose"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.3.3",
          "context": "Specify and document targeted application scope"
        },
        {
          "ref": "MAP.3.4",
          "context": "Define context of use"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.3",
          "context": "Determine boundaries and applicability of AIMS"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Scope Management",
      "maturity_enhancement": "Foundational for Level 2 maturity; clear scope enables audit readiness"
    }
  },
  {
    "control_id": "GOV-SHARE-01",
    "control_title": "Information Sharing and Lessons Learned",
    "category": "AI Governance & Strategy",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish processes for sharing AI-related information, incidents, and lessons learned both internally across teams and externally with industry peers, research communities, and regulatory bodies as appropriate.",
    "control_objective": "Accelerate organizational learning and contribute to industry-wide AI safety through structured information sharing practices.",
    "risk_description": "Siloed learning means AI mistakes are repeated. Lack of industry engagement isolates from emerging best practices.",
    "implementation": {
      "requirements": [
        "Information Sharing Procedure detailing workflows, decision points, roles, and documentation requirements",
        "Industry Forum Participation Log recording events with timestamps, responsible parties, and resolution status",
        "Lessons Learned Database with documented scope, methodology, and acceptance criteria",
        "Incident Information Sharing Protocol with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Develop Information Sharing Procedure balancing transparency with confidentiality",
        "Identify relevant industry forums through structured analysis and stakeholder consultation",
        "Maintain Industry Forum Participation Log with periodic reviews and version-controlled updates",
        "Create Lessons Learned Database with documented requirements and quality criteria",
        "Establish Incident Information Sharing Protocol with documented approval and stakeholder sign-off"
      ],
      "timeline": "Procedure within 60 days; database operational within 90 days."
    },
    "evidence_requirements": [
      "Information Sharing Procedure",
      "Industry Forum Participation Log",
      "Lessons Learned Database",
      "Incident Information Sharing Protocol",
      "Best Practice Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports industry collaboration and continuous improvement"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.3",
          "context": "Establish practices to enable incident identification and information sharing"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.3.3",
          "context": "Define process to report concerns"
        },
        {
          "ref": "Clause 9.3.2",
          "context": "Management review shall consider lessons learned"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Knowledge Management",
      "maturity_enhancement": "Information sharing supports Level 4 maturity through industry benchmarking"
    }
  },
  {
    "control_id": "GOV-STAKE-01",
    "control_title": "External Stakeholder Engagement",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish formal mechanisms for engaging external stakeholders including affected communities, end users, civil society, and regulators to collect, consider, and integrate feedback regarding AI system impacts.",
    "control_objective": "Incorporate external perspectives into AI governance to identify impacts invisible to internal teams and build trust with affected communities.",
    "risk_description": "Lack of external input leads to AI that harms communities. Regulatory relationships suffer when engagement is reactive.",
    "implementation": {
      "requirements": [
        "Stakeholder Engagement Plan with milestones, responsible parties, resource needs, and success criteria",
        "Public Input Mechanism with defined channels, response procedures, and effectiveness measurement",
        "Feedback Prioritization Matrix mapping roles, responsibilities, and accountability assignments",
        "Affected Population Outreach Log recording events with timestamps, responsible parties, and resolution status"
      ],
      "steps": [
        "Identify and map external stakeholders through structured analysis and stakeholder consultation",
        "Develop Stakeholder Engagement Plan incorporating stakeholder input and industry best practices",
        "Implement Public Input Mechanism with pilot validation and phased organizational rollout",
        "Create Feedback Prioritization Matrix with documented requirements and quality criteria",
        "Conduct proactive outreach using standardized methodology and document findings"
      ],
      "timeline": "Engagement plan within 60 days; mechanisms before high-risk deployment."
    },
    "evidence_requirements": [
      "Stakeholder Engagement Plan",
      "Public Input Mechanism Documentation",
      "Feedback Prioritization Matrix",
      "Community Forum Records",
      "Affected Population Outreach Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports transparency and accountability"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.5.1",
          "context": "Collect and integrate external feedback"
        },
        {
          "ref": "MAP.5.2",
          "context": "Establish practices for regular engagement"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.2",
          "context": "Determine interested parties"
        },
        {
          "ref": "Clause A.8.3",
          "context": "Provide capabilities to report adverse impacts"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Stakeholder Relations",
      "maturity_enhancement": "External engagement essential for Level 3 maturity"
    }
  },
  {
    "control_id": "GOV-STAKE-02",
    "control_title": "Feedback Integration Mechanisms",
    "category": "AI Governance & Strategy",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish processes to systematically review, adjudicate, and integrate stakeholder feedback into AI system improvements, with transparent communication back to feedback providers regarding actions taken.",
    "control_objective": "Convert stakeholder input into meaningful AI system improvements through structured review processes that close the feedback loop.",
    "risk_description": "Unprocessed feedback accumulates without driving improvement. Stakeholders disengage when input is ignored.",
    "implementation": {
      "requirements": [
        "Feedback Review Board Charter defining membership, authority, decision rights, and operating procedures",
        "Adjudication Process Document defining inputs, decision points, quality gates, and output criteria",
        "Feedback Integration Workflow with documented scope, methodology, and acceptance criteria",
        "Complaint Resolution Tracker with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Establish Feedback Review Board with documented approval and stakeholder sign-off",
        "Document Adjudication Process with version control and stakeholder review",
        "Create Feedback Integration Workflow with documented requirements and quality criteria",
        "Implement Complaint Resolution Tracker with pilot validation and phased organizational rollout",
        "Publish feedback response summaries through approved distribution channels with version control"
      ],
      "timeline": "Board within 60 days; processes operational within 90 days."
    },
    "evidence_requirements": [
      "Feedback Review Board Charter",
      "Adjudication Process Document",
      "Feedback Integration Workflow",
      "Complaint Resolution Tracker",
      "System Update Log from Feedback"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports post-market monitoring and continuous improvement"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.5.2",
          "context": "Enable teams to incorporate adjudicated feedback"
        },
        {
          "ref": "MEASURE.3.3",
          "context": "Establish feedback processes for end users"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.8.3",
          "context": "Provide capabilities for external reporting"
        },
        {
          "ref": "Clause 9.3.2",
          "context": "Management review shall consider feedback"
        }
      ]
    },
    "aima_mapping": {
      "domain": "Governance & Strategy Domain",
      "area": "Continuous Improvement",
      "maturity_enhancement": "Closes feedback loop essential for Level 4 maturity"
    }
  },
  {
    "control_id": "RISK-ALT-01",
    "control_title": "Non-AI Alternative Assessment",
    "category": "AI Risk Management",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess and document viable non-AI alternative solutions before committing to AI development, including cost-benefit comparison, resource requirements, and explicit justification for selecting AI over traditional approaches.",
    "control_objective": "Ensure AI is selected only when it provides clear advantages over non-AI alternatives, preventing unnecessary complexity and risk.",
    "risk_description": "Unnecessary AI adoption introduces avoidable complexity and risk. Failure to consider alternatives leads to resource misallocation. Missing justification undermines business case credibility and stakeholder trust.",
    "implementation": {
      "requirements": [
        "Non-AI Alternative Analysis template comparing AI and non-AI solutions on cost, risk, performance, and feasibility",
        "Cost-Benefit Comparison framework including total cost of ownership",
        "Traditional Approach Evaluation methodology with defined assessment criteria, scoring rubric, and comparison framework",
        "AI Justification Document with explicit rationale"
      ],
      "steps": [
        "Identify candidate non-AI solutions for the use case",
        "Conduct Traditional Approach Evaluation assessing feasibility and effectiveness",
        "Perform Cost-Benefit Comparison including development, operation, maintenance, and risk costs",
        "Document AI Justification with explicit rationale for AI selection",
        "Obtain approval for AI selection decision with documented justification and authorization chain"
      ],
      "timeline": "During project initiation before AI development commitment; revisited if scope changes significantly."
    },
    "evidence_requirements": [
      "Non-AI Alternative Analysis",
      "Cost-Benefit Comparison",
      "Traditional Approach Evaluation",
      "AI Justification Document",
      "Alternative Solution Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports proportionate approach to AI adoption"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.2.1",
          "context": "Account for resources required and viable non-AI alternative systems to reduce potential impact"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.2",
          "context": "Document rationale for developing AI system"
        },
        {
          "ref": "may become unfeasible from financial perspective",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Solution Assessment",
      "maturity_enhancement": "Alternative analysis supports Level 2 (Managed) maturity with informed decision-making"
    }
  },
  {
    "control_id": "RISK-BEN-01",
    "control_title": "AI System Benefits Assessment and Documentation",
    "category": "AI Risk Management",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess and document potential benefits of AI systems including efficiency gains, improved decision quality, accessibility enhancements, and positive impacts on individuals, groups, and society to enable informed benefit-risk balancing.",
    "control_objective": "Enable proportionate risk management by documenting expected benefits against which risks are weighed, supporting go/no-go decisions.",
    "risk_description": "Undocumented benefits prevent informed risk-benefit balancing. Lack of benefit tracking means value of AI investment cannot be demonstrated.",
    "implementation": {
      "requirements": [
        "Benefits Assessment Report documenting methodology, findings, conclusions, and recommended actions",
        "Efficiency Gains Analysis with defined methodology, criteria, and documented findings",
        "Performance Improvement Projections with documented scope, methodology, and acceptance criteria",
        "Benefit Realization Tracker with documented scope, methodology, and acceptance criteria",
        "Expected Outcomes Documentation with version control, approval signatures, and distribution records"
      ],
      "steps": [
        "Identify and categorize expected benefits across stakeholder groups",
        "Quantify benefits where possible using defined metrics",
        "Document qualitative benefits with clear descriptions and evidence basis",
        "Create Performance Improvement Projections with baseline and target metrics",
        "Establish Benefit Realization Tracker to monitor actual versus expected benefits"
      ],
      "timeline": "Benefits assessment during business case development; tracking throughout operational life."
    },
    "evidence_requirements": [
      "Benefits Assessment Report",
      "Efficiency Gains Analysis",
      "Performance Improvement Projections",
      "Benefit Realization Tracker",
      "Expected Outcomes Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(3)",
          "context": "Technical documentation shall include detailed information about monitoring, functioning including benefits"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.3.1",
          "context": "Examine and document potential benefits of intended AI system functionality"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.5.3",
          "context": "Document positive impacts to individuals, groups and societies"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Benefits Assessment",
      "maturity_enhancement": "Benefits documentation supports Level 2 maturity with informed decision-making"
    }
  },
  {
    "control_id": "RISK-COST-01",
    "control_title": "AI Error Cost and Consequence Assessment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess and document potential costs and consequences of AI errors, including both monetary losses and non-monetary harms such as reputational damage, loss of trust, safety impacts, and fundamental rights violations.",
    "control_objective": "Enable comprehensive understanding of AI failure consequences to inform risk tolerance decisions and ensure appropriate safeguards.",
    "risk_description": "Underestimated error costs lead to inadequate safeguards and insufficient insurance. Unassessed non-monetary harms ignore significant impacts on safety and rights.",
    "implementation": {
      "requirements": [
        "Error Cost Analysis with defined methodology, criteria, and documented findings",
        "False Positive/Negative Impact Assessment evaluating likelihood, severity, affected populations, and mitigation options",
        "Monetary Loss Projections with documented scope, methodology, and acceptance criteria",
        "Non-Monetary Harm Assessment with defined methodology, criteria, and documented findings",
        "Trustworthiness Gap Analysis comparing current state against target requirements with prioritized remediation actions"
      ],
      "steps": [
        "Identify potential AI error modes and failure scenarios",
        "Conduct Error Cost Analysis quantifying direct and indirect financial impacts",
        "Perform False Positive/Negative Impact Assessment for classification systems",
        "Develop Monetary Loss Projections using historical data and scenario modeling",
        "Complete Non-Monetary Harm Assessment including safety, dignity, and rights impacts"
      ],
      "timeline": "Assessment during design; validation during testing; monitoring during operation."
    },
    "evidence_requirements": [
      "Error Cost Analysis",
      "False Positive/Negative Impact Assessment",
      "Monetary Loss Projections",
      "Non-Monetary Harm Assessment",
      "Trustworthiness Gap Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)(a)",
          "context": "Identify and analyze risks that may pose risks to health, safety or fundamental rights"
        },
        {
          "ref": "Article 9(2)(b)",
          "context": "Estimate risks under conditions of foreseeable misuse"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.3.2",
          "context": "Examine and document potential costs from AI errors, system functionality, and trustworthiness gaps"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.5.2",
          "context": "Establish process to assess potential consequences of AI system outputs"
        },
        {
          "ref": "Clause A.5.4",
          "context": "Assess potential impacts to individuals including financial consequences"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Consequence Assessment",
      "maturity_enhancement": "Error cost assessment supports Level 3 maturity with comprehensive risk understanding"
    }
  },
  {
    "control_id": "RISK-DECIDE-01",
    "control_title": "Go/No-Go Decision Process",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement a formal go/no-go decision process with defined stage gates, decision criteria, and authority levels to determine whether AI system development or deployment should proceed based on risk assessment results and residual risk acceptance.",
    "control_objective": "Ensure AI systems only proceed to subsequent lifecycle phases after systematic evaluation confirms acceptable risk levels and stakeholder approval.",
    "risk_description": "Without formal go/no-go process, AI systems proceed without systematic risk evaluation. Unclear decision authority leads to inappropriate risk acceptance. Missing documentation prevents audit trail and accountability.",
    "implementation": {
      "requirements": [
        "Go/No-Go Decision Framework defining stage gates",
        "Stage Gate Criteria for each lifecycle phase with documented scope, methodology, and acceptance criteria",
        "Decision Authority Matrix by risk tier mapping roles, responsibilities, and accountability assignments",
        "Deployment Readiness Checklist covering all required evaluation criteria and evidence checkpoints"
      ],
      "steps": [
        "Define stage gates aligned with AI lifecycle (initiation, design, development, testing, deployment, operation)",
        "Establish decision criteria for each gate including risk thresholds",
        "Create Decision Authority Matrix specifying approval authorities by risk level",
        "Develop Deployment Readiness Checklist covering technical, ethical, and compliance criteria",
        "Implement decision documentation workflow with sign-off requirements"
      ],
      "timeline": "Framework established before first AI project; applied at each stage gate throughout development."
    },
    "evidence_requirements": [
      "Go/No-Go Decision Framework",
      "Stage Gate Criteria",
      "Decision Authority Matrix",
      "Deployment Readiness Checklist",
      "Decision Documentation Template"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(5)",
          "context": "Risk management measures shall ensure residual risk is judged acceptable"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.1.1",
          "context": "Determine whether AI system achieves intended purposes and whether development or deployment should proceed"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.3",
          "context": "Obtain risk owners' approval of AI risk treatment plan and acceptance of residual AI risks"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Decision Governance",
      "maturity_enhancement": "Formal decision process essential for Level 3 (Defined) maturity with stage-gate governance"
    }
  },
  {
    "control_id": "RISK-EVAL-01",
    "control_title": "Risk Analysis and Evaluation",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement structured processes to analyze identified AI risks by assessing potential consequences and realistic likelihood, and evaluate risks by comparing against established risk criteria to determine risk significance and treatment priority.",
    "control_objective": "Enable informed risk decisions through consistent analysis and evaluation methodology that objectively prioritizes risks for treatment.",
    "risk_description": "Inconsistent risk analysis leads to incomparable assessments. Without evaluation criteria, all risks appear equal preventing effective prioritization.",
    "implementation": {
      "requirements": [
        "Risk Analysis Methodology Document recording events with timestamps, responsible parties, and resolution status",
        "Risk Evaluation Matrix mapping roles, responsibilities, and accountability assignments",
        "Combined Risk Interaction Assessment with defined methodology, criteria, and documented findings",
        "Prioritized Risk List with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Develop Risk Analysis Methodology incorporating stakeholder input and industry best practices",
        "Create Risk Evaluation Matrix with scales aligned risk appetite",
        "Conduct Combined Risk Interaction Assessment using standardized methodology and document findings",
        "Generate Prioritized Risk List",
        "Document risk evaluation rationale with version control and stakeholder review"
      ],
      "timeline": "Methodology within 45 days; applied to all registered risks."
    },
    "evidence_requirements": [
      "Risk Analysis Methodology Document",
      "Risk Evaluation Matrix",
      "Combined Risk Interaction Assessment",
      "Prioritized Risk List",
      "Risk Evaluation Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)(a)",
          "context": "Identify and analyze risks"
        },
        {
          "ref": "Article 9(2)(b)",
          "context": "Estimate and evaluate risks"
        },
        {
          "ref": "Article 9(4)",
          "context": "Consider effects from combined use of multiple systems"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.5.1",
          "context": "Identify likelihood and magnitude of impacts"
        },
        {
          "ref": "MEASURE.1.1",
          "context": "Select approaches for measuring AI risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.2",
          "context": "Analyze AI risks by assessing consequences and likelihood"
        },
        {
          "ref": "Evaluate by comparing with criteria",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Analysis",
      "maturity_enhancement": "Structured evaluation enables Level 3 maturity with consistent risk comparison across portfolio"
    }
  },
  {
    "control_id": "RISK-ID-01",
    "control_title": "Risk Identification Process",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement systematic processes to identify known, foreseeable, emergent, and unanticipated AI risks throughout the system lifecycle, including assessment of likelihood and magnitude for each identified risk.",
    "control_objective": "Ensure comprehensive identification of AI risks across all categories and lifecycle phases, enabling proactive risk management.",
    "risk_description": "Unidentified risks manifest as incidents without warning. Incomplete risk identification leaves vulnerabilities unaddressed.",
    "implementation": {
      "requirements": [
        "Risk Identification Workshop methodology with structured facilitation guides, participant criteria, and output templates",
        "Risk Register with Likelihood/Impact Scores",
        "Emergent Risk Monitoring Log recording events with timestamps, responsible parties, and resolution status",
        "Trend Analysis Report identifying patterns, emerging risks, and forward-looking projections"
      ],
      "steps": [
        "Conduct Risk Identification Workshops using FMEA, HAZOP, threat modeling",
        "Populate Risk Register with comprehensive descriptions",
        "Establish Emergent Risk Monitoring with documented approval and stakeholder sign-off",
        "Perform Trend Analysis applying defined criteria and documenting results",
        "Update risk identification at planned intervals with change documentation and stakeholder notification"
      ],
      "timeline": "Initial identification during project initiation; ongoing monitoring continuous."
    },
    "evidence_requirements": [
      "Risk Identification Workshop Records",
      "Risk Register with Likelihood/Impact Scores",
      "Emergent Risk Monitoring Log",
      "Trend Analysis Report",
      "Risk Identification Methodology Document"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)(a)",
          "context": "Identify and analyze known and foreseeable risks"
        },
        {
          "ref": "Article 9(2)(b)",
          "context": "Estimate risks under intended use and foreseeable misuse"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.5.1",
          "context": "Identify likelihood and magnitude of impacts"
        },
        {
          "ref": "MEASURE.3.1",
          "context": "Establish approaches to identify existing and emergent risks"
        },
        {
          "ref": "MANAGE.1.2",
          "context": "Prioritize documented AI risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.2",
          "context": "AI risk assessment shall identify AI risks"
        },
        {
          "ref": "Clause 8.2",
          "context": "Perform AI risk assessments at planned intervals"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Identification",
      "maturity_enhancement": "Systematic risk identification essential for Level 2 maturity"
    }
  },
  {
    "control_id": "RISK-IMPACT-01",
    "control_title": "AI System Impact Assessment Process",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and execute a systematic AI system impact assessment process that examines potential benefits and harms across all affected stakeholders, documenting assessment methodology, results, and review records.",
    "control_objective": "Enable comprehensive understanding of AI system impacts through structured assessment that considers both positive and negative consequences.",
    "risk_description": "Unassessed AI systems deploy with unknown impact profiles. Missing documentation prevents demonstration of due diligence.",
    "implementation": {
      "requirements": [
        "AI Impact Assessment Template with standardized fields, completion guidance, and approval workflow",
        "Impact Assessment Procedure evaluating likelihood, severity, affected populations, and mitigation options",
        "Completed Impact Assessment Reports evaluating likelihood, severity, affected populations, and mitigation options",
        "Impact Assessment Review Records evaluating likelihood, severity, affected populations, and mitigation options"
      ],
      "steps": [
        "Develop AI Impact Assessment Template incorporating ISO 42001 A",
        "Establish Impact Assessment Procedure defining when assessments required, who conducts, approval process",
        "Conduct impact assessments during system design using cross-functional teams",
        "Document results in standardized Impact Assessment Reports"
      ],
      "timeline": "Assessment during design phase; update before major changes; review annually for operational systems."
    },
    "evidence_requirements": [
      "AI Impact Assessment Template",
      "Impact Assessment Procedure",
      "Completed Impact Assessment Reports",
      "Impact Assessment Review Records",
      "Impact Assessment Training Materials"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports overall risk management and human rights due diligence"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.3.1",
          "context": "Examine potential benefits and costs of AI system functionality"
        },
        {
          "ref": "MAP.3.2",
          "context": "Examine potential costs from AI errors"
        },
        {
          "ref": "MAP.5.1",
          "context": "Identify likelihood and magnitude of impacts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.4",
          "context": "Conduct AI system impact assessment"
        },
        {
          "ref": "Clause A.5.2",
          "context": "Establish process to assess potential consequences"
        },
        {
          "ref": "Clause A.5.3",
          "context": "Document results of AI system impact assessments"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Impact Assessment",
      "maturity_enhancement": "Systematic impact assessment foundational for Level 2 maturity; supports human rights due diligence"
    }
  },
  {
    "control_id": "RISK-IMPACT-02",
    "control_title": "Individual and Group Impact Assessment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess and document potential impacts of AI systems on individuals and groups throughout the system lifecycle, including effects on fundamental rights, fairness, privacy, autonomy, and dignity.",
    "control_objective": "Identify and address AI impacts that may harm individuals or groups, ensuring protection of fundamental rights and non-discrimination.",
    "risk_description": "Unassessed individual impacts lead to fundamental rights violations. Group-level harms remain invisible without demographic analysis.",
    "implementation": {
      "requirements": [
        "Individual Rights Impact Assessment evaluating likelihood, severity, affected populations, and mitigation options",
        "Demographic Impact Analysis with defined methodology, criteria, and documented findings",
        "Group-Specific Impact Report documenting methodology, findings, conclusions, and recommended actions",
        "Fairness Impact Matrix mapping roles, responsibilities, and accountability assignments"
      ],
      "steps": [
        "Identify individuals and groups potentially affected by AI system decisions",
        "Conduct Individual Rights Impact Assessment evaluating privacy, autonomy, dignity, non-discrimination",
        "Perform Demographic Impact Analysis using intersectional approach",
        "Document Group-Specific Impacts for communities with shared characteristics",
        "Create Fairness Impact Matrix evaluating bias across protected characteristics"
      ],
      "timeline": "Assessment during design; validation with affected groups; ongoing monitoring."
    },
    "evidence_requirements": [
      "Individual Rights Impact Assessment",
      "Demographic Impact Analysis",
      "Group-Specific Impact Report",
      "Fairness Impact Matrix",
      "Rights Impact Mitigation Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports fundamental rights protection requirements"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.5.1",
          "context": "Identify impacts on individuals and communities"
        },
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate fairness and bias across demographic groups"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.4",
          "context": "AI system impact assessment shall consider impacts on individuals, groups and societies"
        },
        {
          "ref": "Clause A.5.4",
          "context": "Assess potential impacts to individuals or groups throughout lifecycle"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Human Rights Assessment",
      "maturity_enhancement": "Individual and group impact assessment supports Level 3 maturity; required for fundamental rights compliance"
    }
  },
  {
    "control_id": "RISK-IMPACT-03",
    "control_title": "Societal Impact Assessment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess and document potential societal impacts of AI systems including effects on democratic processes, social cohesion, economic structures, environmental sustainability, and cultural values throughout the system lifecycle.",
    "control_objective": "Identify and address broader societal consequences of AI deployment that extend beyond direct users and affected individuals.",
    "risk_description": "Large-scale AI deployment without societal impact assessment may cause systemic harms to democratic processes, labor markets, or environmental sustainability.",
    "implementation": {
      "requirements": [
        "Societal Impact Assessment Report evaluating likelihood, severity, affected populations, and mitigation options",
        "Environmental Impact Analysis with defined methodology, criteria, and documented findings",
        "Economic Impact Study with documented scope, methodology, and acceptance criteria",
        "Cultural and Norms Impact Review with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Identify potential societal-level impacts based on AI system scale, domain, and deployment context",
        "Conduct Societal Impact Assessment examining democratic, social, and institutional effects",
        "Perform Environmental Impact Analysis including training and inference energy consumption",
        "Complete Economic Impact Study evaluating employment displacement and market effects",
        "Review Cultural and Norms Impact on social behaviors and values"
      ],
      "timeline": "Assessment during design for systems with potential broad societal impact; periodic review for deployed systems."
    },
    "evidence_requirements": [
      "Societal Impact Assessment Report",
      "Environmental Impact Analysis",
      "Economic Impact Study",
      "Cultural and Norms Impact Review",
      "Societal Impact Mitigation Strategy"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports broader responsible AI principles"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.5.1",
          "context": "Identify impacts on society and planet"
        },
        {
          "ref": "MEASURE.2.12",
          "context": "Assess environmental impact and sustainability"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.5.5",
          "context": "Assess and document potential societal impacts throughout lifecycle"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Societal Impact",
      "maturity_enhancement": "Societal impact assessment supports Level 4 maturity with comprehensive impact understanding"
    }
  },
  {
    "control_id": "RISK-IND-01",
    "control_title": "Independent Risk Assessment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure AI risk assessments are periodically validated by independent assessors who are separate from front-line development teams, including internal experts with objectivity or external third-party auditors for high-risk systems.",
    "control_objective": "Provide objective validation of risk assessments through independent review that identifies blind spots and validates risk management effectiveness.",
    "risk_description": "Self-assessment creates blind spots where risks are underestimated. Lack of independent validation fails to meet conformity assessment requirements.",
    "implementation": {
      "requirements": [
        "Independent Assessment Report documenting methodology, findings, conclusions, and recommended actions",
        "Third-Party Audit Results with documented scope, methodology, and acceptance criteria",
        "Internal Audit Schedule with defined frequencies, responsible parties, and trigger conditions",
        "Assessor Independence Declaration with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Identify internal experts independent from development or engage qualified third-party assessors",
        "Define assessment scope covering risk identification, analysis, evaluation, treatment",
        "Ensure Assessor Independence through conflict declarations and organizational separation",
        "Conduct independent assessment using defined methodology",
        "Document findings in Independent Assessment Report"
      ],
      "timeline": "Annual independent assessment minimum; third-party conformity assessment as required for high-risk AI."
    },
    "evidence_requirements": [
      "Independent Assessment Report",
      "Third-Party Audit Results",
      "Internal Audit Schedule",
      "Assessor Independence Declaration",
      "Assessment Remediation Tracker"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(f)",
          "context": "Providers shall ensure relevant conformity assessment procedure"
        },
        {
          "ref": "Article 43",
          "context": "Conformity assessment procedures including third-party assessment"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.1.3",
          "context": "Involve internal experts independent from front-line development and/or independent assessors"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.2.1",
          "context": "Conduct internal audits at planned intervals"
        },
        {
          "ref": "Clause 9.2.2",
          "context": "Select auditors that ensure objectivity and impartiality"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Independent Assurance",
      "maturity_enhancement": "Independent assessment required for Level 3 maturity and conformity assessment compliance"
    }
  },
  {
    "control_id": "RISK-MEAS-01",
    "control_title": "Risk Measurement Approach Selection",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL select, document, and implement appropriate approaches and metrics for measuring AI risks, including quantitative metrics where feasible, qualitative assessments where necessary, and proxy measures for risks that are difficult to assess directly.",
    "control_objective": "Enable objective risk assessment through defined measurement approaches that provide reliable, comparable risk data for decision-making.",
    "risk_description": "Unmeasured risks cannot be objectively assessed. Inappropriate metrics provide misleading risk data leading to poor decisions.",
    "implementation": {
      "requirements": [
        "Risk Measurement Framework establishing methodology, evaluation criteria, and decision processes",
        "Metric Selection Rationale with defined KPIs, measurement methods, thresholds, and reporting cadence",
        "Measurement Gap Analysis comparing current state against target requirements with prioritized remediation actions",
        "Proxy Measure Documentation with version control, approval signatures, and distribution records",
        "Qualitative Assessment Guide specifying standards, decision criteria, and worked examples"
      ],
      "steps": [
        "Inventory all identified risks and categorize by measurability",
        "Select appropriate metrics for quantifiable risks using documented criteria and comparative evaluation",
        "Document Metric Selection Rationale including limitations",
        "Identify Measurement Gaps where direct metrics unavailable",
        "Develop Proxy Measures for difficult-to-assess risks"
      ],
      "timeline": "Framework within 60 days; applied to all risk assessments."
    },
    "evidence_requirements": [
      "Risk Measurement Framework",
      "Metric Selection Rationale",
      "Measurement Gap Analysis",
      "Proxy Measure Documentation",
      "Qualitative Assessment Guide"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(6)",
          "context": "High-risk AI shall be tested to identify most appropriate risk management measures"
        },
        {
          "ref": "Article 9(8)",
          "context": "Testing performed against defined metrics and thresholds"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.1.1",
          "context": "Select and implement approaches for measuring AI risks"
        },
        {
          "ref": "MEASURE.3.2",
          "context": "Consider risk tracking for settings where risks are difficult to assess"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.1",
          "context": "Determine methods for monitoring, measurement, analysis and evaluation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Measurement",
      "maturity_enhancement": "Defined measurement supports Level 3 maturity; quantitative metrics enable Level 4"
    }
  },
  {
    "control_id": "RISK-MON-01",
    "control_title": "Risk Monitoring and Review",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and execute ongoing risk monitoring processes that track existing risks, identify emergent risks, assess control effectiveness, and trigger risk reassessment when thresholds are exceeded or significant changes occur.",
    "control_objective": "Ensure AI risks remain within tolerance through continuous monitoring that detects risk changes and enables timely response.",
    "risk_description": "Unmonitored risks drift outside tolerance without detection. Ineffective controls provide false assurance while risks materialize.",
    "implementation": {
      "requirements": [
        "Risk Monitoring Dashboard with defined KPIs, measurement methods, thresholds, and reporting cadence",
        "Metric Review Schedule with defined frequencies, responsible parties, and trigger conditions",
        "Control Effectiveness Assessment with defined methodology, criteria, and documented findings",
        "Post-Market Risk Update Report documenting methodology, findings, conclusions, and recommended actions",
        "Risk Trend Analysis identifying patterns, emerging risks, and forward-looking projections"
      ],
      "steps": [
        "Define Key Risk Indicators (KRIs) and monitoring thresholds",
        "Implement Risk Monitoring Dashboard in GRC platform",
        "Establish Metric Review Schedule with defined frequency",
        "Conduct periodic Control Effectiveness Assessments",
        "Generate Post-Market Risk Update Reports"
      ],
      "timeline": "Dashboard operational within 60 days; continuous monitoring thereafter."
    },
    "evidence_requirements": [
      "Risk Monitoring Dashboard",
      "Metric Review Schedule",
      "Control Effectiveness Assessment",
      "Post-Market Risk Update Report",
      "Risk Trend Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)",
          "context": "Risk management shall be continuous iterative process"
        },
        {
          "ref": "Article 9(2)(c)",
          "context": "Evaluate other risks from post-market monitoring data"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.5",
          "context": "Plan ongoing monitoring and periodic review"
        },
        {
          "ref": "MEASURE.1.2",
          "context": "Regularly assess appropriateness of metrics"
        },
        {
          "ref": "MEASURE.3.1",
          "context": "Establish approaches to track existing and emergent risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.1",
          "context": "Determine what needs to be monitored and measured"
        },
        {
          "ref": "Clause 9.3.2",
          "context": "Management review shall consider results of risk assessment"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Monitoring",
      "maturity_enhancement": "Continuous monitoring essential for Level 4 (Quantitatively Managed) maturity"
    }
  },
  {
    "control_id": "RISK-RESID-01",
    "control_title": "Residual Risk Acceptance",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document, evaluate, and obtain explicit risk owner approval for all residual AI risks remaining after treatment implementation, ensuring residual risk levels are within organizational risk tolerance and communicated to affected parties.",
    "control_objective": "Ensure conscious acceptance of remaining AI risks with appropriate approval authority and transparent communication to stakeholders.",
    "risk_description": "Unacknowledged residual risks become invisible liabilities. Residual risks exceeding tolerance expose to unacceptable harms.",
    "implementation": {
      "requirements": [
        "Residual Risk Register capturing risk descriptions, likelihood/impact scores, owners, and mitigation status",
        "Risk Acceptance Form with Signatures documenting residual risk levels, acceptance rationale, and authorized sign-off",
        "Residual Risk Communication to Users quantifying remaining risk after controls with formal acceptance sign-off",
        "Acceptable Risk Threshold Documentation with version control, approval signatures, and distribution records"
      ],
      "steps": [
        "Calculate and document residual risk levels",
        "Compare against Acceptable Risk Threshold criteria",
        "Prepare Risk Acceptance Form following documented standards and quality requirements",
        "Obtain Risk Owner Approval with documented justification and authorization chain",
        "Develop Residual Risk Communication for users incorporating stakeholder input and industry best practices"
      ],
      "timeline": "Residual assessment within 30 days of treatment completion; communication prior to deployment."
    },
    "evidence_requirements": [
      "Residual Risk Register",
      "Risk Acceptance Form with Signatures",
      "Residual Risk Communication to Users",
      "Acceptable Risk Threshold Documentation",
      "Risk Owner Approval Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(5)",
          "context": "Residual risk shall be judged acceptable"
        },
        {
          "ref": "risks shall be communicated to users",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.1.3",
          "context": "Risk response options include accepting residual risk"
        },
        {
          "ref": "MANAGE.1.4",
          "context": "Document negative residual risks to acquirers and end users"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.3",
          "context": "Risk treatment plan shall include obtaining risk owners' approval and acceptance of residual AI risks"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Acceptance",
      "maturity_enhancement": "Explicit residual risk acceptance supports Level 3 maturity with documented risk decisions"
    }
  },
  {
    "control_id": "RISK-SOA-01",
    "control_title": "Statement of Applicability",
    "category": "AI Risk Management",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL produce and maintain a Statement of Applicability (SoA) that documents all controls considered necessary for AI risk management, with explicit justification for control inclusions and exclusions based on risk assessment results and organizational context.",
    "control_objective": "Demonstrate comprehensive control selection rationale and enable auditors to verify that appropriate controls address identified AI risks.",
    "risk_description": "Missing Statement of Applicability prevents auditors from verifying control coverage. Undocumented exclusions create audit findings.",
    "implementation": {
      "requirements": [
        "Statement of Applicability Document with version control, approval signatures, and distribution records",
        "Control Justification Matrix mapping roles, responsibilities, and accountability assignments",
        "Excluded Control Rationale with documented scope, methodology, and acceptance criteria",
        "Compliance Mapping Table linking each control to applicable regulatory and standard requirements with coverage status"
      ],
      "steps": [
        "Compile comprehensive list of potential controls from ISO 42001 Annex A and NIST AI RMF",
        "Evaluate each control against risk assessment results",
        "Document inclusion/exclusion decisions with explicit rationale",
        "Create Control Justification Matrix tracing controls to risks",
        "Map selected controls to compliance frameworks ensuring complete traceability and coverage"
      ],
      "timeline": "Initial SoA within 90 days of risk assessment; update with each risk assessment cycle."
    },
    "evidence_requirements": [
      "Statement of Applicability Document",
      "Control Justification Matrix",
      "Excluded Control Rationale",
      "Compliance Mapping Table",
      "Annex A Control Mapping Workbook"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "Supports demonstration of comprehensive risk treatment"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A",
          "context": "Supports overall risk treatment documentation"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.3",
          "context": "Produce Statement of Applicability containing necessary controls and justification for inclusions and exclusions"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Control Framework",
      "maturity_enhancement": "Statement of Applicability required for ISO 42001 certification; supports Level 3 maturity"
    }
  },
  {
    "control_id": "RISK-SYS-01",
    "control_title": "Risk Management System Establishment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish, implement, document, and maintain a comprehensive AI risk management system that operates as a continuous iterative process throughout the entire AI system lifecycle, integrated with the organization's enterprise risk management framework.",
    "control_objective": "Provide systematic, structured approach to identifying, assessing, treating, and monitoring AI-related risks across all lifecycle phases.",
    "risk_description": "Without systematic risk management, AI risks are addressed ad-hoc leading to inconsistent treatment. EU AI Act Article 9 non-compliance results in regulatory penalties.",
    "implementation": {
      "requirements": [
        "Risk Management Policy establishing scope, principles, roles, responsibilities, and compliance requirements",
        "Risk Assessment Procedure detailing workflows, decision points, roles, and documentation requirements",
        "Risk Register capturing risk descriptions, likelihood/impact scores, owners, and mitigation status",
        "Risk Treatment Plan specifying control measures, responsible owners, timelines, and success criteria",
        "Monitoring Schedule with defined frequencies, responsible parties, and trigger conditions"
      ],
      "steps": [
        "Develop Risk Management Policy aligned with ISO 31000",
        "Create Risk Assessment Procedure incorporating NIST AI RMF",
        "Implement Risk Register in GRC platform with pilot validation and phased organizational rollout",
        "Establish Risk Treatment Plan template with documented approval and stakeholder sign-off",
        "Configure Monitoring Schedule with validation testing and documented configuration baseline"
      ],
      "timeline": "Policy and procedure within 60 days; fully operational within 90 days."
    },
    "evidence_requirements": [
      "Risk Management Policy",
      "Risk Assessment Procedure",
      "Risk Register",
      "Risk Treatment Plan",
      "Monitoring Schedule"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(1)",
          "context": "Risk management system shall be established and maintained"
        },
        {
          "ref": "Article 9(2)",
          "context": "Continuous iterative process throughout lifecycle"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.4",
          "context": "Establish AI risk management process through transparent policies"
        },
        {
          "ref": "GOVERN.1.5",
          "context": "Plan ongoing monitoring and periodic review"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.1",
          "context": "Determine risks and opportunities"
        },
        {
          "ref": "Clause 6.1.2",
          "context": "Define AI risk assessment process"
        },
        {
          "ref": "Clause 6.1.3",
          "context": "Define AI risk treatment process"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Framework",
      "maturity_enhancement": "Comprehensive risk management foundational for Level 2 maturity"
    }
  },
  {
    "control_id": "RISK-TREAT-01",
    "control_title": "Risk Treatment Planning",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL develop, document, and implement risk treatment plans for all significant AI risks, selecting appropriate treatment options (eliminate, mitigate, transfer, accept) with documented rationale, control implementation schedules, and risk owner approvals.",
    "control_objective": "Reduce AI risk exposure through systematic implementation of appropriate risk treatments with clear accountability and timelines.",
    "risk_description": "Untreated risks accumulate until they manifest as incidents. Delayed control implementation extends risk exposure windows.",
    "implementation": {
      "requirements": [
        "Risk Treatment Plan specifying control measures, responsible owners, timelines, and success criteria",
        "Control Implementation Schedule with sequenced milestones, dependencies, resource assignments, and checkpoints",
        "Residual Risk Documentation quantifying remaining risk after controls with formal acceptance sign-off",
        "Risk Response Strategy Matrix categorizing accept, avoid, transfer, and mitigate options for each risk level",
        "Risk Owner Approvals confirming acceptance of residual risk levels with dated authorizations"
      ],
      "steps": [
        "Evaluate risk treatment options per ISO 31000 using documented criteria and comparative analysis",
        "Develop Risk Treatment Plan with specific controls",
        "Create Control Implementation Schedule with documented requirements and quality criteria",
        "Document expected Residual Risk levels with version control and stakeholder review",
        "Obtain Risk Owner Approvals via sign-off with documented justification and authorization chain"
      ],
      "timeline": "Treatment plans within 30 days of risk evaluation; implementation per approved schedule."
    },
    "evidence_requirements": [
      "Risk Treatment Plan",
      "Control Implementation Schedule",
      "Residual Risk Documentation",
      "Risk Response Strategy Matrix",
      "Risk Owner Approvals"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)(d)",
          "context": "Adopt appropriate risk management measures"
        },
        {
          "ref": "Article 9(5)(a)",
          "context": "Eliminate or reduce risks through adequate design"
        },
        {
          "ref": "Article 9(5)(b)",
          "context": "Implement mitigation for risks that cannot be eliminated"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.1.3",
          "context": "Develop and document AI risk response options"
        },
        {
          "ref": "MANAGE.1.4",
          "context": "Document negative residual risks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 6.1.3",
          "context": "Select AI risk treatment options"
        },
        {
          "ref": "Determine controls",
          "context": ""
        },
        {
          "ref": "Formulate treatment plan",
          "context": ""
        },
        {
          "ref": "Clause 8.3",
          "context": "Implement AI risk treatment plan"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Risk Treatment",
      "maturity_enhancement": "Systematic treatment planning core to Level 2 maturity with documented risk responses"
    }
  },
  {
    "control_id": "RISK-VULN-01",
    "control_title": "Vulnerable Population Risk Assessment",
    "category": "AI Risk Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct specific risk assessments evaluating potential adverse impacts on vulnerable populations including children, persons with disabilities, elderly persons, and other protected groups who may be disproportionately affected by AI system decisions.",
    "control_objective": "Ensure AI systems do not cause disproportionate harm to vulnerable populations who may have reduced capacity to understand, contest, or avoid AI-driven decisions.",
    "risk_description": "Vulnerable populations suffer disproportionate harm from AI designed without considering their needs. Child safety failures create significant regulatory and reputational risk.",
    "implementation": {
      "requirements": [
        "Vulnerable Population Impact Assessment evaluating likelihood, severity, affected populations, and mitigation options",
        "Child Safety Review with documented scope, methodology, and acceptance criteria",
        "Accessibility Impact Analysis with defined methodology, criteria, and documented findings",
        "Protected Group Risk Register capturing risk descriptions, likelihood/impact scores, owners, and mitigation status"
      ],
      "steps": [
        "Identify all vulnerable populations potentially affected based on use case and deployment context",
        "Conduct specialized Vulnerable Population Impact Assessment using appropriate expertise",
        "Perform Child Safety Review per Article 9",
        "Complete Accessibility Impact Analysis for users with disabilities"
      ],
      "timeline": "Assessment during design phase; validation before deployment; ongoing monitoring."
    },
    "evidence_requirements": [
      "Vulnerable Population Impact Assessment",
      "Child Safety Review",
      "Accessibility Impact Analysis",
      "Protected Group Risk Register",
      "Vulnerable Population Consultation Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(9)",
          "context": "Providers shall consider whether high-risk AI likely to adversely impact persons under 18 and other vulnerable groups"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.5.1",
          "context": "Identify likelihood and magnitude of impacts"
        },
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate fairness and bias impacts on protected groups"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.5.4",
          "context": "Consider specific protection needs of children, impaired persons, elderly persons, and workers"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Risk Management Domain",
      "area": "Vulnerable Population Protection",
      "maturity_enhancement": "Vulnerable population assessment mandatory for high-risk AI compliance; supports Level 3 maturity"
    }
  },
  {
    "control_id": "DEV-ARCH-01",
    "control_title": "AI Architecture and Design Documentation",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document AI system architecture including component structure, interfaces, data flows, algorithm integration, hardware/software interactions, and design decisions with explicit rationale for key architectural choices.",
    "control_objective": "Enable system understanding, maintenance, and risk assessment through comprehensive architecture documentation.",
    "risk_description": "Undocumented architecture hinders maintenance, troubleshooting, and knowledge transfer. Missing design rationale prevents understanding of key decisions. Lack of component documentation impedes security and risk assessment.",
    "implementation": {
      "requirements": [
        "System Architecture Document with views (logical, physical, deployment)",
        "Component Diagram with interfaces and dependencies",
        "Algorithm Specification describing AI/ML components with documented scope, methodology, and acceptance criteria",
        "Design Decision Log with Rationale for key choices",
        "Software Integration Description with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Define system boundaries and identify all components including AI/ML elements",
        "Document component interfaces, data flows, and integration points",
        "Specify algorithm placement within architecture with input/output specifications",
        "Record design decisions with rationale, alternatives considered, and trade-offs",
        "Describe hardware/software integration including deployment configurations"
      ],
      "timeline": "During design phase; updated with architectural changes; reviewed before deployment."
    },
    "evidence_requirements": [
      "System Architecture Document",
      "Component Diagram",
      "Algorithm Specification",
      "Design Decision Log with Rationale",
      "Software Integration Description"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(1)(b)",
          "context": "Description of how system interacts with hardware/software"
        },
        {
          "ref": "Annex IV(2)(b)",
          "context": "Design specifications"
        },
        {
          "ref": "Annex IV(2)(c)",
          "context": "System architecture description"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.1",
          "context": "Define specific tasks and methods"
        },
        {
          "ref": "MAP.4.2",
          "context": "Document internal risk controls for all components"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.3",
          "context": "Document AI system design and development"
        },
        {
          "ref": "Clause A.4.2",
          "context": "Identify and document relevant resources"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "System Design",
      "maturity_enhancement": "Architecture documentation supports Level 3 maturity with comprehensive design records"
    }
  },
  {
    "control_id": "DEV-DEPLOY-01",
    "control_title": "AI System Deployment Planning and Readiness",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish a formal deployment planning process that includes release criteria validation, pre-deployment conformity assessment, environment readiness verification, rollback procedures, and documented approval sign-off before any AI system is placed into production.",
    "control_objective": "Ensure AI systems are validated, reliable, and meet all requirements before deployment to production environments.",
    "risk_description": "Deploying AI systems without formal readiness validation risks production failures, data corruption, and service outages. Missing rollback procedures prevent rapid recovery from deployment failures. Absence of conformity assessment violates EU AI Act Article 16(f) for high-risk systems.",
    "implementation": {
      "requirements": [
        "Deployment Plan documenting deployment strategy, environment targets, and timeline",
        "Release Criteria Checklist with measurable go/no-go thresholds",
        "Pre-Deployment Validation Results including performance benchmarks against acceptance criteria",
        "Deployment Approval Sign-off from system owner, risk manager, and compliance officer",
        "Rollback Plan with tested procedures and recovery time objectives"
      ],
      "steps": [
        "Define deployment plan including canary, blue-green, or staged rollout strategy",
        "Establish measurable release criteria covering performance, security, fairness, and compliance thresholds",
        "Execute pre-deployment validation testing in staging environment mirroring production",
        "Conduct environment readiness assessment including infrastructure capacity, monitoring, and alerting",
        "Obtain formal deployment approval with documented sign-off from all required stakeholders"
      ],
      "timeline": "Initiated during development; completed and validated before each production deployment."
    },
    "evidence_requirements": [
      "Deployment Plan",
      "Release Criteria Checklist",
      "Pre-Deployment Validation Results",
      "Deployment Approval Sign-off",
      "Rollback Plan",
      "Environment Readiness Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(f)",
          "context": "High-risk AI system shall undergo relevant conformity assessment procedure prior to placing on market or putting into service"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.1.1",
          "context": "Determine whether AI development or deployment should proceed"
        },
        {
          "ref": "MEASURE.2.5",
          "context": "Demonstrate deployed AI system is valid and reliable"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.5",
          "context": "Document a deployment plan and ensure requirements are met prior to deployment"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Formal deployment processes required for Level 3 maturity with controlled release management"
    }
  },
  {
    "control_id": "DEV-ENV-01",
    "control_title": "Environmental Sustainability Assessment",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL assess, document, and actively manage the environmental impact of AI system training, inference, and operational activities, including energy consumption measurement, carbon footprint calculation, and evaluation of computational efficiency alternatives.",
    "control_objective": "Ensure AI systems are developed and operated with documented environmental impact awareness and active sustainability management.",
    "risk_description": "Unmeasured AI energy consumption creates uncontrolled operational costs and reputational risk. Growing regulatory focus on AI sustainability (EU Green Deal alignment) creates future compliance exposure. Failure to evaluate efficient alternatives wastes computational resources and increases carbon footprint unnecessarily.",
    "implementation": {
      "requirements": [
        "Energy Consumption Assessment documenting kWh usage for training and inference workloads",
        "Carbon Footprint Calculation using recognized methodology (GHG Protocol, ISO 14064)",
        "Green AI Alternatives Evaluation comparing model architectures, quantization, distillation, and efficient training techniques",
        "Computational Efficiency Report tracking FLOPs-per-inference and energy-per-query metrics",
        "Environmental Impact Statement summarizing findings and mitigation commitments"
      ],
      "steps": [
        "Instrument training and inference pipelines to measure energy consumption using tools (CodeCarbon, ML CO2 Impact)",
        "Calculate carbon footprint using grid emission factors for data center locations",
        "Evaluate green AI alternatives including model pruning, knowledge distillation, quantization, and efficient architectures",
        "Benchmark computational efficiency across model versions and deployment configurations",
        "Produce Environmental Impact Statement with year-over-year comparisons and reduction targets"
      ],
      "timeline": "Initial assessment during model training; updated with each retraining cycle; annual sustainability report."
    },
    "evidence_requirements": [
      "Energy Consumption Assessment",
      "Carbon Footprint Calculation",
      "Green AI Alternatives Evaluation",
      "Computational Efficiency Report",
      "Environmental Impact Statement"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A",
          "context": "No specific EU AI Act article"
        },
        {
          "ref": "however sustainability increasingly relevant to conformity assessment",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.12",
          "context": "Assess and document environmental impact and sustainability of AI model training and management activities"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.4.5",
          "context": "Impact of hardware used including environmental impact"
        },
        {
          "ref": "Clause A.5.5",
          "context": "Societal impacts include environmental sustainability"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Environmental sustainability assessment supports Level 3 maturity with responsible AI operations"
    }
  },
  {
    "control_id": "DEV-HUM-01",
    "control_title": "Human-AI Interaction Design",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define and document human-AI interaction configurations, establish meaningful human oversight processes at each critical decision point, and implement override mechanisms that enable authorized personnel to disregard, override, or halt AI system outputs.",
    "control_objective": "Ensure AI systems are designed to be effectively overseen by natural persons who can correctly interpret outputs and exercise meaningful control over system behavior.",
    "risk_description": "Without formal human oversight design, operators may be unable to intervene when AI systems produce harmful outputs. Missing override mechanisms create single points of failure where erroneous AI decisions cannot be corrected. Non-compliance with EU AI Act Article 14 for high-risk systems results in market prohibition.",
    "implementation": {
      "requirements": [
        "Human-AI Interaction Design Document specifying roles and responsibilities",
        "Override Mechanism Specification with technical implementation details",
        "Decision Support Interface Design ensuring correct output interpretation",
        "User Control Flow Diagram mapping all human decision points",
        "Human-in-the-Loop Protocol defining escalation triggers and intervention procedures"
      ],
      "steps": [
        "Map all AI system decision points requiring human oversight using BPMN or similar notation",
        "Define HITL, HOTL, and HOOTL configurations for each decision point based on risk level",
        "Design override mechanisms with kill-switch capability, confidence threshold alerts, and manual intervention workflows",
        "Develop decision support interfaces that present AI outputs with confidence scores, explanations, and alternative options",
        "Test override mechanisms under simulated failure conditions and adversarial scenarios"
      ],
      "timeline": "During system design phase; validated before deployment; reviewed after operational incidents."
    },
    "evidence_requirements": [
      "Human-AI Interaction Design Document",
      "Override Mechanism Specification",
      "Decision Support Interface Design",
      "User Control Flow Diagram",
      "Human-in-the-Loop Protocol"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(1)",
          "context": "High-risk AI systems designed for effective human oversight"
        },
        {
          "ref": "Article 14(4)(c)",
          "context": "Enable operator to correctly interpret system output"
        },
        {
          "ref": "Article 14(4)(d)",
          "context": "Enable decision to disregard, not use, or override output"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.3.2",
          "context": "Define and differentiate roles for human-AI configurations"
        },
        {
          "ref": "MAP.3.5",
          "context": "Define human oversight processes for AI system decisions"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.9.3",
          "context": "Determine stages for meaningful human oversight"
        },
        {
          "ref": "Clause A.6.2.3",
          "context": "Human interaction methods in design"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Human oversight mechanisms essential for Level 3 maturity with effective human-AI collaboration"
    }
  },
  {
    "control_id": "DEV-INFRA-01",
    "control_title": "Hardware and Computing Resources Documentation",
    "category": "AI Development Lifecycle",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document hardware and computing resources required for AI system operation, including infrastructure specifications, deployment architecture, environmental impact assessment, and resource capacity planning.",
    "control_objective": "Ensure AI systems have appropriate infrastructure support and environmental considerations are addressed.",
    "risk_description": "Undocumented hardware requirements lead to deployment failures and performance issues. Missing capacity planning causes service degradation under load. Unassessed environmental impact ignores sustainability obligations.",
    "implementation": {
      "requirements": [
        "Hardware Requirements Specification for training and inference",
        "Computing Resource Inventory listing all infrastructure components",
        "Cloud/On-Premise Deployment Architecture diagrams with component specs, integration points, and design rationale",
        "Environmental Impact Assessment including energy consumption and carbon footprint",
        "Resource Capacity Plan for scaling with milestones, responsible parties, resource needs, and success criteria"
      ],
      "steps": [
        "Specify hardware requirements for training and inference including GPU/TPU needs",
        "Document computing resource inventory across environments",
        "Define deployment architecture for cloud, on-premise, or hybrid configurations",
        "Conduct environmental impact assessment including energy consumption estimates",
        "Develop resource capacity plan for anticipated scaling requirements"
      ],
      "timeline": "During design phase; updated for deployment; monitored during operation."
    },
    "evidence_requirements": [
      "Hardware Requirements Specification",
      "Computing Resource Inventory",
      "Cloud/On-Premise Deployment Architecture",
      "Environmental Impact Assessment",
      "Resource Capacity Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(1)(e)",
          "context": "Description of hardware on which system is intended to run"
        },
        {
          "ref": "Annex IV(2)(c)",
          "context": "Computational resources used"
        },
        {
          "ref": "Article 13(3)(e)",
          "context": "Resources needed and expected lifetime"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A",
          "context": "No specific NIST AI RMF mapping"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.4.5",
          "context": "Document system and computing resources"
        },
        {
          "ref": "Clause A.4.2",
          "context": "Identify and document relevant resources"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Infrastructure",
      "maturity_enhancement": "Infrastructure documentation supports Level 2 maturity with operational readiness"
    }
  },
  {
    "control_id": "DEV-LIFE-01",
    "control_title": "AI System Lifecycle Stage Management",
    "category": "AI Development Lifecycle",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a lifecycle stage management framework that defines lifecycle stages, transition criteria, stage gate reviews, and inventory tracking for all AI systems from conception through decommissioning.",
    "control_objective": "Ensure all AI systems are tracked through defined lifecycle stages with appropriate governance applied at each transition.",
    "risk_description": "Without lifecycle stage management, AI systems operate without appropriate governance controls for their current maturity level. Missing stage gate reviews allow systems to progress without required validations. Lack of lifecycle tracking prevents portfolio-level risk management and resource planning.",
    "implementation": {
      "requirements": [
        "Lifecycle Stage Definition Document specifying all stages (concept, development, testing, deployment, operation, retirement)",
        "Stage Transition Criteria with measurable thresholds for each gate",
        "Current Stage Register maintaining real-time status of all AI systems",
        "Stage Gate Review Records documenting review outcomes and decisions",
        "Lifecycle Process Map visualizing workflows, roles, and dependencies"
      ],
      "steps": [
        "Define AI system lifecycle stages aligned with organizational SDLC and ISO/IEC 42001 requirements",
        "Establish measurable transition criteria for each stage gate including required artifacts, approvals, and quality thresholds",
        "Implement lifecycle tracking in AI system inventory (ServiceNow, Jira, or dedicated AI registry tool)",
        "Conduct stage gate reviews with cross-functional representation from development, risk, compliance, and business",
        "Maintain current stage register with automated status updates and notification triggers"
      ],
      "timeline": "Established during AI management system setup; applied to all AI systems continuously."
    },
    "evidence_requirements": [
      "Lifecycle Stage Definition Document",
      "Stage Transition Criteria",
      "Current Stage Register",
      "Stage Gate Review Records",
      "Lifecycle Process Map"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)",
          "context": "Risk management system shall consist of a continuous iterative process planned and run throughout the entire lifecycle"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.6",
          "context": "Establish mechanisms to inventory AI systems including lifecycle stage"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.1.3",
          "context": "Define specific processes for responsible design and development at various stages"
        },
        {
          "ref": "Clause A.6.2.2",
          "context": "Specify requirements for AI systems at each lifecycle stage"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Lifecycle management framework essential for Level 2 maturity with systematic AI governance"
    }
  },
  {
    "control_id": "DEV-MODEL-01",
    "control_title": "Algorithm and Model Selection Documentation",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document algorithm and model selection decisions including the rationale for choosing specific AI/ML techniques, model architecture, hyperparameters, optimization methods, and scientific integrity considerations with validation approach.",
    "control_objective": "Ensure algorithm and model choices are justified, traceable, and appropriate for the intended application.",
    "risk_description": "Undocumented algorithm choices prevent reproducibility and audit. Missing model specifications hinder debugging and improvement. Lack of Model Cards impedes transparency and appropriate use.",
    "implementation": {
      "requirements": [
        "Algorithm Selection Rationale documenting why specific technique was chosen",
        "Model Architecture Documentation with layer configurations and connections",
        "Hyperparameter Specification with tuning methodology",
        "Optimization Method Description including loss functions and convergence criteria",
        "Model Card following industry standard format with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Evaluate candidate algorithms against requirements and constraints",
        "Document rationale for algorithm selection including alternatives considered",
        "Specify model architecture with detailed layer configurations",
        "Record hyperparameter choices with tuning methodology and search space",
        "Describe optimization methods, loss functions, and convergence criteria"
      ],
      "timeline": "During model development; updated with retraining or architecture changes."
    },
    "evidence_requirements": [
      "Algorithm Selection Rationale",
      "Model Architecture Documentation",
      "Hyperparameter Specification",
      "Optimization Method Description",
      "Model Card"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(2)(a)",
          "context": "Methods and steps for development"
        },
        {
          "ref": "Annex IV(2)(b)",
          "context": "Design specifications including algorithms, classification choices, optimization parameters"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.1",
          "context": "Define AI techniques employed"
        },
        {
          "ref": "MAP.2.3",
          "context": "Document scientific integrity and TEVV considerations"
        },
        {
          "ref": "MEASURE.2.9",
          "context": "Explain and validate AI model"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.4.4",
          "context": "Document information about tooling resources including algorithm types and ML models"
        },
        {
          "ref": "Clause A.6.2.3",
          "context": "Design choices include ML approach, learning algorithm and model type"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Model Development",
      "maturity_enhancement": "Algorithm documentation essential for Level 3 maturity with scientific rigor and reproducibility"
    }
  },
  {
    "control_id": "DEV-MODEL-02",
    "control_title": "Pre-trained Model Management",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL maintain an inventory of all pre-trained models used in AI development, including provenance documentation, upstream model monitoring, third-party risk assessment, and license compliance verification.",
    "control_objective": "Ensure pre-trained model dependencies are tracked, assessed for risk, and compliant with licensing requirements.",
    "risk_description": "Untracked pre-trained models introduce hidden risks and biases. Missing provenance prevents understanding of model limitations. License violations create legal liability and potential service disruption.",
    "implementation": {
      "requirements": [
        "Pre-trained Model Inventory listing all foundation models and transfer learning sources",
        "Model Provenance Documentation including training data, methodology, and provider",
        "Upstream Model Update Tracker monitoring for updates and vulnerabilities",
        "Third-Party Model Risk Assessment evaluating bias, security, and reliability",
        "License Compliance Review verifying terms of use"
      ],
      "steps": [
        "Inventory all pre-trained models used in development including foundation models, embeddings, and transfer learning sources",
        "Document provenance including training data sources, methodology, and model provider",
        "Establish upstream model monitoring for updates, patches, and vulnerability disclosures",
        "Conduct risk assessment for third-party models covering bias, security, and reliability",
        "Verify license compliance for all models including commercial use restrictions"
      ],
      "timeline": "During model selection; continuous monitoring throughout development and operation."
    },
    "evidence_requirements": [
      "Pre-trained Model Inventory",
      "Model Provenance Documentation",
      "Upstream Model Update Tracker",
      "Third-Party Model Risk Assessment",
      "License Compliance Review"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(2)(a)",
          "context": "Methods and steps for development, including use of pre-trained systems or third-party tools"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.3.2",
          "context": "Monitor pre-trained models used in development"
        },
        {
          "ref": "MAP.4.1",
          "context": "Map legal risks of components including third-party tools"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.4.4",
          "context": "Document tooling resources"
        },
        {
          "ref": "Clause A.10.3",
          "context": "Ensure supplier alignment with responsible AI approach"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Model Management",
      "maturity_enhancement": "Pre-trained model management supports Level 3 maturity with supply chain visibility"
    }
  },
  {
    "control_id": "DEV-REQ-01",
    "control_title": "AI System Requirements Specification",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL elicit, document, and trace AI system requirements from all relevant stakeholders, including functional requirements, non-functional requirements (privacy, fairness, safety, security, performance), and technical specifications with clear acceptance criteria.",
    "control_objective": "Ensure AI systems are designed to meet explicit, validated requirements that address stakeholder needs and trustworthiness characteristics.",
    "risk_description": "Missing requirements lead to systems that fail to meet user needs. Undocumented non-functional requirements result in fairness, privacy, or safety failures. Lack of traceability prevents verification that all requirements are addressed.",
    "implementation": {
      "requirements": [
        "System Requirements Specification (SRS) following IEEE 830 or equivalent standard",
        "Functional Requirements Document with acceptance criteria",
        "Non-Functional Requirements for privacy, fairness, safety, security, performance, and explainability",
        "Stakeholder Requirements Traceability Matrix linking requirements to design elements"
      ],
      "steps": [
        "Identify all relevant AI actors and stakeholders including users, affected populations, and regulators",
        "Elicit requirements through structured interviews, workshops, and use case analysis",
        "Document functional requirements with testable acceptance criteria",
        "Specify non-functional requirements for each trustworthiness characteristic with measurable thresholds",
        "Create Requirements Traceability Matrix linking requirements to design and test cases"
      ],
      "timeline": "During project initiation; baseline before design; change-controlled throughout development."
    },
    "evidence_requirements": [
      "System Requirements Specification",
      "Functional Requirements Document",
      "Non-Functional Requirements (Privacy, Fairness, Safety)",
      "Stakeholder Requirements Traceability Matrix",
      "Requirements Acceptance Criteria"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(2)(b)",
          "context": "Design specifications including system logic, algorithms, key design choices, rationale, assumptions"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.1.6",
          "context": "Elicit system requirements from relevant AI actors"
        },
        {
          "ref": "MAP.2.1",
          "context": "Define specific tasks and methods used to implement AI system functions"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.2",
          "context": "Specify and document requirements for new AI systems"
        },
        {
          "ref": "Clause A.6.2.3",
          "context": "Document AI system design and development"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Requirements Engineering",
      "maturity_enhancement": "Comprehensive requirements specification essential for Level 2 maturity with traceable development"
    }
  },
  {
    "control_id": "DEV-UI-01",
    "control_title": "User Interface Documentation",
    "category": "AI Development Lifecycle",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document user interface specifications for all AI systems, including interface design rationale, interpretation aids, accessibility features, and user control mechanisms that enable deployers and end-users to understand and interact with AI outputs effectively.",
    "control_objective": "Ensure AI system interfaces provide clear, accessible, and interpretable information that enables users to understand system outputs and exercise appropriate control.",
    "risk_description": "Inadequate interface documentation prevents deployers from properly configuring and using AI systems. Missing interpretation aids lead to misunderstanding of AI outputs and inappropriate reliance on system recommendations. Failure to document interfaces violates EU AI Act Annex IV requirements for technical documentation.",
    "implementation": {
      "requirements": [
        "User Interface Specification documenting all UI components and interaction patterns",
        "Deployer Interface Documentation with integration requirements and configuration options",
        "Interpretation Aids Documentation including confidence displays, explanation features, and uncertainty indicators",
        "UI Accessibility Assessment per WCAG 2.1 AA standards with defined methodology, criteria, and documented findings",
        "User Control Documentation detailing available user actions and their effects"
      ],
      "steps": [
        "Document complete UI specification including all screens, controls, and information displays",
        "Create deployer-facing documentation with API endpoints, configuration parameters, and customization options",
        "Design and document interpretation aids such as confidence scores, feature importance displays, and natural language explanations",
        "Conduct accessibility assessment using automated tools (axe, WAVE) and manual testing with assistive technologies",
        "Document all user controls including data input validation, output filtering, and preference settings"
      ],
      "timeline": "During UI design phase; updated with each interface revision; accessibility validated before each release."
    },
    "evidence_requirements": [
      "User Interface Specification",
      "Deployer Interface Documentation",
      "Interpretation Aids Documentation",
      "UI Accessibility Assessment",
      "User Control Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(1)(g)",
          "context": "Basic description of user-interface provided to deployer"
        },
        {
          "ref": "Annex IV(1)(h)",
          "context": "Instructions for use including human oversight measures"
        },
        {
          "ref": "Article 13(3)(d)",
          "context": "Human oversight measures including technical measures"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A",
          "context": "No specific NIST AI RMF mapping for UI documentation"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.8.2",
          "context": "Determine and provide necessary information to users"
        },
        {
          "ref": "Clause A.6.2.3",
          "context": "Interface and output presentation design"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive UI documentation supports Level 2 maturity with user-centered AI transparency"
    }
  },
  {
    "control_id": "DEV-USE-01",
    "control_title": "Intended Purpose Definition",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define, document, and formally approve the intended purpose of each AI system, including specific use cases, operational domain, target users, beneficial applications, and explicit boundaries defining in-scope and out-of-scope uses.",
    "control_objective": "Establish clear boundaries for AI system application that enable appropriate design, testing, and deployment while preventing misuse.",
    "risk_description": "Undefined intended purpose leads to scope creep and misuse. Missing use case specifications result in inappropriate deployment contexts. Lack of boundaries enables harmful or unvalidated applications.",
    "implementation": {
      "requirements": [
        "Intended Use Statement with approved scope defining target users, operating conditions, and boundary constraints",
        "Business Case Document linking AI to organizational value",
        "Use Case Specifications with user stories and scenarios",
        "Operational Domain Definition specifying deployment context",
        "In-Scope/Out-of-Scope Application List with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Elicit use cases from stakeholders through interviews and workshops",
        "Define operational domain including geographic, technical, and user constraints",
        "Specify target users and deployment environments",
        "Document beneficial uses and expected business value",
        "Explicitly list out-of-scope applications and prohibited uses"
      ],
      "timeline": "During project initiation; before design phase begins; updated with scope changes."
    },
    "evidence_requirements": [
      "Intended Use Statement",
      "Business Case Document",
      "Use Case Specifications",
      "Operational Domain Definition",
      "In-Scope/Out-of-Scope Application List"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)",
          "context": "Instructions shall contain information relevant to deployer including intended purpose"
        },
        {
          "ref": "Annex IV(1)(a)",
          "context": "Intended purpose, provider name, and version of system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.1.1",
          "context": "Document intended purposes and beneficial uses"
        },
        {
          "ref": "MAP.1.4",
          "context": "Define business value and context of use"
        },
        {
          "ref": "MAP.3.4",
          "context": "Specify targeted application scope"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.2",
          "context": "Specify and document requirements for new AI systems"
        },
        {
          "ref": "Clause A.9.4",
          "context": "Ensure AI system is used according to intended uses"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Requirements Definition",
      "maturity_enhancement": "Intended purpose definition foundational for Level 2 maturity; enables scope control and validation"
    }
  },
  {
    "control_id": "DEV-USE-02",
    "control_title": "System Limitations Documentation",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document all known limitations of AI systems including knowledge boundaries, conditions affecting performance, generalizability constraints, failure modes, and circumstances under which the system should not be used.",
    "control_objective": "Ensure users and operators understand AI system boundaries and can make informed decisions about appropriate use.",
    "risk_description": "Undocumented limitations lead to misuse in inappropriate contexts. Users unable to recognize failure conditions causing harm. Hidden boundaries cause unexpected errors in production with no warning.",
    "implementation": {
      "requirements": [
        "System Limitations Document covering all known constraints",
        "Knowledge Boundary Specification defining what the system can and cannot do",
        "Generalizability Assessment across populations and contexts",
        "Failure Mode Documentation with probability estimates where feasible",
        "Conditions of Non-Use Statement with documented scope, methodology, and acceptance criteria"
      ],
      "steps": [
        "Identify knowledge limits through testing, analysis, and subject matter expert review",
        "Document circumstances affecting performance including environmental, data quality, and operational factors",
        "Assess generalizability across different populations, geographies, and use contexts",
        "Catalog known failure modes with triggers and consequences",
        "Define conditions where system should not be used with measurable criteria and documented rationale"
      ],
      "timeline": "During development; validated in testing; communicated before deployment; updated based on operational experience."
    },
    "evidence_requirements": [
      "System Limitations Document",
      "Knowledge Boundary Specification",
      "Generalizability Assessment",
      "Failure Mode Documentation",
      "Conditions of Non-Use Statement"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)(b)(ii)",
          "context": "Instructions shall specify circumstances that may impact expected performance"
        },
        {
          "ref": "Article 13(3)(b)(iii)",
          "context": "Known or foreseeable circumstances that may lead to risks"
        },
        {
          "ref": "Annex IV(3)",
          "context": "Technical documentation requirements"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.2",
          "context": "Document AI system knowledge limits and how output will be utilized"
        },
        {
          "ref": "MEASURE.2.5",
          "context": "Document limitations of generalizability"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Specify criteria for verification and validation"
        },
        {
          "ref": "Clause A.8.2",
          "context": "Information should include technical requirements and limitations"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Transparency",
      "maturity_enhancement": "Limitations documentation supports Level 3 maturity with comprehensive system understanding"
    }
  },
  {
    "control_id": "DEV-VER-01",
    "control_title": "Software Version Control and Dependencies",
    "category": "AI Development Lifecycle",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement software version control for all AI system components, maintain Software Bill of Materials (SBOM), document dependencies, and establish processes for managing updates and patches.",
    "control_objective": "Ensure AI software components are tracked, reproducible, and maintainable with clear dependency management.",
    "risk_description": "Missing version control prevents reproducibility and rollback capability. Undocumented dependencies create security vulnerabilities and compatibility issues. Lack of SBOM impedes supply chain security and vulnerability management.",
    "implementation": {
      "requirements": [
        "Software Bill of Materials (SBOM) in standard format (SPDX, CycloneDX)",
        "Version Control Log with commit history and release tags",
        "Dependency Management Document specifying all libraries and versions",
        "Firmware Version Registry for embedded components with documented scope, methodology, and acceptance criteria",
        "Update Requirements Specification defining patch management process"
      ],
      "steps": [
        "Implement version control system (Git) for all code artifacts including models, configurations, and scripts",
        "Generate and maintain SBOM using automated tools (Syft, Trivy)",
        "Document all dependencies with version constraints and update policies",
        "Establish firmware version registry for any embedded or edge components",
        "Define update requirements and patch management processes"
      ],
      "timeline": "From project initiation; continuous throughout development and operation."
    },
    "evidence_requirements": [
      "Software Bill of Materials (SBOM)",
      "Version Control Log",
      "Dependency Management Document",
      "Firmware Version Registry",
      "Update Requirements Specification"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(1)(c)",
          "context": "Versions of relevant software/firmware and version update requirements"
        },
        {
          "ref": "Annex IV(1)(d)",
          "context": "All forms in which system is placed on market"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A",
          "context": "No specific NIST AI RMF mapping"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.3",
          "context": "Document software and hardware components"
        },
        {
          "ref": "Clause A.6.2.6",
          "context": "Processes for system updates"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Development Lifecycle Domain",
      "area": "Configuration Management",
      "maturity_enhancement": "Version control essential for Level 2 maturity with reproducibility and security"
    }
  },
  {
    "control_id": "DATA-ASSUM-01",
    "control_title": "Data Assumptions Documentation",
    "category": "AI Data Management",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document all assumptions about what data are intended to measure and represent, including construct validity analysis, measurement validity assessments, data-to-concept mappings, and an assumption risk register tracking assumption dependencies and potential failure modes.",
    "control_objective": "Ensure all assumptions about data meaning, measurement validity, and representational scope are explicitly documented, validated, and monitored for ongoing accuracy.",
    "risk_description": "Undocumented data assumptions allow invalid proxy variables and measurement errors to persist undetected, leading to models that optimize for the wrong constructs. Violated assumptions about data meaning can cause catastrophic model failures when deployed in contexts where assumptions do not hold. Non-compliance with EU AI Act Article 10(2)(d) requirement for documented assumptions about data measurement and representation.",
    "implementation": {
      "requirements": [
        "Data Assumptions Document cataloging all explicit and implicit assumptions about what each data field measures, represents",
        "Measurement Validity Analysis assessing whether data variables actually measure the constructs they are intended to represent",
        "Construct Validation Report documenting evidence for convergent, discriminant, and predictive validity of key measurement variables",
        "Data-to-Concept Mapping linking each data field to its intended conceptual meaning, measurement method, and known limitations",
        "Assumption Risk Register tracking each assumption's confidence level, dependency impact, validation status, and failure consequence"
      ],
      "steps": [
        "Catalog all data assumptions by conducting structured assumption elicitation sessions with data scientists, domain experts, and stakeholders for each AI system",
        "Perform measurement validity analysis for key variables assessing face validity, content validity, and criterion validity against established domain standards",
        "Conduct construct validation using statistical methods (factor analysis, convergent/discriminant correlation analysis) to verify data variables measure intended",
        "Create data-to-concept mappings linking each data field to its conceptual definition, measurement methodology, known proxies, and documented limitations or confounds",
        "Build assumption risk register rating each assumption on confidence level (high/medium/low), impact if violated, validation frequency, and responsible owner"
      ],
      "timeline": "Initial documentation during system design; construct validation during data preparation; assumption risk register reviewed quarterly and upon model retraining"
    },
    "evidence_requirements": [
      "Data Assumptions Document",
      "Measurement Validity Analysis",
      "Construct Validation Report",
      "Data-to-Concept Mapping",
      "Assumption Risk Register"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(d)",
          "context": "Data governance shall address formulation of assumptions, notably with respect to what the data are supposed to measure and represent"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.2",
          "context": "Document system assumptions, limitations, and constraints"
        },
        {
          "ref": "MAP.2.3",
          "context": "Document what data are supposed to measure and represent"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.2",
          "context": "Define and document data management processes including assumption documentation"
        },
        {
          "ref": "Clause A.6.2.2",
          "context": "Document rationale for developing AI system including data assumptions"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Explicit assumption documentation essential for Level 2 maturity with validated measurement constructs and monitored assumption dependencies"
    }
  },
  {
    "control_id": "DATA-BIAS-01",
    "control_title": "Bias Detection in Training Data",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement systematic bias detection processes for all training data sets, including bias taxonomy application, demographic distribution analysis, historical bias identification, protected attribute analysis, and documented assessment reports with remediation recommendations aligned with fairness objectives defined in the MAP function.",
    "control_objective": "Ensure training data sets are systematically examined for biases that could affect health and safety, fundamental rights, or lead to prohibited discrimination in AI system outputs.",
    "risk_description": "Undetected training data bias propagates discriminatory patterns into AI model outputs, creating disparate impact on protected groups and violating fundamental rights. Absence of systematic bias assessment prevents identification of historical and representation biases until discriminatory outcomes are reported by affected populations. Direct non-compliance with EU AI Act Article 10(2)(f) requirement to examine data sets for biases affecting health, safety, and fundamental rights.",
    "implementation": {
      "requirements": [
        "Training Data Bias Assessment Report documenting comprehensive bias analysis results, identified biases, severity ratings",
        "Bias Taxonomy Applied to Dataset mapping recognized bias types",
        "Demographic Distribution Analysis comparing data set demographic distributions against target population and identifying",
        "Historical Bias Identification documenting known historical biases embedded in data sources and assessing their propagation risk to model outputs",
        "Protected Attribute Analysis examining correlations between protected attributes"
      ],
      "steps": [
        "Apply bias taxonomy framework",
        "Conduct demographic distribution analysis comparing data set composition against target population demographics using statistical divergence measures",
        "Perform historical bias identification by analyzing temporal patterns, source system biases",
        "Execute protected attribute analysis examining direct representation and proxy correlations using tools",
        "Generate comprehensive bias assessment report with severity ratings (critical/high/medium/low), quantified bias metrics, affected subpopulations"
      ],
      "timeline": "Initial bias assessment during data preparation; protected attribute analysis before model training"
    },
    "evidence_requirements": [
      "Training Data Bias Assessment Report",
      "Bias Taxonomy Applied to Dataset",
      "Demographic Distribution Analysis",
      "Historical Bias Identification",
      "Protected Attribute Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(f)",
          "context": "Data sets shall be examined in view of possible biases that are likely to affect the health and safety of persons, have a negative impact on fundamental rights, or lead to discrimination prohibited under Union law"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate fairness and bias as identified in the MAP function across demographic groups and deployment contexts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Consider impact of bias in data on AI system performance, fairness, and intended outcomes"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic bias detection essential for Level 3 maturity with quantified fairness metrics and automated bias monitoring pipelines"
    }
  },
  {
    "control_id": "DATA-BIAS-02",
    "control_title": "Bias Mitigation Measures for Data",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement and evaluate bias mitigation measures for training data sets, including documented bias mitigation strategies, data rebalancing procedures, bias correction methods, before/after bias metric comparisons, and mitigation effectiveness reports to demonstrate measurable reduction in identified biases aligned with fairness objectives.",
    "control_objective": "Ensure identified data biases are effectively mitigated through documented strategies with measurable before/after metrics demonstrating reduced bias impact on AI system outputs.",
    "risk_description": "Unmitigated data biases propagate into production AI models creating discriminatory outcomes that violate fundamental rights and trigger EU AI Act enforcement actions. Absence of documented mitigation effectiveness prevents demonstration of compliance with Article 10(2)(g) bias prevention requirements. Failure to measure before/after metrics eliminates ability to demonstrate due diligence in bias reduction to regulators and affected stakeholders.",
    "implementation": {
      "requirements": [
        "Bias Mitigation Strategy documenting selected mitigation approaches",
        "Data Rebalancing Documentation recording resampling methods (SMOTE, random oversampling, stratified undersampling), target distributions",
        "Bias Correction Methods Applied detailing algorithmic and data-level corrections implemented including pre-processing",
        "Before/After Bias Metrics documenting quantified bias measurements using standardized fairness metrics",
        "Mitigation Effectiveness Report evaluating overall effectiveness of applied mitigations including residual bias levels"
      ],
      "steps": [
        "Design bias mitigation strategy selecting appropriate techniques",
        "Execute data rebalancing using selected techniques with statistical validation confirming improved demographic distribution alignment target population while",
        "Apply bias correction methods at appropriate pipeline stages",
        "Measure before/after bias metrics using consistent fairness measures",
        "Generate mitigation effectiveness report analyzing residual bias levels against defined fairness thresholds"
      ],
      "timeline": "Mitigation strategy designed after bias detection (DATA-BIAS-01); rebalancing and corrections applied before model training"
    },
    "evidence_requirements": [
      "Bias Mitigation Strategy",
      "Data Rebalancing Documentation",
      "Bias Correction Methods Applied",
      "Before/After Bias Metrics",
      "Mitigation Effectiveness Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(g)",
          "context": "Providers shall implement appropriate data governance and management practices including measures to detect, prevent and mitigate possible biases identified in data sets"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate effectiveness of bias mitigation measures and document fairness outcomes across deployment contexts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Make adjustments to model and data as necessary based on bias assessment outcomes"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Validated bias mitigation with quantified effectiveness metrics essential for Level 4 maturity demonstrating measurable bias reduction and continuous fairness monitoring"
    }
  },
  {
    "control_id": "DATA-COLL-01",
    "control_title": "Data Collection and Sourcing Process",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL document and control data collection and sourcing processes, including data origin tracking, original purpose documentation, collection methodology, demographic representation analysis, and subject matter documentation for all AI training and operational data.",
    "control_objective": "Ensure all data collected for AI systems has documented provenance, legal basis, and collection methodology to support quality and compliance requirements.",
    "risk_description": "Undocumented data collection processes prevent verification of data quality and legal compliance. Missing provenance records make it impossible to trace model behaviors to specific data sources. Failure to document original purpose of personal data collection violates GDPR requirements and EU AI Act Article 10(2)(b).",
    "implementation": {
      "requirements": [
        "Data Collection Procedure defining standard processes for data acquisition",
        "Data Source Inventory cataloging all data sources with quality ratings and access agreements",
        "Data Acquisition Log tracking each data collection event with timestamps and responsible parties",
        "Original Purpose Documentation recording the original purpose of personal data collection per GDPR requirements",
        "Data Subject Demographics Record documenting representation across protected characteristics"
      ],
      "steps": [
        "Define standardized data collection procedures with quality checks and approval workflows",
        "Create and maintain data source inventory with metadata including source type, refresh frequency, licensing, and quality tier",
        "Implement data acquisition logging capturing who, what, when, where, and why for each collection event",
        "Document original purpose of collection for all personal data to support GDPR lawful basis assessment",
        "Analyze and document demographic representation in collected data to identify potential bias"
      ],
      "timeline": "Procedures established before data collection; inventory and logs maintained continuously."
    },
    "evidence_requirements": [
      "Data Collection Procedure",
      "Data Source Inventory",
      "Data Acquisition Log",
      "Original Purpose Documentation",
      "Data Subject Demographics Record"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(b)",
          "context": "Data governance practices shall address relevant data collection processes and the origin of data, and in the case of personal data, the original purpose of the data collection"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data collection, selection, and provenance for AI system data"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.3",
          "context": "Determine and document details about acquisition and selection of data"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Documented collection processes essential for Level 2 maturity with traceable data lineage"
    }
  },
  {
    "control_id": "DATA-GAP-01",
    "control_title": "Data Gap Identification and Remediation",
    "category": "AI Data Management",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement systematic processes for identifying data gaps and shortcomings that could prevent regulatory compliance or degrade AI system performance, including gap analysis reporting, remediation planning, data augmentation strategies, and tracked closure of identified gaps.",
    "control_objective": "Ensure data gaps and shortcomings are systematically identified, assessed for compliance and performance impact, and remediated through documented strategies with tracked closure.",
    "risk_description": "Unidentified data gaps lead to models trained on insufficient data, producing unreliable predictions for underserved populations or edge cases. Failure to document remediation strategies prevents auditors from verifying that known shortcomings were addressed. Direct non-compliance with EU AI Act Article 10(2)(h) explicit requirement to identify and address data gaps preventing regulatory compliance.",
    "implementation": {
      "requirements": [
        "Data Gap Analysis Report documenting identified gaps in data coverage, quality, representativeness, and volume relative to system requirements",
        "Shortcoming Remediation Plan defining prioritized actions to address each identified gap with timelines, resources, and success criteria",
        "Data Augmentation Strategy documenting approaches for supplementing insufficient data including additional collection",
        "Synthetic Data Generation Documentation recording methodology, tools, validation procedures, and limitations of any synthetic data used to fill gaps",
        "Gap Closure Tracker monitoring remediation progress with measurable milestones and verification that gaps have been adequately addressed"
      ],
      "steps": [
        "Conduct systematic data gap analysis comparing available data against defined requirements for quality, coverage, volume",
        "Classify identified gaps by severity (blocking, degrading, cosmetic), compliance impact (EU AI Act Article 10 requirements), and remediation complexity",
        "Develop prioritized remediation plan for each gap specifying approach (additional collection, augmentation, synthetic generation), timeline, budget, and responsible owner",
        "Document data augmentation strategies with technical specifications, validation methods",
        "If using synthetic data generation, document methodology (GANs, SMOTE, rules-based), tools used, validation against real data distributions"
      ],
      "timeline": "Gap analysis conducted during data preparation; remediation plans created before model training; closure tracked continuously until all critical gaps resolved"
    },
    "evidence_requirements": [
      "Data Gap Analysis Report",
      "Shortcoming Remediation Plan",
      "Data Augmentation Strategy",
      "Synthetic Data Generation Documentation",
      "Gap Closure Tracker"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(h)",
          "context": "Providers shall identify relevant data gaps or shortcomings that prevent compliance with this Regulation and how those gaps and shortcomings can be addressed"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data suitability including identification of gaps and shortcomings"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Ensure data meet quality requirements including identification of data deficiencies"
        },
        {
          "ref": "Clause A.7.3",
          "context": "Determine quantity and characteristics of data needed for AI system"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic gap identification and remediation essential for Level 2 maturity with tracked closure of data deficiencies"
    }
  },
  {
    "control_id": "DATA-GOV-01",
    "control_title": "Data Governance Framework",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish a comprehensive data governance framework that defines data management policies, procedures, stewardship roles, lifecycle management processes, and governance committee oversight for all data used in AI system development and operation.",
    "control_objective": "Ensure all AI-related data is managed under a formal governance framework with clear accountability, quality standards, and lifecycle controls.",
    "risk_description": "Without data governance framework, AI training data lacks quality assurance and provenance tracking, leading to unreliable model outputs. Non-compliance with EU AI Act Article 10 data governance requirements for high-risk systems. Unmanaged data lifecycle creates privacy violations, storage costs, and stale data risks.",
    "implementation": {
      "requirements": [
        "Data Governance Policy establishing principles, scope, and compliance requirements",
        "Data Management Procedure detailing operational processes for data handling",
        "Data Lifecycle Management Plan covering collection, storage, processing, retention, and deletion",
        "Data Stewardship Assignments with named individuals and RACI matrix",
        "Data Governance Committee Charter defining membership, authority, and meeting cadence"
      ],
      "steps": [
        "Establish Data Governance Policy aligned with EU AI Act Article 10 and ISO/IEC 42001 Annex A.7",
        "Define data management procedures covering acquisition, validation, transformation, storage, and access control",
        "Create data lifecycle management plan with retention schedules and deletion procedures",
        "Assign data stewards for each AI system dataset with documented responsibilities",
        "Charter Data Governance Committee with cross-functional representation and quarterly review cadence"
      ],
      "timeline": "Established before AI data collection begins; reviewed annually; committee meets quarterly."
    },
    "evidence_requirements": [
      "Data Governance Policy",
      "Data Management Procedure",
      "Data Lifecycle Management Plan",
      "Data Stewardship Assignments",
      "Data Governance Committee Charter"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(1)",
          "context": "Training, validation and testing data sets shall be subject to data governance and management practices"
        },
        {
          "ref": "Article 10(2)",
          "context": "Data governance and management practices shall concern appropriate data governance and management practices"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data provenance, representativeness, and suitability for AI system purposes"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.2",
          "context": "Define and document data management processes"
        },
        {
          "ref": "Clause A.7.3",
          "context": "Determine and document details about acquisition of data"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Data governance framework foundational for Level 2 maturity with controlled data practices"
    }
  },
  {
    "control_id": "DATA-LABEL-01",
    "control_title": "Data Labelling Process",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement a structured data labelling process with documented labelling guidelines, annotator training programs, inter-annotator agreement measurement, label quality review workflows, and labelling tool governance to ensure consistent and accurate data annotation.",
    "control_objective": "Ensure data labelling processes produce consistent, accurate, and well-documented labels with measurable quality standards and full provenance tracking.",
    "risk_description": "Inconsistent labelling introduces systematic noise into training data, degrading model accuracy and creating unpredictable failure modes. Absence of inter-annotator agreement measurement makes label quality unverifiable, undermining model evaluation validity. Non-compliance with EU AI Act Article 10(2)(c) and Annex IV(2)(d) requirements for documented labelling procedures.",
    "implementation": {
      "requirements": [
        "Labelling Guidelines defining label taxonomy, annotation schema, decision rules, and worked examples for each label category",
        "Inter-Annotator Agreement Records documenting agreement metrics (Cohen's kappa, Fleiss' kappa, or Krippendorff's alpha) for all labelling tasks",
        "Label Quality Review Process specifying review sampling rates, escalation procedures, and acceptance/rejection criteria",
        "Annotator Training Materials including onboarding curriculum, calibration exercises, and ongoing proficiency assessments",
        "Labelling Tool Documentation recording tool selection rationale, configuration settings, versioning, and access controls"
      ],
      "steps": [
        "Develop comprehensive labelling guidelines with taxonomy definition, decision trees for ambiguous cases, worked examples per category, and explicit boundary conditions",
        "Create annotator training program with onboarding modules, calibration rounds using gold-standard data",
        "Implement inter-annotator agreement measurement using appropriate metrics",
        "Establish label quality review workflow with stratified sampling (minimum 15% review rate), senior annotator adjudication for disagreements"
      ],
      "timeline": "Guidelines created before labelling begins; agreement measured during each labelling campaign; quality reviews conducted continuously throughout labelling"
    },
    "evidence_requirements": [
      "Labelling Guidelines",
      "Inter-Annotator Agreement Records",
      "Label Quality Review Process",
      "Annotator Training Materials",
      "Labelling Tool Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(c)",
          "context": "Data governance shall address data-preparation processing operations including annotation and labelling"
        },
        {
          "ref": "Annex IV(2)(d)",
          "context": "Description of data sets including labelling procedures and methodologies"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data provenance, representativeness, and labelling methodology"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.6",
          "context": "Define and document criteria for selecting data preparation methods including labelling"
        },
        {
          "ref": "Clause A.7.3",
          "context": "Document associated metadata including labelling details and provenance"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Structured labelling processes with measured agreement essential for Level 3 maturity with verifiable annotation quality"
    }
  },
  {
    "control_id": "DATA-MGMT-01",
    "control_title": "Data Management System for AI Development",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive data management system for AI development encompassing documented data management policies, standardized data operations procedures, data lifecycle management plans, role-based data access control systems, and data management tool documentation to ensure systematic governance of all data used in AI system development and deployment.",
    "control_objective": "Ensure all data operations supporting AI development are governed through a documented quality management system with standardized procedures, lifecycle controls, and appropriate access management.",
    "risk_description": "Absence of systematic data management creates uncontrolled data quality degradation propagating errors through AI training pipelines with no traceability to root causes. Non-compliance with EU AI Act Article 17(1)(f) quality management system requirements for data management exposes organization to enforcement actions. Uncontrolled data access without audit trails creates security vulnerabilities and prevents investigation of data integrity incidents affecting AI system reliability.",
    "implementation": {
      "requirements": [
        "Data Management Policy establishing organizational principles, roles, responsibilities",
        "Data Operations Procedure defining standardized workflows for data collection, ingestion, transformation, labeling, augmentation, versioning",
        "Data Lifecycle Management Plan documenting data retention periods, quality checkpoints, lineage tracking, disposal procedures",
        "Data Access Control System implementing role-based access controls (RBAC) with documented access matrices",
        "Data Management Tool Documentation recording tools used for data operations"
      ],
      "steps": [
        "Develop data management policy aligned with ISO/IEC 42001 requirements establishing data governance board, data steward roles, data classification scheme",
        "Create standardized data operations procedures covering ingestion (schema validation, source verification), transformation",
        "Implement data lifecycle management plan defining stages",
        "Deploy role-based data access control system with documented access matrices mapping roles to data assets",
        "Document all data management tools with architecture diagrams, configuration standards, integration interfaces, backup procedures, and disaster recovery plans"
      ],
      "timeline": "Data management policy established before AI development begins; operations procedures documented during development setup"
    },
    "evidence_requirements": [
      "Data Management Policy",
      "Data Operations Procedure",
      "Data Lifecycle Management Plan",
      "Data Access Control System",
      "Data Management Tool Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(f)",
          "context": "Quality management system shall include systems and procedures for data management including data collection, data analysis, data labelling, data storage, data filtration, data mining, data aggregation, data retention, and all other data operations"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.2",
          "context": "Define and document data management processes related to the development of AI systems including data acquisition, collection, and preparation procedures"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive data management system with documented procedures and automated lifecycle controls essential for Level 3 maturity demonstrating systematic AI data governance"
    }
  },
  {
    "control_id": "DATA-PREP-01",
    "control_title": "Data Preparation and Processing",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and document formal data preparation and processing procedures covering annotation, labelling, cleaning, updating, enrichment, and aggregation operations, with version-controlled transformation logs and quality assurance checkpoints at each processing stage.",
    "control_objective": "Ensure all data preparation operations are documented, reproducible, and quality-controlled to maintain data integrity throughout the AI development pipeline.",
    "risk_description": "Undocumented data preparation operations prevent reproducibility and make it impossible to trace model behavior to specific data transformations. Uncontrolled cleaning and annotation processes introduce systematic errors that propagate through model training. Direct non-compliance with EU AI Act Article 10(2)(c) requirement for documented data preparation operations.",
    "implementation": {
      "requirements": [
        "Data Preparation Procedure defining standardized workflows for each type of data preparation operation",
        "Data Cleaning Log recording all cleaning operations including records modified, rules applied, and before/after statistics",
        "Annotation Guidelines specifying annotation schema, quality standards, edge case handling, and inter-annotator agreement targets",
        "Labelling Quality Assurance Process defining QA sampling rates, review workflows, and acceptance criteria for labelled data",
        "Data Transformation Documentation recording all enrichment, aggregation, normalization"
      ],
      "steps": [
        "Document standardized data preparation procedures for each operation type (cleaning, annotation, labelling, enrichment, aggregation) with defined inputs, outputs",
        "Implement version-controlled data cleaning pipelines using tools (dbt, Apache Airflow, or Prefect) with automated logging of all transformations applied",
        "Create annotation guidelines with detailed schema definitions, worked examples, edge case rulings, and quality benchmarks",
        "Establish labelling QA process with stratified sampling review (minimum 10% of labelled records), dual-annotator verification for ambiguous cases"
      ],
      "timeline": "Procedures defined before data preparation begins; logs maintained throughout preparation; QA performed before data enters training pipeline"
    },
    "evidence_requirements": [
      "Data Preparation Procedure",
      "Data Cleaning Log",
      "Annotation Guidelines",
      "Labelling Quality Assurance Process",
      "Data Transformation Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(c)",
          "context": "Data governance shall address data-preparation processing operations such as annotation, labelling, cleaning, updating, enrichment and aggregation"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports data management standards",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.6",
          "context": "Define and document criteria for selecting data preparations and methods to be used"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Documented and reproducible data preparation processes essential for Level 2 maturity with traceable data transformation pipelines"
    }
  },
  {
    "control_id": "DATA-PRIV-01",
    "control_title": "Personal Data Protection for AI",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive privacy protections for personal data used in AI systems, including privacy impact assessments, data minimization analysis, pseudonymization implementation, privacy control matrices, and re-identification risk assessments to ensure state-of-the-art data protection throughout the AI lifecycle.",
    "control_objective": "Ensure personal data used in AI systems is protected through privacy-by-design principles with documented impact assessments, minimization controls, pseudonymization, and re-identification risk management.",
    "risk_description": "Inadequate privacy protections for AI training data create GDPR violations with penalties up to 4% of global annual turnover and EU AI Act non-compliance penalties. Re-identification of pseudonymized data in model outputs or training artifacts exposes individuals to privacy harm and the organization to litigation. Failure to conduct AI-specific privacy impact assessments leaves privacy risks unidentified until data breaches or regulatory enforcement actions occur.",
    "implementation": {
      "requirements": [
        "Privacy Impact Assessment for AI documenting privacy risks specific to AI processing including automated decision-making, profiling",
        "Data Minimization Assessment demonstrating that personal data collected and processed is limited to what is strictly necessary for the AI",
        "Pseudonymization Implementation Record documenting pseudonymization methods applied, key management procedures, and effectiveness validation",
        "Privacy Control Matrix mapping privacy requirements to implemented technical and organizational controls across the AI data lifecycle",
        "Re-identification Risk Assessment evaluating residual re-identification risk after anonymization or pseudonymization using state-of-the-art"
      ],
      "steps": [
        "Conduct AI-specific Privacy Impact Assessment (PIA) covering data flows through training, validation, inference",
        "Perform data minimization assessment for each data field evaluating necessity, proportionality",
        "Implement pseudonymization using appropriate techniques",
        "Build privacy control matrix mapping each privacy requirement",
        "Conduct re-identification risk assessment using established attack models"
      ],
      "timeline": "PIA conducted before personal data processing; minimization assessed during system design"
    },
    "evidence_requirements": [
      "Privacy Impact Assessment for AI",
      "Data Minimization Assessment",
      "Pseudonymization Implementation Record",
      "Privacy Control Matrix",
      "Re-identification Risk Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(5)(b)",
          "context": "State-of-the-art security measures including pseudonymisation shall be applied to personal data used in AI systems"
        },
        {
          "ref": "Article 10(5)(c)",
          "context": "Measures ensuring appropriate data security, protection of personal data, and strict access controls shall be implemented"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.10",
          "context": "Examine and document privacy risk of the AI system including data processing impacts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.3",
          "context": "Consider privacy and security implications of data used in AI systems including PII protections"
        },
        {
          "ref": "Clause A.10.2",
          "context": "Where privacy is to be preserved, consider ISO/IEC 27701 controls for privacy information management"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive AI privacy controls essential for Level 3 maturity with validated pseudonymization and quantified re-identification risk management"
    }
  },
  {
    "control_id": "DATA-PROV-01",
    "control_title": "Data Provenance Tracking",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement end-to-end data provenance tracking with a centralized provenance registry, data lineage diagrams, source system documentation, chain of custody logs, and provenance verification procedures to ensure complete traceability from data origin through all transformations to model consumption.",
    "control_objective": "Ensure complete traceability of all AI training data from original source through every transformation to final model consumption, enabling audit, compliance verification, and legal risk assessment.",
    "risk_description": "Missing data provenance prevents verification of data licensing compliance, exposing the organization to intellectual property litigation and regulatory penalties. Inability to trace data lineage makes root cause analysis of model failures impossible, as corrupted or biased source data cannot be identified. Direct non-compliance with EU AI Act Article 10(2)(b) and Annex IV(2)(d) requirements for data origin and provenance documentation.",
    "implementation": {
      "requirements": [
        "Data Provenance Registry serving as centralized catalog of all data sources, acquisition methods, licensing terms, and authorized uses",
        "Data Lineage Diagram providing visual and machine-readable representation of data flow from source systems through transformations to model inputs",
        "Source System Documentation recording technical specifications, data quality characteristics, update frequencies, and SLAs for each data source",
        "Data Chain of Custody Log tracking every access, transfer, transformation, and consumption event for each data set",
        "Provenance Verification Records documenting periodic verification that provenance records accurately reflect actual data state and lineage"
      ],
      "steps": [
        "Establish centralized Data Provenance Registry using metadata management tools",
        "Generate automated data lineage diagrams using lineage tracking tools",
        "Document each source system with technical specifications including API endpoints, schema definitions, data quality SLAs, refresh schedules, and responsible data stewards",
        "Implement chain of custody logging capturing who accessed, transformed, transferred, or consumed data with timestamps, purpose codes, and authorization references",
        "Conduct quarterly provenance verification audits comparing registry records against actual data states using checksums, row counts, and schema validation"
      ],
      "timeline": "Registry established before data acquisition; lineage tracked continuously during data processing; verification audits conducted quarterly"
    },
    "evidence_requirements": [
      "Data Provenance Registry",
      "Data Lineage Diagram",
      "Source System Documentation",
      "Data Chain of Custody Log",
      "Provenance Verification Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(b)",
          "context": "Data governance shall address data collection processes and the origin of data"
        },
        {
          "ref": "Annex IV(2)(d)",
          "context": "Description of training data sets including information about provenance, scope, and main characteristics"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data provenance and suitability for AI system purposes"
        },
        {
          "ref": "MAP.4.1",
          "context": "Map legal and regulatory risks of all AI system components including data"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.5",
          "context": "Define and document process for recording provenance of data assets"
        },
        {
          "ref": "Clause A.4.3",
          "context": "Document provenance of data used in AI system development"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "End-to-end provenance tracking essential for Level 3 maturity with verifiable data lineage from source to model"
    }
  },
  {
    "control_id": "DATA-QUAL-01",
    "control_title": "Data Quality Requirements",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define, document, and enforce data quality requirements for all AI system data sets, including relevance criteria, representativeness standards, error rate tolerances, completeness thresholds, and ongoing quality monitoring to ensure fitness for intended purpose.",
    "control_objective": "Ensure all data used in AI systems meets defined quality standards for relevance, representativeness, accuracy, and completeness appropriate to the intended purpose.",
    "risk_description": "Undefined data quality standards allow poor-quality data to train models, producing unreliable outputs and potentially harmful decisions. Missing quality monitoring allows data drift to degrade model performance undetected. Non-compliance with EU AI Act Article 10(3) requirement that data be relevant, representative, free of errors, and complete.",
    "implementation": {
      "requirements": [
        "Data Quality Requirements Document defining quality dimensions, metrics, and thresholds for each AI system",
        "Data Quality Metrics specifying measurable indicators for accuracy, completeness, consistency, timeliness, and uniqueness",
        "Data Quality Assessment Report documenting current quality state against defined requirements",
        "Error Rate Tolerance Specification defining acceptable error rates by data type and use case",
        "Completeness Standards establishing minimum data population requirements"
      ],
      "steps": [
        "Define data quality requirements for each AI system aligned with EU AI Act Article 10",
        "Establish measurable quality metrics with automated monitoring using tools (Great Expectations, Soda Core, dbt tests)",
        "Conduct baseline data quality assessment documenting current state across all quality dimensions",
        "Define error rate tolerances by data field and use case with documented rationale for acceptable thresholds"
      ],
      "timeline": "Defined before data collection; assessed before model training; monitored continuously in production."
    },
    "evidence_requirements": [
      "Data Quality Requirements Document",
      "Data Quality Metrics",
      "Data Quality Assessment Report",
      "Error Rate Tolerance Specification",
      "Completeness Standards"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(3)",
          "context": "Training, validation and testing data sets shall be relevant, sufficiently representative, and to the best extent possible, free of errors and complete in view of the intended purpose"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data suitability for intended purpose including quality characteristics"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Define and document requirements for data quality"
        },
        {
          "ref": "ensure data meet those requirements",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Data quality management essential for Level 2 maturity with measurable data standards"
    }
  },
  {
    "control_id": "DATA-QUAL-02",
    "control_title": "Data Quality Assessment and Measurement",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement a comprehensive data quality assessment and measurement program utilizing automated profiling tools, standardized quality scorecards, anomaly detection systems, and continuous improvement tracking to quantify and report data fitness across all AI system data sets.",
    "control_objective": "Ensure data quality is continuously measured, scored, and improved through automated profiling, anomaly detection, and structured quality dashboards aligned with TEVV processes.",
    "risk_description": "Unmeasured data quality allows degraded data to silently corrupt model training, producing unreliable predictions and biased outcomes. Absence of quality dashboards prevents early detection of data drift, leading to model failures discovered only after deployment. Non-compliance with EU AI Act Article 10(2)(e) requirement for data suitability assessment.",
    "implementation": {
      "requirements": [
        "Data Quality Dashboard providing real-time visibility into quality metrics across all AI data pipelines",
        "Data Profiling Results documenting statistical profiles for each data set including distributions, null rates, uniqueness, and value ranges",
        "Data Quality Score Card assigning quantified quality scores per data set across defined quality dimensions",
        "Data Anomaly Detection Log recording detected anomalies, root causes, and resolution actions",
        "Quality Improvement Tracker documenting quality trends, remediation actions, and measurable improvement over time"
      ],
      "steps": [
        "Deploy automated data profiling tools (Great Expectations, Soda Core, or Apache Griffin) to generate statistical profiles for all training, validation, and test data sets",
        "Design and implement Data Quality Dashboard integrating profiling results, quality scores",
        "Define quality scoring methodology with weighted dimensions",
        "Configure anomaly detection pipelines using statistical methods (z-score, IQR) and ML-based detectors to identify data drift, schema changes, and distribution shifts",
        "Establish quality improvement tracking process with quarterly reviews, trend analysis, and documented remediation actions linked to TEVV outcomes"
      ],
      "timeline": "Established during initial data pipeline setup; profiling runs before each model training; dashboards monitored continuously in production"
    },
    "evidence_requirements": [
      "Data Quality Dashboard",
      "Data Profiling Results",
      "Data Quality Score Card",
      "Data Anomaly Detection Log",
      "Quality Improvement Tracker"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(e)",
          "context": "Data governance shall include assessment of availability, quantity and suitability of needed data sets"
        },
        {
          "ref": "Article 10(3)",
          "context": "Training, validation and testing data sets shall be relevant, sufficiently representative, free of errors, and complete"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.1",
          "context": "Document metrics and details about tools used during test, evaluation, verification, and validation (TEVV)"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Define requirements for data quality and ensure data meet those requirements"
        },
        {
          "ref": "Clause 9.1",
          "context": "Determine what needs to be monitored and measured, methods for analysis and evaluation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Quantified data quality measurement essential for Level 3 maturity with automated TEVV-integrated quality monitoring"
    }
  },
  {
    "control_id": "DATA-REP-01",
    "control_title": "Data Representativeness Assessment",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct and document comprehensive data representativeness assessments comparing training data distributions against target deployment populations across geographic, demographic, contextual, behavioral, and functional dimensions, with gap analysis for underrepresented groups and documented remediation strategies.",
    "control_objective": "Ensure training data sets possess appropriate statistical properties and adequately represent the populations, contexts, and conditions of the intended deployment environment.",
    "risk_description": "Non-representative training data produces models that perform poorly for underrepresented populations, creating discriminatory outcomes and safety risks for vulnerable groups. Undocumented representativeness gaps prevent identification of model fairness issues until post-deployment harm occurs. Direct non-compliance with EU AI Act Articles 10(3) and 10(4) requirements for statistically appropriate and contextually representative data sets.",
    "implementation": {
      "requirements": [
        "Representativeness Assessment Report documenting statistical comparison between training data and target deployment population characteristics",
        "Population Coverage Analysis mapping data coverage across relevant demographic, geographic, and socioeconomic segments",
        "Geographic/Demographic Distribution Analysis comparing training data distributions against known population distributions using statistical tests",
        "Sampling Strategy Document defining sampling methodology, stratification approach, and sample size justification for each population segment",
        "Gap Analysis for Underrepresented Groups identifying population segments with insufficient representation and documenting impact on model fairness"
      ],
      "steps": [
        "Define target deployment population characteristics across all relevant dimensions",
        "Conduct statistical distribution analysis comparing training data against target population using chi-square tests",
        "Perform population coverage analysis mapping data availability against census or market data for geographic regions, age groups, gender, ethnicity",
        "Document sampling strategy with stratification rationale, minimum sample sizes per subgroup (using power analysis), and oversampling/undersampling decisions",
        "Execute gap analysis identifying underrepresented groups, quantifying representation gaps, and assessing potential impact on model fairness and performance disparities"
      ],
      "timeline": "Initial assessment during data collection planning; full analysis before model training; reassessed when deployment context changes or new populations are served"
    },
    "evidence_requirements": [
      "Representativeness Assessment Report",
      "Population Coverage Analysis",
      "Geographic/Demographic Distribution Analysis",
      "Sampling Strategy Document",
      "Gap Analysis for Underrepresented Groups"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(3)",
          "context": "Training, validation and testing data sets shall have the appropriate statistical properties including as regards the persons or groups on whom the system is intended to be used"
        },
        {
          "ref": "Article 10(4)",
          "context": "Data sets shall take into account the characteristics or elements particular to the specific geographical, contextual, behavioural or functional setting"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data representativeness for intended deployment population"
        },
        {
          "ref": "MEASURE.2.2",
          "context": "Ensure evaluations are representative of relevant population and conditions"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.4",
          "context": "Ensure data are suitable for intended purpose including representativeness assessment"
        },
        {
          "ref": "Clause A.7.3",
          "context": "Document representativeness of training data compared to operational domain"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic representativeness assessment essential for Level 3 maturity with quantified population coverage and gap remediation"
    }
  },
  {
    "control_id": "DATA-SENS-01",
    "control_title": "Special Category Data Processing",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement strict technical and organizational safeguards for processing special categories of personal data in AI systems for bias detection purposes, including documented processing justifications, data isolation architectures, access controls with logging, non-transfer restrictions, deletion procedures, and complete processing records as required by EU AI Act Article 10(5).",
    "control_objective": "Ensure special categories of personal data used for bias detection in AI systems are processed under strict safeguards with documented justifications, isolation, access controls, and complete processing records.",
    "risk_description": "Inadequate safeguards for special category data processing expose the organization to severe GDPR and EU AI Act penalties including fines up to 35 million EUR or 7% of global turnover. Unauthorized access to sensitive personal data creates fundamental rights violations and reputational damage. Non-compliance with six specific requirements of EU AI Act Article 10(5) governing special category data processing for bias detection.",
    "implementation": {
      "requirements": [
        "Special Category Data Processing Justification documenting necessity for processing, technical limitations of alternatives",
        "Technical Safeguard Documentation recording encryption, pseudonymization, anonymization, and data isolation measures applied to special category data",
        "Access Control Log recording all access to special category data with identity, purpose, timestamp, authorization reference, and actions performed",
        "Data Isolation Architecture documenting technical separation of special category data from general processing environments including network",
        "Processing Records for Special Categories maintaining complete records per Article 10(5)(f) with processing purposes"
      ],
      "steps": [
        "Document processing justification demonstrating that bias detection cannot be achieved through alternative means without processing special category data",
        "Implement technical safeguards including encryption at rest",
        "Deploy granular access controls with role-based access (RBAC), purpose-limited authorization, multi-factor authentication"
      ],
      "timeline": "Safeguards implemented before any special category data processing; access controls active continuously"
    },
    "evidence_requirements": [
      "Special Category Data Processing Justification",
      "Technical Safeguard Documentation",
      "Access Control Log",
      "Data Isolation Architecture",
      "Processing Records for Special Categories",
      "Special Category Data Access Request Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(5)(a)",
          "context": "Processing of special categories shall take place only to the extent strictly necessary for bias detection where technical limitations exist"
        },
        {
          "ref": "Article 10(5)(b)",
          "context": "State-of-the-art security measures including pseudonymisation shall be applied"
        },
        {
          "ref": "Article 10(5)(c)",
          "context": "Measures ensuring data security, protection, and strict access controls"
        },
        {
          "ref": "Article 10(5)(d)",
          "context": "Special category data shall not be transferred to other parties"
        },
        {
          "ref": "Article 10(5)(e)",
          "context": "Special category data shall be deleted once bias has been corrected or personal data has reached end of retention"
        },
        {
          "ref": "Article 10(5)(f)",
          "context": "Records of processing activities shall include purposes, categories of data, and safeguards applied"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports data management standards",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.3",
          "context": "Consider data rights including personally identifiable information and special category data protections"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Strict special category data controls essential for Level 3 maturity with demonstrable compliance with Article 10(5) safeguard requirements"
    }
  },
  {
    "control_id": "DATA-TEST-01",
    "control_title": "Validation and Test Data Management",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish formal processes for managing validation and test data sets, including data separation procedures, hold-out set documentation, cross-validation strategies, and validation data characterization to ensure rigorous and unbiased evaluation of AI system performance.",
    "control_objective": "Ensure validation and test data sets are properly managed, documented, and separated from training data to enable rigorous and unbiased AI system evaluation.",
    "risk_description": "Inadequate test data separation leads to data leakage and inflated performance metrics that mask real-world failures. Undocumented validation strategies prevent independent audit of model evaluation rigor. Non-compliance with EU AI Act Article 10 and Annex IV requirements for validation and testing documentation.",
    "implementation": {
      "requirements": [
        "Validation Data Datasheet documenting composition, provenance, and representativeness of validation sets",
        "Test Data Specification defining test data requirements for each evaluation objective",
        "Data Separation Procedure ensuring strict isolation between training, validation, and test sets",
        "Hold-Out Set Documentation describing hold-out strategy, size rationale, and leakage prevention measures",
        "Cross-Validation Strategy Document specifying k-fold or stratified approaches with statistical justification"
      ],
      "steps": [
        "Define data separation procedures with technical controls preventing data leakage between train/validation/test splits",
        "Create validation and test data datasheets mirroring training data documentation standards",
        "Document hold-out set strategy including size determination, stratification approach, and temporal considerations",
        "Implement cross-validation strategy appropriate for data characteristics (k-fold, stratified, time-series split)",
        "Verify test data representativeness against deployment conditions using statistical distribution tests"
      ],
      "timeline": "Defined during data preparation; validated before model evaluation; documented for each evaluation cycle."
    },
    "evidence_requirements": [
      "Validation Data Datasheet",
      "Test Data Specification",
      "Data Separation Procedure",
      "Hold-Out Set Documentation",
      "Cross-Validation Strategy Document"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(1)",
          "context": "Training, validation and testing data sets shall meet quality criteria"
        },
        {
          "ref": "Article 10(3)",
          "context": "Validation and testing data sets shall be relevant, representative"
        },
        {
          "ref": "Annex IV(2)(d)",
          "context": "Description of validation and testing data"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Validation and testing procedures and details about tools used"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.1",
          "context": "Document test sets and details about tools used for AI system testing"
        },
        {
          "ref": "MEASURE.2.3",
          "context": "Measure AI system performance for conditions similar to deployment"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures for AI systems"
        },
        {
          "ref": "Clause A.7.2",
          "context": "Define data management processes including test data"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Rigorous test data management essential for Level 3 maturity with validated evaluation processes"
    }
  },
  {
    "control_id": "DATA-TRAIN-01",
    "control_title": "Training Data Set Documentation",
    "category": "AI Data Management",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL create and maintain comprehensive documentation for all training data sets, including datasheets with provenance records, representativeness analysis, version control, selection criteria, and quality assessments demonstrating fitness for intended purpose.",
    "control_objective": "Ensure training data sets are thoroughly documented with provenance, quality characteristics, and representativeness analysis to support model reliability and compliance.",
    "risk_description": "Undocumented training data prevents reproducibility and audit of model behavior. Missing representativeness analysis allows biased models to reach production. Non-compliance with EU AI Act Article 10 and Annex IV(2)(d) training data documentation requirements for high-risk systems.",
    "implementation": {
      "requirements": [
        "Training Data Datasheet following Datasheets for Datasets methodology (Gebru et al.)",
        "Training Data Provenance Record documenting complete data lineage from source to model",
        "Data Representativeness Analysis comparing dataset demographics against target population",
        "Training Data Version Control Log tracking all dataset versions with change descriptions",
        "Data Selection Criteria Document explaining inclusion/exclusion decisions and rationale"
      ],
      "steps": [
        "Create Training Data Datasheet using standardized template covering motivation, composition, collection process, preprocessing, uses, distribution, and maintenance",
        "Document complete data provenance chain from original source through all transformations to final training set",
        "Conduct representativeness analysis comparing dataset distribution against target deployment population demographics",
        "Implement dataset version control using DVC, Delta Lake, or LakeFS with tagged releases and change logs",
        "Document data selection criteria including inclusion/exclusion rules, sampling methodology, and filtering rationale"
      ],
      "timeline": "Created during data preparation; updated with each dataset version; reviewed before model retraining."
    },
    "evidence_requirements": [
      "Training Data Datasheet",
      "Training Data Provenance Record",
      "Data Representativeness Analysis",
      "Training Data Version Control Log",
      "Data Selection Criteria Document"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(1)",
          "context": "Training, validation and testing data sets shall meet quality criteria"
        },
        {
          "ref": "Article 10(3)",
          "context": "Training data sets shall be relevant, representative, free of errors, and complete"
        },
        {
          "ref": "Annex IV(2)(d)",
          "context": "Description of training data sets including provenance, scope, and main characteristics"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document data suitability for AI system purposes"
        },
        {
          "ref": "MEASURE.2.1",
          "context": "Document test sets and metrics for AI system evaluation"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.7.2",
          "context": "Define data management processes for AI systems"
        },
        {
          "ref": "Clause A.7.3",
          "context": "Document information about data resources including categories of data"
        },
        {
          "ref": "Clause A.4.3",
          "context": "Document data resources and their characteristics"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive training data documentation required for Level 3 maturity with auditable data practices"
    }
  },
  {
    "control_id": "VER-ACC-01",
    "control_title": "Accuracy Testing and Metrics",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive accuracy testing and metrics for all high-risk AI systems including documented accuracy metrics specifications, accuracy test results with statistical validation, precision/recall/F1 documentation, accuracy analysis by demographic subgroup, and accuracy declarations for end-users to ensure appropriate levels of accuracy throughout the AI lifecycle.",
    "control_objective": "Ensure AI system accuracy is rigorously measured, documented, and declared using appropriate metrics with subgroup analysis demonstrating consistent performance across all relevant populations.",
    "risk_description": "Undeclared or poorly measured accuracy creates liability when AI system performance falls below user expectations in production environments. Absence of subgroup accuracy analysis conceals discriminatory performance disparities violating fundamental rights of affected populations. Non-compliance with EU AI Act Article 15(3) requirement to declare accuracy levels and metrics in instructions for use exposes organization to enforcement actions and market access restrictions.",
    "implementation": {
      "requirements": [
        "Accuracy Metrics Specification defining selected accuracy metrics",
        "Accuracy Test Results documenting measured accuracy across holdout test sets, cross-validation folds",
        "Precision/Recall/F1 Documentation recording class-level precision, recall, and F1-score for classification systems or equivalent metrics",
        "Accuracy by Subgroup Analysis measuring accuracy metrics disaggregated by protected demographic groups",
        "Accuracy Declaration for Users documenting accuracy levels, relevant accuracy metrics, known limitations"
      ],
      "steps": [
        "Define accuracy metrics specification selecting metrics appropriate to AI task type",
        "Execute accuracy testing on representative holdout test sets with stratified sampling, k-fold cross-validation",
        "Generate comprehensive precision/recall/F1 documentation with per-class metrics, confusion matrices, ROC curves with AUC values, precision-recall curves",
        "Conduct subgroup accuracy analysis disaggregating all metrics by protected attributes using intersectional analysis"
      ],
      "timeline": "Metrics specified during design; accuracy tested during development and pre-deployment"
    },
    "evidence_requirements": [
      "Accuracy Metrics Specification",
      "Accuracy Test Results",
      "Precision/Recall/F1 Documentation",
      "Accuracy by Subgroup Analysis",
      "Accuracy Declaration for Users"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 15(1)",
          "context": "High-risk AI systems shall be designed and developed to achieve appropriate levels of accuracy throughout lifecycle"
        },
        {
          "ref": "Article 15(3)",
          "context": "Levels of accuracy and relevant accuracy metrics shall be declared in instructions for use"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Accuracy and robustness metrics"
        },
        {
          "ref": "Annex IV(4)",
          "context": "Appropriateness of performance metrics"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.3",
          "context": "Measure AI system performance or assurance criteria for conditions similar to deployment"
        },
        {
          "ref": "MEASURE.2.5",
          "context": "Demonstrate deployed AI system is valid and reliable with documented accuracy evidence"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Specify criteria for verification and validation including accuracy requirements"
        },
        {
          "ref": "Clause A.6.2.6",
          "context": "Monitor for errors and whether the AI system performs as expected against accuracy specifications"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Rigorous accuracy testing with subgroup analysis and declared metrics essential for Level 4 maturity demonstrating quantified and transparent AI performance measurement"
    }
  },
  {
    "control_id": "VER-CONFORM-01",
    "control_title": "Conformity Assessment Procedure",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure all high-risk AI systems undergo the relevant conformity assessment procedure prior to market placement or putting into service including documented conformity assessment plans, assessment procedure selection rationale, conformity assessment reports, notified body engagement records, notified body selection criteria, and conformity evidence packages.",
    "control_objective": "Ensure high-risk AI systems complete the appropriate conformity assessment procedure demonstrating compliance with all applicable EU AI Act requirements before market placement or operational deployment.",
    "risk_description": "High-risk AI systems placed on the market without completed conformity assessment are in direct violation of EU AI Act Article 16(f), exposing providers to enforcement actions including fines up to EUR 15 million or 3% of worldwide annual turnover. Incomplete conformity evidence packages result in assessment failures and costly remediation cycles that delay market access and competitive positioning. Improper notified body selection or engagement creates assessment validity risks that may require re-assessment under different notified bodies.",
    "implementation": {
      "requirements": [
        "Conformity Assessment Plan defining the conformity assessment approach including selected assessment procedure",
        "Assessment Procedure Selection Rationale documenting the basis for selecting the applicable conformity assessment procedure including whether",
        "Conformity Assessment Report documenting comprehensive assessment results against all applicable EU AI Act requirements including compliance",
        "Notified Body Engagement Records (where applicable) documenting selection, engagement",
        "Notified Body Selection Criteria (where applicable) documenting the basis for notified body selection including accreditation verification"
      ],
      "steps": [
        "Determine applicable conformity assessment procedure by classifying the AI system under Article 43 provisions",
        "Develop conformity assessment plan establishing assessment scope covering all Chapter 2 requirements"
      ],
      "timeline": "Conformity assessment plan developed during design phase; procedure selection at project initiation"
    },
    "evidence_requirements": [
      "Conformity Assessment Plan",
      "Assessment Procedure Selection Rationale",
      "Conformity Assessment Report",
      "Notified Body Engagement Records",
      "Notified Body Selection Criteria",
      "Conformity Evidence Package"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(f)",
          "context": "Providers of high-risk AI systems shall ensure that the AI system undergoes the relevant conformity assessment procedure referred to in Article 43 prior to its being placed on the market or put into service"
        },
        {
          "ref": "Article 43",
          "context": "High-risk AI systems shall undergo conformity assessment through internal control (Annex VI) or with involvement of a notified body (Annex VII) depending on classification and applicable requirements"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports verification and validation processes",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "N/A — Supports overall ISO 42001 verification and validation processes",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Completed conformity assessment with comprehensive evidence package and documented assessment procedure essential for Level 4 maturity demonstrating regulatory readiness for high-risk AI market placement"
    }
  },
  {
    "control_id": "VER-CONT-01",
    "control_title": "Continuous Learning Risk Testing",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement continuous learning risk testing for all AI systems that continue to learn after deployment including documented continuous learning test plans, feedback loop risk assessments, learning stability monitoring, bias drift detection tests, and retraining trigger analysis to ensure continuous learning does not introduce or amplify risks of biased feedback loops.",
    "control_objective": "Ensure AI systems with continuous learning capabilities are monitored for feedback loop risks, learning stability, and bias drift with documented testing and defined retraining triggers.",
    "risk_description": "Unmonitored continuous learning systems develop compounding feedback loops that progressively amplify biases, creating increasingly discriminatory outputs that accelerate over time. Absence of learning stability monitoring allows model parameter drift that degrades system reliability without detection until catastrophic failure. Non-compliance with EU AI Act Article 15(4) specific requirement to eliminate or reduce feedback loop risks in continuously learning high-risk systems creates direct regulatory liability.",
    "implementation": {
      "requirements": [
        "Continuous Learning Test Plan defining monitoring scope for online learning systems",
        "Feedback Loop Risk Assessment identifying and evaluating potential feedback loops where AI system outputs influence future training data",
        "Learning Stability Monitoring implementing continuous tracking of model parameter stability",
        "Bias Drift Detection Tests implementing automated testing for progressive bias accumulation in continuously learning systems using fairness",
        "Retraining Trigger Analysis documenting conditions that trigger model retraining including performance degradation thresholds"
      ],
      "steps": [
        "Develop continuous learning test plan mapping all feedback pathways where system outputs influence subsequent training data",
        "Conduct feedback loop risk assessment using causal diagram analysis identifying reinforcing loops",
        "Implement learning stability monitoring tracking model weight norm evolution, loss convergence patterns, prediction confidence distributions",
        "Deploy bias drift detection testing automated fairness metric monitoring across protected groups with statistical change detection algorithms",
        "Establish retraining trigger analysis defining quantified conditions for automated retraining"
      ],
      "timeline": "Test plan established before enabling continuous learning; feedback loop assessment during design"
    },
    "evidence_requirements": [
      "Continuous Learning Test Plan",
      "Feedback Loop Risk Assessment",
      "Learning Stability Monitoring",
      "Bias Drift Detection Tests",
      "Retraining Trigger Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 15(4)",
          "context": "High-risk AI systems that continue to learn after being placed on the market or put into service shall be developed in such a way as to eliminate or reduce as far as possible the risk of possibly biased outputs influencing input for future operations (feedback loops)"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.4",
          "context": "Monitor functionality and behavior of the AI system during production operations to detect changes that may impact performance, fairness, or safety"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.6",
          "context": "For continuous learning systems, monitor AI system to ensure design goals are met and performance does not degrade through feedback effects"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Automated continuous learning monitoring with feedback loop detection and bias drift alerts essential for Level 4 maturity in autonomous AI system governance"
    }
  },
  {
    "control_id": "VER-DECL-01",
    "control_title": "EU Declaration of Conformity",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL draw up and maintain an EU declaration of conformity for each high-risk AI system in accordance with Article 47, ensuring the declaration contains all elements specified in Annex V, is kept up to date, translated into required languages, and made available to national competent authorities upon request for a period of 10 years after the AI system has been placed on the market or put into service.",
    "control_objective": "Ensure each high-risk AI system has a formally executed, current, and compliant EU declaration of conformity that attests to regulatory compliance and enables market surveillance authority verification.",
    "risk_description": "High-risk AI systems placed on the market without a valid EU declaration of conformity are in direct violation of Article 16(g), exposing providers to enforcement actions and fines up to EUR 15 million or 3% of worldwide annual turnover. Market surveillance authorities finding missing or incomplete declarations may order product withdrawal from the market, causing immediate revenue loss and reputational damage. Deployers operating without access to the provider's declaration lack essential compliance documentation, potentially invalidating their own regulatory obligations.",
    "implementation": {
      "requirements": [
        "EU Declaration of Conformity Document prepared in accordance with Article 47 and containing all mandatory elements specified in Annex V",
        "Declaration Signature and Date with authorised signatory identification, legal authority verification, signature date",
        "Declaration Content Checklist verifying completeness against Annex V requirements including provider name and address",
        "Declaration Version Control tracking all declaration versions with revision history, change descriptions, superseded version archival",
        "Declaration Distribution Record documenting all parties to whom the declaration has been provided including national competent authorities"
      ],
      "steps": [
        "Draft EU declaration of conformity using Annex V template ensuring all mandatory fields are populated including unique AI system identification",
        "Verify declaration content completeness against Article 47 requirements and Annex V checklist",
        "Obtain authorised signature from designated provider representative with documented legal authority to execute regulatory declarations",
        "Translate declaration into official languages of Member States where the AI system is placed on the market or put into service",
        "Establish version control system for declaration management including revision triggers"
      ],
      "timeline": "Declaration drafted after conformity assessment completion; signed before market placement"
    },
    "evidence_requirements": [
      "EU Declaration of Conformity Document",
      "Declaration Signature and Date",
      "Declaration Content Checklist",
      "Declaration Version Control",
      "Declaration Distribution Record"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 16(g)",
          "context": "Providers of high-risk AI systems shall draw up the EU declaration of conformity in accordance with Article 47 and keep it at the disposal of national competent authorities for 10 years\n• Article 47: The EU declaration of conformity shall state that the high-risk AI system meets the requirements set out in Chapter 2 and shall contain the information set out in Annex V\n• Annex IV(8): A copy of the EU declaration of conformity shall be included as part of the technical documentation"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• N/A - No direct ISO/IEC 42001 mapping for this control",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Formally executed EU declaration of conformity with complete version control and distribution records essential for Level 4 maturity demonstrating full regulatory compliance readiness for high-risk AI market placement"
    }
  },
  {
    "control_id": "VER-DESIGN-01",
    "control_title": "Design Control and Verification",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement formal design control and verification procedures for high-risk AI systems including documented design control procedures, design review records, design verification results, design change control logs, and design approval documentation to ensure AI system designs meet specified requirements and are systematically verified.",
    "control_objective": "Ensure high-risk AI system designs are developed under formal design controls with documented reviews, verification against requirements, change management, and approval gates that maintain design integrity throughout development.",
    "risk_description": "Absence of formal design controls allows unreviewed design decisions to introduce systematic risks that propagate through development to deployment, creating latent failures detectable only through costly post-deployment incidents. Uncontrolled design changes introduce regression risks and invalidate previous verification results without detection. Non-compliance with EU AI Act Article 17(1)(b) explicit design control requirements creates direct QMS non-conformity that blocks conformity assessment certification.",
    "implementation": {
      "requirements": [
        "Design Control Procedure defining the design and development process for AI systems including design input requirements capture",
        "Design Review Records documenting formal design review meetings at predefined milestones including review participants and qualifications",
        "Design Verification Results documenting systematic verification that AI system design outputs meet design input requirements through inspection",
        "Design Change Control Log tracking all design changes after initial design approval including change description",
        "Design Approval Documentation recording formal approval of AI system design at each lifecycle stage gate including approval authority"
      ],
      "steps": [
        "Establish design control procedure defining stage-gated design process with formal design input",
        "Conduct design reviews at predefined milestones",
        "Execute design verification activities using requirements traceability matrix linking each design input requirement to specific verification test",
        "Implement design change control process using change request forms with mandatory impact assessment",
        "Complete design approval documentation at each stage gate with formal sign-off by designated approval authorities"
      ],
      "timeline": "Design control procedure established before design initiation; design reviews at each lifecycle milestone"
    },
    "evidence_requirements": [
      "Design Control Procedure",
      "Design Review Records",
      "Design Verification Results",
      "Design Change Control Log",
      "Design Approval Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(b)",
          "context": "Quality management system for high-risk AI systems shall include techniques, procedures, and systematic actions for design, design control, and design verification of the high-risk AI system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.1",
          "context": "Define tasks and methods to implement AI system functions with documented design decisions and risk-informed design choices"
        },
        {
          "ref": "MAP.4.2",
          "context": "Document internal risk controls and mitigation strategies implemented through design decisions and verified through design verification"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.3",
          "context": "Document AI system design and development including architecture decisions, model selection rationale, and design constraints"
        },
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including design verification criteria and acceptance thresholds"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Formal design control with stage-gated reviews, requirements traceability, and change management essential for Level 4 maturity demonstrating engineering discipline in AI system development"
    }
  },
  {
    "control_id": "VER-DEV-01",
    "control_title": "Development Quality Control",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement development quality control and quality assurance procedures for high-risk AI systems including documented development quality plans, code review procedures, quality gate definitions, development milestone reviews, and quality assurance checklists to ensure development processes meet defined quality standards throughout the AI development lifecycle.",
    "control_objective": "Ensure high-risk AI system development follows documented quality control procedures with defined quality gates, systematic code reviews, and milestone-based quality assurance throughout the development lifecycle.",
    "risk_description": "Development without formal quality control allows coding errors, scientific integrity issues, and ML-specific defects (data leakage, training-serving skew) to propagate undetected to production systems. Absence of quality gates enables premature phase transitions with incomplete verification, compounding defect remediation costs. Non-compliance with EU AI Act Article 17(1)(c) explicit development quality control requirements creates QMS non-conformity that undermines conformity assessment readiness.",
    "implementation": {
      "requirements": [
        "Development Quality Plan defining quality objectives, quality metrics, quality control activities",
        "Code Review Procedure establishing mandatory peer review requirements for all AI system code including review criteria",
        "Quality Gate Definitions specifying measurable entry and exit criteria for each development phase transition including required artifacts",
        "Development Milestone Reviews documenting formal milestone review assessments at key development points including technical progress evaluation",
        "Quality Assurance Checklist providing comprehensive verification items for each development phase covering documentation completeness"
      ],
      "steps": [
        "Develop quality plan establishing measurable quality objectives",
        "Implement code review procedure requiring peer review of all production code with documented review criteria covering functional correctness, scientific integrity",
        "Define quality gates for each development phase transition",
        "Conduct development milestone reviews at predefined intervals using structured review agendas covering technical progress against plan",
        "Deploy quality assurance checklists as mandatory pre-gate verification instruments covering phase-specific quality dimensions with checkbox completion"
      ],
      "timeline": "Development quality plan established before development start; code review procedure active from first code commit"
    },
    "evidence_requirements": [
      "Development Quality Plan",
      "Code Review Procedure",
      "Quality Gate Definitions",
      "Development Milestone Reviews",
      "Quality Assurance Checklist"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(c)",
          "context": "Quality management system for high-risk AI systems shall include techniques, procedures, and systematic actions for development, quality control, and quality assurance of the high-risk AI system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.3",
          "context": "Document scientific integrity considerations and TEVV (test, evaluation, verification, and validation) approaches throughout the AI development process"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.3",
          "context": "Document AI system design and development processes including quality control procedures and development standards"
        },
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including development-phase quality gates and acceptance criteria"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic development quality control with defined gates, mandatory code reviews, and milestone-based quality assurance essential for Level 4 maturity demonstrating disciplined AI development practices"
    }
  },
  {
    "control_id": "VER-FIELD-01",
    "control_title": "Field Validation with Domain Experts",
    "category": "AI Verification & Validation",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL validate AI system trustworthiness in deployment contexts through structured input from domain experts including documented field validation plans, domain expert assessment reports, deployment context performance reports, expert feedback logs, and performance trend analysis to identify measurable performance improvements or declines in operational environments.",
    "control_objective": "Ensure AI system trustworthiness is validated through domain expert input in actual deployment contexts with documented performance trends and expert-identified improvement or decline patterns.",
    "risk_description": "AI systems deployed without domain expert field validation exhibit undetected performance gaps specific to operational environments that laboratory testing cannot reveal. Absence of structured expert feedback mechanisms allows systematic performance degradation to accumulate without corrective intervention. Failure to track performance trends prevents early detection of gradual model drift that compounds into significant trustworthiness failures before they become apparent through automated monitoring alone.",
    "implementation": {
      "requirements": [
        "Field Validation Plan defining scope, methodology, and schedule for domain expert-led validation of AI system performance in operational",
        "Domain Expert Assessment Report documenting structured expert evaluations of AI system behavior in deployment contexts including expert",
        "Deployment Context Performance Report measuring AI system performance against operational requirements in field conditions including comparison",
        "Expert Feedback Log maintaining structured records of all domain expert feedback including observation date",
        "Performance Trend Analysis tracking longitudinal performance patterns using expert assessments and quantitative metrics to identify"
      ],
      "steps": [
        "Develop field validation plan with defined expert selection criteria",
        "Conduct domain expert assessment sessions using structured observation protocols, think-aloud methodology for expert reasoning capture",
        "Compile deployment context performance report comparing field performance against pre-deployment benchmarks, identifying context-specific performance gaps",
        "Maintain expert feedback log using structured intake forms capturing observation context",
        "Execute performance trend analysis using time-series analysis of expert assessment scores and quantitative performance metrics, applying statistical trend detection"
      ],
      "timeline": "Field validation plan developed during pre-deployment; initial domain expert assessment before full deployment"
    },
    "evidence_requirements": [
      "Field Validation Plan",
      "Domain Expert Assessment Report",
      "Deployment Context Performance Report",
      "Expert Feedback Log",
      "Performance Trend Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall verification and validation processes",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.4.2",
          "context": "Validate AI system trustworthiness in conditions similar to deployment context through input from domain experts and affected communities"
        },
        {
          "ref": "MEASURE.4.3",
          "context": "Identify measurable performance improvements or declines through structured measurement and expert assessment in deployment contexts"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including expert-led field validation protocols and acceptance criteria"
        },
        {
          "ref": "Clause A.5.4",
          "context": "Consult experts to understand potential impacts of the AI system including domain-specific risks and deployment context considerations"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Structured domain expert field validation with longitudinal performance trend analysis essential for Level 3 maturity demonstrating deployment-context trustworthiness verification"
    }
  },
  {
    "control_id": "VER-HARMON-01",
    "control_title": "Harmonised Legislation Integration",
    "category": "AI Verification & Validation",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure AI systems that are products or components of products covered by Union harmonisation legislation are compliant with all applicable legislative requirements including maintained applicable harmonised standards lists, integrated documentation packages, cross-reference compliance matrices, notified body coordination records, and Union legislation mapping.",
    "control_objective": "Ensure AI systems subject to multiple Union harmonisation legislation frameworks maintain integrated compliance with documented cross-regulatory alignment and coordinated conformity assessment.",
    "risk_description": "AI systems embedded in regulated products without integrated harmonised legislation compliance face market access barriers across all applicable regulatory frameworks simultaneously. Duplicative documentation packages create inconsistencies that are identified during conformity assessment, requiring costly rework and delaying market placement. Uncoordinated notified body assessments produce conflicting findings that create compliance ambiguity and extend conformity assessment timelines.",
    "implementation": {
      "requirements": [
        "Applicable Harmonised Standards List identifying all Union harmonisation legislation applicable to AI systems that are products or safety",
        "Integrated Documentation Package providing a single consolidated technical documentation set meeting requirements of both EU AI Act",
        "Cross-Reference Compliance Matrix mapping requirements across applicable regulatory frameworks",
        "Notified Body Coordination Records documenting coordination between notified bodies when multiple conformity assessments are required",
        "Union Legislation Mapping documenting all applicable Union harmonisation legislation for each AI system with regulatory basis"
      ],
      "steps": [
        "Conduct Union harmonisation legislation applicability assessment identifying all legislative frameworks applicable to AI systems that are products or components of",
        "Compile applicable harmonised standards list for each applicable legislative framework",
        "Develop integrated documentation package creating unified technical documentation satisfying EU AI Act Annex IV requirements and product-specific documentation",
        "Create cross-reference compliance matrix mapping each requirement from all applicable frameworks to specific compliance evidence",
        "Establish notified body coordination process for AI systems requiring conformity assessment under multiple frameworks"
      ],
      "timeline": "Union legislation mapping during product planning; applicable standards list before design"
    },
    "evidence_requirements": [
      "Applicable Harmonised Standards List",
      "Integrated Documentation Package",
      "Cross-Reference Compliance Matrix",
      "Notified Body Coordination Records",
      "Union Legislation Mapping"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 8(2)",
          "context": "For high-risk AI systems that are products or safety components of products covered by Union harmonisation legislation, providers shall ensure compliance with applicable requirements"
        },
        {
          "ref": "Article 11(2)",
          "context": "A single set of technical documentation shall be drawn up for products covered by Union harmonisation legislation listed in Annex I Section A"
        },
        {
          "ref": "Annex I Section A",
          "context": "Union harmonisation legislation applicable to AI systems as products or components including Machinery Regulation, medical devices, toys, lifts, radio equipment, and other product safety frameworks"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.1",
          "context": "Understand, manage, and document all legal and regulatory requirements applicable to AI systems across all relevant jurisdictions and regulatory frameworks"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.2",
          "context": "Determine the requirements of interested parties including all regulatory authorities and legislative bodies with jurisdiction over AI system products and their intended markets"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Integrated multi-framework compliance with coordinated conformity assessment essential for Level 3 maturity demonstrating comprehensive regulatory alignment for AI products"
    }
  },
  {
    "control_id": "VER-HUMAN-01",
    "control_title": "Human Subject Testing Compliance",
    "category": "AI Verification & Validation",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure all evaluations involving human subjects meet applicable ethical requirements and regulatory standards including IRB approval documentation, informed consent procedures, representative participant recruitment plans, demographic characteristics reports, and sampling bias assessments to ensure human-involved AI evaluations are ethical, representative, and scientifically valid.",
    "control_objective": "Ensure evaluations involving human subjects are conducted ethically with proper institutional review, informed consent, representative participation, and documented demographic analysis to produce valid and generalizable results.",
    "risk_description": "Human subject evaluations without IRB approval expose the organization to ethical violations, legal liability, and reputational damage from inadequate participant protections. Non-representative participant samples produce evaluation results that do not generalize to intended user populations, creating false confidence in AI system performance. Absence of sampling bias assessment conceals systematic evaluation biases that overstate AI system performance for majority populations while understating performance for vulnerable groups.",
    "implementation": {
      "requirements": [
        "IRB Approval Documentation demonstrating institutional review board (or equivalent ethics committee) review and approval of human subject",
        "Informed Consent Forms providing clear, comprehensible information about evaluation purpose",
        "Representative Participant Recruitment Plan documenting recruitment strategy ensuring participant demographics proportionally represent the AI",
        "Demographic Characteristics Report documenting actual participant demographics",
        "Sampling Bias Assessment evaluating potential biases in participant recruitment and selection including self-selection bias"
      ],
      "steps": [
        "Submit evaluation protocol to IRB or equivalent ethics committee for review including study design",
        "Develop informed consent forms following Belmont Report principles",
        "Design representative participant recruitment plan using stratified sampling methodology with documented target quotas based on intended user population demographics",
        "Compile demographic characteristics report after recruitment documenting achieved sample composition against target quotas, identifying underrepresented groups",
        "Conduct sampling bias assessment evaluating recruitment methodology for systematic biases including platform-specific biases"
      ],
      "timeline": "IRB approval obtained before any human subject evaluation; informed consent administered before participation"
    },
    "evidence_requirements": [
      "IRB Approval Documentation",
      "Informed Consent Forms",
      "Representative Participant Recruitment Plan",
      "Demographic Characteristics Report",
      "Sampling Bias Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A - No direct EU AI Act article for human subject testing",
          "context": ""
        },
        {
          "ref": "however, Article 9 risk management and Article 10 data governance principles apply to evaluation data involving human subjects",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.2",
          "context": "Ensure evaluations involving human subjects meet applicable requirements and are representative of the intended population"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including human evaluation protocols"
        },
        {
          "ref": "Clause A.5.4",
          "context": "Consult with relevant experts and users including human subjects in evaluation processes"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Ethical human subject evaluation with representative sampling and bias assessment essential for Level 3 maturity demonstrating responsible AI evaluation practices"
    }
  },
  {
    "control_id": "VER-METRIC-01",
    "control_title": "Performance Metric Validation",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL regularly assess, validate, and update the appropriateness of performance metrics for all high-risk AI systems including documented metric appropriateness assessments, context-specific metric validation, metric sensitivity analysis, metric review schedules, and metric validity documentation to ensure measurement approaches are meaningful and connected to deployment contexts.",
    "control_objective": "Ensure AI system performance metrics are appropriate, contextually valid, and regularly reviewed to provide meaningful measurement of system behavior in actual deployment conditions.",
    "risk_description": "Inappropriate performance metrics create false confidence in AI system performance, masking critical failures in subgroup performance, edge cases, or operationally meaningful dimensions. Metrics disconnected from deployment context produce misleading assessments that do not reflect actual system behavior experienced by users and affected individuals. Non-compliance with Annex IV(4) requirement to describe metric appropriateness creates gaps in technical documentation that jeopardize conformity assessment outcomes.",
    "implementation": {
      "requirements": [
        "Metric Appropriateness Assessment evaluating whether selected performance metrics",
        "Context-Specific Metric Validation demonstrating that chosen metrics produce valid measurements under actual deployment conditions",
        "Metric Sensitivity Analysis evaluating how performance metrics respond to changes in input distributions, class imbalances, subgroup compositions",
        "Metric Review Schedule establishing regular cadence for metric appropriateness review including triggers for unscheduled reviews",
        "Metric Validity Documentation providing comprehensive evidence that each metric meets validity requirements"
      ],
      "steps": [
        "Conduct metric appropriateness assessment mapping each performance metric to specific system objectives and deployment context requirements",
        "Perform context-specific metric validation testing each metric under production data distributions",
        "Execute metric sensitivity analysis using bootstrap resampling across demographic subgroups, perturbation testing of input distributions",
        "Establish metric review schedule with quarterly routine reviews, triggered reviews upon significant deployment context changes",
        "Compile metric validity documentation providing evidence of construct validity (metric measures intended construct), content validity"
      ],
      "timeline": "Metric appropriateness assessment during system design; context-specific validation before deployment"
    },
    "evidence_requirements": [
      "Metric Appropriateness Assessment",
      "Context-Specific Metric Validation",
      "Metric Sensitivity Analysis",
      "Metric Review Schedule",
      "Metric Validity Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Annex IV(4)",
          "context": "Technical documentation shall include description of the appropriateness of the performance metrics for the specific AI system and the overall expected level of performance"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.1.2",
          "context": "Regularly assess and update the appropriateness of metrics used to evaluate AI system performance, fairness, and safety"
        },
        {
          "ref": "MEASURE.4.1",
          "context": "Connect measurement approaches to meaningful deployment context outcomes and validate metric relevance"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.1",
          "context": "Determine methods for monitoring, measurement, analysis, and evaluation to ensure valid and comparable results"
        },
        {
          "ref": "Clause A.6.2.4",
          "context": "Specify criteria for use including performance metrics and acceptance thresholds for verification and validation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Validated context-specific metrics with documented sensitivity analysis and regular appropriateness review essential for Level 3 maturity demonstrating meaningful and trustworthy AI performance measurement"
    }
  },
  {
    "control_id": "VER-MODEL-01",
    "control_title": "Model Validation and Interpretation",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive model validation, explanation, and output interpretation processes for all AI systems including documented model validation reports, model explanation documentation, output interpretation guides, model cards with limitations, and stakeholder-appropriate explanation artifacts to ensure AI models are validated, explainable, and their outputs are correctly interpreted within operational context.",
    "control_objective": "Ensure AI models are rigorously validated, explained in stakeholder-appropriate terms, and their outputs are correctly interpreted within deployment context to support informed decision-making and regulatory compliance.",
    "risk_description": "Unvalidated AI models deployed without documented explanation create undetectable systematic errors that propagate through organizational decisions, potentially causing significant financial, legal, or safety harm. Absence of output interpretation guidance leads to misinterpretation of model predictions by operators, particularly confidence scores treated as probabilities without proper calibration. Non-compliance with EU AI Act Article 13 transparency requirements and Article 14 human oversight provisions creates direct regulatory liability for high-risk AI system providers.",
    "implementation": {
      "requirements": [
        "Model Validation Report documenting comprehensive validation results including functional correctness testing",
        "Model Explanation Documentation providing technical and non-technical explanations of model architecture",
        "Output Interpretation Guide defining how to correctly interpret model outputs including confidence score calibration",
        "Model Card with Limitations following Model Cards for Model Reporting (Mitchell et al.) format documenting intended use",
        "Stakeholder-Appropriate Explanation Artifacts providing tailored explanations for distinct audiences"
      ],
      "steps": [
        "Conduct model validation using held-out test datasets, k-fold cross-validation, and bootstrap sampling to establish statistically significant performance baselines",
        "Generate model explanation documentation using interpretability tools",
        "Develop output interpretation guide with calibrated confidence scores (using Platt scaling or isotonic regression)",
        "Create model card following standardized template documenting model metadata, intended use cases",
        "Produce stakeholder-appropriate explanation artifacts with executive summaries for business leaders"
      ],
      "timeline": "Model validation during development and before deployment; explanation documentation before deployment"
    },
    "evidence_requirements": [
      "Model Validation Report",
      "Model Explanation Documentation",
      "Output Interpretation Guide",
      "Model Card with Limitations",
      "Stakeholder-Appropriate Explanation Artifacts"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)(d)",
          "context": "Technical documentation shall include description of system capabilities and limitations including accuracy, robustness, and cybersecurity measures and known or foreseeable circumstances affecting performance"
        },
        {
          "ref": "Article 14(4)(c)",
          "context": "Human oversight measures shall enable individuals to correctly interpret the high-risk AI system output, taking into account the characteristics of the system and the interpretation tools and methods available"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.9",
          "context": "Explain, validate, and document the AI model and its output"
        },
        {
          "ref": "interpret AI system output within its intended deployment context with appropriate uncertainty characterization",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including model validation criteria, testing procedures, and acceptance thresholds"
        },
        {
          "ref": "Clause A.8.2",
          "context": "Define technical requirements and limitations including accuracy metrics, performance boundaries, and operational constraints for documentation and communication"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive model validation with multi-stakeholder explanation artifacts and calibrated output interpretation essential for Level 4 maturity demonstrating transparent and accountable AI system governance"
    }
  },
  {
    "control_id": "VER-PRETEST-01",
    "control_title": "Pre-Deployment Testing Requirements",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct comprehensive pre-deployment testing for all high-risk AI systems including documented pre-deployment test plans, complete test execution logs, summarized test results, measured performance against defined acceptance criteria, and signed test reports with formal release authorization to ensure system readiness before market placement.",
    "control_objective": "Ensure high-risk AI systems are rigorously tested against defined acceptance criteria with documented evidence of test completion and formal sign-off before deployment to production environments.",
    "risk_description": "Deploying AI systems without comprehensive pre-deployment testing exposes end-users to unvalidated system behavior creating safety risks and liability exposure. Absence of signed test reports with formal release authorization eliminates evidence of due diligence required by EU AI Act Article 9(8). Untested performance against acceptance criteria in production-representative conditions leads to unexpected failures when system encounters real-world data distributions and usage patterns.",
    "implementation": {
      "requirements": [
        "Pre-Deployment Test Plan defining test scope, acceptance criteria, test cases, test data requirements",
        "Test Execution Log recording each test case executed with timestamps, tester identification",
        "Test Results Summary consolidating test outcomes across all test categories",
        "Performance Against Acceptance Criteria documenting measured performance metrics compared to predefined thresholds for accuracy",
        "Signed Test Reports with formal sign-off by test lead, development lead, and product owner confirming test completion"
      ],
      "steps": [
        "Develop pre-deployment test plan derived from TEVV framework",
        "Execute pre-deployment test suite in production-representative environment",
        "Compile test results summary aggregating outcomes across all test categories with statistical confidence levels, defect severity distribution, test coverage metrics",
        "Evaluate performance against acceptance criteria using pre-defined thresholds for each metric with documented rationale for pass/fail determinations and explicit"
      ],
      "timeline": "Test plan developed during development phase; execution completed before deployment gate"
    },
    "evidence_requirements": [
      "Pre-Deployment Test Plan",
      "Test Execution Log",
      "Test Results Summary",
      "Performance Against Acceptance Criteria",
      "Signed Test Reports"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(8)",
          "context": "Testing shall be performed throughout development and prior to being placed on the market or put into service"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Test logs and all test reports with dated and signed attestation"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.3",
          "context": "Measure system performance or assurance criteria for conditions similar to deployment setting"
        },
        {
          "ref": "MEASURE.2.5",
          "context": "Demonstrate deployed AI system is valid and reliable with documentation of results"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures for AI systems"
        },
        {
          "ref": "Clause A.6.2.5",
          "context": "Have requirements to be met prior to release of AI system including verification and validation results"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Formal pre-deployment testing with signed release authorization essential for Level 3 maturity demonstrating controlled AI system release processes"
    }
  },
  {
    "control_id": "VER-QMS-01",
    "control_title": "Quality Management System Establishment",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish, document, and maintain a quality management system for high-risk AI systems that is proportionate to organizational size and includes a QMS manual, comprehensive procedure set, policy suite, defined scope document, and organization size proportionality assessment in compliance with EU AI Act Article 17 requirements.",
    "control_objective": "Establish a comprehensive, proportionate quality management system that ensures systematic governance of high-risk AI systems through documented policies, procedures, and controls aligned with EU AI Act requirements.",
    "risk_description": "Absence of a formal quality management system for high-risk AI results in ad hoc, inconsistent practices that fail to meet EU AI Act Article 17 mandatory QMS requirements, creating immediate non-compliance exposure. Undocumented quality procedures prevent effective audit trails and make conformity assessment impossible, blocking market access for high-risk AI systems. Disproportionate QMS implementation wastes organizational resources on excessive documentation or fails to provide adequate controls for the complexity of deployed AI systems.",
    "implementation": {
      "requirements": [
        "QMS Manual defining the quality management system scope, structure, governance framework, process interactions",
        "QMS Procedure Set documenting operational procedures for all AI lifecycle phases including requirements management",
        "QMS Policy Suite establishing organizational policies for AI quality including data quality policy",
        "QMS Scope Document defining the boundaries and applicability of the quality management system including covered AI systems",
        "Organization Size Proportionality Assessment documenting how QMS complexity and documentation requirements are calibrated to organizational size"
      ],
      "steps": [
        "Define QMS scope identifying all high-risk AI systems, applicable regulatory requirements, organizational units involved in AI development and deployment",
        "Develop QMS manual establishing governance structure with defined management representative",
        "Create comprehensive procedure set covering all EU AI Act Article 17"
      ],
      "timeline": "QMS scope and manual established before first high-risk AI system deployment; procedure set developed incrementally with AI lifecycle implementation"
    },
    "evidence_requirements": [
      "QMS Manual",
      "QMS Procedure Set",
      "QMS Policy Suite",
      "QMS Scope Document",
      "Organization Size Proportionality Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(c)",
          "context": "Providers of high-risk AI systems shall ensure that their AI systems comply with quality management system requirements"
        },
        {
          "ref": "Article 17(1)",
          "context": "Providers of high-risk AI systems shall put a quality management system in place that ensures compliance with this Regulation in a systematic and documented manner"
        },
        {
          "ref": "Article 17(2)",
          "context": "The quality management system shall be proportionate to the size of the provider organization and documented in a systematic and orderly manner"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.4",
          "context": "Establish processes, procedures, and practices to facilitate implementation and maintain organizational risk management and governance processes that are transparent, documented, and accessible"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.4",
          "context": "Establish, implement, maintain, and continually improve an AI management system including processes needed and their interactions"
        },
        {
          "ref": "Clause 8.1",
          "context": "Plan, implement, and control the processes needed to meet requirements and implement actions determined in planning"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive documented QMS with proportionate controls and continuous improvement processes essential for Level 4 maturity demonstrating systematic AI quality governance"
    }
  },
  {
    "control_id": "VER-REC-01",
    "control_title": "Record-Keeping System",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive record-keeping system for all AI system documentation including technical documentation, quality management system records, conformity assessment evidence, and operational logs, ensuring records are retained for a minimum of 10 years after the AI system has been placed on the market or put into service, with documented retention policies, classification schemes, and access controls.",
    "control_objective": "Ensure all AI system documentation is systematically organized, securely stored, readily retrievable, and retained for the legally mandated period to support regulatory audits, market surveillance, and ongoing compliance verification.",
    "risk_description": "Failure to maintain a compliant record-keeping system directly violates Article 18's 10-year retention requirement, resulting in inability to produce documentation upon market surveillance authority request and potential fines up to EUR 15 million. Unstructured documentation storage creates retrieval failures during regulatory audits, extending audit timelines and increasing compliance costs. Loss of critical AI system records due to inadequate backup or retention management eliminates the organization's ability to demonstrate historical compliance.",
    "implementation": {
      "requirements": [
        "Record Retention Policy defining retention periods for all AI system documentation categories including technical documentation",
        "Documentation Repository providing a centralized, secure, and searchable storage system for all AI-related documentation with version control",
        "Record Classification System categorising all AI documentation by type (technical, quality, compliance, operational), sensitivity level",
        "Retention Schedule mapping each document type to its required retention period, review dates",
        "Document Control Procedure defining processes for document creation, review, approval, distribution, revision"
      ],
      "steps": [
        "Develop record retention policy aligned with Article 18 requirements specifying minimum 10-year retention for technical documentation, EU declarations of conformity",
        "Implement documentation repository using enterprise content management system",
        "Design record classification system with standardized taxonomy covering all EU AI Act documentation requirements",
        "Create retention schedule mapping all document types to retention periods with automated expiration alerts, disposition review workflows",
        "Establish document control procedure with formal creation-review-approval workflows"
      ],
      "timeline": "Record retention policy established before first AI system deployment; documentation repository implemented during development phase"
    },
    "evidence_requirements": [
      "Record Retention Policy",
      "Documentation Repository",
      "Record Classification System",
      "Retention Schedule",
      "Document Control Procedure"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 16(d)",
          "context": "Providers of high-risk AI systems shall keep the documentation referred to in Article 11 including technical documentation drawn up before the AI system is placed on the market or put into service\n• Article 17(1)(k): Quality management system shall include systems and procedures for record-keeping ensuring documentation management and traceability throughout the AI system lifecycle\n• Article 18: Providers of high-risk AI systems shall keep documentation, logs, EU declaration of conformity, and conformity assessment documentation at the disposal of national competent authorities for a period of 10 years"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• Clause 7.5.1",
          "context": "The AI management system shall include documented information required by the standard and determined by the organization as necessary for system effectiveness\n• Clause 7.5.2: When creating and updating documented information, the organization shall ensure appropriate identification, description, format, review, and approval\n• Clause 7.5.3: Documented information shall be controlled to ensure availability, suitability, and adequate protection including storage, preservation, retrieval, retention, and disposition"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic record-keeping with automated retention enforcement and comprehensive classification essential for Level 3 maturity demonstrating organized compliance infrastructure"
    }
  },
  {
    "control_id": "VER-RES-01",
    "control_title": "Resource Management and Security of Supply",
    "category": "AI Verification & Validation",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish resource management procedures including security-of-supply measures for critical AI system components, ensuring adequate allocation of computational, data, personnel, and infrastructure resources with documented contingency plans for supply chain disruptions affecting AI system availability or performance.",
    "control_objective": "Ensure continuous availability of all resources critical to AI system operation and compliance through proactive resource planning, supply chain risk assessment, and documented contingency measures.",
    "risk_description": "Inadequate resource management creates AI system availability gaps that may prevent compliance with performance requirements under Article 15 and post-market monitoring obligations under Article 72. Single-source supply chain dependencies for critical components (cloud infrastructure, specialized hardware, training data) expose the organization to service disruptions that degrade AI system performance below validated thresholds. Failure to maintain security-of-supply measures violates Article 17(1)(l) QMS requirements, potentially invalidating quality management system certification.",
    "implementation": {
      "requirements": [
        "Resource Management Plan identifying all resources required for AI system development, deployment, operation",
        "Security of Supply Assessment evaluating supply chain risks for critical AI system components including cloud service provider concentration risk",
        "Resource Allocation Matrix mapping resource requirements to AI system lifecycle phases with responsible owners",
        "Critical Resource Identification cataloguing all resources whose unavailability would degrade AI system performance",
        "Supply Chain Risk Assessment evaluating all external dependencies including cloud infrastructure providers"
      ],
      "steps": [
        "Conduct comprehensive resource inventory identifying all computational, data, human",
        "Perform security of supply assessment evaluating single-source dependencies, geographic concentration risks",
        "Develop resource allocation matrix with phase-specific requirements, responsible owners, capacity thresholds triggering escalation",
        "Identify critical resources through single point of failure analysis, establish minimum viable resource levels for each",
        "Create supply chain contingency plans including alternative provider pre-qualification"
      ],
      "timeline": "Resource management plan established during AI system planning; security of supply assessment before procurement commitments"
    },
    "evidence_requirements": [
      "Resource Management Plan",
      "Security of Supply Assessment",
      "Resource Allocation Matrix",
      "Critical Resource Identification",
      "Supply Chain Risk Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 17(1)(l)",
          "context": "Quality management system shall include resource management procedures including security-of-supply measures ensuring adequate resources for AI system compliance and operation"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• Clause 7.1",
          "context": "The organization shall determine and provide the resources needed for the establishment, implementation, maintenance, and continual improvement of the AI management system\n• Annex A.4.2: The organization shall identify and document resources relevant to the development, provision, and use of AI systems including data, tooling, system and computing resources, and human resources"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive resource management with security-of-supply measures and supply chain risk assessment supports Level 3 maturity demonstrating operational resilience for AI system continuity"
    }
  },
  {
    "control_id": "VER-ROBUST-01",
    "control_title": "Robustness and Resilience Testing",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive robustness and resilience testing for all high-risk AI systems including documented robustness test plans, stress test results under extreme conditions, error injection test logs, environmental variation testing across deployment conditions, and resilience assessment reports to ensure AI systems remain reliable under adverse conditions.",
    "control_objective": "Ensure high-risk AI systems maintain acceptable performance when subjected to errors, faults, inconsistencies, and environmental variations representative of real-world deployment conditions.",
    "risk_description": "AI systems without robustness testing fail unpredictably when encountering real-world data variations, edge cases, and environmental conditions not represented in standard test sets. Non-compliance with EU AI Act Article 15(4) resilience requirements for high-risk systems creates regulatory liability and potential market access restrictions. System failures under stress conditions create safety risks for end-users and erode trust in AI system reliability.",
    "implementation": {
      "requirements": [
        "Robustness Test Plan defining test scenarios for input perturbations, data quality degradation, edge cases, distribution shifts",
        "Stress Test Results documenting system behavior under extreme load conditions, maximum input volumes",
        "Error Injection Test Log recording systematic error injection tests",
        "Environmental Variation Testing documenting system performance across deployment environment variations",
        "Resilience Assessment Report evaluating overall system resilience including recovery time objectives"
      ],
      "steps": [
        "Develop robustness test plan identifying critical failure modes through FMEA analysis, defining input perturbation scenarios",
        "Execute stress testing using load testing tools (Locust, k6, JMeter) measuring system behavior from normal load through 2x, 5x",
        "Conduct systematic error injection testing using chaos engineering principles (Netflix Chaos Monkey approach) injecting corrupted inputs",
        "Perform environmental variation testing across target deployment configurations measuring accuracy and latency variations across hardware platforms",
        "Generate resilience assessment report consolidating all robustness test results with overall resilience rating"
      ],
      "timeline": "Robustness test plan created during design; stress testing during development; error injection before deployment"
    },
    "evidence_requirements": [
      "Robustness Test Plan",
      "Stress Test Results",
      "Error Injection Test Log",
      "Environmental Variation Testing",
      "Resilience Assessment Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 15(4)",
          "context": "High-risk AI systems shall be resilient regarding errors, faults or inconsistencies that may occur within the system or environment"
        },
        {
          "ref": "Article 15(5)",
          "context": "High-risk AI systems shall be resilient against attempts by unauthorized third parties to alter use or performance"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.6",
          "context": "Evaluate AI system regularly for safety risks including robustness under adverse conditions"
        },
        {
          "ref": "MEASURE.2.7",
          "context": "Evaluate and document AI system security and resilience against environmental perturbations"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Evaluation criteria include reliability and safety requirements including robustness specifications"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive robustness testing with chaos engineering and environmental variation analysis essential for Level 4 maturity demonstrating validated AI system resilience"
    }
  },
  {
    "control_id": "VER-SAFE-01",
    "control_title": "Safety Testing",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive safety testing for all high-risk AI systems including documented safety test plans, failure mode analysis, fail-safe mechanism test results, safety metric assessments, and safety certification documentation to ensure residual risk is judged acceptable and systems can fail safely under all foreseeable conditions.",
    "control_objective": "Ensure high-risk AI systems demonstrate acceptable residual risk through systematic safety testing with validated fail-safe mechanisms and documented failure mode analysis.",
    "risk_description": "Untested fail-safe mechanisms create catastrophic failure risk when AI systems encounter unanticipated conditions in safety-critical deployment environments. Absence of systematic failure mode analysis prevents identification of hazardous failure modes that compound through AI system interactions. Non-compliance with EU AI Act Article 9(5) requirement for acceptable residual risk creates direct regulatory liability and potential harm to end-users in high-risk applications.",
    "implementation": {
      "requirements": [
        "Safety Test Plan defining safety-critical test scenarios, hazard analysis integration",
        "Failure Mode Analysis (FMEA/FMECA) systematically identifying potential failure modes of the AI system",
        "Fail-Safe Mechanism Test Results documenting testing of all fail-safe mechanisms including graceful degradation",
        "Safety Metric Assessment measuring safety-relevant metrics including false negative rates for safety-critical outputs",
        "Safety Certification Documentation compiling complete safety evidence package including safety case argument"
      ],
      "steps": [
        "Develop safety test plan derived from risk assessment",
        "Conduct systematic failure mode analysis (FMEA) for each AI system component identifying failure modes, causal mechanisms, safety effects, severity"
      ],
      "timeline": "Safety test plan created during risk management; FMEA during design; fail-safe testing before deployment"
    },
    "evidence_requirements": [
      "Safety Test Plan",
      "Failure Mode Analysis",
      "Fail-Safe Mechanism Test Results",
      "Safety Metric Assessment",
      "Safety Certification Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(5)",
          "context": "Risk management measures shall ensure that residual risk associated with each hazard and overall residual risk is judged acceptable"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.6",
          "context": "Evaluate AI system regularly for safety risks"
        },
        {
          "ref": "demonstrate system safety, acceptable residual risk, and ability to fail safely under foreseeable conditions",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Reliability and safety requirements including acceptable error rates and fail-safe behavior specifications"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic safety testing with FMEA, validated fail-safe mechanisms, and safety certification essential for Level 4 maturity in safety-critical AI deployments"
    }
  },
  {
    "control_id": "VER-SEC-01",
    "control_title": "Security Testing and Adversarial Robustness",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement comprehensive security testing and adversarial robustness evaluation for all high-risk AI systems including documented security test plans, adversarial robustness test results, penetration test reports, data poisoning vulnerability assessments, and model extraction risk assessments to ensure AI systems are resilient against security threats and adversarial attacks.",
    "control_objective": "Ensure AI systems are protected against AI-specific security threats including adversarial examples, data poisoning, model extraction, and model inversion through systematic security testing and documented vulnerability assessments.",
    "risk_description": "AI systems without adversarial robustness testing are vulnerable to adversarial attacks that manipulate system outputs in safety-critical applications with potentially catastrophic consequences. Unassessed data poisoning vulnerabilities allow attackers to compromise training data integrity, embedding backdoors that persist through model retraining cycles. Non-compliance with EU AI Act Article 15(5) requirement for technical solutions addressing AI-specific vulnerabilities creates regulatory liability and leaves systems exposed to known attack vectors.",
    "implementation": {
      "requirements": [
        "Security Test Plan defining AI-specific threat scenarios, attack vectors, test methodologies, security acceptance criteria",
        "Adversarial Robustness Test Results documenting system responses to adversarial input perturbations using established attack methods",
        "Penetration Test Report from qualified security assessors documenting AI-specific penetration testing including API security",
        "Data Poisoning Vulnerability Assessment evaluating susceptibility to training data poisoning attacks",
        "Model Extraction Risk Assessment evaluating risk of model theft through query-based extraction attacks"
      ],
      "steps": [
        "Develop AI security test plan mapping MITRE ATLAS attack tactics to system components",
        "Execute adversarial robustness testing using established frameworks (IBM ART, CleverHans, Foolbox) applying white-box attacks",
        "Conduct AI-specific penetration testing through qualified assessors (CREST or equivalent) testing model API endpoints",
        "Assess data poisoning vulnerability by simulating poisoning attacks",
        "Evaluate model extraction risk through query-based extraction simulation measuring extraction fidelity"
      ],
      "timeline": "Security test plan during design; adversarial testing during development; penetration testing before deployment"
    },
    "evidence_requirements": [
      "Security Test Plan",
      "Adversarial Robustness Test Results",
      "Penetration Test Report",
      "Data Poisoning Vulnerability Assessment",
      "Model Extraction Risk Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 15(5)",
          "context": "Technical solutions to address AI-specific vulnerabilities shall include measures to prevent, detect, respond to and control attacks including data poisoning, model poisoning, adversarial examples, or model flaws"
        },
        {
          "ref": "Annex IV(2)(h)",
          "context": "Cybersecurity measures put in place for high-risk AI systems"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.7",
          "context": "Evaluate and document AI system security and resilience as part of the broader security assessment"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.3",
          "context": "Consider security threats throughout AI system life cycle including data poisoning, model stealing, and model inversion"
        },
        {
          "ref": "Clause A.6.2.4",
          "context": "Identify AI-specific security threats and implement appropriate countermeasures"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive AI security testing with adversarial robustness validation and continuous threat monitoring essential for Level 4 maturity in AI security posture"
    }
  },
  {
    "control_id": "VER-STAGE-01",
    "control_title": "Examination and Validation at Development Stages",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement examination, test, and validation procedures at each stage of AI system development including documented stage gate test plans, development phase validation results, integration testing reports, pre-release validation evidence, and post-development examination records to ensure systematic quality verification before, during, and after development.",
    "control_objective": "Ensure high-risk AI systems undergo systematic examination, testing, and validation at each development stage with documented evidence demonstrating quality verification throughout the complete development lifecycle.",
    "risk_description": "AI systems deployed without systematic stage-gate testing accumulate undetected defects across development phases that compound in severity and remediation cost. Absence of integration testing allows component interaction failures that only manifest under production conditions, causing system-level failures. Non-compliance with EU AI Act Article 17(1)(d) explicit requirement for examination and validation before, during, and after development creates fundamental QMS non-conformity.",
    "implementation": {
      "requirements": [
        "Stage Gate Test Plan defining examination and validation activities for each development stage",
        "Development Phase Validation Results documenting validation outcomes at each development phase including unit test results",
        "Integration Testing Report documenting systematic integration testing of AI system components including model-pipeline integration",
        "Pre-Release Validation documenting final validation activities before deployment including production-environment testing",
        "Post-Development Examination Records documenting post-release examination activities including initial production performance verification"
      ],
      "steps": [
        "Develop stage gate test plan mapping specific test activities to each development phase with defined test objectives",
        "Execute development phase validation at each stage gate collecting unit test results",
        "Conduct integration testing validating component interactions including data pipeline to model integration",
        "Complete pre-release validation in production-equivalent environment including performance testing under expected load",
        "Execute post-development examination within 30 days of deployment verifying production performance matches pre-release benchmarks"
      ],
      "timeline": "Stage gate test plan established before development; phase validation at each stage gate"
    },
    "evidence_requirements": [
      "Stage Gate Test Plan",
      "Development Phase Validation Results",
      "Integration Testing Report",
      "Pre-Release Validation",
      "Post-Development Examination Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(d)",
          "context": "Quality management system for high-risk AI systems shall include examination, test, and validation procedures to be carried out before, during, and after development of the high-risk AI system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.1",
          "context": "Document test sets, metrics, and details about the tools used during test, evaluation, verification, and validation"
        },
        {
          "ref": "MEASURE.2.3",
          "context": "Measure AI system performance in conditions similar to deployment conditions including anticipated changes in deployment context"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures including stage-specific testing procedures, acceptance criteria, and examination methods for each development phase"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic stage-gate testing with documented validation at each development phase essential for Level 4 maturity demonstrating comprehensive verification and validation discipline"
    }
  },
  {
    "control_id": "VER-STD-01",
    "control_title": "Technical Standards Application",
    "category": "AI Verification & Validation",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL identify, apply, and document technical specifications and harmonised standards relevant to high-risk AI systems including a maintained applied standards register, harmonised standards mapping, standards compliance evidence, gap analysis against applicable standards, and documented justification for any standards deviations.",
    "control_objective": "Ensure high-risk AI systems are developed and operated in accordance with applicable technical standards and harmonised standards with documented compliance evidence and justified deviations.",
    "risk_description": "Failure to identify and apply applicable harmonised standards forfeits the presumption of conformity that harmonised standards provide under EU AI Act Article 40, requiring more burdensome alternative conformity demonstration. Undocumented standards deviations create hidden compliance gaps that are discovered during conformity assessment, potentially delaying market access. Absence of standards monitoring results in non-compliance with newly published harmonised standards creating retroactive compliance obligations.",
    "implementation": {
      "requirements": [
        "Applied Standards Register maintaining a current inventory of all technical specifications and harmonised standards applied to high-risk AI",
        "Harmonised Standards Mapping documenting the relationship between applied harmonised standards and EU AI Act requirements",
        "Standards Compliance Evidence documenting demonstrated compliance with each applied standard including audit results",
        "Gap Analysis Against Standards identifying gaps between current AI system practices and applicable standard requirements including gap severity",
        "Standards Deviation Justification documenting and justifying any intentional deviations from applicable standards including deviation description"
      ],
      "steps": [
        "Compile applied standards register by identifying all applicable technical specifications and harmonised standards",
        "Create harmonised standards mapping matrix linking specific standard clauses to EU AI Act requirements",
        "Collect standards compliance evidence through internal audits, conformity assessments, testing results",
        "Conduct gap analysis comparing current practices against each applicable standard requirement, rating gap severity",
        "Document standards deviations with formal deviation request including technical justification"
      ],
      "timeline": "Applied standards register established during system planning; harmonised standards mapping before design"
    },
    "evidence_requirements": [
      "Applied Standards Register",
      "Harmonised Standards Mapping",
      "Standards Compliance Evidence",
      "Gap Analysis Against Standards",
      "Standards Deviation Justification"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(e)",
          "context": "Quality management system for high-risk AI systems shall include technical specifications including standards to be applied and where relevant harmonised standards are not applied in full, the means used to ensure compliance"
        },
        {
          "ref": "Annex IV(7)",
          "context": "Technical documentation shall contain a list of the harmonised standards applied in full or in part and a detailed description of the solutions adopted to meet requirements where harmonised standards have not been applied"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports verification and validation processes",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 4.2",
          "context": "Determine the requirements of interested parties including applicable standards bodies, regulatory authorities, and industry associations relevant to AI system governance"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic standards application with documented compliance evidence and gap analysis essential for Level 3 maturity demonstrating standards-based AI governance"
    }
  },
  {
    "control_id": "VER-TEVV-01",
    "control_title": "Test, Evaluation, Verification and Validation Framework",
    "category": "AI Verification & Validation",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish a comprehensive Test, Evaluation, Verification, and Validation (TEVV) framework for AI systems including documented TEVV framework specifications, test strategies with defined scope and coverage, metric selection rationale with statistical justification, tool qualification records, and TEVV process effectiveness reviews to ensure systematic quality assurance throughout the AI lifecycle.",
    "control_objective": "Ensure AI systems undergo rigorous, documented testing with justified metrics, qualified tools, and validated processes that demonstrate system quality throughout development and prior to deployment.",
    "risk_description": "Absence of systematic TEVV framework allows AI systems to deploy without adequate testing, creating undetected defects in accuracy, fairness, and robustness that manifest as real-world failures. Non-compliance with EU AI Act Article 9(8) requirement for testing throughout development and prior to market placement. Unqualified testing tools produce unreliable test results that fail to detect critical AI system failures, undermining the entire quality assurance process.",
    "implementation": {
      "requirements": [
        "TEVV Framework Document establishing organizational TEVV methodology including testing taxonomy",
        "Test Strategy defining test scope, coverage requirements, test environment specifications",
        "Metric Selection Rationale documenting justification for each TEVV metric selected including statistical properties",
        "Tool Qualification Records documenting qualification evidence for all TEVV tools",
        "TEVV Process Effectiveness Review evaluating overall TEVV process performance including defect detection rates"
      ],
      "steps": [
        "Develop TEVV framework document establishing testing taxonomy, verification and validation approaches specific to AI systems",
        "Create test strategy for each AI system defining scope (functional, performance, security, fairness, robustness), coverage targets",
        "Document metric selection rationale with statistical justification for each metric",
        "Establish tool qualification process verifying TEVV tools",
        "Implement TEVV process effectiveness review conducting quarterly assessments of defect detection effectiveness, test coverage trends, metric relevance"
      ],
      "timeline": "TEVV framework established before development; test strategy created per project"
    },
    "evidence_requirements": [
      "TEVV Framework Document",
      "Test Strategy",
      "Metric Selection Rationale",
      "Tool Qualification Records",
      "TEVV Process Effectiveness Review"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(6)",
          "context": "High-risk AI systems shall be tested for purposes of identifying appropriate and targeted risk management measures"
        },
        {
          "ref": "Article 9(8)",
          "context": "Testing shall be performed throughout development and prior to market placement"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Validation and testing procedures including information on test data and test methodology"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.1",
          "context": "Document test sets, metrics, and details about tools used in testing"
        },
        {
          "ref": "MEASURE.2.13",
          "context": "Evaluate effectiveness of employed TEVV metrics and processes and document results"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause A.6.2.4",
          "context": "Define verification and validation measures for AI system development"
        },
        {
          "ref": "Clause 9.1",
          "context": "Determine methods for monitoring, measurement, analysis, and evaluation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive TEVV framework with qualified tools and effectiveness monitoring essential for Level 3 maturity demonstrating systematic AI quality assurance"
    }
  },
  {
    "control_id": "OPS-ACCESS-01",
    "control_title": "Accessibility Compliance",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure that high-risk AI systems and their user interfaces comply with applicable accessibility requirements under Directive (EU) 2016/2102 (Web Accessibility Directive), European Accessibility Act (Directive 2019/882), and WCAG 2.1 Level AA standards, providing equitable access for persons with disabilities including those using assistive technologies.",
    "control_objective": "Ensure high-risk AI systems are accessible to all users including persons with disabilities through compliance with EU accessibility directives and WCAG standards, preventing discriminatory exclusion from AI-driven services.",
    "risk_description": "Non-compliance with EU accessibility directives for high-risk AI systems creates direct regulatory liability under both the EU AI Act Article 16(l) and the European Accessibility Act, with potential enforcement actions, fines, and mandatory remediation orders. Inaccessible AI systems systematically exclude persons with disabilities from AI-driven services, creating discriminatory outcomes that undermine the fundamental rights protections central to the EU AI Act's objectives. Organizations that fail to test AI outputs and interfaces with assistive technologies discover accessibility barriers only through user complaints and regulatory audits, by which time significant harm to affected individuals has already occurred.",
    "implementation": {
      "requirements": [
        "Accessibility Requirements Checklist documenting all applicable accessibility obligations for each high-risk AI system including WCAG 2.1 Level",
        "Accessibility Testing Results documenting systematic evaluation of AI system interfaces against WCAG 2.1 Level AA criteria using both automated",
        "WCAG Compliance Assessment providing comprehensive evaluation of AI system outputs, explanations",
        "Assistive Technology Compatibility Report documenting testing results with major assistive technologies including screen readers",
        "Accessibility Statement publishing a conformance statement for each high-risk AI system documenting the accessibility standard applied"
      ],
      "steps": [
        "Conduct accessibility requirements analysis for each high-risk AI system identifying all applicable EU accessibility directives, WCAG criteria",
        "Perform automated accessibility scanning using axe-core, WAVE, or Lighthouse integrated into CI/CD pipeline to catch accessibility regressions on every build",
        "Execute manual accessibility testing with certified accessibility experts evaluating complex interaction patterns",
        "Conduct assistive technology compatibility testing with actual assistive technology users or certified testers using JAWS, NVDA, VoiceOver",
        "Publish accessibility statements for each high-risk AI system conforming to EU Web Accessibility Directive Article 7 requirements and establish accessibility"
      ],
      "timeline": "Accessibility requirements analysis completed during AI system design phase; automated scanning integrated into development pipeline"
    },
    "evidence_requirements": [
      "Accessibility Requirements Checklist",
      "Accessibility Testing Results",
      "WCAG Compliance Assessment",
      "Assistive Technology Compatibility Report",
      "Accessibility Statement"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(l)",
          "context": "Providers of high-risk AI systems shall ensure that the AI system complies with accessibility requirements in accordance with Directives (EU) 2016/2102 and (EU) 2019/882 ensuring equitable access for persons with disabilities"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A - No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "accessibility supports broader trustworthiness and equity objectives",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "A.5.4",
          "context": "Areas of impact assessment including accessibility as a dimension of AI system impact on individuals and groups"
        },
        {
          "ref": "A.9.3",
          "context": "Objectives for AI system operation include accessibility ensuring equitable access for all users"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic accessibility compliance with automated scanning, assistive technology testing, and published accessibility statements essential for Level 3 maturity demonstrating inclusive AI system deployment meeting EU regulatory accessibility requirements"
    }
  },
  {
    "control_id": "OPS-AUDIT-01",
    "control_title": "Internal Audit Programme",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL plan, establish, implement, and maintain an internal audit programme for the AI management system that defines audit frequency, scope, criteria, and methodology, ensures auditor independence and competence, covers all applicable requirements of ISO/IEC 42001, NIST AI RMF, and EU AI Act, and produces documented audit findings with tracked corrective actions.",
    "control_objective": "Ensure independent, systematic, and competent evaluation of the AI management system's conformity and effectiveness through a planned internal audit programme that identifies improvement opportunities, verifies control implementation, and provides objective evidence of compliance.",
    "risk_description": "Without a planned internal audit programme, the organization lacks independent verification that AI management system controls are implemented as designed and operating effectively, allowing compliance gaps and control failures to persist undetected until external audit or regulatory inspection. Auditors without AI domain competence produce superficial findings that miss critical technical control weaknesses in areas such as model validation, data governance, and monitoring effectiveness. Missing auditor independence compromises audit objectivity and credibility, undermining the organization's ability to rely on internal audit results for compliance assurance and management decision-making.",
    "implementation": {
      "requirements": [
        "Internal Audit Programme defining the multi-year audit plan covering all elements of the AI management system including audit frequency",
        "Audit Schedule detailing specific audit engagements planned for the current cycle including audit dates",
        "Audit Criteria and Scope Definition for each audit engagement specifying the requirements being audited",
        "Auditor Independence Declaration confirming that assigned auditors are independent from the activities being audited",
        "Audit Results Report documenting findings for each audit engagement including audit scope and criteria"
      ],
      "steps": [
        "Develop internal audit programme using risk-based approach per ISO/IEC 42001 Clause",
        "Create audit schedule for the current cycle mapping all AI management system processes and controls to specific audit engagements",
        "Define audit criteria and scope for each engagement referencing specific requirements from ISO/IEC 42001",
        "Assign qualified auditors ensuring independence from audited activities per ISO 19011 principles, verifying AI domain competence"
      ],
      "timeline": "Internal audit programme established during AI management system implementation; first audit cycle completed within 12 months of AI management system certification"
    },
    "evidence_requirements": [
      "Internal Audit Programme",
      "Audit Schedule",
      "Audit Criteria and Scope Definition",
      "Auditor Independence Declaration",
      "Audit Results Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall operational monitoring requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.1.3",
          "context": "Internal experts who did not serve as combatants in the assessment or development of the AI system are involved in regular assessments and checks to provide independent evaluation"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.2.1",
          "context": "The organization shall conduct internal audits at planned intervals to provide information on whether the AI management system conforms to the organization's own requirements and the requirements of ISO/IEC 42001 and is effectively implemented and maintained"
        },
        {
          "ref": "Clause 9.2.2",
          "context": "The organization shall plan, establish, implement, and maintain an audit programme including frequency, methods, responsibilities, planning requirements, and reporting"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Planned internal audit programme with AI-competent independent auditors and tracked findings essential for Level 3 maturity demonstrating systematic verification of AI management system conformity and effectiveness"
    }
  },
  {
    "control_id": "OPS-CHANGE-01",
    "control_title": "System Update and Change Management",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a formal change management procedure for all AI system modifications including pre-determined changes documented at conformity assessment, post-deployment updates, configuration changes, and infrastructure modifications, ensuring all changes are planned, assessed for impact, approved through defined workflows, tested, documented, and traceable throughout the AI system lifecycle.",
    "control_objective": "Ensure all changes to high-risk AI systems are controlled, assessed, approved, and documented through formal change management processes that maintain system compliance and prevent unintended consequences.",
    "risk_description": "Uncontrolled changes to high-risk AI systems may constitute substantial modifications requiring new conformity assessment under Article 43, and undocumented changes make it impossible to determine whether re-assessment obligations have been triggered. Changes deployed without impact assessment may degrade AI system performance, introduce bias, or create safety risks that would have been identified through proper pre-deployment evaluation. Missing change documentation violates Annex IV requirements and creates traceability gaps that undermine the organization's ability to demonstrate compliance during market surveillance inspections.",
    "implementation": {
      "requirements": [
        "Change Management Procedure defining the end-to-end process for managing all AI system changes including change categories",
        "Change Request Form standardizing change request documentation including change description",
        "Impact Assessment for Changes evaluating the effects of proposed changes on AI system performance, safety, fairness, compliance",
        "Change Approval Records documenting all approval decisions for each change request including approver identity",
        "Pre-Determined Change Documentation maintaining a register of all changes pre-assessed during initial conformity assessment per Article 13(3)(c)"
      ],
      "steps": [
        "Establish change management procedure defining change categories aligned with EU AI Act requirements including pre-determined changes",
        "Design change request form capturing all information needed for impact assessment and approval including technical change specification",
        "Implement change impact assessment process evaluating each proposed change against EU AI Act requirements",
        "Establish change approval workflow with role-based approval requirements",
        "Document all pre-determined changes from initial conformity assessment in a maintained register cross-referenced to conformity assessment records"
      ],
      "timeline": "Change management procedure established before initial deployment; change request forms and approval workflows active from deployment"
    },
    "evidence_requirements": [
      "Change Management Procedure",
      "Change Request Form",
      "Impact Assessment for Changes",
      "Change Approval Records",
      "Pre-Determined Change Documentation"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 13(3)(c)",
          "context": "Instructions of use shall describe pre-determined changes to the high-risk AI system and its performance that have been pre-assessed at the time of the initial conformity assessment\n• Annex IV(2)(f): A detailed description of pre-determined changes to the system and its performance together with relevant information\n• Annex IV(6): A detailed description of relevant changes made by the provider to the system throughout its lifecycle"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• MANAGE.4.2",
          "context": "Measurable activities for continual improvements are integrated into AI system updates and include regular reviews of processes and outcomes"
        }
      ],
      "iso_42001": [
        {
          "ref": "• Clause 6.3",
          "context": "When the organization determines the need for changes to the AI management system, the changes shall be carried out in a planned manner\n• Clause 8.1: The organization shall plan, implement, and control the processes needed to meet requirements including controlling planned changes and reviewing the consequences of unintended changes\n• Annex A.6.2.6: The organization shall define processes for system updates ensuring changes are controlled and documented"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Formal change management with pre-determined change documentation and compliance impact assessment essential for Level 3 maturity demonstrating controlled AI system evolution throughout operational lifetime"
    }
  },
  {
    "control_id": "OPS-COMPLY-01",
    "control_title": "Continuous Compliance Management",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a continuous compliance management system that systematically monitors, evaluates, and documents ongoing adherence to all applicable AI regulatory requirements including the EU AI Act, NIST AI RMF, and ISO/IEC 42001, with documented compliance monitoring plans, regulatory change tracking, compliance dashboards, periodic assessments, and trend analysis enabling proactive compliance management throughout the AI system lifecycle.",
    "control_objective": "Ensure sustained regulatory compliance for all AI systems through continuous monitoring, proactive regulatory change management, and systematic compliance evaluation enabling timely identification and remediation of compliance gaps.",
    "risk_description": "Organizations without continuous compliance management operate with a point-in-time compliance snapshot that rapidly becomes outdated as regulations evolve, standards are updated, and AI systems change, creating growing compliance gaps. Failure to track regulatory developments means organizations learn about new requirements through enforcement actions rather than proactive monitoring, requiring costly emergency remediation. Absence of compliance trend analysis prevents identification of systemic compliance weaknesses, allowing recurring non-conformities to persist and compound across multiple AI systems.",
    "implementation": {
      "requirements": [
        "Continuous Compliance Monitoring Plan defining the approach for ongoing compliance verification including monitoring scope covering all",
        "Regulatory Change Tracker maintaining an up-to-date register of all regulatory developments relevant to AI systems including new legislation",
        "Compliance Dashboard providing real-time visibility into organizational AI compliance status including control implementation status",
        "Periodic Compliance Assessment conducting regular systematic evaluations of AI system compliance against all applicable requirements",
        "Compliance Trend Report analyzing compliance performance over time including non-conformity trends"
      ],
      "steps": [
        "Develop continuous compliance monitoring plan mapping all applicable regulatory requirements to specific compliance indicators, defining monitoring frequency",
        "Implement regulatory change tracking process with designated regulatory intelligence sources",
        "Deploy compliance dashboard using GRC platform",
        "Establish periodic compliance assessment program including quarterly internal compliance reviews"
      ],
      "timeline": "Compliance monitoring plan established before first AI system deployment; regulatory change tracker active continuously"
    },
    "evidence_requirements": [
      "Continuous Compliance Monitoring Plan",
      "Regulatory Change Tracker",
      "Compliance Dashboard",
      "Periodic Compliance Assessment",
      "Compliance Trend Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 16(a)",
          "context": "Providers of high-risk AI systems shall ensure that their high-risk AI systems are compliant with the requirements set out in Chapter 2 of the EU AI Act\n• Article 17(1): Providers of high-risk AI systems shall put a quality management system in place that ensures compliance with this Regulation in a systematic and orderly manner"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• GOVERN.1.1",
          "context": "Legal and regulatory requirements involving AI are understood, managed, and documented including policies and procedures to guide the governance of AI systems"
        }
      ],
      "iso_42001": [
        {
          "ref": "• Clause 10.1",
          "context": "The organization shall continually improve the suitability, adequacy, and effectiveness of the AI management system through corrective actions and continual improvement activities\n• Clause 9.1: The organization shall evaluate the AI management system performance and the effectiveness of the management system including what needs to be monitored and measured"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Continuous compliance monitoring with regulatory change tracking and trend analysis essential for Level 4 maturity demonstrating proactive and sustained regulatory compliance management across all AI systems"
    }
  },
  {
    "control_id": "OPS-DATA-01",
    "control_title": "Production Data Management",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement continuous production data quality monitoring, data drift detection, and data lineage tracking for all deployed AI systems to ensure that production data remains within validated parameters, that data quality anomalies are detected and escalated in real time, and that complete data provenance is maintained from source ingestion through model inference output.",
    "control_objective": "Ensure AI systems operate on production data that meets validated quality thresholds, with automated detection of data drift, schema violations, and anomalies that could degrade model performance or produce unreliable outputs.",
    "risk_description": "Without production data quality monitoring, AI systems silently degrade as input data drifts from training distributions, producing increasingly unreliable predictions that stakeholders continue to trust. Undetected data quality issues such as missing features, schema changes, or upstream data pipeline failures cause model inference errors that propagate into business decisions without any operational visibility. Missing data lineage prevents impact analysis when upstream data sources change, creating cascading failures across dependent AI systems with no ability to trace root causes or assess blast radius.",
    "implementation": {
      "requirements": [
        "Production Data Quality Monitoring Framework defining continuous automated checks on production data feeds including completeness monitoring",
        "Data Drift Detection Procedure establishing statistical methods for detecting distribution shifts between training data and production data",
        "Production Data Lineage Registry maintaining end-to-end traceability of all data consumed by production AI systems including source system",
        "Real-Time Data Quality Dashboard providing operational visibility into production data health across all deployed AI systems including current",
        "Production Data Anomaly Log recording all detected data quality violations, drift events"
      ],
      "steps": [
        "Deploy production data quality monitoring using Great Expectations, Soda Core, or equivalent data validation framework with expectation suites configured for each",
        "Implement data drift detection pipeline using Evidently AI, NannyML, or equivalent drift monitoring tool computing PSI, KS-test",
        "Establish production data lineage tracking using Apache Atlas, DataHub, Marquez, or equivalent data catalog tool with automated lineage capture from ETL/ELT",
        "Build real-time data quality dashboard using Grafana, Datadog, or equivalent observability platform aggregating quality metrics, drift indicators",
        "Define data anomaly response procedures with severity-based escalation matrix, automated circuit breakers for critical data quality failures"
      ],
      "timeline": "Production data monitoring framework deployed before AI system production launch"
    },
    "evidence_requirements": [
      "Production Data Quality Monitoring Framework",
      "Data Drift Detection Procedure",
      "Production Data Lineage Registry",
      "Real-Time Data Quality Dashboard",
      "Production Data Anomaly Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A - No direct EU AI Act article mapping",
          "context": ""
        },
        {
          "ref": "however, production data quality monitoring supports Article 9 risk management and Article 15 accuracy requirements indirectly",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.4",
          "context": "The AI system is monitored for performance, trustworthiness characteristics, and impacts during production operations including data quality degradation and distribution drift that affects system reliability"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.2.6",
          "context": "Monitor for errors and whether system performs as expected with production data including data quality monitoring and anomaly detection"
        },
        {
          "ref": "A.7.2",
          "context": "Data management processes ensuring production data quality, integrity, and fitness for purpose"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Continuous production data monitoring with automated drift detection, quality dashboards, and data lineage tracking essential for Level 3 maturity demonstrating operational control over AI system data dependencies in production environments"
    }
  },
  {
    "control_id": "OPS-IMPROVE-01",
    "control_title": "Continual Improvement Process",
    "category": "AI Operations & Monitoring",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL continually improve the suitability, adequacy, and effectiveness of the AI management system through systematic identification of improvement opportunities from audit findings, management reviews, monitoring data, incident analyses, stakeholder feedback, and regulatory developments, implementing prioritized improvement initiatives with measurable outcomes and effectiveness tracking.",
    "control_objective": "Ensure the AI management system evolves and improves over time through systematic identification, prioritization, implementation, and measurement of improvement initiatives driven by operational data, stakeholder feedback, and regulatory developments.",
    "risk_description": "Without a systematic continual improvement process, the AI management system stagnates after initial implementation, failing to evolve with changing regulatory requirements, emerging AI risks, advancing technology, and accumulated operational experience. Organizations that lack improvement tracking and effectiveness measurement cannot demonstrate to certification bodies, regulators, or stakeholders that the AI management system is maturing and responding to identified weaknesses. Missing lessons learned integration means each AI project operates in isolation, repeating mistakes, duplicating effort, and failing to leverage organizational knowledge accumulated through prior AI system development and operations.",
    "implementation": {
      "requirements": [
        "Continual Improvement Procedure defining the organizational process for identifying, evaluating, prioritizing, implementing",
        "Improvement Initiative Tracker maintaining a centralized register of all identified improvement opportunities and active improvement initiatives",
        "Lessons Learned Repository aggregating organizational knowledge from AI system operations including incident investigation findings",
        "Improvement Effectiveness Metrics defining quantitative and qualitative measures for evaluating the impact of improvement initiatives",
        "Annual Improvement Report summarizing the organization's AI management system improvement performance over the reporting period"
      ],
      "steps": [
        "Establish continual improvement procedure aligned with ISO/IEC 42001 Clause"
      ],
      "timeline": "Continual improvement procedure established during AI management system implementation"
    },
    "evidence_requirements": [
      "Continual Improvement Procedure",
      "Improvement Initiative Tracker",
      "Lessons Learned Repository",
      "Improvement Effectiveness Metrics",
      "Annual Improvement Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall operational monitoring requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.4.2",
          "context": "Measurable activities for continual improvement are integrated into AI system updates and include regular engagement with interested AI actors"
        },
        {
          "ref": "MEASURE.1.2",
          "context": "Appropriateness of AI metrics and effectiveness of existing measures are regularly assessed and updated including measures of performance, fairness, and other trustworthiness characteristics"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 10.1",
          "context": "The organization shall continually improve the suitability, adequacy, and effectiveness of the AI management system through the use of corrective actions, audit results, management review outputs, and other sources of improvement"
        },
        {
          "ref": "Clause 9.3.3",
          "context": "Outputs of the management review shall include decisions and actions related to continual improvement opportunities"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Governance Domain",
      "area": "Continual Improvement and",
      "maturity_enhancement": "Systematic continual improvement with measurable outcomes, lessons learned integration, and maturity-aligned prioritization essential for Level 4 maturity demonstrating an adaptive and self-improving AI management system"
    }
  },
  {
    "control_id": "OPS-INC-01",
    "control_title": "Incident Detection and Response",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive AI incident detection and response capability that defines incident classification criteria, escalation paths, root cause analysis procedures, corrective action workflows, and serious incident notification mechanisms, ensuring all AI system incidents are detected, reported, investigated, and resolved in accordance with regulatory requirements and organizational risk tolerance.",
    "control_objective": "Ensure rapid detection, systematic investigation, and effective resolution of AI system incidents through documented response procedures, clear escalation paths, and regulatory notification compliance to minimize harm and restore normal operations.",
    "risk_description": "Without established incident detection and response procedures, AI system failures, adversarial attacks, and performance degradation events go undetected or are handled through ad hoc processes that fail to contain harm, preserve evidence, or meet regulatory notification timelines. Failure to report serious incidents within EU AI Act Article 73 timeframes exposes the organization to enforcement actions including fines of up to €15 million or 3% of annual worldwide turnover. Missing root cause analysis allows systemic issues to recur across multiple AI systems, compounding organizational risk and regulatory exposure.",
    "implementation": {
      "requirements": [
        "Incident Response Plan defining end-to-end AI incident management procedures including detection mechanisms",
        "Incident Classification Matrix establishing a standardized taxonomy for AI-specific incidents including model performance degradation",
        "Incident Reporting Procedure standardizing how incidents are documented from initial detection through resolution including incident identifier",
        "Root Cause Analysis Template providing a structured methodology for investigating AI incidents using techniques such as 5-Why Analysis",
        "Serious Incident Notification Form compliant with Article 73 requirements for reporting serious incidents to market surveillance authorities"
      ],
      "steps": [
        "Develop AI-specific incident response plan building on existing organizational incident management frameworks, defining AI-unique detection sources",
        "Create incident classification matrix with AI-specific severity criteria including Critical",
        "Implement incident reporting workflow integrated with monitoring systems enabling automated incident ticket creation for threshold breaches",
        "Establish root cause analysis program with trained investigators using structured analysis techniques, mandatory RCA for all Critical and High severity incidents",
        "Prepare serious incident notification procedures aligned with EU AI Act Article 73 requirements including pre-drafted notification templates"
      ],
      "timeline": "Incident response plan established before initial AI system deployment; classification matrix defined during system design"
    },
    "evidence_requirements": [
      "Incident Response Plan",
      "Incident Classification Matrix",
      "Incident Reporting Procedure",
      "Root Cause Analysis Template",
      "Serious Incident Notification Form"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 17(1)(i)",
          "context": "Quality management system shall include procedures for reporting serious incidents and malfunctioning AI systems"
        },
        {
          "ref": "Article 16(j)",
          "context": "Providers of high-risk AI systems shall take the necessary corrective actions and provide information as required"
        },
        {
          "ref": "Article 73",
          "context": "Providers shall report any serious incident to the market surveillance authorities of the Member States where that incident occurred"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.3",
          "context": "Organizational practices are in place to enable AI testing, identification of incidents, and information sharing"
        },
        {
          "ref": "MANAGE.2.3",
          "context": "Procedures are followed to respond to and recover from a previously unknown risk when it is identified"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 10.2",
          "context": "When a nonconformity occurs, the organization shall react to the nonconformity and take action to control and correct it and deal with the consequences"
        },
        {
          "ref": "Annex A.8.4",
          "context": "The organization shall determine and document a plan for communicating AI system incidents to relevant interested parties"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive incident response with automated detection, structured investigation, and regulatory notification capability essential for Level 3 maturity demonstrating proactive incident management across all AI systems"
    }
  },
  {
    "control_id": "OPS-INC-02",
    "control_title": "Incident Communication to Users",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain incident communication procedures that define how AI system users, deployers, and affected persons are notified of incidents impacting system performance, safety, or compliance, including communication timelines, notification content requirements, authority reporting obligations, and disclosure documentation ensuring transparent and timely stakeholder communication.",
    "control_objective": "Ensure all relevant stakeholders including users, deployers, downstream affected persons, and regulatory authorities receive timely, accurate, and actionable incident notifications through documented communication procedures and standardized templates.",
    "risk_description": "Failure to communicate incidents to users and deployers leaves them operating AI systems with known defects, potentially causing cascading harm to affected persons who rely on system outputs for consequential decisions. Delayed or missing notifications to market surveillance authorities under Article 73 constitute a regulatory violation carrying significant financial penalties and reputational damage. Without standardized communication templates and timelines, ad hoc notifications provide inconsistent information quality, create legal exposure through unvetted communications, and erode stakeholder trust in the organization's AI governance maturity.",
    "implementation": {
      "requirements": [
        "Incident Communication Plan defining the end-to-end stakeholder notification process including identification of notification recipients",
        "User Notification Template providing standardized incident communication formats including incident summary",
        "Communication Timeline Requirements defining maximum notification timeframes for each incident severity level and stakeholder category",
        "Authority Notification Procedure defining the process for notifying market surveillance authorities of serious incidents per Article 73",
        "Incident Disclosure Log maintaining a comprehensive record of all incident communications including notification date"
      ],
      "steps": [
        "Develop incident communication plan identifying all stakeholder categories requiring notification",
        "Create user notification templates pre-approved by legal and compliance teams covering each incident severity level with appropriate detail",
        "Define communication timeline requirements aligned with EU AI Act Article 73 serious incident reporting obligations and contractual SLAs deployers",
        "Establish authority notification procedure with pre-designated regulatory liaison, pre-drafted notification templates for market surveillance authorities",
        "Implement incident disclosure log using GRC or incident management platform"
      ],
      "timeline": "Communication plan and templates established before initial deployment of high-risk AI systems"
    },
    "evidence_requirements": [
      "Incident Communication Plan",
      "User Notification Template",
      "Communication Timeline Requirements",
      "Authority Notification Procedure",
      "Incident Disclosure Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(j)",
          "context": "Providers shall take the necessary corrective actions and provide information as required in Article 20"
        },
        {
          "ref": "Article 20",
          "context": "Providers of high-risk AI systems shall provide deployers and affected persons with information about corrective actions taken"
        },
        {
          "ref": "Article 73",
          "context": "Providers shall report serious incidents to market surveillance authorities with required content and timelines"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports operational monitoring requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Annex A.8.4",
          "context": "The organization shall determine and document a plan for communicating incidents to users of the AI system and other relevant interested parties"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Structured incident communication with pre-approved templates, defined timelines, and disclosure logging essential for Level 3 maturity demonstrating transparent and regulatory-compliant stakeholder notification practices"
    }
  },
  {
    "control_id": "OPS-LOG-01",
    "control_title": "Automatic Event Logging",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure all high-risk AI systems technically allow for the automatic recording of events (logs) over their lifetime, with logging capabilities that enable the recording of events relevant to identifying situations posing risks, facilitate post-market monitoring, and support traceability of AI system operation including documented logging architecture, data schemas, retention policies, and tamper-protection mechanisms.",
    "control_objective": "Ensure comprehensive, tamper-resistant, and standards-compliant automatic event logging for all high-risk AI systems enabling risk identification, operational traceability, and regulatory compliance throughout the system lifecycle.",
    "risk_description": "High-risk AI systems without automatic event logging lack the traceability required by Article 12(1), making it impossible to investigate incidents, identify risk-posing situations, or demonstrate operational compliance to market surveillance authorities. Insufficient logging creates forensic blind spots that prevent root cause analysis when AI system failures affect individuals' rights or safety. Non-compliant logging infrastructure with inadequate retention or tamper protection may result in log evidence being challenged or deemed inadmissible during regulatory proceedings.",
    "implementation": {
      "requirements": [
        "Event Logging Architecture Document defining the technical logging infrastructure including log generation points across the AI system pipeline",
        "Log Retention Policy specifying retention periods for all log categories aligned with Article 18 requirements",
        "Log Data Schema defining standardized log formats including mandatory fields",
        "Automatic Logging Configuration documenting the technical configuration of automatic event recording including log generation triggers",
        "Log Storage and Protection Plan defining security measures for log integrity including write-once storage"
      ],
      "steps": [
        "Design event logging architecture identifying all logging points across the AI system pipeline, selecting centralized log management platform",
        "Define log data schema with mandatory fields per Article 12 requirements including timestamps millisecond precision",
        "Implement automatic logging configuration ensuring events are recorded without manual intervention",
        "Establish log retention and storage infrastructure with minimum 10-year retention per Article 18, write-once-read-many"
      ],
      "timeline": "Logging architecture designed during system development; log schemas defined before testing phase"
    },
    "evidence_requirements": [
      "Event Logging Architecture Document",
      "Log Retention Policy",
      "Log Data Schema",
      "Automatic Logging Configuration",
      "Log Storage and Protection Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 12(1)",
          "context": "High-risk AI systems shall technically allow for the automatic recording of events (logs) over the lifetime of the system ensuring traceability of the AI system's functioning\n• Article 12(2): Logging capabilities shall conform to recognised standards or common specifications and ensure a level of traceability enabling monitoring of the system's operation with respect to risk-posing situations\n• Article 16(e): Providers of high-risk AI systems shall keep the logs automatically generated by their high-risk AI systems to the extent such logs are under their control"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• Annex A.6.2.8",
          "context": "The organization shall determine at which phases of the AI system life cycle record keeping and event logs should be enabled, at minimum when the AI system is in use"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive automatic event logging with tamper-resistant storage and standardized schemas essential for Level 3 maturity demonstrating operational traceability and audit readiness"
    }
  },
  {
    "control_id": "OPS-LOG-02",
    "control_title": "Biometric System Logging Requirements",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure biometric identification systems automatically log the period of each use, the reference database against which input data is checked, the input data for which a match has been found, and the identification of natural persons involved in the verification of results, with documented biometric-specific logging specifications, audit trails, and access controls appropriate to the sensitivity of biometric data.",
    "control_objective": "Ensure biometric identification AI systems maintain comprehensive, granular audit trails meeting enhanced Article 12(3) logging requirements with appropriate data protection safeguards for sensitive biometric information.",
    "risk_description": "Biometric identification systems without Article 12(3)-compliant logging operate without the mandatory enhanced audit trail, creating direct regulatory non-compliance and exposure to maximum penalty tiers given the sensitivity of biometric processing. Missing human verifier identification logs prevent accountability for erroneous identification confirmations that may result in wrongful actions against individuals. Incomplete reference database logging undermines the ability to investigate false positive matches and assess whether the identification system operated within its validated parameters.",
    "implementation": {
      "requirements": [
        "Biometric System Log Specification defining the enhanced logging requirements specific to biometric identification systems including mandatory",
        "Reference Database Logging documenting which reference databases were queried for each identification operation including database identifier",
        "Match Event Log recording all positive identification matches including input data reference",
        "Human Verifier Identification Log recording the identity of all natural persons involved in verifying biometric identification results",
        "Biometric Audit Trail providing a comprehensive chronological record of all biometric system activities including system access events"
      ],
      "steps": [
        "Define biometric-specific log schema extending the general event logging schema",
        "Implement reference database logging capturing database identifier, version hash, record count, last synchronization timestamp",
        "Configure match event logging to record all positive matches with sufficient detail for audit reconstruction while implementing privacy-preserving measures"
      ],
      "timeline": "Biometric log specification defined during system design; reference database and match logging implemented during development"
    },
    "evidence_requirements": [
      "Biometric System Log Specification",
      "Reference Database Logging",
      "Match Event Log",
      "Human Verifier Identification Log",
      "Biometric Audit Trail"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 12(3)(a)",
          "context": "For biometric identification systems, the logging shall include the period of each use (start and end date and time of each use)\n• Article 12(3)(b): The reference database against which input data has been checked shall be logged\n• Article 12(3)(c): The input data for which a match has been found shall be logged\n• Article 12(3)(d): The identification of the natural persons involved in the verification of the results shall be logged"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• Annex A.6.2.8",
          "context": "Event logs can include date and time of each use of the AI system, production data operated on by the system, and outputs of the system including those falling outside the intended range"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Enhanced biometric-specific logging with privacy-preserving audit trails and human verifier accountability essential for Level 4 maturity demonstrating comprehensive oversight of high-sensitivity AI systems"
    }
  },
  {
    "control_id": "OPS-LOG-03",
    "control_title": "Log Interpretation and Access for Deployers",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL provide deployers with clear instructions, tools, and technical mechanisms enabling them to collect, store, and interpret logs generated by high-risk AI systems in accordance with Article 12, including documented log interpretation guides, access procedures, analysis tool documentation, training materials, and log format specifications.",
    "control_objective": "Enable deployers to effectively access, collect, store, and interpret AI system logs through comprehensive documentation and technical mechanisms supporting their regulatory obligations for log management and operational oversight.",
    "risk_description": "Deployers without adequate log interpretation guidance cannot fulfill their own regulatory obligations under Article 26 for monitoring AI system operation, creating a chain of compliance failures traceable to insufficient provider documentation. Inaccessible or poorly documented log data prevents deployers from detecting risk-posing situations in their operational context, potentially leading to harm that could have been prevented with effective log monitoring. Inadequate log format specifications prevent deployers from integrating AI system logs into their enterprise security information and event management (SIEM) systems, creating monitoring blind spots.",
    "implementation": {
      "requirements": [
        "Log Interpretation Guide for Deployers providing comprehensive documentation explaining log content, structure",
        "Log Access Procedure documenting the technical methods for deployers to access AI system logs including API endpoints",
        "Log Analysis Tool Documentation describing any tools provided to deployers for log analysis including installation procedures",
        "Deployer Log Training Materials providing educational content enabling deployer personnel to effectively utilize log data including training",
        "Log Format Specification providing detailed technical documentation of log data formats including schema definitions"
      ],
      "steps": [
        "Develop log interpretation guide with deployer-accessible language explaining each log field, event type taxonomy, severity classifications",
        "Create log access procedure documenting all technical mechanisms available to deployers including REST API documentation",
        "Document log analysis tools provided with the AI system including any bundled dashboards (Grafana, Kibana), query interfaces, alerting configurations",
        "Develop deployer log training program including initial onboarding training (4-8 hours)",
        "Publish log format specification as technical reference documentation including complete schema definitions"
      ],
      "timeline": "Log interpretation guide and format specification completed before system deployment to deployers"
    },
    "evidence_requirements": [
      "Log Interpretation Guide for Deployers",
      "Log Access Procedure",
      "Log Analysis Tool Documentation",
      "Deployer Log Training Materials",
      "Log Format Specification"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 13(3)(f)",
          "context": "Instructions of use for high-risk AI systems shall include a description of mechanisms that allow deployers to properly collect, store, and interpret the logs in accordance with Article 12"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• N/A - No direct NIST AI RMF mapping for this control",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "• Annex A.8.2",
          "context": "Information for users of AI systems should include how the system works, technical requirements, and other information necessary for effective and safe use of the system"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive deployer log support with interpretation guides, training, and technical access mechanisms essential for Level 3 maturity demonstrating effective provider-deployer information sharing"
    }
  },
  {
    "control_id": "OPS-MAINT-01",
    "control_title": "Model Maintenance and Retraining",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain model maintenance and retraining procedures that define scheduled and trigger-based retraining criteria, version control for all model iterations, performance thresholds for retraining initiation, impact assessment for model updates, and documented processes for sustaining the value and compliance of deployed AI systems throughout their operational lifetime.",
    "control_objective": "Ensure deployed AI models maintain validated performance levels and regulatory compliance through systematic maintenance procedures, evidence-based retraining decisions, and comprehensive version management.",
    "risk_description": "AI systems without systematic maintenance procedures experience progressive performance degradation from concept drift, data drift, and environmental changes, eventually producing unreliable outputs that may harm affected individuals. Absence of retraining trigger criteria means performance decline continues undetected until downstream failures become apparent, by which point remediation requires emergency intervention rather than planned maintenance. Uncontrolled model versioning creates inability to reproduce previous model behavior for audit purposes or to roll back to known-good versions when retraining produces unexpected results.",
    "implementation": {
      "requirements": [
        "Model Retraining Schedule defining planned retraining cadence based on domain-specific data freshness requirements, historical drift rates",
        "Retraining Trigger Criteria specifying quantitative and qualitative conditions that initiate unscheduled model retraining including performance",
        "Model Version Control Log maintaining a complete history of all model versions including version identifier",
        "Performance Threshold for Retraining defining the specific metric levels that trigger retraining consideration including absolute thresholds",
        "Update Impact Assessment evaluating the effects of model retraining on system behavior including performance comparison"
      ],
      "steps": [
        "Establish model retraining schedule based on domain analysis, historical drift rates",
        "Define retraining trigger criteria with specific quantitative thresholds derived from model validation baseline performance, operational monitoring data",
        "Implement model version control using ML experiment tracking tools",
        "Establish performance thresholds through statistical analysis of baseline performance variability, stakeholder risk tolerance assessment",
        "Develop update impact assessment procedure including mandatory pre-deployment validation covering performance comparison"
      ],
      "timeline": "Retraining schedule established before initial deployment; trigger criteria defined during model validation"
    },
    "evidence_requirements": [
      "Model Retraining Schedule",
      "Retraining Trigger Criteria",
      "Model Version Control Log",
      "Performance Threshold for Retraining",
      "Update Impact Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 13(3)(e)",
          "context": "Instructions of use shall contain a description of the expected lifetime of the high-risk AI system and any necessary maintenance and care measures to ensure proper functioning including software updates\n• Article 13(3)(c): Instructions of use shall describe any pre-determined changes to the high-risk AI system and its performance that have been pre-assessed at the time of initial conformity assessment"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• MANAGE.2.2",
          "context": "Mechanisms are established to sustain the value of deployed AI systems including regular monitoring, re-evaluation, and updating processes\n• MANAGE.4.2: Measurable activities for continual improvements are integrated into AI system updates and include regular reviews of processes"
        }
      ],
      "iso_42001": [
        {
          "ref": "• Annex A.6.2.6",
          "context": "The organization shall define processes for system updates including retraining when concept drift or data drift is identified requiring model refresh to maintain performance"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic model maintenance with evidence-based retraining triggers, comprehensive version control, and impact assessment essential for Level 4 maturity demonstrating sustained AI system value throughout operational lifetime"
    }
  },
  {
    "control_id": "OPS-MGMT-01",
    "control_title": "Management Review Process",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure that top management reviews the AI management system at planned intervals to assess its continuing suitability, adequacy, and effectiveness, considering the status of actions from previous reviews, changes in the external and internal context, AI system performance and monitoring data, audit findings, nonconformities and corrective actions, and stakeholder feedback, producing documented decisions and actions for continual improvement.",
    "control_objective": "Ensure top management maintains active oversight and strategic direction of the AI management system through regular, structured reviews that evaluate system effectiveness, address emerging risks, and drive continual improvement decisions based on comprehensive operational data.",
    "risk_description": "Without structured management review, top management loses visibility into AI management system performance, creating a disconnect between governance intent and operational reality that allows compliance gaps, resource shortfalls, and emerging risks to go unaddressed. Failure to review audit findings, nonconformities, and monitoring data at the management level prevents strategic corrective actions that address systemic issues spanning multiple AI systems and organizational units. Missing management review documentation violates ISO/IEC 42001 Clause 9.3 mandatory requirements and eliminates the organization's ability to demonstrate top management commitment and oversight during certification audits.",
    "implementation": {
      "requirements": [
        "Management Review Procedure defining the process for conducting top management reviews of the AI management system including review frequency",
        "Management Review Agenda providing a standardized agenda template covering all required input topics including status of previous review actions",
        "Meeting Minutes documenting the conduct of each management review including attendance",
        "Management Review Output Report summarizing the formal decisions and actions resulting from each review including decisions related to continual",
        "Action Items Tracker monitoring the implementation of all management review output actions including action description"
      ],
      "steps": [
        "Establish management review procedure defining frequency, participants, and process aligned with ISO/IEC 42001 Clause",
        "Develop standardized review agenda template covering all required inputs per Clause",
        "Implement structured data collection for management review inputs aggregating information from AI system monitoring dashboards, internal audit reports"
      ],
      "timeline": "Management review procedure established during AI management system implementation"
    },
    "evidence_requirements": [
      "Management Review Procedure",
      "Management Review Agenda",
      "Meeting Minutes",
      "Management Review Output Report",
      "Action Items Tracker"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall operational monitoring requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.5",
          "context": "Ongoing monitoring and periodic review of the risk management process and its outcomes are planned and organizational roles and responsibilities are clearly defined including for engagement with interested parties"
        },
        {
          "ref": "MANAGE.4.2",
          "context": "Measurable activities for continual improvement are integrated into AI system updates and include regular engagement with interested AI actors including affected communities"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 9.3.1",
          "context": "Top management shall review the organization's AI management system at planned intervals to ensure its continuing suitability, adequacy, and effectiveness"
        },
        {
          "ref": "Clause 9.3.2",
          "context": "Management review shall be planned and carried out taking into consideration the status of actions from previous reviews, changes in external and internal issues, information on AI management system performance, and results of risk assessment"
        },
        {
          "ref": "Clause 9.3.3",
          "context": "Outputs of the management review shall include decisions related to continual improvement opportunities and any need for changes to the AI management system"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Structured management review with comprehensive inputs, documented decisions, and tracked actions essential for Level 3 maturity demonstrating active top management oversight and data-driven strategic direction of the AI management system"
    }
  },
  {
    "control_id": "OPS-MON-01",
    "control_title": "Production and Post-Market Monitoring System",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish, implement, and maintain a post-market monitoring system for each high-risk AI system that actively and systematically collects, documents, and analyzes performance data throughout the AI system's lifecycle, including monitoring for functionality degradation, concept drift, data drift, and emergent risks, with documented monitoring plans, alerting thresholds, and escalation procedures.",
    "control_objective": "Ensure continuous operational oversight of deployed AI systems through systematic performance monitoring, drift detection, and risk identification enabling timely corrective actions and regulatory compliance throughout the system lifecycle.",
    "risk_description": "Deployed AI systems without production monitoring operate as black boxes, preventing detection of performance degradation, concept drift, and emergent safety risks until downstream harm occurs. Failure to implement a post-market monitoring system violates Article 72 obligations, exposing providers to regulatory enforcement and liability for preventable incidents. Undetected model drift in high-risk applications (credit scoring, medical diagnostics, biometric identification) produces increasingly unreliable outputs affecting protected individuals without organizational awareness.",
    "implementation": {
      "requirements": [
        "Production Monitoring Dashboard providing real-time visibility into AI system operational metrics including inference latency",
        "Post-Market Monitoring Plan documenting the systematic approach for ongoing data collection and analysis including monitoring scope",
        "Alert Configuration Document defining alerting thresholds for all monitored metrics including warning levels",
        "Performance Degradation Detection Rules specifying quantitative criteria for identifying AI system performance decline including accuracy",
        "Concept Drift Monitoring Plan establishing statistical methods for detecting changes in the relationship between input features and target"
      ],
      "steps": [
        "Design production monitoring architecture identifying all critical operational and performance metrics, selecting monitoring tools",
        "Develop post-market monitoring plan per Article 72 requirements documenting monitoring scope covering all deployed AI systems",
        "Configure alerting system with multi-tier thresholds (warning, critical, emergency) for each monitored metric",
        "Implement drift detection pipelines using statistical methods",
        "Establish monitoring data collection and storage infrastructure ensuring data integrity"
      ],
      "timeline": "Monitoring architecture designed during development; post-market monitoring plan completed before deployment"
    },
    "evidence_requirements": [
      "Production Monitoring Dashboard",
      "Post-Market Monitoring Plan",
      "Alert Configuration Document",
      "Performance Degradation Detection Rules",
      "Concept Drift Monitoring Plan",
      "Monitoring Schedule",
      "Data Collection Procedures",
      "Trend Analysis Process"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "• Article 17(1)(h)",
          "context": "Quality management system shall include setting-up, implementation, and maintenance of a post-market monitoring system in accordance with Article 72\n• Article 12(2): High-risk AI systems shall include logging capabilities that enable monitoring of the operation of the system with respect to the occurrence of situations that may result in risks\n• Annex IV(9): A detailed description of the post-market monitoring system in accordance with Article 72 including the post-market monitoring plan referred to in Article 72(3)"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "• MEASURE.2.4",
          "context": "The functionality and behavior of the AI system are monitored during production operations to detect changes and assess AI system risks\n• MANAGE.4.1: Post-deployment AI system monitoring plans are implemented including mechanisms to track identified risks and respond to identified AI risks\n• MEASURE.3.1: Approaches for tracking identified AI risks over time are established to regularly identify and document changes"
        }
      ],
      "iso_42001": [
        {
          "ref": "• Annex A.6.2.6",
          "context": "The organization shall define necessary elements for the ongoing operation of AI systems including system monitoring and performance monitoring\n• Clause 9.1: The organization shall determine what needs to be monitored and measured, the methods for monitoring, measurement, analysis, and evaluation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive production monitoring with automated drift detection and systematic post-market surveillance essential for Level 4 maturity demonstrating continuous operational oversight of deployed AI systems"
    }
  },
  {
    "control_id": "OPS-NC-01",
    "control_title": "Nonconformity and Corrective Action Management",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a nonconformity and corrective action management system that identifies, documents, investigates, and resolves all nonconformities in AI systems and the AI management system, including root cause analysis, corrective action planning, effectiveness verification, and lessons learned integration ensuring systematic elimination of causes and prevention of recurrence.",
    "control_objective": "Ensure all AI system and management system nonconformities are systematically identified, investigated to root cause, corrected through verified actions, and integrated into organizational learning to prevent recurrence and drive continual improvement.",
    "risk_description": "Without systematic nonconformity management, identified issues remain unresolved or are addressed through ad hoc fixes that fail to eliminate root causes, allowing the same nonconformities to recur across multiple AI systems and audit cycles. Failure to conduct effectiveness verification means corrective actions may be implemented but never confirmed as effective, creating a false sense of compliance while underlying problems persist. Missing lessons learned integration prevents organizational learning, causing each AI project to repeat the same mistakes and perpetuating systemic weaknesses in the AI management system.",
    "implementation": {
      "requirements": [
        "Nonconformity Register maintaining a centralized log of all identified nonconformities across AI systems and the AI management system",
        "Nonconformity Report Form standardizing the documentation of each nonconformity including detailed description of the nonconformity",
        "Corrective Action Request Form initiating the formal corrective action process including reference to nonconformity report",
        "Root Cause Analysis Report documenting the systematic investigation of nonconformity causes using structured techniques",
        "Corrective Action Plan detailing the specific actions required to eliminate identified root causes including action descriptions"
      ],
      "steps": [
        "Establish nonconformity register using GRC or quality management platform",
        "Implement nonconformity reporting workflow with multiple detection channels including automated feeds from internal audit findings"
      ],
      "timeline": "Nonconformity register and reporting procedures established during AI management system implementation"
    },
    "evidence_requirements": [
      "Nonconformity Register",
      "Nonconformity Report Form",
      "Corrective Action Request Form",
      "Root Cause Analysis Report",
      "Corrective Action Plan",
      "Effectiveness Verification Records",
      "Lessons Learned Database"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(j)",
          "context": "Providers of high-risk AI systems shall take the necessary corrective actions including withdrawal or recall when appropriate"
        },
        {
          "ref": "Article 20",
          "context": "Providers shall take corrective actions necessary to bring the AI system into conformity and inform deployers and authorities of non-compliance"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.4.3",
          "context": "Organizational practices are in place to enable testing, identification of incidents, and information sharing including lessons learned"
        },
        {
          "ref": "MANAGE.2.3",
          "context": "Procedures are followed to respond to and recover from previously unknown risks when identified"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 10.2",
          "context": "When a nonconformity occurs, the organization shall react to the nonconformity and as applicable take action to control and correct it, deal with the consequences, evaluate the need for action to eliminate the causes, implement any action needed, review the effectiveness of corrective action taken, and make changes to the AI management system if necessary"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Systematic nonconformity management with root cause analysis, effectiveness verification, and lessons learned integration essential for Level 3 maturity demonstrating organizational learning and prevention of recurring AI system failures"
    }
  },
  {
    "control_id": "OPS-OUTS-01",
    "control_title": "Outsourced AI Process Control",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL identify, document, and control all outsourced processes that affect AI system conformity, performance, and compliance, establishing clear control mechanisms including contractual requirements, performance monitoring, risk assessment, and verification activities ensuring outsourced AI processes meet the same standards as internally managed processes.",
    "control_objective": "Ensure outsourced AI processes including third-party model development, data annotation, cloud infrastructure, and AI-as-a-Service components are controlled to the same standards as internal processes through documented oversight, performance monitoring, and contractual compliance mechanisms.",
    "risk_description": "Uncontrolled outsourced AI processes create blind spots in the organization's AI governance where third-party activities that directly impact AI system performance, fairness, and compliance operate without adequate oversight, transferring but not eliminating organizational risk. Failure to verify outsourced process compliance means vendors may introduce data quality issues, model biases, security vulnerabilities, or regulatory non-conformities that the organization inherits without detection. Missing SLAs and performance monitoring for outsourced AI processes prevent timely identification of vendor performance degradation, leaving organizations dependent on third parties without recourse or visibility into service quality.",
    "implementation": {
      "requirements": [
        "Outsourcing Control Procedure defining the end-to-end process for managing outsourced AI activities including outsourcing decision criteria",
        "Outsourced Process Register maintaining a comprehensive inventory of all outsourced AI processes including process description",
        "Control Verification Records documenting the results of verification activities confirming outsourced processes meet organizational requirements",
        "Outsourcing SLA Documentation defining measurable performance requirements for each outsourced AI process including quality metrics",
        "Outsourced Process Performance Review documenting periodic evaluation of outsourced process performance against SLAs and organizational"
      ],
      "steps": [
        "Identify and document all outsourced processes affecting AI system conformity including third-party model development",
        "Establish outsourcing control procedure defining requirements that outsourced processes must meet aligned with ISO/IEC 42001 Clause",
        "Define SLAs for each outsourced AI process with measurable performance metrics, regular reporting requirements, compliance verification rights",
        "Implement control verification activities including initial vendor assessment"
      ],
      "timeline": "Outsourcing control procedure established during AI management system implementation"
    },
    "evidence_requirements": [
      "Outsourcing Control Procedure",
      "Outsourced Process Register",
      "Control Verification Records",
      "Outsourcing SLA Documentation",
      "Outsourced Process Performance Review"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall operational monitoring requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.3.1",
          "context": "AI risks and benefits from third-party entities are regularly monitored and risk controls are applied and documented including supply chain risk management practices"
        }
      ],
      "iso_42001": [
        {
          "ref": "Clause 8.1",
          "context": "The organization shall ensure that outsourced processes are controlled and the type and extent of control is defined within the AI management system"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive outsourced process control with verified compliance, performance monitoring, and risk integration essential for Level 3 maturity demonstrating end-to-end AI governance including third-party managed processes"
    }
  },
  {
    "control_id": "OPS-OVER-01",
    "control_title": "System Override, Intervention, and Emergency Shutdown",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain system override, intervention, and emergency shutdown capabilities that enable authorized human oversight persons to decide not to use the AI system output, override or reverse AI decisions, intervene in real-time operations, and interrupt or deactivate the AI system through documented stop mechanisms when the system produces inconsistent, unsafe, or non-compliant outcomes.",
    "control_objective": "Ensure authorized human oversight persons have immediate, tested, and documented capability to override AI system outputs, intervene in operations, and execute emergency shutdown procedures to prevent or mitigate harm from AI system malfunction or unsafe behavior.",
    "risk_description": "Without functional override and shutdown capabilities, organizations cannot intervene when high-risk AI systems produce harmful, biased, or unsafe outputs, allowing AI-driven decisions to cause preventable harm to affected persons. Missing or untested kill switch mechanisms create single points of failure where safety-critical AI systems cannot be stopped during emergencies, violating the fundamental human oversight requirements of Article 14. Absence of override event logging makes it impossible to demonstrate regulatory compliance with human oversight obligations during market surveillance inspections and undermines the organization's ability to learn from override events to improve AI system performance.",
    "implementation": {
      "requirements": [
        "Override Mechanism Documentation describing all technical mechanisms enabling human override of AI system outputs including output rejection",
        "Stop Button/Kill Switch Procedure defining the emergency shutdown mechanism per Article 14(4)(e) including physical or digital kill switch",
        "Intervention Protocol specifying how authorized persons intervene in AI system operations without full shutdown including real-time monitoring",
        "Emergency Shutdown Protocol defining procedures for immediate AI system deactivation in safety-critical scenarios including activation criteria",
        "Override Authority Matrix defining who is authorized to perform each type of override action"
      ],
      "steps": [
        "Design and document override mechanisms within AI system architecture ensuring output rejection, modification",
        "Implement stop button/kill switch capability per Article 14",
        "Develop intervention protocol defining graduated response levels from output-level override",
        "Establish emergency shutdown protocol for safety-critical scenarios with pre-authorized activators, practiced shutdown procedures, downstream impact mitigation plans"
      ],
      "timeline": "Override mechanisms designed and tested before deployment of high-risk AI systems"
    },
    "evidence_requirements": [
      "Override Mechanism Documentation",
      "Stop Button/Kill Switch Procedure",
      "Intervention Protocol",
      "Emergency Shutdown Protocol",
      "Override Authority Matrix",
      "Override Event Log",
      "System Shutdown Test Results",
      "Failover Activation Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(4)(d)",
          "context": "Human oversight measures shall enable the oversight person to decide not to use the high-risk AI system or to disregard, override or reverse the output of the high-risk AI system"
        },
        {
          "ref": "Article 14(4)(e)",
          "context": "Human oversight measures shall enable the oversight person to intervene in the operation of the high-risk AI system or interrupt the system through a stop button or similar procedure allowing the system to come to a halt in a safe state"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MANAGE.2.4",
          "context": "Mechanisms are in place and applied to supersede, disengage, or deactivate AI systems that demonstrate performance or outcomes inconsistent with intended use"
        },
        {
          "ref": "MAP.3.5",
          "context": "Processes for human oversight are defined and documented including capabilities for human intervention and override of AI system operations"
        }
      ],
      "iso_42001": [
        {
          "ref": "Annex A.9.3",
          "context": "The organization shall determine stages of the AI system lifecycle where meaningful human oversight is required including the ability for human reviewers to check, validate, and override AI system outputs"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive override and shutdown capabilities with tested mechanisms, authority governance, and event logging essential for Level 3 maturity demonstrating reliable human control over high-risk AI system operations"
    }
  },
  {
    "control_id": "OPS-SUPP-01",
    "control_title": "Technical Support and Help Desk",
    "category": "AI Operations & Monitoring",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain technical support and help desk services for AI system users and deployers that provide accessible contact information, defined service level agreements, escalation procedures, and trained support personnel capable of addressing AI-specific inquiries including system behavior questions, output interpretation assistance, incident reporting, and feedback submission.",
    "control_objective": "Ensure AI system users and deployers have accessible, responsive, and knowledgeable technical support services enabling effective system use, timely issue resolution, and structured feedback collection throughout the AI system operational lifecycle.",
    "risk_description": "Without accessible technical support, AI system users and deployers cannot resolve operational issues, interpret unexpected system outputs, or report potential incidents, leading to misuse of AI system outputs for consequential decisions and delayed detection of system malfunctions. Missing contact information in system documentation violates Article 13(3) instructions for use requirements, creating a compliance gap identifiable during conformity assessment. Inadequate support personnel training results in incorrect guidance to users, potential escalation failures for genuine incidents, and erosion of user confidence in the AI system's reliability and the organization's operational competence.",
    "implementation": {
      "requirements": [
        "Support Procedure Document defining the end-to-end technical support process for AI system users including support request intake channels",
        "Help Desk Contact Information maintaining current and accessible contact details for AI system support as required by Article 13(3)",
        "SLA Documentation defining measurable service level commitments for AI system support including initial response time",
        "Support Ticket System implementing a structured tracking platform",
        "User Support Training Materials ensuring support personnel are trained on AI system functionality"
      ],
      "steps": [
        "Establish AI-specific support procedure extending organizational help desk capabilities with AI-specific ticket categories, triage criteria for AI-related issues",
        "Publish help desk contact information in all AI system instructions for use documentation per Article 13",
        "Define and document SLAs with measurable commitments for AI system support response and resolution times",
        "Deploy or configure support ticket system with AI-specific categories, automated routing rules, SLA tracking, knowledge base articles for common AI system questions"
      ],
      "timeline": "Support procedures and contact information established before AI system deployment"
    },
    "evidence_requirements": [
      "Support Procedure Document",
      "Help Desk Contact Information",
      "SLA Documentation",
      "Support Ticket System",
      "User Support Training Materials"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)",
          "context": "Instructions for use of high-risk AI systems shall contain the contact details of the provider including where applicable those of the authorised representative"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports operational monitoring requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "Annex A.6.2.6",
          "context": "The organization shall consider internal and external support requirements including how users contact help, SLAs, metrics, and training for support personnel"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Structured technical support with AI-trained personnel, defined SLAs, and feedback integration supports Level 2 maturity demonstrating responsive user support and systematic issue tracking for AI systems"
    }
  },
  {
    "control_id": "OPS-USE-01",
    "control_title": "Intended Use Enforcement and Misuse Prevention",
    "category": "AI Operations & Monitoring",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain controls that enforce AI system use within documented intended purposes, detect and prevent reasonably foreseeable misuse, define acceptable use boundaries, monitor compliance with use restrictions, and implement technical and procedural safeguards ensuring AI systems are operated according to their validated design parameters and accompanying documentation.",
    "control_objective": "Ensure AI systems are used exclusively within their documented intended purposes and validated operational parameters through technical enforcement mechanisms, monitoring controls, and clear user agreements that prevent misuse and maintain system reliability and compliance.",
    "risk_description": "Without intended use enforcement, AI systems are applied to use cases beyond their validated parameters where performance, fairness, and safety characteristics are unknown, creating uncontrolled risk of harm to affected persons relying on system outputs. Failure to detect and prevent misuse allows deployers and users to apply AI systems in contexts where the system may produce systematically biased, inaccurate, or unsafe outputs without the organization's knowledge. Missing acceptable use policies and user agreements eliminate the organization's legal recourse against misuse and create ambiguity about responsibility for harm resulting from AI system application outside intended parameters.",
    "implementation": {
      "requirements": [
        "Intended Use Specification documenting the precise intended purposes of each AI system including target use cases",
        "Use Case Boundary Documentation defining the operational boundaries within which the AI system has been validated including geographic scope",
        "Misuse Detection Rules defining automated and manual mechanisms for detecting AI system use outside intended parameters including input",
        "Use Compliance Monitoring Log capturing continuous monitoring data on AI system usage patterns including usage volume",
        "User Agreement/Terms defining the contractual obligations of AI system users and deployers regarding acceptable use including permitted use cases"
      ],
      "steps": [
        "Document intended use specifications for each AI system derived from system design, risk assessment",
        "Define use case boundaries with specific examples of in-scope and out-of-scope applications, edge cases requiring human judgment",
        "Implement misuse detection rules as automated monitoring controls including input validation",
        "Deploy use compliance monitoring with continuous logging of usage patterns, automated comparison against intended use parameters"
      ],
      "timeline": "Intended use specifications documented during AI system design; use case boundaries defined during validation"
    },
    "evidence_requirements": [
      "Intended Use Specification",
      "Use Case Boundary Documentation",
      "Misuse Detection Rules",
      "Use Compliance Monitoring Log",
      "User Agreement/Terms",
      "Acceptable Use Policy"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(2)(b)",
          "context": "Risk management measures shall give due consideration to the risks that may emerge when the high-risk AI system is used in accordance with its intended purpose and under conditions of reasonably foreseeable misuse"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.1.1",
          "context": "Intended purposes, potentially beneficial uses, context of use, and requirements and expectations of relevant AI actors including affected communities are understood and documented"
        },
        {
          "ref": "MEASURE.2.5",
          "context": "The AI system is demonstrated to be valid and reliable with respect to the deployment context including user population, operating environment, and intended use conditions"
        }
      ],
      "iso_42001": [
        {
          "ref": "Annex A.9.4",
          "context": "The organization shall ensure the AI system is used according to its intended uses and accompanying documentation"
        },
        {
          "ref": "Annex A.9.2",
          "context": "The organization shall define processes for responsible use of AI systems including use restrictions and monitoring"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Technical use enforcement with automated misuse detection, boundary monitoring, and user agreement governance essential for Level 3 maturity demonstrating proactive control of AI system application within validated operational parameters"
    }
  },
  {
    "control_id": "TRANS-DES-01",
    "control_title": "AI System Transparency Design",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL design high-risk AI systems to operate with sufficient transparency to enable deployers to interpret system outputs and understand system behavior, implementing transparency-by-design principles that make the system's operation, capabilities, limitations, and decision-making logic comprehensible to users and oversight personnel throughout the system's lifecycle.",
    "control_objective": "Ensure high-risk AI systems are inherently transparent through design choices that enable deployers and users to understand system operation, correctly interpret outputs, and maintain meaningful oversight through built-in transparency mechanisms.",
    "risk_description": "Opaque AI systems that lack designed-in transparency prevent deployers from correctly interpreting outputs, leading to misapplication of AI recommendations in contexts where the system's confidence is low or the output is outside the system's validated operating parameters. Non-compliance with Article 13 transparency requirements for high-risk AI systems creates regulatory liability and may result in market surveillance authorities requiring system modifications or withdrawal from the EU market. Without transparency-by-design, organizations resort to post-hoc transparency measures that provide superficial explanations disconnected from actual system behavior, giving deployers false confidence in their understanding of AI system operation.",
    "implementation": {
      "requirements": [
        "Transparency Design Requirements specifying the transparency characteristics that must be built into each high-risk AI system including output",
        "Output Interpretability Specification defining how AI system outputs are presented to enable correct interpretation including output format",
        "Transparency by Design Assessment evaluating the AI system's transparency characteristics against Article 13 requirements at each development",
        "User Information Architecture defining how transparency information is structured and presented to different user categories",
        "Transparency Test Results documenting validation testing of transparency mechanisms including user comprehension testing"
      ],
      "steps": [
        "Define transparency design requirements during AI system requirements phase based on Article 13",
        "Implement output interpretability mechanisms including confidence score generation, feature attribution computation",
        "Design transparency information architecture creating structured, layered transparency information delivery appropriate to each stakeholder category",
        "Conduct transparency by design assessments at design review, implementation review"
      ],
      "timeline": "Transparency requirements defined during system design; interpretability mechanisms implemented during development"
    },
    "evidence_requirements": [
      "Transparency Design Requirements",
      "Output Interpretability Specification",
      "Transparency by Design Assessment",
      "User Information Architecture",
      "Transparency Test Results"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(1)",
          "context": "High-risk AI systems shall be designed and developed in such a way as to ensure that their operation is sufficiently transparent to enable deployers to interpret the system's output and use it appropriately"
        },
        {
          "ref": "Article 13(2)",
          "context": "High-risk AI systems shall be accompanied by instructions for use in an appropriate digital format or otherwise that include concise, complete, correct, and clear information that is relevant, accessible, and comprehensible to deployers"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.8",
          "context": "Risks associated with transparency and accountability of the AI system are examined and documented including assessment of whether system operation is sufficiently transparent for intended users to understand and interpret outputs"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.2",
          "context": "Users should understand how the AI system works, its intended purpose and uses, and the basis for its outputs enabling informed use"
        },
        {
          "ref": "A.9.3",
          "context": "Objectives for AI system operation include transparency ensuring users and stakeholders can understand system behavior"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Transparency-by-design with validated interpretability mechanisms, layered information architecture, and user comprehension testing essential for Level 3 maturity demonstrating that transparency is an inherent system property rather than an afterthought"
    }
  },
  {
    "control_id": "TRANS-DOC-01",
    "control_title": "Instructions for Use Documentation",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL provide comprehensive instructions for use accompanying each high-risk AI system containing concise, complete, correct, and clear information that is relevant, accessible, and comprehensible to deployers, including provider identity, system characteristics, performance metrics, intended purpose, installation and operation guidance, human oversight measures, maintenance requirements, and computational resource specifications.",
    "control_objective": "Ensure deployers of high-risk AI systems receive complete, accurate, and comprehensible instructions for use that enable proper installation, operation, oversight, and maintenance of the AI system in accordance with EU AI Act Article 13 requirements.",
    "risk_description": "Missing or incomplete Instructions for Use creates direct non-compliance with Article 13(2)-(3) and may prevent the AI system from bearing the CE marking required for placing high-risk AI systems on the EU market. Deployers who receive inadequate operational documentation make configuration errors, misinterpret outputs, apply the system to unintended use cases, or fail to implement required human oversight measures, creating safety and fundamental rights risks that the provider bears ultimate responsibility for. Without validated usage documentation, the provider cannot demonstrate that they took reasonable steps to enable safe deployment, undermining their legal defense in any proceedings related to harm caused by the AI system.",
    "implementation": {
      "requirements": [
        "Instructions for Use Document providing the comprehensive master document required by Article 13(3) containing all mandated information elements",
        "Deployer Quick Start Guide providing an accessible, condensed version of key operational information enabling deployers to begin using the AI",
        "Detailed Operator Manual providing in-depth operational documentation for daily system operators including detailed input requirements",
        "Usage Warnings and Cautions documenting specific scenarios, conditions, and contexts where the AI system may produce unreliable or unsafe",
        "Contact Information Page providing complete provider identification and contact channels as required by Article 13(3)(a) including registered"
      ],
      "steps": [
        "Compile all Article 13"
      ],
      "timeline": "Instructions for Use drafted during development, finalized before deployment; Quick Start Guide and Operator Manual completed before deployer onboarding"
    },
    "evidence_requirements": [
      "Instructions for Use Document",
      "Deployer Quick Start Guide",
      "Detailed Operator Manual",
      "Usage Warnings and Cautions",
      "Contact Information Page"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(2)",
          "context": "High-risk AI systems shall be accompanied by instructions for use containing concise, complete, correct and clear information"
        },
        {
          "ref": "Article 13(3)",
          "context": "Instructions shall contain provider identity, system characteristics, performance metrics, intended purpose, human oversight measures, and other specified information"
        },
        {
          "ref": "Annex IV(1)(h)",
          "context": "Technical documentation shall include instructions for use for the deployer"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.2",
          "context": "Documentation of how AI system output will be utilized and overseen by deployers with clear operational guidance"
        },
        {
          "ref": "MEASURE.2.9",
          "context": "Processes for interpreting AI system output within the appropriate operational context are documented and communicated"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.2",
          "context": "Provide necessary information to users enabling them to understand and appropriately use the AI system"
        },
        {
          "ref": "A.6.2.7",
          "context": "Determine what technical documentation is needed for AI system deployment, operation, and maintenance"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive Instructions for Use with deployer-validated documentation, operational guides, and structured warnings essential for Level 3 maturity demonstrating that deployers have the information necessary for safe and compliant AI system operation"
    }
  },
  {
    "control_id": "TRANS-HUM-01",
    "control_title": "Human Oversight Design Requirements",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL design high-risk AI systems to enable effective human oversight by natural persons, implementing oversight mechanisms commensurate with identified risks that allow human overseers to fully understand system capabilities and limitations, correctly interpret outputs, decide not to use the system or override outputs, and intervene or interrupt system operation when necessary to prevent or minimize risks to health, safety, or fundamental rights.",
    "control_objective": "Ensure high-risk AI systems are designed with built-in human oversight capabilities that enable qualified personnel to monitor, interpret, override, and interrupt AI system operations proportionate to the level of risk posed by the system.",
    "risk_description": "Without designed-in human oversight mechanisms, high-risk AI systems operate autonomously beyond the organization's ability to detect errors, prevent harm, or intervene when outputs threaten health, safety, or fundamental rights, creating direct non-compliance with EU AI Act Article 14. Inadequate oversight design results in oversight personnel who cannot effectively interpret AI outputs or exercise meaningful control, reducing human oversight to a compliance checkbox rather than a genuine risk mitigation measure. Missing override and intervention capabilities mean that when AI systems produce harmful or incorrect outputs, there is no technical mechanism for human operators to stop, correct, or override the system before harm materializes.",
    "implementation": {
      "requirements": [
        "Human Oversight Requirements Document specifying the oversight design requirements for each high-risk AI system including oversight objectives",
        "Oversight Role Specifications defining the roles, responsibilities, authority levels",
        "Oversight Mechanism Design documenting the technical implementation of human oversight capabilities including real-time monitoring dashboards",
        "Risk-Based Oversight Level Assignment mapping each high-risk AI system function to an appropriate oversight level based on risk assessment",
        "Human Oversight Test Results documenting validation testing of oversight mechanisms including override functionality testing"
      ],
      "steps": [
        "Conduct human oversight requirements analysis for each high-risk AI system based on risk assessment outputs",
        "Design oversight interfaces providing human overseers with sufficient information to understand AI system capabilities and limitations per Article 14"
      ],
      "timeline": "Human oversight requirements defined during AI system design phase; oversight mechanisms implemented during development"
    },
    "evidence_requirements": [
      "Human Oversight Requirements Document",
      "Oversight Role Specifications",
      "Oversight Mechanism Design",
      "Risk-Based Oversight Level Assignment",
      "Human Oversight Test Results"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(1)",
          "context": "High-risk AI systems shall be designed and developed to be effectively overseen by natural persons during the period of use"
        },
        {
          "ref": "Article 14(2)",
          "context": "Human oversight shall aim to prevent or minimise risks to health, safety, or fundamental rights"
        },
        {
          "ref": "Article 14(3)",
          "context": "Oversight measures shall be commensurate with the risks, level of autonomy, and context of use"
        },
        {
          "ref": "Annex IV(2)(e)",
          "context": "Technical documentation shall include assessment of human oversight measures"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.3.2",
          "context": "Policies and procedures are in place to define and differentiate roles and responsibilities for human-AI configurations and oversight of AI systems"
        },
        {
          "ref": "MAP.3.5",
          "context": "Processes for defining, documenting, and maintaining human oversight requirements for AI systems throughout their lifecycle"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.9.3",
          "context": "Determine stages in the AI system lifecycle for meaningful human oversight with defined objectives for oversight effectiveness"
        },
        {
          "ref": "A.6.1.3",
          "context": "Processes should include human oversight requirements ensuring appropriate human control over AI system operations"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Risk-proportionate human oversight design with validated override mechanisms, oversight interface testing, and capacity planning essential for Level 3 maturity demonstrating effective human control over high-risk AI system operations"
    }
  },
  {
    "control_id": "TRANS-HUM-02",
    "control_title": "Human Oversight Competency and Training",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a competency-based training programme for all personnel assigned to human oversight roles, ensuring they properly understand the AI system's relevant capacities and limitations, remain aware of automation bias tendencies, can correctly interpret system outputs, and are qualified to exercise oversight authority including override and intervention decisions.",
    "control_objective": "Ensure all human oversight personnel possess demonstrated competency to understand AI system capabilities and limitations, recognize automation bias, interpret outputs correctly, and exercise effective oversight authority through structured training and qualification programmes.",
    "risk_description": "Oversight personnel who lack proper training cannot effectively interpret AI system outputs or recognize when the system is operating outside its validated parameters, rendering human oversight a meaningless procedural formality that fails to prevent harm. Without automation bias awareness training, human overseers systematically defer to AI system recommendations even when indicators suggest the output is incorrect, eliminating the risk mitigation value of human oversight and enabling AI errors to propagate into consequential decisions. Unqualified oversight personnel making override or intervention decisions without adequate understanding of AI system capabilities may introduce greater risk than the AI system itself, either by failing to intervene when necessary or by overriding correct AI outputs based on flawed human judgment.",
    "implementation": {
      "requirements": [
        "Human Oversight Training Programme defining structured training curricula for each oversight role covering AI system functional understanding",
        "Oversight Personnel Competency Records maintaining individual competency profiles for each person assigned to human oversight duties",
        "Automation Bias Awareness Training providing specific education on automation bias",
        "Oversight Role Qualification Criteria defining minimum qualification requirements for each human oversight position including educational",
        "Training Effectiveness Assessment evaluating whether oversight training achieves its objectives through pre/post knowledge assessments"
      ],
      "steps": [
        "Develop role-specific oversight training curricula aligned with Article 14",
        "Create automation bias awareness training module addressing cognitive biases in human-AI interaction including automation bias, anchoring effects, confirmation bias",
        "Define oversight role qualification criteria establishing minimum competency standards for each oversight position with assessment methods",
        "Implement competency tracking system maintaining individual training records, qualification status, refresher compliance"
      ],
      "timeline": "Training programme developed during AI system design phase; initial qualification training completed before oversight personnel begin duties"
    },
    "evidence_requirements": [
      "Human Oversight Training Programme",
      "Oversight Personnel Competency Records",
      "Automation Bias Awareness Training",
      "Oversight Role Qualification Criteria",
      "Training Effectiveness Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(4)(a)",
          "context": "Human oversight measures shall enable the individuals to whom oversight is assigned to properly understand the relevant capacities and limitations of the high-risk AI system"
        },
        {
          "ref": "Article 14(4)(b)",
          "context": "Enable oversight persons to remain aware of the possible tendency of automatically relying on or over-relying on the output produced by a high-risk AI system (automation bias)"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.2.2",
          "context": "The organization provides AI risk management training to relevant personnel ensuring they have the knowledge and skills to fulfill their AI governance responsibilities"
        },
        {
          "ref": "MAP.3.5",
          "context": "Processes for defining operator and practitioner proficiency requirements for human oversight of AI systems"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.9.3",
          "context": "Personnel assigned to human oversight roles should be trained and understand the instructions and duties associated with their oversight responsibilities"
        },
        {
          "ref": "7.2 (Competence)",
          "context": "The organization shall ensure that persons doing work under its control that affects AI system performance are competent on the basis of appropriate education, training, or experience"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Competency-based oversight training with automation bias awareness, qualification criteria, and effectiveness measurement essential for Level 3 maturity demonstrating that human oversight personnel are genuinely capable of exercising effective oversight authority"
    }
  },
  {
    "control_id": "TRANS-HUM-03",
    "control_title": "Biometric System Dual Verification",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure that for high-risk AI systems used for remote biometric identification, no action or decision based on identification shall be taken unless the identification result has been separately verified and confirmed by at least two natural persons with appropriate competency and authority, with documented verification records maintaining full audit traceability.",
    "control_objective": "Ensure biometric identification results from high-risk AI systems are independently verified by at least two qualified natural persons before any action or decision is taken, providing a critical safeguard against misidentification and protecting individuals' fundamental rights.",
    "risk_description": "Taking action on biometric identification results verified by only one person or no human verification creates direct non-compliance with EU AI Act Article 14(5) and exposes the organization to enforcement action, significant fines, and potential prohibition of the biometric AI system. Single-person verification of biometric matches provides insufficient safeguard against AI misidentification errors, which in law enforcement and security contexts can result in wrongful detention, false accusations, or denial of access to services for incorrectly identified individuals. Without independent dual verification with documented audit trails, the organization cannot demonstrate that fundamental rights protections were applied to biometric identification decisions, undermining the legal basis for processing biometric data under GDPR Article 9 and the EU AI Act's specific biometric system safeguards.",
    "implementation": {
      "requirements": [
        "Dual Verification Procedure defining the end-to-end process for independent dual verification of biometric identification results",
        "Verifier Assignment Protocol establishing rules for assigning verification personnel to biometric identification cases including independence",
        "Verification Log with Two Persons maintaining tamper-evident records of every biometric identification verification event",
        "Biometric Match Review Process defining the technical and procedural steps each verifier must follow when reviewing a biometric identification",
        "Verifier Qualification Records documenting the qualifications, training completion, competency certification"
      ],
      "steps": [
        "Design dual verification workflow implementing Article 14",
        "Establish verifier assignment system implementing rotation schedules, independence requirements",
        "Implement tamper-evident verification logging system capturing complete audit trail of every biometric identification verification including timestamps",
        "Define disagreement resolution procedure specifying escalation steps when first and second verifiers reach conflicting conclusions including mandatory review by a"
      ],
      "timeline": "Dual verification procedure designed before biometric AI system deployment; verifier qualification training completed before verification duties assigned"
    },
    "evidence_requirements": [
      "Dual Verification Procedure",
      "Verifier Assignment Protocol",
      "Verification Log with Two Persons",
      "Biometric Match Review Process",
      "Verifier Qualification Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 14(5)",
          "context": "For high-risk AI systems referred to in Annex III point 1 (biometric identification and categorisation), no action or decision shall be taken on the basis of the identification resulting from the system unless this has been separately verified and confirmed by at least two natural persons"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A - No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "dual verification supports broader human oversight and trustworthiness objectives",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "A.9.3",
          "context": "Determine stages in the AI system lifecycle for meaningful human oversight including specific verification requirements for high-consequence AI system outputs such as biometric identification"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Mandatory dual verification with independent assessment, tamper-evident logging, and verifier qualification essential for Level 3 maturity demonstrating rigorous human oversight of biometric identification systems as required by EU AI Act"
    }
  },
  {
    "control_id": "TRANS-ID-01",
    "control_title": "Provider Identification and CE Marking",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL ensure each high-risk AI system bears the provider's name or registered trade name and contact address on the AI system or its packaging or accompanying documentation, draw up an EU declaration of conformity for each high-risk AI system, and affix the CE marking to the AI system or its accompanying documentation in a visible, legible, and indelible manner indicating conformity with applicable requirements.",
    "control_objective": "Ensure high-risk AI systems are traceable to their provider through clear identification markings and are accompanied by an EU declaration of conformity and CE marking demonstrating compliance with all applicable EU AI Act requirements.",
    "risk_description": "Missing provider identification prevents regulatory authorities and deployers from identifying the responsible party for high-risk AI systems, constituting a direct Article 16(b) violation. Absence of EU Declaration of Conformity and CE marking blocks lawful market placement within the EU, as CE marking is the visible indicator that a product meets applicable safety requirements. Non-compliant CE marking practices may also trigger product safety enforcement actions and market withdrawal orders under existing EU product safety legislation.",
    "implementation": {
      "requirements": [
        "Provider Identification Label specifying the exact provider name (or registered trade name), registered address",
        "EU Declaration of Conformity prepared in accordance with Article 47 containing all required elements including AI system identification",
        "CE Marking Affixation Record documenting the placement of CE marking on each AI system or its accompanying documentation with photographs",
        "Contact Information Documentation ensuring provider contact information remains current and accessible across all AI system deployment channels",
        "Packaging/Documentation with Identification verifying that all packaging, user manuals, digital interfaces"
      ],
      "steps": [
        "Prepare provider identification information including legal entity name, registered trade name, registered address",
        "Draft EU Declaration of Conformity following Article 47 template requirements covering each high-risk AI system",
        "Design CE marking format compliant with Article 48 specifications",
        "Apply provider identification and CE marking to all required locations including AI system interface, packaging, accompanying documentation",
        "Establish periodic verification process confirming provider identification and CE marking remain current, visible"
      ],
      "timeline": "Provider identification and EU Declaration of Conformity completed before market placement"
    },
    "evidence_requirements": [
      "Provider Identification Label",
      "EU Declaration of Conformity",
      "CE Marking Affixation Record",
      "Contact Information Documentation",
      "Packaging/Documentation with Identification"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(b)",
          "context": "Providers shall indicate their name, registered trade name or registered trademark, and contact address on the high-risk AI system or its packaging or accompanying documentation"
        },
        {
          "ref": "Article 16(g)",
          "context": "Draw up an EU declaration of conformity in accordance with Article 47"
        },
        {
          "ref": "Article 16(h)",
          "context": "Affix the CE marking to the high-risk AI system or its packaging or accompanying documentation to indicate conformity"
        },
        {
          "ref": "Annex IV(8)",
          "context": "Identification details of the provider"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports transparency and explainability requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "N/A — Supports overall ISO 42001 transparency and explainability requirements",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "Provider Identification and Conformity Marking",
      "maturity_enhancement": "Complete provider identification with EU Declaration of Conformity and CE marking essential for Level 2 maturity demonstrating minimum regulatory compliance for market access"
    }
  },
  {
    "control_id": "TRANS-NOTIFY-01",
    "control_title": "AI Interaction Notification",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement clear, conspicuous, and timely notification mechanisms that inform all persons when they are interacting with an AI system, ensuring notifications are presented before or at the point of AI engagement, are accessible across all interaction modalities (visual, auditory, tactile), are available in all languages supported by the system, and are designed to be comprehensible to the intended user population including persons with disabilities.",
    "control_objective": "Ensure all persons interacting with AI systems are informed clearly and promptly that they are engaging with an AI system rather than a human, enabling informed consent and appropriate calibration of trust in system outputs.",
    "risk_description": "Failure to notify users of AI interaction violates Article 50 transparency obligations, exposing the organization to enforcement actions and fines up to €15M or 3% of global turnover. Users who unknowingly interact with AI systems may place inappropriate trust in outputs, make decisions based on false assumptions about the nature of their interaction, and suffer harm from inability to exercise informed judgment. Undisclosed AI interaction erodes public trust and may constitute deceptive practice under consumer protection regulations across multiple jurisdictions.",
    "implementation": {
      "requirements": [
        "AI Interaction Notice Design specifying the exact notification content, format, visual design, placement",
        "Notification Placement Documentation mapping every user touchpoint where AI interaction occurs with documented notification placement rationale",
        "User Notification Log providing auditable records of notification delivery events including timestamps, user identifiers",
        "Notification Compliance Check documenting periodic verification that all AI interaction points have active",
        "Multi-Language Notification Versions providing professionally translated and culturally adapted notification content for every language"
      ],
      "steps": [
        "Inventory all AI system interaction touchpoints across web, mobile, API, voice, and embedded channels, mapping each touchpoint to required notification type, timing",
        "Design notification content and visual elements following accessibility standards",
        "Implement notification delivery infrastructure with logging capabilities capturing delivery events",
        "Produce multi-language notification versions through professional translation services with native speaker review and back-translation validation"
      ],
      "timeline": "Notification design and translation completed during system development; notification infrastructure deployed before system launch"
    },
    "evidence_requirements": [
      "AI Interaction Notice Design",
      "Notification Placement Documentation",
      "User Notification Log",
      "Notification Compliance Check",
      "Multi-Language Notification Versions"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 50",
          "context": "Transparency obligations for providers and deployers of certain AI systems requiring that persons be informed they are interacting with an AI system unless this is obvious from the circumstances and context of use"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports transparency and explainability requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.2",
          "context": "Communication to users of AI systems ensuring they understand when they are interacting with AI and can make informed decisions about engagement"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "AI Interaction Disclosure and User Notification",
      "maturity_enhancement": "Systematic notification with multi-language support, accessibility compliance, and auditable delivery logging essential for Level 3 maturity demonstrating proactive transparency in all AI interactions"
    }
  },
  {
    "control_id": "TRANS-PERF-01",
    "control_title": "Performance and Accuracy Disclosure",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL declare and disclose the levels of accuracy, robustness, and cybersecurity performance metrics for each high-risk AI system, providing deployers and users with specific, quantified performance information including relevant accuracy metrics, known performance variations across population subgroups, robustness characteristics, and cybersecurity resilience metrics sufficient for informed decision-making about system use.",
    "control_objective": "Ensure deployers and users of high-risk AI systems have access to specific, quantified performance metrics including accuracy levels, robustness characteristics, and cybersecurity resilience measures enabling informed assessment of system reliability and fitness for intended use.",
    "risk_description": "Failure to declare accuracy and performance metrics as required by Articles 13(3)(b)(ii) and 15(3) constitutes a direct compliance violation that may prevent CE marking and lawful market placement of the high-risk AI system within the EU. Deployers who lack quantified performance information cannot assess whether the AI system meets the accuracy and reliability thresholds required for their specific use case, leading to deployment in contexts where the system's performance is inadequate and creating risk of harm to affected persons. Without disaggregated performance metrics across population subgroups, deployers cannot identify and mitigate differential performance impacts that may constitute discrimination against protected groups in high-risk application domains.",
    "implementation": {
      "requirements": [
        "Accuracy Disclosure Statement providing quantified accuracy metrics for the AI system including overall accuracy",
        "Performance Metrics Summary for Users presenting AI system performance information in deployer-accessible format including metric definitions in",
        "Robustness and Security Metrics Disclosure documenting the AI system's resilience to input perturbations",
        "Performance Limitations Document detailing known performance limitations, boundary conditions",
        "Metric Interpretation Guide explaining how deployers should interpret disclosed performance metrics in the context of their specific deployment"
      ],
      "steps": [
        "Compute comprehensive accuracy metrics on representative evaluation datasets following Article 15",
        "Assess and document robustness metrics including adversarial robustness testing",
        "Document cybersecurity metrics including model extraction resistance, data poisoning resilience assessment, inference attack vulnerability testing",
        "Create deployer-accessible performance summary translating technical metrics into practical deployment guidance with clear explanations"
      ],
      "timeline": "Initial accuracy metrics computed during system evaluation; robustness and cybersecurity metrics assessed during pre-deployment testing"
    },
    "evidence_requirements": [
      "Accuracy Disclosure Statement",
      "Performance Metrics Summary for Users",
      "Robustness and Security Metrics Disclosure",
      "Performance Limitations Document",
      "Metric Interpretation Guide"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)(b)(ii)",
          "context": "Instructions for use shall specify the level of accuracy, robustness, and cybersecurity metrics against which the high-risk AI system has been tested and validated"
        },
        {
          "ref": "Article 15(3)",
          "context": "The levels of accuracy and the relevant accuracy metrics of high-risk AI systems shall be declared in the accompanying instructions of use"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.5",
          "context": "The AI system is evaluated to demonstrate that it is valid and reliable, with documented performance metrics, limitations, and conditions under which performance may degrade"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.2",
          "context": "Accuracy and performance information should be provided to users enabling them to assess AI system reliability for their specific use context"
        },
        {
          "ref": "A.6.2.7",
          "context": "Technical documentation including error rates, accuracy metrics, reliability measures, and robustness characteristics"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Quantified performance disclosure with disaggregated metrics, robustness assessment, and deployer-comprehensible presentation essential for Level 3 maturity demonstrating transparent communication of AI system capabilities and limitations"
    }
  },
  {
    "control_id": "TRANS-REG-01",
    "control_title": "EU Database Registration",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL register each high-risk AI system in the EU database established under Article 71 before placing the system on the market or putting it into service, maintain registration information in an accurate and up-to-date state, and comply with all registration obligations including timely submission of required information and updates reflecting system modifications or status changes.",
    "control_objective": "Ensure all high-risk AI systems are properly registered in the EU database before market placement with accurate, current information maintained throughout the system lifecycle, enabling public transparency and regulatory oversight.",
    "risk_description": "Failure to register high-risk AI systems in the EU database before market placement constitutes a direct Article 49(1) violation, rendering the market placement unlawful and exposing the provider to enforcement actions including fines and market withdrawal orders. Inaccurate or outdated registration information undermines the purpose of the EU database as a transparency and oversight mechanism, potentially triggering additional regulatory scrutiny. Missing registration also prevents deployers from conducting required due diligence on AI systems they use, creating downstream compliance risks for the entire value chain.",
    "implementation": {
      "requirements": [
        "EU Database Registration Record documenting the complete registration submission for each high-risk AI system including all data fields submitted",
        "Registration Confirmation providing official acknowledgment of registration from the EU database system serving as evidence of timely compliance",
        "Registration Update Log recording all modifications to registration information with date",
        "Public Information Verification documenting periodic review of publicly visible registration information to confirm accuracy, completeness",
        "Registration Maintenance Schedule establishing regular review cadences (quarterly minimum) for verifying registration accuracy and defining"
      ],
      "steps": [
        "Identify all AI systems subject to registration obligations under Article 49",
        "Compile required registration data fields for each AI system following EU database requirements including system description",
        "Submit registration through the EU database portal before market placement, obtaining registration confirmation and unique identifier for each registered system",
        "Establish Registration Maintenance Schedule with quarterly accuracy verification checks and event-triggered updates tied to system change management processes"
      ],
      "timeline": "Registration submitted before market placement or service commencement; registration confirmation obtained prior to first deployment"
    },
    "evidence_requirements": [
      "EU Database Registration Record",
      "Registration Confirmation",
      "Registration Update Log",
      "Public Information Verification",
      "Registration Maintenance Schedule"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(i)",
          "context": "Providers of high-risk AI systems shall comply with the registration obligations referred to in Article 49(1)"
        },
        {
          "ref": "Article 49(1)",
          "context": "Before placing on the market or putting into service a high-risk AI system, the provider shall register that system in the EU database referred to in Article 71"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports transparency and explainability requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "N/A — Supports overall ISO 42001 transparency and explainability requirements",
          "context": ""
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "Regulatory Registration and Public Transparency",
      "maturity_enhancement": "Timely EU database registration with ongoing maintenance and accuracy verification essential for Level 2 maturity demonstrating minimum regulatory compliance for market access"
    }
  },
  {
    "control_id": "TRANS-REP-01",
    "control_title": "External Reporting to Authorities",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish formal procedures for communicating with national competent authorities, market surveillance authorities, and notified bodies, including the ability to demonstrate AI system conformity upon reasoned request, provide required information within mandated timeframes, maintain designated authority contact points, and ensure all regulatory communications are documented, approved, and traceable.",
    "control_objective": "Ensure the organization can promptly and completely respond to regulatory authority requests for information, demonstrate AI system conformity on demand, and maintain documented communication channels with all relevant oversight bodies.",
    "risk_description": "Inability to demonstrate conformity upon reasoned request constitutes a direct Article 16(k) violation, potentially resulting in orders to withdraw or recall AI systems from the market. Delayed or incomplete responses to market surveillance authorities signal compliance deficiencies that escalate regulatory scrutiny and may trigger formal investigation proceedings. Without established authority communication procedures, ad hoc responses risk inadvertent disclosure of privileged information, inconsistent messaging across authorities, and failure to meet mandated response timeframes.",
    "implementation": {
      "requirements": [
        "Authority Communication Procedure defining the end-to-end process for receiving, triaging, responding",
        "Information Disclosure Log providing auditable record of all information shared with regulatory authorities including request date",
        "Regulatory Request Response Template providing pre-approved response frameworks for common authority request types",
        "Compliance Demonstration Package maintaining a continuously current portfolio of conformity evidence ready for authority inspection",
        "Authority Contact Registry maintaining current contact information for all relevant regulatory authorities across operating jurisdictions"
      ],
      "steps": [
        "Identify all regulatory authorities with jurisdiction over the organization's AI systems across all operating markets",
        "Develop Authority Communication Procedure defining roles, responsibilities, escalation paths, response timeframes",
        "Create pre-approved Regulatory Request Response Templates for standard authority request types enabling rapid response while maintaining legal and compliance safeguards",
        "Assemble and maintain Compliance Demonstration Package with current conformity evidence organized for efficient authority review",
        "Implement Information Disclosure Log with tamper-evident recording of all authority communications providing full audit trail of regulatory interactions"
      ],
      "timeline": "Authority Communication Procedure established before market placement; Compliance Demonstration Package assembled during conformity assessment"
    },
    "evidence_requirements": [
      "Authority Communication Procedure",
      "Information Disclosure Log",
      "Regulatory Request Response Template",
      "Compliance Demonstration Package",
      "Authority Contact Registry"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 16(k)",
          "context": "Providers shall demonstrate conformity of the high-risk AI system upon reasoned request from a national competent authority"
        },
        {
          "ref": "Article 17(1)(j)",
          "context": "Quality management system shall include handling of communication with national competent authorities, notified bodies, and other relevant entities"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports transparency and explainability requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.5",
          "context": "Determine and document obligations to reporting information to interested parties including regulatory authorities with established communication procedures"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "Regulatory Authority Communication and Conformity Demonstration",
      "maturity_enhancement": "Formalized authority communication with pre-approved templates, compliance readiness packages, and documented interaction history essential for Level 3 maturity demonstrating proactive regulatory engagement"
    }
  },
  {
    "control_id": "TRANS-REP-02",
    "control_title": "External Adverse Impact Reporting Channel",
    "category": "AI Transparency & Explainability",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish accessible, well-publicized channels through which end users, affected persons, and impacted communities can report adverse impacts, concerns, or complaints related to AI system operation, ensuring reports are received, acknowledged, investigated, and resolved within defined timeframes with appropriate protections for reporters against retaliation.",
    "control_objective": "Ensure external stakeholders have effective, accessible mechanisms to report adverse AI system impacts, enabling the organization to identify and address harms that may not be detected through internal monitoring alone.",
    "risk_description": "Without external reporting channels, the organization operates blind to adverse impacts experienced by end users and affected communities, allowing harms to persist and accumulate undetected until they escalate to regulatory complaints, litigation, or public incidents. Absence of formal reporting mechanisms forces affected persons to seek redress through regulatory complaints, legal action, or public disclosure, increasing reputational and financial exposure. Missing reporter protections discourage good-faith reporting, further reducing the organization's visibility into real-world AI system impacts.",
    "implementation": {
      "requirements": [
        "External Reporting Channel Documentation specifying all available reporting channels",
        "Adverse Impact Report Form providing structured intake template capturing reporter information",
        "Report Processing Procedure defining end-to-end workflow from report receipt through investigation, determination, remediation",
        "Response Timeline Commitment publishing defined service levels for report acknowledgment",
        "Reporter Protection Policy formally prohibiting retaliation against persons who report adverse AI impacts in good faith"
      ],
      "steps": [
        "Design external reporting channels ensuring accessibility across multiple modalities",
        "Develop Adverse Impact Report Form optimized for non-technical reporters with guided intake questions, severity self-assessment, evidence upload capability",
        "Establish Report Processing Procedure with defined triage criteria, investigation protocols, cross-functional investigation teams",
        "Define and publish Response Timeline Commitments with escalation procedures for reports exceeding standard timelines, implementing automated tracking to monitor adherence",
        "Adopt and publish Reporter Protection Policy with anti-retaliation provisions, confidentiality commitments, and secure reporting channels for sensitive disclosures"
      ],
      "timeline": "Reporting channels established before AI system deployment; Report Processing Procedure implemented at launch"
    },
    "evidence_requirements": [
      "External Reporting Channel Documentation",
      "Adverse Impact Report Form",
      "Report Processing Procedure",
      "Response Timeline Commitment",
      "Reporter Protection Policy"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall transparency and explainability requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.5.1",
          "context": "Collect external feedback regarding potential impacts from end users and affected communities to inform risk management"
        },
        {
          "ref": "MEASURE.3.3",
          "context": "Establish feedback processes for end users and impacted communities to report concerns and adverse outcomes"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.3",
          "context": "Provide capabilities for interested parties to report adverse impacts of the AI system through accessible and well-publicized channels"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "External Stakeholder Feedback and Adverse Impact Reporting",
      "maturity_enhancement": "Structured adverse impact reporting with processing workflows, response commitments, and reporter protections essential for Level 3 maturity demonstrating stakeholder-responsive AI governance"
    }
  },
  {
    "control_id": "TRANS-RISK-01",
    "control_title": "Risk and Limitation Disclosure",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL identify, document, and disclose to deployers and affected persons all known or reasonably foreseeable risks, limitations, and circumstances that may lead to risks to health, safety, or fundamental rights, including foreseeable unintended outcomes, residual risks after mitigation, known failure modes, and context-specific risk factors, enabling informed risk management decisions by downstream stakeholders.",
    "control_objective": "Ensure deployers and affected persons receive comprehensive, actionable disclosure of known risks, limitations, foreseeable adverse outcomes, and residual risks associated with high-risk AI system use, enabling informed risk acceptance and downstream risk management.",
    "risk_description": "Failure to disclose known risks and limitations to deployers transfers unmanaged risk to downstream users who are unaware of potential harms, creating liability exposure for the provider when foreseeable risks materialize and affected persons suffer harm that adequate disclosure would have enabled them to avoid or mitigate. Non-disclosure of foreseeable misuse scenarios removes deployers' ability to implement preventive controls against misapplication, making the provider complicit in foreseeable harm caused by system use outside validated parameters. Missing residual risk communication creates an assumption that all risks have been eliminated by the provider's mitigations, leading deployers to operate without necessary supplementary risk controls and creating gaps in the end-to-end risk management chain.",
    "implementation": {
      "requirements": [
        "Risk Disclosure Document for Users providing comprehensive risk communication to deployers covering all identified risks that could affect",
        "Known Limitation Statement documenting all known technical and operational limitations of the AI system including boundary conditions beyond",
        "Foreseeable Misuse Warnings documenting reasonably foreseeable misuse scenarios identified through risk assessment including unintended",
        "Residual Risk Communication documenting risks that remain after all implemented mitigations including quantified residual risk levels",
        "Context-Specific Risk Guidance providing tailored risk information for different deployment contexts acknowledging that risk profiles change"
      ],
      "steps": [
        "Compile comprehensive risk inventory from risk assessment outputs",
        "Document system limitations comprehensively including technical boundaries",
        "Develop foreseeable misuse warnings based on structured misuse analysis considering intended purpose deviation"
      ],
      "timeline": "Risk disclosure compiled during pre-deployment risk assessment; limitations documented throughout development and testing"
    },
    "evidence_requirements": [
      "Risk Disclosure Document for Users",
      "Known Limitation Statement",
      "Foreseeable Misuse Warnings",
      "Residual Risk Communication",
      "Context-Specific Risk Guidance"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)(b)(iii)",
          "context": "Instructions for use shall contain known or foreseeable circumstances related to the use of the high-risk AI system which may lead to risks to health, safety, or fundamental rights"
        },
        {
          "ref": "Annex IV(3)",
          "context": "Technical documentation shall include foreseeable unintended outcomes and sources of risks to health, safety, and fundamental rights"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.2",
          "context": "Document system limitations and conditions under which the AI system may produce unreliable or unsafe outputs"
        },
        {
          "ref": "MANAGE.1.4",
          "context": "Document negative residual risks and communicate them to end users and affected stakeholders"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.2",
          "context": "Technical limitations should be documented and communicated to users including error rates, accuracy limitations, and reliability constraints"
        },
        {
          "ref": "A.5.3",
          "context": "Document positive and negative impacts of the AI system including residual risks and limitations"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Comprehensive risk disclosure with context-specific guidance, residual risk communication, and misuse warnings essential for Level 3 maturity demonstrating transparent risk communication enabling informed stakeholder decision-making"
    }
  },
  {
    "control_id": "TRANS-TECHDOC-01",
    "control_title": "Technical Documentation System",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and maintain a comprehensive technical documentation system for each high-risk AI system that is drawn up before or at the time of market placement, contains at minimum all elements specified in Annex IV of the EU AI Act, defines specific tasks and methods for documentation creation and maintenance, documents internal risk controls, and is structured to enable assessment of AI system compliance by competent authorities.",
    "control_objective": "Ensure each high-risk AI system has complete, Annex IV-compliant technical documentation created before market placement that enables regulatory authorities, notified bodies, and internal auditors to assess system compliance with all applicable requirements.",
    "risk_description": "Absence of Annex IV-compliant technical documentation renders high-risk AI systems non-compliant with Article 11, blocking market placement and exposing providers to enforcement actions including fines up to €15M or 3% of global turnover. Incomplete documentation prevents effective conformity assessment by notified bodies, delays or prevents CE marking, and eliminates the organization's ability to demonstrate compliance upon reasoned request from competent authorities. Without systematic documentation, institutional knowledge about AI system design decisions, training data characteristics, and risk controls is lost over time, undermining the organization's ability to maintain, update, or defend the system.",
    "implementation": {
      "requirements": [
        "Technical Documentation Package containing all Annex IV elements including general system description",
        "Annex IV Compliance Checklist providing item-by-item verification against all Annex IV requirements including Section 1",
        "Documentation Completeness Review providing independent assessment that technical documentation covers all required elements with sufficient",
        "Technical Documentation Version Control implementing document management system with version tracking, change history, approval workflows",
        "Documentation Update Log recording all modifications to technical documentation with date, author, change description, approval status"
      ],
      "steps": [
        "Map all Annex IV requirements to specific documentation deliverables using the Annex IV Compliance Checklist",
        "Establish documentation infrastructure using a document management system",
        "Author technical documentation sections with input from development teams, data engineers, risk managers",
        "Conduct documentation completeness review through independent assessment verifying all Annex IV elements are present, accurate",
        "Establish documentation governance including review schedules, update triggers, approval authorities, and access controls aligned with information security requirements"
      ],
      "timeline": "Documentation system established during project initiation; Annex IV content authored during development"
    },
    "evidence_requirements": [
      "Technical Documentation Package",
      "Annex IV Compliance Checklist",
      "Documentation Completeness Review",
      "Technical Documentation Version Control",
      "Documentation Update Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 11(1)",
          "context": "Technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and shall be kept up to date"
        },
        {
          "ref": "Annex IV",
          "context": "Technical documentation referred to in Article 11(1) shall contain at a minimum the information specified"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MAP.2.1",
          "context": "Define specific tasks and methods for the AI system including documentation of design decisions, data requirements, and development processes"
        },
        {
          "ref": "MAP.4.2",
          "context": "Document internal risk controls and risk management approaches applied throughout the AI system lifecycle"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.2.7",
          "context": "Determine what AI system technical documentation is needed for each relevant category of interested parties and maintain documentation that supports regulatory compliance assessment"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "Technical Documentation and Compliance Evidence",
      "maturity_enhancement": "Comprehensive Annex IV-compliant documentation system with version control and completeness validation essential for Level 3 maturity demonstrating systematic regulatory documentation practices"
    }
  },
  {
    "control_id": "TRANS-TECHDOC-02",
    "control_title": "Technical Documentation Maintenance",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish and execute ongoing procedures to keep all technical documentation for high-risk AI systems current, accurate, and management-approved, including systematic review schedules, change-triggered update processes, version control with complete change history, and formal approval workflows ensuring documentation reflects the actual state of deployed AI systems at all times.",
    "control_objective": "Ensure technical documentation for high-risk AI systems remains continuously accurate and up-to-date throughout the system lifecycle, reflecting all modifications, performance changes, and operational learnings with formal management approval.",
    "risk_description": "Outdated technical documentation creates dangerous divergence between documented system behavior and actual system behavior, rendering conformity assessments unreliable and potentially invalidating CE marking. Regulatory authorities conducting post-market surveillance will identify documentation-system discrepancies as compliance failures under Article 11, triggering enforcement actions. Stale documentation also impairs incident investigation, root cause analysis, and system maintenance by providing inaccurate reference information to engineers and operators, increasing the likelihood of errors during system modifications.",
    "implementation": {
      "requirements": [
        "Documentation Update Procedure defining triggers for documentation updates",
        "Version Control System implementing document versioning with full change history, branching for concurrent updates, merge controls",
        "Document Review Schedule establishing periodic review cadences",
        "Change History Log providing tamper-evident record of all documentation modifications including date",
        "Documentation Approval Records providing formal management sign-off on each documentation version with approval authority designation"
      ],
      "steps": [
        "Define documentation update triggers linked to AI system change management processes ensuring every system modification automatically generates a documentation",
        "Implement version control infrastructure with document management system providing full audit trail, concurrent editing controls",
        "Establish periodic review schedule with assigned reviewers for each Annex IV documentation section",
        "Configure automated documentation freshness monitoring alerting documentation owners when scheduled reviews are approaching or overdue",
        "Implement formal approval workflow requiring management sign-off on all documentation changes with digital signatures or equivalent approval mechanisms"
      ],
      "timeline": "Documentation maintenance procedures established at system deployment; version control active from first documentation version"
    },
    "evidence_requirements": [
      "Documentation Update Procedure",
      "Version Control System",
      "Document Review Schedule",
      "Change History Log",
      "Documentation Approval Records"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 11(1)",
          "context": "Technical documentation shall be kept up-to-date ensuring documentation continuously reflects the current state of the high-risk AI system throughout its lifecycle"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "N/A — No direct NIST AI RMF mapping",
          "context": ""
        },
        {
          "ref": "supports transparency and explainability requirements",
          "context": ""
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.2.7",
          "context": "Documentation should be current, accurate, and management-approved with established processes for maintaining documentation quality throughout the AI system lifecycle"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Transparency & Explainability Domain",
      "area": "Documentation Lifecycle Management",
      "maturity_enhancement": "Systematic documentation maintenance with version control, approval workflows, and freshness monitoring essential for Level 3 maturity demonstrating continuous documentation governance"
    }
  },
  {
    "control_id": "TRANS-XAI-01",
    "control_title": "Explainability Methods Implementation",
    "category": "AI Transparency & Explainability",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement appropriate explainability methods for each high-risk AI system that enable deployers and human oversight personnel to understand, interpret, and validate AI system outputs, selecting explanation approaches proportionate to the system's risk level and use context, and validating that explanations are accurate, comprehensible, and useful for intended audiences.",
    "control_objective": "Ensure high-risk AI systems provide accurate, comprehensible explanations of their outputs through validated explainability methods that enable deployers and oversight personnel to understand decision factors, assess output reliability, and exercise informed oversight.",
    "risk_description": "Without implemented explainability methods, deployers and oversight personnel receive AI outputs as opaque recommendations they cannot evaluate, verify, or contextually assess, undermining the value of human oversight and creating conditions where errors and biases propagate undetected into consequential decisions. Explanations that are technically accurate but incomprehensible to their intended audience provide false assurance of transparency while failing to enable genuine understanding, creating compliance risk under Article 13's requirement for information that is comprehensible to deployers. Missing explanation validation means the organization cannot demonstrate that its explainability mechanisms actually work, leaving it unable to prove to regulators, auditors, or courts that deployed AI systems provide the transparency required by the EU AI Act for high-risk applications.",
    "implementation": {
      "requirements": [
        "Explainability Approach Document defining the organization's explainability strategy for each high-risk AI system including selected explanation",
        "Explanation Method Specification documenting the technical implementation of selected explainability methods including algorithm specifications",
        "Output Interpretation Tools documenting the user-facing tools and interfaces that present explanations to deployers and oversight personnel",
        "Explanation Validation Results documenting systematic evaluation of explanation quality including fidelity testing",
        "User Comprehension Testing documenting evaluation of whether explanation recipients actually understand AI system outputs after receiving"
      ],
      "steps": [
        "Select explainability methods appropriate to each AI system's model architecture, risk level",
        "Implement selected explainability methods integrated into the AI system's inference pipeline enabling real-time or near-real-time explanation generation",
        "Develop explanation presentation interfaces tailored to each target audience: technical dashboards for data scientists and model validators showing feature",
        "Validate explanation quality through systematic testing including fidelity assessment",
        "Conduct user comprehension testing with representative members of each target audience using structured evaluation protocols including scenario-based comprehension"
      ],
      "timeline": "Explainability approach defined during system design; explanation methods implemented during development"
    },
    "evidence_requirements": [
      "Explainability Approach Document",
      "Explanation Method Specification",
      "Output Interpretation Tools",
      "Explanation Validation Results",
      "User Comprehension Testing"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 13(3)(d)",
          "context": "Instructions for use shall include human oversight measures including technical measures put in place to facilitate the interpretation of the outputs of the high-risk AI system by deployers"
        },
        {
          "ref": "Article 14(4)(c)",
          "context": "Human oversight measures shall enable individuals to correctly interpret the high-risk AI system's output taking into account the characteristics of the system and the interpretation tools and methods available"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.8",
          "context": "Risks associated with transparency and accountability are examined and documented including evaluation of explainability method effectiveness"
        },
        {
          "ref": "MEASURE.2.9",
          "context": "AI system output interpretation guidance is provided and validated within the appropriate operational context ensuring explanations support correct understanding"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.9.3",
          "context": "Objectives for AI system operation include explainability ensuring stakeholders can understand the basis for AI system outputs"
        },
        {
          "ref": "A.8.2",
          "context": "Methods and metrics to evaluate whether users can interpret and understand AI system outputs supporting informed decision-making"
        }
      ]
    },
    "aima_mapping": {
      "domain": "",
      "area": "",
      "maturity_enhancement": "Validated explainability methods with user comprehension testing, fidelity assessment, and audience-appropriate presentation essential for Level 4 maturity demonstrating that AI system explanations genuinely enable understanding and informed oversight"
    }
  },
  {
    "control_id": "FAIR-ALG-01",
    "control_title": "Algorithmic Bias Testing",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct comprehensive algorithmic bias testing for each high-risk AI system evaluating systemic bias (arising from institutional practices and data collection processes), computational bias (arising from algorithm design, optimization objectives, and model architecture), and human-cognitive bias (arising from human decisions embedded in training data, labels, and feature engineering), documenting bias sources identified and implementing appropriate detection, prevention, and mitigation measures.",
    "control_objective": "Ensure high-risk AI systems are systematically tested for all categories of algorithmic bias—systemic, computational, and human-cognitive—with identified bias sources documented and addressed through targeted prevention and mitigation measures.",
    "risk_description": "Without comprehensive algorithmic bias testing across all bias categories, the organization addresses only surface-level bias symptoms while root causes persist and regenerate discriminatory patterns. Systems tested only for outcome disparities without source identification cannot be effectively debiased because mitigation efforts are untargeted. Missing human-cognitive bias review allows annotation biases, feature engineering biases, and threshold-setting biases to propagate undetected through the system, embedding human prejudices in automated decisions.",
    "implementation": {
      "requirements": [
        "Algorithmic Bias Test Plan defining the comprehensive testing methodology covering systemic bias assessment",
        "Bias Source Identification documenting all identified sources of bias in the AI system organized by bias category",
        "Computational Bias Assessment documenting analysis of bias introduced by algorithmic design choices including optimization objective alignment",
        "Systemic Bias Analysis documenting assessment of historical and societal biases encoded in training data, sampling processes",
        "Human-Cognitive Bias Review documenting evaluation of human judgment biases embedded in the AI system through data collection decisions"
      ],
      "steps": [
        "Conduct systemic bias assessment analyzing training data for historical discrimination patterns, sampling biases",
        "Evaluate computational bias by analyzing model optimization objectives for misalignment with fairness goals",
        "Assess human-cognitive bias by reviewing annotation guidelines and inter-annotator agreement across demographic groups",
        "Implement bias detection tooling including Fairlearn bias detection, AIF360 bias scanners, SHAP-based feature attribution analysis for proxy variable identification",
        "Map identified bias sources to mitigation strategies: pre-processing interventions for systemic data biases, in-processing constraints for computational biases"
      ],
      "timeline": "Algorithmic bias test plan during system design; systemic and human-cognitive bias assessment during data preparation"
    },
    "evidence_requirements": [
      "Algorithmic Bias Test Plan",
      "Bias Source Identification",
      "Computational Bias Assessment",
      "Systemic Bias Analysis",
      "Human-Cognitive Bias Review"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(f)",
          "context": "Examination for possible biases likely to lead to discrimination"
        },
        {
          "ref": "Article 10(2)(g)",
          "context": "Identification and implementation of appropriate measures to detect, prevent, and mitigate biases"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate across bias categories including systemic, computational, and human-cognitive bias with documented analysis of each category"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.7.4",
          "context": "Consider impact of bias on system performance and fairness and make adjustments as necessary based on bias testing results"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Algorithmic Bias Detection and Source Analysis",
      "maturity_enhancement": "Multi-category algorithmic bias testing with source identification and targeted mitigation essential for Level 4 maturity demonstrating comprehensive bias governance"
    }
  },
  {
    "control_id": "FAIR-APPEAL-01",
    "control_title": "Fairness Appeals and Redress Process",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "Medium",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL establish formal processes through which individuals affected by AI system decisions can appeal outcomes they believe to be unfair or discriminatory, request human review of automated decisions, receive timely and reasoned responses to appeals, access effective redress mechanisms including correction or reversal of adverse decisions, and have appeal outcomes tracked and analyzed to identify systemic fairness issues.",
    "control_objective": "Ensure individuals affected by AI system decisions have accessible, effective mechanisms to challenge outcomes, obtain human review, and receive appropriate redress for unfair or discriminatory automated decisions.",
    "risk_description": "Without formal appeals processes, individuals affected by unfair AI decisions have no mechanism for redress other than regulatory complaints or litigation, increasing organizational legal exposure and reputational risk while denying affected persons timely resolution. Missing appeal tracking eliminates a critical feedback signal that could identify systemic fairness issues before they escalate to regulatory action or public controversy. Absence of human review capability for appealed decisions may violate GDPR Article 22 rights to human intervention in automated decision-making.",
    "implementation": {
      "requirements": [
        "Appeals Process Document defining the end-to-end appeals procedure including eligibility criteria, submission channels",
        "Redress Mechanism Specification defining available remedies for successful appeals including decision correction",
        "Appeal Response Timeline establishing maximum response times for each stage: acknowledgment",
        "Appeal Outcome Tracking implementing systematic recording of all appeals including appellant demographics",
        "Fairness Complaint Resolution Log maintaining comprehensive record of all fairness-related complaints and appeals enabling trend analysis"
      ],
      "steps": [
        "Design appeals process with accessibility as a primary consideration ensuring multiple submission channels, plain language guidance, multi-language support",
        "Define redress mechanisms specifying available remedies for different appeal outcomes with clear decision criteria",
        "Establish human review capability ensuring qualified, independent human decision-makers are available to review appealed AI decisions with access to all relevant",
        "Implement appeal tracking system capturing all appeal data with consent-based demographic information enabling pattern analysis",
        "Develop appeal outcome analysis procedures including monthly trend reporting, quarterly systemic issue assessment"
      ],
      "timeline": "Appeals process established before AI system deployment; human review capability in place at launch"
    },
    "evidence_requirements": [
      "Appeals Process Document",
      "Redress Mechanism Specification",
      "Appeal Response Timeline",
      "Appeal Outcome Tracking",
      "Fairness Complaint Resolution Log"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall fairness and non-discrimination requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.3.3",
          "context": "Establish processes for end users to appeal AI system outcomes and provide feedback on fairness concerns"
        },
        {
          "ref": "MANAGE.4.1",
          "context": "Implement mechanisms for appeal and override of AI system decisions including human review"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.8.3",
          "context": "Provide capabilities for interested parties to report adverse impacts of the AI system including appeals of decisions"
        },
        {
          "ref": "A.9.3",
          "context": "Human reviewers shall have capability to check and override AI outputs when fairness concerns are raised"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Appeals, Redress, and Human Review Mechanisms",
      "maturity_enhancement": "Formal appeals process with human review, redress mechanisms, and outcome tracking essential for Level 3 maturity demonstrating stakeholder-responsive fairness governance with accountability"
    }
  },
  {
    "control_id": "FAIR-CONT-01",
    "control_title": "Fairness in Continuous Learning Systems",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL implement specific fairness safeguards for AI systems that continue to learn after deployment, including assessment of biased feedback loop risks, continuous monitoring of fairness metrics during production operation, drift detection specifically targeting fairness metric degradation, fairness validation during retraining cycles, and analysis of bias accumulation patterns over time.",
    "control_objective": "Ensure AI systems with continuous learning capabilities maintain fairness throughout their operational lifecycle by detecting and preventing biased feedback loops, fairness drift, and bias accumulation that can emerge from ongoing adaptation to production data.",
    "risk_description": "Continuous learning systems without fairness safeguards can rapidly amplify biases through feedback loops, where biased predictions influence future training data, reinforcing and intensifying discriminatory patterns in a self-reinforcing cycle. Article 15(4) specifically requires elimination or reduction of biased feedback loop risks, making missing safeguards a direct compliance violation. Gradual bias accumulation in continuously learning systems may be imperceptible in short-term monitoring but can result in dramatically unfair system behavior over months or years of operation.",
    "implementation": {
      "requirements": [
        "Feedback Loop Bias Risk Assessment documenting analysis of how the AI system's continuous learning mechanism could create or amplify biases",
        "Continuous Learning Fairness Monitor implementing real-time or near-real-time tracking of fairness metrics during production operation",
        "Drift Detection for Fairness Metrics implementing statistical drift detection methods",
        "Retraining Fairness Validation establishing mandatory fairness evaluation checkpoints in every retraining cycle ensuring that model updates do",
        "Bias Accumulation Analysis documenting longitudinal analysis of fairness metrics over time to detect gradual bias accumulation that may be"
      ],
      "steps": [
        "Conduct Feedback Loop Bias Risk Assessment mapping all pathways through which system predictions can influence future training data",
        "Implement Continuous Learning Fairness Monitor deploying real-time fairness metric computation on production data streams using tools such as Fairlearn monitoring",
        "Configure fairness-specific drift detection using statistical methods",
        "Establish retraining fairness validation gates requiring automated fairness evaluation against all defined fairness metrics before any retrained model is promoted",
        "Implement bias accumulation analysis computing fairness metric trends over time windows"
      ],
      "timeline": "Feedback loop risk assessment before deployment of continuous learning system; fairness monitor deployed at launch"
    },
    "evidence_requirements": [
      "Feedback Loop Bias Risk Assessment",
      "Continuous Learning Fairness Monitor",
      "Drift Detection for Fairness Metrics",
      "Retraining Fairness Validation",
      "Bias Accumulation Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 15(4)",
          "context": "High-risk AI systems that continue to learn after being placed on the market or put into service shall be developed in such a way as to eliminate or reduce as far as possible the risk of possibly biased outputs influencing input for future operations (feedback loops)"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.4",
          "context": "Monitor AI system functionality and performance during production including fairness metrics"
        },
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate fairness and bias including assessment of bias dynamics in continuously adapting systems"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.2.6",
          "context": "For continuous learning systems, monitor to ensure design goals including fairness objectives are met throughout operational deployment"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Continuous Learning Fairness Safeguards",
      "maturity_enhancement": "Feedback loop safeguards with continuous fairness monitoring, drift detection, and retraining validation essential for Level 4 maturity demonstrating advanced fairness governance for adaptive systems"
    }
  },
  {
    "control_id": "FAIR-EO-01",
    "control_title": "Equal Opportunity and Equalized Odds Testing",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct equal opportunity and equalized odds testing for each high-risk AI system, measuring whether true positive rates, false positive rates, and false negative rates are equalized across protected groups, performing threshold optimization analysis to identify configurations that improve fairness-performance trade-offs, and documenting odds ratio analysis to quantify discriminatory outcome patterns.",
    "control_objective": "Ensure high-risk AI systems are tested for equal opportunity and equalized odds across protected groups, identifying whether error rates and correct prediction rates differ systematically across demographic categories.",
    "risk_description": "Without equalized odds testing, AI systems may exhibit dramatically different error rates across protected groups—for example, much higher false positive rates for minority groups—causing systematic discriminatory harm that violates equality legislation and EU AI Act bias requirements. Unequal error rates in high-stakes applications (criminal justice, healthcare, employment) can result in disproportionate adverse consequences for already-disadvantaged groups. Missing threshold optimization analysis forfeits opportunities to improve fairness with minimal performance cost, leaving easily-remediable discriminatory patterns in production systems.",
    "implementation": {
      "requirements": [
        "Equalized Odds Assessment Report documenting the degree to which true positive rates and false positive rates are equal across protected groups",
        "True Positive Rate Comparison providing detailed analysis of whether the AI system correctly identifies positive cases at equal rates across",
        "False Positive Rate Comparison documenting whether the AI system incorrectly classifies negative cases as positive at different rates across",
        "Threshold Optimization for Fairness documenting analysis of decision threshold adjustments that could improve fairness metrics without",
        "Odds Ratio Analysis computing odds ratios for AI system outcomes across protected groups to quantify the relative likelihood of positive"
      ],
      "steps": [
        "Compute per-group true positive rates, false positive rates, true negative rates",
        "Calculate equalized odds differences (TPR difference and FPR difference across groups) and equal opportunity differences",
        "Perform odds ratio analysis computing the relative odds of positive outcomes for each protected group compared to reference groups",
        "Conduct threshold optimization analysis exploring alternative decision thresholds for each protected group that improve equalized odds metrics",
        "Assess practical impact of identified disparities by translating statistical differences into concrete outcome impacts"
      ],
      "timeline": "Equal opportunity testing during model evaluation; equalized odds assessment before deployment"
    },
    "evidence_requirements": [
      "Equalized Odds Assessment Report",
      "True Positive Rate Comparison",
      "False Positive Rate Comparison",
      "Threshold Optimization for Fairness",
      "Odds Ratio Analysis"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(f)",
          "context": "Examination for possible biases that are likely to lead to discrimination prohibited by Union law"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Description of potentially discriminatory impacts of the high-risk AI system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Assess equalized odds and test for discriminatory outcomes across demographic groups with documented analysis of error rate differences"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.5.4",
          "context": "Assess potential impacts to individuals or groups including fairness through systematic analysis of outcome disparities"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Equal Opportunity and Error Rate Parity Testing",
      "maturity_enhancement": "Equalized odds testing with threshold optimization and odds ratio analysis essential for Level 3 maturity demonstrating advanced fairness evaluation beyond demographic parity"
    }
  },
  {
    "control_id": "FAIR-METRIC-01",
    "control_title": "Fairness Metric Selection",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL select, justify, and document context-appropriate fairness metrics for each high-risk AI system, establishing quantified fairness thresholds, analyzing trade-offs between competing fairness metrics and between fairness and performance objectives, and providing clear rationale for metric selection decisions that accounts for the specific use context, affected populations, and decision stakes.",
    "control_objective": "Ensure each high-risk AI system is evaluated against rigorously selected, context-appropriate fairness metrics with justified thresholds that enable objective measurement of discriminatory impacts and guide bias mitigation efforts.",
    "risk_description": "Without rigorously selected fairness metrics, the organization cannot objectively measure whether AI systems produce discriminatory outcomes, rendering fairness claims unsubstantiated and unverifiable. Arbitrary metric selection or inappropriate thresholds may fail to detect material discrimination patterns, creating legal exposure under anti-discrimination laws and EU AI Act Article 10 requirements. Undocumented metric trade-off decisions leave the organization unable to justify its fairness evaluation approach to regulators, auditors, or affected parties challenging system outcomes.",
    "implementation": {
      "requirements": [
        "Fairness Metric Specification defining all fairness metrics applied to each AI system including mathematical definitions",
        "Metric Selection Justification documenting the rationale for each selected fairness metric including why it is appropriate for the specific",
        "Trade-off Analysis Between Metrics documenting the inherent tensions between competing fairness metrics",
        "Metric Threshold Definition specifying quantified fairness thresholds for each metric including acceptable ranges, warning thresholds",
        "Context-Appropriate Metric Rationale providing end-to-end documentation connecting the AI system's use context, affected populations"
      ],
      "steps": [
        "Analyze AI system use context to identify which fairness properties are most relevant including equal selection rates",
        "Evaluate candidate fairness metrics against use context requirements using a structured selection framework considering metric mathematical properties",
        "Document impossibility results and trade-offs between competing fairness metrics",
        "Define quantified fairness thresholds using industry benchmarks (e.g., four-fifths rule for selection rate ratios)"
      ],
      "timeline": "Metric selection during AI system design phase; threshold definition during development"
    },
    "evidence_requirements": [
      "Fairness Metric Specification",
      "Metric Selection Justification",
      "Trade-off Analysis Between Metrics",
      "Metric Threshold Definition",
      "Context-Appropriate Metric Rationale"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(f)",
          "context": "Examination of training, validation, and testing data sets for possible biases that are likely to lead to discrimination prohibited by Union law"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.1.1",
          "context": "Select appropriate metrics for measuring AI risks including fairness risks with context-appropriate measurement approaches"
        },
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate and document fairness and bias across demographic groups using validated measurement methods"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.1.2",
          "context": "Integrate measures to achieve fairness objectives including selection of appropriate measurement approaches"
        },
        {
          "ref": "A.5.4",
          "context": "Areas of impact assessment include fairness requiring systematic metric selection and evaluation"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Fairness Measurement and Metric Selection",
      "maturity_enhancement": "Rigorous metric selection with trade-off analysis, justified thresholds, and context-appropriate rationale essential for Level 3 maturity demonstrating systematic fairness measurement"
    }
  },
  {
    "control_id": "FAIR-MIT-01",
    "control_title": "Bias Mitigation Strategy and Implementation",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL develop, implement, and document a comprehensive bias mitigation strategy for each high-risk AI system, selecting and applying appropriate mitigation techniques at pre-processing, in-processing, and post-processing stages, measuring mitigation effectiveness through before/after comparison, and establishing ongoing bias monitoring to ensure mitigation effectiveness persists over time.",
    "control_objective": "Ensure identified biases in high-risk AI systems are systematically mitigated through validated techniques with documented effectiveness, maintaining fairness improvements throughout operational deployment.",
    "risk_description": "Identified biases without mitigation represent known discriminatory impacts that the organization has documented but chosen not to address, creating severe legal and ethical liability. Failure to implement Article 10(2)(g) bias mitigation measures constitutes a direct compliance violation for high-risk AI systems. Without ongoing bias monitoring, initially effective mitigations may degrade over time due to data drift, population changes, or feedback loops, causing bias to re-emerge undetected in production systems.",
    "implementation": {
      "requirements": [
        "Bias Mitigation Strategy Document defining the overall mitigation approach for each AI system including selected mitigation techniques",
        "Mitigation Technique Selection Rationale documenting why specific mitigation techniques were chosen including options considered",
        "Pre/Post Mitigation Comparison providing quantified comparison of fairness metrics before and after each mitigation intervention",
        "Mitigation Effectiveness Report documenting the overall effectiveness of the mitigation strategy including which biases were successfully reduced",
        "Ongoing Bias Monitoring Plan defining post-deployment monitoring for bias recurrence including monitored metrics"
      ],
      "steps": [
        "Map identified biases from FAIR-ALG-01 to appropriate mitigation techniques selecting from pre-processing methods",
        "Implement selected mitigation techniques in controlled development environment with comprehensive before/after evaluation measuring impact on all fairness metrics",
        "Conduct pre/post mitigation comparison quantifying fairness improvement, performance impact",
        "Iterate on mitigation approach if initial results are insufficient, exploring alternative techniques or combining multiple approaches across pre-processing"
      ],
      "timeline": "Mitigation strategy development following bias testing; mitigation implementation during model development"
    },
    "evidence_requirements": [
      "Bias Mitigation Strategy Document",
      "Mitigation Technique Selection Rationale",
      "Pre/Post Mitigation Comparison",
      "Mitigation Effectiveness Report",
      "Ongoing Bias Monitoring Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(g)",
          "context": "Implement appropriate measures to detect, prevent, and mitigate possible biases identified in training, validation, and testing data sets"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Document bias mitigation effectiveness including comparison of fairness metrics before and after mitigation interventions"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.7.4",
          "context": "Make adjustments to model and data as necessary based on bias testing results to improve fairness outcomes"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Bias Mitigation Strategy and Effectiveness Measurement",
      "maturity_enhancement": "Systematic bias mitigation with technique selection rationale, effectiveness measurement, and ongoing monitoring essential for Level 4 maturity demonstrating operational bias management"
    }
  },
  {
    "control_id": "FAIR-OBJ-01",
    "control_title": "Fairness Objectives Definition",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL define, document, and integrate explicit fairness objectives into organizational AI policies, system requirements specifications, and AI development lifecycle processes, ensuring fairness objectives address non-discrimination, equitable treatment across protected groups, and context-appropriate fairness definitions aligned with applicable legal requirements, ethical principles, and stakeholder expectations.",
    "control_objective": "Ensure every AI system is developed and operated against clearly defined, documented fairness objectives that guide design decisions, evaluation criteria, and ongoing monitoring throughout the AI lifecycle.",
    "risk_description": "Without defined fairness objectives, AI systems are developed and deployed without explicit consideration of discriminatory impacts, making bias detection and mitigation ad hoc and inconsistent. Absent fairness objectives, the organization cannot demonstrate to regulators, auditors, or affected parties that it has systematically considered and addressed non-discrimination requirements. Undefined fairness goals also prevent meaningful fairness testing because there are no criteria against which to evaluate system behavior, leaving discriminatory patterns undetected until they cause measurable harm.",
    "implementation": {
      "requirements": [
        "Fairness Policy Statement establishing the organization's commitment to AI fairness at the governance level including definitions of fairness",
        "Fairness Objectives Document specifying concrete, measurable fairness objectives for each AI system including applicable fairness definitions",
        "Fairness Requirements Specification integrating fairness objectives into system requirements documentation ensuring fairness is treated as a",
        "Fairness Metrics Selection Rationale documenting the justification for selected fairness metrics including why chosen metrics are appropriate",
        "Fairness Review Checklist providing structured review framework for evaluating fairness consideration at each AI lifecycle stage"
      ],
      "steps": [
        "Conduct fairness landscape analysis identifying applicable non-discrimination laws",
        "Define organizational Fairness Policy Statement with input from legal, ethics, compliance, diversity and inclusion",
        "Develop context-specific fairness objectives for each AI system through stakeholder engagement, impact analysis",
        "Integrate fairness objectives into system requirements specifications as testable acceptance criteria using structured requirements templates that pair each",
        "Create Fairness Review Checklist aligned with AI development lifecycle stages ensuring fairness consideration gates are embedded in development workflows"
      ],
      "timeline": "Fairness Policy Statement adopted before AI system development begins; system-specific fairness objectives defined during requirements phase"
    },
    "evidence_requirements": [
      "Fairness Policy Statement",
      "Fairness Objectives Document",
      "Fairness Requirements Specification",
      "Fairness Metrics Selection Rationale",
      "Fairness Review Checklist"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "N/A — Supports overall fairness and non-discrimination requirements",
          "context": ""
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "GOVERN.1.2",
          "context": "Integrate fairness considerations into organizational AI governance policies and processes at all levels"
        },
        {
          "ref": "MAP.1.6",
          "context": "Elicit and document system requirements that specifically address AI fairness risks and non-discrimination obligations"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.6.1.2",
          "context": "Identify and document AI objectives including fairness to guide responsible development and deployment"
        },
        {
          "ref": "A.9.3",
          "context": "Objectives for AI system operation shall include fairness ensuring equitable treatment across affected groups"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Fairness Governance and Objectives Definition",
      "maturity_enhancement": "Documented fairness objectives integrated into AI lifecycle processes with stakeholder engagement and metrics rationale essential for Level 2 maturity establishing foundational fairness governance"
    }
  },
  {
    "control_id": "FAIR-SUB-01",
    "control_title": "Subgroup Performance Analysis",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct subgroup performance analysis for each high-risk AI system, evaluating system accuracy and reliability across demographic subgroups and intersectional combinations, identifying underperforming subgroups, analyzing performance variance patterns, and developing subgroup-specific mitigation plans for identified disparities.",
    "control_objective": "Ensure high-risk AI system performance is evaluated at granular subgroup and intersectional levels, identifying populations where system accuracy or reliability falls below acceptable thresholds and implementing targeted improvements.",
    "risk_description": "Aggregate performance metrics can mask significant performance disparities affecting specific subgroups, allowing AI systems to perform inadequately for minority populations while appearing acceptable overall. Intersectional disadvantages—where performance degrades at the intersection of multiple attributes—are invisible without explicit subgroup analysis, causing compounded harm to already-vulnerable populations. Without subgroup-specific mitigation plans, identified performance gaps persist indefinitely, accumulating discriminatory impact and increasing legal and reputational exposure over time.",
    "implementation": {
      "requirements": [
        "Subgroup Performance Report providing disaggregated performance metrics",
        "Intersectional Analysis Results documenting performance at the intersection of multiple protected attributes",
        "Performance Variance Analysis quantifying the spread and distribution of performance metrics across subgroups to identify whether the system",
        "Underperforming Group Identification documenting all subgroups where system performance falls below minimum acceptable thresholds",
        "Subgroup-Specific Mitigation Plan defining targeted interventions for each underperforming subgroup including data augmentation strategies"
      ],
      "steps": [
        "Define demographic subgroups for analysis based on protected attributes and their intersections",
        "Compute comprehensive performance metrics disaggregated by each subgroup and intersectional combination using tools such as Fairlearn MetricFrame",
        "Conduct intersectional analysis using multi-dimensional fairness assessment methods",
        "Perform statistical testing to distinguish meaningful performance disparities from sampling variation using permutation tests, bootstrap confidence intervals",
        "Investigate root causes of identified subgroup performance gaps through error analysis, data representation assessment, feature importance analysis"
      ],
      "timeline": "Subgroup performance analysis during model evaluation; intersectional analysis before deployment"
    },
    "evidence_requirements": [
      "Subgroup Performance Report",
      "Intersectional Analysis Results",
      "Performance Variance Analysis",
      "Underperforming Group Identification",
      "Subgroup-Specific Mitigation Plan"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(3)",
          "context": "Training, validation, and testing data sets shall have appropriate statistical properties including as regards the persons or groups of persons on which the high-risk AI system is intended to be used"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate across bias categories and measure fairness across demographic groups including intersectional analysis of performance variation"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.5.4",
          "context": "Consider specific protection needs of various groups when assessing AI system impacts including granular subgroup analysis"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Subgroup and Intersectional Performance Analysis",
      "maturity_enhancement": "Granular subgroup performance analysis with intersectional assessment and targeted mitigation essential for Level 4 maturity demonstrating advanced fairness evaluation capabilities"
    }
  },
  {
    "control_id": "FAIR-TEST-01",
    "control_title": "Discriminatory Impact and Demographic Parity Testing",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct systematic discriminatory impact testing and demographic parity analysis for each high-risk AI system, measuring selection rates, positive outcome rates, and resource allocation rates across all relevant protected groups, computing disparate impact ratios, and documenting whether system outputs exhibit statistically significant differences in treatment or outcomes across demographic categories.",
    "control_objective": "Ensure high-risk AI systems are tested for discriminatory impacts through demographic parity analysis, identifying and quantifying any differential treatment or outcome patterns across protected groups before deployment and throughout operational use.",
    "risk_description": "Untested AI systems may produce systematically discriminatory outcomes that violate EU equality directives, GDPR automated decision-making protections, and EU AI Act Article 10 bias examination requirements, exposing the organization to enforcement actions, discrimination lawsuits, and significant reputational damage. Without demographic parity testing, disparate impact on protected groups remains invisible until affected persons identify and report patterns, by which time substantial harm has accumulated. Missing discriminatory impact documentation prevents the organization from demonstrating due diligence in bias detection to regulators and courts.",
    "implementation": {
      "requirements": [
        "Fairness Test Plan defining the complete testing methodology including protected attributes tested",
        "Discriminatory Impact Assessment providing comprehensive analysis of whether AI system outputs disproportionately affect protected groups",
        "Demographic Parity Analysis Report documenting the degree to which AI system positive outcome rates are equal across demographic groups",
        "Protected Group Performance Comparison providing side-by-side performance metrics",
        "Selection Rate Analysis and Disparate Impact Report providing detailed quantitative analysis of selection rates across protected groups"
      ],
      "steps": [
        "Define protected attributes for testing based on applicable non-discrimination laws (EU equality directives, national legislation), system deployment context",
        "Prepare representative test datasets with sufficient representation of protected groups ensuring statistical power for detecting meaningful disparities",
        "Compute demographic parity metrics using fairness toolkits",
        "Apply disparate impact analysis using four-fifths rule (80% threshold) and complementary statistical tests",
        "Disaggregate system performance metrics by protected group computing accuracy, precision, recall, F1-score, false positive rate"
      ],
      "timeline": "Test Plan developed during system design; initial testing during model evaluation"
    },
    "evidence_requirements": [
      "Fairness Test Plan",
      "Discriminatory Impact Assessment",
      "Demographic Parity Analysis Report",
      "Protected Group Performance Comparison",
      "Selection Rate Analysis",
      "Disparate Impact Report"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 10(2)(f)",
          "context": "Examination for possible biases that are likely to lead to discrimination prohibited by Union law"
        },
        {
          "ref": "Article 10(3)",
          "context": "Training, validation, and testing data sets shall have appropriate statistical properties including regarding the persons or groups of persons on which the system is intended to be used"
        },
        {
          "ref": "Annex IV(2)(g)",
          "context": "Description of potentially discriminatory impacts of the system"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate and document fairness and bias including measurement of fairness across demographic groups and assessment of statistical parity in system outcomes"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.5.4",
          "context": "Assess potential impacts to individuals or groups including fairness with systematic analysis of differential treatment"
        },
        {
          "ref": "A.7.4",
          "context": "Consider impact of bias on system performance and fairness across population subgroups"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Discriminatory Impact Testing and Demographic Parity Analysis",
      "maturity_enhancement": "Systematic discriminatory impact testing with disparate impact analysis and demographic parity measurement essential for Level 3 maturity demonstrating rigorous fairness evaluation"
    }
  },
  {
    "control_id": "FAIR-VULN-01",
    "control_title": "Fairness Impact on Vulnerable Groups",
    "category": "AI Fairness & Non-Discrimination",
    "priority": "High",
    "status": "Draft",
    "applicable_to": "{}",
    "control_statement": "The organization SHALL conduct specific fairness impact assessments evaluating whether each high-risk AI system adversely impacts vulnerable groups including children under age 18, persons with disabilities, elderly persons, workers in subordinate positions, and other groups with specific protection needs, implementing enhanced safeguards proportionate to the vulnerability of affected populations.",
    "control_objective": "Ensure high-risk AI systems are specifically evaluated for adverse impacts on vulnerable populations, with enhanced fairness protections implemented for groups with specific protection needs including children, persons with disabilities, elderly persons, and workers.",
    "risk_description": "Without vulnerable group impact assessment, AI systems may cause disproportionate harm to populations least equipped to identify, report, or seek redress for adverse impacts. Article 9(9) specifically requires consideration of impacts on children and vulnerable groups, making missing assessment a direct compliance violation. Systems that perform adequately for general populations may create significant accessibility barriers, developmental risks, or exploitation opportunities for vulnerable groups that remain invisible without targeted evaluation.",
    "implementation": {
      "requirements": [
        "Vulnerable Group Impact Assessment providing comprehensive analysis of AI system impacts on each identified vulnerable group",
        "Child-Specific Fairness Analysis documenting evaluation of AI system impacts specifically on persons under 18 including age-appropriate",
        "Accessibility Fairness Review evaluating whether AI system design and outputs are equitably accessible to persons with disabilities",
        "Elder Population Impact Analysis documenting assessment of AI system impacts on elderly users including digital literacy considerations",
        "Worker Impact Assessment evaluating fairness impacts on workers in employment-related AI applications including analysis of power imbalance"
      ],
      "steps": [
        "Identify all vulnerable groups potentially affected by each AI system using a structured vulnerability mapping framework that considers age",
        "Conduct Child-Specific Fairness Analysis for any system potentially interacting with or making decisions about minors",
        "Perform Accessibility Fairness Review evaluating AI system accessibility for persons with disabilities using automated accessibility testing",
        "Assess elder population impacts including usability testing with elderly users, cognitive load evaluation, digital divide considerations",
        "Evaluate worker impacts for employment-related AI systems assessing algorithmic management fairness, surveillance proportionality, worker data rights"
      ],
      "timeline": "Vulnerable group identification during system design; child-specific and accessibility analysis during development"
    },
    "evidence_requirements": [
      "Vulnerable Group Impact Assessment",
      "Child-Specific Fairness Analysis",
      "Accessibility Fairness Review",
      "Elder Population Impact Analysis",
      "Worker Impact Assessment"
    ],
    "compliance_mapping": {
      "eu_ai_act": [
        {
          "ref": "Article 9(9)",
          "context": "Consider whether the high-risk AI system is likely to adversely impact persons under the age of 18 or other vulnerable groups in the risk management process"
        }
      ],
      "nist_ai_rmf": [
        {
          "ref": "MEASURE.2.11",
          "context": "Evaluate fairness and bias including specific consideration of impacts on vulnerable populations and groups with heightened protection needs"
        }
      ],
      "iso_42001": [
        {
          "ref": "A.5.4",
          "context": "Consider specific protection needs of children, persons with impairments, elderly persons, and workers when assessing AI system impacts"
        }
      ]
    },
    "aima_mapping": {
      "domain": "AI Fairness & Non-Discrimination Domain",
      "area": "Vulnerable Group Protection and Impact Assessment",
      "maturity_enhancement": "Specific vulnerable group impact assessment with child safety, accessibility, and worker impact analysis essential for Level 4 maturity demonstrating comprehensive fairness protection for at-risk populations"
    }
  }
];
exports.up = async (pgm) => {
  if (CONTROLS_DATA.length === 0) return;
  console.log('Importing ' + CONTROLS_DATA.length + ' CRC controls...');
  const BATCH_SIZE = 20;
  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < CONTROLS_DATA.length; i += BATCH_SIZE) {
    const batch = CONTROLS_DATA.slice(i, i + BATCH_SIZE);
    const cols = 13;
    const placeholders = batch.map((_, rowIdx) => {
        const base = rowIdx * cols + 1;
        const tokens = Array.from({length: 13}, (_, j) => '$' + (base + j));
        tokens[9] += '::jsonb';
        tokens[10] += '::jsonb';
        tokens[11] += '::jsonb';
        tokens[12] += '::jsonb';
        return '(' + tokens.join(', ') + ', 1)';
    }).join(', ');
    const values = [];
    for (const ctrl of batch) {
      values.push(
        ctrl.control_id, ctrl.control_title, ctrl.category, ctrl.priority, ctrl.status, ctrl.applicable_to, ctrl.control_statement, ctrl.control_objective, ctrl.risk_description,
        JSON.stringify(ctrl.implementation), JSON.stringify(ctrl.evidence_requirements), JSON.stringify(ctrl.compliance_mapping), JSON.stringify(ctrl.aima_mapping)
      );
    }
    const query = 'INSERT INTO crc_controls (control_id, control_title, category, priority, status, applicable_to, control_statement, control_objective, risk_description, implementation, evidence_requirements, compliance_mapping, aima_mapping, version) VALUES ' + placeholders + ' ON CONFLICT (control_id) DO NOTHING';
    const result = await pgm.db.query(query, values);
    const batchInserted = result.rowCount || 0;
    inserted += batchInserted;
    skipped += batch.length - batchInserted;
  }
  console.log('CRC import complete: ' + inserted + ' inserted, ' + skipped + ' skipped (already existed).');
};
exports.down = async (pgm) => {
  const controlIds = CONTROLS_DATA.map((c) => c.control_id).filter((id) => id);
  if (controlIds.length === 0) return;
  console.log('Removing ' + controlIds.length + ' CRC controls...');
  const BATCH_SIZE = 50;
  let deleted = 0;
  for (let i = 0; i < controlIds.length; i += BATCH_SIZE) {
    const batch = controlIds.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map((_, idx) => '$' + (idx + 1)).join(', ');
    await pgm.db.query('DELETE FROM crc_assessment_responses WHERE control_id IN (SELECT id FROM crc_controls WHERE control_id IN (' + placeholders + '))', batch);
    await pgm.db.query('DELETE FROM crc_control_versions WHERE control_id IN (SELECT id FROM crc_controls WHERE control_id IN (' + placeholders + '))', batch);
    const result = await pgm.db.query('DELETE FROM crc_controls WHERE control_id IN (' + placeholders + ')', batch);
    deleted += result.rowCount || 0;
  }
  console.log('CRC rollback complete: ' + deleted + ' controls removed.');
};