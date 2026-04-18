"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { FALLBACK_PRICES } from "@/lib/constants";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";

export default function CRCWelcomePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();
  const { crcResponses, isPremium, loading: contextLoading } = useAssessmentContext();

  const hasProgress = Object.keys(crcResponses).length > 0;

  if (!authLoading && !contextLoading && user && !isPremium) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[60vh]">
        <SubscriptionModal
          isOpen
          onClose={() => {
            router.push(`/assess/${projectId}`);
          }}
        />
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to subscription...</p>
        </div>
      </div>
    );
  }

  if (authLoading || contextLoading) {
    return <AssessmentSkeleton />;
  }

  const continueLabel = hasProgress ? "Continue to the CRC assessment" : "Start CRC assessment";

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/assess/${projectId}`)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <header className="space-y-3">
          <p className="text-sm font-semibold text-primary">Premium</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">About Compliance Readiness Controls</h1>
          <p className="text-muted-foreground">
            Read how CRC works in MATUR, then open the guided controls when you are ready. Basic premium lists at{" "}
            {FALLBACK_PRICES.basic} USD per month in the app when pricing fallbacks are shown for procurement.
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none text-foreground space-y-8 [&_p]:leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-0">
          <section className="space-y-3">
            <h2>What it is</h2>
            <p>
              Compliance Readiness Controls are a custom built library of 137 actionable controls designed to prepare your
              organization for AI compliance and regulation. These controls are drawn from the EU AI Act, NIST AI RMF,
              ISO/IEC 42001, and other leading AI governance frameworks, then consolidated into a single, practical set of
              requirements that covers what you need across all of them.
            </p>
            <p>
              Each control tells you exactly what needs to be in place, how to implement it, what documentation and
              artifacts are required, and what evidence you should be collecting. You assess your current state for each
              control by indicating whether you already have it in place, whether you are actively working toward it,
              whether it is planned for the future, or whether it does not apply to your system. You can also document your
              evidence, gaps, and action items directly alongside each control.
            </p>
            <p>
              At the end, the platform scores your responses across all eight compliance domains and produces a readiness
              profile that shows where you stand, where the gaps are, and what to prioritize next.
            </p>
          </section>

          <section className="space-y-3">
            <h2>How it does not work</h2>
            <p>
              This is a self assessment tool designed to guide your organization in preparing for AI compliance and
              regulation. It does not grant, certify, or guarantee compliance with any framework, standard, or law.
              Completing this assessment does not make your organization compliant. The controls are provided as guidance
              to help you understand what is expected, identify gaps, and build a plan toward readiness. Results depend
              entirely on the accuracy and honesty of your responses and how closely they reflect your actual policies,
              processes, and documentation. For formal compliance determination, consult qualified legal counsel or an
              accredited auditor.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Why this is included in premium</h2>
            <p>
              Premium gives you a structured, repeatable compliance readiness assessment without maintaining your own
              spreadsheets, cross referencing multiple standards documents, or building a control library from scratch. You
              get a consistent methodology, stored assessments, and per category tracking each time you evaluate.
              Stakeholders can see exactly where your organization stands against real regulatory requirements, what gaps
              remain, and what to work on next.               This is a living assessment you return to as your program matures, not a
              one time checklist exercise.
            </p>
          </section>

          <section className="space-y-3">
            <h2>What we do end to end</h2>
            <ul className="list-disc pl-5 space-y-2 not-prose text-sm leading-relaxed">
              <li>Present 137 custom built controls across eight compliance domains in a guided workflow.</li>
              <li>
                Use plain language “The organization SHALL…” statements so every stakeholder, technical or not,
                understands what is required.
              </li>
              <li>
                Provide implementation guidance, step by step instructions, evidence requirements, artifact descriptions,
                and framework mappings for every single control.
              </li>
              <li>
                Let you assess each control with clear options: fully in place, partially implemented, not yet started, not
                applicable, or unknown.
              </li>
              <li>
                On submission, produce a compliance readiness report with domain level breakdowns, gap identification, and
                prioritized recommendations for what to address first.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Categories we assess</h2>
            <p>
              Every category below contains its own set of controls and generates a per category readiness score. These
              categories span the full scope of AI governance and map directly to requirements found in the EU AI Act,
              NIST AI RMF, and ISO/IEC 42001.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 not-prose text-sm leading-relaxed columns-1 sm:columns-2 gap-x-8">
              <li>AI Data Management</li>
              <li>AI Development Lifecycle</li>
              <li>AI Fairness and Nondiscrimination</li>
              <li>AI Governance and Strategy</li>
              <li>AI Operations and Monitoring</li>
              <li>AI Risk Management</li>
              <li>AI Transparency and Explainability</li>
              <li>AI Verification and Validation</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Scoring methodology</h2>
            <p className="font-medium text-foreground">What drives the overall score (weighted)</p>
            <p>
              The headline percentage is a weighted blend of category readiness rates. Weights reflect regulatory emphasis
              and real world enforcement priorities. Categories with 0% weight today still appear in your report as coverage
              and diagnostics; they do not move the headline number until we promote them in the formula.
            </p>
            <ul className="list-disc pl-5 space-y-1 not-prose text-sm">
              <li>AI Governance and Strategy: 20%</li>
              <li>AI Risk Management: 15%</li>
              <li>AI Data Management: 15%</li>
              <li>AI Fairness and Nondiscrimination: 12%</li>
              <li>AI Transparency and Explainability: 12%</li>
              <li>AI Verification and Validation: 10%</li>
              <li>AI Operations and Monitoring: 8%</li>
              <li>AI Development Lifecycle: 8%</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Reported with controls but not in the weighted total today: controls marked NA or Not Sure. They still surface
              gaps in the detailed results.
            </p>
          </section>

          <section className="space-y-3">
            <h2>Readiness tiers</h2>
            <p className="text-sm text-muted-foreground">From overall score</p>
            <ul className="list-disc pl-5 space-y-1 not-prose text-sm">
              <li>Ready: score 90% and above</li>
              <li>Mostly Ready: 75% to 89%</li>
              <li>Partially Ready: 55% to 74%</li>
              <li>Not Ready: below 55%</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2>Frameworks and standards mapped</h2>
            <p>
              Every control in the library is mapped to one or more of these frameworks. Your report shows which specific
              articles, clauses, or functions each control satisfies.
            </p>
            <ul className="list-disc pl-5 space-y-2 not-prose text-sm leading-relaxed">
              <li>
                EU AI Act: Articles 8 through 17, Annexes III and IV (high risk system requirements)
              </li>
              <li>NIST AI RMF: GOVERN, MAP, MEASURE, MANAGE functions</li>
              <li>ISO/IEC 42001: Clauses 4 through 10 and Annex A controls (AI management system requirements)</li>
            </ul>
          </section>
        </article>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/assess/${projectId}/crc`}>{continueLabel}</Link>
          </Button>
          {hasProgress && (
            <p className="text-sm text-muted-foreground self-center">
              You have saved answers on {Object.keys(crcResponses).length} control
              {Object.keys(crcResponses).length === 1 ? "" : "s"}. Continue picks up where you left off.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
