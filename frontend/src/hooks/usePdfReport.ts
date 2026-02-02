import { useState, useCallback, RefObject } from "react";
import {
    styleHeader, styleGrid, styleCards, styleSectionCards,
    styleUploadInfo, styleAnalysisParams, styleVerdictColors,
    styleBadges, styleTypography, styleTables, styleMetricCards,
    styleIcons, styleMutedBackgrounds, fixProgressBars, styleCircleScores,
    styleScoreBadges
} from "../lib/pdfExport/pdfStyles";

interface PdfExportOptions {
    reportRef: RefObject<HTMLDivElement>;
    fileName: string;
    reportTitle?: string;
    projectName?: string;
    generatedAt?: string | Date;
}

/** Time to wait for React re-render and chart rendering before PDF capture */
const PDF_RENDERING_DELAY_MS = 2000;

// PDF Constants - A4 dimensions are 210mm x 297mm
const PDF_CONFIG = {
    margin: 12,
    headerHeight: 22,
    footerHeight: 12,
    contentGap: 3,
} as const;

type jsPDFType = InstanceType<typeof import("jspdf").jsPDF>;

/**
 * CSS reset that forces all colors to standard values
 * This prevents html2canvas from encountering oklab() colors
 */
const PDF_COLOR_RESET_CSS = `
    * {
        color: inherit;
        background-color: inherit;
        border-color: inherit;
        transition: none !important;
        animation: none !important;
    }
    
    :root, html, body {
        color: #0f172a !important;
        background-color: #ffffff !important;
    }
    
    .hide-in-pdf {
        display: none !important;
    }
    
    /* Force common color classes to standard values */
    .text-foreground, .text-primary, [class*="text-slate"], [class*="text-gray"] {
        color: #0f172a !important;
    }
    .text-muted-foreground, .text-muted {
        color: #64748b !important;
    }
    .text-success, [class*="text-green"], [class*="text-emerald"] {
        color: #059669 !important;
    }
    .text-warning, [class*="text-amber"], [class*="text-yellow"] {
        color: #d97706 !important;
    }
    .text-destructive, [class*="text-red"] {
        color: #dc2626 !important;
    }
    
    .bg-background, .bg-card, .bg-white, [class*="bg-slate-50"] {
        background-color: #ffffff !important;
    }
    .bg-muted, [class*="bg-slate-100"], [class*="bg-gray-100"] {
        background-color: #f1f5f9 !important;
    }
    .bg-success, [class*="bg-green"], [class*="bg-emerald"] {
        background-color: #d1fae5 !important;
    }
    .bg-warning, [class*="bg-amber"], [class*="bg-yellow"] {
        background-color: #fef3c7 !important;
    }
    .bg-destructive, [class*="bg-red"] {
        background-color: #fee2e2 !important;
    }
    
    .border, .border-border, [class*="border-slate"], [class*="border-gray"] {
        border-color: #e2e8f0 !important;
    }

    /* Ensure charts and SVGs are visible */
    svg {
        overflow: visible !important;
        display: block !important;
    }
    
    .recharts-responsive-container {
        width: 100% !important;
        height: 220px !important;
        min-height: 220px !important;
    }

    /* Better print styling */
    .recharts-wrapper, .recharts-surface {
        overflow: visible !important;
    }
`;

/**
 * Apply PDF-specific styles to the cloned element
 */
const applyPdfStyles = (clonedElement: HTMLElement) => {
    // Set base styles on root
    clonedElement.style.backgroundColor = "#ffffff";
    clonedElement.style.color = "#0f172a";
    clonedElement.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

    // Force visibility on all elements
    clonedElement.querySelectorAll("*").forEach((el) => {
        const elem = el as HTMLElement;
        const isSvgElement = elem instanceof SVGElement || elem.closest('svg');
        elem.style.opacity = "1";
        elem.style.visibility = "visible";
        if (!isSvgElement && !elem.hasAttribute('data-preserve-transform')) {
            elem.style.transform = "none";
        }
        elem.style.transition = "none";
        elem.style.animation = "none";
    });

    // Apply additional styling functions
    styleHeader(clonedElement);
    styleGrid(clonedElement);
    styleCards(clonedElement);
    styleSectionCards(clonedElement);
    styleUploadInfo(clonedElement);
    styleAnalysisParams(clonedElement);
    styleVerdictColors(clonedElement);
    styleBadges(clonedElement);
    styleTypography(clonedElement);
    styleTables(clonedElement);
    styleMetricCards(clonedElement);
    styleIcons(clonedElement);
    styleMutedBackgrounds(clonedElement);
    styleCircleScores(clonedElement);
    styleScoreBadges(clonedElement);
    fixProgressBars(clonedElement);
};

