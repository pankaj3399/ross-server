"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, FileCheck, Brain, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

interface PreWizardScreenProps {
  featureName: string;
  onStart: () => void;
  onSkip?: () => void;
}

export function PreWizardScreen({ featureName, onStart, onSkip }: PreWizardScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 15,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const benefits = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: "EU AI Act Risk Classification",
      description: "Determine if your system falls under Prohibited, High, Limited, or Minimal risk tiers.",
    },
    {
      icon: <FileCheck className="h-5 w-5 text-emerald-500" />,
      title: "Tailored CRC Controls Flagging",
      description: "Flag which of the 138 compliance controls are Mandatory, Recommended, or Optional.",
    },
    {
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      title: "Starter Risk & Component Seeding",
      description: "Automatically pre-populate your Risk Register and Component Inventory based on technology stack.",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      title: "Copilot & Template Integration",
      description: "Prefill variables in all 138 document templates and inject compliance context into Mira (AI Copilot).",
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl"
      >
        <Card className="relative overflow-hidden border border-border/80 bg-card backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4 relative z-10">
            <motion.div variants={itemVariants} className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" /> Premium Onboarding Flow
              </span>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Personalize Your Compliance Experience
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants} className="max-w-2xl mx-auto mt-3">
              <CardDescription className="text-base sm:text-lg text-muted-foreground">
                Before accessing <span className="font-semibold text-primary">{featureName}</span>, configure your AI System Profile. This tailors the platform's automation, templates, and rules to your specific use case.
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 py-6 px-6 sm:px-8">
            {/* Benefits List */}
            <div className="flex flex-col justify-center space-y-5">
              <h3 className="font-bold text-lg text-foreground/90 mb-1">What you'll get:</h3>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-md bg-muted flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground/90 text-sm sm:text-base">
                        {benefit.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 mt-0.5">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Thumbnail Preview Panel */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col justify-center items-center bg-muted/40 border border-border/50 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute top-2 right-2 flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500/60" />
                <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
              </div>

              <div className="w-full space-y-4 relative z-10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI System Profile Outputs</h4>
                
                {/* Mock Risk Badge */}
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">EU Risk Classification</span>
                    <span className="text-sm font-bold text-red-400">HIGH RISK</span>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-red-400" />
                </div>

                {/* Mock Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">MANDATORY CONTROLS</span>
                    <span className="text-lg font-extrabold text-foreground">42</span>
                  </div>
                  <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                    <span className="text-[10px] text-muted-foreground block">SUGGESTED RISKS</span>
                    <span className="text-lg font-extrabold text-foreground">6</span>
                  </div>
                </div>

                {/* Mock Integrations */}
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-medium text-primary/95">Mira Copilot context updated</span>
                  <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded">Active</span>
                </div>
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="relative z-10 flex flex-col items-center gap-4 py-6 px-6 sm:px-8 border-t border-border/40 bg-muted/20">
            <motion.div variants={itemVariants} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onStart}
                className="flex-1 py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs flex items-center justify-center gap-2"
              >
                Configure AI Profile <ArrowRight className="h-4 w-4" />
              </Button>

              {onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="py-5 font-semibold border-border text-foreground hover:bg-muted"
                >
                  Skip for Now
                </Button>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="text-center max-w-md">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Recommended:</span> Configuring your profile takes ~5 minutes. You can skip now and configure it anytime from Settings.
              </p>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
