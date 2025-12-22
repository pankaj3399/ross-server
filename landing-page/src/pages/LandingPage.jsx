import React, { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Mail,
  ShieldCheck,
  Users,
  Award,
  Zap,
  BarChartHorizontal,
  Search,
  Bot,
  CheckCircle,
} from "lucide-react";
import AIMaturityRunGame from "@/components/AIMaturityRunGame";
import logoImage from "@/logo.webp";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const LandingPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  const logoUrl = isDarkMode ? "/logo-dark.png" : logoImage;

  const handleNotify = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email = e.target.elements.email.value;

    // Backend availability is inferred from the fetch call below.

    try {
      const resp = await fetch(`${API_BASE_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      const error = resp.ok
        ? null
        : { message: data.error || "Request failed" };

      if (error) {
        throw new Error(`Network Error: ${error.message}`);
      }

      if (data.message === "You're already on the list!") {
        toast({
          title: "You're already on the list! 🎉",
          description: "We've got your email. We'll be in touch soon!",
        });
        e.target.reset();
      } else if (data.message === "Subscription successful!") {
        toast({
          title: "Success! You're on the list. ✅",
          description: "We'll notify you the moment MATUR.ai goes live.",
        });
        e.target.reset();
      } else {
        throw new Error(
          data.message || "An unknown error occurred during submission.",
        );
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          err.message ||
          "There was a problem. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const premiumFeatures = [
    {
      icon: BarChartHorizontal,
      title: "Advanced Reporting & Interactive Dashboards",
      description:
        "Dive deep into your data with customizable reports and dynamic, real-time dashboards.",
    },
    {
      icon: Search,
      title: "Automated Bias & Fairness Testing",
      description:
        "Automatically detect and mitigate biases in your AI models to ensure equitable outcomes.",
    },
    {
      icon: Zap,
      title: "AI Security Vulnerability Scanning",
      description:
        "Proactively identify and patch security weaknesses unique to AI systems.",
    },
    {
      icon: Bot,
      title: "AI-Powered Action Plan Generator",
      description:
        "Receive intelligent, prioritized recommendations to accelerate your maturity journey.",
    },
  ];
  const domainsWithSubdomains = [
    {
      title: "Responsible AI",
      subdomains: [
        "Ethical & Societal Impact",
        "Transparency & Explainability",
        "Fairness & Bias",
      ],
    },
    {
      title: "Governance",
      subdomains: [
        "Strategy & Metrics",
        "Policy & Compliance",
        "Education & Awareness",
      ],
    },
    {
      title: "Data Management",
      subdomains: [
        "Data Quality & Integrity",
        "Data Governance & Accountability",
        "Data Training",
      ],
    },
    {
      title: "Privacy",
      subdomains: [
        "Data Minimization & Purpose Limitation",
        "Privacy by Design & Default",
        "User Control & Transparency",
      ],
    },
    {
      title: "Design",
      subdomains: [
        "Threat Assessment",
        "Security Architecture",
        "Security Requirements",
      ],
    },
    {
      title: "Implementation",
      subdomains: ["Secure Build", "Secure Deployment", "Defect Management"],
    },
    {
      title: "Verification",
      subdomains: [
        "Security Testing",
        "Requirement-based Testing",
        "Architecture Assessment",
      ],
    },
    {
      title: "Operations",
      subdomains: [
        "Incident Management",
        "Event Management",
        "Operational Management",
      ],
    },
  ];
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Helmet>
        <title>Coming Soon | MATUR.ai - AI Maturity Assessment Platform</title>
        <meta
          name="description"
          content="Be the first to access MATUR.ai, the world's first comprehensive AI Maturity Self-Assessment Platform. It's FREE! Sign up for early access."
        />
      </Helmet>

      <section className="relative py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50 to-violet-100 z-0"></div>
        <div className="absolute inset-0 opacity-30 bg-grid-pattern"></div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="space-y-6"
          >
            <img
              src={isDarkMode ? "/logo-dark.png" : "/logo.png"}
              alt="MATUR.ai Logo"
              className="h-24 mx-auto mb-4"
            />

            <h3 className="text-3xl md:text-4xl font-extrabold gradient-text-blue mb-4">
              MaturAIze Your AI
            </h3>
            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text">
              The First Comprehensive AI Maturity Self-Assessment Platform
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-purple-700 -mt-2">
              Using the Industry-Standard OWASP AIMA Framework & Much More!
            </h2>

            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              <span className="font-semibold">MATUR.ai</span> empowers you to
              evaluate, improve, and govern your AI systems.
            </p>

            <motion.form
              onSubmit={handleNotify}
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.5,
                duration: 0.5,
              }}
              className="max-w-xl mx-auto mt-8 p-4 glass-effect rounded-xl border border-gray-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email to get notified"
                  required
                  disabled={isSubmitting}
                  className="flex-grow bg-gray-100/50 border-gray-300 text-slate-800 placeholder:text-gray-500 focus:ring-purple-500"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white pulse-glow"
                >
                  {isSubmitting ? "Submitting..." : "Get Early Access"}{" "}
                  <Mail className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.form>
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.7,
                duration: 0.5,
              }}
              className="mt-6 flex justify-center items-center gap-4"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                COMING SOON
              </div>
              <div className="bg-gradient-to-r from-green-400 to-cyan-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">
                100% FREE
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">See Your AI Maturity at a Glance</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Visualize your assessment results with comprehensive analytics and actionable insights
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group"
          >
            {/* Decorative gradient border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>

            {/* Main image container */}
            <div className="relative bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50 dark:from-purple-900/10 dark:via-transparent dark:to-blue-900/10 pointer-events-none"></div>

              {/* Image with enhanced styling */}
              <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                <img
                  src="/dashboard.jpeg"
                  width={2000}
                  height={1800}
                  alt="MATUR.ai Dashboard Preview"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Hover overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                  <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-lg font-semibold mb-2">Explore Your AI Maturity Metrics</p>
                    <p className="text-sm opacity-90">Interactive charts and detailed analytics</p>
                  </div>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/10 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-tr-full pointer-events-none"></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{
              opacity: 0,
              x: -30,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
            viewport={{
              once: true,
            }}
            className="flex items-start gap-4 p-6 glass-effect rounded-xl gradient-border"
          >
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-200 rounded-full">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Prepare for Compliance
              </h3>
              <p className="text-gray-600">
                Are you getting ready for mandatory compliances like the EU AI
                Act, ISO 42001, or NIST AI RMF? Start preparing now with this
                self-assessment before spending thousands of dollars on audits
                and consultants.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{
              opacity: 0,
              x: 30,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
            viewport={{
              once: true,
            }}
            className="flex items-start gap-4 p-6 glass-effect rounded-xl gradient-border"
          >
            <div className="p-3 bg-gradient-to-br from-violet-100 to-pink-200 rounded-full">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Expert-Driven
              </h3>
              <p className="text-gray-600">
                Developed by leading experts in AI Security and Governance.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            viewport={{
              once: true,
            }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-4">
              8 Critical AI Maturity Domains
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gain a 360-degree view of your AI landscape by self-assessing all
              critical domains and get a Score for your AI Maturity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {domainsWithSubdomains.map((domain, index) => (
              <motion.div
                key={domain.title}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
                className="glass-effect rounded-xl p-6 gradient-border hover:scale-105 transition-transform duration-300 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                  <span className="text-lg font-semibold text-slate-800">
                    {domain.title}
                  </span>
                </div>
                <ul className="flex flex-col gap-2 mt-auto pl-2 list-inside">
                  {domain.subdomains.map((sub) => (
                    <li
                      key={sub}
                      className="bg-gray-100/70 text-gray-700 text-xs font-medium rounded-md px-3 py-2 text-left flex items-center"
                    >
                      <span className="mr-2 text-purple-500">•</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            viewport={{
              once: true,
            }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Unlock Premium Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supercharge your AI maturity with our upcoming suite of advanced
              tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
                className="text-center p-6"
              >
                <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full mb-4">
                  <feature.icon className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4">
        <div className="absolute inset-0 z-0"></div>
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            viewport={{
              once: true,
            }}
            className="glass-effect rounded-2xl p-12 gradient-border"
          >
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-6 floating-animation" />
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Don't Miss Out. It's FREE!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join the waitlist to get exclusive early access and be among the
              first to elevate your organization's AI maturity.
            </p>
          </motion.div>
          <motion.form
            onSubmit={handleNotify}
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.2,
              duration: 0.5,
            }}
            viewport={{
              once: true,
            }}
            className="max-w-xl mx-auto p-4 mt-8 space-y-4"
            id="bottom-waitlist-form"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                name="email"
                placeholder="Enter your email to get notified"
                required
                disabled={isSubmitting}
                className="flex-grow bg-gray-100/50 border-gray-300 text-slate-800 placeholder:text-gray-500 focus:ring-purple-500"
              />
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white pulse-glow"
              >
                {isSubmitting ? "Submitting..." : "Get Early Access"}
                <Mail className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.form>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            viewport={{
              once: true,
            }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Can Your AI Survive the Governance Gauntlet?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Play the quick 30-second AI Maturity Run and see how far your
              Responsible AI instincts can go. Tap the Jump button or space bar
              to jump.
            </p>
          </motion.div>
          <AIMaturityRunGame />
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-gray-500">
        <div className="flex justify-center items-center gap-4 mb-4">
          <img
            src={logoUrl}
            alt="MATUR.ai Logo"
            className="h-8"
          />
          <p>
            &copy; 2025 MATUR.ai. (Powered by{" "}
            <a
              href="https://www.dynamiccomply.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Dynamic Comply
            </a>
            ) All rights reserved.
          </p>
        </div>
        <p className="text-xs mt-2">
          Your privacy is important to us. We will never share your email with
          anyone.
        </p>
      </footer>
    </div>
  );
};
export default LandingPage;
