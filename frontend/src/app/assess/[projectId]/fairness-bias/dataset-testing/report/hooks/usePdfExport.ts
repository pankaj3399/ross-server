import { useState, useCallback, RefObject, useRef } from "react";
import type { DatasetReportPayload } from "../../types";
import {
    styleHeader, styleGrid, styleCards, styleSectionCards,
    styleUploadInfo, styleAnalysisParams, styleVerdictColors,
    styleBadges, styleTypography, styleTables, styleMetricCards,
    styleIcons, styleMutedBackgrounds, fixProgressBars, 
    removeAnimations, fixSensitiveAnalysis
} from "./pdfStyles";
import { THRESHOLDS } from "../../constants";

interface UsePdfExportProps {
    reportRef: RefObject<HTMLDivElement>;
    payload: DatasetReportPayload | null;
}

/** Time to wait for React re-render and chart rendering before PDF capture */
const PDF_RENDERING_DELAY_MS = 1000;

// PDF Constants
const PDF_CONFIG = {
    margin: 15,
    headerHeight: 25,
    footerHeight: 12,
    contentGap: 8,
} as const;

type jsPDFType = InstanceType<typeof import("jspdf").jsPDF>;

export const usePdfExport = ({ reportRef, payload }: UsePdfExportProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const isExportingRef = useRef(false);

    const exportPdf = useCallback(async () => {
        if (!reportRef.current || !payload) return;
        if (isExportingRef.current) return;

        try {
            setIsExporting(true);
            isExportingRef.current = true;
            await new Promise(resolve => setTimeout(resolve, PDF_RENDERING_DELAY_MS));

            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import("jspdf"),
                import("html2canvas")
            ]);
            const jsPDFConstructor = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const { margin, headerHeight, footerHeight } = PDF_CONFIG;
            const usableWidth = pageWidth - 2 * margin;
            const contentTop = margin + headerHeight;
            const contentBottom = pageHeight - footerHeight;
            const usableHeight = contentBottom - contentTop;

            // Helper: Add header to current page
            const addPageHeader = (pdfDoc: any, pageNum: number, totalPages: number) => {
                const { margin, headerHeight } = PDF_CONFIG;
                
                // Header background - Primary Blue #4285F4
                pdfDoc.setFillColor(66, 133, 244); 
                pdfDoc.rect(0, 0, pageWidth, headerHeight, "F");

                // Logo/Brand text - CENTERED
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(14);
                pdfDoc.setTextColor(255, 255, 255); // White text
                // Vertically centered: title at 11, subtitle at 18 (total height 25)
                pdfDoc.text("MATUR.ai", pageWidth / 2, 11, { align: "center" });

                // Report title
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(9);
                pdfDoc.setTextColor(255, 255, 255); // White text
                pdfDoc.text("Fairness & Bias Evaluation Report", pageWidth / 2, 18, { align: "center" });

                // Project name removed from right as per request
                
                // Note: Removed separator line as the blue block serves as a cleaner separator
            };

            // Helper: Add footer to current page
            const addPageFooter = (pdfDoc: any, pageNum: number, totalPages: number) => {
                const footerY = pageHeight - 8;

                // Left side: Date and system info
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(8);
                pdfDoc.setTextColor(100, 116, 139); // slate-500

                const dateStr = new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });
                pdfDoc.text(`Generated: ${dateStr}`, margin, footerY);

                // Center: Confidential notice
                pdfDoc.setFont("helvetica", "italic");
                pdfDoc.setFontSize(7);
                pdfDoc.text("Confidential - For Internal Use Only", pageWidth / 2, footerY, { align: "center" });

                // Right side: Page number
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(8);
                pdfDoc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });

                // Separator line above footer
                pdfDoc.setDrawColor(226, 232, 240);
                pdfDoc.setLineWidth(0.2);
                pdfDoc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
            };

            // Helper: Create summary/cover page
            const createSummaryPage = (pdfDoc: any) => {
                // Title area - more compact
                pdfDoc.setFillColor(249, 250, 251); // gray-50
                pdfDoc.rect(0, 20, pageWidth, 50, "F");

                // Main title
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(24);
                pdfDoc.setTextColor(15, 23, 42); // slate-900
                pdfDoc.text("Fairness & Bias Evaluation Report", pageWidth / 2, 42, { align: "center" });

                // Subtitle - Project name
                if (payload.projectName) {
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(12);
                    pdfDoc.setTextColor(79, 70, 229); // indigo-600
                    pdfDoc.text(payload.projectName, pageWidth / 2, 55, { align: "center" });
                }

                // Start content after title area
                let yPos = 78;
                const leftCol = margin + 5;
                const rightCol = pageWidth / 2 + 5;

                // Report Summary - compact inline layout
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(11);
                pdfDoc.setTextColor(15, 23, 42);
                pdfDoc.text("Report Summary", margin, yPos);
                yPos += 8;

                // Draw compact summary box
                pdfDoc.setFillColor(248, 250, 252);
                pdfDoc.setDrawColor(226, 232, 240);
                pdfDoc.roundedRect(margin, yPos, usableWidth, 32, 2, 2, "FD");

                const boxY = yPos + 8;
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(9);

                // Row 1
                pdfDoc.setTextColor(71, 85, 105);
                pdfDoc.text("Dataset:", leftCol, boxY);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(15, 23, 42);
                const fileName = payload.fileMeta.name || "N/A";
                const truncatedFileName = fileName.length > 25 ? fileName.substring(0, 22) + "..." : fileName;
                pdfDoc.text(truncatedFileName, leftCol + 20, boxY);

                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(71, 85, 105);
                pdfDoc.text("Rows:", rightCol, boxY);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(15, 23, 42);
                pdfDoc.text(payload.result.fairness.datasetStats?.totalRows?.toLocaleString() || "N/A", rightCol + 15, boxY);

                // Row 2
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(71, 85, 105);
                pdfDoc.text("Generated:", leftCol, boxY + 8);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(15, 23, 42);
                const generatedDate = new Date(payload.generatedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                });
                pdfDoc.text(generatedDate, leftCol + 24, boxY + 8);

                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(71, 85, 105);
                pdfDoc.text("Threshold:", rightCol, boxY + 8);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(15, 23, 42);
                const threshold = payload.selections?.threshold ?? THRESHOLDS.FAIRNESS.HIGH;
                pdfDoc.text(`${(threshold * 100).toFixed(0)}%`, rightCol + 24, boxY + 8);

                // Row 3
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(71, 85, 105);
                pdfDoc.text("Method:", leftCol, boxY + 16);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(15, 23, 42);
                const method = payload.selections?.method === "selectionRate" ? "Selection Rate" : "Impact Ratio";
                pdfDoc.text(method, leftCol + 18, boxY + 16);

                yPos += 40;

                // Overall Verdict - compact
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(11);
                pdfDoc.setTextColor(15, 23, 42);
                pdfDoc.text("Overall Verdict", margin, yPos);
                yPos += 6;

                const verdict = payload.result.fairness.overallVerdict;
                let verdictColor: [number, number, number];
                let verdictBgColor: [number, number, number];
                let verdictLabel: string;

                switch (verdict) {
                    case "pass":
                        verdictColor = [5, 150, 105];
                        verdictBgColor = [240, 253, 244];
                        verdictLabel = "PASS - Fair";
                        break;
                    case "caution":
                        verdictColor = [217, 119, 6];
                        verdictBgColor = [255, 251, 235];
                        verdictLabel = "CAUTION - Review Recommended";
                        break;
                    case "fail":
                        verdictColor = [220, 38, 38];
                        verdictBgColor = [254, 242, 242];
                        verdictLabel = "FAIL - Bias Detected";
                        break;
                    default:
                        verdictColor = [100, 116, 139];
                        verdictBgColor = [248, 250, 252];
                        verdictLabel = "Insufficient Data";
                }

                pdfDoc.setFillColor(...verdictBgColor);
                pdfDoc.setDrawColor(...verdictColor);
                pdfDoc.setLineWidth(0.5);
                pdfDoc.roundedRect(margin, yPos, usableWidth, 14, 2, 2, "FD");

                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(12);
                pdfDoc.setTextColor(...verdictColor);
                pdfDoc.text(verdictLabel, pageWidth / 2, yPos + 9, { align: "center" });

                yPos += 20;

                // Metric scores - compact horizontal layout
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(11);
                pdfDoc.setTextColor(15, 23, 42);
                pdfDoc.text("Metric Scores", margin, yPos);
                yPos += 6;

                const metrics = [
                    { name: "Fairness", data: payload.result.fairnessResult },
                    { name: "Biasness", data: payload.result.biasness },
                    { name: "Toxicity", data: payload.result.toxicity },
                    { name: "Relevance", data: payload.result.relevance },
                    { name: "Faithfulness", data: payload.result.faithfulness },
                ];

                const cardWidth = (usableWidth - 8) / 5;
                const cardHeight = 24;

                metrics.forEach((metric, idx) => {
                    const x = margin + idx * (cardWidth + 2);

                    pdfDoc.setFillColor(248, 250, 252);
                    pdfDoc.setDrawColor(226, 232, 240);
                    pdfDoc.setLineWidth(0.3);
                    pdfDoc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, "FD");

                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(7);
                    pdfDoc.setTextColor(100, 116, 139);
                    pdfDoc.text(metric.name, x + cardWidth / 2, yPos + 7, { align: "center" });

                    const score = (metric.data.score * 100).toFixed(0) + "%";
                    let scoreColor: [number, number, number];
                    switch (metric.data.label) {
                        case "high": scoreColor = [5, 150, 105]; break;
                        case "moderate": scoreColor = [217, 119, 6]; break;
                        default: scoreColor = [220, 38, 38];
                    }
                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.setFontSize(12);
                    pdfDoc.setTextColor(...scoreColor);
                    pdfDoc.text(score, x + cardWidth / 2, yPos + 18, { align: "center" });
                });

                yPos += cardHeight + 8;

                // Sensitive columns summary - only show if space available
                const sensitiveColumns = payload.result.fairness.sensitiveColumns;
                const footerStart = pageHeight - footerHeight - 8;
                const remainingSpace = footerStart - yPos;

                if (sensitiveColumns.length > 0 && remainingSpace > 30) {
                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.setFontSize(11);
                    pdfDoc.setTextColor(15, 23, 42);
                    pdfDoc.text("Sensitive Columns Analyzed", margin, yPos);
                    yPos += 8;

                    // Calculate how many rows fit
                    const rowHeight = 8;
                    const headerRowHeight = 10;
                    const availableForRows = remainingSpace - 20; // Space for title and header
                    const maxRows = Math.max(1, Math.floor((availableForRows - headerRowHeight) / rowHeight));
                    const displayColumns = sensitiveColumns.slice(0, maxRows);

                    // Table header
                    pdfDoc.setFillColor(241, 245, 249);
                    pdfDoc.setDrawColor(226, 232, 240);
                    pdfDoc.roundedRect(margin, yPos, usableWidth, headerRowHeight, 1, 1, "FD");
                    
                    pdfDoc.setFont("helvetica", "bold");
                    pdfDoc.setFontSize(8);
                    pdfDoc.setTextColor(51, 65, 85);
                    
                    const colWidths = [45, 35, 35, 45];
                    let xPos = margin + 4;
                    pdfDoc.text("Column", xPos, yPos + 7);
                    xPos += colWidths[0];
                    pdfDoc.text("Verdict", xPos, yPos + 7);
                    xPos += colWidths[1];
                    pdfDoc.text("Groups", xPos, yPos + 7);
                    xPos += colWidths[2];
                    pdfDoc.text("Disparity", xPos, yPos + 7);

                    yPos += headerRowHeight;

                    // Table rows
                    displayColumns.forEach((col, idx) => {
                        const rowY = yPos + (idx * rowHeight);
                        
                        if (idx % 2 === 0) {
                            pdfDoc.setFillColor(248, 250, 252);
                            pdfDoc.rect(margin, rowY, usableWidth, rowHeight, "F");
                        }

                        pdfDoc.setFont("helvetica", "normal");
                        pdfDoc.setFontSize(8);
                        pdfDoc.setTextColor(55, 65, 81);

                        xPos = margin + 4;
                        const colName = col.column.length > 12 ? col.column.substring(0, 10) + ".." : col.column;
                        pdfDoc.text(colName, xPos, rowY + 6);
                        
                        xPos += colWidths[0];
                        let textColor: [number, number, number];
                        switch (col.verdict) {
                            case "pass": textColor = [5, 150, 105]; break;
                            case "caution": textColor = [217, 119, 6]; break;
                            case "fail": textColor = [220, 38, 38]; break;
                            default: textColor = [100, 116, 139];
                        }
                        pdfDoc.setTextColor(...textColor);
                        pdfDoc.setFont("helvetica", "bold");
                        pdfDoc.text(col.verdict.toUpperCase(), xPos, rowY + 6);

                        pdfDoc.setTextColor(55, 65, 81);
                        pdfDoc.setFont("helvetica", "normal");
                        xPos += colWidths[1];
                        pdfDoc.text(col.groups.length.toString(), xPos, rowY + 6);

                        xPos += colWidths[2];
                        pdfDoc.text((col.disparity * 100).toFixed(1) + "%", xPos, rowY + 6);
                    });

                    // Show truncation notice if needed
                    if (displayColumns.length < sensitiveColumns.length) {
                        const noticeY = yPos + (displayColumns.length * rowHeight) + 4;
                        pdfDoc.setFont("helvetica", "italic");
                        pdfDoc.setFontSize(7);
                        pdfDoc.setTextColor(100, 116, 139);
                        pdfDoc.text(`+ ${sensitiveColumns.length - displayColumns.length} more columns (see detailed analysis)`, margin, noticeY);
                    }
                }
            };

            // Clone the report container for PDF-specific rendering
            const clone = reportRef.current.cloneNode(true) as HTMLElement;
            clone.style.width = "1200px";
            clone.style.position = "fixed";
            clone.style.top = "0";
            clone.style.left = "-10000px";
            clone.style.zIndex = "1000";
            clone.style.backgroundColor = "#ffffff";
            clone.style.color = "#0f172a";
            clone.style.padding = "24px";
            clone.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

            // Apply all PDF styling
            const applyPdfStyles = (root: HTMLElement) => {
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

                // Force light mode
                root.querySelectorAll("*").forEach((el) => {
                    const elem = el as HTMLElement;
                    const safeClass = typeof elem.className === 'string'
                        ? elem.className
                        : (elem.getAttribute('class') || '');
                    const computed = window.getComputedStyle(elem);
                    if (!computed) return;

                    if (safeClass.includes("dark:bg-gray") || safeClass.includes("dark:bg-slate")) {
                        if (safeClass.includes("bg-white")) {
                            elem.style.backgroundColor = "#ffffff";
                        } else if (safeClass.includes("bg-slate-50")) {
                            elem.style.backgroundColor = "#f8fafc";
                        } else {
                            const bg = computed.backgroundColor;
                            if (bg) {
                                const bgMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                if (bgMatch && bgMatch.length >= 4) {
                                    const r = parseInt(bgMatch[1], 10);
                                    const g = parseInt(bgMatch[2], 10);
                                    const b = parseInt(bgMatch[3], 10);
                                    if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r < 100 && g < 100 && b < 100) {
                                        elem.style.backgroundColor = "#ffffff";
                                    }
                                }
                            }
                        }
                    }

                    if (safeClass.includes("text-white") || safeClass.includes("dark:text-white")) {
                        elem.style.color = "#0f172a";
                    }
                    if (safeClass.includes("dark:text-slate-300") || safeClass.includes("dark:text-slate-400")) {
                        elem.style.color = "#475569";
                    }
                    if (safeClass.includes("dark:border")) {
                        elem.style.borderColor = "#e2e8f0";
                    }


                });

                // Final safety: Inject a global CSS block to catch pseudo-elements and variables
                const styleSheet = document.createElement("style");
                styleSheet.textContent = `
                    .pdf-export-root * { 
                        transition: none !important; 
                        animation: none !important; 
                    }
                    .pdf-export-root *::before,
                    .pdf-export-root *::after {
                        background-color: transparent !important;
                        color: inherit !important;
                        border-color: inherit !important;
                        box-shadow: none !important;
                        content: none !important; /* Some icons use ::before for oklch icons */
                    }
                    /* Force variables to hex within the clone */
                    .pdf-export-root {
                        --success: #34a853 !important;
                        --warning: #fbbc04 !important;
                        --destructive: #ea4335 !important;
                        --primary: #4285f4 !important;
                    }
                `;
                root.appendChild(styleSheet);
                styleHeader(root);
                styleGrid(root);
                styleCards(root);
                styleSectionCards(root);
                styleUploadInfo(root);
                styleAnalysisParams(root);
                styleVerdictColors(root);
                styleBadges(root);
                styleTypography(root);
                styleTables(root);
                styleMetricCards(root);
                styleIcons(root);
                styleMutedBackgrounds(root);
                fixProgressBars(root);
                fixSensitiveAnalysis(root);
                removeAnimations(root);

                // Analysis boxes are now visible as per request
            };

            applyPdfStyles(clone);



            document.body.appendChild(clone);

            try {
                // Hide original header - we'll use PDF native header
                const headerEl = clone.querySelector("header");
                if (headerEl) {
                    (headerEl as HTMLElement).style.display = "none";
                }

                // Find sections to capture
                const sections: { element: HTMLElement; label: string; scale?: number }[] = [];

                // Get the main sections container
                const mainContent = clone.querySelector("main");
                if (mainContent) {
                    // NOTE: We skip the first section (summary) since it's drawn natively on page 1
                    // First section: Upload Info + Analysis Parameters + Verdict + Metrics - SKIP
                    // const firstSection = mainContent.querySelector("section.rounded-3xl");

                    // Second section: Sensitive Columns (each card separately for better page breaks)
                    const sensitiveSection = mainContent.querySelectorAll("section.space-y-6");
                    sensitiveSection.forEach((section) => {
                        // Get individual cards (skip the header - it will be drawn natively)
                        section.querySelectorAll(".grid.lg\\:grid-cols-2 > *").forEach((card, cardIdx) => {
                            sections.push({
                                element: card as HTMLElement,
                                label: `sensitive-card-${cardIdx}`,
                                scale: 1.8
                            });
                        });
                    });

                    // Dataset preview section (if exists)
                    const previewSection = mainContent.querySelector("[class*='Dataset']");
                    if (previewSection) {
                        sections.push({
                            element: previewSection as HTMLElement,
                            label: "dataset-preview",
                            scale: 1.5
                        });
                    }
                }

                // Fallback: capture main sections (skip first one as it's the summary, drawn natively)
                if (sections.length === 0) {
                    // Capture Overall Metrics section (contains the detailed Analysis)
                    // We need to find the section within the clone.

                    // Capture Sensitive Column Charts individually to allow proper page breaking
                    // Target the second section (.space-y-6) which contains the sensitive columns
                    const sensitiveSection = clone.querySelector("main > section.space-y-6");
                    
                    if (sensitiveSection) {
                        const sensitiveCharts = sensitiveSection.querySelectorAll(".page-break-avoid");
                        
                        if (sensitiveCharts.length > 0) {
                            sensitiveCharts.forEach((chart, idx) => {
                                 // Ensure charts have white background and no box shadow artifacts for capture
                                 const chartEl = chart as HTMLElement;
                                 chartEl.style.backgroundColor = "#ffffff";
                                 chartEl.style.height = "auto"; // Allow full expansion
                                 chartEl.style.overflow = "visible"; // Ensure nothing is clipped
                                 
                                 sections.push({ 
                                     element: chartEl, 
                                     label: `sensitive-column-${idx}`, 
                                     scale: 1.8 
                                 });
                            });
                        }
                    }
                } // end fallback if (sections.length === 0)

                // ALWAYS capture Overall Metrics section at the end
                // Use the ORIGINAL section in the clone (not a sub-clone) so it has proper dimensions
                const metricsSection = clone.querySelector("main > section.rounded-3xl") as HTMLElement | null;
                
                if (metricsSection) {
                    console.log("[PDF Export] Found metricsSection:", metricsSection.tagName, "offsetHeight:", metricsSection.offsetHeight, "offsetWidth:", metricsSection.offsetWidth);
                    // Hide Upload Info/Analysis Params grid (first .grid.gap-6 child)
                    const uploadGrid = metricsSection.querySelector(".grid.gap-6.lg\\:grid-cols-2");
                    if (uploadGrid) (uploadGrid as HTMLElement).style.display = "none";
                    
                    // Hide the verdict banner
                    const verdictBanner = metricsSection.querySelector(".space-y-6");
                    if (verdictBanner) (verdictBanner as HTMLElement).style.display = "none";

                    // Force light mode styles on all children
                    metricsSection.style.backgroundColor = "#ffffff";
                    metricsSection.style.color = "#0f172a";
                    metricsSection.querySelectorAll("*").forEach(node => {
                        const el = node as HTMLElement;
                        if (el.style) {
                            el.style.color = "#0f172a";
                            const cls = el.getAttribute("class") || "";
                            if (cls.includes("dark:bg-gray-900") || cls.includes("dark:bg-slate-900")) {
                                el.style.backgroundColor = "#ffffff";
                                el.style.borderColor = "#e2e8f0";
                            }
                        }
                    });

                    sections.push({ 
                        element: metricsSection, 
                        label: "overall-metrics-analysis", 
                        scale: 1.8 
                    });
                }

                // If genuinely nothing was captured (e.g. empty report), fallback to whole main
                if (sections.length === 0) {
                    const mainEl = clone.querySelector("main");
                    if (mainEl) {
                        sections.push({ element: mainEl as HTMLElement, label: "full-report", scale: 1.5 });
                    }
                }

                // Create PDF pages
                // Page 1: Summary page (native PDF drawing)
                createSummaryPage(pdf as any);

                // Filter out empty or invalid sections before processing
                const validSections = sections.filter(section => {
                    if (section.element.style.display === "none") return false;
                    if (section.element.offsetHeight === 0 || section.element.offsetWidth === 0) return false;
                    return true;
                });
                console.log("[PDF Export] Total sections:", sections.length, "Valid sections:", validSections.length, "Labels:", sections.map(s => s.label + "(" + s.element.offsetHeight + "x" + s.element.offsetWidth + ")"));

                // Only add detailed pages if there are valid sections
                if (validSections.length > 0) {
                    // Page 2+: Detailed sections
                    pdf.addPage();
                    let currentPage = 2;
                    let currentY = contentTop;

                    // Add "Detailed Analysis" section title on page 2
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(16);
                    pdf.setTextColor(15, 23, 42);
                    pdf.text("Detailed Analysis", margin, currentY);
                    currentY += 8;

                    // Add subtitle for sensitive columns
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 116, 139);
                    pdf.text("Fairness Analysis by Demographic Group", margin, currentY);
                    
                    const sensitiveColCount = payload.result.fairness.sensitiveColumns.length;
                    pdf.text(`${sensitiveColCount} groups analyzed`, pageWidth - margin, currentY, { align: "right" });
                    currentY += 12;

                // Capture and add sections
                for (const section of validSections) {

                    try {
                        const scale = section.scale || 2;
                        let canvas = await html2canvas(section.element, {
                            scale,
                            useCORS: true,
                            backgroundColor: "#ffffff",
                            logging: false,
                            windowWidth: 1200,
                            scrollX: 0,
                            scrollY: 0,
                        });

                        // Check canvas size limits
                        const MAX_PIXELS = 50000000;
                        const MAX_DIMENSION = 15000;

                        if (canvas.width * canvas.height > MAX_PIXELS || canvas.height > MAX_DIMENSION) {
                            canvas = await html2canvas(section.element, {
                                scale: 1,
                                useCORS: true,
                                backgroundColor: "#ffffff",
                                logging: false,
                                windowWidth: 1200,
                            });

                            if (canvas.width * canvas.height > MAX_PIXELS) {
                                console.warn("Section too large, skipping:", section.label);
                                continue;
                            }
                        }

                        // Skip empty canvases
                        if (canvas.width === 0 || canvas.height === 0) continue;

                        // Skip very small captures (likely just whitespace or tiny fragments)
                        if (canvas.height < 20) continue;

                        const imgWidth = usableWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;

                        // Skip if the resulting image would be too small to be meaningful
                        if (imgHeight < 5) continue;

                        // Scale down detailed sections to fit more content
                        const scaleFactor = section.label.includes("sensitive") ? 0.75 : 1;
                        const scaledHeight = imgHeight * scaleFactor;
                        const scaledWidth = imgWidth * scaleFactor;
                        const xOffset = (usableWidth - scaledWidth) / 2;

                        // Check if we need a new page
                        if (currentY + scaledHeight > contentBottom) {
                            // Only create a new page if we've actually added content to the current one
                            const hasContentOnCurrentPage = currentY > contentTop + 25; // Title takes about 20-25mm
                            
                            // Check if section fits on a fresh page
                            if (scaledHeight > usableHeight) {
                                // Section is larger than a page - need to slice
                                if (hasContentOnCurrentPage) {
                                    pdf.addPage();
                                    currentPage++;
                                    currentY = contentTop;
                                }

                                const pageHeightInPx = (usableHeight * canvas.width) / imgWidth;
                                let remainingHeightPx = canvas.height;
                                let sourceY = 0;

                                while (remainingHeightPx > 0) {
                                    const currentSliceHeightPx = Math.min(remainingHeightPx, pageHeightInPx);

                                    const tempCanvas = document.createElement('canvas');
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = currentSliceHeightPx;
                                    const tCtx = tempCanvas.getContext('2d');
                                    if (!tCtx) break;

                                    tCtx.fillStyle = "#ffffff";
                                    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                    tCtx.drawImage(
                                        canvas,
                                        0, sourceY, canvas.width, currentSliceHeightPx,
                                        0, 0, tempCanvas.width, currentSliceHeightPx
                                    );

                                    const sliceImgData = tempCanvas.toDataURL("image/jpeg", 0.92);
                                    const slicePdfHeight = (currentSliceHeightPx * imgWidth) / canvas.width * scaleFactor;

                                    pdf.addImage(sliceImgData, "JPEG", margin + xOffset, currentY, scaledWidth, slicePdfHeight);

                                    sourceY += currentSliceHeightPx;
                                    remainingHeightPx -= currentSliceHeightPx;

                                    if (remainingHeightPx > 0) {
                                        pdf.addPage();
                                        currentPage++;
                                        currentY = contentTop;
                                    } else {
                                        currentY += slicePdfHeight + PDF_CONFIG.contentGap;
                                    }
                                }
                            } else {
                                // Section fits on a fresh page but not current - start new page
                                if (hasContentOnCurrentPage) {
                                    pdf.addPage();
                                    currentPage++;
                                    currentY = contentTop;
                                }

                                const imgData = canvas.toDataURL("image/jpeg", 0.92);
                                pdf.addImage(imgData, "JPEG", margin + xOffset, currentY, scaledWidth, scaledHeight);
                                currentY += scaledHeight + PDF_CONFIG.contentGap;
                            }
                        } else {
                            // Fits on current page
                            const imgData = canvas.toDataURL("image/jpeg", 0.92);
                            pdf.addImage(imgData, "JPEG", margin + xOffset, currentY, scaledWidth, scaledHeight);
                            currentY += scaledHeight + PDF_CONFIG.contentGap;
                        }
                    } catch (sectionError) {
                        console.error("Error capturing section:", section.label, sectionError);
                    }
                }
                } // End of if (validSections.length > 0)

                // Add headers and footers to all pages
                const totalPages = (pdf as any).internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    addPageHeader(pdf as any, i, totalPages);
                    addPageFooter(pdf as any, i, totalPages);
                }

                // Save PDF
                const baseName = payload.fileMeta.name?.replace(/\.[^/.]+$/, "") || "dataset-report";
                const projectSlug = payload.projectName?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() || "";
                let dateSuffix: string;
                try {
                    dateSuffix = new Date(payload.generatedAt).toISOString().split("T")[0];
                } catch {
                    dateSuffix = new Date().toISOString().split("T")[0];
                }

                const filename = projectSlug
                    ? `${projectSlug}-fairness-report-${dateSuffix}.pdf`
                    : `${baseName}-fairness-report-${dateSuffix}.pdf`;

                pdf.save(filename);
            } finally {
                if (clone && document.body.contains(clone)) {
                    document.body.removeChild(clone);
                }
            }
        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
            isExportingRef.current = false;
        }
    }, [reportRef, payload]);

    return { exportPdf, isExporting };
};
