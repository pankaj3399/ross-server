/* eslint-disable camelcase */
/**
 * Migration: Populate supplemental guidance (description) for all AIMA questions.
 *
 * Contains all 144 supplemental guidance entries inline (24 practices x 3 levels x 2 streams).
 * Updates the "description" column in aima_questions for each (practice_id, level, stream, question_index=0).
 */

exports.shorthands = undefined;

const GUIDANCE_DATA = {
  "ethical_societal_impact": {
    "1": {
      "A": "Maturity Level 1 - Define and implement a structured approach to AI ethics and risk management, replacing informal, reactive handling with proactive policies aligned to your organization’s business goals, values, and regulatory obligations.\nStream A (Create & Promote): \n    • Incident-Driven: Ethical concerns addressed post-incident without consistent practices.\n    • Informal Accountability: Ethical responsibilities assigned ad-hoc with minimal documentation.\n    • Limited Follow-Up: Post-incident documentation with little structured learning or improvement.",
      "B": "Maturity Level 1 - Define and implement a structured approach to AI ethics and risk management, replacing informal, reactive handling with proactive policies aligned to your organization’s business goals, values, and regulatory obligations.\nStream B (Measure & Improve): \n    • Occasional Discussions: Ethical topics addressed informally, typically driven by personal initiative.\n    • No Structured Training: Ethical training is absent or ad-hoc, with no formal programs, onboarding content, or role-specific support provided by the organization.\n    • Variable Awareness: Ethics understanding varies across teams without shared organizational standards."
    },
    "2": {
      "A": "Maturity Level 2 – Implement structured AI governance frameworks with formalized ethics and environmental policies, defined roles, and accountability mechanisms to ensure consistent oversight.\nStream A (Create & Promote): \n    • Defined Ethical and Environmental Policy: Explicit policy outlines values, principles, and responsibilities.\n    • Ethics Governance: Designated Ethics Officers or Committees oversee ethical practices and governance.\n    • Integrated Assessments: Ethical and Environmental impact assessments systematically embedded into planning and documentation.",
      "B": "Maturity Level 2 – Implement structured AI governance frameworks with formalized ethics and environmental policies, defined roles, and accountability mechanisms to ensure consistent oversight.\nStream B (Measure & Improve): \n    • Role-Specific Training: Ethics training tailored to roles conducted regularly.\n    • Supported Discussions: Encouraged open forums for ethical dilemmas and ongoing\ndialogue.\n    • Routine Reflection: Ethical and Environmental considerations integrated into regular project activities."
    },
    "3": {
      "A": "Maturity Level 3 - Embed an Ethical AI Culture by continuously integrating ethical principles into AI development, monitoring outcomes, and reinforcing values across organizational practices.\nStream A (Create & Promote): \n    • Continuous Monitoring: Ethical and environmental KPIs actively tracked and aligned with organizational performance metrics.\n    • Policy Evolution: Regular updates based on stakeholder feedback and real-world insights. \n    • Automated Integration: Ethics and environmental tools and processes embedded throughout all project lifecycle phases.",
      "B": "Maturity Level 3 - Embed an Ethical AI Culture by continuously integrating ethical principles into AI development, monitoring outcomes, and reinforcing values across organizational practices.\nStream B (Measure & Improve): \n    • Rewarded Ethics: Ethical and environmental behavior recognized in career progression and performance evaluations.\n    • Cultural Reinforcement: Regular events and leadership modeling to reinforce proactive ethical and environmental behavior.\n    • Normalized Decision-Making: Ethical and environmental considerations standard across all organizational decision-making levels."
    }
  },
  "transparency_explainability": {
    "1": {
      "A": "Maturity Level 1 - Establish a formal Transparency Model, where information is shared inconsistently and only in response to external demands.\nStream A (Create & Promote): \n    • Manual Documentation: Documentation created reactively, usually after issues arise.\n    • Informal Roles: Transparency responsibilities assigned ad-hoc, without formal definitions.\n    • Contextual Gaps: Outputs frequently lack sufficient interpretability and context.",
      "B": "Maturity Level 1 - Establish a formal Transparency Model, where information is shared inconsistently and only in response to external demands.\nStream B (Measure & Improve): \n    • Informal Awareness: Explainability discussed in informal settings,  formal training absent.\n    • Voluntary Queries: Encouraged, but not required, model explanation requests.\n    • Individual-Driven: Transparency awareness driven by personal interest rather than institutional norms."
    },
    "2": {
      "A": "Maturity Level 2 - Define Structured Implementation approach with formalized policies, tooling and clear responsibilities.\nStream A (Create & Promote): \n    • Defined Policy: Established transparency and explainability policy guiding documentation and tool usage.\n    • Role Clarity: Champions appointed to ensure explainability across teams.\n    • Standardized Tools: SHAP, LIME, and model cards embedded into development pipelines.",
      "B": "Maturity Level 2 - Define Structured Implementation approach with formalized policies, tooling and clear responsibilities.\nStream B (Measure & Improve): \n    • Role-Based Training: Targeted training on interpretability techniques provided regularly.\n    • Systematic Retrospectives: Teams regularly review the clarity and impact of model explanations. \n    • Growing Consistency: Transparency practices standardized and shared more broadly across the organization."
    },
    "3": {
      "A": "Maturity Level 3 - Embedded Transparency Culture with Continuous measurement, automated transparency aligned with goals.\nStream A (Create & Promote): \n    • Automated Processes: Explanation documentation automated and validated within CI/CD workflows.\n    • Real-Time Metrics: Transparency metrics continuously monitored via dashboards aligned to strategic KPIs.\n    • Automated Remediation: Trigger automatic remediation workflows when explanation standards are unmet.",
      "B": "Maturity Level 3 - Embedded Transparency Culture with Continuous measurement, automated transparency aligned with goals.\nStream B (Measure & Improve): \n    • Performance Integration: Transparency effectiveness included in individual and team performance evaluations.\n    • Cultural Innovation: Organization-wide explainability events (e.g., hackathons) enhance innovation and accountability.\n    • Open Dialogue: Institutional norms promote ongoing dialogue and continuous improvement in transparency and explainability."
    }
  },
  "fairness_bias": {
    "1": {
      "A": "Maturity Level 1 - Establish adhoc approach to respond to requests towards Fairness and bias.\nStream A (Create & Promote): \n    • Ad Hoc Response: Bias addressed inconsistently, primarily after complaints or incidents.\n    • Unclear Roles: Responsibilities assigned informally, without defined roles or documented processes.\n    • Lack of Tools: No standardized tools, checkpoints, or processes established for bias assessment.",
      "B": "Maturity Level 1 - Establish adhoc approach to respond to requests towards Fairness and bias.\nStream B (Measure & Improve): \n    • Limited Awareness: Cultural awareness driven by individual initiative without formal training.\n    • Informal Reporting: Reporting of bias concerns voluntary and unstructured,  insights not consistently acted upon.\n    • No Defined Metrics: Absence of formal metrics or tracking methods for bias-related issues."
    },
    "2": {
      "A": "Maturity Level 2 - Define structured Implementation with formalized policies and processes, but limited integration.\nStream A (Create & Promote): \n    • Defined Policies: Formal policies, charters, and governance forums guide bias mitigation efforts.\n    • Tool Integration: Fairness assessment tools and documentation used at key project milestones.\n    • Regular Assessments: Regular bias evaluations conducted but not always tied explicitly to KPIs or business outcomes.",
      "B": "Maturity Level 2 - Define structured Implementation with formalized policies and processes, but limited integration.\nStream B (Measure & Improve): \n    • Role-Specific Training: Regular fairness training tailored to specific roles.\n    • Feedback Mechanisms: Project retrospectives and knowledge sharing occur regularly post-release.\n    • Partial Engagement: Cultural engagement and fairness awareness present but inconsistently applied organization-wide."
    },
    "3": {
      "A": "Maturity Level 3 - Embedded Fairness Culture with fully integrated into core processes, automated monitoring, continuous improvement.\nStream A (Create & Promote): \n    • Automated Monitoring: Continuous, automated bias detection tools trigger real-time remediation.\n    • Enterprise-Wide Metrics: Fairness KPIs tracked organization-wide, integrated into business performance metrics and OKRs.\n    • Process Integration: Fairness assessments enforced through automated CI/CD pipelines and ongoing production validations.",
      "B": "Maturity Level 3 - Embedded Fairness Culture with fully integrated into core processes, automated monitoring, continuous improvement.\nStream B (Measure & Improve): \n    • Incentivized Culture: Fairness integrated into career growth, performance reviews, and recognition programs.\n    • Proactive Exercises: Regular red-team exercises and simulations strengthen organizational resilience to bias.\n    • Continuous Enhancement: Active promotion of continuous improvement initiatives across all teams, regularly celebrated and incentivized."
    }
  },
  "strategy_metrics": {
    "1": {
      "A": "Maturity Level 1 - Establish an AI Security and Responsible AI Strategy aligned with the organization’s overall business goals, ethical standards, and risk profile.\nStream A (Create & Promote): \n    • Minimal Alignment: AI security and RAI efforts are not consistently linked to business or ethical goals.\n    • Unclear Accountability: No formal ownership for AI security or ethical governance,  responsibilities may be scattered.\n    • Ad Hoc Processes: AI security actions happen on-demand (e.g., after an incident), with no strategic roadmap.",
      "B": "Maturity Level 1 - Establish an AI Security and Responsible AI Strategy aligned with the organization’s overall business goals, ethical standards, and risk profile.\nStream B (Measure & Improve): \n    • No Formal Metrics: AI security and RAI outcomes (e.g., incident counts, bias incidents, model validation) are not measured or measured informally.\n    • Incident-Driven Insights: Data is gathered primarily after security or ethical incidents with no routine analysis.\n    • Lack of Standardization: Reporting varies widely, making organization-wide comparisons difficult."
    },
    "2": {
      "A": "Maturity Level 2 - Define and Track AI Security and RAI Metrics to measure effectiveness, maturity, fairness, transparency, and return on investment.\nStream A (Create & Promote): \n    • Documented Strategy: A formal AI security and RAI strategy exists, referencing relevant enterprise risk, compliance, and ethical needs.\n    • Clear Governance: Defined roles (AI Security Lead, AI Ethics Officer, AI Security Committee) ensure accountability, fairness, and decision-making.\n    • Planned Integration: AI security and ethical oversight efforts included in project roadmaps, budgets, and organizational planning.",
      "B": "Maturity Level 2 - Define and Track AI Security and RAI Metrics to measure effectiveness, maturity, fairness, transparency, and return on investment.\nStream B (Measure & Improve): \n    • Established Metric Set: KPIs/ KRIs (e.g., fairness metrics, model risk classification, explainability standards) tracked over time.\n    • Regular Collection & Reporting: Metrics gathered at intervals and shared with stakeholders through dashboards/ reports.\n    • Action-Oriented Insights: Metrics drive resource allocation, ethical policies, fairness improvements, and actions for regulatory compliance."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously Improve AI Security and RAI Posture through iterative learning, adaptation, and ethical alignment.\nStream A (Create & Promote): \n    • Fully Embedded: AI security and RAI strategy integrated into broader corporate governance and ethics frameworks, continuously updated.\n    • Executive Sponsorship: Senior leadership proactively supports AI security and responsible AI as strategic investments.\n    • Lifecycle Integration: Mandatory AI security controls (model audits, fairness assessments, transparency measures, human oversight protocols) throughout all AI development and deployment phases.",
      "B": "Maturity Level 3 - Continuously Improve AI Security and RAI Posture through iterative learning, adaptation, and ethical alignment.\nStream B (Measure & Improve): \n    • Advanced Analytics & Monitoring: Real-time monitoring of AI systems (data drift, adversarial attack detection,bias detection), automated alerts and comprehensive audit trails.\n    • Predictive & Preventive Metrics: Metrics forecast risks (ethical, security, compliance issues) proactively addressing concerns.\n    • Culture of Data-Driven and Ethical Governance: Metrics feed strategic decision-making,  clear processes for continuous feedback, fairness enhancements, transparency improvements, and regulatory compliance."
    }
  },
  "policy_compliance": {
    "1": {
      "A": "Maturity Level 1 - Establish Baseline AI Policies and Compliance Awareness to address foundational security, privacy, and ethical obligations.\nStream A (Create & Promote): \n    • Minimal AI-Specific Policies: AI risks are loosely covered by general IT/security policies, if at all.\n    • Reactive Updates: Policies change only after incidents or regulatory pressure.\n    • Limited Guidance: Teams lack clear instructions for secure or responsible AI development.",
      "B": "Maturity Level 1 - Establish Baseline AI Policies and Compliance Awareness to address foundational security, privacy, and ethical obligations.\nStream B (Measure & Improve): \n    • Reactive Compliance: Efforts focus on ad-hoc responses to audits or incidents.\n    • Limited Oversight: No systematic tracking of AI-related regulations or risks.\n    • Informal Risk Assessment: Assessments, when performed, are inconsistent and undocumented."
    },
    "2": {
      "A": "Maturity Level 2 - Document and Enforce AI Policies, and Implement Structured Compliance Processes for security, privacy, and ethics.\nStream A (Create & Promote): \n    • Documented AI Policies & Standards: Formal requirements cover data use, model validation, bias testing, explainability, etc.\n    • Periodic Reviews: Policies reviewed on a defined schedule or when major changes occur.\n    • Consistent Application: Projects follow standards,  exceptions require documented approval.",
      "B": "Maturity Level 2 - Document and Enforce AI Policies, and Implement Structured Compliance Processes for security, privacy, and ethics.\nStream B (Measure & Improve): \n    • Established Compliance Processes: Regular reviews (privacy impact, bias audits) align with known regulations (e.g., GDPR, AI Act).\n    • Consistent Risk Framework: A risk register tracks AI security and ethical posture across projects. \n    • Internal Audit & Reporting: Findings are reported to governance bodies,  remediation is tracked."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously Optimize Policies and Compliance Governance with proactive monitoring, benchmarking, and automation.\nStream A (Create & Promote): \n    • Integrated Policy Framework: AI policies embedded in enterprise governance, risk, and ethics programs.\n    • Proactive Evolution: Updates anticipate emerging threats and regulations, guided by continuous risk scanning and industry input.\n    • Automated Enforcement: CI/ CD gates, data-use controls, and policy-as-code tooling flag or block non-compliant artifacts automatically.",
      "B": "Maturity Level 3 - Continuously Optimize Policies and Compliance Governance with proactive monitoring, benchmarking, and automation.\nStream B (Measure & Improve): \n    • Holistic Compliance Integration: Real-time regulatory watchlists inform automatic updates to controls and checklists. \n    • Advanced Risk Analytics: Continuous monitoring detects drift, bias, or security anomalies that could trigger compliance breaches.\n    • Benchmarking & Certification: The organization measures itself against leading frameworks and pursues external attestations to demonstrate excellence."
    }
  },
  "education_awareness": {
    "1": {
      "A": "Maturity Level 1 - Establish Baseline AI-Security and RAI Awareness for anyone touching AI initiatives.\nStream A (Create & Promote): \n    • Ad-Hoc Learning: Security and ethics topics appear sporadically in general tech training or after incidents.\n    • Limited Reach: Only core engineering teams receive any AI-security guidance,  business and risk stakeholders rarely included.\n    • Informal Materials: Slide decks or wiki pages exist but are not curated or kept up to date.",
      "B": "Maturity Level 1 - Establish Baseline AI-Security and RAI Awareness for anyone touching AI initiatives.\nStream B (Measure & Improve): \n    • No Formal Measurement: Completion rates, quiz scores, or adoption of guidance are not tracked.\n    • Reactive Improvements: Content is updated only when major issues arise.\n    • Knowledge Gaps Unidentified: The organization lacks insight into which roles need deeper AI-security skills."
    },
    "2": {
      "A": "Maturity Level 2 - Provide Structured, Role-Based AI-Security and RAI Training aligned with policies and risk appetite.\nStream A (Create & Promote):\n    • Documented Curriculum: Mandatory courses cover AI-specific threats, privacy, bias, and incident response,  electives address deeper topics like adversarial ML or model interpretability.\n    • Role Tailoring: Distinct learning paths for developers, data scientists, product owners, and executives.\n    • Guidance Library: Curated playbooks, checklists, and coding examples are integrated into day-to-day tools (e.g., notebooks, IDE extensions).",
      "B": "Maturity Level  2 - Provide Structured, Role-Based AI-Security and RAI Training aligned with policies and risk appetite.\nStream B (Measure & Improve): \n    • Tracked Participation & Assessments: Learning-management system tracks completion, scores, and certifications.\n    • Feedback Loops: Learners rate relevance,  course owners revise based on survey data and policy updates.\n    • Skill Gap Analysis: Regular reviews map workforce skills to upcoming AI projects and risk areas."
    },
    "3": {
      "A": "Maturity Level 3 - Embed Continuous, Data-Driven Learning Culture that adapts to evolving AI threats and regulations.\nStream A (Create & Promote):\n    • Just-In-Time Micro-Learning: Contextual tips and secure-by-design snippets appear in pipelines, notebooks, and code reviews.\n    • Community & Mentorship: Internal forums, guilds, and brown-bag sessions foster knowledge sharing,  external conferences encouraged.\n    • Automated Guidance Updates: New threat intel or policy changes automatically trigger content refresh and notification to affected roles.",
      "B": "Maturity Level 3 - Embed Continuous, Data-Driven Learning Culture that adapts to evolving AI threats and regulations.\nStream B (Measure & Improve): \n    • Performance-Linked Metrics: Training impact measured through defect density, incident trends, and model audit scores.\n    • Adaptive Curriculum: AI identifies learning gaps and personalizes content sequences.\n    • Benchmarking & Recognition: Organization compares learning maturity against industry, offers badges or career incentives, and publicly shares best practices to demonstrate leadership."
    }
  },
  "data_quality_integrity": {
    "1": {
      "A": "Maturity Level 1 - Establish an approach to identify and respond data quality or integrity issues reported.\nStream A (Create & Promote):\n    • Siloed Data: Data fragmented, unstructured, lacking standardized definitions.\n    • Poor Quality: High duplicates, missing values, and noise.\n    • No Validation: Absence of accuracy or relevance validation rules.",
      "B": "Maturity Level 1 - Establish an approach to identify and respond data quality or integrity issues reported.\nStream B (Measure & Improve): \n    • No Traceability: Data lineage or traceability non-existent.\n    • Manual Handling: High risk of tampering or corruption due to manual updates.\n    • Poor Auditability: Audit logs absent or unreliable."
    },
    "2": {
      "A": "Maturity Level 2 - Define a formal approach with documented processes and initial rules for managing quality and integrity in data sets.\nStream A (Create & Promote):\n    • Initial Cleansing: Basic data profiling and cleansing processes implemented.\n    • Early Standards: Initial completeness and consistency rules applied.\n    • Metadata Tracking: Early stages of data cataloging and metadata management.",
      "B": "Maturity Level 2 - Define a formal approach with documented processes and initial rules for managing quality and integrity in data sets.\nStream B (Measure & Improve): \n    • Partial Lineage: Data lineage partially established across main systems.\n    • Manual Change Tracking: Some manual tracking of data changes, minimal automation.\n    • Inconsistent Controls: Access controls in place but inconsistently enforced."
    },
    "3": {
      "A": "Maturity Level 3 - Create a quality culture with fully integrated data management practices with robust, automated mechanisms for maintaining quality and integrity.\nStream A (Create & Promote):\n    • Standardized Metrics: Defined metrics for accuracy, completeness, consistency, and timeliness systematically tracked. \n    • Active Quality Management: Continuous data quality checks, real-time scoring, LLM-specific data filters (e.g., toxicity, hallucination-prone data).\n    • Curated Data: Regular curation based on model feedback and bias tracking.",
      "B": "Maturity Level 3 - Create a quality culture with fully integrated data management practices with robust, automated mechanisms for maintaining quality and integrity.\nStream B (Measure & Improve): \n    • Full Traceability: Comprehensive lineage and versioning across entire AI data pipeline.\n    • Automated Integrity Checks: Real-time monitoring, immutable audit logs, automated anomaly detection for corruption, drift, or unauthorized changes.\n    • Proactive Compliance: Integrated integrity checkpoints supporting rigorous compliance standards."
    }
  },
  "data_governance_accountability": {
    "1": {
      "A": "Maturity Level 1 - Establish an approach for data governance or accountability.\nStream A (Create & Promote):\n    • No Formal Policies: Absence of defined policies or standards for data governance.\n    • Undefined Roles: Roles and responsibilities for data stewardship and governance are unclear.\n    • Unstructured Governance: Lack of governance processes specifically for AI datasets.",
      "B": "Maturity Level 1 - Establish an approach for data governance or accountability.\nStream B (Measure & Improve): \n    • Undefined Ownership: Data and AI model ownership unclear or not assigned.\n    • Documentation Gaps: Absence of consistent model documentation or reliable audit trails.\n    • No Accountability: AI outcomes lack clear accountability, oversight, and responsibility mechanisms."
    },
    "2": {
      "A": "Maturity Level 2 - Define a formal governance structures with well defined roles and accountability assigned.\nStream A (Create & Promote):\n    • Basic Governance Charter: Initial governance framework defined, outlining basic roles and responsibilities.\n    • Initial Stewardship: Basic data stewardship roles identified, with preliminary metadata management.\n    • Policy Development: Early stages of formal data usage policies.",
      "B": "Maturity Level 2 - Define a formal governance structures with well defined roles and accountability assigned.\nStream B (Measure & Improve): \n    • Partial Ownership Assignment: Data owners identified for select datasets and models.\n    • Preliminary Documentation:Initial attempts at systematic model documentation and traceability.\n    • Informal Ethical Concerns: Ethical and bias concerns acknowledged, though informally managed."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously improve the implementation with robust, enterprise-wide governance and accountability matrix.\nStream A (Create & Promote):\n    • Comprehensive Framework: Mature governance framework implemented enterprise-wide, regularly reviewed and updated.\n    • AI-Specific Policies: Detailed governance explicitly addressing AI training datasets, LLMs, agentic systems, and external data integration.\n    • Dynamic Adaptability: Governance practices dynamically scale with evolving AI technology\nneeds.",
      "B": "Maturity Level 3 - Continuously improve the implementation with robust, enterprise-wide governance and accountability matrix.\nStream B (Measure & Improve): \n    • Enforced Accountability: Clearly enforced accountability with responsible AI review boards overseeing model and dataset use. \n    • Incident Management: Comprehensive incident tracking, documentation, and continuous audits for responsible AI practices. \n    • Full Traceability: End-to-end traceability from data sourcing to model decisions, with explicit, accountable roles."
    }
  },
  "data_training": {
    "1": {
      "A": "Maturity Level 1 - Establish a Training data management structure with documented processes and standards.)\nStream A (Create & Promote):\n    • Unstructured Collection: Data gathered without structured processes, inconsistent quality.\n    • No Labeling Standards: Absence of formal labeling guidelines or dataset curation practices.\n    • Manual Validation: Minimal or no validation,  data quality highly variable.",
      "B": "Maturity Level 1 - Establish a Training data management structure with documented processes and standards.)\nStream B (Measure & Improve): \n    • No Compliance Checks: Lack of monitoring for compliance, bias, or security.\n    • Unchecked Data Use: Third-party or user-generated data integrated without licensing or consent verification.\n    • Security Risk: High risk of privacy breaches or ethical violations due to unmonitored datasets."
    },
    "2": {
      "A": "Maturity Level 2 - Defined formal governance structure with guidelines and initial compliance awareness in place.\nStream A (Create & Promote):\n    • Guidelines Established: Initial standards for dataset collection, labeling, and validation set.\n    • Partial Validation: Manual validation and checks performed on subsets of training data.\n    • Early-stage Curation: Early stages of data quality management and documentation established.",
      "B": "Maturity Level 2 - Defined formal governance structure with guidelines and initial compliance awareness in place.\nStream B (Measure & Improve): \n    • Initial Privacy Checks: Basic privacy and security compliance checks introduced.\n    • Licensing Awareness: Increased awareness and preliminary adherence to licensing and regulatory obligations.\n    • Bias Awareness: Emerging processes to identify obvious bias or harmful content, though inconsistently applied."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously improve with fully structured, automated, and compliant training data management.\nStream A (Create & Promote):\n    • Automated Pipelines: Standardized, automated pipelines for data preparation, quality control, deduplication, and labeling accuracy checks fully operational.\n    • Continuous Validation: Real-time or regular validation ensuring high-quality, representative, and reliable training data.\n    • Dynamic Curation: Active dataset curation based on model feedback, performance metrics, and evolving requirements.",
      "B": "Maturity Level 3 - Continuously improve with fully structured, automated, and compliant training data management.\nStream B (Measure & Improve): \n    • Systematic Compliance: Routine compliance audits for security, licensing, ethical use, and bias mitigation.\n    • Verified Usage Rights: Comprehensive vetting and documentation for third-party and sensitive data usage.\n    • Robust Security Measures: Secure data handling protocols with regular drift and toxicity monitoring, maintaining regulatory readiness and ethical standards."
    }
  },
  "data_minimization_purpose_limitation": {
    "1": {
      "A": "Maturity Level 1 - Establish Privacy Principles and Policies clearly defining the scope and limits of data use.\nStream A (Create & Promote):\n    • Informal Approach: Limited documentation of data collection and processing purposes.\n    • Reactive Management: Privacy actions taken primarily after incidents or upon request.\n    • Undefined Responsibilities: Privacy responsibilities not clearly assigned or formalized.",
      "B": "Maturity Level 1 - Establish Privacy Principles and Policies clearly defining the scope and limits of data use.\nStream B (Measure & Improve): \n    • No Formal Monitoring: Privacy compliance and data usage not regularly monitored.\n    • Incident-Based Learning: Privacy improvements largely triggered by privacy incidents.\n    • Lack of Metrics: Privacy metrics or assessments are informal or absent."
    },
    "2": {
      "A": "Maturity Level 2 - Implement Structured Privacy Controls for data minimization and clear purpose limitations.\nStream A (Create & Promote):\n    • Documented Policies: Clear and comprehensive policies defining data minimization and purpose limitations.\n    • Defined Accountability: Specific roles (Privacy Officer, Data Steward) established with clear responsibilities.\n    • Planned Compliance: Proactive privacy reviews integrated into AI project planning and execution.",
      "B": "Maturity Level 2 - Implement Structured Privacy Controls for data minimization and clear purpose limitations.\nStream B (Measure & Improve): \n    • Routine Monitoring: Regular audits and reviews of data practices and compliance with privacy policies.\n    • Basic Metrics: Privacy metrics (e.g., incident counts, data usage audits) routinely collected and reported.\n    • Proactive Adjustments: Metrics inform adjustments to practices, reducing privacy risks and improving compliance."
    },
    "3": {
      "A": "Maturity Level 3 - Embed Continuous Privacy Improvement into organizational culture and processes.\nStream A (Create & Promote):\n    • Fully Integrated Practices: Privacy principles and policies deeply embedded in organizational workflows and practices.\n    • Strategic Alignment: Privacy practices explicitly aligned with business objectives, ethics, and regulatory frameworks.\n    • Lifecycle Integration: Continuous privacy impact assessments and controls throughout AI system developmentand operation phases.",
      "B": "Maturity Level 3 - Embed Continuous Privacy Improvement into organizational culture and processes.\nStream B (Measure & Improve): \n    • Advanced Analytics: Real-time monitoring and analytics of data usage, access, and compliance.\n    • Predictive Privacy Management: Proactive identification and mitigation of privacy risks through predictive analytics and automated controls.\n    • Culture of Privacy Excellence: Metrics drive organizational strategies, support transparency, foster user trust, and ensure regulatory compliance."
    }
  },
  "privacy_by_design_default": {
    "1": {
      "A": "Maturity Level 1 - Establish a privacy program addressing privacy risks and user compliant.\nStream A (Create & Promote):\n    • Ad Hoc Practices: Privacy risks are addressed post-deployment and handled case-by-case.\n    • Missing Standards: No standardized processes for data minimization, DPIAs, or policy application.\n    • Manual Communication: Privacy notices and consents are manually generated, often retroactively.",
      "B": "Maturity Level 1 - Establish a privacy program addressing privacy risks and user compliant.\nStream B (Measure & Improve): \n    • No Privacy Engineering: Developers and designers operate without privacy design patterns or reusable components.\n    • Lack of Tools: No standard tools for consent, purpose limitation, or data classification. \n    • Reliance on Individuals: Teams depend on personal initiative rather than embedded technical safeguards."
    },
    "2": {
      "A": "Maturity Level 2 - Define a formal privacy program with well defined privacy practices, policies and assigned responsibilities.\nStream A (Create & Promote):\n    • Policy Adoption: A privacy by Design policy is published and adopted organization-wide.\n    • Assigned Roles: Privacy Officers or Data Stewards are appointed to oversee compliance.\n    • Integrated Processes: DPIAs and privacy reviews are integrated into product development and procurement lifecycles.",
      "B": "Maturity Level 2 - Define a formal privacy program with well defined privacy practices, policies and assigned responsibilities.\nStream B (Measure & Improve): \n    • Reusable Components: Privacy design patterns and libraries (e.g., consent modules, data masking APIs) are made available.\n    • Process Guidance: Templates and checklists guide teams through privacy requirements in design and development phases.\n    • Shared Tooling: Teams use shared SDKs for compliant data handling and user control mechanisms."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously improve the Privacy program with automation and monitoring of key metrics.\nStream A (Create & Promote):\n    • Automated Governance: DPIAs and approvals are integrated into CI/CD with automated gates.\n    • Code-Level Enforcement: Data retention, access controls, and minimization are enforced via code.\n    • Data-Driven Review: Privacy KPIs are reviewed quarterly and linked to org-wide OKRs.",
      "B": "Maturity Level 3 - Continuously improve the Privacy program with automation and monitoring of key metrics.\nStream B (Measure & Improve): \n    • Embedded PETs: Privacy-enhancing technologies (PETs) like differential privacy and synthetic data are provided by default.\n    • Integrated Safeguards: Privacy controls are embedded into design systems and dev workflows.\n    • Continuous Metrics: Metrics on privacy defaults and user control coverage are continuously monitored and improved."
    }
  },
  "user_control_transparency": {
    "1": {
      "A": "Maturity Level 1 - Establish User control practices and transparency mechanisms that are legally required.\nStream A (Create & Promote):\n    • Opaque Communication: Disclosures are written in legal terms with limited accessibility. \n    • Generic Consent: Consent mechanisms are generic and often bundled.\n    • Unclear Ownership: No clear ownership for transparency or user agency.",
      "B": "Maturity Level 1 - Establish User control practices and transparency mechanisms that are legally required.\nStream B (Measure & Improve): \n    • Inconsistent UI: UI elements for control (e.g. toggles, preferences) are ad hoc and hard-coded.\n    • No Design Standards: No reusable components or design guidelines for transparency.\n    • Limited User Access: Users cannot access or manage their data effectively."
    },
    "2": {
      "A": "Maturity Level 2 - Defined Policies and workflows to standardize user control and disclosure practices.\nStream A (Create & Promote):\n    • Policy Enforcement: A user transparency and control policy is published and enforced.\n    • Assigned Roles: Roles (e.g., UX Privacy Leads or Product Compliance Liaisons) are assigned.\n    • Reviewed Consent Flows: User consent flows are aligned with legal bases and reviewed periodically.",
      "B": "Maturity Level  2 - Defined Policies and workflows to standardize user control and disclosure practices.\nStream B (Measure & Improve):\n    • Standardized Interfaces: Common UI patterns are introduced for preferences, opt-ins/outs, and data visibility.\n    • Process Integration: Consent and disclosure flows are reviewed in design and development phases.\n    • Consistent Access: APIs are used to give users access, edit, and delete data consistently."
    },
    "3": {
      "A": "Maturity Level 3 - Optimized transparency and user control processes are embedded by default and continuously improved through feedback and automation.\nStream A (Create & Promote):\n    • Measured Transparency: User transparency KPIs (e.g. consent clarity, user opt-out rates) are tracked across products.\n    • Live Consent Tracking: Real-time consent and preference tracking is integrated with systems.\n    • Contextual Explanations: User-facing explanations are tailored based on context and usage.",
      "B": "Maturity Level 3 - Optimized transparency and user control processes are embedded by default and continuously improved through feedback and automation.\nStream B (Measure & Improve):\n    • Adaptive Components: Dynamic UI components adapt transparency and control options based on user needs.\n    • Feedback-Driven Design: Feedback loops inform design updates based on user behavior and satisfaction.\n    • Comprehensive Control Panels: Privacy dashboards and granular controls are standard inall user-facing systems."
    }
  },
  "threat_assessment": {
    "1": {
      "A": "Maturity Level 1 - Establish threat assessment process with identification of LLM-specific Risks.\nStream A (Create & Promote):\n    • High-Level Risks Identified: Initial identification and acknowledgment of broad risks (e.g., data leakage, unethical or harmful outputs).\n    • Ad Hoc Documentation: Risks are documented informally, without standardized structures or severity ratings.\n    • Limited Stakeholder Awareness: General awareness among stakeholders regarding potential risks, but no systematic tracking.",
      "B": "Maturity Level 1 - Establish threat assessment process with identification of LLM-specific Risks\nStream B (Measure & Improve):\n    • Use of Basic Checklists: Teams utilize basic threat checklists (e.g., OWASP Top 10 for LLM Applications) to identify common issues like prompt injection or sensitive data exposure.\n    • Informal Approach: Threat identification relies primarily on manual, informal processes.\n    • Limited Coverage: Threat assessments cover only selected or high-visibility LLM deployments."
    },
    "2": {
      "A": "Maturity Level 2 - Define processes for Centralized and Standardized Risk Management.\nStream A (Create & Promote):\n    • Centralized Risk Inventory: Established and maintained comprehensive risk inventory specific to LLM use cases, detailing vulnerabilities such as adversarial attacks, prompt manipulation, and ethical concerns.\n    • Severity Scores: Risks assigned severity scores based on potential impact, likelihood, and organizational context.\n    • Regular Updates: Risk inventories updated periodically or when significant changes in LLM use cases occur.",
      "B": "Maturity Level 2 - Define processes for Centralized and Standardized Risk Management.\nStream B (Measure & Improve):\n    • Standardized Threat Modeling Process: Organization-wide standardized approach to threat modeling, clearly mapping adversarial attack vectors such as prompt injection, unauthorized data disclosure, and unethical content generation.\n    • Structured Documentation: Threat models documented systematically and reviewed regularly.\n    • Integrated into Development: Threat modeling integrated into the design phase of LLM projects."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously improve the process with automated and Proactive Risk Detection.\nStream A (Create & Promote):\n    • Automated Risk Monitoring: Continuous, automated detection and monitoring of LLM outputs for potentially harmful content, data leakage, and security anomalies.\n    • Real-time Alerting: Automated alerts triggered by identified risks, facilitating immediate investigation and mitigation.\n    • Continuous Improvement: Risks dynamically reassessed through continuous monitoring and real-time data analytics.",
      "B": "Maturity Level 3 - Continuously improve the process with automated and Proactive Risk Detection.\nStream B (Measure & Improve):\n    • Full Automation of Threat Detection: AI-driven tools automatically detect adversarial attempts, prompt injection attacks, and other security threats in real-time. \n    • Integrated Alerts into Operational Tools: Threat detection integrated into operational and incident response systems (e.g., SIEM, SOAR).\n    • Predictive Analytics: AI-assisted predictive analytics anticipate new or evolving threats based on historical data and emerging trends.\n\n\nSecurity architecture"
    }
  },
  "security_architecture": {
    "1": {
      "A": "Maturity Level 1 - Initial Secure Practices.\nStream A (Create & Promote):\n    • Basic Isolation & Access Control: Implement fundamental security measures such as authentication and rate-limiting to secure AI APIs, aligned with industry standards and best  practices.\n    • Limited Runtime Protection: Initial protections mainly focused on basic perimeter defenses and simple access restrictions.",
      "B": "Maturity Level 1 - Initial Secure Practices\nStream B (Measure & Improve):\n    • Baseline Security Features: Utilize frameworks, libraries, and platforms with built-in security functionalities and protections.\n    • Informal Selection Criteria: Basic awareness in selecting technology stacks that provide foundational security capabilities."
    },
    "2": {
      "A": "Maturity Level 2 - Standardized Deployment Safeguards\nStream A (Create & Promote):\n    • Runtime Guardrails: Deploy comprehensive runtime guardrails including output sanitization and input validation to mitigate common vulnerabilities (e.g., OWASP Top 10 for LLM Applications).\n    • Structured Deployment Processes: Standardize deployment procedures to ensure consistent application of security controls across all AI environments.",
      "B": "Maturity Level 2 - Standardized Deployment Safeguards\nStream B (Measure & Improve):\n    • Standardized Monitoring & Observability: Implement standardized monitoring tools that track performance, observability, and key security metrics, providing clear visibility into AI operational health.\n    • Regular Metrics Review: Structured review processes established for ongoing monitoring and maintenance of technology stack security."
    },
    "3": {
      "A": "Maturity Level 3 - Advanced and Proactive Defenses\nStream A (Create & Promote):\n    • AI-Driven Adversarial Detection: Integrate advanced, AI-driven anomaly detection and adversarial monitoring capabilities into deployment environments, proactively identifying and addressing threats in real-time.\n    • Model Versioning & Rollback: Implement model versioning with swift rollback mechanisms to enable rapid incident recovery and response, particularly relevant for private or fine-tuned deployments.",
      "B": "Maturity Level 3 - Advanced and Proactive Defenses\nStream B (Measure & Improve):\n    • Automated Patch Management & Scanning: Fully automate vulnerability scanning and patch management processes, regularly reviewing and securing all dependencies within the technology stack.\n    • Continuous Improvement Cycles: Establish continuous review cycles, automatically adapting security practices in response to emerging threats and updated security intelligence."
    }
  },
  "security_requirements": {
    "1": {
      "A": "Maturity Level 1 - Baseline Documentation of Requirements\nStream A (Create & Promote):\n    • Baseline Ethical Guidelines: Document foundational ethical guidelines addressing bias, fairness, transparency, and compliance standards (e.g., GDPR, EU AI Act).\n    • Basic Compliance Measures: Initial strategies for meeting regulatory requirements (e.g., data privacy, user consent).\n    • General Awareness: Stakeholders have basic awareness of ethical and compliance obligations.",
      "B": "Maturity Level 1 - Baseline Documentation of Requirements\nStream B (Measure & Improve):\n    • Basic Data Provenance: Document initial sources of training data and maintain basic data lineage records.\n    • Manual Tracking: Data provenance records are manually created and updated, with limited standardization or automation.\n    • Limited Visibility: Partial visibility into third-party data and model components."
    },
    "2": {
      "A": "Maturity Level 2 - Standardized Implementation and Validation\nStream A (Create & Promote):\n    • Standardized Bias & Fairness Tools: Implement standardized tools for bias detection and fairness measurement within training pipelines and application outputs.\n    • Integrated Compliance Processes: Consistent application of compliance controls (e.g., automated checks for GDPR compliance, consent verification).\n    • Structured Documentation: Ethical and compliance measures systematically documented and regularly reviewed.",
      "B": "Maturity Level 2 - Standardized Implementation and Validation\nStream B (Measure & Improve):\n    • Automated Quality Checks: Automate validation processes for third-party datasets and AI models, including quality assurance and security assessments.\n    • Enhanced Provenance Records: Automated maintenance of detailed data lineage and provenance documentation, ensuring traceability and accountability.\n    • Structured Validation:Standardized criteria established for acceptance of third-party components."
    },
    "3": {
      "A": "Maturity Level 3 - Automated and Continuous Compliance Assurance\nStream A (Create & Promote):\n    • Real-Time Compliance Monitoring: Automated compliance checks integrated throughout AI system lifecycles, with real-time audit trails and immediate alerting mechanisms.\n    • Expert Human Oversight: Complex compliance decisions trigger expert human review to balance automation with accountability.\n    • Predictive Compliance Management: Utilize predictive analytics to proactively identify emerging compliance and ethical risks.",
      "B": "Maturity Level 3 - Automated and Continuous Compliance Assurance\nStream B (Measure & Improve):\n    • Real-Time Provenance Tracking: Real-time capture and automated management of comprehensive data and model provenance across all lifecycle stages, from initial sourcing through deployment.\n    • Advanced Provenance Analytics: Integrate analytics to proactively detect anomalies, unauthorized changes, or potential security risks within data and model workflows.\n    • Continuous Provenance Auditing: Automatically generate detailed audit trails, enabling immediate and transparent reporting for governance,compliance, and incident response."
    }
  },
  "secure_build": {
    "1": {
      "A": "Maturity Level 1 - Establish awareness with Governance and controls for foundation framework implementation.\nStream A (Create & Promote):\n    • Ad hoc Model Selection: Model sources selected without standard criteria.\n    • Lack of Inventory: Inventory is informal or outdated.\n    • Missing Provenance: Purpose and provenance of models are rarely documented.",
      "B": "Maturity Level 1 - Establish awareness with Governance and controls for foundation framework implementation.\nStream B (Measure & Improve):\n    • Unchecked Licensing: License terms and dependencies rarely verified.\n    • Vulnerability Gaps: Known vulnerabilities not consistently scanned.\n    • No Tooling: No formal toolchain for validation."
    },
    "2": {
      "A": "Maturity Level 2 - Defined Practices with security and governance practices are being documented and implemented.\nStream A (Create & Promote):\n    • Secure Guidelines: Secure development guidelines include AI-specific considerations.\n    • Basic Model Review: Model reviews include basic ethical and compliance checks.\n    • Inventory Control: Inventory management is standardized but not automated.",
      "B": "Maturity Level 2 - Defined Practices with security and governance practices are being documented and implemented.\nStream B (Measure & Improve):\n    • I/O Controls: Input/output sanitization in place.\n    • Versioning: Models and datasets version-controlled.\n    • Initial Validation: Basic output validation initiated."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously Manage Risk with proactive governance and supply chain-level awareness.\nStream A (Create & Promote):\n    • Formal Risk Reviews: Formal risk assessments conducted for third-party and internal models.\n    • Custody Controls: Custody of AI assets is tracked and managed. \n    • Supplier Assurance: Attestations and compliance documents are requested from providers.",
      "B": "Maturity Level 3 - Continuously Manage Risk with proactive governance and supply chain-level awareness.\nStream B (Measure & Improve):\n    • Adversarial Testing: Adversarial testing is routinely performed.\n    • CI/CD Integration: AI checks are integrated into CI/CD pipelines.\n    • Edge Case Validation: Behavior under edge cases is validated.\n\nSecure deployment"
    }
  },
  "secure_deployment": {
    "1": {
      "A": "Maturity Level 1 - Foundational Deployment Practices with focus on basic documentation and monitoring.\nStream A (Create & Promote):\n    • Environment Capture: Document deployment configurations and runtime environments.\n    • Dependency Logging: Record libraries, dependencies, and versions.\n    • Manual Tracking: Maintain basic records without automation.",
      "B": "Maturity Level 1 - Foundational Deployment Practices with focus on basic documentation and monitoring.\nStream B (Measure & Improve):\n    • Basic Monitoring: Track model performance over time.\n    • I/O Logging: Log inputs and outputs for traceability.\n    • Usage Metrics: Collect simple metrics (e.g., invocation count, latency)."
    },
    "2": {
      "A": "Maturity Level 2 - Structured Deployment Governance with deployment governed by formal processes and access protections.\nStream A (Create & Promote):\n    • Approval Workflows: Define clear steps for review and sign-off before deployment.\n    • Rollback Plans: Establish mechanisms to revert to a prior version safely.\n    • Audit Trails: Log and store deployment decisions for traceability.",
      "B": "Maturity Level 2 - Structured Deployment Governance with deployment governed by formal processes and access protections.\nStream B (Measure & Improve):\n    • Access Restrictions: Implement role-based access control for deployed models.\n    • Access Logging: Record and monitor access to model endpoints.\n    • Encryption: Secure model artifacts and sensitive data at rest."
    },
    "3": {
      "A": "Maturity Level 3 - Proactive and Compliant Operations with continuous compliance and resilience mechanisms integrated into operations.\nStream A (Create & Promote):\n    • Compliance Checks: Regularly assess for legal, regulatory, and policy alignment.\n    • Automation: Integrate compliance checks into CI/CD workflows.\n    • Audit Readiness: Maintain documentation for regulatory or internal audits.",
      "B": "Maturity Level 3 - Proactive and Compliant Operations with continuous compliance and resilience mechanisms integrated into operations.\nStream B (Measure & Improve):\n    • Resilience Design: Build fallbacks or safe shutdown options.\n    • Drift Detection: Monitor models for data or performance drift.\n    • Alerting Systems: Trigger real-time alerts for hallucinations or anomalies.\n\n\nDefect management"
    }
  },
  "defect_management": {
    "1": {
      "A": "Maturity Level 1 - Establish Foundational Quality Practices that enable consistent defect tracking, basic monitoring, and awareness of model reliability risks.\nStream A (Create & Promote):\n    • Defect Taxonomy Define and adopt a standard taxonomy for AI defects and failure modes.\n    • Basic Tracking Begin tracking model behavior issues and performance degradation.\n    • Initial Documentation Log known issues and defects manually for future reference.",
      "B": "Maturity Level 1 - Establish Foundational Quality Practices that enable consistent defect tracking, basic monitoring, and awareness of model reliability risks.\nStream B (Measure & Improve):\n    • User Feedback Monitoring Deploy basic systems to capture user-reported issues.\n    • Regression Testing Perform regression tests after model updates.\n    • Alerting for Failures Create simple alerting for obvious or repeated model errors."
    },
    "2": {
      "A": "Maturity Level  2 - Integrate AIDefect Prioritization and Testing into QA processes to optimize quality insights, fairness, and model reliability\nStream A (Create & Promote):\n    • Defect Prioritization Score defects based on impact and severity.\n    • Workflow Integration Embed defect tracking into QA and release processes.\n    • Defect Analytics Analyze trends and patterns across logged AI defects.",
      "B": "Maturity Level 2 - Integrate AIDefect Prioritization and Testing into QA processes to optimize quality insights, fairness, and model reliability.\nStream B (Measure & Improve):\n    • Advanced Testing Implement targeted tests for edge cases, fairness, and bias.\n    • Scheduled Reevaluation Routinely test model behavior in varied deployment contexts. \n    • Controlled Experiments Use A/B testing to validate model improvements."
    },
    "3": {
      "A": "Maturity Level 3 - Achieve Advanced AI Quality Assurance through automation, root cause analysis, and adaptive learning systems.\nStream A (Create & Promote):\n    • Root Cause Analysis Investigate failures at data, training, and architecture levels.\n    • Knowledge Sharing Document and share lessons learned in a knowledge base\n    • Cross-Functional Review Form teams across roles to analyze complex failures.",
      "B": "Maturity Level 3 - Achieve Advanced AI Quality Assurance through automation, root cause analysis, and adaptive learning systems.\nStream B (Measure & Improve):\n    • Automated Pipelines Deploy retraining and rollback pipelines for rapid response.\n    • Real-Time Monitoring Implement anomaly detection for live model performance.\n    • Closed-Loop Learning Enable self-correcting systems that learn from defect signals."
    }
  },
  "security_testing": {
    "1": {
      "A": "Maturity Level 1 - Identify the need for establishing a framework of basic security testing.\nStream A (Create & Promote):\n    • Ad hoc security tests with no systematic approach.\n    • Reactive security activities triggered mainly by incidents. \n    • Limited understanding of AI-specific threats.",
      "B": "Maturity Level 1 0 Identify the need for establishing a framework of basic security testing.\nStream B (Measure & Improve):\n    • No formal security metrics defined or tracked.\n    • Security insights derived primarily from incident response. \n    • Inconsistent or irregular reporting."
    },
    "2": {
      "A": "Maturity Level 2 - Define a proper framework with defined policies, processes and procedures.\nStream A (Create & Promote):\n    • Structured AI security testing approach established (adversarial tests, robustness evaluations).\n    • Defined responsibilities for conducting regular AI security assessments.\n    • AI security activities integrated into broader security testing efforts.",
      "B": "Maturity Level 2 - Define a proper framework with defined policies, processes and procedures.\nStream B (Measure & Improve):\n    • Defined security metrics (incident frequency, robustness indicators, resilience scores).\n    • Regularly collected and reported security metrics for stakeholder visibility.\n    • Metrics guide security improvements and resource allocation."
    },
    "3": {
      "A": "Maturity Level 3 - Continuously Optimize the processes with monitoring and metrics reporting.\nStream A (Create & Promote):\n    • Comprehensive security testing integrated throughout the AI lifecycle.\n    • Advanced threat simulations (continuous adversarial testing, proactive poisoning resistanc   evaluation).\n    • Dedicated AI security team actively adapting to emerging threats.",
      "B": "Maturity Level 3 - Continuously Optimize the processes with monitoring and metrics reporting.\nStream B (Measure & Improve):\n    • Real-time monitoring and advanced analytics detecting AI-specific security threats.\n    • Predictive metrics forecasting vulnerabilities and proactively addressing them.\n    • Robust, continuous feedback loop driving strategic security enhancements and resource decisions."
    }
  },
  "requirement_based_testing": {
    "1": {
      "A": "Maturity Level 1 - Foundational Testing Practices Emerging with siloed practices.\nStream A (Create & Promote):\n    • Testing is informal or inconsistently linked to requirements.\n    • Requirement traceability is limited or non-existent.\n    • Testing often reactive rather than planned.",
      "B": "Maturity Level 1 - Foundational Testing Practices Emerging with siloed practices.\nStream B (Measure & Improve):\n    • Minimal or no metrics related to requirement testing.\n    • Testing results documented irregularly.\n    • Limited stakeholder visibility into testing outcomes."
    },
    "2": {
      "A": "Maturity Level 2 - Define a documented process with documented guidelines.\nStream A (Create & Promote):\n    • Formal testing process established with clear links to defined requirements.\n    • Responsibility for requirement-based testing clearly assigned.\n    • Regular execution of testing aligned with the AI lifecycle.",
      "B": "Maturity Level 2 - Define a documented process with documented guidelines.\nStream B (Measure & Improve):\n    • Defined metrics (coverage, requirement compliance rates, defect rates).\n    • Regular reporting of metrics to stakeholders.\n    • Metrics inform decisions and drive continuous improvement."
    },
    "3": {
      "A": "Maturity Level 3 - Coninously improvement focused approach with monitoring and metric reporting.\nStream A (Create & Promote):\n    • Requirement-based testing fully integrated into continuous development and deployment processes.\n    • Automated and continuous verification against requirements.\n    • Active use of feedback to refine testing and requirement definitions.",
      "B": "Maturity Level 3 - Coninously improvement focused approach with monitoring and metric reporting.\nStream B (Measure & Improve):\n    • Advanced analytics to continuously track and analyze requirement compliance.\n    • Predictive metrics anticipate issues proactively.\n    • Strong culture of accountability and continuous enhancement driven by detailed, actionable metrics insights.\n\n\nArchitecture assessment"
    }
  },
  "architecture_assessment": {
    "1": {
      "A": "Maturity Level 1 - Initial Steps Toward AI Architecture Governance with basic processes and practices in place.\nStream A (Create & Promote):\n    • Architecture reviews informal or ad hoc.\n    • Limited awareness of AI-specific architecture standards.\n    • Reactive to architecture-related incidents rather than proactive assessments.",
      "B": "Maturity Level 1 - Initial Steps Toward AI Architecture Governance with basic processes and practices in place.\nStream B (Measure & Improve):\n    • Few or no metrics related to architectural quality or security.\n    • Irregular documentation of assessment outcomes.\n    • Limited stakeholder engagement or reporting."
    },
    "2": {
      "A": "Maturity Level 2 - Structured and Integrated AI Architecture Governance with defined processes and guidelines.\nStream A (Create & Promote):\n    • Defined architecture review process integrated into AI projects.\n    • Clearly assigned responsibilities for architecture assessments.\n    • Regular architecture evaluations aligned with lifecycle milestones.",
      "B": "Maturity Level 2 - Structured and Integrated AI Architecture Governance with defined processes and guidelines.\nStream B (Measure & Improve):\n    • Established metrics (compliance with architectural guidelines, identified vulnerabilities, remediation rates).\n    • Routine reporting to stakeholders.\n    • Metrics actively guide architecture improvements."
    },
    "3": {
      "A": "Maturity Level 3 - Continuous and Adaptive AI Architecture Excellence with monitoring and metrics reporting .\nStream A (Create & Promote):\n    • Comprehensive and continuous architecture assessment embedded in the AI lifecycle.\n    • Proactive identification and remediation of architectural vulnerabilities.\n    • Active adaptation to emerging AI architectural best practices and guidelines.",
      "B": "Maturity Level 3 - Continuous and Adaptive AI Architecture Excellence with monitoring and metrics reporting .\nStream B (Measure & Improve):\n    • Advanced metrics and analytics for real-time architectural monitoring.\n    • Predictive analytics proactively identifying potential architectural weaknesses.\n    • Strong organizational commitment to continuous architectural refinement driven by actionable metrics insights."
    }
  },
  "incident_management": {
    "1": {
      "A": "Maturity Level 1 - Establish Initial AI Incident Detection and Basic Response Capabilities.\nStream A (Create & Promote):\n    • Reactive Detection Basic incident detection with reactive responses.\n    • Ad Hoc Containment Limited formal processes for incident containment. \n    • Minimal Analysis Initial triage without deep forensic investigation.",
      "B": "Establish Initial AI Incident Detection and Basic Response Capabilities.\nStream B (Measure & Improve):\n    • Informal Reporting- Incident reporting is informal with minimal stakeholder communication.\n    • Limited Communication - Stakeholder engagement is minimal or ad-hoc.\n    • Sparse Post-Incident Review- Post-incident reviews are limited or informal."
    },
    "2": {
      "A": "Maturity Level 2 - Manage and Standardize AI Incident Handling and Post-Incident Evaluation.\n\n\nStream A (Create & Promote):\n    • Standardized Protocols - Established protocols for detection, containment, and initial analysis.\n    • Defined Roles Clear roles and responsibilities in incident response teams. \n    • Consistent Workflows Repeatable incident handling processes.",
      "B": "Maturity Level 2 - Manage and Standardize AI Incident Handling and Post-Incident Evaluation.\nStream B (Measure & Improve):\n    • Structured Communication Formal communication protocols with key stakeholders.\n    • Regular Reviews Scheduled post-incident reviews with documented outcomes.\n    • Tracked Improvements Outcomes and lessons learned are documented and tracked."
    },
    "3": {
      "A": "Maturity Level 3 - Advance to Real-Time Detection and Continuous Learning from AI Incidents.\nStream A (Create & Promote):\n    • Automated Detection Automated detection systems leveraging real-time analytics. \n    • Integrated Forensics Comprehensive forensic analysis integrated into workflows. \n    • Adaptive Response Incident response evolves based on root cause and threat intelligence.",
      "B": "Maturity Level 3 - Advance to Real-Time Detection and Continuous Learning from AI Incidents.\nStream B (Measure & Improve):\n    • Proactive Notifications - Automated and timely notifications to stakeholders. \n    • Detailed Reporting Full incident reports including impact and response evaluations. \n    • Continuous Improvement Systematic improvements driven by incident data and emerging threats.\n\n\nEvent management"
    }
  },
  "event_management": {
    "1": {
      "A": "Maturity Level 1 - Establish Basic Monitoring and Ad Hoc Response Capabilities to detect issues manually and react without formal processes.\nStream A (Create & Promote):\n    • Manual Detection Events are identified manually, often after impact is observed. \n    • No Anomaly Detection No structured methods for identifying drift, outliers, or degradation.\n    • Reactive Approach Monitoring is not proactive or automated.",
      "B": "Maturity Level 1 - Establish Basic Monitoring and Ad Hoc Response Capabilities to detect issues manually and react without formal processes.\nStream B (Measure & Improve):\n    • Ad Hoc Management Incidents are handled reactively without structured processes.\n    • No Documentation Incidents are rarely logged or reviewed systematically.\n    • Lack of Learning No mechanisms in place for organizational learning from incidents."
    },
    "2": {
      "A": "Maturity Level 2 - Develop Structured Monitoring and Initial Learning Mechanisms to trackkey metrics, detect anomalies, and analyze incidents.\nStream A (Create & Promote):\n    • Basic Monitoring Latency, availability, and accuracy metrics are tracked. \n    • Initial Anomaly Detection Basic drift and outlier detection introduced.\n    • Alerting Setup Manual or threshold-based alerting in place.",
      "B": "Maturity Level 2 - Develop Structured Monitoring and Initial Learning Mechanisms to trackkey metrics, detect anomalies, and analyze incidents.\nStream B (Measure & Improve):\n    • Incident Logging Incidents are logged and tracked manually.\n    • Occasional RCA Root cause analysis is performed inconsistently.\n    • Partial Documentation Some lessons learned are captured but not systematized."
    },
    "3": {
      "A": "Maturity Level 3 - Achieve Proactive, Intelligent Monitoring and Continuous Learning by automating detection and integrating improvements from incident insights.\nStream A (Create & Promote):\n    • Real-Time Monitoring Continuous monitoring with dashboards and alerting tools. \n    • ML-Driven Detection Advanced analytics and machine learning detect anomalies and drift proactively.\n    • Proactive Alerts Intelligent alerting reduces false positives and accelerates response.",
      "B": "Maturity Level 3 - Achieve Proactive, Intelligent Monitoring and Continuous Learning by automating detection and integrating improvements from incident insights.\nStream B (Measure & Improve):\n    • Comprehensive Workflows - Formal incident response workflows across teams. \n    • Systematic RCA Structured root cause analysis feeds into quality improvements. \n    • Continuous Learning Loop Learnings are documented, shared, and integrated into system design.\n\nOperational management"
    }
  },
  "operational_management": {
    "1": {
      "A": "Maturity Level 1 - Early-stage capabilities with initial monitoring, basic controls, and emerging awareness.\nStream A (Create & Promote):\n    • Manual Monitoring Monitoring is ad hoc or manual, lacking structured visibility into system health.\n    • Reactive Maintenance Maintenance occurs only after failures or disruptions. \n    • Limited Coverage No proactive checks or resource planning in place.",
      "B": "Maturity Level 1 - Early-stage capabilities with initial monitoring, basic controls, and emerging awareness.\nStream B (Measure & Improve):\n    • Basic Compliance Awareness Security and compliance concepts are understood but not formalized. \n    • Ad Hoc Checks Security reviews are sporadic and undocumented.\n    • Minimal Documentation Few written procedures or audit trails exist."
    },
    "2": {
      "A": "Maturity Level 2 - Developing structured processes and growing automation foster improved reliability and accountability.\nStream A (Create & Promote):\n    • Scheduled Monitoring Regular system health checks and performance metrics are collected. \n    • Preventive Maintenance Maintenance activities are performed on a routine schedule. \n    • Improved Stability Operational disruptions are reduced due to consistent upkeep.",
      "B": "Maturity Level 2 - Developing structured processes and growing automation foster improved reliability and accountability.\nStream B (Measure & Improve):\n    • Standardized Security Practices Security controls are documented and partially automated.\n    • Regular Audits Periodic audits and compliance checks are initiated.\n    • Policy Alignment Processes begin aligning with regulatory and organizational requirements."
    },
    "3": {
      "A": "Maturity Level 3 - Mature advanced systems driving resilience, compliance, and continuous performance improvement.\nStream A (Create & Promote):\n    • Automated Monitoring Real-time, automated alerts with predictive performance and failure analysis.\n    • Continuous Optimization Systems are tuned continuously for uptime and efficiency. \n    • Proactive Resource Management Resource scaling and tuning are managed through automated tools.",
      "B": "Maturity Level 3 - Mature advanced systems driving resilience, compliance, and continuous performance improvement.\nStream B (Measure & Improve):\n    • Automated Compliance Enforcement Continuous compliance monitoring is fully automated. \n    • Integrated Security Audits Routine, detailed security audits with full traceability.\n    • Proactive Threat Mitigation - Threat detection and response are integrated into daily operations."
    }
  }
};

/**
 * Escape a string for safe inclusion in a PostgreSQL SQL literal.
 * Uses dollar-quoting to avoid issues with single quotes and special characters.
 */
function pgEscape(str) {
  const tag = "$guidance$";
  return `${tag}${str}${tag}`;
}

exports.up = async (pgm) => {
  let updateCount = 0;

  for (const [practiceId, levels] of Object.entries(GUIDANCE_DATA)) {
    for (const [level, streams] of Object.entries(levels)) {
      for (const [stream, description] of Object.entries(streams)) {
        const escapedDesc = pgEscape(description);
        pgm.sql(
          `UPDATE aima_questions
           SET description = ${escapedDesc}
           WHERE practice_id = '${practiceId}'
             AND level = '${level}'
             AND stream = '${stream}'
             AND question_index = 0`
        );
        updateCount++;
      }
    }
  }

  console.log(
    `✅ Populated supplemental guidance for ${updateCount} AIMA questions`
  );
};

exports.down = async (pgm) => {
  pgm.sql(`UPDATE aima_questions SET description = NULL`);
  console.log("✅ Cleared all AIMA supplemental guidance descriptions");
};
