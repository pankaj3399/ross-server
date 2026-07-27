import AdmZip from "adm-zip";

export const MAX_ZIP_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB

export interface EvidenceParsingResult {
  success: boolean;
  extractedTextLength: number;
  extractedSnippet: string;
  unfilledPlaceholders: string[];
  isValidTemplate: boolean;
  missingRequirements: string[];
  matchedRequirements: string[];
  validationErrors: string[];
  validationWarnings: string[];
  score: number; // 0 - 100
}

/**
 * Extracts clean plain text from a Word .docx file buffer using AdmZip and XML parsing.
 */
export function extractTextFromDocx(buffer: Buffer): string {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const docEntry = zipEntries.find(
      (entry) => entry.entryName === "word/document.xml"
    );
    if (!docEntry || docEntry.header.size > MAX_ZIP_UNCOMPRESSED_SIZE) {
      return "";
    }
    const xml = docEntry.getData().toString("utf-8");

    // Replace paragraph break tags with newlines and strip remaining XML tags
    const text = xml
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    return text.replace(/\n\s*\n/g, "\n").trim();
  } catch (err) {
    console.error("[evidenceParser] Failed to extract text from docx:", err);
    return "";
  }
}

/**
 * Parses evidence document buffer or string and validates template placeholders & evidence requirements.
 */
export function parseAndValidateEvidence(
  fileBuffer: Buffer | null,
  rawTextInput: string | null,
  filename: string | null,
  evidenceRequirements: string[] = []
): EvidenceParsingResult {
  let extractedText = "";

  if (rawTextInput && rawTextInput.trim().length > 0) {
    extractedText = rawTextInput.trim();
  } else if (fileBuffer && fileBuffer.length > 0) {
    const isDocx = filename ? /\.docx$/i.test(filename) : false;
    const isTextFile = filename ? /\.(txt|md)$/i.test(filename) : false;
    const isNonDocxBinary = filename ? /\.(pdf|doc)$/i.test(filename) : false;

    if (isDocx || (!filename && !isTextFile)) {
      extractedText = extractTextFromDocx(fileBuffer);
    }
    if (!extractedText) {
      if (isNonDocxBinary) {
        return {
          success: false,
          extractedTextLength: 0,
          extractedSnippet: "",
          unfilledPlaceholders: [],
          isValidTemplate: false,
          missingRequirements: evidenceRequirements,
          matchedRequirements: [],
          validationErrors: [
            `Parsing text from ${filename || "this binary format"} is not supported. Please upload a .docx or plain text file.`,
          ],
          validationWarnings: [],
          score: 0,
        };
      }
      extractedText = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }

  const cleanText = extractedText.trim();
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  const unfilledPlaceholders: string[] = [];

  // Check 1: Minimum content length
  if (cleanText.length < 50) {
    validationErrors.push(
      "The evidence document is empty or contains insufficient content (minimum 50 characters required)."
    );
  }

  // Check 2: Unfilled template placeholders (e.g. [Insert ...], <Fill in ...>, [TODO], [TBD])
  const placeholderRegexes = [
    /\[(?:Insert|Fill\s+in|Your\s+Organization|Company\s+Name|Insert\s+Name|Insert\s+Date|TODO|TBD|REQUIRED|Select\s+One)[^\]]*\]/gi,
    /<(?:Insert|Fill\s+in|Your\s+Organization|Company\s+Name|Insert\s+Name|Insert\s+Date|TODO|TBD|REQUIRED)[^>]*>/gi,
    /\[\s*Insert\s+[^\]]+\s*\]/gi,
  ];

  for (const regex of placeholderRegexes) {
    const matches = cleanText.match(regex);
    if (matches) {
      for (const match of matches) {
        if (!unfilledPlaceholders.includes(match)) {
          unfilledPlaceholders.push(match);
        }
      }
    }
  }

  if (unfilledPlaceholders.length > 0) {
    validationErrors.push(
      `Unfilled template placeholders detected (${unfilledPlaceholders.length}): ${unfilledPlaceholders.slice(0, 3).join(", ")}${unfilledPlaceholders.length > 3 ? "..." : ""}. Please complete all bracketed sections before uploading.`
    );
  }

  // Check 3: Check against expected evidence requirements
  const matchedRequirements: string[] = [];
  const missingRequirements: string[] = [];

  const lowerText = cleanText.toLowerCase();

  for (const req of evidenceRequirements) {
    if (!req || req.trim().length === 0) continue;
    const reqWords = req
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let matchCount = 0;
    for (const word of reqWords) {
      if (lowerText.includes(word)) {
        matchCount++;
      }
    }

    // If at least 40% of key words match or req phrase exists
    if (reqWords.length === 0 || lowerText.includes(req.toLowerCase().slice(0, 30)) || (matchCount / reqWords.length) >= 0.4) {
      matchedRequirements.push(req);
    } else {
      missingRequirements.push(req);
    }
  }

  if (missingRequirements.length > 0 && evidenceRequirements.length > 0) {
    validationWarnings.push(
      `Document may be missing key evidence items: ${missingRequirements.slice(0, 2).join("; ")}`
    );
  }

  // Scoring
  let score = 100;
  if (validationErrors.length > 0) {
    score -= validationErrors.length * 35;
  }
  if (unfilledPlaceholders.length > 0) {
    score -= unfilledPlaceholders.length * 15;
  }
  if (evidenceRequirements.length > 0) {
    const requirementRatio = matchedRequirements.length / evidenceRequirements.length;
    score = Math.round(score * (0.5 + 0.5 * requirementRatio));
  }
  score = Math.max(0, Math.min(100, score));

  const isValidTemplate = validationErrors.length === 0 && unfilledPlaceholders.length === 0;

  return {
    success: true,
    extractedTextLength: cleanText.length,
    extractedSnippet: cleanText.slice(0, 400),
    unfilledPlaceholders,
    isValidTemplate,
    missingRequirements,
    matchedRequirements,
    validationErrors,
    validationWarnings,
    score,
  };
}