export const usePdfReport = ({ 
    reportRef, 
    fileName,
    reportTitle = "Assessment Report",
    projectName,
    generatedAt = new Date()
}: PdfExportOptions) => {
    const [isExporting, setIsExporting] = useState(false);

    const exportPdf = useCallback(async () => {
        if (!reportRef.current) return;
        if (isExporting) return;

        try {
            setIsExporting(true);
            
            // Wait for charts and animations to complete
            await new Promise(resolve => setTimeout(resolve, PDF_RENDERING_DELAY_MS));

            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import("jspdf"),
                import("html2canvas")
            ]);
            const jsPDFConstructor = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4", compress: true });
            const pageWidth = pdf.internal.pageSize.getWidth();  // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            const { margin, headerHeight, footerHeight } = PDF_CONFIG;
            const usableWidth = pageWidth - 2 * margin; // 186mm
            const contentTop = headerHeight + 2;
            const contentBottom = pageHeight - footerHeight - 2;
            const usableHeight = contentBottom - contentTop;

            // Helper: Add header to current page
            const addPageHeader = (pdfDoc: jsPDFType, pageNum: number, totalPages: number) => {
                // Header background - gradient effect with primary blue
                pdfDoc.setFillColor(66, 133, 244); 
                pdfDoc.rect(0, 0, pageWidth, headerHeight, "F");

                // Add subtle accent line at bottom of header
                pdfDoc.setFillColor(51, 103, 214);
                pdfDoc.rect(0, headerHeight - 1, pageWidth, 1, "F");

                // Logo/Brand text
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(13);
                pdfDoc.setTextColor(255, 255, 255);
                pdfDoc.text("MATUR.ai", margin, 10);

                // Report title - centered
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(10);
                pdfDoc.setTextColor(255, 255, 255);
                pdfDoc.text(reportTitle, pageWidth / 2, 10, { align: "center" });

                // Project name and page on right
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(8);
                pdfDoc.setTextColor(220, 230, 255);
                if (projectName) {
                    pdfDoc.text(projectName, pageWidth - margin, 9, { align: "right" });
                }
                pdfDoc.text(`Page ${pageNum}/${totalPages}`, pageWidth - margin, 16, { align: "right" });
            };

            // Helper: Add footer to current page
            const addPageFooter = (pdfDoc: jsPDFType, pageNum: number, totalPages: number) => {
                const footerY = pageHeight - 6;

                // Footer line
                pdfDoc.setDrawColor(226, 232, 240);
                pdfDoc.setLineWidth(0.3);
                pdfDoc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(7);
                pdfDoc.setTextColor(100, 116, 139);

                let dateObj: Date;
                if (generatedAt instanceof Date) {
                    dateObj = generatedAt;
                } else if (typeof generatedAt === 'string') {
                    dateObj = new Date(generatedAt);
                    // Check if the string resulted in an invalid date
                    if (isNaN(dateObj.getTime())) {
                        dateObj = new Date();
                    }
                } else {
                    dateObj = new Date();
                }

                const dateStr = dateObj.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                });
                pdfDoc.text(`Generated: ${dateStr}`, margin, footerY);

                pdfDoc.setFont("helvetica", "italic");
                pdfDoc.text("Confidential", pageWidth / 2, footerY, { align: "center" });

                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.text("matur.ai", pageWidth - margin, footerY, { align: "right" });
            };

            // Create a temporary container with our color reset CSS
            const container = document.createElement("div");
            container.id = "pdf-export-container";
            container.style.position = "fixed";
            container.style.top = "0";
            container.style.left = "-10000px";
            container.style.width = "1400px"; // Wider for better quality
            container.style.backgroundColor = "#ffffff";
            container.style.zIndex = "9999";
            container.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

            // Add CSS reset stylesheet
            const styleEl = document.createElement("style");
            styleEl.textContent = PDF_COLOR_RESET_CSS;
            container.appendChild(styleEl);

            // Clone and add the report content
            const clone = reportRef.current.cloneNode(true) as HTMLElement;
            clone.style.width = "100%";
            clone.style.padding = "32px";
            clone.style.backgroundColor = "#ffffff";
            clone.style.color = "#0f172a";
            clone.style.boxSizing = "border-box";
            
            // Apply inline styles to override any CSS variables or computed oklab colors
            clone.querySelectorAll("*").forEach((el) => {
                const elem = el as HTMLElement;
                if (!elem.style.color) {
                    elem.style.color = "inherit";
                }
                if (!elem.style.backgroundColor) {
                    elem.style.backgroundColor = "inherit";
                }
            });

            container.appendChild(clone);
            document.body.appendChild(container);

            // Wait for styles to be applied and layout to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            // Apply PDF-specific styling
            applyPdfStyles(clone);

            try {
                // Capture with reasonable scale for balance between quality and size
                const canvas = await html2canvas(container, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    windowWidth: 1400,
                    imageTimeout: 15000,
                    removeContainer: false,
                });

                if (canvas.width === 0 || canvas.height === 0) {
                    throw new Error("Failed to capture report content");
                }

                // Calculate dimensions
                const imgWidth = usableWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // Single page case
                if (imgHeight <= usableHeight) {
                    const imgData = canvas.toDataURL("image/jpeg", 0.8);
                    pdf.addImage(imgData, "JPEG", margin, contentTop, imgWidth, imgHeight);
                } else {
                    // Multi-page: Calculate proper slicing with break avoidance
                    const pxPerMm = canvas.width / imgWidth;
                    const pageHeightPx = usableHeight * pxPerMm;
                    
                    // Identify elements that should not be split across pages
                    const cloneRect = clone.getBoundingClientRect();
                    const cssToCanvasFactor = canvas.width / clone.offsetWidth;
                    
                    const breakAvoidElements = Array.from(clone.querySelectorAll(".break-inside-avoid, .page-break-avoid"));
                    const breakPoints = breakAvoidElements.map(el => {
                        const rect = (el as HTMLElement).getBoundingClientRect();
                        return {
                            top: (rect.top - cloneRect.top) * cssToCanvasFactor,
                            bottom: (rect.bottom - cloneRect.top) * cssToCanvasFactor
                        };
                    }).sort((a, b) => a.top - b.top);
                    
                    let currentY = 0;
                    let pageNum = 0;

                    while (currentY < canvas.height) {
                        if (pageNum > 0) {
                            pdf.addPage();
                        }

                        const remainingHeight = canvas.height - currentY;
                        let sliceHeight = Math.min(pageHeightPx, remainingHeight);
                        
                        // Check if this slice cuts through any break-avoid element
                        if (remainingHeight > pageHeightPx) {
                            const sliceBottom = currentY + sliceHeight;
                            
                            // Find elements that span across this proposed slice line
                            const brokenElement = breakPoints.find(bp => 
                                bp.top < sliceBottom && bp.bottom > sliceBottom
                            );
                            
                            // Only adjust if the element starts after the current page top 
                            // (otherwise it's just too big to fit on any single page)
                            if (brokenElement && brokenElement.top > currentY + (5 * pxPerMm)) { // 5mm buffer
                                sliceHeight = brokenElement.top - currentY;
                            }
                        }
                        
                        // Create slice canvas
                        const sliceCanvas = document.createElement("canvas");
                        sliceCanvas.width = canvas.width;
                        sliceCanvas.height = sliceHeight;
                        const ctx = sliceCanvas.getContext("2d");
                        
                        if (!ctx) break;

                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                        ctx.drawImage(
                            canvas,
                            0, currentY, canvas.width, sliceHeight,
                            0, 0, canvas.width, sliceHeight
                        );

                        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.8);
                        const sliceHeightMm = sliceHeight / pxPerMm;

                        pdf.addImage(sliceData, "JPEG", margin, contentTop, imgWidth, sliceHeightMm);

                        currentY += sliceHeight;
                        pageNum++;
                    }
                }

                // Add headers and footers to all pages
                const totalPages = (pdf.internal as any).getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    addPageHeader(pdf, i, totalPages);
                    addPageFooter(pdf, i, totalPages);
                }

                pdf.save(fileName);

            } finally {
                if (container && document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            }

        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
        }
    }, [reportRef, fileName, reportTitle, projectName, generatedAt, isExporting]);

    return { exportPdf, isExporting };
};
