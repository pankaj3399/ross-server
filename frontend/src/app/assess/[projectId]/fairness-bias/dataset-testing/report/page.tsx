
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Download,
    FileText,
    RefreshCw,
} from "lucide-react";
import type { DatasetMetric, DatasetReportPayload, FairnessColumn } from "../types";
import { getDatasetTestingReportKey } from "../storage";
import { Skeleton } from "@/components/Skeleton";
import { verdictStyles } from "../constants";
import { FairnessMetricCard } from "./components/FairnessMetricCard";
import { SensitiveColumnAnalysis } from "./components/SensitiveColumnAnalysis";
import { DatasetSnapshot } from "./components/DatasetSnapshot";

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const DatasetTestingReportPage = () => {
    const router = useRouter();
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;

    const [payload, setPayload] = useState<DatasetReportPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!projectId) return;
        const key = getDatasetTestingReportKey(projectId);
        const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(key) : null;
        if (raw) {
            try {
                setPayload(JSON.parse(raw) as DatasetReportPayload);
            } catch {
                setPayload(null);
            }
        } else {
            setPayload(null);
        }
        setIsLoading(false);
    }, [projectId]);

    const metricCards = useMemo<Array<{ key: string; title: string; data: DatasetMetric }>>(() => {
        if (!payload) return [];
        const result = payload.result;
        return [
            { key: "fairness", title: "Fairness", data: result.fairnessResult },
            { key: "biasness", title: "Biasness", data: result.biasness },
            { key: "toxicity", title: "Toxicity", data: result.toxicity },
            { key: "relevance", title: "Relevance", data: result.relevance },
            { key: "faithfulness", title: "Faithfulness", data: result.faithfulness },
        ];
    }, [payload]);

    const handleBackToUpload = () => {
        router.push(`/assess/${projectId}/fairness-bias/dataset-testing`);
    };

    const handleExportPdf = async () => {
        if (!reportRef.current || !payload) return;
        try {
            setIsExporting(true);

            // Wait for React to re-render with isExporting=true (which expands all rows)
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const [jsPDFModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")]);
            const jsPDFConstructor = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const usableWidth = pageWidth - 2 * margin;
            const usableHeight = pageHeight - 2 * margin;

            // Clone the report container for PDF-specific rendering
            const clone = reportRef.current.cloneNode(true) as HTMLElement;
            clone.style.width = "850px";
            clone.style.position = "absolute";
            clone.style.left = "-9999px";
            clone.style.top = "0";
            clone.style.backgroundColor = "#ffffff";
            clone.style.color = "#1e293b";
            clone.style.padding = "16px";

            // Helper to apply PDF-friendly styles to an element tree
            const applyPdfStyles = (root: HTMLElement) => {
                // Remove all grid layouts and make everything stack vertically
                root.querySelectorAll("[class*='grid']").forEach((el) => {
                    const elem = el as HTMLElement;
                    const classes = Array.from(elem.classList);
                    classes.forEach(cls => {
                        if (cls.includes("grid") || cls.includes("cols") || cls.includes("xl:") || cls.includes("lg:")) {
                            elem.classList.remove(cls);
                        }
                    });
                    elem.style.display = "block";
                    elem.style.width = "100%";
                });

                // Make all sections full width and visible
                root.querySelectorAll("section, div").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.maxWidth = "100%";
                    elem.style.overflow = "visible";
                });

                // Hide elements marked for hiding in PDF
                root.querySelectorAll(".hide-in-pdf").forEach((el) => {
                    (el as HTMLElement).style.display = "none";
                });

                // Fix progress bars
                root.querySelectorAll(".rounded-full.overflow-hidden").forEach((container) => {
                    const containerEl = container as HTMLElement;
                    if (containerEl.classList.contains("h-2") || containerEl.classList.contains("h-2.5") || 
                        containerEl.className.includes("h-2")) {
                        containerEl.style.backgroundColor = "#e2e8f0";
                        containerEl.style.height = "10px";
                        containerEl.style.overflow = "visible";
                        
                        const innerBar = containerEl.querySelector("div") as HTMLElement;
                        if (innerBar && innerBar.style.width) {
                            innerBar.style.height = "10px";
                            innerBar.style.borderRadius = "9999px";
                            innerBar.style.minWidth = "4px";
                            
                            const classes = innerBar.className;
                            if (classes.includes("amber") || classes.includes("orange")) {
                                innerBar.style.background = "#f59e0b";
                                innerBar.style.backgroundImage = "none";
                            } else if (classes.includes("emerald") || classes.includes("teal")) {
                                innerBar.style.background = "#10b981";
                                innerBar.style.backgroundImage = "none";
                            } else {
                                innerBar.style.background = "#3b82f6";
                                innerBar.style.backgroundImage = "none";
                            }
                        }
                    }
                });

                // Fix gradient bars
                root.querySelectorAll("[class*='bg-gradient']").forEach((el) => {
                    const elem = el as HTMLElement;
                    const classes = elem.className;
                    elem.style.backgroundImage = "none";
                    if (classes.includes("amber") || classes.includes("orange")) {
                        elem.style.backgroundColor = "#f59e0b";
                    } else if (classes.includes("emerald") || classes.includes("teal")) {
                        elem.style.backgroundColor = "#10b981";
                    }
                });

                // Fix ALL text colors for PDF visibility - apply dark text on light background
                root.querySelectorAll("*").forEach((el) => {
                    const elem = el as HTMLElement;
                    const computed = window.getComputedStyle(elem);
                    
                    // Fix dark backgrounds to light
                    const bg = computed.backgroundColor;
                    if (bg.includes("rgb(17,") || bg.includes("rgb(31,") || bg.includes("rgb(15,") || 
                        bg.includes("rgb(3,") || bg.includes("rgb(9,") || bg.includes("rgba(0,") ||
                        bg.includes("rgb(30,") || bg.includes("rgb(24,") || bg.includes("rgb(39,")) {
                        elem.style.backgroundColor = "#ffffff";
                    }
                    
                    // Fix borders
                    if (computed.borderColor.includes("rgb(55,") || computed.borderColor.includes("rgb(31,") ||
                        computed.borderColor.includes("rgb(63,") || computed.borderColor.includes("rgb(75,")) {
                        elem.style.borderColor = "#e2e8f0";
                    }
                });

                // Second pass: Fix text colors based on Tailwind class names
                root.querySelectorAll("*").forEach((el) => {
                    const elem = el as HTMLElement;
                    // Handle both regular elements and SVG elements (className can be SVGAnimatedString)
                    let classes = "";
                    try {
                        classes = typeof elem.className === "string" ? elem.className : 
                                  (elem.className && typeof (elem.className as unknown as SVGAnimatedString).baseVal === "string" 
                                   ? (elem.className as unknown as SVGAnimatedString).baseVal : "");
                    } catch {
                        classes = "";
                    }
                    
                    if (!classes) return;
                    // Force dark text for common dark-mode text classes
                    if (classes.includes("text-white") || classes.includes("dark:text-white")) {
                        elem.style.color = "#1e293b";
                    }
                    if (classes.includes("text-slate-300") || classes.includes("dark:text-slate-300") ||
                        classes.includes("text-slate-200") || classes.includes("dark:text-slate-200")) {
                        elem.style.color = "#475569";
                    }
                    if (classes.includes("text-slate-400") || classes.includes("dark:text-slate-400") ||
                        classes.includes("text-gray-400") || classes.includes("dark:text-gray-400")) {
                        elem.style.color = "#64748b";
                    }
                    if (classes.includes("text-slate-500") || classes.includes("text-gray-500")) {
                        elem.style.color = "#64748b";
                    }
                    if (classes.includes("text-slate-600") || classes.includes("text-gray-600")) {
                        elem.style.color = "#475569";
                    }
                    if (classes.includes("text-slate-700") || classes.includes("text-gray-700")) {
                        elem.style.color = "#334155";
                    }
                    if (classes.includes("text-slate-900") || classes.includes("text-gray-900")) {
                        elem.style.color = "#0f172a";
                    }
                });

                // Third pass: Fix any remaining light text by checking computed color
                root.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, td, th, div").forEach((el) => {
                    const elem = el as HTMLElement;
                    const computed = window.getComputedStyle(elem);
                    const color = computed.color;
                    
                    // If text is too light (RGB values > 180), make it darker
                    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (match) {
                        const r = parseInt(match[1]);
                        const g = parseInt(match[2]);
                        const b = parseInt(match[3]);
                        // If all RGB values are high (light color), darken it
                        if (r > 180 && g > 180 && b > 180) {
                            elem.style.color = "#334155";
                        }
                        // If it's a medium gray that might be hard to read
                        if (r > 140 && r < 200 && g > 140 && g < 200 && b > 140 && b < 200) {
                            elem.style.color = "#475569";
                        }
                    }
                });

                // Ensure table headers are visible with proper styling
                root.querySelectorAll("th, thead, [class*='font-medium']").forEach((el) => {
                    const elem = el as HTMLElement;
                    if (!elem.style.color || elem.style.color === "") {
                        elem.style.color = "#334155";
                    }
                });
            };

            applyPdfStyles(clone);
            document.body.appendChild(clone);

            try {
            // Find all capturable sections - cards and major sections that should not be split
            // Use rounded-2xl and rounded-3xl as markers for cards
            const sections: HTMLElement[] = [];
            
            // Add header
            const header = clone.querySelector("header");
            if (header) sections.push(header as HTMLElement);
            
            // Add all major cards (rounded-3xl are main cards, rounded-2xl are sub-cards)
            clone.querySelectorAll("section > .rounded-3xl, section > .rounded-2xl, .space-y-6 > .rounded-2xl, .space-y-6 > .rounded-3xl, .space-y-4 > .rounded-2xl").forEach((el) => {
                // Skip if already captured as child of another section
                if (!sections.some(s => s.contains(el))) {
                    sections.push(el as HTMLElement);
                }
            });

            // If no sections found, fall back to capturing main element
            if (sections.length === 0) {
                const mainEl = clone.querySelector("main");
                if (mainEl) sections.push(mainEl as HTMLElement);
            }

            let currentY = margin;
            let isFirstPage = true;

            for (const section of sections) {
                // Skip hidden elements
                if (section.style.display === "none" || section.offsetHeight === 0) continue;

                const canvas = await html2canvas(section, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    windowWidth: 850,
                });

                const imgWidth = usableWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Check if this section fits on the current page
                if (currentY + imgHeight > pageHeight - margin) {
                    // Section doesn't fit, check if it's too tall for any single page
                    if (imgHeight > usableHeight) {
                        // Section is too tall - we need to split it across pages
                        // First, move to a new page if we're not at the top
                        if (currentY > margin + 5) {
                            pdf.addPage();
                            currentY = margin;
                            isFirstPage = false;
                        }

                        // Split the large section across multiple pages
                        let remainingHeight = canvas.height;
                        let sourceY = 0;
                        const pixelsPerMm = canvas.width / imgWidth;

                        while (remainingHeight > 0) {
                            const availableHeight = usableHeight;
                            const availablePixels = availableHeight * pixelsPerMm;
                            const slicePixels = Math.min(remainingHeight, availablePixels);
                            
                            const sliceCanvas = document.createElement("canvas");
                            sliceCanvas.width = canvas.width;
                            sliceCanvas.height = slicePixels;
                            
                            const ctx = sliceCanvas.getContext("2d");
                            if (ctx) {
                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                                ctx.drawImage(
                                    canvas,
                                    0, sourceY, canvas.width, slicePixels,
                                    0, 0, canvas.width, slicePixels
                                );
                                
                                const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
                                const sliceHeightMm = slicePixels / pixelsPerMm;
                                pdf.addImage(sliceData, "JPEG", margin, currentY, imgWidth, sliceHeightMm);
                                
                                currentY += sliceHeightMm;
                            }

                            sourceY += slicePixels;
                            remainingHeight -= slicePixels;

                            if (remainingHeight > 0) {
                                pdf.addPage();
                                currentY = margin;
                            }
                        }
                        currentY += 3; // Small gap after section
                    } else {
                        // Section fits on a new page
                        pdf.addPage();
                        currentY = margin;
                        isFirstPage = false;
                        
                        const imgData = canvas.toDataURL("image/jpeg", 0.92);
                        pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
                        currentY += imgHeight + 3;
                    }
                } else {
                    // Section fits on current page
                    const imgData = canvas.toDataURL("image/jpeg", 0.92);
                    pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 3;
                }
            }

            const baseName = payload.fileMeta.name?.replace(/\.[^/.]+$/, "") || "dataset-report";
            const dateSuffix = new Date(payload.generatedAt).toISOString().split("T")[0];
            pdf.save(`${baseName}-fairness-report-${dateSuffix}.pdf`);
            } finally {
                if (clone && document.body.contains(clone)) {
                    document.body.removeChild(clone);
                }
            }
        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
                <div className="text-center space-y-3">
                    <Skeleton variant="circular" width="2rem" height="2rem" className="mx-auto" />
                    <Skeleton height="1rem" width="180px" className="mx-auto" />
                </div>
            </div>
        );
    }

    if (!payload) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center px-6">
                <div className="max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-8 space-y-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No report found</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Run a fairness evaluation from the dataset testing page to view a detailed report.
                    </p>
                    <button
                        onClick={handleBackToUpload}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Dataset Testing
                    </button>
                </div>
            </div>
        );
    }

    const { result, fileMeta, preview, generatedAt, selections } = payload;
    const verdictStyle = verdictStyles[result.fairness.overallVerdict];

    return (
        <div ref={reportRef} className="min-h-screen bg-slate-50 dark:bg-gray-950">
            <header className="backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToUpload}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors hide-in-pdf"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Dataset Testing
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 hide-in-pdf" />
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Report</p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Fairness & Bias Evaluation Summary</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToUpload}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hide-in-pdf"
                        >
                            <FileText className="w-4 h-4" />
                            Upload New CSV
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="hidden inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-indigo-300 hide-in-pdf"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 grid gap-8 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 space-y-3 bg-slate-50/60 dark:bg-gray-800/60 page-break-avoid">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Upload Info</p>
                        <div>
                            <p className="text-sm text-slate-500">Filename</p>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{fileMeta.name}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-500">Filesize</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatBytes(Number(fileMeta.size ?? 0))}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Uploaded</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(fileMeta.uploadedAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Rows</p>
                                <p className="font-medium text-slate-900 dark:text-white">{result.fairness.datasetStats?.totalRows?.toLocaleString() ?? "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Positive Outcomes</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {result.fairness.datasetStats?.totalPositives?.toLocaleString() ?? "N/A"} ({formatPercent(result.fairness.datasetStats?.overallPositiveRate ?? 0)})
                                </p>
                            </div>
                        </div>
                        {result.fairness.outcomeColumn && (
                            <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                                <p className="text-xs text-slate-500">
                                    Outcome column: <span className="font-medium text-slate-700 dark:text-slate-300">{result.fairness.outcomeColumn}</span> (positive value: <span className="font-medium text-emerald-600">{result.fairness.positiveOutcome}</span>)
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-slate-500">Generated {new Date(generatedAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-6">
                        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${verdictStyle.bg} page-break-avoid`}>
                            <verdictStyle.icon className={`w-6 h-6 ${verdictStyle.color}`} />
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Overall verdict</p>
                                <p className={`text-xl font-semibold ${verdictStyle.color}`}>{verdictStyle.label}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 grid-cols-1 xl:grid-cols-[3fr,1fr]">
                    <div className="space-y-6 min-w-0">
                        <div className="flex items-center justify-between pdf-capture-group">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Sensitive Columns</p>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fairness Analysis by Demographic Group</h3>
                            </div>
                            <p className="text-xs text-slate-500">Groups analyzed: {result.fairness.sensitiveColumns.length}</p>
                        </div>

                        {result.fairness.sensitiveColumns.length === 0 ? (
                            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800/60 dark:text-slate-300">
                                No sensitive columns detected or insufficient data to compute disparities.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {result.fairness.sensitiveColumns.map((column: FairnessColumn) => (
                                    <SensitiveColumnAnalysis
                                        key={column.column}
                                        column={column}
                                        threshold={selections.threshold}
                                        isExporting={isExporting}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 min-w-[280px] max-w-[360px] xl:max-w-none">
                        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-5 space-y-4 page-break-avoid">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Metric Definitions</p>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Understanding the Metrics</h4>
                                </div>
                            </div>
                            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                                <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Distribution</p>
                                    <p>Percentage of dataset represented by each group. Sums to 100%.</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Selection Rate</p>
                                    <p>Proportion of group receiving positive outcome (positive/total).</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Outcome Share</p>
                                    <p>Share of all positive outcomes going to this group. Sums to 100%.</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">DPD (Demographic Parity Difference)</p>
                                    <p>Difference between highest and lowest selection rates. {"<"}10% is fair.</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">DIR (Disparate Impact Ratio)</p>
                                    <p>Ratio of lowest to highest selection rate. ≥80% passes the "four-fifths rule".</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-5 space-y-4 page-break-avoid">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Callout</p>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Action Items</h4>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                <p>
                                    Analysis indicates any group under {selections.threshold * 100}% impact ratio should be investigated.
                                    Focus on slices highlighted in amber within the chart to validate sample sizes and decision rules.
                                </p>
                                <p>Re-run this evaluation whenever your scoring dataset is updated or retrained.</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {metricCards.map((metric) => (
                                <FairnessMetricCard key={metric.key} title={metric.title} data={metric.data} />
                            ))}
                        </div>
                    </div>
                </section>

                {preview && (
                    <DatasetSnapshot preview={preview} />
                )}
            </main>
        </div>
    );
};

export default DatasetTestingReportPage;
