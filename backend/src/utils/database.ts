import pool from "../config/database";
import fs from "fs";
import path from "path";

export const initializeDatabase = async () => {
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, "../schema/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schema);
    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

export const seedAIMAData = async () => {
  try {
    // Check if domains already exist
    const domainCheck = await pool.query("SELECT COUNT(*) FROM aima_domains");
    const domainCount = parseInt(domainCheck.rows[0].count);

    // Only insert domains and practices if they don't exist
    if (domainCount === 0) {
      // Insert all AIMA domains
      const domains = [
        {
          id: "governance",
          title: "Governance",
          description: "AI governance and organizational oversight",
        },
        {
          id: "responsible_ai",
          title: "Responsible AI",
          description: "Ethical AI development and deployment",
        },
        {
          id: "data_management",
          title: "Data Management",
          description: "Data governance and quality for AI systems",
        },
        {
          id: "privacy",
          title: "Privacy",
          description: "Privacy protection in AI systems",
        },
        {
          id: "design",
          title: "Design",
          description: "Secure AI system design principles",
        },
        {
          id: "implementation",
          title: "Implementation",
          description: "Secure AI system implementation",
        },
        {
          id: "verification",
          title: "Verification",
          description: "AI system testing and validation",
        },
        {
          id: "operations",
          title: "Operations",
          description: "AI system operations and monitoring",
        },
      ];

      for (const domain of domains) {
        await pool.query(
          `
        INSERT INTO aima_domains (id, title, description) 
        VALUES ($1, $2, $3)
      `,
          [domain.id, domain.title, domain.description],
        );
      }

      // Insert all practices
      const practices = [
        // Governance
        {
          id: "strategy_and_metrics",
          domain_id: "governance",
          title: "Strategy & Metrics",
          description:
            "Align AI initiatives with business strategy and measure effectiveness.",
        },
        {
          id: "policy_compliance",
          domain_id: "governance",
          title: "Policy & Compliance",
          description:
            "Establish clear policies and ensure compliance for AI initiatives.",
        },
        {
          id: "education_awareness",
          domain_id: "governance",
          title: "Education & Awareness",
          description:
            "Promote education and awareness about responsible AI practices.",
        },

        // Responsible AI
        {
          id: "ethical_impact",
          domain_id: "responsible_ai",
          title: "Ethical & Societal Impact",
          description:
            "Assessing the ethical implications and societal impact of AI systems.",
        },
        {
          id: "transparency",
          domain_id: "responsible_ai",
          title: "Transparency & Explainability",
          description:
            "Ensuring AI systems are transparent and their decisions can be explained.",
        },
        {
          id: "fairness_bias",
          domain_id: "responsible_ai",
          title: "Fairness & Bias",
          description:
            "Identifying and mitigating bias to ensure fair outcomes.",
        },

        // Data Management
        {
          id: "quality_integrity",
          domain_id: "data_management",
          title: "Data Quality & Integrity",
          description:
            "Ensuring data used for training and operating AI is accurate, complete, and reliable.",
        },
        {
          id: "data_governance_accountability",
          domain_id: "data_management",
          title: "Data Governance & Accountability",
          description:
            "Establishing governance and accountability for data management.",
        },
        {
          id: "data_training",
          domain_id: "data_management",
          title: "Data Training",
          description: "Managing data used for training AI models.",
        },

        // Privacy
        {
          id: "minimization_limitation",
          domain_id: "privacy",
          title: "Data Minimization & Purpose Limitation",
          description:
            "Minimizing data collection and limiting its use to specified purposes.",
        },
        {
          id: "privacy_by_design",
          domain_id: "privacy",
          title: "Privacy by Design & Default",
          description:
            "Integrating privacy principles into the design of AI systems from the outset.",
        },
        {
          id: "user_control_transparency",
          domain_id: "privacy",
          title: "User Control & Transparency",
          description:
            "Providing users with control over their data and transparency into its use.",
        },

        // Design
        {
          id: "threat_assessment",
          domain_id: "design",
          title: "Threat Assessment",
          description:
            "Assessing potential threats and vulnerabilities in AI systems.",
        },
        {
          id: "security_architecture",
          domain_id: "design",
          title: "Security Architecture",
          description: "Designing a secure architecture for AI systems.",
        },
        {
          id: "security_requirements",
          domain_id: "design",
          title: "Security Requirements",
          description: "Defining clear security requirements for AI systems.",
        },

        // Implementation
        {
          id: "secure_build",
          domain_id: "implementation",
          title: "Secure Build",
          description: "Following secure build practices for AI components.",
        },
        {
          id: "secure_deployment",
          domain_id: "implementation",
          title: "Secure Deployment",
          description:
            "Using controlled and monitored processes for deploying AI systems securely.",
        },
        {
          id: "defect_management",
          domain_id: "implementation",
          title: "Defect Management",
          description: "Managing and remediating defects in AI systems.",
        },

        // Verification
        {
          id: "security_testing",
          domain_id: "verification",
          title: "Security Testing",
          description: "Rigorously testing the security of AI systems.",
        },
        {
          id: "requirement_testing",
          domain_id: "verification",
          title: "Requirement-based Testing",
          description: "Testing AI systems against specified requirements.",
        },
        {
          id: "architecture_assessment",
          domain_id: "verification",
          title: "Architecture Assessment",
          description:
            "Assessing the security and integrity of the AI system architecture.",
        },

        // Operations
        {
          id: "incident_management",
          domain_id: "operations",
          title: "Incident Management",
          description: "Managing and responding to security incidents.",
        },
        {
          id: "event_management",
          domain_id: "operations",
          title: "Event Management",
          description: "Monitoring and managing events in AI systems.",
        },
        {
          id: "operational_management",
          domain_id: "operations",
          title: "Operational Management",
          description:
            "Ongoing operational management of AI systems in production.",
        },
      ];

      for (const practice of practices) {
        await pool.query(
          `
        INSERT INTO aima_practices (id, domain_id, title, description) 
        VALUES ($1, $2, $3, $4)
      `,
          [
            practice.id,
            practice.domain_id,
            practice.title,
            practice.description,
          ],
        );
      }
    }

    // Always insert questions (will skip duplicates due to ON CONFLICT DO NOTHING)
    console.log("📊 Adding/updating questions...");

    // Insert comprehensive questions for each practice
    const allQuestions = [
      // Strategy & Metrics
      {
        practice_id: "strategy_and_metrics",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there an initial AI strategy documented, even informally?",
      },
      {
        practice_id: "strategy_and_metrics",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are there any metrics informally tracked related to AI initiatives?",
      },
      {
        practice_id: "strategy_and_metrics",
        level: "2",
        stream: "A",
        index: 0,
        text: "Has the AI strategy been formally defined and communicated to stakeholders?",
      },
      {
        practice_id: "strategy_and_metrics",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are defined metrics regularly reviewed and communicated within the organization?",
      },
      {
        practice_id: "strategy_and_metrics",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is the AI strategy integrated into the organization's broader business strategy and iteratively refined?",
      },
      {
        practice_id: "strategy_and_metrics",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are metrics systematically analyzed to drive improvements and decision-making processes?",
      },

      // Policy & Compliance
      {
        practice_id: "policy_compliance",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there an awareness or initial informal policy for AI usage within the organization?",
      },
      {
        practice_id: "policy_compliance",
        level: "1",
        stream: "B",
        index: 0,
        text: "Is there basic awareness of compliance needs relevant to AI (e.g., GDPR, ethical guidelines)?",
      },
      {
        practice_id: "policy_compliance",
        level: "2",
        stream: "A",
        index: 0,
        text: "Has a formal AI policy been established and clearly communicated to all relevant stakeholders?",
      },
      {
        practice_id: "policy_compliance",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are compliance requirements identified, documented, and regularly reviewed to ensure alignment with AI-specific regulations?",
      },
      {
        practice_id: "policy_compliance",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is the AI policy consistently enforced and reviewed regularly for relevance, accuracy, and alignment with organizational goals and external standards?",
      },
      {
        practice_id: "policy_compliance",
        level: "3",
        stream: "B",
        index: 0,
        text: "Is compliance management systematically integrated into daily operations, with proactive management of compliance risks and regular audits?",
      },

      // Education & Awareness
      {
        practice_id: "education_awareness",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there initial informal training or general awareness about AI security risks within the organization?",
      },
      {
        practice_id: "education_awareness",
        level: "1",
        stream: "B",
        index: 0,
        text: "Is communication about AI security risks sporadic or ad hoc?",
      },
      {
        practice_id: "education_awareness",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal training programs on AI security established, targeting key stakeholders and teams?",
      },
      {
        practice_id: "education_awareness",
        level: "2",
        stream: "B",
        index: 0,
        text: "Is there regular communication about AI security best practices and updates across the organization?",
      },
      {
        practice_id: "education_awareness",
        level: "3",
        stream: "A",
        index: 0,
        text: "Are AI security training programs regularly updated, mandatory, and effectively tailored for different roles and responsibilities?",
      },
      {
        practice_id: "education_awareness",
        level: "3",
        stream: "B",
        index: 0,
        text: "Is there an established culture of proactive communication, continuous awareness, and engagement around AI security throughout the organization?",
      },

      // Ethical Impact
      {
        practice_id: "ethical_impact",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of the potential ethical and societal impacts of AI systems?",
      },
      {
        practice_id: "ethical_impact",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are ethical considerations occasionally discussed in an informal manner?",
      },
      {
        practice_id: "ethical_impact",
        level: "2",
        stream: "A",
        index: 0,
        text: "Have formal processes been established to assess AI's ethical and societal impacts?",
      },
      {
        practice_id: "ethical_impact",
        level: "2",
        stream: "B",
        index: 0,
        text: "Is there an established framework guiding ethical decision-making for AI systems?",
      },
      {
        practice_id: "ethical_impact",
        level: "3",
        stream: "A",
        index: 0,
        text: "Are impact assessments systematically integrated into all AI projects, continuously reviewed, and updated?",
      },
      {
        practice_id: "ethical_impact",
        level: "3",
        stream: "B",
        index: 0,
        text: "Is ethical decision-making fully embedded in organizational processes, consistently guiding AI development and deployment?",
      },

      // Transparency
      {
        practice_id: "transparency",
        level: "1",
        stream: "A",
        index: 0,
        text: "Are there informal efforts to explain AI outputs or decisions when requested?",
      },
      {
        practice_id: "transparency",
        level: "1",
        stream: "B",
        index: 0,
        text: "Is communication about AI systems' workings sporadic or reactive?",
      },
      {
        practice_id: "transparency",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal explainability mechanisms in place for critical AI models or systems?",
      },
      {
        practice_id: "transparency",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are transparency and explanations regularly documented and shared internally?",
      },
      {
        practice_id: "transparency",
        level: "3",
        stream: "A",
        index: 0,
        text: "Are advanced, comprehensive explainability techniques consistently applied across all AI systems?",
      },
      {
        practice_id: "transparency",
        level: "3",
        stream: "B",
        index: 0,
        text: "Is there proactive external reporting and open communication regarding AI transparency?",
      },

      // Fairness & Bias
      {
        practice_id: "fairness_bias",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there initial awareness and informal identification of potential biases in AI systems?",
      },
      {
        practice_id: "fairness_bias",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are any informal or ad hoc bias mitigation steps currently in place?",
      },
      {
        practice_id: "fairness_bias",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are systematic procedures established to regularly identify and assess biases in AI models?",
      },
      {
        practice_id: "fairness_bias",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are defined mitigation strategies implemented and periodically reviewed?",
      },
      {
        practice_id: "fairness_bias",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is bias assessment integrated systematically across all AI lifecycle stages and audited regularly?",
      },
      {
        practice_id: "fairness_bias",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are proactive mitigation practices continuously monitored and refined across AI deployments?",
      },

      // Data Management Questions
      {
        practice_id: "quality_integrity",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of data quality issues in AI systems?",
      },
      {
        practice_id: "quality_integrity",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are data quality checks performed sporadically or reactively?",
      },
      {
        practice_id: "quality_integrity",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal data quality standards established and documented?",
      },
      {
        practice_id: "quality_integrity",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are data quality checks systematically implemented across AI projects?",
      },
      {
        practice_id: "quality_integrity",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is data quality management fully integrated into organizational processes with continuous monitoring?",
      },
      {
        practice_id: "quality_integrity",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced data quality techniques and automated validation consistently applied?",
      },

      {
        practice_id: "data_governance_accountability",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of data governance needs for AI systems?",
      },
      {
        practice_id: "data_governance_accountability",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are data governance responsibilities assigned informally or ad hoc?",
      },
      {
        practice_id: "data_governance_accountability",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal data governance policies established and communicated?",
      },
      {
        practice_id: "data_governance_accountability",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are data governance roles and responsibilities clearly defined and documented?",
      },
      {
        practice_id: "data_governance_accountability",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is data governance systematically integrated with regular audits and continuous improvement?",
      },
      {
        practice_id: "data_governance_accountability",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are data governance practices continuously monitored and refined across all AI initiatives?",
      },

      {
        practice_id: "data_training",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of data training requirements for AI models?",
      },
      {
        practice_id: "data_training",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are data training processes managed informally or reactively?",
      },
      {
        practice_id: "data_training",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal data training protocols established and documented?",
      },
      {
        practice_id: "data_training",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are data training processes systematically implemented across AI projects?",
      },
      {
        practice_id: "data_training",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is data training management fully integrated with continuous monitoring and optimization?",
      },
      {
        practice_id: "data_training",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced data training techniques and automated processes consistently applied?",
      },

      // Design Questions
      {
        practice_id: "threat_assessment",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of potential threats to AI systems?",
      },
      {
        practice_id: "threat_assessment",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are threat assessments performed sporadically or reactively?",
      },
      {
        practice_id: "threat_assessment",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal threat assessment processes established and documented?",
      },
      {
        practice_id: "threat_assessment",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are threat assessments systematically conducted for AI projects?",
      },
      {
        practice_id: "threat_assessment",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is threat assessment fully integrated into the AI development lifecycle with continuous monitoring?",
      },
      {
        practice_id: "threat_assessment",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced threat assessment techniques and automated processes consistently applied?",
      },

      {
        practice_id: "security_architecture",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of security architecture needs for AI systems?",
      },
      {
        practice_id: "security_architecture",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are security architecture decisions made informally or ad hoc?",
      },
      {
        practice_id: "security_architecture",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal security architecture standards established and documented?",
      },
      {
        practice_id: "security_architecture",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are security architecture reviews systematically conducted for AI projects?",
      },
      {
        practice_id: "security_architecture",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is security architecture fully integrated into AI development with continuous monitoring and updates?",
      },
      {
        practice_id: "security_architecture",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced security architecture patterns and automated validation consistently applied?",
      },

      {
        practice_id: "security_requirements",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of security requirements for AI systems?",
      },
      {
        practice_id: "security_requirements",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are security requirements defined informally or reactively?",
      },
      {
        practice_id: "security_requirements",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal security requirements processes established and documented?",
      },
      {
        practice_id: "security_requirements",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are security requirements systematically defined and validated for AI projects?",
      },
      {
        practice_id: "security_requirements",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is security requirements management fully integrated with continuous monitoring and refinement?",
      },
      {
        practice_id: "security_requirements",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced security requirements techniques and automated validation consistently applied?",
      },

      // Implementation Questions
      {
        practice_id: "secure_build",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of secure build practices for AI systems?",
      },
      {
        practice_id: "secure_build",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are secure build practices implemented sporadically or reactively?",
      },
      {
        practice_id: "secure_build",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal secure build processes established and documented?",
      },
      {
        practice_id: "secure_build",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are secure build practices systematically implemented across AI projects?",
      },
      {
        practice_id: "secure_build",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is secure build fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "secure_build",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced secure build techniques and automated processes consistently applied?",
      },

      {
        practice_id: "secure_deployment",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of secure deployment practices for AI systems?",
      },
      {
        practice_id: "secure_deployment",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are secure deployment practices implemented informally or reactively?",
      },
      {
        practice_id: "secure_deployment",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal secure deployment processes established and documented?",
      },
      {
        practice_id: "secure_deployment",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are secure deployment practices systematically implemented across AI projects?",
      },
      {
        practice_id: "secure_deployment",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is secure deployment fully integrated into AI operations with continuous monitoring and automation?",
      },
      {
        practice_id: "secure_deployment",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced secure deployment techniques and automated processes consistently applied?",
      },

      {
        practice_id: "defect_management",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of defect management needs for AI systems?",
      },
      {
        practice_id: "defect_management",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are defects managed informally or reactively?",
      },
      {
        practice_id: "defect_management",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal defect management processes established and documented?",
      },
      {
        practice_id: "defect_management",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are defect management practices systematically implemented across AI projects?",
      },
      {
        practice_id: "defect_management",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is defect management fully integrated into AI operations with continuous monitoring and automation?",
      },
      {
        practice_id: "defect_management",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced defect management techniques and automated processes consistently applied?",
      },

      // Verification Questions
      {
        practice_id: "security_testing",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of security testing needs for AI systems?",
      },
      {
        practice_id: "security_testing",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are security tests performed sporadically or reactively?",
      },
      {
        practice_id: "security_testing",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal security testing processes established and documented?",
      },
      {
        practice_id: "security_testing",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are security testing practices systematically implemented across AI projects?",
      },
      {
        practice_id: "security_testing",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is security testing fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "security_testing",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced security testing techniques and automated processes consistently applied?",
      },

      {
        practice_id: "requirement_testing",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of requirement testing needs for AI systems?",
      },
      {
        practice_id: "requirement_testing",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are requirement tests performed sporadically or reactively?",
      },
      {
        practice_id: "requirement_testing",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal requirement testing processes established and documented?",
      },
      {
        practice_id: "requirement_testing",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are requirement testing practices systematically implemented across AI projects?",
      },
      {
        practice_id: "requirement_testing",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is requirement testing fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "requirement_testing",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced requirement testing techniques and automated processes consistently applied?",
      },

      {
        practice_id: "architecture_assessment",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of architecture assessment needs for AI systems?",
      },
      {
        practice_id: "architecture_assessment",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are architecture assessments performed sporadically or reactively?",
      },
      {
        practice_id: "architecture_assessment",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal architecture assessment processes established and documented?",
      },
      {
        practice_id: "architecture_assessment",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are architecture assessment practices systematically implemented across AI projects?",
      },
      {
        practice_id: "architecture_assessment",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is architecture assessment fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "architecture_assessment",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced architecture assessment techniques and automated processes consistently applied?",
      },

      // Operations Questions
      {
        practice_id: "incident_management",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of incident management needs for AI systems?",
      },
      {
        practice_id: "incident_management",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are incidents managed informally or reactively?",
      },
      {
        practice_id: "incident_management",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal incident management processes established and documented?",
      },
      {
        practice_id: "incident_management",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are incident management practices systematically implemented across AI operations?",
      },
      {
        practice_id: "incident_management",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is incident management fully integrated into AI operations with continuous monitoring and automation?",
      },
      {
        practice_id: "incident_management",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced incident management techniques and automated processes consistently applied?",
      },

      {
        practice_id: "event_management",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of event management needs for AI systems?",
      },
      {
        practice_id: "event_management",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are events managed informally or reactively?",
      },
      {
        practice_id: "event_management",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal event management processes established and documented?",
      },
      {
        practice_id: "event_management",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are event management practices systematically implemented across AI operations?",
      },
      {
        practice_id: "event_management",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is event management fully integrated into AI operations with continuous monitoring and automation?",
      },
      {
        practice_id: "event_management",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced event management techniques and automated processes consistently applied?",
      },

      {
        practice_id: "operational_management",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of operational management needs for AI systems?",
      },
      {
        practice_id: "operational_management",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are operations managed informally or reactively?",
      },
      {
        practice_id: "operational_management",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal operational management processes established and documented?",
      },
      {
        practice_id: "operational_management",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are operational management practices systematically implemented across AI operations?",
      },
      {
        practice_id: "operational_management",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is operational management fully integrated into AI operations with continuous monitoring and automation?",
      },
      {
        practice_id: "operational_management",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced operational management techniques and automated processes consistently applied?",
      },

      // Privacy Questions
      {
        practice_id: "minimization_limitation",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of data minimization principles for AI systems?",
      },
      {
        practice_id: "minimization_limitation",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are data minimization practices implemented informally or reactively?",
      },
      {
        practice_id: "minimization_limitation",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal data minimization processes established and documented?",
      },
      {
        practice_id: "minimization_limitation",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are data minimization practices systematically implemented across AI projects?",
      },
      {
        practice_id: "minimization_limitation",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is data minimization fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "minimization_limitation",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced data minimization techniques and automated processes consistently applied?",
      },

      {
        practice_id: "privacy_by_design",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of privacy by design principles for AI systems?",
      },
      {
        practice_id: "privacy_by_design",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are privacy by design practices implemented informally or reactively?",
      },
      {
        practice_id: "privacy_by_design",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal privacy by design processes established and documented?",
      },
      {
        practice_id: "privacy_by_design",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are privacy by design practices systematically implemented across AI projects?",
      },
      {
        practice_id: "privacy_by_design",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is privacy by design fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "privacy_by_design",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced privacy by design techniques and automated processes consistently applied?",
      },

      {
        practice_id: "user_control_transparency",
        level: "1",
        stream: "A",
        index: 0,
        text: "Is there informal awareness of user control and transparency needs for AI systems?",
      },
      {
        practice_id: "user_control_transparency",
        level: "1",
        stream: "B",
        index: 0,
        text: "Are user control and transparency features implemented informally or reactively?",
      },
      {
        practice_id: "user_control_transparency",
        level: "2",
        stream: "A",
        index: 0,
        text: "Are formal user control and transparency processes established and documented?",
      },
      {
        practice_id: "user_control_transparency",
        level: "2",
        stream: "B",
        index: 0,
        text: "Are user control and transparency practices systematically implemented across AI projects?",
      },
      {
        practice_id: "user_control_transparency",
        level: "3",
        stream: "A",
        index: 0,
        text: "Is user control and transparency fully integrated into AI development with continuous monitoring and automation?",
      },
      {
        practice_id: "user_control_transparency",
        level: "3",
        stream: "B",
        index: 0,
        text: "Are advanced user control and transparency techniques and automated processes consistently applied?",
      },
    ];

    for (const question of allQuestions) {
      await pool.query(
        `
        INSERT INTO aima_questions (practice_id, level, stream, question_index, question_text) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (practice_id, level, stream, question_index) DO NOTHING
      `,
        [
          question.practice_id,
          question.level,
          question.stream,
          question.index,
          question.text,
        ],
      );
    }

    console.log("✅ AIMA data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding AIMA data:", error);
    throw error;
  }
};
