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
  IconLogin,
  IconDashboard,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  // Aurora bars configuration - V-shape pattern
  const bars = [
    { height: "65%", opacity: 0.3 },
    { height: "50%", opacity: 0.4 },
    { height: "40%", opacity: 0.5 },
    { height: "30%", opacity: 0.6 },
    { height: "25%", opacity: 0.7 },
    { height: "20%", opacity: 0.8 },
    { height: "15%", opacity: 0.9 },
    { height: "20%", opacity: 0.8 },
    { height: "25%", opacity: 0.7 },
    { height: "30%", opacity: 0.6 },
    { height: "40%", opacity: 0.5 },
    { height: "50%", opacity: 0.4 },
    { height: "65%", opacity: 0.3 },
  ];

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
      {/* Hero Section with Aurora Bars */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center px-4">
        {/* Aurora Bars Background */}
        <div className="absolute inset-0 flex items-end w-full h-full gap-0 justify-between pb-0 pointer-events-none">
          {bars.map((bar, index) => (
            <motion.div
              key={index}
              className="w-full rounded-t-sm bg-gradient-to-t from-primary via-primary/60 to-transparent"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: bar.height, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: Math.abs(index - Math.floor(bars.length / 2)) * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay to fade top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/60 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Assess the maturity of <br className="hidden md:block" /> your{" "}
              <span className="text-primary">AI systems</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Comprehensive evaluation using the OWASP AIMA framework across domains.
           </p>
          </motion.div>

          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
            >
              <p className="text-xl text-muted-foreground">
                Welcome back, {user?.name}!
              </p>
              <Button
                asChild
                size="lg"
                className="bg-foreground dark:bg-white text-background dark:text-black hover:bg-foreground/90 dark:hover:bg-white/90 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                style={{ paddingLeft: "4px", paddingRight: "24px" }}
              >
                <Link href="/dashboard">
                  <span className="inline-flex items-center gap-3">
                    <span className="bg-background dark:bg-black rounded-full p-2">
                      <IconDashboard className="w-4 h-4 text-foreground dark:text-white" />
                    </span>
                    Go to Dashboard
                  </span>
                </Link>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
            >
              <Button
                asChild
                size="lg"
                className="bg-foreground dark:bg-white text-background dark:text-black hover:bg-foreground/90 dark:hover:bg-white/90 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                style={{ paddingLeft: "4px", paddingRight: "24px" }}
              >
                <Link href="/auth?isLogin=false">
                  <span className="inline-flex items-center gap-3">
                    <span className="bg-background dark:bg-black rounded-full p-2">
                      <IconArrowRight className="w-4 h-4 text-foreground dark:text-white" />
                    </span>
                    Get Started
                  </span>
                </Link>
              </Button>
              <Button asChild className="flex items-center gap-2 text-background font-medium hover:text-muted-background transition-colors group">
                <Link href="/auth">
                  Sign in{" "}
                  <IconLogin className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Trusted By Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Built on the{" "}
              <span className="text-foreground">OWASP AIMA</span> Framework
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              {domains.slice(0, 4).map((domain, index) => (
                <motion.div
                  key={domain}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm md:text-base font-semibold text-foreground"
                >
                  <IconCircleCheck className="w-5 h-5 text-primary" />
                  {domain}
                </motion.div>
              ))}
            </div>
          </motion.div>
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
              <span className="text-primary">Why Choose MATUR.ai?</span>
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
                <Card className="bg-card hover:bg-muted/50 transition-all duration-300 group border-border">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary rounded-xl">
                        <feature.icon className="w-6 h-6 text-primary-foreground" />
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
              <span className="text-primary">8 Critical AI Domains</span>
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
                <Card className="bg-card hover:bg-muted/50 transition-all duration-300 group border-border">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-3">
                      <IconCircleCheck className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
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
            <Card className="bg-card border-border">
              <CardContent className="p-12">
                <div className="flex items-center justify-center mb-6">
                  <IconSparkles className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="text-primary">
                    Ready to Assess Your AI Maturity?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join organizations worldwide in building more secure, ethical, and
                  mature AI systems
                </p>
                {!isAuthenticated && (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8">
                    <Link href="/auth">
                      <span className="inline-flex items-center">
                        Start Your Assessment
                        <IconArrowRight className="w-5 h-5 ml-2" />
                      </span>
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
