import { callClaude } from "./anthropicClient";

/**
 * Validates a generated AI narrative against rules and the original section data.
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    cleanedNarrative: string;
}

/**
 * Recursively extracts all numbers (numbers and strings that represent numbers) from an object.
 */
function extractNumbersFromData(data: any): Set<number> {
    const numbers = new Set<number>();
    
    function traverse(val: any) {
        if (val === null || val === undefined) return;
        if (typeof val === "number") {
            numbers.add(val);
            // Also add rounded/integer versions
            numbers.add(Math.round(val));
            numbers.add(Math.floor(val));
            numbers.add(Math.ceil(val));
        } else if (typeof val === "string") {
            const parsed = parseFloat(val.replace(/%$/, ""));
            if (!isNaN(parsed)) {
                numbers.add(parsed);
                numbers.add(Math.round(parsed));
                numbers.add(Math.floor(parsed));
                numbers.add(Math.ceil(parsed));
            }
            // Check if there are numbers embedded in the string
            const matches = val.match(/\d+(?:\.\d+)?/g);
            if (matches) {
                matches.forEach(m => {
                    const p = parseFloat(m);
                    if (!isNaN(p)) {
                        numbers.add(p);
                        numbers.add(Math.round(p));
                    }
                });
            }
        } else if (Array.isArray(val)) {
            val.forEach(item => traverse(item));
        } else if (typeof val === "object") {
            Object.values(val).forEach(v => traverse(v));
        }
    }
    
    traverse(data);
    return numbers;
}

/**
 * Truncates narrative to a maximum of 6 sentences.
 */
export function limitSentences(text: string, maxSentences = 6): string {
    if (!text) return "";
    // Regex split by sentence endings followed by space or end of string
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    if (sentences.length <= maxSentences) {
        return text.trim();
    }
    return sentences.slice(0, maxSentences).join("").trim();
}

/**
 * Performs post-generation validation on a narrative text.
 */
