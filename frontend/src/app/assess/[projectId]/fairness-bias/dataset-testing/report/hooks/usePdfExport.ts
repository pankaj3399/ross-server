
import { useState, useCallback, RefObject } from "react";
import type { DatasetReportPayload } from "../../types";
import { 
    styleHeader, styleGrid, styleCards, styleSectionCards, 
    styleUploadInfo, styleAnalysisParams, styleVerdictColors, 
    styleBadges, styleTypography, styleTables, styleMetricCards, 
    styleIcons, styleMutedBackgrounds, fixProgressBars 
} from "./pdfStyles";

interface UsePdfExportProps {
    reportRef: RefObject<HTMLDivElement>;
    payload: DatasetReportPayload | null;
}

/** Time to wait for React re-render and chart rendering before PDF capture */
const PDF_RENDERING_DELAY_MS = 1000;

export const usePdfExport = ({ reportRef, payload }: UsePdfExportProps) => {
    const [isExporting, setIsExporting] = useState(false);

    const exportPdf = useCallback(async () => {
        if (!reportRef.current || !payload) return;
        if (isExporting) return; // Prevent concurrent exports
        try {
            setIsExporting(true);

            // Wait for React to re-render with isExporting=true (which expands all rows)
            // Increased timeout to ensure all components (especially charts) have fully successfully rendered
            await new Promise(resolve => setTimeout(resolve, PDF_RENDERING_DELAY_MS));

            const [jsPDFModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")]);
            const jsPDFConstructor = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const usableWidth = pageWidth - 2 * margin;


            // Clone the report container for PDF-specific rendering
            const clone = reportRef.current.cloneNode(true) as HTMLElement;
            clone.style.width = "1200px";
            // Use fixed positioning off-screen to ensure it's "visible" to html2canvas
            // but not visible to the user. z-index negative can cause it to be excluded.
            clone.style.position = "fixed";
            clone.style.top = "0";
            clone.style.left = "-10000px"; // Move far left
            clone.style.zIndex = "1000";   // Ensure it's on top in its own context
            // Force light mode variables
            clone.style.backgroundColor = "#ffffff";
            clone.style.color = "#0f172a"; // slate-900
            clone.style.padding = "24px";
            clone.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

            // Helper functions for PDF styling
            const fixVisibility = (root: HTMLElement) => {
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
            };

            const forceLightMode = (root: HTMLElement) => {
                // 1. Reset backgrounds to white/light
                root.querySelectorAll("*").forEach((el) => {
                    const elem = el as HTMLElement;
                    
                    // Safe class check handling (SVG elements have SVGAnimatedString as className)
                    const safeClass = typeof elem.className === 'string' 
                        ? elem.className 
                        : (elem.getAttribute('class') || '');

                    const computed = window.getComputedStyle(elem);
                    if (!computed) return;

                    // If it has a dark background class or computed dark color
                    if (safeClass.includes("dark:bg-gray") || safeClass.includes("dark:bg-slate")) {

                        // Check if it's a card or main container
                        if (safeClass.includes("bg-white")) {
                            elem.style.backgroundColor = "#ffffff";
                        } else if (safeClass.includes("bg-slate-50")) {
                            elem.style.backgroundColor = "#f8fafc";
                        } else if (safeClass.includes("bg-indigo-50")) {
                            elem.style.backgroundColor = "#eef2ff"; // indigo-50
                        } else if (safeClass.includes("bg-green-50")) {
                            elem.style.backgroundColor = "#f0fdf4"; // green-50
                        } else if (safeClass.includes("bg-amber-50") || safeClass.includes("bg-yellow-50")) {
                            elem.style.backgroundColor = "#fffbeb"; // amber-50
                        } else if (safeClass.includes("bg-red-50")) {
                            elem.style.backgroundColor = "#fef2f2"; // red-50
                        } else {
                            // Default to checking if it's really dark
                            const bg = computed.backgroundColor;
                            if (bg) {
                                const bgMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                
                                if (bgMatch && bgMatch.length >= 4) {
                                    const r = parseInt(bgMatch[1], 10);
                                    const g = parseInt(bgMatch[2], 10);
                                    const b = parseInt(bgMatch[3], 10);
                                    
                                    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                                        // If extremely dark (like gray-900), make it white
                                        if (r < 100 && g < 100 && b < 100) {
                                            elem.style.backgroundColor = "#ffffff";
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 2. Reset text to dark
                    // Force standard text colors
                    if (safeClass.includes("text-white") || safeClass.includes("dark:text-white")) {
                        // Only force to black if it's not on a dark badge/button (which we might want to keep, but buttons are hidden)
                        // For report text, usually we want dark text
                        elem.style.color = "#0f172a";
                    }
                    if (safeClass.includes("dark:text-slate-300") || safeClass.includes("dark:text-slate-400")) {
                        elem.style.color = "#475569";
                    }

                    // 3. Reset borders
                    if (safeClass.includes("dark:border")) {
                        elem.style.borderColor = "#e2e8f0";
                    }
                });
            };

            const applyPdfStyles = (root: HTMLElement) => {
                fixVisibility(root);
                forceLightMode(root);
                
                // Use extracted styling functions
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
            };

            applyPdfStyles(clone);
            document.body.appendChild(clone);

            try {
                // Find all capturable sections (Cards)
                // We want to capture each card individually to avoid splitting them
                const sections: HTMLElement[] = [];

                // 1. Header is a section
                const header = clone.querySelector("header");
                if (header) sections.push(header as HTMLElement);

                // 2. Upload Info Card (Top Section)
                const topSection = clone.querySelector("section:first-of-type");
                if (topSection) {
                    // Capture the whole top section if it fits, or its children
                    // Let's capture the big cards inside the sections
                    topSection.querySelectorAll(".rounded-2xl, .rounded-3xl").forEach(el => {
                         // Skip the metric grid container, we will capture it explicitly later
                        if (el.querySelector(".pdf-metric-grid")) return;
                        if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                    });
                }

                // 3. Sensitive Columns
                // Capture each SensitiveColumnAnalysis card (which use Card component -> rounded-xl)
                clone.querySelectorAll(".grid > .rounded-2xl, .grid > .rounded-xl").forEach(el => {
                    if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                });

                // 4. Metric Cards
                // We explicitly want to capture the container of the metrics to include the Title
                // MARKER: Identify this section as metrics grid for special handling later
                const metricGrid = clone.querySelector(".pdf-metric-grid");
                let metricSection: HTMLElement | null = null;

                if (metricGrid) {
                     // Try to find the wrapping container (rounded-2xl) to includes the "Overall Metrics" title
                    const container = metricGrid.closest(".rounded-2xl");
                    if (container) {
                        metricSection = container as HTMLElement;
                        metricSection.setAttribute("data-is-metric-grid", "true");
                        sections.push(metricSection);
                    } else {
                        metricSection = metricGrid as HTMLElement;
                        metricSection.setAttribute("data-is-metric-grid", "true");
                        sections.push(metricSection);
                    }
                } else {
                    // Fallback to old selector or individual cards if class is missing
                    const fallbackGrid = clone.querySelector(".grid.lg\\:grid-cols-5");
                    if (fallbackGrid) {
                        sections.push(fallbackGrid as HTMLElement);
                    } else {
                        clone.querySelectorAll(".grid > .rounded-xl").forEach(el => {
                            if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                        });
                    }
                }

                // Fallback: If we missed anything big, add main sections that aren't covered
                clone.querySelectorAll("main > section").forEach((section) => {
                    const sectionEl = section as HTMLElement;
                    // If this section has NO children already in our list, add it
                    const hasCapturedChildren = Array.from(sectionEl.querySelectorAll("*")).some(child =>
                        sections.includes(child as HTMLElement)
                    );
                    if (!hasCapturedChildren) {
                        sections.push(sectionEl);
                    }
                });

                // 5. Fallback: If we still have NO sections, capture the whole main or container
                if (sections.length === 0) {
                   console.warn("No separate sections found for PDF, capturing entire report container.");
                   sections.push(clone);
                }

                // Sort sections by offsetTop
                sections.sort((a, b) => {
                    return a.offsetTop - b.offsetTop;
                });

                const footerHeight = 15; // Space for footer
                const maxPageHeight = pageHeight - margin - footerHeight; // Maximum usable height per page

                let currentY = margin;

                for (const section of sections) {
                    // Skip hidden elements or zero height
                    if (section.style.display === "none" || section.offsetHeight === 0) continue;

                    try {
                        let scale = 2;
                        let canvas = await html2canvas(section, {
                            scale: scale,
                            useCORS: true,
                            backgroundColor: "#ffffff",
                            logging: false,
                            windowWidth: 1200,
                            scrollX: 0,
                            scrollY: 0,
                            onclone: (clonedDoc) => {
                                // Remove elements that should be ignored
                                const el = clonedDoc.querySelector(`[data-html2canvas-ignore]`);
                                if (el) el.remove();
                            }
                        });

                        // Check limits (e.g. 15000px height or ~50MP total)
                        const MAX_DIMENSION = 15000;
                        const MAX_PIXELS = 50000000;

                        if (canvas.width * canvas.height > MAX_PIXELS || canvas.height > MAX_DIMENSION) {
                            console.warn(`Canvas too large (${canvas.width}x${canvas.height}), retrying with scale 1`);
                            scale = 1;
                            canvas = await html2canvas(section, {
                                scale: scale,
                                useCORS: true,
                                backgroundColor: "#ffffff",
                                logging: false,
                                windowWidth: 1200,
                                scrollX: 0,
                                scrollY: 0,
                                onclone: (clonedDoc) => {
                                    const el = clonedDoc.querySelector(`[data-html2canvas-ignore]`);
                                    if (el) el.remove();
                                }
                            });

                            // If still too large, skip to avoid OOM
                            if (canvas.width * canvas.height > MAX_PIXELS || canvas.height > MAX_DIMENSION) {
                                console.error("Section still too large to export, skipping", section);
                                continue;
                            }
                        }

                        const imgWidth = usableWidth;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        const isMetricGrid = section.getAttribute("data-is-metric-grid") === "true";

                        // Case 1: Image fits on the current page (or remainder of it)
                        // SPECIAL CASE: If it's the metric grid, we prefer it to be on a new page if it doesn't fit comfortably
                        // i.e. if it would take up more than 30% of the remaining space, just give it a fresh page?
                        // Or simpler: if it's the metric grid, and we are NOT at the top of the page (margin + 10), force a page break.
                        // This ensures the grid is never split unless it's genuinely taller than an entire page.
                        
                        let shouldPageBreak = false;

                        if (isMetricGrid && currentY > margin + 20) {
                             shouldPageBreak = true;
                        } else if (currentY + imgHeight > maxPageHeight) {
                             shouldPageBreak = true;
                        }

                        if (!shouldPageBreak) {
                            const imgData = canvas.toDataURL("image/jpeg", 0.95);
                            pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
                            currentY += imgHeight + 8; // Add gap
                        } 
                        // Case 2: Image fits on a NEW page (smaller than one full page)
                        else if (imgHeight <= maxPageHeight || (isMetricGrid && imgHeight <= maxPageHeight)) {
                            pdf.addPage();
                            currentY = margin;
                            const imgData = canvas.toDataURL("image/jpeg", 0.95);
                            pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
                            currentY += imgHeight + 8;
                        }
                        // Case 3: Image is larger than a single page -> Slice it
                        else {
                            // First, if we are not at top of page, start a new one to maximize space
                            if (currentY > margin + 10) { // Tolerance of 10mm
                                pdf.addPage();
                                currentY = margin;
                            }

                            // We need to slice the canvas source
                            // We work with PDF units for page logic, but pixels for canvas slicing
                            const pageHeightInPx = (maxPageHeight * canvas.width) / usableWidth; // How many source pixels fit in one max page height?
                            
                            let remainingHeightPx = canvas.height;
                            let sourceY = 0;

                            while (remainingHeightPx > 0) {
                                // Calculate how much to take for this chunk
                                // If currentY is > margin (only happens for first chunk if we didn't page break), careful
                                // But we forced page break above if it didn't fit. 
                                // So usually currentY is margin, ensuring full available height.
                                // However, let's correspond current available PDF height to pixels.
                                const availablePdfHeight = maxPageHeight - currentY;
                                const availablePx = (availablePdfHeight * canvas.width) / usableWidth;

                                const currentSliceHeightPx = Math.min(remainingHeightPx, availablePx);
                                
                                // Create a temp canvas for this slice
                                const tempCanvas = document.createElement('canvas');
                                tempCanvas.width = canvas.width;
                                tempCanvas.height = currentSliceHeightPx;
                                const tCtx = tempCanvas.getContext('2d');
                                if (!tCtx) break;

                                tCtx.fillStyle = "#ffffff";
                                tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                tCtx.drawImage(
                                    canvas, 
                                    0, sourceY, canvas.width, currentSliceHeightPx, // Source
                                    0, 0, tempCanvas.width, currentSliceHeightPx    // Dest
                                );

                                const sliceImgData = tempCanvas.toDataURL("image/jpeg", 0.95);
                                const slicePdfHeight = (currentSliceHeightPx * usableWidth) / canvas.width;

                                pdf.addImage(sliceImgData, "JPEG", margin, currentY, imgWidth, slicePdfHeight);

                                sourceY += currentSliceHeightPx;
                                remainingHeightPx -= currentSliceHeightPx;
                                
                                // If we have more to print, add a new page
                                if (remainingHeightPx > 0) {
                                    pdf.addPage();
                                    currentY = margin;
                                } else {
                                    currentY += slicePdfHeight + 8;
                                }
                            }
                        }
                    } catch (sectionError) {
                        console.error("Error capturing section:", sectionError);
                    }
                }

                // Add page numbers
                const pageCount = (pdf as any).internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 116, 139); // slate-500
                    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: "right" });
                    
                    // Add date/copyright on left
                    const dateStr = new Date().toLocaleDateString();
                    pdf.text(`Fairness Report - ${dateStr}`, margin, pageHeight - 5, { align: "left" });
                }

                const baseName = payload.fileMeta.name?.replace(/\.[^/.]+$/, "") || "dataset-report";
                let dateSuffix: string;
                try {
                    dateSuffix = new Date(payload.generatedAt).toISOString().split("T")[0];
                } catch (error) {
                    // Fallback to current date if generatedAt is invalid
                    dateSuffix = new Date().toISOString().split("T")[0];
                }
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
    }, [reportRef, payload]);

    return { exportPdf, isExporting };
};
