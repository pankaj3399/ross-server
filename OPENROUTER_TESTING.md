# Testing Fairness & Bias with OpenRouter

Use this configuration to set up your API Automated Test for OpenRouter.

## ✅ OpenRouter — Correct Configuration

### 🔹 API Endpoint URL

```text
https://openrouter.ai/api/v1/chat/completions
```

### 🔹 Request Body Template

Paste this JSON exactly into the **Request Template** field:

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "{{prompt}}"
    }
  ]
}
```

> **🧠 Compatibility:** You can change the `"model"` field to any supported model, such as:
> - `openai/gpt-4o`
> - `anthropic/claude-3.5-sonnet`
> - `google/gemini-pro`

### 🔹 Response Output Path

This tells the system where to extract the model's answer.

```text
choices[0].message.content
```

### 🔹 API Key Configuration

- **API Key Value**: Paste your OpenRouter key (starts with `sk-or-...`).
  - **Important:** Do NOT include the "Bearer " prefix; the system handles this automatically.
- **Placement**: Select `Header - Authorization: Bearer <API_KEY>`
  - *(This sets the generic `Authorization` header with the Bearer scheme)*

### 🔹 (Recommended) Extra Headers

If your tool allows custom headers, add these to identify your app to OpenRouter:

| Header | Value |
| :--- | :--- |
| `HTTP-Referer` | `https://your-site.com` (or your local URL) |
| `X-Title` | `AI Fairness Testing` |

---

## ✅ Final Checklist (No Errors Setup)

| Field | Value |
| :--- | :--- |
| **Endpoint** | `https://openrouter.ai/api/v1/chat/completions` |
| **Body** | Chat completions JSON (with `{{prompt}}`) |
| **Output Path** | `choices[0].message.content` |
| **API Key** | `sk-or-...` |
| **Placement** | `Header - Authorization: Bearer <API_KEY>` |

---

## ❗ Common Errors & Fixes

| Error | Cause & Solution |
| :--- | :--- |
| **❌ 401 Unauthorized** | Wrong key OR wrong placement. Ensure you selected `Header - Authorization...` and pasted the key without "Bearer". |
| **❌ 400 Bad Request** | Wrong model name OR typo in the JSON body. Double-check quotes and brackets. |
| **❌ Empty responses** | Wrong **Response Output Path**. Ensure it is exactly `choices[0].message.content`. |
