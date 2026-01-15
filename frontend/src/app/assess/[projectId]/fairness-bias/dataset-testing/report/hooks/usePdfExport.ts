
import { useState, useCallback, RefObject } from "react";
import type { DatasetReportPayload } from "../../types";

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
            clone.style.width = "850px";
            clone.style.position = "absolute";
            clone.style.left = "-9999px";
            clone.style.top = "0";
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

            const styleForPdf = (root: HTMLElement) => {
                // Header styling
                const header = root.querySelector("header");
                if (header) {
                    const headerEl = header as HTMLElement;
                    headerEl.style.backgroundColor = "#ffffff";
                    headerEl.style.borderBottom = "2px solid #e2e8f0";
                    headerEl.style.padding = "0 0 20px 0";
                    headerEl.style.marginBottom = "30px";
                }

                // Grid fixes - flatten grids that shouldn't be grid in PDF if needed, 
                // but for cards we might want to keep them or wrap them.
                // Actually, let's keep the grid but ensure width is set
                root.querySelectorAll(".grid").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.display = "grid";
                    elem.style.gap = "16px";
                });

                // Ensure specific containers are white with border
                root.querySelectorAll(".rounded-2xl, .rounded-xl").forEach((el) => {
                    const elem = el as HTMLElement;
                    // Ensure cards look like cards
                    elem.style.backgroundColor = "#ffffff";
                    elem.style.border = "1px solid #e2e8f0";
                    elem.style.boxShadow = "none";
                });
            };

            const fixProgressBars = (root: HTMLElement) => {
                // Find all progress bar containers by their dedicated class or role
                root.querySelectorAll(".pdf-progress-bar, [role='progressbar']").forEach((container) => {
                    const containerEl = container as HTMLElement;
                    
                    containerEl.style.backgroundColor = "#e2e8f0";
                    containerEl.style.borderRadius = "9999px";
                    containerEl.style.overflow = "visible";
                    containerEl.style.border = "1px solid #cbd5e1";

                    // Ensure height is respected but standardized for PDF visibility
                    const classes = containerEl.className || "";
                    if (classes.includes("h-1.5")) containerEl.style.height = "6px";
                    else if (classes.includes("h-3")) containerEl.style.height = "12px";
                    else containerEl.style.height = "10px";

                    const innerBar = containerEl.querySelector("div") as HTMLElement;
                    if (innerBar) {
                        innerBar.style.height = "100%";
                        innerBar.style.borderRadius = "9999px";
                        innerBar.style.minWidth = "4px";
                        innerBar.style.backgroundImage = "none";

                        const innerClasses = innerBar.className || "";
                        if (innerClasses.includes("amber") || innerClasses.includes("orange")) {
                            innerBar.style.background = "linear-gradient(90deg, #f59e0b, #fb923c)";
                        } else if (innerClasses.includes("emerald") || innerClasses.includes("teal")) {
                            innerBar.style.background = "linear-gradient(90deg, #10b981, #14b8a6)";
                        } else if (innerClasses.includes("rose") || innerClasses.includes("red")) {
                            innerBar.style.background = "linear-gradient(90deg, #f43f5e, #fb7185)";
                        } else {
                            innerBar.style.background = "linear-gradient(90deg, #6366f1, #8b5cf6)";
                        }
                    }
                });

                // Fix gradient bars (badges, alerts, etc)
                root.querySelectorAll("[class*='bg-gradient']").forEach((el) => {
                    const elem = el as HTMLElement;
                    const classes = elem.className || "";
                    elem.style.backgroundImage = "none";
                    if (classes.includes("amber") || classes.includes("orange")) {
                        elem.style.backgroundColor = "#f59e0b";
                    } else if (classes.includes("emerald") || classes.includes("teal")) {
                        elem.style.backgroundColor = "#10b981";
                    } else if (classes.includes("rose") || classes.includes("red")) {
                        elem.style.backgroundColor = "#f43f5e";
                    }
                });
            };

            const applyPdfStyles = (root: HTMLElement) => {
                fixVisibility(root);
                forceLightMode(root);
                styleForPdf(root);
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
                        if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                    });
                }

                // 3. Sensitive Columns
                // Capture each SensitiveColumnAnalysis card
                clone.querySelectorAll(".grid > .rounded-2xl").forEach(el => {
                    if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                });

                // 4. Metric Cards (CAPTURE AS GRID)
                // We look for the grid container of the metric cards
                const metricGrid = clone.querySelector(".grid.lg\\:grid-cols-5");
                if (metricGrid) {
                    sections.push(metricGrid as HTMLElement);
                } else {
                    clone.querySelectorAll(".grid > .rounded-xl").forEach(el => {
                        if (!sections.some(s => s.contains(el))) sections.push(el as HTMLElement);
                    });
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

                // Sort sections by offsetTop
                sections.sort((a, b) => {
                    return a.offsetTop - b.offsetTop;
                });

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
                            windowWidth: 850,
                            onclone: (clonedDoc) => {
                                // Double check light mode in the canvas clone
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
                                windowWidth: 850,
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

                        // Check if this section fits on the current page
                        if (currentY + imgHeight > pageHeight - margin) {
                            // If it doesn't fit, add a new page
                            pdf.addPage();
                            currentY = margin;
                        }

                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        pdf.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
                        currentY += imgHeight + 5; // Add gap between sections

                    } catch (sectionError) {
                        console.error("Error capturing section:", sectionError);
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
    }, [reportRef, payload]);

    return { exportPdf, isExporting };
};
