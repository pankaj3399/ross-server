"use client";

import { Upload, Trash2, FileText, Loader2 } from "lucide-react";
import type { PreviewData } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
}: DatasetUploadSectionProps) => {
    return (
        <>
            <section className="bg-background">
                <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-[minmax(0,1fr),380px]">
                    <div className="space-y-6">
                        <p className="text-sm font-semibold text-primary">Fairness & Bias Evaluation</p>
                        <h2 className="text-3xl font-bold text-foreground leading-tight">
                            Upload a CSV
                        </h2>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 pb-16 space-y-10 -mt-8">
                <section className="grid gap-8 lg:grid-cols-1">
                    <Card className="shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary text-primary-foreground">
                            <p className="text-sm uppercase tracking-wide text-primary-foreground/80">Dataset Testing</p>
                            <CardTitle className="text-2xl text-primary-foreground">Upload & Evaluate</CardTitle>
                            <CardDescription className="text-primary-foreground/80">We only use your CSV for this session and purge it automatically.</CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            <Label
                                htmlFor={inputId}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors bg-muted/60"
                            >
                                <Upload className="w-10 h-10 text-primary mb-3" />
                                <p className="text-foreground font-medium">Drop CSV here or browse</p>
                                <p className="text-sm text-muted-foreground">
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
                                <div className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
                            )}

                            {isParsing && (
                                <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Parsing CSV...
                                </div>
                            )}

                            {fileMeta && hasFile && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Filename</p>
                                            <p className="font-medium text-foreground truncate">{fileMeta.name}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Filesize</p>
                                            <p className="font-medium text-foreground">{formatBytes(fileMeta.size)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Uploaded</p>
                                            <p className="font-medium text-foreground">
                                                {fileMeta.uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Data never leaves this workspace.
                                </p>
                                <div className="flex gap-3">
                                    {hasFile && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleReset}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        onClick={handleEvaluate}
                                        disabled={!hasFile || isEvaluating}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        {isEvaluating && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isEvaluating ? "Evaluating..." : "Run Fairness Evaluation"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {preview.headers.length > 0 && (
                    <Card className="shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
                                    <h4 className="text-lg font-semibold text-foreground">Dataset Snapshot</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Showing up to {MAX_PREVIEW_ROWS} rows • {MAX_PREVIEW_COLUMNS} columns
                                </p>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-border">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr>
                                            {preview.headers.map((header: string, headerIndex: number) => (
                                                <th key={`${headerIndex}-${header}`} className="text-left px-4 py-3 bg-muted text-muted-foreground font-medium">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.rows.map((row: string[], rowIndex: number) => (
                                            <tr key={rowIndex} className="border-t border-border">
                                                {row.map((value: string, colIndex: number) => (
                                                    <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2 text-foreground">
                                                        {(value === null || value === undefined || value === '') ? (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        ) : (
                                                            value
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
};
