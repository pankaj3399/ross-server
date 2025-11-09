const generateQuestionsForSubdomain = (subdomainTitle, questionsList = []) => {
  const streams = ['A', 'B'];
  const levels = [1, 2, 3];
  const questions = [];
  let questionIdCounter = 1;

  levels.forEach(level => {
    streams.forEach(stream => {
      const questionIndex = (level - 1) * 2 + (stream === 'A' ? 0 : 1);
      const questionText = questionsList[questionIndex] || "This is a placeholder for the actual question text. Please rate your organization's maturity for this specific criterion.";
      
      questions.push({
        id: `${subdomainTitle.toLowerCase().replace(/[\s&]/g, '_')}_q${questionIdCounter++}`,
        title: `Stream ${stream} – Maturity Level ${level}`,
        question: questionText,
        type: "multiple_choice",
        maturityLevel: level,
        stream: stream,
        options: [
          { value: 0, label: "No" },
          { value: 0.5, label: "Partially" },
          { value: 1, label: "Yes" }
        ]
      });
    });
  });

  return questions;
};

const ethicalImpactQuestions = [
  "Is there informal awareness of the potential ethical and societal impacts of AI systems?",
  "Are ethical considerations occasionally discussed in an informal manner?",
  "Have formal processes been established to assess AI's ethical and societal impacts?",
  "Is there an established framework guiding ethical decision-making for AI systems?",
  "Are impact assessments systematically integrated into all AI projects, continuously reviewed, and updated?",
  "Is ethical decision-making fully embedded in organizational processes, consistently guiding AI development and deployment?"
];

const transparencyQuestions = [
  "Are there informal efforts to explain AI outputs or decisions when requested?",
  "Is communication about AI systems' workings sporadic or reactive?",
  "Are formal explainability mechanisms in place for critical AI models or systems?",
  "Are transparency and explanations regularly documented and shared internally?",
  "Are advanced, comprehensive explainability techniques consistently applied across all AI systems?",
  "Is there proactive external reporting and open communication regarding AI transparency?"
];

const fairnessBiasQuestions = [
  "Is there initial awareness and informal identification of potential biases in AI systems?",
  "Are any informal or ad hoc bias mitigation steps currently in place?",
  "Are systematic procedures established to regularly identify and assess biases in AI models?",
  "Are defined mitigation strategies implemented and periodically reviewed?",
  "Is bias assessment integrated systematically across all AI lifecycle stages and audited regularly?",
  "Are proactive mitigation practices continuously monitored and refined across AI deployments?"
];

const strategyMetricsQuestions = [
  "Is there an initial AI strategy documented, even informally?",
  "Are there any metrics informally tracked related to AI initiatives?",
  "Has the AI strategy been formally defined and communicated to stakeholders?",
  "Are defined metrics regularly reviewed and communicated within the organization?",
  "Is the AI strategy integrated into the organization's broader business strategy and continuously improved?",
  "Are metrics systematically analyzed to drive improvements and decision-making processes?"
];

const policyComplianceQuestions = [
  "Is there an awareness or initial informal policy for AI usage within the organization?",
  "Is there basic awareness of compliance needs relevant to AI (e.g., GDPR, ethical guidelines)?",
  "Has a formal AI policy been established and clearly communicated to all relevant stakeholders?",
  "Are compliance requirements identified, documented, and regularly reviewed to ensure alignment with AI-specific regulations?",
  "Is the AI policy consistently enforced and reviewed regularly for relevance, accuracy, and alignment with organizational goals and external standards?",
  "Is compliance management systematically integrated into daily operations, with proactive management of compliance risks and regular audits?"
];

const educationAwarenessQuestions = [
  "Is there initial informal training or general awareness about AI security risks within the organization?",
  "Is communication about AI security risks sporadic or ad hoc?",
  "Are formal training programs on AI security established, targeting key stakeholders and teams?",
  "Is there regular communication about AI security best practices and updates across the organization?",
  "Are AI security training programs regularly updated, mandatory, and effectively tailored for different roles and responsibilities?",
  "Is there an established culture of proactive communication, continuous awareness, and engagement around AI security throughout the organization?"
];

const dataQualityIntegrityQuestions = [
  "Are there informal or ad hoc processes to ensure basic data quality?",
  "Are initial integrity checks occasionally performed on data?",
  "Are formalized data quality procedures defined and regularly executed?",
  "Are consistent data integrity controls systematically applied and reviewed?",
  "Is data quality management embedded throughout the data lifecycle and continuously improved?",
  "Are advanced integrity controls proactively monitored and refined across all datasets?"
];

