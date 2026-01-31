# Testing Fairness & Bias with OpenRouter

Use this configuration to set up your API Automated Test for OpenRouter.

## ✅ OpenRouter — Correct Configuration

### 🔹 API Endpoint URL
```
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
> **Tip:** You can change the `"model"` field to any supported model, such as:
> - `openai/gpt-4o`
> - `anthropic/claude-3.5-sonnet`
> - `google/gemini-pro`

### 🔹 Response Output Path
This tells the system where to extract the model's answer.
```
choices[0].message.content
```

### 🔹 API Key Configuration
- **API Key Value**: Paste your OpenRouter key (starts with `sk-or-...`).
  - *Note: If the system requires the full header value, format it as `Bearer sk-or-...`*
- **Placement**: `Header`
- **Header Name**: `Authorization`

### 🔹 (Recommended) Extra Headers
If custom headers are supported, add these to identify your app to OpenRouter:

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
| **Placement** | `Header` |

---

## ❗ Common Errors & Fixes

| Error | Cause & Solution |
| :--- | :--- |
| **❌ 401 Unauthorized** | Wrong API key OR not set as Header. Ensure `Bearer` prefix is included if required. |
| **❌ 400 Bad Request** | Wrong model name OR typo in the JSON body. Double-check quotes and brackets. |
| **❌ Empty responses** | Wrong **Response Output Path**. Ensure it is exactly `choices[0].message.content`. |
