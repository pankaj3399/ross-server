"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Eye,
  BarChart3,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();

  const features = [
    {
      icon: Brain,
      title: "AI Maturity Assessment",
      description:
        "Comprehensive evaluation using OWASP AIMA framework across 8 critical domains",
    },
    {
      icon: Shield,
      title: "Security & Risk Analysis",
      description:
        "Identify vulnerabilities and adversarial risks in your AI systems",
    },
    {
      icon: Eye,
      title: "Transparency & Ethics",
      description:
        "Ensure your AI systems are explainable, fair, and ethically sound",
    },
    {
      icon: BarChart3,
      title: "Detailed Reporting",
      description:
        "Get actionable insights with exportable PDF and CSV reports",
    },
    {
      icon: Users,
      title: "Multi-Project Management",
      description:
        "Manage multiple AI systems and track progress across your organization",
    },
    {
      icon: Target,
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
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Assess your AI maturity using the OWASP AIMA framework
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
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
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                Welcome back, {user?.name}!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 pulse-glow"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <Link
                href="/auth?isLogin=false"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 pulse-glow"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-400">
                Create an account to start your AI maturity assessment
              </p>
            </motion.div>
          )}
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
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
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
                className="glass-effect rounded-2xl p-8 hover:bg-gray-50/50 dark:hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
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
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
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
                className="glass-effect rounded-xl p-6 text-center hover:bg-gray-50/50 dark:hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                  {domain}
                </h3>
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
            className="glass-effect rounded-3xl p-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">
                Ready to Assess Your AI Maturity?
              </span>
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              Join organizations worldwide in building more secure, ethical, and
              mature AI systems
            </p>
            {!isAuthenticated && (
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 pulse-glow"
              >
                Start Your Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
