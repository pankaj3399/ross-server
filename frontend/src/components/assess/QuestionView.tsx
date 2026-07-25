"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAssessmentContext } from "../../contexts/AssessmentContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAssessmentNavigation } from "../../hooks/useAssessmentNavigation";
import { getReportRoute } from "../../lib/reportRoute";
import { motion } from "framer-motion";
import {
    IconArrowLeft,
    IconArrowRight,
    IconInfoCircle,
    IconLoader2,
    IconLock,
    IconCpu,
    IconDatabase,
    IconShieldLock,
    IconFolder,
} from "@tabler/icons-react";
import { SecureTextarea } from "../shared/SecureTextarea";
import { AssessmentSkeleton } from "../Skeleton";
import { Button } from "../ui/button";
import { sanitizeAimaDescription } from "../../lib/sanitize";
import { getMissingQuestions, buildAssessmentAnswerKey, type MissingQuestion } from "../../lib/assessmentValidation";
import MissingAnswersDialog from "./MissingAnswersDialog";
import { Breadcrumb } from "../shared/Breadcrumb";
import { getDomainIcon } from "@/lib/utils";
import { isPremiumStatus } from "../../lib/constants";


const getLevelColor = (level: string | number) => {
    const lvl = String(level);
    if (lvl === "1") {
        return "bg-blue-50/50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30";
    }
    if (lvl === "2") {
        return "bg-purple-50/50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30";
    }
    return "bg-amber-50/50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30";
};

const getStreamColor = (stream: string) => {
    if (stream === "A") {
        return "bg-teal-50/50 text-teal-700 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/30";
    }
    return "bg-rose-50/50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/30";
};