const dataGovernanceAccountabilityQuestions = [
  "Is there initial awareness or informal processes in place for data governance?",
  "Are basic accountability measures occasionally discussed informally?",
  "Are formal governance structures and responsibilities clearly defined and communicated?",
  "Are accountability and compliance regularly reviewed through structured assessments?",
  "Is data governance systematically integrated into organizational operations, continuously reviewed, and optimized?",
  "Is comprehensive accountability proactively managed, regularly audited, and documented?"
];

const dataTrainingQuestions = [
  "Is training data gathered informally, with minimal consistency or curation standards?",
  "Are there minimal or no compliance checks for third-party data usage?",
  "Are standardized processes for dataset collection and labeling formally defined?",
  "Are compliance and ethical standards regularly reviewed for external datasets?",
  "Is data preparation fully automated, consistently maintained, and continuously improved?",
  "Is monitoring of datasets for security, licensing, and ethical use systematically implemented and regularly audited?"
];

const minimizationLimitationQuestions = [
  "Is there basic awareness and informal processes around data minimization?",
  "Are data collection purposes informally discussed or inconsistently documented?",
  "Are formal procedures established to regularly review and minimize data collection?",
  "Are explicit purposes clearly defined, communicated, and regularly reviewed?",
  "Is data minimization proactively embedded into data collection practices across all operations?",
  "Are stringent purpose limitation controls systematically enforced and audited?"
];

const privacyByDesignQuestions = [
  "Is there initial awareness or informal consideration of privacy aspects during AI design?",
  "Are default privacy settings informally considered in AI systems?",
  "Are formal privacy by design procedures integrated into AI development processes?",
  "Are default privacy controls systematically implemented and documented?",
  "Is privacy by design fully embedded and continuously improved across the entire AI lifecycle?",
  "Are comprehensive default privacy settings proactively managed and regularly audited?"
];

const userControlTransparencyQuestions = [
  "Is there basic, informal communication to users regarding data use and AI operations?",
  "Are informal processes in place to occasionally respond to user data control requests?",
  "Are clear, formal transparency practices regularly provided to users regarding AI data usage?",
  "Are structured mechanisms in place to facilitate user control over personal data?",
  "Is comprehensive transparency proactively maintained, with ongoing user communication and updates?",
  "Are advanced user control mechanisms fully integrated, continuously improved, and audited for effectiveness?"
];

const threatAssessmentQuestions = [
  "Is there basic awareness or informal identification of threats specific to AI systems?",
  "Are informal threat mitigation strategies occasionally discussed or implemented?",
  "Are threats systematically identified and documented for AI systems?",
  "Are documented mitigation strategies developed and periodically reviewed?",
  "Is comprehensive threat assessment consistently performed and integrated across AI lifecycle?",
  "Are proactive and comprehensive mitigation strategies continuously implemented and refined?"
];

const securityArchitectureQuestions = [
  "Is initial security awareness or informal consideration present in AI deployment?",
  "Are informal checks occasionally performed to ensure architectural compliance?",
  "Are formal procedures established for secure AI model deployment?",
  "Are regular architectural compliance reviews systematically conducted?",
  "Is secure deployment consistently enforced, continuously refined, and fully integrated?",
  "Is comprehensive architectural compliance proactively managed and regularly audited?"
];

const securityRequirementsQuestions = [
  "Are security requirements informally identified or sporadically documented?",
  "Are informal verification processes occasionally applied to security requirements?",
  "Are security requirements formally documented, clearly defined, and consistently communicated?",
  "Are systematic verification procedures regularly conducted to ensure requirements are met?",
  "Are security requirements continuously improved and fully integrated across AI projects?",
  "Are comprehensive and proactive verification mechanisms consistently enforced and audited?"
];

const secureBuildQuestions = [
  "Are there basic informal practices for secure building of AI systems?",
  "Is security tooling or automation occasionally used in the build process?",
  "Are formal, systematic build security procedures documented and consistently applied?",
  "Is security tooling regularly integrated into the build pipeline?",
  "Is secure build methodology fully integrated, continuously monitored, and regularly improved?",
  "Are advanced tooling and automation fully embedded and continuously enhanced in the build process?"
];

const secureDeploymentQuestions = [
  "Are there informal or ad hoc processes for securely deploying AI systems?",
  "Are basic technical controls occasionally implemented during deployment?",
  "Are formal processes defined and consistently followed for secure deployment of AI systems?",
  "Are standard technical controls systematically implemented and regularly reviewed?",
  "Is secure deployment methodology fully integrated, continuously monitored, and regularly improved?",
  "Are advanced technical controls proactively managed and audited during deployment?"
];

