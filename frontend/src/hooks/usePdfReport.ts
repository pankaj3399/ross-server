import { useState, useCallback, RefObject, useRef } from "react";
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
    sectionSelector?: string; // CSS selector for top-level report sections
}

/** Time to wait for React re-render and chart rendering before PDF capture */
const PDF_RENDERING_DELAY_MS = 10;

// PDF Constants - A4 dimensions are 210mm x 297mm
const PDF_CONFIG = {
    margin: 10,
    headerHeight: 28, 
    footerHeight: 12,
} as const;

type jsPDFType = any;

/**
 * CSS reset that forces all colors to standard values
 * This prevents html2canvas from encountering oklab() colors
 */
const PDF_COLOR_RESET_CSS = `
    #pdf-export-container * {
        color: inherit;
        background-color: inherit;
        border-color: inherit;
        transition: none !important;
        animation: none !important;
    }
    
    #pdf-export-container, #pdf-export-container :is(root, html, body) {
        color: #0f172a !important;
        background-color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }
    
    #pdf-export-container * {
        font-family: inherit !important;
        text-rendering: auto !important;
        -webkit-font-smoothing: antialiased !important;
    }
    
    #pdf-export-container .hide-in-pdf {
        display: none !important;
    }
    
    /* Force common color classes to standard values */
    #pdf-export-container .text-foreground, #pdf-export-container .text-primary, #pdf-export-container [class*="text-slate"], #pdf-export-container [class*="text-gray"] {
        color: #0f172a !important;
    }
    #pdf-export-container .text-muted-foreground, #pdf-export-container .text-muted {
        color: #64748b !important;
    }
    #pdf-export-container .text-success, #pdf-export-container [class*="text-green"], #pdf-export-container [class*="text-emerald"] {
        color: #059669 !important;
    }
    #pdf-export-container .text-warning, #pdf-export-container [class*="text-amber"], #pdf-export-container [class*="text-yellow"] {
        color: #d97706 !important;
    }
    #pdf-export-container .text-destructive, #pdf-export-container [class*="text-red"] {
        color: #dc2626 !important;
    }
    
    #pdf-export-container .bg-background, #pdf-export-container .bg-card, #pdf-export-container .bg-white, #pdf-export-container [class*="bg-slate-50"] {
        background-color: #ffffff !important;
    }
    #pdf-export-container .bg-muted, #pdf-export-container [class*="bg-slate-100"], #pdf-export-container [class*="bg-gray-100"] {
        background-color: #f1f5f9 !important;
    }
    #pdf-export-container .bg-success, #pdf-export-container [class*="bg-green"], #pdf-export-container [class*="bg-emerald"] {
        background-color: #d1fae5 !important;
    }
    #pdf-export-container .bg-warning, #pdf-export-container [class*="bg-amber"], #pdf-export-container [class*="bg-yellow"] {
        background-color: #fef3c7 !important;
    }
    #pdf-export-container .bg-destructive, #pdf-export-container [class*="bg-red"] {
        background-color: #fee2e2 !important;
    }
    
    #pdf-export-container .border, #pdf-export-container .border-border, #pdf-export-container [class*="border-slate"], #pdf-export-container [class*="border-gray"] {
        border-color: #e2e8f0 !important;
    }

    /* Ensure charts and SVGs are visible */
    #pdf-export-container svg {
        overflow: visible !important;
        display: block !important;
    }
    
    #pdf-export-container .recharts-responsive-container {
        width: 100% !important;
        height: 220px !important;
        min-height: 220px !important;
    }

    /* Better print styling */
    #pdf-export-container .recharts-wrapper, #pdf-export-container .recharts-surface {
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

    // Force all details elements to be open so their content is visible in the PDF
    clonedElement.querySelectorAll("details").forEach((details) => {
        (details as HTMLDetailsElement).open = true;
    });

    // Remove hidden elements before styling
    clonedElement.querySelectorAll(".hide-in-pdf").forEach(el => el.remove());

    // Apply additional styling functions in strict order
    styleGrid(clonedElement);
    styleCards(clonedElement);
    styleSectionCards(clonedElement);
    styleUploadInfo(clonedElement);
    styleVerdictColors(clonedElement);
    styleTypography(clonedElement);
    styleTables(clonedElement);
    styleMetricCards(clonedElement);
    styleIcons(clonedElement);
    styleMutedBackgrounds(clonedElement);
    styleCircleScores(clonedElement);
    styleScoreBadges(clonedElement);
    fixProgressBars(clonedElement);
    styleBadges(clonedElement);
    styleAnalysisParams(clonedElement); // Fixes labels and Auth strategy box
    styleHeader(clonedElement); // Applied last to override any generic flex rules
};

export const usePdfReport = ({ 
    reportRef, 
    fileName,
    reportTitle = "Assessment Report",
    projectName,
    generatedAt = new Date(),
    sectionSelector
}: PdfExportOptions) => {
    const [isExporting, setIsExporting] = useState(false);
    const isExportingRef = useRef(false);

    const exportPdf = useCallback(async () => {
        if (!reportRef.current) return;
        if (isExportingRef.current) return;

        try {
            setIsExporting(true);
            isExportingRef.current = true;
            
            // Wait for charts and animations to complete
            await new Promise(resolve => setTimeout(resolve, PDF_RENDERING_DELAY_MS));

            const [jsPDFModule, html2canvasModule] = await Promise.all([
                import("jspdf"),
                import("html2canvas")
            ]);
            
            const jsPDFConstructor = (jsPDFModule as any).jsPDF || jsPDFModule.default;
            const html2canvas = html2canvasModule.default || html2canvasModule;

            if (!jsPDFConstructor) {
                throw new Error("Could not find jsPDF constructor");
            }
            if (!html2canvas) {
                throw new Error("Could not find html2canvas function");
            }

            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4", compress: true });
            const pageWidth = pdf.internal.pageSize.getWidth();  // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            const { margin, headerHeight, footerHeight } = PDF_CONFIG;
            const usableWidth = pageWidth - 2 * margin; // 190mm
            const contentTop = 30; // Almost flush with header (28mm)
            const contentBottom = pageHeight - footerHeight - 5;
            const usableHeight = contentBottom - contentTop;

            // Helper: Add header to current page
            const addPageHeader = (pdfDoc: any, pageNum: number, totalPages: number) => {
                // Clear the header area with white rect first to avoid content bleed
                pdfDoc.setFillColor(255, 255, 255);
                pdfDoc.rect(0, 0, pageWidth, 28, "F");

                // FULL BLEED Header background
                pdfDoc.setFillColor(66, 133, 244); 
                pdfDoc.rect(0, 0, pageWidth, 28, "F");

                // Report title - centered white text
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(11);
                pdfDoc.setTextColor(255, 255, 255);
                pdfDoc.text(reportTitle.toUpperCase(), pageWidth / 2, 17, { align: "center" });
                
                // Brand indicator
                pdfDoc.setFontSize(9);
                pdfDoc.text("MATUR.ai", margin, 17);
            };

            // Helper: Add footer to current page
            const addPageFooter = (pdfDoc: any, pageNum: number, totalPages: number) => {
                const footerY = pageHeight - 12;

                // Clear the footer area
                pdfDoc.setFillColor(255, 255, 255);
                pdfDoc.rect(0, pageHeight - 15, pageWidth, 15, "F");

                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setFontSize(8);
                pdfDoc.setTextColor(148, 163, 184); // slate-400

                pdfDoc.text("CONFIDENTIAL", margin, footerY);
                pdfDoc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
                pdfDoc.text("MATUR.ai Assessment Report", pageWidth / 2, footerY, { align: "center" });
            };

            // Setup temporary container
            const container = document.createElement("div");
            container.id = "pdf-export-container";
            container.style.position = "absolute";
            container.style.top = "0";
            container.style.left = "-10000px"; 
            container.style.width = "1100px";
            container.style.padding = "0px";
            container.style.backgroundColor = "#ffffff";
            container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            container.style.boxSizing = "border-box";

            const styleEl = document.createElement("style");
            styleEl.textContent = PDF_COLOR_RESET_CSS;
            container.appendChild(styleEl);

            const clone = reportRef.current.cloneNode(true) as HTMLElement;
            clone.style.width = "100%";
            clone.style.padding = "0px";
            clone.style.backgroundColor = "#ffffff";
            clone.style.color = "#0f172a";
            clone.style.boxSizing = "border-box";
            clone.style.height = "auto";
            clone.style.minHeight = "min-content";
            clone.style.overflow = "visible";
            
            clone.querySelectorAll("*").forEach((el) => {
                const elem = el as HTMLElement;
                elem.style.overflow = "visible";
                elem.style.maxHeight = "none";
                elem.style.minHeight = "auto";
            });

            container.appendChild(clone);
            document.body.appendChild(container);

            // Wait for charts and styles to settle
            await new Promise(resolve => setTimeout(resolve, 500));
            applyPdfStyles(clone);

            // PDF Generation Logic: Page Composition Engine (ZERO SPLIT + FAST)
            const generateSectionalPdf = async () => {
                const originalScrollX = window.scrollX;
                const originalScrollY = window.scrollY;

                try {
                    document.documentElement.style.overflow = "hidden";
                    window.scrollTo(0, 0);

                    // 1. Identify all "Atomic" blocks
                    const selector = sectionSelector || ".pdf-section, .pdf-break-safe, .bg-card, section";
                    const rawElements = Array.from(clone.querySelectorAll(selector)) as HTMLElement[];
                    
                    // Filter to only top-level blocks to avoid duplicates
                    const blocks = rawElements.filter(el => {
                        let parent = el.parentElement;
                        while (parent && parent !== clone) {
                            if (rawElements.includes(parent)) return false;
                            parent = parent.parentElement;
                        }
                        return true;
                    }).filter(el => el.offsetHeight > 2);

                    // Sort by vertical position
                    const cloneRect = clone.getBoundingClientRect();
                    blocks.sort((a, b) => (a.getBoundingClientRect().top - cloneRect.top) - (b.getBoundingClientRect().top - cloneRect.top));

                    console.log(`[PDF] Packaging ${blocks.length} blocks into virtual pages`);

                    // 2. Measure and Pack into "Virtual Pages"
                    const virtualPages: HTMLElement[][] = [];
                    let currentPage: HTMLElement[] = [];
                    let currentHeightMm = 0;
                    
                    const pxToMm = usableWidth / blocks[0]?.offsetWidth || 0.2645; // Approx if measurement fails

                    for (const block of blocks) {
                        const blockHeightMm = (block.offsetHeight * usableWidth) / block.offsetWidth;
                        
                        // If a single block is taller than the whole page, it must be sliced (fallback)
                        if (blockHeightMm > usableHeight) {
                            if (currentPage.length > 0) {
                                virtualPages.push(currentPage);
                                currentPage = [];
                                currentHeightMm = 0;
                            }
                            virtualPages.push([block]); // This page contains only the giant block
                            continue;
                        }

                        // If it doesn't fit in current page, start a new one
                        if (currentHeightMm + blockHeightMm > usableHeight) {
                            virtualPages.push(currentPage);
                            currentPage = [block];
                            currentHeightMm = blockHeightMm + 4; // 4mm spacer
                        } else {
                            currentPage.push(block);
                            currentHeightMm += blockHeightMm + 4;
                        }
                    }
                    if (currentPage.length > 0) virtualPages.push(currentPage);

                    // 3. Capture each Virtual Page
                    for (let p = 0; p < virtualPages.length; p++) {
                        if (p > 0) pdf.addPage();
                        
                        const pageBlocks = virtualPages[p];
                        
                        // Check if it's a giant block that needs slicing
                        if (pageBlocks.length === 1 && (pageBlocks[0].offsetHeight * usableWidth / pageBlocks[0].offsetWidth) > usableHeight) {
                            const giantBlock = pageBlocks[0];
                            const canvas = await html2canvas(giantBlock, {
                                scale: 1.8,
                                useCORS: true,
                                backgroundColor: "#ffffff",
                                windowWidth: 1100,
                            });
                            
                            const pxPerMm = canvas.width / usableWidth;
                            let sourceY = 0;
                            let pdfY = contentTop;
                            
                            while (sourceY < canvas.height) {
                                const remainingPagePx = (contentBottom - pdfY) * pxPerMm;
                                const sliceHeightPx = Math.min(canvas.height - sourceY, remainingPagePx);
                                
                                await addSliceToPdf(pdf, canvas, sourceY, sliceHeightPx, margin, pdfY, usableWidth, sliceHeightPx / pxPerMm);
                                
                                sourceY += sliceHeightPx;
                                if (sourceY < canvas.height) {
                                    pdf.addPage();
                                    pdfY = contentTop;
                                }
                            }
                        } else {
                            // Normal page: Capture all blocks together
                            // Create a temporary container for this specific page's blocks
                            const pageContainer = document.createElement("div");
                            pageContainer.style.width = "1100px";
                            pageContainer.style.backgroundColor = "#ffffff";
                            pageContainer.style.display = "flex";
                            pageContainer.style.flexDirection = "column";
                            pageContainer.style.gap = "16px";
                            pageContainer.style.padding = "0";
                            pageContainer.style.position = "absolute";
                            pageContainer.style.left = "-10000px";
                            pageContainer.style.top = "0";
                            container.appendChild(pageContainer);

                            try {
                                pageBlocks.forEach(b => {
                                    const bClone = b.cloneNode(true) as HTMLElement;
                                    bClone.style.width = "100%";
                                    bClone.style.margin = "0";
                                    pageContainer.appendChild(bClone);
                                });

                                const canvas = await html2canvas(pageContainer, {
                                    scale: 2.0,
                                    useCORS: true,
                                    backgroundColor: "#ffffff",
                                    logging: false,
                                });

                                const imgData = canvas.toDataURL("image/jpeg", 0.9);
                                const imgHeight = (canvas.height * usableWidth) / canvas.width;
                                pdf.addImage(imgData, "JPEG", margin, contentTop, usableWidth, imgHeight);
                            } finally {
                                pageContainer.remove();
                            }
                        }
                    }
                } finally {
                    document.documentElement.style.overflow = "";
                    window.scrollTo(originalScrollX, originalScrollY);
                }
            };

            // Helper: Draw and add a slice to the PDF
            const addSliceToPdf = async (pdfDoc: any, sourceCanvas: HTMLCanvasElement, y: number, h: number, xMm: number, yMm: number, wMm: number, hMm: number) => {
                const sliceCanvas = document.createElement("canvas");
                sliceCanvas.width = sourceCanvas.width;
                sliceCanvas.height = Math.floor(h);
                const ctx = sliceCanvas.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                    ctx.drawImage(sourceCanvas, 0, y, sourceCanvas.width, h, 0, 0, sourceCanvas.width, h);
                    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.9);
                    pdfDoc.addImage(sliceData, "JPEG", xMm, yMm, wMm, hMm);
                }
            };

            // ALWAYS use sectional capture for Security reports
            await generateSectionalPdf();

            const totalPages = (pdf as any).internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                addPageHeader(pdf, i, totalPages);
                addPageFooter(pdf, i, totalPages);
            }

            pdf.save(fileName);

        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            const container = document.getElementById("pdf-export-container");
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
            }
            setIsExporting(false);
            isExportingRef.current = false;
        }
    }, [reportRef, fileName, reportTitle, projectName, generatedAt, sectionSelector]);

    return { exportPdf, isExporting };
};
