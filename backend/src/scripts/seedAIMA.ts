import pool from "../config/database";

const aimaData = {
  domains: {
    "responsible_ai_principles": {
      title: "Responsible AI Principles",
      description: "Establish ethical foundations and responsible practices for AI systems.",
      practices: {
        "ethical_societal_impact": {
          title: "Ethical & Societal Impact",
          description: "Assess and manage the ethical and societal impacts of AI systems.",
          levels: {
            "1": {
              "A": [
                "Is there informal awareness of the potential ethical and societal impacts of AI systems?"
              ],
              "B": [
                "Are ethical considerations occasionally discussed in an informal manner?"
              ]
            },
            "2": {
              "A": [
                "Have formal processes been established to assess AI's ethical and societal impacts?"
              ],
              "B": [
                "Is there an established framework guiding ethical decision-making for AI systems?"
              ]
            },
            "3": {
              "A": [
                "Are impact assessments systematically integrated into all AI projects, continuously reviewed, and updated?"
              ],
              "B": [
                "Is ethical decision-making fully embedded in organizational processes, consistently guiding AI development and deployment?"
              ]
            }
          }
        },
        "transparency_explainability": {
          title: "Transparency & Explainability",
          description: "Ensure AI systems are transparent and their decisions can be explained.",
          levels: {
            "1": {
              "A": [
                "Are there informal efforts to explain AI outputs or decisions when requested?"
              ],
              "B": [
                "Is communication about AI systems' workings sporadic or reactive?"
              ]
            },
            "2": {
              "A": [
                "Are formal explainability mechanisms in place for critical AI models or systems?"
              ],
              "B": [
                "Are transparency and explanations regularly documented and shared internally?"
              ]
            },
            "3": {
              "A": [
                "Are advanced, comprehensive explainability techniques consistently applied across all AI systems?"
              ],
              "B": [
                "Is there proactive external reporting and open communication regarding AI transparency?"
              ]
            }
          }
        },
        "fairness_bias": {
          title: "Fairness & Bias",
          description: "Identify and mitigate bias in AI systems to ensure fairness.",
          levels: {
            "1": {
              "A": [
                "Is there initial awareness and informal identification of potential biases in AI systems?"
              ],
              "B": [
                "Are any informal or ad hoc bias mitigation steps currently in place?"
              ]
            },
            "2": {
              "A": [
                "Are systematic procedures established to regularly identify and assess biases in AI models?"
              ],
              "B": [
                "Are defined mitigation strategies implemented and periodically reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is bias assessment integrated systematically across all AI lifecycle stages and audited regularly?"
              ],
              "B": [
                "Are proactive mitigation practices continuously monitored and refined across AI deployments?"
              ]
            }
          }
        }
      }
    },
    "governance": {
      title: "Governance",
      description: "Establish governance structures and policies for AI initiatives.",
      practices: {
        "strategy_metrics": {
          title: "Strategy & Metrics",
          description: "Align AI initiatives with business strategy and measure effectiveness.",
          levels: {
            "1": {
              "A": [
                "Is there an initial AI strategy documented, even informally?"
              ],
              "B": [
                "Are there any metrics informally tracked related to AI initiatives?"
              ]
            },
            "2": {
              "A": [
                "Has the AI strategy been formally defined and communicated to stakeholders?"
              ],
              "B": [
                "Are defined metrics regularly reviewed and communicated within the organization?"
              ]
            },
            "3": {
              "A": [
                "Is the AI strategy integrated into the organization's broader business strategy and continuously improved?"
              ],
              "B": [
                "Are metrics systematically analyzed to drive improvements and decision-making processes?"
              ]
            }
          }
        },
        "policy_compliance": {
          title: "Policy & Compliance",
          description: "Develop and enforce AI policies and ensure regulatory compliance.",
          levels: {
            "1": {
              "A": [
                "Is there an awareness or initial informal policy for AI usage within the organization?"
              ],
              "B": [
                "Is there basic awareness of compliance needs relevant to AI (e.g., GDPR, ethical guidelines)?"
              ]
            },
            "2": {
              "A": [
                "Has a formal AI policy been established and clearly communicated to all relevant stakeholders?"
              ],
              "B": [
                "Are compliance requirements identified, documented, and regularly reviewed to ensure alignment with AI-specific regulations?"
              ]
            },
            "3": {
              "A": [
                "Is the AI policy consistently enforced and reviewed regularly for relevance, accuracy, and alignment with organizational goals and external standards?"
              ],
              "B": [
                "Is compliance management systematically integrated into daily operations, with proactive management of compliance risks and regular audits?"
              ]
            }
          }
        },
        "education_awareness": {
          title: "Education & Awareness",
          description: "Build AI security awareness and provide training across the organization.",
          levels: {
            "1": {
              "A": [
                "Is there initial informal training or general awareness about AI security risks within the organization?"
              ],
              "B": [
                "Is communication about AI security risks sporadic or ad hoc?"
              ]
            },
            "2": {
              "A": [
                "Are formal training programs on AI security established, targeting key stakeholders and teams?"
              ],
              "B": [
                "Is there regular communication about AI security best practices and updates across the organization?"
              ]
            },
            "3": {
              "A": [
                "Are AI security training programs regularly updated, mandatory, and effectively tailored for different roles and responsibilities?"
              ],
              "B": [
                "Is there an established culture of proactive communication, continuous awareness, and engagement around AI security throughout the organization?"
              ]
            }
          }
        }
      }
    },
    "data_management": {
      title: "Data Management",
      description: "Manage data quality, governance, and training data for AI systems.",
      practices: {
        "data_quality_integrity": {
          title: "Data Quality & Integrity",
          description: "Ensure high-quality and reliable data for AI systems.",
          levels: {
            "1": {
              "A": [
                "Are there informal or ad hoc processes to ensure basic data quality?"
              ],
              "B": [
                "Are initial integrity checks occasionally performed on data?"
              ]
            },
            "2": {
              "A": [
                "Are formalized data quality procedures defined and regularly executed?"
              ],
              "B": [
                "Are consistent data integrity controls systematically applied and reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is data quality management embedded throughout the data lifecycle and continuously improved?"
              ],
              "B": [
                "Are advanced integrity controls proactively monitored and refined across all datasets?"
              ]
            }
          }
        },
        "data_governance_accountability": {
          title: "Data Governance & Accountability",
          description: "Establish data governance frameworks and accountability measures.",
          levels: {
            "1": {
              "A": [
                "Is there initial awareness or informal processes in place for data governance?"
              ],
              "B": [
                "Are basic accountability measures occasionally discussed informally?"
              ]
            },
            "2": {
              "A": [
                "Are formal governance structures and responsibilities clearly defined and communicated?"
              ],
              "B": [
                "Are accountability and compliance regularly reviewed through structured assessments?"
              ]
            },
            "3": {
              "A": [
                "Is data governance systematically integrated into organizational operations, continuously reviewed, and optimized?"
              ],
              "B": [
                "Is comprehensive accountability proactively managed, regularly audited, and documented?"
              ]
            }
          }
        },
        "data_training": {
          title: "Data Training",
          description: "Manage training data collection, preparation, and compliance.",
          levels: {
            "1": {
              "A": [
                "Is training data gathered informally, with minimal consistency or curation standards?"
              ],
              "B": [
                "Are there minimal or no compliance checks for third-party data usage?"
              ]
            },
            "2": {
              "A": [
                "Are standardized processes for dataset collection and labeling formally defined?"
              ],
              "B": [
                "Are compliance and ethical standards regularly reviewed for external datasets?"
              ]
            },
            "3": {
              "A": [
                "Is data preparation fully automated, consistently maintained, and continuously improved?"
              ],
              "B": [
                "Is monitoring of datasets for security, licensing, and ethical use systematically implemented and regularly audited?"
              ]
            }
          }
        }
      }
    },
    "privacy": {
      title: "Privacy",
      description: "Protect privacy and ensure compliance with privacy regulations.",
      practices: {
        "data_minimization_purpose_limitation": {
          title: "Data Minimization & Purpose Limitation",
          description: "Minimize data collection and limit data usage to specific purposes.",
          levels: {
            "1": {
              "A": [
                "Is there basic awareness and informal processes around data minimization?"
              ],
              "B": [
                "Are data collection purposes informally discussed or inconsistently documented?"
              ]
            },
            "2": {
              "A": [
                "Are formal procedures established to regularly review and minimize data collection?"
              ],
              "B": [
                "Are explicit purposes clearly defined, communicated, and regularly reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is data minimization proactively embedded into data collection practices across all operations?"
              ],
              "B": [
                "Are stringent purpose limitation controls systematically enforced and audited?"
              ]
            }
          }
        },
        "privacy_by_design_default": {
          title: "Privacy by Design & Default",
          description: "Integrate privacy considerations into AI system design and default settings.",
          levels: {
            "1": {
              "A": [
                "Is there initial awareness or informal consideration of privacy aspects during AI design?"
              ],
              "B": [
                "Are default privacy settings informally considered in AI systems?"
              ]
            },
            "2": {
              "A": [
                "Are formal privacy by design procedures integrated into AI development processes?"
              ],
              "B": [
                "Are default privacy controls systematically implemented and documented?"
              ]
            },
            "3": {
              "A": [
                "Is privacy by design fully embedded and continuously improved across the entire AI lifecycle?"
              ],
              "B": [
                "Are comprehensive default privacy settings proactively managed and regularly audited?"
              ]
            }
          }
        },
        "user_control_transparency": {
          title: "User Control & Transparency",
          description: "Provide users with control over their data and transparent information about AI usage.",
          levels: {
            "1": {
              "A": [
                "Is there basic, informal communication to users regarding data use and AI operations?"
              ],
              "B": [
                "Are informal processes in place to occasionally respond to user data control requests?"
              ]
            },
            "2": {
              "A": [
                "Are clear, formal transparency practices regularly provided to users regarding AI data usage?"
              ],
              "B": [
                "Are structured mechanisms in place to facilitate user control over personal data?"
              ]
            },
            "3": {
              "A": [
                "Is comprehensive transparency proactively maintained, with ongoing user communication and updates?"
              ],
              "B": [
                "Are advanced user control mechanisms fully integrated, continuously improved, and audited for effectiveness?"
              ]
            }
          }
        }
      }
    },
    "design": {
      title: "Design",
      description: "Design secure and robust AI systems from the ground up.",
      practices: {
        "threat_assessment": {
          title: "Threat Assessment",
          description: "Identify and assess threats specific to AI systems.",
          levels: {
            "1": {
              "A": [
                "Is there basic awareness or informal identification of threats specific to AI systems?"
              ],
              "B": [
                "Are informal threat mitigation strategies occasionally discussed or implemented?"
              ]
            },
            "2": {
              "A": [
                "Are threats systematically identified and documented for AI systems?"
              ],
              "B": [
                "Are documented mitigation strategies developed and periodically reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is comprehensive threat assessment consistently performed and integrated across AI lifecycle?"
              ],
              "B": [
                "Are proactive and comprehensive mitigation strategies continuously implemented and refined?"
              ]
            }
          }
        },
        "security_architecture": {
          title: "Security Architecture",
          description: "Design secure architectural foundations for AI systems.",
          levels: {
            "1": {
              "A": [
                "Is initial security awareness or informal consideration present in AI deployment?"
              ],
              "B": [
                "Are informal checks occasionally performed to ensure architectural compliance?"
              ]
            },
            "2": {
              "A": [
                "Are formal procedures established for secure AI model deployment?"
              ],
              "B": [
                "Are regular architectural compliance reviews systematically conducted?"
              ]
            },
            "3": {
              "A": [
                "Is secure deployment consistently enforced, continuously refined, and fully integrated?"
              ],
              "B": [
                "Is comprehensive architectural compliance proactively managed and regularly audited?"
              ]
            }
          }
        },
        "security_requirements": {
          title: "Security Requirements",
          description: "Define and validate security requirements for AI systems.",
          levels: {
            "1": {
              "A": [
                "Are security requirements informally identified or sporadically documented?"
              ],
              "B": [
                "Are informal verification processes occasionally applied to security requirements?"
              ]
            },
            "2": {
              "A": [
                "Are security requirements formally documented, clearly defined, and consistently communicated?"
              ],
              "B": [
                "Are systematic verification procedures regularly conducted to ensure requirements are met?"
              ]
            },
            "3": {
              "A": [
                "Are security requirements continuously improved and fully integrated across AI projects?"
              ],
              "B": [
                "Are comprehensive and proactive verification mechanisms consistently enforced and audited?"
              ]
            }
          }
        }
      }
    },
    "implementation": {
      title: "Implementation",
      description: "Implement AI systems securely and manage the development process.",
      practices: {
        "secure_build": {
          title: "Secure Build",
          description: "Build AI systems with security integrated into the development process.",
          levels: {
            "1": {
              "A": [
                "Are there basic informal practices for secure building of AI systems?"
              ],
              "B": [
                "Is security tooling or automation occasionally used in the build process?"
              ]
            },
            "2": {
              "A": [
                "Are formal, systematic build security procedures documented and consistently applied?"
              ],
              "B": [
                "Is security tooling regularly integrated into the build pipeline?"
              ]
            },
            "3": {
              "A": [
                "Is secure build methodology fully integrated, continuously monitored, and regularly improved?"
              ],
              "B": [
                "Are advanced tooling and automation fully embedded and continuously enhanced in the build process?"
              ]
            }
          }
        },
        "secure_deployment": {
          title: "Secure Deployment",
          description: "Deploy AI systems securely with proper controls and monitoring.",
          levels: {
            "1": {
              "A": [
                "Are there informal or ad hoc processes for securely deploying AI systems?"
              ],
              "B": [
                "Are basic technical controls occasionally implemented during deployment?"
              ]
            },
            "2": {
              "A": [
                "Are formal processes defined and consistently followed for secure deployment of AI systems?"
              ],
              "B": [
                "Are standard technical controls systematically implemented and regularly reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is secure deployment methodology fully integrated, continuously monitored, and regularly improved?"
              ],
              "B": [
                "Are advanced technical controls proactively managed and audited during deployment?"
              ]
            }
          }
        },
        "defect_management": {
          title: "Defect Management",
          description: "Identify, track, and resolve defects in AI systems.",
          levels: {
            "1": {
              "A": [
                "Are defect tracking processes informally applied or inconsistently documented?"
              ],
              "B": [
                "Are basic technical methods occasionally used to identify and resolve defects?"
              ]
            },
            "2": {
              "A": [
                "Are defect tracking processes systematically implemented and regularly documented?"
              ],
              "B": [
                "Are technical methods consistently applied and regularly reviewed to manage defects?"
              ]
            },
            "3": {
              "A": [
                "Are defect tracking processes fully integrated, proactively managed, and continuously refined?"
              ],
              "B": [
                "Are advanced technical controls fully embedded and continuously enhanced in defect management?"
              ]
            }
          }
        }
      }
    },
    "verification": {
      title: "Verification",
      description: "Verify AI systems through comprehensive testing and assessment.",
      practices: {
        "security_testing": {
          title: "Security Testing",
          description: "Conduct security assessments and testing of AI systems.",
          levels: {
            "1": {
              "A": [
                "Are basic security assessments occasionally conducted informally on AI systems?"
              ],
              "B": [
                "Is there informal measurement and basic improvement of security practices?"
              ]
            },
            "2": {
              "A": [
                "Is there a systematic approach documented for conducting regular security assessments on AI systems?"
              ],
              "B": [
                "Are security practices measured consistently, with improvements periodically implemented?"
              ]
            },
            "3": {
              "A": [
                "Are security assessments fully integrated, regularly performed, and continuously improved?"
              ],
              "B": [
                "Are security metrics comprehensively used to drive continuous improvement and regularly audited?"
              ]
            }
          }
        },
        "requirement_based_testing": {
          title: "Requirement-based Testing",
          description: "Test AI systems against defined requirements and specifications.",
          levels: {
            "1": {
              "A": [
                "Are basic requirement-based tests occasionally conducted informally?"
              ],
              "B": [
                "Is requirement verification informally performed with occasional improvements?"
              ]
            },
            "2": {
              "A": [
                "Is there a systematic, documented approach for requirement-based testing regularly applied?"
              ],
              "B": [
                "Is the effectiveness of requirements verification regularly measured and improved?"
              ]
            },
            "3": {
              "A": [
                "Is requirement-based testing fully integrated, regularly executed, and continuously refined?"
              ],
              "B": [
                "Is requirements verification proactively validated, improved, and consistently audited?"
              ]
            }
          }
        },
        "architecture_assessment": {
          title: "Architecture Assessment",
          description: "Assess and validate the security architecture of AI systems.",
          levels: {
            "1": {
              "A": [
                "Are basic architecture reviews occasionally conducted informally on AI systems?"
              ],
              "B": [
                "Is architecture improvement informally measured and occasionally addressed?"
              ]
            },
            "2": {
              "A": [
                "Is there a systematic and documented approach for conducting regular architecture reviews?"
              ],
              "B": [
                "Are architectural effectiveness and compliance regularly measured and improvements implemented?"
              ]
            },
            "3": {
              "A": [
                "Are architecture reviews fully integrated, regularly executed, and continuously refined?"
              ],
              "B": [
                "Is architectural effectiveness proactively managed, continuously measured, and regularly audited?"
              ]
            }
          }
        }
      }
    },
    "operations": {
      title: "Operations",
      description: "Operate AI systems securely and manage incidents effectively.",
      practices: {
        "incident_management": {
          title: "Incident Management",
          description: "Manage security incidents and respond to AI system issues.",
          levels: {
            "1": {
              "A": [
                "Are there basic informal procedures or ad hoc responses for managing AI incidents?"
              ],
              "B": [
                "Are incidents informally documented and occasionally resolved?"
              ]
            },
            "2": {
              "A": [
                "Is there a documented and consistently applied incident response procedure for AI systems?"
              ],
              "B": [
                "Are incidents systematically managed, documented, and regularly reviewed?"
              ]
            },
            "3": {
              "A": [
                "Are incident response processes fully integrated, continuously improved, and regularly exercised?"
              ],
              "B": [
                "Are incident handling and resolution proactively managed, optimized, and regularly audited?"
              ]
            }
          }
        },
        "event_management": {
          title: "Event Management",
          description: "Monitor and manage events in AI systems.",
          levels: {
            "1": {
              "A": [
                "Is there informal or occasional monitoring and detection of events in AI systems?"
              ],
              "B": [
                "Are event responses informally conducted and sporadically documented?"
              ]
            },
            "2": {
              "A": [
                "Are events systematically monitored and consistently detected through defined processes?"
              ],
              "B": [
                "Are event responses systematically executed, documented, and regularly reviewed?"
              ]
            },
            "3": {
              "A": [
                "Is event monitoring continuously refined, comprehensively managed, and fully automated?"
              ],
              "B": [
                "Is event response proactively managed, continuously improved, and regularly audited?"
              ]
            }
          }
        },
        "operational_management": {
          title: "Operational Management",
          description: "Manage the day-to-day operations of AI systems.",
          levels: {
            "1": {
              "A": [
                "Are operational management procedures occasionally applied informally to AI systems?"
              ],
              "B": [
                "Is operational effectiveness informally monitored and occasionally addressed?"
              ]
            },
            "2": {
              "A": [
                "Are systematic operational procedures clearly defined, documented, and consistently applied?"
              ],
              "B": [
                "Is operational effectiveness regularly assessed with improvements systematically implemented?"
              ]
            },
            "3": {
              "A": [
                "Are operational processes fully integrated, consistently managed, and continuously refined?"
              ],
              "B": [
                "Is operational effectiveness proactively managed, comprehensively optimized, and regularly audited?"
              ]
            }
          }
        }
      }
    }
  }
};

