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
 * Preserves spaces and line breaks so words/table cells do not get squished together.
 */
export function extractTextFromDocx(buffer: Buffer): { text: string; error?: string } {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const docEntry = zipEntries.find(
      (entry) => entry.entryName === "word/document.xml"
    );
    if (!docEntry) {
      return { text: "" };
    }
    if (docEntry.header.size > MAX_ZIP_UNCOMPRESSED_SIZE) {
      return { text: "", error: "The uncompressed DOCX document size exceeds the limit (100MB)." };
    }
    const xml = docEntry.getData().toString("utf-8");

    // Replace structural OpenXML tags with spaces/newlines to avoid word merging
    const formattedXml = xml
      .replace(/<\/w:p>/gi, "\n")
      .replace(/<\/w:tr>/gi, "\n")
      .replace(/<\/w:tc>/gi, " | ")
      .replace(/<w:br\s*\/?>/gi, "\n")
      .replace(/<w:tab\s*\/?>/gi, "\t");

    // Strip remaining tags with space padding so adjacent run text doesn't merge
    const text = formattedXml
      .replace(/<[^>]+>/g, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#39;/g, "'");

    // Normalize spacing per line while preserving structural newlines
    const cleanLines = text
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter((line) => line.length > 0);

    return { text: cleanLines.join("\n") };
  } catch (err) {
    console.error("[evidenceParser] Failed to extract text from docx:", err);
    return { text: "", error: "Failed to parse DOCX document structure." };
  }
}

/**
 * Extracts text streams from a PDF file buffer natively.
 */
export function extractTextFromPdf(buffer: Buffer): { text: string; error?: string } {
  try {
    const pdfStr = buffer.toString("binary");
    const textMatches: string[] = [];

    // Match text inside parenthesis (text) Tj / TJ or stream text blocks
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g;
    let match: RegExpExecArray | null;

    while ((match = tjRegex.exec(pdfStr)) !== null) {
      let rawText = match[1];
      // Decode PDF escape characters
      rawText = rawText
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));

      if (rawText.trim().length > 0) {
        textMatches.push(rawText);
      }
    }

    // Fallback: search for Array TJ text blocks `[(string)...] TJ`
    if (textMatches.length < 5) {
      const arrayTjRegex = /\[\s*((?:\([^()\\]*(?:\\.[^()\\]*)*\)\s*|[-0-9\s]+)+)\]\s*TJ/g;
      while ((match = arrayTjRegex.exec(pdfStr)) !== null) {
        const innerStr = match[1];
        const stringParts = innerStr.match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g);
        if (stringParts) {
          const joined = stringParts
            .map((s) => s.slice(1, -1).replace(/\\\(/g, "(").replace(/\\\)/g, ")"))
            .join("");
          if (joined.trim().length > 0) {
            textMatches.push(joined);
          }
        }
      }
    }

    const rawResult = textMatches.join(" ").replace(/[ \t]+/g, " ");
    const cleanLines = rawResult
      .split(/(?:\r?\n)+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return { text: cleanLines.join("\n") };
  } catch (err) {
    console.error("[evidenceParser] Failed to extract text from PDF:", err);
    return { text: "", error: "Failed to parse PDF content stream." };
  }
}

/**
 * Converts raw HTML string (e.g. web page or Google Docs publish link) to clean plain text.
 */
