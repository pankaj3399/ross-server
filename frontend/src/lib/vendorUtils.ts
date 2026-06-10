// MIRROR of backend/src/data/vendorPrefills.ts (normalizeProviderKey) — keep both in sync until
// this monorepo gains a real shared package. The two files MUST hold the
// exact same provider normalization logic.
export function normalizeProviderKey(provider: string): string | null {
  const normalized = provider.toLowerCase().trim();

  // Rules evaluated in order of precedence
  const rules = [
    // openai (must not contain azure)
    {
      match: (p: string) => p.includes("openai") && !p.includes("azure"),
      key: "openai"
    },
    // anthropic
    {
      match: (p: string) => p.includes("anthropic"),
      key: "anthropic"
    },
    // google or gemini
    {
      match: (p: string) => p.includes("google") || p.includes("gemini"),
      key: "google"
    },
    // aws bedrock
    {
      match: (p: string) => p.includes("aws") || p.includes("bedrock"),
      key: "aws bedrock"
    },
    // azure openai
    {
      match: (p: string) => p.includes("azure") || (p.includes("microsoft") && p.includes("openai")),
      key: "azure openai"
    },
    // microsoft
    {
      match: (p: string) => p.includes("microsoft"),
      key: "microsoft"
    },
    // cohere
    {
      match: (p: string) => p.includes("cohere"),
      key: "cohere"
    }
  ];

  for (const rule of rules) {
    if (rule.match(normalized)) {
      return rule.key;
    }
  }

  return null;
}
