"use client";

import { useState } from "react";
import { Upload, Trash2, FileText, Loader2, ChevronDown, Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PreviewData } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRIVACY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const MAX_PREVIEW_COLUMNS = 20;
const MAX_PREVIEW_ROWS = 20;

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface DatasetUploadSectionProps {
    inputId: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleDragOver: (e: React.DragEvent<HTMLLabelElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleReset: () => void;
    handleEvaluate: () => void;
    error: string | null;
    isParsing: boolean;
    isEvaluating: boolean;
    hasFile: boolean;
    fileMeta: { name: string; size: number; uploadedAt: Date } | null;
    preview: PreviewData;
    outcomeColumn: string;
    setOutcomeColumn: (col: string) => void;
    positiveValue: string;
    setPositiveValue: (val: string) => void;
    protectedColumns: string[];
    setProtectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
    totalRowCount?: number;
}

export const DatasetUploadSection = ({
    inputId,
    fileInputRef,
    handleDragOver,
    handleDrop,
    handleFileChange,
    handleReset,
    handleEvaluate,
    error,
    isParsing,
    isEvaluating,
    hasFile,
    fileMeta,
    preview,
    outcomeColumn,
    setOutcomeColumn,
    positiveValue,
    setPositiveValue,
    protectedColumns,
    setProtectedColumns,
    totalRowCount = 0,
}: DatasetUploadSectionProps) => {
    const [isMethodologyExpanded, setIsMethodologyExpanded] = useState(false);

    return (
        <main className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">
            {/* Collapsible Info Hero Card with Gradient Fade */}
            <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs transition-all duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Scale className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                                About Dataset Testing & Evaluation
                            </h3>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setIsMethodologyExpanded(!isMethodologyExpanded)}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-3 shadow-2xs"
                        >
                            <span>{isMethodologyExpanded ? "Show Less" : "Show Methodology"}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMethodologyExpanded ? "rotate-180" : ""}`} />
                        </Button>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        This path analyzes a CSV you upload for statistical fairness signals and representation gaps before prompts reach a model. MATUR asks Gemini to explain key metrics such as fairness, bias, toxicity, relevancy, and faithfulness for the sample.
                    </p>
                </div>

                {/* Expandable Methodology Section */}
                <AnimatePresence initial={false}>
                    {isMethodologyExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="px-6 pb-6 pt-2 border-t border-border/50 space-y-6 text-xs sm:text-sm text-muted-foreground"
                        >
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">Why premium includes this</p>
                                <p className="leading-relaxed">
                                    You get a guided upload, automatic purge after inactivity, and a stored narrative alongside table metrics so reviewers can show what the dataset looked like at a point in time.
                                </p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-border/50">
                                <p className="text-sm font-semibold text-foreground">How the evaluation runs</p>
                                <p className="leading-relaxed">
                                    The service parses your columns, computes statistical fairness measures on the table, then sends a structured summary to Gemini for plain language commentary on the headline metrics.
                                </p>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-border/50">
                                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Limitations & Scope</p>
                                <p className="leading-relaxed">
                                    Results only reflect the file you uploaded. They cannot predict new bias introduced during training or behavior on data that was not in the file.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isMethodologyExpanded && (
                    <div className="h-4 bg-gradient-to-b from-transparent to-card/40 pointer-events-none" />
                )}
            </div>

            {/* Upload Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-xs space-y-6"
            >
                <div className="border-b border-border/60 pb-4">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Upload className="w-4.5 h-4.5 text-primary" />
                        Upload & Evaluate Dataset
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        We only use your CSV for this session and purge it automatically after inactivity.
                    </p>
                </div>

                <div className="space-y-6">
                    <Label
                        htmlFor={inputId}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/30"
                    >
                        <Upload className="w-8 h-8 text-primary mb-2.5" />
                        <p className="text-foreground font-semibold text-sm">Drop CSV file here or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Max 25MB • Auto-deleted after {Math.round(PRIVACY_TIMEOUT_MS / 60000)} minutes of inactivity.
                        </p>
                        <Input
                            id={inputId}
                            ref={fileInputRef as React.RefObject<HTMLInputElement>}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </Label>

                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive">{error}</div>
                    )}

                    {isParsing && (
                        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-primary font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Parsing CSV dataset...
                        </div>
                    )}

                    {fileMeta && hasFile && (
                        <div className="grid gap-4 md:grid-cols-3 text-xs">
                            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Filename</p>
                                <p className="font-medium text-foreground truncate font-mono">{fileMeta.name}</p>
                            </div>
                            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Filesize</p>
                                <p className="font-medium text-foreground font-mono">{formatBytes(fileMeta.size)}</p>
                            </div>
                            <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Uploaded At</p>
                                <p className="font-medium text-foreground font-mono">
                                    {fileMeta.uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Dataset Fairness Parameters Configuration (Statistical Rigor) */}
                    {hasFile && preview.headers.length > 0 && (
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-5 space-y-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-primary" />
                                        Fairness Evaluation Parameters
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Designate target outcomes and protected demographic attributes required for statistical parity and four-fifths disparity testing.
                                    </p>
                                </div>
                            </div>

                            {/* Sample size rigor notice if totalRowCount > 0 and < 30 */}
                            {totalRowCount > 0 && totalRowCount < 30 && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                    <div>
                                        <span className="font-semibold">Sample size notice ({totalRowCount} rows): </span>
                                        Under EU AI Act and standard algorithmic statistical rigor, samples with fewer than 30 observations cannot reliably establish statistical significance for four-fifths or parity metrics, and will be flagged as insufficient data.
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Target / Outcome Column <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={outcomeColumn}
                                        onValueChange={(val) => {
                                            setOutcomeColumn(val);
                                            setProtectedColumns((prev) => prev.filter((c) => c !== val));
                                        }}
                                    >
                                        <SelectTrigger className="w-full text-xs">
                                            <SelectValue placeholder="Select outcome column..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {preview.headers
                                                .filter((header) => header.trim().length > 0)
                                                .map((header) => (
                                                    <SelectItem key={header} value={header} className="text-xs">
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">
                                        Column representing the decision or classification (e.g., hired, approved, status).
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Favorable / Positive Outcome Value <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 1, Approved, Yes, True, Pass"
                                        value={positiveValue}
                                        onChange={(e) => setPositiveValue(e.target.value)}
                                        className="text-xs"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        The value in the outcome column indicating a beneficial result (e.g., loan approved).
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-2">
                                <Label className="text-xs font-semibold text-foreground">
                                    Protected Demographic Attributes <span className="text-destructive">*</span>
                                </Label>
                                <p className="text-[11px] text-muted-foreground -mt-1">
                                    Select the sensitive attributes to evaluate for disparate impact across sub-populations:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                                    {preview.headers
                                        .filter((h) => h.trim().length > 0 && h !== outcomeColumn)
                                        .map((header) => {
                                            const isChecked = protectedColumns.includes(header);
                                            return (
                                                <label
                                                    key={header}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs transition-colors cursor-pointer select-none ${
                                                        isChecked
                                                            ? "border-primary/50 bg-primary/10 text-foreground font-medium"
                                                            : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            setProtectedColumns((prev) =>
                                                                checked
                                                                    ? [...prev, header]
                                                                    : prev.filter((c) => c !== header)
                                                            );
                                                        }}
                                                    />
                                                    <span className="truncate">{header}</span>
                                                </label>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2 border-t border-border/60">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            Data never leaves this workspace.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            {hasFile && (!outcomeColumn || !positiveValue.trim() || protectedColumns.length === 0) && (
                                <span className="text-[11px] text-muted-foreground">
                                    {!outcomeColumn
                                        ? "Select target column"
                                        : !positiveValue.trim()
                                        ? "Enter positive outcome value"
                                        : "Select at least 1 protected attribute"}{" "}
                                    to run evaluation.
                                </span>
                            )}
                            {hasFile && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    className="rounded-lg text-xs font-semibold"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Clear
                                </Button>
                            )}
                            <Button
                                type="button"
                                onClick={handleEvaluate}
                                disabled={
                                    !hasFile ||
                                    isEvaluating ||
                                    !outcomeColumn ||
                                    !positiveValue.trim() ||
                                    protectedColumns.length === 0
                                }
                                className="rounded-lg text-xs font-semibold px-5"
                            >
                                {isEvaluating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                                {isEvaluating ? "Evaluating..." : "Run Fairness Evaluation"}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Preview Section */}
            {preview.headers.length > 0 && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs space-y-4 p-6">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div>
                            <h4 className="text-base font-semibold text-foreground">Dataset Snapshot</h4>
                            <p className="text-xs text-muted-foreground">Previewing structured CSV data rows</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md border border-border/60">
                            Up to {MAX_PREVIEW_ROWS} rows • {MAX_PREVIEW_COLUMNS} columns
                        </p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-secondary/30 border-b border-border uppercase text-[11px] text-muted-foreground font-semibold">
                                <tr>
                                    {preview.headers.map((header: string, headerIndex: number) => (
                                        <th key={`${headerIndex}-${header}`} className="px-4 py-3 font-semibold">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {preview.rows.map((row: string[] | Record<string, string>, rowIndex: number) => {
                                    const cellValues = Array.isArray(row)
                                        ? row
                                        : preview.headers.map(h => row[h] || "");

                                    return (
                                        <tr key={rowIndex} className="hover:bg-secondary/20 transition-colors">
                                            {cellValues.map((value: string, colIndex: number) => (
                                                <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2.5 text-foreground font-mono">
                                                    {(value === null || value === undefined || value === '') ? (
                                                        <span className="text-muted-foreground/60 italic">—</span>
                                                    ) : (
                                                        value
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
};

