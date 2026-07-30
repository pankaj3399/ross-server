"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Play,
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  ArrowLeft,
  Scale,
  Code,
  Key,
  Terminal,
  Sliders,
  Tag,
  ChevronDown,
  Info,
  Check,
  Copy,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { FALLBACK_PRICES, isPremiumStatus } from "@/lib/constants";
import {
  RESPONSE_KEY_REGEX,
  RESPONSE_KEY_ERROR_MESSAGE,
} from "@/lib/responseKeyRegex";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import { ApiEndpointSkeleton } from "@/components/Skeleton";
import { ApiHistory } from "@/app/assess/[projectId]/fairness-bias/api-history/components/ApiHistory";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { isPublicApiUrl } from "@/lib/validateUrl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_REQUEST_TEMPLATE = `{
  "contents": [
    {
      "parts": [
        { "text": "{{prompt}}" }
      ]
    }
  ]
}`;

const PROMPT_PLACEHOLDER_REGEX = /{{\s*prompt\s*}}/i;

type ApiKeyPlacement = "none" | "auth_header" | "x_api_key" | "query_param" | "body_field";

const API_KEY_OPTIONS: Array<{
  value: ApiKeyPlacement;
  label: string;
  description: string;
}> = [
    { value: "none", label: "None / Public API", description: "Do not send an API key with the request." },
    {
      value: "auth_header",
      label: "Header — Authorization: Bearer <API_KEY>",
      description: "Adds an Authorization header using the Bearer scheme.",
    },
    {
      value: "x_api_key",
      label: "Header — x-api-key: <API_KEY>",
      description: "Adds an x-api-key header with your key. Customize the header name below.",
    },
    {
      value: "query_param",
      label: "Query Param — ?key=<API_KEY>",
      description: "Appends ?key=<API_KEY> to your endpoint URL. Customize the parameter name below.",
    },
    {
      value: "body_field",
      label: "Body Field — include api_key",
      description: "Adds \"api_key\": \"<API_KEY>\" to the request JSON body. Customize the property name below.",
    },
  ];

const API_KEY_FIELD_HINTS: Record<ApiKeyPlacement, string> = {
  none: "",
  auth_header: "Authorization (Bearer)",
  x_api_key: "x-goog-api-key",
  query_param: "key",
  body_field: "api_key",
};

const COPY = {
  vulnerability: {
    heroTitle: "API Vulnerability Assessment",
    heroDescription: "Configure your API endpoint to run automated security scans and identify model vulnerabilities.",
    cardTitle: "Endpoint Security Configuration",
    endpointLabel: "Security Scan Endpoint URL",
    requestTemplateLabel: "Request Body Template",
    requestTemplateHelper: "Paste the exact JSON payload your API expects (POST). Use {{prompt}} anywhere you want us to inject each adversarial vulnerability probe.",
    responsePathLabel: "Response Output Path",
    responsePathHelper: "Use dot and bracket notation (e.g. choices[0].message.content) to locate the model's text output for vulnerability analysis.",
    howToTitle: "Configuration Examples & Format Guide",
    howToResponseOutput: "We will extract that string and feed it into the security evaluators to check for policy violations.",
    instantQueueText: "We will queue the security scan instantly. You can monitor scan progress on the next screen.",
    nextStepsJobText: "The backend creates a background vulnerability scanning job instantly.",
    nextStepsRedirectText: "As soon as the scan is done, we redirect you to the security scorecard automatically.",
  },
  "api-testing": {
    heroTitle: "API Automated Fairness Testing",
    heroDescription: "Configure your API endpoint to run automated bias, stereotyping, and fairness evaluations across protected groups.",
    cardTitle: "Endpoint Fairness & Bias Configuration",
    endpointLabel: "Fairness Evaluation Endpoint URL",
    requestTemplateLabel: "Request Body Template",
    requestTemplateHelper: "Paste the exact JSON payload your API expects (POST). Use {{prompt}} anywhere you want us to inject each bias and fairness evaluation prompt.",
    responsePathLabel: "Response Output Path",
    responsePathHelper: "Use dot and bracket notation (e.g. choices[0].message.content) to locate the model's text output for bias and fairness evaluation across protected attributes.",
    howToTitle: "Configuration Examples & Format Guide",
    howToResponseOutput: "We will extract that string and feed it into the fairness evaluators to check for demographic bias.",
    instantQueueText: "We will queue the fairness evaluation instantly. You can monitor evaluation progress on the next screen.",
    nextStepsJobText: "The backend creates a background fairness evaluation job instantly.",
    nextStepsRedirectText: "As soon as the evaluation is done, we redirect you to the bias & fairness scorecard automatically.",
  },
};

interface ApiTestingToolProps {
  mode: "vulnerability" | "api-testing";
}

function FieldInfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground/70 hover:text-primary transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed p-3 bg-slate-900 text-slate-100 dark:bg-slate-800 border-border shadow-lg">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ApiTestingTool({ mode }: ApiTestingToolProps) {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { projectName } = useAssessmentContext();
  const projectId = params.projectId as string;
  const basePath = mode === "vulnerability" ? `/assess/${projectId}/vulnerability-assessment` : `/assess/${projectId}/fairness-bias/api-endpoint`;

  const projectBreadcrumbHref = isPremiumStatus(user?.subscription_status)
    ? `/assess/${projectId}/crc/dashboard`
    : `/assess/${projectId}`;

  const headerLabel = mode === "vulnerability" ? "AI Vulnerability Assessment" : "API Automated Fairness Testing";

  const [apiEndpoint, setApiEndpoint] = useState("");
  const [requestTemplate, setRequestTemplate] = useState(DEFAULT_REQUEST_TEMPLATE);
  const [responseKey, setResponseKey] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [jobStartError, setJobStartError] = useState<string | null>(null);
  const [jobStarting, setJobStarting] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [responseKeyError, setResponseKeyError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyPlacement, setApiKeyPlacement] = useState<ApiKeyPlacement>("none");
  const [apiKeyFieldName, setApiKeyFieldName] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isMethodologyExpanded, setIsMethodologyExpanded] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);

  const isPremium = isPremiumStatus(user?.subscription_status);

  useEffect(() => {
    if (apiEndpoint) {
      const res = isPublicApiUrl(apiEndpoint);
      setIsValidUrl(res.isValid);
      setUrlError(res.error || null);
    } else {
      setIsValidUrl(true);
      setUrlError(null);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    const trimmed = requestTemplate.trim();

    if (!trimmed.length) {
      setTemplateError("Request template is required.");
      return;
    }

    if (!PROMPT_PLACEHOLDER_REGEX.test(trimmed)) {
      setTemplateError(`Insert at least one {{prompt}} placeholder to inject the test input.`);
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const isPlainObject = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);

      if (!isPlainObject) {
        setTemplateError("Request template must be a top-level JSON object (e.g., { \"field\": \"value\" }).");
        return;
      }

      setTemplateError(null);
    } catch {
      setTemplateError("Request template must be valid JSON.");
    }
  }, [requestTemplate, apiKeyPlacement]);

  useEffect(() => {
    const trimmed = responseKey.trim();
    if (!trimmed.length) {
      setResponseKeyError(null);
      return;
    }
    if (!RESPONSE_KEY_REGEX.test(trimmed)) {
      setResponseKeyError(RESPONSE_KEY_ERROR_MESSAGE);
      return;
    }
    setResponseKeyError(null);
  }, [responseKey]);

  const trimmedResponseKey = responseKey.trim();
  const trimmedRequestTemplate = requestTemplate.trim();
  const trimmedApiKey = apiKey.trim();
  const requiresApiKey = apiKeyPlacement !== "none";
  const trimmedApiKeyFieldName = apiKeyFieldName.trim();
  const hasRequiredFields = Boolean(
    apiEndpoint &&
    isValidUrl &&
    trimmedResponseKey &&
    !responseKeyError &&
    trimmedRequestTemplate &&
    !templateError &&
    (!requiresApiKey || trimmedApiKey),
  );
  const canSubmit = hasRequiredFields && !jobStarting;

  const buildPayload = () => {
    const payload: any = {
      projectId,
      apiUrl: apiEndpoint,
      requestTemplate: requestTemplate.trim(),
      responseKey: responseKey.trim(),
      apiKeyPlacement,
    };

    if (apiKeyPlacement !== "none") {
      payload.apiKey = apiKey.trim() || null;
      payload.apiKeyFieldName = apiKeyFieldName.trim() || null;
    }

    return payload;
  };

  const handleTestModel = async () => {
    if (!canSubmit) return;

    setJobStartError(null);
    setJobStarting(true);

    try {
      const response = await apiService.startFairnessEvaluationJob(buildPayload());
      router.push(`${basePath}/job/${response.jobId}`);
    } catch (error: any) {
      setJobStartError(error.message || "Failed to schedule evaluation");
    } finally {
      setJobStarting(false);
    }
  };

  const handleSecurityScan = async () => {
    if (!canSubmit) return;

    if (!isPremium) {
      setShowSubscriptionModal(true);
      return;
    }

    setJobStartError(null);
    setJobStarting(true);

    try {
      const response = await apiService.startSecurityScan(buildPayload());
      router.push(`${basePath}/job/${response.jobId}`);
    } catch (error: any) {
      setJobStartError(error.message || "Failed to start security scan");
    } finally {
      setJobStarting(false);
    }
  };

  if (loading) {
    return <ApiEndpointSkeleton />;
  }

  const HeaderIcon = mode === "vulnerability" ? Shield : Scale;

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-background">
      {/* Header */}
      <div className="bg-sidebar border-b border-sidebar-border px-6 md:px-8 py-3 flex-none sticky top-0 z-20 shadow-xs w-full">
        <div className="w-full flex flex-col gap-2">
          {/* Top: Breadcrumb */}
          <div className="flex items-center justify-between text-xs">
            <Breadcrumb
              projectName={projectName || "Loading..."}
              projectHref={projectBreadcrumbHref}
              items={[{ label: headerLabel }]}
            />
          </div>

          {/* Bottom: Main row */}
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="h-5 w-px bg-border shrink-0" />
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <HeaderIcon className="w-4 h-4 shrink-0 text-primary" />
                <h1 className="text-sm font-bold text-foreground truncate">
                  {COPY[mode].heroTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => router.push(`${basePath}/pending-jobs`)}
                className="flex items-center gap-2 rounded-full border border-border/60 hover:bg-muted/50 text-foreground/80 hover:text-foreground shadow-2xs font-semibold px-4 py-1.5 text-xs"
              >
                Show all pending jobs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Unlock Security Scan"
        description="Run comprehensive security scans on your AI systems to identify vulnerabilities and ensure compliance."
      />

      {/* Main Content - Full Width Max-W-6XL */}
      <div className="flex-1 px-6 md:px-8 py-8 w-full max-w-6xl mx-auto space-y-8">
        
        {/* Collapsible Info Hero Card with Gradient Fade */}
        <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <HeaderIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {COPY[mode].heroTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodologyExpanded(!isMethodologyExpanded)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-muted/60 dark:bg-zinc-800/80 hover:bg-muted border border-border/50 shadow-2xs"
              >
                <span>{isMethodologyExpanded ? "Show Less" : "Show Methodology"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMethodologyExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {COPY[mode].heroDescription}
            </p>
          </div>

          {/* Expandable Methodology Section */}
          <AnimatePresence initial={false}>
            {isMethodologyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="px-6 pb-6 pt-2 border-t border-border/50 space-y-6 text-xs sm:text-sm text-muted-foreground"
              >
                {mode === "api-testing" ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Overview & Pricing</p>
                      <p className="leading-relaxed">
                        This capability sends fairness prompts from MATUR to your own model endpoint. Your provider bills those calls. Each prompt replaces the <code className="px-1 py-0.5 rounded bg-muted font-mono text-foreground text-xs">{"{{prompt}}"}</code> token in your request template. We extract the final answer using your response path, then score bias, toxicity, relevancy, and faithfulness with automated evaluators and store the results for audits and regressions.
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground">How we analyze each response</p>
                      <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                        <li>A Google Gemini model scores bias, toxicity, relevancy, and faithfulness in one structured JSON response per answer.</li>
                        <li>When configured, a LangFair service call adds toxicity and stereotype signals. Bias and toxicity scores blend Gemini and LangFair so headline metrics are vendor independent.</li>
                        <li>Relevancy and faithfulness use the Gemini pass only. Overall score averages normalized bias, toxicity, relevancy, and faithfulness.</li>
                      </ul>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground">Verdict Bands</p>
                      <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                        <li><strong>Bias:</strong> Low below 0.3, Moderate up to 0.7, High above that threshold.</li>
                        <li><strong>Toxicity:</strong> Low below 0.2, Moderate up to 0.5, High above that threshold.</li>
                        <li><strong>Relevancy & Faithfulness:</strong> Highly rated at 0.7 and above, moderate down to 0.4, low below 0.4.</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Overview & Scope</p>
                      <p className="leading-relaxed">
                        This capability runs a curated library of adversarial probes against your own model endpoint. Each probe replaces the <code className="px-1 py-0.5 rounded bg-muted font-mono text-foreground text-xs">{"{{prompt}}"}</code> token in your request template. We capture the model output, score each answer for its security category, and store a report you can share for governance.
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground">Categories Tested</p>
                      <ul className="list-disc pl-5 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 leading-relaxed">
                        <li>Prompt injection & Jailbreak policy bypass</li>
                        <li>Data leakage & memory claims</li>
                        <li>Harmful or policy-violating output</li>
                        <li>Tool & privileged action abuse</li>
                        <li>Cross-tenant or authorization boundary escape</li>
                        <li>Indirect injection through hidden instructions</li>
                      </ul>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!isMethodologyExpanded && (
            <div className="h-4 bg-gradient-to-b from-transparent to-card/40 pointer-events-none" />
          )}
        </div>

        {/* Configuration Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-xs space-y-6"
        >
          <div className="border-b border-border/60 pb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-primary" />
              {COPY[mode].cardTitle}
            </h2>
            <button
              type="button"
              onClick={() => setShowGuideModal(!showGuideModal)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showGuideModal ? "Hide Examples" : "View Format Guide"}
            </button>
          </div>

          {/* Optional Format Guide Modal / Section */}
          <AnimatePresence>
            {showGuideModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {COPY[mode].howToTitle}
                  </h4>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">1. Request Body Template</p>
                    <p className="text-muted-foreground mb-2">Paste JSON payload with <code className="px-1 py-0.5 rounded bg-muted text-foreground">{"{{prompt}}"}</code> placeholder.</p>
                    <pre className="font-mono bg-background p-3 rounded-lg border border-border text-foreground">
                      {`{\n  "model": "gpt-4o-mini",\n  "messages": [\n    {\n      "role": "user",\n      "content": "{{prompt}}"\n    }\n  ]\n}`}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1.5">2. Response Output Path</p>
                    <p className="text-muted-foreground mb-2">Use dot & bracket notation to locate model text in JSON output.</p>
                    <pre className="font-mono bg-background p-3 rounded-lg border border-border text-foreground">
                      {`{\n  "choices": [\n    {\n      "message": {\n        "content": "Model answer..."\n      }\n    }\n  ]\n}\n// Path: choices[0].message.content`}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Endpoint URL Field */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label htmlFor="api-endpoint" className="text-xs font-semibold text-foreground">
                  {COPY[mode].endpointLabel}
                </label>
                <FieldInfoTooltip content="Your model HTTP POST endpoint URL that receives JSON payload." />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  id="api-endpoint"
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1/chat/completions"
                  disabled={jobStarting}
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors text-xs font-mono
                    bg-background text-foreground placeholder:text-muted-foreground/60
                    ${isValidUrl ? "border-input focus:border-primary" : "border-destructive focus:border-destructive"}
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
              </div>
              {!isValidUrl && apiEndpoint && (
                <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{urlError || "Please enter a valid public URL"}</span>
                </p>
              )}
            </div>

            {/* Request Body & Response Key Path Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Request Template */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="request-template" className="text-xs font-semibold text-foreground">
                      {COPY[mode].requestTemplateLabel}
                    </label>
                    <FieldInfoTooltip content={COPY[mode].requestTemplateHelper} />
                  </div>
                </div>
                <textarea
                  id="request-template"
                  value={requestTemplate}
                  onChange={(e) => setRequestTemplate(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  disabled={jobStarting}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg border transition-colors font-mono text-xs leading-relaxed resize-none min-h-[180px]
                    bg-background text-foreground placeholder:text-muted-foreground/60
                    ${templateError ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"}
                    focus:outline-none focus:ring-2 focus:ring-primary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
                {templateError && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {templateError}
                  </p>
                )}
              </div>

              {/* Response Key Path & Auth Section */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label htmlFor="response-key-path" className="text-xs font-semibold text-foreground">
                      {COPY[mode].responsePathLabel}
                    </label>
                    <FieldInfoTooltip content={COPY[mode].responsePathHelper} />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <input
                      id="response-key-path"
                      type="text"
                      value={responseKey}
                      onChange={(e) => setResponseKey(e.target.value)}
                      placeholder="choices[0].message.content"
                      disabled={jobStarting}
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors font-mono text-xs
                        bg-background text-foreground placeholder:text-muted-foreground/60
                        ${responseKeyError ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"}
                        focus:outline-none focus:ring-2 focus:ring-primary/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    />
                  </div>
                  {responseKeyError && (
                    <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {responseKeyError}
                    </p>
                  )}
                </div>

                {/* API Key Placement */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label htmlFor="api-key-placement" className="text-xs font-semibold text-foreground">
                      API Key Placement
                    </label>
                    <FieldInfoTooltip content="Choose how your API key is attached to backend requests." />
                  </div>
                  <div className="relative">
                    <select
                      id="api-key-placement"
                      value={apiKeyPlacement}
                      onChange={(e) => setApiKeyPlacement(e.target.value as ApiKeyPlacement)}
                      disabled={jobStarting}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-input focus:border-primary text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 bg-background appearance-none transition-colors"
                    >
                      {API_KEY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key & Optional Field Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label htmlFor="api-key-value" className="text-xs font-semibold text-foreground">
                    API Key Credential
                  </label>
                  <FieldInfoTooltip content="Your API key sent to backend for proxying evaluation calls." />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="api-key-value"
                    type="password"
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste provider API key"
                    disabled={jobStarting || apiKeyPlacement === "none"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input focus:border-primary text-xs bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
                {requiresApiKey && !trimmedApiKey && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    API key is required for selected placement option.
                  </p>
                )}
              </div>

              {["x_api_key", "query_param", "body_field"].includes(apiKeyPlacement) ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <label htmlFor="api-key-field-name" className="text-xs font-semibold text-foreground">
                      Custom Field Name
                    </label>
                    <FieldInfoTooltip content="Name of header, query param, or JSON property." />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                      <Tag className="w-4 h-4" />
                    </div>
                    <input
                      id="api-key-field-name"
                      type="text"
                      value={apiKeyFieldName}
                      onChange={(e) => setApiKeyFieldName(e.target.value)}
                      placeholder={API_KEY_FIELD_HINTS[apiKeyPlacement]}
                      disabled={jobStarting}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input focus:border-primary text-xs font-mono bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Config Summary Preview Box */}
            {(apiEndpoint || requestTemplate || responseKey) && (
              <div className="rounded-lg border border-border/80 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    API Configuration Summary
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                    {apiKeyPlacement === "none" ? "Public / No Key" : apiKeyPlacement.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Endpoint</span>
                    <span className="font-mono text-foreground truncate block bg-background px-2.5 py-1.5 rounded border border-border/60">
                      {apiEndpoint || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Response Path</span>
                    <span className="font-mono text-foreground truncate block bg-background px-2.5 py-1.5 rounded border border-border/60">
                      {responseKey || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-0.5">Auth Strategy</span>
                    <span className="font-mono text-foreground truncate block bg-background px-2.5 py-1.5 rounded border border-border/60">
                      {apiKeyPlacement === "none" ? "None" : `${apiKeyPlacement} (${trimmedApiKeyFieldName || API_KEY_FIELD_HINTS[apiKeyPlacement] || "default"})`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action CTA */}
            <div className="pt-4 flex flex-col items-center gap-3">
              {mode === "api-testing" ? (
                <Button
                  onClick={handleTestModel}
                  isLoading={jobStarting}
                  disabled={!canSubmit || jobStarting}
                  className="w-full sm:w-1/2 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {jobStarting ? (
                    "Scheduling..."
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Start Fairness Evaluation
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSecurityScan}
                  disabled={!canSubmit || jobStarting}
                  variant="default"
                  className="w-full sm:w-1/2 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {jobStarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Run Security Scan
                      {!isPremium && <Lock className="w-3.5 h-3.5 ml-1 text-amber-500" />}
                    </>
                  )}
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground text-center">
                {COPY[mode].instantQueueText}
              </p>

              {jobStartError && (
                <div className="w-full bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jobStartError}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* History Section */}
        <div className="pt-6 border-t border-border">
          <ApiHistory projectId={projectId} routeMode={mode === "vulnerability" ? "vulnerability" : "fairness"} />
        </div>
      </div>
    </div>
  );
}

