"use client";

import { useRouter } from "next/navigation";
import { useAssessmentContext } from "../../contexts/AssessmentContext";
import { useAssessmentNavigation } from "../../hooks/useAssessmentNavigation"; // Assuming this hook is available and needed or we pass helpers
import { motion } from "framer-motion";
import {
    IconArrowLeft,
    IconArrowRight,
    IconInfoCircle,
    IconLoader2,
    IconLock,
} from "@tabler/icons-react";
import { SecureTextarea } from "../shared/SecureTextarea";
import { AssessmentSkeleton } from "../Skeleton";
import { Button } from "../ui/button";
import { sanitizeAimaDescription } from "../../lib/sanitize";
/**
 * HTML entities for escaping.
 */
const htmlEscape = (str: string): string => {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Formats AIMA question descriptions with bolding and bullet points.
 * This function dynamically transforms plain text from the backend into 
 * structured HTML for better readability.
 */
const formatAimaDescription = (description: string | null | undefined): string => {
    if (!description || typeof description !== "string") return "";

    const trimmedDesc = description.trim();
    
    // If it already looks like HTML (e.g. from manual database edits), 
    // sanitize it, strip erroneous dots from bullets, and return.
    if (trimmedDesc.startsWith("<") && trimmedDesc.endsWith(">")) {
        let sanitized = sanitizeAimaDescription(trimmedDesc);
        // Aggressively strip "• ." from LI tags if they exist in the HTML, 
        // but only if an actual bullet character is present to protect things like ".NET"
        sanitized = sanitized.replace(/<li(\b[^>]*)>\s*[•\-\*·\u2022\u00B7]\s*[.\-·• ]*\s*/gi, "<li$1>");
        return sanitized;
    }

    // 1. Process line by line and escape before adding tags
    const lines = description.split("\n");
    const resultLines: string[] = [];
    let inList = false;

    // Helper to bold specific markers safely
    const applyMarkers = (text: string) => {
        let escaped = htmlEscape(text);
        // Bold "Maturity Level X"
        escaped = escaped.replace(/(Maturity Level \d+)/g, "<strong>$1</strong>");
        // Bold "Stream A/B (...):"
        escaped = escaped.replace(/(Stream [A|B] \([^)]+\):)/g, "<strong>$1</strong>");
        return escaped;
    };

    for (let line of lines) {
        const trimmedLine = line.trim();
        // Support multiple bullet characters: •, -, *, ·
        if (/^[•\-\*·]/.test(trimmedLine)) {
            if (!inList) {
                resultLines.push('<ul class="mt-2 space-y-1">');
                inList = true;
            }
            
            // Use a regex that strips the bullet symbol AND any following dot/dash/space junk
            const cleanedBulletLine = trimmedLine.replace(/^[•\-\*·]\s*[.\-\s]*\s*/, "");
            
            // Handle various separators: colons, dashes, and now parenthesis
            const bulletMatch = cleanedBulletLine.match(/^(.*?)([:\-–—]|\s\()\s*(.*)$/);
            if (bulletMatch) {
                const title = htmlEscape(bulletMatch[1]);
                const separator = bulletMatch[2];
                const rest = htmlEscape(bulletMatch[3]);
                
                if (separator === " (") {
                    resultLines.push(`<li>${title} (${rest}</li>`);
                } else if (separator === ":") {
                    // Only bold if it's a colon (likely a label)
                    resultLines.push(`<li>${title}: ${rest}</li>`);
                } else {
                    // For dashes/etc, just show them without bolding the title
                    resultLines.push(`<li>${title}${htmlEscape(separator)} ${rest}</li>`);
                }
            } else {
                // No separator found, just show the cleaned line without bolding
                resultLines.push(`<li>${htmlEscape(cleanedBulletLine)}</li>`);
            }
        } else {
            if (inList) {
                resultLines.push("</ul>");
                inList = false;
            }
            if (trimmedLine) {
                resultLines.push(`<p>${applyMarkers(trimmedLine)}</p>`);
            }
        }
    }

    if (inList) {
        resultLines.push("</ul>");
    }

    const rawHtml = resultLines.join("\n");
    return sanitizeAimaDescription(rawHtml);
};

export default function QuestionView() {
    const router = useRouter();
    const {
        projectId,
        domains,
        answers,
        notes,
        currentDomainId,
        currentPracticeId,
        currentQuestionIndex,
        setCurrentDomainId,
        setCurrentPracticeId,
        setCurrentQuestionIndex,
        handleAnswerChange,
        handleNoteChange,
        handleNoteSave,
        submitProject,
        saving,
        submitting,
        submissionPhase,
        questions,
        loading,
        isReadOnly
    } = useAssessmentContext();

    const {
        hasNextQuestion,
        hasPreviousQuestion,
        getNextQuestion,
        getPreviousQuestion,
    } = useAssessmentNavigation({
        domains,
        assessmentData: answers,
        currentDomainId,
        currentPracticeId,
        currentQuestionIndex,
    });

    // --- Navigation Handlers ---
    const handleNextQuestion = () => {
        const next = getNextQuestion();
        if (next) {
            setCurrentDomainId(next.domainId);
            setCurrentPracticeId(next.practiceId);
            setCurrentQuestionIndex(next.questionIndex);
        }
    };

    const handlePreviousQuestion = () => {
        const prev = getPreviousQuestion();
        if (prev) {
            setCurrentDomainId(prev.domainId);
            setCurrentPracticeId(prev.practiceId);
            setCurrentQuestionIndex(prev.questionIndex);
        }
    };



    if (loading || !questions) {
        return <AssessmentSkeleton />;
    }

    const validQuestionIndex = Math.max(0, Math.min(currentQuestionIndex || 0, questions.length - 1));



    const currentQuestion = questions[validQuestionIndex];

    if (!currentQuestion) {
        return <AssessmentSkeleton />;
    }

    const questionKey = `${currentDomainId}:${currentPracticeId}:${currentQuestion.level}:${currentQuestion.stream}:${validQuestionIndex}`;
    const currentAnswer = answers[questionKey];
    const currentNote = notes[questionKey] || "";

    const totalQuestions = questions.length;
    // Calculate progress for CURRENT practice
    const answeredQuestions = Object.keys(answers).filter((key) =>
        key.startsWith(`${currentDomainId}:${currentPracticeId}:`),
    ).length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    const currentDomain = domains.find(d => d.id === currentDomainId);
    const currentPractice = currentDomain?.practices[currentPracticeId];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* HEADER */}
            <div className="bg-background border-b border-border p-4 flex-none">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            type="button"
                            className="flex items-center gap-2 ml-2 text-primary hover:text-primary/80 transition-colors"
                        >
                            <IconArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                {currentPractice?.title || 'Loading...'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {currentDomain?.title} • Question {validQuestionIndex + 1} of {totalQuestions}
                            </p>
                        </div>
                        {isReadOnly && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium ml-4">
                                <IconLock size={12} />
                                View Only
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {saving && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                                <IconLoader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </div>
                        )}
                        <Button
                            onClick={() => submitProject()}
                            type="button"
                            disabled={submitting || isReadOnly}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {submissionPhase === 'saving-notes'
                                        ? 'Saving notes...'
                                        : submissionPhase === 'submitting'
                                            ? 'Submitting assessment...'
                                            : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    Submit Project
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Question {validQuestionIndex + 1} of {totalQuestions}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round(progress)}% Complete
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question Card */}
                    <motion.div
                        key={questionKey}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8"
                    >
                        <div className="mb-6">
                            <div className="flex items-center gap-5 mb-4">
                                <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                                        Level {currentQuestion.level}
                                    </span>
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            aria-describedby="tooltip-level"
                                            className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                                        >
                                            <IconInfoCircle size={16} className="text-muted-foreground hover:text-foreground" />
                                        </button>
                                        <div 
                                            id="tooltip-level"
                                            role="tooltip"
                                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block group-focus-within:block bg-popover text-popover-foreground text-xs rounded-md px-3 py-2 border border-border shadow-md z-50 min-w-[200px]"
                                        >
                                            <p>Represents the maturity stage of the AI practice</p>
                                            <p className="mt-1">from <span className="font-bold">basic (Level 1)</span> to <span className="font-bold">advanced (Level 3)</span>.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                                        Stream {currentQuestion.stream}
                                    </span>
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            aria-describedby="tooltip-stream"
                                            className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                                        >
                                            <IconInfoCircle size={16} className="text-muted-foreground hover:text-foreground" />
                                        </button>
                                        <div 
                                            id="tooltip-stream"
                                            role="tooltip"
                                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:block group-focus-within:block bg-popover text-popover-foreground text-xs rounded-md px-3 py-2 border border-border shadow-md z-50 min-w-[240px]"
                                        >
                                            <p className="mb-1">Each domain has two complementary streams:</p>
                                            <ul className="space-y-1 list-disc pl-4">
                                                <li><span className="font-bold">Stream A:</span> Create & Promote</li>
                                                <li><span className="font-bold">Stream B:</span> Measure & Improve</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                                {currentQuestion.question}
                            </h2>

                            {currentQuestion.description && (
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 rounded-md bg-primary/10">
                                            <IconInfoCircle size={14} className="text-primary" />
                                        </div>
                                        <span className="text-sm font-bold text-foreground uppercase tracking-wider">Description (Guide Text)</span>
                                    </div>
                                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-foreground/90 font-medium [&_strong]:text-foreground [&_strong]:font-bold [&_b]:text-foreground [&_b]:font-bold [&_ul]:mt-3 [&_ul]:space-y-2 [&_li]:relative [&_li]:pl-5 [&_li:before]:content-['•'] [&_li:before]:absolute [&_li:before]:left-0 [&_li:before]:text-primary [&_p]:mb-3 [&_p:last-child]:mb-0 shadow-sm">
                                        <div dangerouslySetInnerHTML={{ __html: formatAimaDescription(currentQuestion.description) }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    value: 0,
                                    label: "No",
                                    description: "Not implemented or not applicable",
                                },
                                {
                                    value: 1.5,
                                    label: "Partially",
                                    description: "Partially implemented or in progress",
                                },
                                {
                                    value: 3,
                                    label: "Yes",
                                    description: "Fully implemented and operational",
                                },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 ${currentAnswer === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        } ${isReadOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                                >
                                    <div className="relative flex items-center justify-center mt-1">
                                        <input
                                            type="radio"
                                            name="answer"
                                            value={option.value}
                                            checked={currentAnswer === option.value}
                                            disabled={isReadOnly}
                                            onChange={() =>
                                                handleAnswerChange(validQuestionIndex, option.value)
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 ${currentAnswer === option.value
                                            ? "border-primary bg-primary"
                                            : "border-border bg-transparent"
                                            }`}>
                                            {currentAnswer === option.value && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-2 h-2 rounded-full bg-white"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <div className="text-sm font-medium text-foreground">
                                            {option.label}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Notes Section */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <h3 className="text-sm font-medium text-foreground mb-3">
                                Your Notes
                            </h3>
                            <SecureTextarea
                                value={currentNote}
                                onChange={(note) =>
                                    handleNoteChange(validQuestionIndex, note)
                                }
                                onSave={(value) => handleNoteSave(validQuestionIndex, value)}
                                placeholder="Add your notes, reminders, or thoughts about this question..."
                                maxLength={5000}
                                className="w-full"
                                readOnly={isReadOnly}
                            />
                        </div>
                    </motion.div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pb-8">
                        <button
                            onClick={handlePreviousQuestion}
                            type="button"
                            disabled={!hasPreviousQuestion}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-border text-foreground hover:bg-muted"
                        >
                            <IconArrowLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <button
                            onClick={handleNextQuestion}
                            type="button"
                            disabled={!hasNextQuestion}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Next
                            <IconArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