const defectManagementQuestions = [
  "Are defect tracking processes informally applied or inconsistently documented?",
  "Are basic technical methods occasionally used to identify and resolve defects?",
  "Are defect tracking processes systematically implemented and regularly documented?",
  "Are technical methods consistently applied and regularly reviewed to manage defects?",
  "Are defect tracking processes fully integrated, proactively managed, and continuously refined?",
  "Are advanced technical controls fully embedded and continuously enhanced in defect management?"
];

const securityTestingQuestions = [
  "Are basic security assessments occasionally conducted informally on AI systems?",
  "Is there informal measurement and basic improvement of security practices?",
  "Is there a systematic approach documented for conducting regular security assessments on AI systems?",
  "Are security practices measured consistently, with improvements periodically implemented?",
  "Are security assessments fully integrated, regularly performed, and continuously improved?",
  "Are security metrics comprehensively used to drive continuous improvement and regularly audited?"
];

const requirementTestingQuestions = [
  "Are basic requirement-based tests occasionally conducted informally?",
  "Is requirement verification informally performed with occasional improvements?",
  "Is there a systematic, documented approach for requirement-based testing regularly applied?",
  "Is the effectiveness of requirements verification regularly measured and improved?",
  "Is requirement-based testing fully integrated, regularly executed, and continuously refined?",
  "Is requirements verification proactively validated, improved, and consistently audited?"
];

const architectureAssessmentQuestions = [
  "Are basic architecture reviews occasionally conducted informally on AI systems?",
  "Is architecture improvement informally measured and occasionally addressed?",
  "Is there a systematic and documented approach for conducting regular architecture reviews?",
  "Are architectural effectiveness and compliance regularly measured and improvements implemented?",
  "Are architecture reviews fully integrated, regularly executed, and continuously refined?",
  "Is architectural effectiveness proactively managed, continuously measured, and regularly audited?"
];

const incidentManagementQuestions = [
  "Are there basic informal procedures or ad hoc responses for managing AI incidents?",
  "Are incidents informally documented and occasionally resolved?",
  "Is there a documented and consistently applied incident response procedure for AI systems?",
  "Are incidents systematically managed, documented, and regularly reviewed?",
  "Are incident response processes fully integrated, continuously improved, and regularly exercised?",
  "Are incident handling and resolution proactively managed, optimized, and regularly audited?"
];

const eventManagementQuestions = [
  "Is there informal or occasional monitoring and detection of events in AI systems?",
  "Are event responses informally conducted and sporadically documented?",
  "Are events systematically monitored and consistently detected through defined processes?",
  "Are event responses systematically executed, documented, and regularly reviewed?",
  "Is event monitoring continuously refined, comprehensively managed, and fully automated?",
  "Is event response proactively managed, continuously improved, and regularly audited?"
];

const operationalManagementQuestions = [
  "Are operational management procedures occasionally applied informally to AI systems?",
  "Is operational effectiveness informally monitored and occasionally addressed?",
  "Are systematic operational procedures clearly defined, documented, and consistently applied?",
  "Is operational effectiveness regularly assessed with improvements systematically implemented?",
  "Are operational processes fully integrated, consistently managed, and continuously refined?",
  "Is operational effectiveness proactively managed, comprehensively optimized, and regularly audited?"
];

