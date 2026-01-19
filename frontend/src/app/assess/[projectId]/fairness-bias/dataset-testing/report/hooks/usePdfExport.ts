
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
            clone.style.width = "850px";
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

            const styleForPdf = (root: HTMLElement) => {
                // ===== HEADER STYLING =====
                const header = root.querySelector("header");
                if (header) {
                    const headerEl = header as HTMLElement;
                    headerEl.style.backgroundColor = "#ffffff";
                    headerEl.style.borderBottom = "3px solid #4f46e5"; // Indigo accent line
                    headerEl.style.padding = "24px 0";
                    headerEl.style.marginBottom = "32px";
                    
                    // Style header text
                    const h1 = headerEl.querySelector("h1");
                    if (h1) {
                        (h1 as HTMLElement).style.fontSize = "28px";
                        (h1 as HTMLElement).style.fontWeight = "700";
                        (h1 as HTMLElement).style.color = "#0f172a";
                        (h1 as HTMLElement).style.letterSpacing = "-0.02em";
                    }
                    
                    // Style subtitle/label
                    headerEl.querySelectorAll("p.text-xs").forEach((p) => {
                        const pEl = p as HTMLElement;
                        pEl.style.color = "#6366f1"; // indigo-500
                        pEl.style.fontWeight = "600";
                        pEl.style.textTransform = "uppercase";
                        pEl.style.letterSpacing = "0.1em";
                    });
                }

                // ===== GRID LAYOUT =====
                root.querySelectorAll(".grid").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.display = "grid";
                    elem.style.gap = "24px";
                });

                // ===== CARD STYLING =====
                root.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#ffffff";
                    elem.style.border = "1px solid #e2e8f0";
                    elem.style.borderRadius = "16px";
                    elem.style.boxShadow = "0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)";
                    elem.style.overflow = "hidden";
                });

                // ===== SECTION CARDS =====
                root.querySelectorAll("section > .rounded-3xl").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.boxShadow = "0 8px 30px -8px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.06)";
                });

                // ===== UPLOAD INFO CARD =====
                root.querySelectorAll(".bg-slate-50\\/60, .bg-slate-50").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#f8fafc";
                    elem.style.border = "1px solid #e2e8f0";
                    elem.style.borderRadius = "12px";
                });

                // ===== ANALYSIS PARAMETERS CARD =====
                root.querySelectorAll("[class*='bg-indigo-50']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#eef2ff";
                    elem.style.border = "1px solid #c7d2fe";
                    elem.style.borderRadius = "12px";
                });

                // ===== VERDICT CARD STATUS COLORS =====
                // Pass/Success colors
                root.querySelectorAll("[class*='bg-green-50'], [class*='bg-success']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#f0fdf4";
                    elem.style.border = "1px solid #86efac";
                });
                root.querySelectorAll("[class*='text-green'], [class*='text-success'], [class*='text-emerald']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.color = "#059669"; // emerald-600
                });

                // Warning/Caution colors
                root.querySelectorAll("[class*='bg-amber-50'], [class*='bg-warning'], [class*='bg-yellow-50']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#fffbeb";
                    elem.style.border = "1px solid #fcd34d";
                });
                root.querySelectorAll("[class*='text-amber'], [class*='text-warning'], [class*='text-yellow']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.color = "#d97706"; // amber-600
                });

                // Fail/Destructive colors
                root.querySelectorAll("[class*='bg-red-50'], [class*='bg-destructive']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#fef2f2";
                    elem.style.border = "1px solid #fca5a5";
                });
                root.querySelectorAll("[class*='text-red'], [class*='text-destructive']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.color = "#dc2626"; // red-600
                });

                // ===== BADGE STYLING =====
                root.querySelectorAll("[class*='badge'], [class*='Badge']").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.fontWeight = "600";
                    elem.style.fontSize = "11px";
                    elem.style.padding = "4px 10px";
                    elem.style.borderRadius = "6px";
                });

                // ===== TYPOGRAPHY ENHANCEMENTS =====
                // Section headings
                root.querySelectorAll("h3, h4").forEach((el) => {
                    const elem = el as HTMLElement;
                    elem.style.fontWeight = "600";
                    elem.style.color = "#0f172a";
                    elem.style.letterSpacing = "-0.01em";
                });

                // Main content text
                root.querySelectorAll("p").forEach((el) => {
                    const elem = el as HTMLElement;
                    if (!elem.style.color || elem.style.color === "inherit") {
                        elem.style.color = "#374151"; // gray-700
                    }
                });

                // Muted text
                root.querySelectorAll("[class*='text-muted'], [class*='text-slate-500'], [class*='text-slate-600']").forEach(el => {
                    (el as HTMLElement).style.color = "#64748b"; // slate-500
                });

                // ===== TABLE STYLING =====
                root.querySelectorAll("table").forEach(table => {
                    const tableEl = table as HTMLTableElement;
                    tableEl.style.width = "100%";
                    tableEl.style.borderCollapse = "collapse";
                    tableEl.style.fontSize = "12px";
                    
                    // Header row
                    tableEl.querySelectorAll("th").forEach(th => {
                        const thEl = th as HTMLElement;
                        thEl.style.backgroundColor = "#f1f5f9";
                        thEl.style.color = "#334155";
                        thEl.style.fontWeight = "600";
                        thEl.style.padding = "12px 16px";
                        thEl.style.textAlign = "left";
                        thEl.style.borderBottom = "2px solid #e2e8f0";
                    });
                    
                    // Data rows with alternating colors
                    tableEl.querySelectorAll("tbody tr").forEach((tr, index) => {
                        const trEl = tr as HTMLElement;
                        trEl.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
                        trEl.style.borderBottom = "1px solid #e2e8f0";
                    });
                    
                    // Data cells
                    tableEl.querySelectorAll("td").forEach(td => {
                        const tdEl = td as HTMLElement;
                        tdEl.style.padding = "10px 16px";
                        tdEl.style.color = "#374151";
                    });
                });

                // ===== METRIC CARDS SPECIFIC =====
                root.querySelectorAll(".pdf-metric-grid > *").forEach(el => {
                    const elem = el as HTMLElement;
                    elem.style.backgroundColor = "#ffffff";
                    elem.style.border = "1px solid #e2e8f0";
                    elem.style.borderRadius = "12px";
                    elem.style.padding = "16px";
                });

                // ===== ICON COLORS =====
                root.querySelectorAll("[class*='text-primary']").forEach(el => {
                    (el as HTMLElement).style.color = "#4f46e5"; // indigo-600
                });

                // ===== MUTED BACKGROUNDS =====
                root.querySelectorAll("[class*='bg-muted']").forEach(el => {
                    const elem = el as HTMLElement;
                    const classes = elem.className || "";
                    if (!classes.includes("bg-muted-foreground")) {
                        elem.style.backgroundColor = "#f1f5f9"; // slate-100
                    }
                });
            };

            const fixProgressBars = (root: HTMLElement) => {
                // ===== FAIRNESS SCORE PROGRESS BARS =====
                root.querySelectorAll(".pdf-progress-bar, [role='progressbar']").forEach((container) => {
                    const containerEl = container as HTMLElement;
                    
                    containerEl.style.backgroundColor = "#e2e8f0";
                    containerEl.style.borderRadius = "9999px";
                    containerEl.style.overflow = "visible";
                    containerEl.style.position = "relative";

                    // Standardize heights
                    const classes = containerEl.className || "";
                    if (classes.includes("h-1.5")) containerEl.style.height = "8px";
                    else if (classes.includes("h-3")) containerEl.style.height = "14px";
                    else if (classes.includes("h-2.5")) containerEl.style.height = "12px";
                    else containerEl.style.height = "10px";

                    // Style all inner bars
                    containerEl.querySelectorAll(":scope > div").forEach(child => {
                        const innerBar = child as HTMLElement;
                        const innerClasses = innerBar.className || "";
                        
                        // Skip threshold markers
                        if (innerClasses.includes("w-0.5") || innerBar.style.width === "2px") {
                            // This is the threshold marker line
                            innerBar.style.backgroundColor = "#1e293b";
                            innerBar.style.width = "3px";
                            innerBar.style.zIndex = "10";
                            return;
                        }
                        
                        // Inner progress bar
                        innerBar.style.height = "100%";
                        innerBar.style.borderRadius = "9999px";
                        innerBar.style.minWidth = "4px";
                        innerBar.style.position = "absolute";
                        innerBar.style.left = "0";
                        innerBar.style.top = "0";

                        // Set color based on status class
                        if (innerClasses.includes("success") || innerClasses.includes("green") || innerClasses.includes("emerald")) {
                            innerBar.style.background = "linear-gradient(90deg, #059669, #10b981)";
                        } else if (innerClasses.includes("warning") || innerClasses.includes("amber") || innerClasses.includes("yellow") || innerClasses.includes("orange")) {
                            innerBar.style.background = "linear-gradient(90deg, #d97706, #f59e0b)";
                        } else if (innerClasses.includes("destructive") || innerClasses.includes("red") || innerClasses.includes("rose")) {
                            innerBar.style.background = "linear-gradient(90deg, #dc2626, #ef4444)";
                        } else if (innerClasses.includes("primary") || innerClasses.includes("indigo")) {
                            innerBar.style.background = "linear-gradient(90deg, #4f46e5, #6366f1)";
                        } else {
                            // Default to primary gradient
                            innerBar.style.background = "linear-gradient(90deg, #4f46e5, #6366f1)";
                        }
                    });
                });

                // ===== GROUP SELECTION RATE BARS =====
                // These are in the SensitiveColumnAnalysis component
                root.querySelectorAll(".relative.h-2\\.5").forEach((container) => {
                    const innerBg = container.querySelector(".absolute.inset-0.rounded-full") as HTMLElement;
                    if (innerBg) {
                        innerBg.style.backgroundColor = "#e2e8f0";
                        innerBg.style.borderRadius = "9999px";
                        innerBg.style.overflow = "hidden";
                        
                        const bar = innerBg.querySelector("div") as HTMLElement;
                        if (bar) {
                            bar.style.height = "100%";
                            bar.style.borderRadius = "9999px";
                            const barClasses = bar.className || "";
                            
                            if (barClasses.includes("warning") || barClasses.includes("from-warning")) {
                                bar.style.background = "linear-gradient(90deg, #d97706, #fbbf24)";
                            } else {
                                bar.style.background = "linear-gradient(90deg, #4f46e5, #818cf8)";
                            }
                        }
                    }
                });

                // ===== METRIC CARD PROGRESS BARS =====
                root.querySelectorAll(".h-1\\.5.rounded-full.bg-muted").forEach((container) => {
                    const containerEl = container as HTMLElement;
                    containerEl.style.backgroundColor = "#e2e8f0";
                    containerEl.style.height = "8px";
                    containerEl.style.borderRadius = "9999px";
                    containerEl.style.overflow = "hidden";
                    
                    const innerBar = containerEl.querySelector("div") as HTMLElement;
                    if (innerBar) {
                        innerBar.style.height = "100%";
                        innerBar.style.borderRadius = "9999px";
                        
                        const barClasses = innerBar.className || "";
                        if (barClasses.includes("bg-destructive")) {
                            innerBar.style.background = "#dc2626";
                        } else if (barClasses.includes("bg-muted-foreground")) {
                            innerBar.style.background = "#64748b";
                        } else if (barClasses.includes("bg-primary")) {
                            innerBar.style.background = "#4f46e5";
                        } else {
                            innerBar.style.background = "#4f46e5";
                        }
                    }
                });

                // ===== GRADIENT BACKGROUNDS =====
                root.querySelectorAll("[class*='bg-gradient']").forEach((el) => {
                    const elem = el as HTMLElement;
                    const classes = elem.className || "";
                    elem.style.backgroundImage = "none";
                    if (classes.includes("amber") || classes.includes("orange") || classes.includes("warning")) {
                        elem.style.backgroundColor = "#f59e0b";
                    } else if (classes.includes("emerald") || classes.includes("teal") || classes.includes("success") || classes.includes("green")) {
                        elem.style.backgroundColor = "#10b981";
                    } else if (classes.includes("rose") || classes.includes("red") || classes.includes("destructive")) {
                        elem.style.backgroundColor = "#ef4444";
                    } else if (classes.includes("primary") || classes.includes("indigo")) {
                        elem.style.backgroundColor = "#4f46e5";
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
                const metricGrid = clone.querySelector(".pdf-metric-grid");
                if (metricGrid) {
                    sections.push(metricGrid as HTMLElement);
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
                                windowWidth: 850,
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
