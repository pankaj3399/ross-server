// API Automated Testing path of Bias & Fairness Testing
// (/assess/<id>/fairness-bias/api-endpoint), backed by the same
// ApiTestingTool component as vulnerability-assessment.page.js (mode
// "api-testing" here vs "vulnerability" there) — same field ids, different
// submit button label and base route.

// A deliberately stereotyped "model response" (gender + occupation), used the
// same way vulnerability-assessment.spec.js uses its canned refusal: a fixed,
// known-content answer that httpbin.org/post echoes back verbatim, letting
// the test assert the bias detector actually flags an obvious stereotype
// rather than just checking that a job runs to completion.
const STEREOTYPED_RESPONSE =
  "As a nurse, she is naturally caring and gentle, while as an engineer, he is naturally logical and better with numbers.";

class FairnessApiEndpointPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByText("API Automated Fairness Testing", { exact: true }).first();

    this.endpointInput = page.locator("#api-endpoint");
    this.requestTemplateInput = page.locator("#request-template");
    this.responseKeyInput = page.locator("#response-key-path");

    this.startButton = page.getByRole("button", { name: "Start Fairness Evaluation", exact: true });
    // ApiTestingTool.tsx's handleTestModel (the handler this mode uses) falls
    // back to exactly this string when the caught error has no `.message` —
    // the mode="vulnerability" page has a different fallback string, so this
    // one doesn't need to match both.
    this.jobStartError = page.getByText("Failed to schedule evaluation", { exact: true });

    // ApiHistory.tsx renders "API Test History" for routeMode="fairness"
    // (vs "Vulnerability Scan History" for the other mode).
    this.historyHeading = page.getByText("API Test History", { exact: true }).first();
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias/api-endpoint`, { waitUntil: "domcontentloaded" });
    await this.endpointInput.waitFor({ timeout: 30_000 });
  }

  async configure({
    url = "https://httpbin.org/post",
    requestTemplate = `{\n  "prompt": "{{prompt}}",\n  "model_response": "${STEREOTYPED_RESPONSE}"\n}`,
    responseKey = "json.model_response",
  } = {}) {
    await this.endpointInput.fill(url);
    if (requestTemplate) {
      await this.requestTemplateInput.fill(requestTemplate);
    }
    await this.responseKeyInput.fill(responseKey);
  }

  async startTest() {
    await this.startButton.isEnabled({ timeout: 15_000 });
    await this.startButton.click();
    await this.page.waitForURL(/\/fairness-bias\/api-endpoint\/job\/[\w-]+/i, { timeout: 30_000 });
    const match = this.page.url().match(/\/job\/([\w-]+)/i);
    return match ? match[1] : null;
  }
}

class FairnessApiHistoryDetailPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByText("API Report Details", { exact: true });
    this.avgOverallScoreLabel = page.getByText("Avg Overall Score", { exact: true });
    this.avgBiasScoreLabel = page.getByText("Avg Bias Score", { exact: true });
  }

  async goto(projectId, reportId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias/api-history/${reportId}`, { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }

  valueAfter(labelLocator) {
    return labelLocator.locator("xpath=following-sibling::div").first();
  }
}

module.exports = { FairnessApiEndpointPage, FairnessApiHistoryDetailPage, STEREOTYPED_RESPONSE };
