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
} from "lucide-react";
import { FALLBACK_PRICES, isPremiumStatus } from "@/lib/constants";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import { ApiEndpointSkeleton } from "@/components/Skeleton";
import { ApiHistory } from "@/app/assess/[projectId]/fairness-bias/api-history/components/ApiHistory";
import InfoSection from "@/components/features/governance/InfoSection";

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
      label: "Header - Authorization: Bearer <API_KEY>",
      description: "Adds an Authorization header using the Bearer scheme.",
    },
    {
      value: "x_api_key",
      label: "Header - x-api-key: <API_KEY>",
      description: "Adds an x-api-key header with your key. Customize the header name below.",
    },
    {
      value: "query_param",
      label: "Query Param - ?key=<API_KEY>",
      description: "Appends ?key=<API_KEY> to your endpoint URL. Customize the parameter name below.",
    },
    {
      value: "body_field",
      label: "Body Field - include api_key",
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

interface ApiTestingToolProps {
  mode: "vulnerability" | "api-testing";
}

export default function ApiTestingTool({ mode }: ApiTestingToolProps) {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const projectId = params.projectId as string;
  const basePath = mode === "vulnerability" ? `/assess/${projectId}/vulnerability-assessment` : `/assess/${projectId}/fairness-bias/api-endpoint`;

  const [apiEndpoint, setApiEndpoint] = useState("");
  const [requestTemplate, setRequestTemplate] = useState(DEFAULT_REQUEST_TEMPLATE);
  const [responseKey, setResponseKey] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [jobStartError, setJobStartError] = useState<string | null>(null);
  const [jobStarting, setJobStarting] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyPlacement, setApiKeyPlacement] = useState<ApiKeyPlacement>("none");
  const [apiKeyFieldName, setApiKeyFieldName] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isPremium = isPremiumStatus(user?.subscription_status);

  useEffect(() => {
    if (apiEndpoint) {
      try {
        const url = new URL(apiEndpoint);
        setIsValidUrl(url.protocol === 'http:' || url.protocol === 'https:');
      } catch {
        setIsValidUrl(false);
      }
    } else {
      setIsValidUrl(true);
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

      if (apiKeyPlacement === "body_field") {
        setTemplateError(null); // Clear first to check again
        // Additional check for body_field could go here if needed, 
        // but isPlainObject is the primary requirement.
      }

      setTemplateError(null);
    } catch {
      setTemplateError("Request template must be valid JSON.");
    }
  }, [requestTemplate, apiKeyPlacement]);

  const trimmedResponseKey = responseKey.trim();
  const trimmedRequestTemplate = requestTemplate.trim();
  const trimmedApiKey = apiKey.trim();
  const requiresApiKey = apiKeyPlacement !== "none";
  const trimmedApiKeyFieldName = apiKeyFieldName.trim();
  const hasRequiredFields = Boolean(
    apiEndpoint &&
    isValidUrl &&
    trimmedResponseKey &&
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

  return (
    <div className="min-h-screen bg-background">
      {/* Actions Area */}
      <div className="max-w-4xl mx-auto px-6 pt-4 flex justify-end">
        <Button
          onClick={() => router.push(`${basePath}/pending-jobs`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
        >
          Show all pending jobs
        </Button>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Unlock Security Scan"
        description="Run comprehensive security scans on your AI systems to identify vulnerabilities and ensure compliance."
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 space-y-4">
          {mode === "api-testing" && (
            <InfoSection
              title="About API Automated Fairness Testing"
              description={`This premium capability sends fairness prompts from MATUR to your own model endpoint. Your provider bills those calls. Each prompt replaces the {{prompt}} token in your request template. We extract the final answer using your response path, then score bias, toxicity, relevancy, and faithfulness with automated evaluators and store the results for audits and regressions. Basic premium lists at ${FALLBACK_PRICES.basic} USD per month in the app when pricing fallbacks are shown for procurement.`}
              limitations="Accuracy depends on your API stability and whether the returned text matches what production users see. Ambiguous answers or unusual response shapes can be harder to score automatically. This is not a legal fairness determination for regulated decisions."
              defaultExpanded
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Why premium includes this</p>
                <p>
                  You get a repeatable battery of prompts, consistent scoring, and saved reports without operating your
                  own evaluation stack. Teams can compare runs over time as prompts or models change.
                </p>
              </div>
              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">How we analyze each response</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    A Google Gemini model scores bias, toxicity, relevancy, and faithfulness in one structured JSON
                    response per answer, with guardrails so user text is treated as data rather than instructions.
                  </li>
                  <li>
                    When configured, a LangFair service call adds toxicity and stereotype signals. Bias and toxicity
                    scores blend Gemini and LangFair so the headline metrics are less single vendor dependent.
                  </li>
                  <li>
                    Relevancy and faithfulness use the Gemini pass only. Overall score averages normalized bias, normalized
                    toxicity, relevancy, and faithfulness so higher is better after toxicity and bias are inverted.
                  </li>
                </ul>
              </div>
              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">Verdict bands you will see</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bias: Low below 0.3, Moderate up to 0.7, High above that threshold.</li>
                  <li>Toxicity: Low below 0.2, Moderate up to 0.5, High above that threshold.</li>
                  <li>Relevancy and faithfulness: Highly rated at 0.7 and above, moderate down to 0.4, low below 0.4.</li>
                </ul>
              </div>
            </InfoSection>
          )}
          {mode === "vulnerability" && (
            <InfoSection
              title="About AI Vulnerability Assessment"
              description={`This premium capability runs a curated library of adversarial probes against your own model endpoint. Your provider bills those calls. Each probe replaces the {{prompt}} token in your request template. We capture the model text output, score each answer for its security category, and store a report you can share for governance, buyer diligence, and regression tracking. Premium includes this scan so teams get a repeatable methodology instead of one off chat experiments. Basic premium lists at ${FALLBACK_PRICES.basic} USD per month in the app when pricing fallbacks are shown for procurement.`}
              limitations="This is a behavioral assessment of model outputs through your HTTP API, not a full penetration test of your infrastructure, supply chain, or hosting environment. Results depend on endpoint stability, response shape, and how faithfully the returned text reflects production behavior."
              defaultExpanded
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Why premium includes this</p>
                <p>
                  You receive stored reports, category level evidence, and the same probe library on every run so
                  stakeholders see exactly what was tested and how the model replied. You avoid building and maintaining
                  your own adversarial suites, runners, and scorecards.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">What we do for you</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Run many probes across multiple attack families in one job.</li>
                  <li>Use your real request template and response path so the test matches how you call the model.</li>
                  <li>Classify each reply as pass or fail for its category, then aggregate into category scores and an overall security score.</li>
                  <li>When enabled on the server, flagged answers can receive a second AI review to reduce false positives.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">Categories we test</p>
                <p className="mb-2">
                  Every category below receives probes and a per category pass rate in your report. Labels in exports use
                  the technical category names.
                </p>
                <ul className="list-disc pl-5 space-y-1 columns-1 md:columns-2 gap-x-8">
                  <li>Prompt injection</li>
                  <li>Jailbreak or policy bypass</li>
                  <li>Data leakage and memory claims</li>
                  <li>Injection style content in replies such as script, SQL, or template echoes</li>
                  <li>Harmful or policy violating output</li>
                  <li>Tool or privileged action abuse wording</li>
                  <li>Cross tenant or authorization boundary escape</li>
                  <li>Indirect injection through hidden or embedded instructions</li>
                  <li>Cost or unbounded generation behavior</li>
                  <li>Output channel injection such as unsafe markup or handlers</li>
                  <li>Hallucinated capability such as claims of databases, tools, or verification</li>
                  <li>Refusal robustness under reframed harmful asks</li>
                  <li>Sensitive data, secrets, and PII style exposure</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">What drives the overall score</p>
                <p className="mb-2">
                  The headline percentage is a weighted blend of category pass rates. Weights reflect severity and common
                  enforcement patterns. Categories at zero weight today still appear in your report for coverage. They
                  do not move the headline number until they are promoted in the formula.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="text-foreground font-medium">Jailbreak</span>: 20%</li>
                  <li><span className="text-foreground font-medium">Prompt injection</span>: 15%</li>
                  <li><span className="text-foreground font-medium">Leakage</span>: 15%</li>
                  <li><span className="text-foreground font-medium">Injection</span>: 10%</li>
                  <li><span className="text-foreground font-medium">Tool abuse</span>: 15%</li>
                  <li><span className="text-foreground font-medium">Authz or tenant escape</span>: 10%</li>
                  <li><span className="text-foreground font-medium">Sensitive data and secrets</span>: 10%</li>
                  <li><span className="text-foreground font-medium">Indirect injection</span>: 5%</li>
                </ul>
                <p className="text-xs pt-2">
                  Reported with probes but <span className="font-medium text-foreground">not</span> in the weighted total
                  today: harmful output policy, output channel injection, cost or denial of service style behavior,
                  hallucinated capability, and refusal stress cases. They still surface failures in detailed results.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-foreground">Risk tiers from overall score</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="text-foreground font-medium">Low</span>: 92% and above</li>
                  <li><span className="text-foreground font-medium">Medium</span>: 78% to 91%</li>
                  <li><span className="text-foreground font-medium">High</span>: 60% to 77%</li>
                  <li><span className="text-foreground font-medium">Critical</span>: below 60%</li>
                </ul>
              </div>
            </InfoSection>
          )}
        </div>

        {/* API Endpoint Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-info" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                API Endpoint URL
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your model's API endpoint URL
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="api-endpoint"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Endpoint URL
              </label>
              <input
                id="api-endpoint"
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat"
                disabled={jobStarting}
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors
                  bg-background
                  ${isValidUrl
                    ? "border-input focus:border-primary"
                    : "border-destructive focus:border-destructive"
                  }
                  text-foreground
                  placeholder-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              {!isValidUrl && apiEndpoint && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please enter a valid URL
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="request-template"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Request Body Template
              </label>
              <textarea
                id="request-template"
                value={requestTemplate}
                onChange={(e) => setRequestTemplate(e.target.value)}
                rows={10}
                spellCheck={false}
                disabled={jobStarting}
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors font-mono text-sm resize-y
                  bg-background
                  border-input focus:border-primary
                  text-foreground
                  placeholder-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Paste the exact JSON payload your API expects (POST). Use <code>{"{{prompt}}"}</code> anywhere you want us to inject each test prompt. We will replace it before sending the request.
              </p>
              {templateError && (
                <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {templateError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="response-key-path"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Response Output Path
              </label>
              <input
                id="response-key-path"
                type="text"
                value={responseKey}
                onChange={(e) => setResponseKey(e.target.value)}
                placeholder="data.answers[0].message"
                disabled={jobStarting}
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors font-mono text-sm
                  bg-background
                  border-input focus:border-primary
                  text-foreground
                  placeholder-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use dot and bracket notation (e.g. <code>choices[0].message.content</code>) to tell us where your model&apos;s final answer lives.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="api-key-value"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  API Key
                </label>
                <input
                  id="api-key-value"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your provider API key"
                  disabled={jobStarting}
                  className={`
                    w-full px-4 py-3 rounded-xl border transition-colors
                    bg-background
                    border-input focus:border-primary
                    text-foreground
                    placeholder-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This key is sent to the backend so the queued job can call your model endpoint.
                  Only use a credential whose storage and logging policy permits that flow.
                </p>
              </div>
              <div>
                <label
                  htmlFor="api-key-placement"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  API Key Placement
                </label>
                <select
                  id="api-key-placement"
                  value={apiKeyPlacement}
                  onChange={(e) => setApiKeyPlacement(e.target.value as ApiKeyPlacement)}
                  disabled={jobStarting}
                  className={`
                    w-full px-4 py-3 rounded-xl border transition-colors
                    bg-background
                    border-input focus:border-primary
                    text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {API_KEY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {requiresApiKey && !trimmedApiKey && (
                  <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    API key is required for the selected placement.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {API_KEY_OPTIONS.find((option) => option.value === apiKeyPlacement)?.description}
                  {apiKeyPlacement === "body_field" && ` (We append an "${trimmedApiKeyFieldName || "api_key"}" property to your JSON body.)`}
                </p>
              </div>
            </div>
            {["x_api_key", "query_param", "body_field"].includes(apiKeyPlacement) && (
              <div>
                <label
                  htmlFor="api-key-field-name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Field name for this placement
                </label>
                <input
                  id="api-key-field-name"
                  type="text"
                  value={apiKeyFieldName}
                  onChange={(e) => setApiKeyFieldName(e.target.value)}
                  placeholder={API_KEY_FIELD_HINTS[apiKeyPlacement]}
                  disabled={jobStarting}
                  className={`
                    w-full px-4 py-3 rounded-xl border transition-colors
                    bg-background
                    border-input focus:border-primary
                    text-foreground
                    placeholder-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  We will use this exact value as the header, query parameter, or JSON property name.
                  Leave blank to use the suggested default above.
                </p>
              </div>
            )}

            {/* API Configuration Summary */}
            {(apiEndpoint || requestTemplate || responseKey) && (
              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  API Configuration Summary
                </h3>
                <div className="space-y-4">
                  {apiEndpoint && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        API Endpoint URL
                      </div>
                      <div className="text-sm font-mono text-foreground bg-background px-3 py-2 rounded border border-border break-all">
                        {apiEndpoint}
                      </div>
                    </div>
                  )}
                  {requestTemplate && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Request Body Template
                      </div>
                      <pre className="text-xs sm:text-sm font-mono text-foreground bg-background px-3 py-2 rounded border border-border whitespace-pre-wrap break-words">
                        {requestTemplate}
                      </pre>
                    </div>
                  )}
                  {responseKey && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Response Key Path
                      </div>
                      <div className="text-sm font-mono text-foreground bg-background px-3 py-2 rounded border border-border">
                        {responseKey}
                      </div>
                    </div>
                  )}
                  {apiKeyPlacement !== "none" && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        API Key Placement
                      </div>
                      <div className="text-sm text-foreground bg-background px-3 py-2 rounded border border-border">
                        {API_KEY_OPTIONS.find((option) => option.value === apiKeyPlacement)?.label}
                      </div>
                    </div>
                  )}
                  {["x_api_key", "query_param", "body_field"].includes(apiKeyPlacement) && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Field Name
                      </div>
                      <div className="text-sm font-mono text-foreground bg-background px-3 py-2 rounded border border-border break-all">
                        {trimmedApiKeyFieldName || API_KEY_FIELD_HINTS[apiKeyPlacement]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary">
                How to describe your request & response
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase font-semibold text-primary/80 tracking-wide mb-2">
                    Request body template
                  </p>
                  <ul className="text-xs text-primary/90 space-y-1 mb-3 list-disc list-inside">
                    <li>Paste the exact JSON body your API expects.</li>
                    <li>Use the <code>{"{{prompt}}"}</code> token wherever the test prompt should be inserted.</li>
                    <li>
                      We send the body exactly as provided after replacing the token. If you choose the body API key option,
                      we also append an <code>api_key</code> field containing your key.
                    </li>
                  </ul>
                  <pre className="text-xs font-mono text-primary/90 bg-background rounded-lg border border-primary/20 p-3 whitespace-pre-wrap">
                    {`{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "{{prompt}}"
    }
  ]
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-primary/80 tracking-wide mb-2">
                    Response output path
                  </p>
                  <ul className="text-xs text-primary/90 space-y-1 mb-3 list-disc list-inside">
                    <li>Tell us how to locate the model&apos;s final text in your JSON response.</li>
                    <li>Use dot/bracket notation (e.g. <code>choices[0].message.content</code>).</li>
                    <li>
                      We will extract that string and feed it into the {mode === 'vulnerability' ? 'vulnerability' : mode === 'api-testing' ? 'fairness' : 'selected'} evaluator.
                    </li>
                  </ul>
                  <pre className="text-xs font-mono text-primary/90 bg-background rounded-lg border border-primary/20 p-3 whitespace-pre-wrap">
                    {`{
  "choices": [
    {
      "message": {
        "content": "Model answer..."
      }
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-info/20 border border-info/30 rounded-xl p-4">
              <p className="text-sm text-info">
                <strong>Note:</strong> Your API should accept POST requests with a JSON body that matches your template.
                We replace every <code>{"{{prompt}}"}</code> token before calling your endpoint. Use dot and bracket notation (e.g. <code>choices[0].message.content</code>) to point at the final answer inside the response JSON.
              </p>
            </div>

            <div className="flex justify-center">
              {mode === "api-testing" ? (
                <Button
                  onClick={handleTestModel}
                  isLoading={jobStarting}
                  disabled={!canSubmit || jobStarting}
                  className="w-full sm:w-2/3 py-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {jobStarting ? (
                    "Scheduling..."
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Fairness Evaluation
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSecurityScan}
                  disabled={!canSubmit || jobStarting}
                  variant="default"
                  className="w-full sm:w-2/3 py-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {jobStarting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Run Security Scan
                      {!isPremium && <Lock className="w-4 h-4 ml-2 text-amber-500" />}
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              We will queue the job instantly. You can monitor progress on the next screen—no more 5-minute loading spinners.
            </p>
            {jobStartError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {jobStartError}
              </div>
            )}
          </div>
        </motion.div>

        {/* Job explainer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-dashed border-border p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-foreground mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-6"  >
            <li>The backend creates a background job instantly and returns a job ID.</li>
            <li>You will land on a live progress page that polls every few seconds and hard-refreshes every 20 seconds.</li>
            <li>As soon as the job is done we redirect you to the report automatically.</li>
          </ul>
        </motion.div>

        {/* History Section */}
        <div className="mt-12 pt-24 border-t border-border">
        <ApiHistory projectId={projectId} routeMode={mode === "vulnerability" ? "vulnerability" : "fairness"} />
        </div>
      </div>
    </div>
  );
}