export function extractTextFromHtml(html: string): string {
  if (!html) return "";

  // Strip script and style blocks
  let cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Insert line breaks for block tags
  cleanHtml = cleanHtml
    .replace(/<\/(p|div|h[1-6]|li|tr|article|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>/gi, " | ");

  // Strip remaining HTML tags
  const text = cleanHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

  const lines = text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l) => l.length > 0);

  return lines.join("\n");
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
    const isDocx = filename ? /\.docx$/i.test(filename) : true;
    const isPdf = filename ? /\.pdf$/i.test(filename) : false;
    const isTextFile = filename ? /\.(txt|md|json|log|csv)$/i.test(filename) : false;

    if (isDocx && !isPdf && !isTextFile) {
      const docxResult = extractTextFromDocx(fileBuffer);
      if (docxResult.error) {
        return {
          success: false,
          extractedTextLength: 0,
          extractedSnippet: "",
          unfilledPlaceholders: [],
          isValidTemplate: false,
          missingRequirements: evidenceRequirements,
          matchedRequirements: [],
          validationErrors: [docxResult.error],
          validationWarnings: [],
          score: 0,
        };
      }
      extractedText = docxResult.text;
    } else if (isPdf) {
      const pdfResult = extractTextFromPdf(fileBuffer);
      extractedText = pdfResult.text;
    } else if (isTextFile) {
      extractedText = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    } else {
      // Try docx parsing first, then fallback to string
      const docxResult = extractTextFromDocx(fileBuffer);
      if (docxResult.text && docxResult.text.length > 10) {
        extractedText = docxResult.text;
      } else {
        extractedText = fileBuffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }
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
      `Unfilled template placeholders detected (${unfilledPlaceholders.length}): ${unfilledPlaceholders.slice(0, 3).join(", ")}${unfilledPlaceholders.length > 3 ? "..." : ""}. Please complete all bracketed sections.`
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
    if (
      reqWords.length === 0 ||
      lowerText.includes(req.toLowerCase().slice(0, 30)) ||
      (reqWords.length > 0 && matchCount / reqWords.length >= 0.4)
    ) {
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

/**
 * Fetches content from an Evidence URL (e.g. UploadThing URL, Google Docs link, PDF, DOCX, or web link)
 * and evaluates its content against evidence requirements.
 */
export async function fetchAndParseEvidenceFromUrl(
  url: string,
  evidenceRequirements: string[] = []
): Promise<EvidenceParsingResult> {
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) {
    return {
      success: false,
      extractedTextLength: 0,
      extractedSnippet: "",
      unfilledPlaceholders: [],
      isValidTemplate: false,
      missingRequirements: evidenceRequirements,
      matchedRequirements: [],
      validationErrors: ["Invalid HTTPS Evidence URL format."],
      validationWarnings: [],
      score: 0,
    };
  }

  const cleanUrl = url.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MATUR.ai EvidenceValidator/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        extractedTextLength: 0,
        extractedSnippet: "",
        unfilledPlaceholders: [],
        isValidTemplate: false,
        missingRequirements: evidenceRequirements,
        matchedRequirements: [],
        validationErrors: [`Unable to access Evidence URL (HTTP ${response.status}). Please verify link access permissions.`],
        validationWarnings: [],
        score: 0,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const isDocx = /\.docx/i.test(cleanUrl) || /officedocument\.wordprocessingml/i.test(contentType);
    const isPdf = /\.pdf/i.test(cleanUrl) || /application\/pdf/i.test(contentType);

    if (isDocx || isPdf) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = isDocx ? "evidence.docx" : "evidence.pdf";
      return parseAndValidateEvidence(buffer, null, filename, evidenceRequirements);
    } else {
      const textContent = await response.text();
      const isHtml = /<html|<body|<div|<p/i.test(textContent);
      const parsedText = isHtml ? extractTextFromHtml(textContent) : textContent;
      return parseAndValidateEvidence(null, parsedText, "evidence.txt", evidenceRequirements);
    }
  } catch (err: any) {
    console.error("[evidenceParser] Failed to fetch and parse URL:", err);
    return {
      success: false,
      extractedTextLength: 0,
      extractedSnippet: "",
      unfilledPlaceholders: [],
      isValidTemplate: false,
      missingRequirements: evidenceRequirements,
      matchedRequirements: [],
      validationErrors: [`Failed to load or parse URL content: ${err.message || "Network error"}`],
      validationWarnings: [],
      score: 0,
    };
  }
}