async function seedAIMAData() {
  try {
    console.log("Starting AIMA data seeding...");

    // Clear existing data
    await pool.query("DELETE FROM aima_questions");
    await pool.query("DELETE FROM aima_practices");
    await pool.query("DELETE FROM aima_domains");

    // Insert domains
    for (const [domainId, domain] of Object.entries(aimaData.domains)) {
      await pool.query(
        "INSERT INTO aima_domains (id, title, description) VALUES ($1, $2, $3)",
        [domainId, domain.title, domain.description]
      );
      console.log(`Inserted domain: ${domain.title}`);

      // Insert practices
      for (const [practiceId, practice] of Object.entries(domain.practices)) {
        await pool.query(
          "INSERT INTO aima_practices (id, domain_id, title, description) VALUES ($1, $2, $3, $4)",
          [practiceId, domainId, practice.title, practice.description]
        );
        console.log(`  Inserted practice: ${practice.title}`);

        // Insert questions
        for (const [level, streams] of Object.entries(practice.levels)) {
          for (const [stream, questions] of Object.entries(streams)) {
            for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
              await pool.query(
                "INSERT INTO aima_questions (practice_id, level, stream, question_index, question_text) VALUES ($1, $2, $3, $4, $5)",
                [practiceId, level, stream, questionIndex, questions[questionIndex]]
              );
            }
          }
        }
        console.log(`    Inserted questions for ${practice.title}`);
      }
    }

    console.log("AIMA data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding AIMA data:", error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAIMAData()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

export { seedAIMAData };