export const assessmentQuestions = {
  responsible_ai: {
    title: "Responsible AI",
    subdomains: {
      ethical_impact: {
        title: "Ethical & Societal Impact",
        description: "Assessing the ethical implications and societal impact of AI systems.",
        questions: generateQuestionsForSubdomain("Ethical & Societal Impact", ethicalImpactQuestions)
      },
      transparency: {
        title: "Transparency & Explainability",
        description: "Ensuring AI systems are transparent and their decisions can be explained.",
        questions: generateQuestionsForSubdomain("Transparency & Explainability", transparencyQuestions)
      },
      fairness_bias: {
        title: "Fairness & Bias",
        description: "Identifying and mitigating bias to ensure fair outcomes.",
        questions: generateQuestionsForSubdomain("Fairness & Bias", fairnessBiasQuestions)
      }
    }
  },
  governance: {
    title: "Governance",
    subdomains: {
      strategy_metrics: {
        title: "Strategy & Metrics",
        description: "Defining AI strategy and metrics for success and accountability.",
        questions: generateQuestionsForSubdomain("Strategy & Metrics", strategyMetricsQuestions)
      },
      policy_compliance: {
        title: "Policy & Compliance",
        description: "Establishing clear policies and ensuring compliance for AI initiatives.",
        questions: generateQuestionsForSubdomain("Policy & Compliance", policyComplianceQuestions)
      },
      education_awareness: {
        title: "Education & Awareness",
        description: "Promoting education and awareness about responsible AI practices.",
        questions: generateQuestionsForSubdomain("Education & Awareness", educationAwarenessQuestions)
      }
    }
  },
  data_management: {
    title: "Data Management",
    subdomains: {
      quality_integrity: {
        title: "Data Quality & Integrity",
        description: "Ensuring data used for training and operating AI is accurate, complete, and reliable.",
        questions: generateQuestionsForSubdomain("Data Quality & Integrity", dataQualityIntegrityQuestions)
      },
      data_governance_accountability: {
        title: "Data Governance & Accountability",
        description: "Establishing governance and accountability for data management.",
        questions: generateQuestionsForSubdomain("Data Governance & Accountability", dataGovernanceAccountabilityQuestions)
      },
      data_training: {
        title: "Data Training",
        description: "Managing data used for training AI models.",
        questions: generateQuestionsForSubdomain("Data Training", dataTrainingQuestions)
      }
    }
  },
  privacy: {
    title: "Privacy",
    subdomains: {
      minimization_limitation: {
        title: "Data Minimization & Purpose Limitation",
        description: "Minimizing data collection and limiting its use to specified purposes.",
        questions: generateQuestionsForSubdomain("Data Minimization & Purpose Limitation", minimizationLimitationQuestions)
      },
      privacy_by_design: {
        title: "Privacy by Design & Default",
        description: "Integrating privacy principles into the design of AI systems from the outset.",
        questions: generateQuestionsForSubdomain("Privacy by Design & Default", privacyByDesignQuestions)
      },
      user_control_transparency: {
        title: "User Control & Transparency",
        description: "Providing users with control over their data and transparency into its use.",
        questions: generateQuestionsForSubdomain("User Control & Transparency", userControlTransparencyQuestions)
      }
    }
  },
  design: {
    title: "Design",
    subdomains: {
      threat_assessment: {
        title: "Threat Assessment",
        description: "Assessing potential threats and vulnerabilities in AI systems.",
        questions: generateQuestionsForSubdomain("Threat Assessment", threatAssessmentQuestions)
      },
      security_architecture: {
        title: "Security Architecture",
        description: "Designing a secure architecture for AI systems.",
        questions: generateQuestionsForSubdomain("Security Architecture", securityArchitectureQuestions)
      },
      security_requirements: {
        title: "Security Requirements",
        description: "Defining clear security requirements for AI systems.",
        questions: generateQuestionsForSubdomain("Security Requirements", securityRequirementsQuestions)
      }
    }
  },
  implementation: {
    title: "Implementation",
    subdomains: {
      secure_build: {
        title: "Secure Build",
        description: "Following secure build practices for AI components.",
        questions: generateQuestionsForSubdomain("Secure Build", secureBuildQuestions)
      },
      secure_deployment: {
        title: "Secure Deployment",
        description: "Using controlled and monitored processes for deploying AI systems securely.",
        questions: generateQuestionsForSubdomain("Secure Deployment", secureDeploymentQuestions)
      },
      defect_management: {
        title: "Defect Management",
        description: "Managing and remediating defects in AI systems.",
        questions: generateQuestionsForSubdomain("Defect Management", defectManagementQuestions)
      }
    }
  },
  verification: {
    title: "Verification",
    subdomains: {
      security_testing: {
        title: "Security Testing",
        description: "Rigorously testing the security of AI systems.",
        questions: generateQuestionsForSubdomain("Security Testing", securityTestingQuestions)
      },
      requirement_testing: {
        title: "Requirement-based Testing",
        description: "Testing AI systems against specified requirements.",
        questions: generateQuestionsForSubdomain("Requirement-based Testing", requirementTestingQuestions)
      },
      architecture_assessment: {
        title: "Architecture Assessment",
        description: "Assessing the security and integrity of the AI system architecture.",
        questions: generateQuestionsForSubdomain("Architecture Assessment", architectureAssessmentQuestions)
      }
    }
  },
  operations: {
    title: "Operations",
    subdomains: {
      incident_management: {
        title: "Incident Management",
        description: "Managing and responding to security incidents.",
        questions: generateQuestionsForSubdomain("Incident Management", incidentManagementQuestions)
      },
      event_management: {
        title: "Event Management",
        description: "Monitoring and managing events in AI systems.",
        questions: generateQuestionsForSubdomain("Event Management", eventManagementQuestions)
      },
      operational_management: {
        title: "Operational Management",
        description: "Ongoing operational management of AI systems in production.",
        questions: generateQuestionsForSubdomain("Operational Management", operationalManagementQuestions)
      }
    }
  }
};