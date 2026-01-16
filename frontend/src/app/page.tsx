"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  IconBrain,
  IconShield,
  IconEye,
  IconChartBar,
  IconUsers,
  IconTarget,
  IconArrowRight,
  IconSparkles,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  const features = [
    {
      icon: IconBrain,
      title: "AI Maturity Assessment",
      description:
        "Comprehensive evaluation using OWASP AIMA framework across 8 critical domains",
    },
    {
      icon: IconShield,
      title: "Security & Risk Analysis",
      description:
        "Identify vulnerabilities and adversarial risks in your AI systems",
    },
    {
      icon: IconEye,
      title: "Transparency & Ethics",
      description:
        "Ensure your AI systems are explainable, fair, and ethically sound",
    },
    {
      icon: IconChartBar,
      title: "Detailed Reporting",
      description:
        "Get actionable insights with exportable PDF and CSV reports",
    },
    {
      icon: IconUsers,
      title: "Multi-Project Management",
      description:
        "Manage multiple AI systems and track progress across your organization",
    },
    {
      icon: IconTarget,
      title: "Actionable Recommendations",
      description:
        "Receive specific guidance to improve your AI maturity level",
    },
  ];

  const domains = [
    "Responsible AI",
    "Governance",
    "Data Management",
    "Privacy",
    "Design",
    "Implementation",
    "Verification",
    "Operations",
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-violet-50/50 to-blue-50/50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-blue-900/20"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">MATUR.ai</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Assess your AI maturity using the OWASP AIMA framework
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Comprehensive evaluation across 8 critical domains to ensure your
              AI systems are secure, ethical, and mature
            </p>
          </motion.div>

          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <p className="text-xl text-muted-foreground mb-8">
                Welcome back, {user?.name}!
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-14 px-8">
                <Link href="/dashboard">
                  Go to Dashboard
                  <IconArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-14 px-8">
                <Link href="/auth?isLogin=false">
                  Get Started
                  <IconArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Create an account to start your AI maturity assessment
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Why Choose MATUR.ai?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive AI maturity assessment platform built on industry
              standards
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="glass-effect h-full hover:bg-muted/50 transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AIMA Domains Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">8 Critical AI Domains</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive coverage of AI maturity across all essential areas
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {domains.map((domain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="glass-effect hover:bg-muted/50 transition-all duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <IconCircleCheck className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {domain}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass-effect">
              <CardContent className="p-12">
                <div className="flex items-center justify-center mb-6">
                  <IconSparkles className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="gradient-text">
                    Ready to Assess Your AI Maturity?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join organizations worldwide in building more secure, ethical, and
                  mature AI systems
                </p>
                {!isAuthenticated && (
                  <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-14 px-8">
                    <Link href="/auth">
                      Start Your Assessment
                      <IconArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