const getOptionColors = (value: number, isSelected: boolean) => {
    if (value === 0) { // No
        return {
            labelClass: isSelected
                ? "border-destructive bg-destructive/5 dark:bg-destructive/10"
                : "border-border hover:border-destructive/40 hover:bg-destructive/2 dark:hover:bg-destructive/2",
            radioClass: isSelected
                ? "border-destructive bg-destructive"
                : "border-border bg-transparent",
        };
    } else if (value === 1.5) { // Partially
        return {
            labelClass: isSelected
                ? "border-warning bg-warning/5 dark:bg-warning/10"
                : "border-border hover:border-warning/40 hover:bg-warning/2 dark:hover:bg-warning/2",
            radioClass: isSelected
                ? "border-warning bg-warning"
                : "border-border bg-transparent",
        };
    } else { // Yes
        return {
            labelClass: isSelected
                ? "border-success bg-success/5 dark:bg-success/10"
                : "border-border hover:border-success/40 hover:bg-success/2 dark:hover:bg-success/2",
            radioClass: isSelected
                ? "border-success bg-success"
                : "border-border bg-transparent",
        };
    }
};

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
    const { user } = useAuth();
    const [descriptionCache, setDescriptionCache] = useState<{ key: string; html: string } | null>(null);
    const [missingDialogOpen, setMissingDialogOpen] = useState(false);
    const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([]);

    const {
        projectId,
        projectName,
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
        isReadOnly,
        projectStatus,
        hasChangedAnswers,
    } = useAssessmentContext();

    const isCompleted = projectStatus === 'completed';
    const reportUrl = getReportRoute(projectId);

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

    const validQuestionIndex = Math.max(0, Math.min(currentQuestionIndex || 0, questions.length - 1));
    const currentQuestion = questions[validQuestionIndex];
    const questionKey = buildAssessmentAnswerKey(currentDomainId, currentPracticeId, currentQuestion?.level ?? "", currentQuestion?.stream ?? "", validQuestionIndex);

    const topAnchorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            topAnchorRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
        return () => cancelAnimationFrame(id);
    }, [questionKey]);

    // --- Client-side effect to handle DOM-based bolding removal in lists ---
    useEffect(() => {
        if (!currentQuestion?.description) {
            setDescriptionCache({ key: questionKey, html: "" });
            return;
        }

        const initial = formatAimaDescription(currentQuestion.description);
        
        // If it's not HTML, just use it directly
        if (!currentQuestion.description.trim().startsWith("<")) {
            setDescriptionCache({ key: questionKey, html: initial });
            return;
        }

        // DOM-based stripping of strong/b tags from list items only on the client
        // to avoid hydration mismatch errors.
        const container = document.createElement("div");
        container.innerHTML = initial;
        const listItems = container.querySelectorAll("li");
        listItems.forEach((li) => {
            const bolds = li.querySelectorAll("strong, b");
            bolds.forEach((bold) => {
                while (bold.firstChild) {
                    bold.parentNode?.insertBefore(bold.firstChild, bold);
                }
                bold.parentNode?.removeChild(bold);
            });
        });
        setDescriptionCache({ key: questionKey, html: container.innerHTML });
    }, [currentQuestion?.description, questionKey]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainElement = document.querySelector('main') || document.getElementById('main-content');
        if (mainElement) {
            mainElement.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentQuestionIndex, currentDomainId, currentPracticeId]);

    if (loading || !questions) {
        return <AssessmentSkeleton />;
    }

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

    const handleSubmitClick = () => {
        if (isReadOnly || submitting) return;
        const missing = getMissingQuestions(domains, answers);
        if (missing.length > 0) {
            setMissingQuestions(missing);
            setMissingDialogOpen(true);
            return;
        }
        submitProject();
    };

    const handleGoToFirstMissing = () => {
        const first = missingQuestions[0];
        if (!first) return;
        setMissingDialogOpen(false);
        setCurrentDomainId(first.domainId);
        setCurrentPracticeId(first.practiceId);
        setCurrentQuestionIndex(first.questionIndex);
    };

    if (!currentQuestion) {
        return <AssessmentSkeleton />;
    }

    const currentAnswer = answers[questionKey];
    const currentNote = notes[questionKey] || "";

    const totalQuestions = questions.length;
    // Calculate progress for CURRENT practice by checking actual questions
    const answeredQuestions = questions.reduce((count, question, idx) => {
        const key = buildAssessmentAnswerKey(currentDomainId, currentPracticeId, question.level, question.stream, idx);
        return answers[key] !== undefined && answers[key] !== null ? count + 1 : count;
    }, 0);
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    const currentDomain = domains.find(d => d.id === currentDomainId);
    const currentPractice = currentDomain?.practices[currentPracticeId];

    const DomainIcon = currentDomain ? getDomainIcon(currentDomain.title) : IconCpu;

    const premiumStatus = isPremiumStatus(user?.subscription_status);
    const projectBreadcrumbHref = premiumStatus
        ? `/assess/${projectId}/crc/dashboard`
        : `/assess/${projectId}`;

    return (
        <div className="flex-1 flex flex-col w-full">
            {/* HEADER */}
            <div className="bg-sidebar border-b border-sidebar-border px-8 py-3 flex-none sticky top-0 z-20 shadow-xs w-full">
                <div className="w-full flex flex-col gap-2">
                    {/* Top: Breadcrumb */}
                    <div className="flex items-center justify-between text-xs">
                        <Breadcrumb projectName={projectName || "Loading..."} projectHref={projectBreadcrumbHref} items={[{ label: "AI Maturity Assessment (AIMA)" }]} />
                        
                        {saving && (
                            <div className="flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
                                <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving...
                            </div>
                        )}
                    </div>

                    {/* Bottom: Main row */}
                    <div className="flex items-center justify-between gap-4 mt-1 ">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => router.back()}
                                type="button"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0"
                            >
                                <IconArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                            <div className="h-5 w-px bg-border shrink-0" />
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                <DomainIcon className="w-4 h-4 text-primary shrink-0" />
                                <h1 className="text-sm font-bold text-foreground truncate">
                                    {currentPractice?.title || 'Loading...'}
                                </h1>
                                <span className="text-muted-foreground/30 text-xs shrink-0">|</span>
                                <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px] sm:max-w-xs">
                                    {currentDomain?.title}
                                </span>
                                <span className="inline-flex items-center text-[9px] py-0.5 px-2 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                    Question {validQuestionIndex + 1} of {totalQuestions}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            {isReadOnly && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium">
                                    <IconLock size={10} />
                                    View Only
                                </div>
                            )}
                            {isCompleted && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(reportUrl)}
                                    type="button"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border-success/30 text-success dark:text-success hover:bg-success/10 shadow-xs rounded-lg text-xs font-semibold transition-all"
                                >
                                    View Report
                                </Button>
                            )}
                            <Button
                                onClick={handleSubmitClick}
                                type="button"
                                disabled={submitting || isReadOnly || (isCompleted && !hasChangedAnswers)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold shadow-xs"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>{isCompleted ? 'Resubmit Changes' : 'Submit Project'}</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 px-8 pt-6 pb-2">
                <div className="w-full">
                    <div ref={topAnchorRef} aria-hidden />
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Question {validQuestionIndex + 1} of {totalQuestions}
                            </span>
                            <span className="text-sm text-muted-foreground font-semibold">
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
                        className="bg-card rounded-2xl shadow-lg border border-border/80 p-8 mb-8"
                    >
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold border flex items-center gap-1.5 ${getLevelColor(currentQuestion.level)}`}>
                                    <IconCpu className="w-3.5 h-3.5 shrink-0" />
                                    <span>Level {currentQuestion.level}</span>
                                </span>
                                <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold border flex items-center gap-1.5 ${getStreamColor(currentQuestion.stream)}`}>
                                    <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Stream {currentQuestion.stream}</span>
                                </span>
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
                                        <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Description (Guide Text)</span>
                                    </div>
                                    <div className="rounded-xl border-l-4 border-l-primary/60 border-y border-r border-border bg-muted/20 p-5 text-sm text-foreground/90 font-normal [&_strong]:text-foreground [&_strong]:font-bold [&_b]:text-foreground [&_b]:font-bold [&_ul]:mt-3 [&_ul]:space-y-2 [&_li]:relative [&_li]:pl-5 [&_li:before]:content-['•'] [&_li:before]:absolute [&_li:before]:left-0 [&_li:before]:text-primary [&_p]:mb-3 [&_p:last-child]:mb-0 shadow-2xs">
                                        <div dangerouslySetInnerHTML={{ 
                                            __html: (descriptionCache?.key === questionKey ? descriptionCache.html : null) || formatAimaDescription(currentQuestion.description) 
                                        }} />
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
                            ].map((option) => {
                                const isSelected = currentAnswer === option.value;
                                const colors = getOptionColors(option.value, isSelected);
                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 ${colors.labelClass} ${isReadOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"}`}
                                    >
                                        <div className="relative flex items-center justify-center mt-1">
                                            <input
                                                type="radio"
                                                name="answer"
                                                value={option.value}
                                                checked={isSelected}
                                                disabled={isReadOnly}
                                                onChange={() =>
                                                    handleAnswerChange(validQuestionIndex, option.value)
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 ${colors.radioClass}`}>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-2 h-2 rounded-full bg-white"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="text-sm font-semibold text-foreground">
                                                {option.label}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {option.description}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Notes Section */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span>Your Notes</span>
                                <span className="text-[10px] font-normal text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/50">Auto-saves</span>
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
                    <div className="flex items-center justify-between pb-2">
                        <button
                            onClick={handlePreviousQuestion}
                            type="button"
                            disabled={!hasPreviousQuestion}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-border/60 text-foreground/80 hover:text-foreground bg-card hover:bg-muted/50 transition-all duration-200 shadow-2xs hover:shadow-xs disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <IconArrowLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {hasNextQuestion ? (
                            <button
                                onClick={handleNextQuestion}
                                type="button"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Next
                                <IconArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={isCompleted && !hasChangedAnswers ? () => router.push(reportUrl) : handleSubmitClick}
                                type="button"
                                disabled={submitting || (isReadOnly && !(isCompleted && !hasChangedAnswers))}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isCompleted && !hasChangedAnswers
                                        ? 'bg-primary hover:bg-primary/95 text-primary-foreground'
                                        : 'bg-success hover:bg-success/95 text-white'
                                }`}
                            >
                                {submitting ? (
                                    <>
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                        {submissionPhase === "saving-notes"
                                            ? "Saving notes..."
                                            : submissionPhase === "submitting"
                                                ? (isCompleted ? "Resubmitting..." : "Submitting...")
                                                : "Processing..."}
                                    </>
                                ) : isCompleted && !hasChangedAnswers ? (
                                    <>
                                        View Report
                                        <IconArrowRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        {isCompleted ? 'Resubmit Changes' : 'Submit Project'}
                                        <IconArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <MissingAnswersDialog
                open={missingDialogOpen}
                onClose={() => setMissingDialogOpen(false)}
                missing={missingQuestions}
                onGoToFirst={handleGoToFirstMissing}
            />
        </div>
    );
}
