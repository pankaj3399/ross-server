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
} from "@tabler/icons-react";
import { SecureTextarea } from "../shared/SecureTextarea";
import { safeRenderHTML } from "../../lib/htmlUtils";
import { AssessmentSkeleton } from "../Skeleton";
import { Button } from "../ui/button";

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
        loading
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
                            disabled={submitting}
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
                                        <IconInfoCircle size={16} className="cursor-pointer text-muted-foreground hover:text-foreground" />
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border border-border shadow-md">
                                            Represents the maturity stage of the AI practice — from basic (Level 1) to advanced (Level 3).
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                                        Stream {currentQuestion.stream}
                                    </span>
                                    <div className="relative group">
                                        <IconInfoCircle size={16} className="cursor-pointer text-muted-foreground hover:text-foreground" />
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border border-border shadow-md">
                                            Each domain has two complementary streams: Stream A – Create & Promote and Stream B – Measure & Improve.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                                {currentQuestion.question}
                            </h2>
                            {/* 
                  Using safeRenderHTML to render HTML content from backend securely.
                  Previously used dangerouslySetInnerHTML directly with DOMPurify in page.tsx.
                  safeRenderHTML likely wraps that or similar logic. 
                  Checking imports: safeRenderHTML is imported from lib/htmlUtils.
                */}
                            {currentQuestion.description && (
                                <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
                                    <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentQuestion.description) }} />
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
                                    value: 0.5,
                                    label: "Partially",
                                    description: "Partially implemented or in progress",
                                },
                                {
                                    value: 1,
                                    label: "Yes",
                                    description: "Fully implemented and operational",
                                },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${currentAnswer === option.value
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="relative flex items-center justify-center mt-1">
                                        <input
                                            type="radio"
                                            name="answer"
                                            value={option.value}
                                            checked={currentAnswer === option.value}
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