export function validateNarrative(
    narrative: string,
    sectionData: any,
    projectName = ""
): ValidationResult {
    const errors: string[] = [];
    const cleanedNarrative = limitSentences(narrative, 6);

    const serializedData = JSON.stringify(sectionData).toLowerCase();

    // 1. Forbidden Words Check
    // "certified," "audited by MATUR," "verified," "compliant," "compliance achieved," "fully compliant"
    const forbiddenWords = [
        "certified",
        "audited by matur",
        "verified",
        "compliant",
        "compliance achieved",
        "fully compliant"
    ];

    const lowerNarrative = cleanedNarrative.toLowerCase();
    for (const word of forbiddenWords) {
        // Use regex to match word boundaries where possible, or general substrings for phrases
        const regex = new RegExp(`\\b${word}\\b`, "i");
        if (regex.test(lowerNarrative) || lowerNarrative.includes(word)) {
            errors.push(`Contains forbidden word/phrase: "${word}"`);
        }
    }

    // 2. Date Validation
    // Check if dates mentioned in narrative exist in section_data
    const dateRegexes = [
        /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
        /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY
        /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi // Month DD, YYYY
    ];

    for (const regex of dateRegexes) {
        const matches = cleanedNarrative.match(regex);
        if (matches) {
            for (const match of matches) {
                const normalizedMatch = match.toLowerCase().replace(/,/, "");
                // If not found in data
                if (!serializedData.includes(normalizedMatch)) {
                    // Check if components of the date match
                    const parts = normalizedMatch.split(/[\s/-]/);
                    const allPartsExist = parts.every(part => serializedData.includes(part));
                    if (!allPartsExist) {
                        errors.push(`Date "${match}" mentioned in narrative but not found in section data`);
                    }
                }
            }
        }
    }

    // 3. Named Entity Validation
    // Proper nouns (capitalized words not at start of sentence, excluding project name and MATUR.ai)
    // Find capitalized words that are not starting a sentence
    const properNouns: string[] = [];
    // Split into sentences first
    const sentences = cleanedNarrative.split(/(?<=[.!?])\s+/);
    sentences.forEach(sentence => {
        const words = sentence.trim().split(/\s+/);
        // Skip first word, inspect subsequent words
        for (let i = 1; i < words.length; i++) {
            const word = words[i].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            if (word && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
                properNouns.push(word);
            }
        }
    });

    const projectWords = projectName.toLowerCase().split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(Boolean);
    const ignoredNouns = new Set([
        "matur", "maturai", "ai", "dashboard", "pdf", "crc", "v1", "system", "eu", "us",
        "act", "rmf", "nist", "iso", "iec", "framework", "standard", "readiness",
        "governance", "compliance", "report", "executive", "section", "data", "profile",
        "metrics", "overall", "project", "machine", "learning", "ml", "deep", "neural",
        "network", "networks", "model", "models", "critical", "high", "medium", "low",
        "unacceptable", "limited", "minimal", "risk", "risks", "mitigation", "mitigations",
        "register", "assessment", "assessments", "component", "components", "inventory",
        "vendor", "vendors", "provider", "providers", "bias", "toxicity", "fairness",
        "relevancy", "faithfulness", "security", "privacy", "protection", "gdpr", "ccpa",
        "eea", "infrastructure", "deployment", "scale", "automation", "autonomous",
        "european", "american", "global", "national", "severity", "category", "categories",
        "control", "controls", "yes", "no", "partial", "partially", "not", "sure", "na",
        "i", "we", "our", "you", "they", "he", "she", "it", "the", "this", "that", "these",
        "those", "ill", "ive", "weve", "theyve", "should", "would", "could", "shall", "will",
        "january", "february", "march", "april", "may", "june", "july", "august",
        "september", "october", "november", "december", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday", ...projectWords
    ]);

    for (const noun of properNouns) {
        const lowerNoun = noun.toLowerCase();
        if (ignoredNouns.has(lowerNoun)) continue;

        if (!serializedData.includes(lowerNoun)) {
            errors.push(`Named entity "${noun}" mentioned in narrative but not found in section data`);
        }
    }

    // 4. Numerical Claim Validation
    // Extract percentages and numbers from narrative, check if they exist in data
    const narrativeNumbers = new Set<number>();
    
    // Percentages (e.g. 85%)
    const pctMatches = cleanedNarrative.match(/\b\d+(?:\.\d+)?%\b/g);
    if (pctMatches) {
        pctMatches.forEach(m => {
            const val = parseFloat(m.replace(/%$/, ""));
            if (!isNaN(val)) narrativeNumbers.add(val);
        });
    }

    // Numbers (integers or floats)
    const numMatches = cleanedNarrative.match(/\b\d+(?:\.\d+)?\b/g);
    if (numMatches) {
        numMatches.forEach(m => {
            const val = parseFloat(m);
            if (!isNaN(val)) {
                // Ignore small index/order numbers (like 1, 2, 3) to prevent false positives
                if (val > 4) {
                    narrativeNumbers.add(val);
                }
            }
        });
    }

    if (narrativeNumbers.size > 0) {
        const dataNumbers = extractNumbersFromData(sectionData);
        for (const num of narrativeNumbers) {
            // Check if num exists in data (or close enough for rounding, e.g. within 1.0)
            let found = dataNumbers.has(num);
            if (!found) {
                // Check if any number in data is within 1.0 of the number
                for (const dNum of dataNumbers) {
                    if (Math.abs(dNum - num) <= 1.0) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                errors.push(`Numerical value "${num}" mentioned in narrative but not found or matching in section data`);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        cleanedNarrative
    };
}

/**
 * High-level helper that generates narrative, runs validator, and retries up to 3 times on failure.
 * Returns the final validated narrative or fallback text.
 */
export async function generateAndValidateNarrative(
    params: {
        systemPrompt: string;
        userPrompt: string;
        sectionData: any;
        projectName: string;
        sectionLabel: string;
    }
): Promise<{ narrative: string; success: boolean }> {
    const { systemPrompt, userPrompt, sectionData, projectName, sectionLabel } = params;
    
    let currentFeedback = "";
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        attempts++;
        try {
            const fullUserPrompt = currentFeedback
                ? `${userPrompt}\n\n[RETRY ATTEMPT ${attempts}] Previous attempt failed validation with the following errors:\n${currentFeedback}\nPlease rewrite the narrative avoiding these errors. Make sure to adhere to all constraints.`
                : userPrompt;

            const generated = await callClaude({
                systemPrompt,
                userPrompt: fullUserPrompt,
                maxTokens: 512,
                label: `${sectionLabel} Narrative (Attempt ${attempts})`
            });

            const validation = validateNarrative(generated, sectionData, projectName);
            if (validation.isValid) {
                return { narrative: validation.cleanedNarrative, success: true };
            }

            console.warn(`[Narrative Validator] Attempt ${attempts} failed for ${sectionLabel}:`, validation.errors);
            currentFeedback = validation.errors.map(e => `- ${e}`).join("\n");
        } catch (error: any) {
            console.error(`[Narrative Validator] Error during attempt ${attempts} for ${sectionLabel}:`, error?.message);
            currentFeedback = `- System error: ${error?.message || "Failed to contact Claude API"}`;
        }
    }

    // Fallback on exhaustion
    console.error(`[Narrative Validator] Failed all ${maxAttempts} attempts for ${sectionLabel}. Using fallback.`);
    return {
        narrative: "Section data is available below",
        success: false
    };
}
