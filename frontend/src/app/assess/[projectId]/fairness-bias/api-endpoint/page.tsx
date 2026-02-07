"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ApiEndpointSkeleton } from "@/components/Skeleton";
import { ApiHistory } from "../api-history/components/ApiHistory";

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

export default function ApiEndpointPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const projectId = params.projectId as string;

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

  useEffect(() => {
    if (apiEndpoint) {
      try {
        new URL(apiEndpoint);
        setIsValidUrl(true);
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
      setTemplateError(`Insert at least one {{prompt}} placeholder to inject the fairness question.`);
      return;
    }

    try {
      JSON.parse(trimmed);
      setTemplateError(null);
    } catch {
      setTemplateError("Request template must be valid JSON.");
    }
  }, [requestTemplate]);

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

  const handleTestModel = async () => {
    const trimmedTemplate = requestTemplate.trim();
    if (
      !apiEndpoint ||
      !isValidUrl ||
      !responseKey.trim() ||
      !trimmedTemplate ||
      templateError ||
      (requiresApiKey && !trimmedApiKey)
    )
      return;

    setJobStartError(null);
    setJobStarting(true);

    try {
      const response = await apiService.startFairnessEvaluationJob({
        projectId,
        apiUrl: apiEndpoint,
        requestTemplate: trimmedTemplate,
        responseKey: responseKey.trim(),
        apiKey: trimmedApiKey || null,
        apiKeyPlacement,
        apiKeyFieldName: trimmedApiKeyFieldName || null,
      });
      console.log(response);

      router.push(`/assess/${projectId}/fairness-bias/api-endpoint/job/${response.jobId}`);
    } catch (error: any) {
      setJobStartError(error.message || "Failed to schedule evaluation");
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
          onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint/pending-jobs`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
        >
          Show all pending jobs
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
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
                Paste the exact JSON payload your API expects (POST). Use <code>{"{{prompt}}"}</code> anywhere you want us to inject each fairness prompt. We will replace it before sending the request.
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
                  API Key (secured locally)
                </label>
                <input
                  id="api-key-value"
                  type="text"
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
                  We only use this key when sending requests to your model. It is never logged or shared.
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
                  {apiKeyPlacement === "body_field" && " (We append an \"api_key\" property to your JSON body.)"}
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
                    <li>Use the <code>{"{{prompt}}"}</code> token wherever the fairness prompt should be inserted.</li>
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
                    <li>We will extract that string and feed it into the fairness evaluator.</li>
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

            <Button
              onClick={handleTestModel}
              isLoading={jobStarting}
              disabled={!canSubmit}
              className={`
                w-full py-6 rounded-xl font-semibold text-lg transition-all duration-200
                flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
              `}
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
            <p className="text-xs text-muted-foreground text-center">
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
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-6">
            <li>The backend creates a background job instantly and returns a job ID.</li>
            <li>You will land on a live progress page that polls every few seconds and hard-refreshes every 20 seconds.</li>
            <li>As soon as the job is done we redirect you to the Fairness &amp; Bias report automatically.</li>
          </ul>
        </motion.div>

        {/* History Section */}
        <div className="mt-12 pt-24 border-t border-border">
          <ApiHistory projectId={projectId} />
        </div>
      </div>
    </div>
  );
}

