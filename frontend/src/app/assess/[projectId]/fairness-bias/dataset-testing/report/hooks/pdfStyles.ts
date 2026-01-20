/**
 * PDF Styling Helper Functions
 * Extracted from usePdfExport.ts to improve maintainability
 */

export const styleHeader = (root: HTMLElement) => {
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
};

export const styleGrid = (root: HTMLElement) => {
    root.querySelectorAll(".grid").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.display = "grid";
        elem.style.gap = "24px";
    });
};

export const styleCards = (root: HTMLElement) => {
    root.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = "#ffffff";
        elem.style.border = "1px solid #e2e8f0";
        elem.style.borderRadius = "16px";
        elem.style.boxShadow = "0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)";
        elem.style.overflow = "hidden";
    });
};

export const styleSectionCards = (root: HTMLElement) => {
    root.querySelectorAll("section > .rounded-3xl").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.boxShadow = "0 8px 30px -8px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.06)";
    });
};

export const styleUploadInfo = (root: HTMLElement) => {
    root.querySelectorAll(".bg-slate-50\\/60, .bg-slate-50").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = "#f8fafc";
        elem.style.border = "1px solid #e2e8f0";
        elem.style.borderRadius = "12px";
    });
};

export const styleAnalysisParams = (root: HTMLElement) => {
    root.querySelectorAll("[class*='bg-indigo-50']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = "#eef2ff";
        elem.style.border = "1px solid #c7d2fe";
        elem.style.borderRadius = "12px";
    });
};

export const styleVerdictColors = (root: HTMLElement) => {
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
};

export const styleBadges = (root: HTMLElement) => {
    root.querySelectorAll("[class*='badge'], [class*='Badge']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.fontWeight = "600";
        elem.style.fontSize = "11px";
        elem.style.padding = "2px 12px"; // Reduced vertical padding
        elem.style.paddingTop = "2px";
        elem.style.paddingBottom = "2px";
        elem.style.borderRadius = "20px"; // More rounded
        elem.style.display = "inline-flex";
        elem.style.alignItems = "center";
        elem.style.justifyContent = "center";
        elem.style.lineHeight = "1"; // Reset line height for better centering
        elem.style.height = "auto";
        elem.style.minWidth = "60px"; // Minimum width for consistency
        elem.style.boxSizing = "border-box";
    });
};

export const styleTypography = (root: HTMLElement) => {
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
};

export const styleTables = (root: HTMLElement) => {
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
};

export const styleMetricCards = (root: HTMLElement) => {
    const metricGrid = root.querySelector(".pdf-metric-grid") as HTMLElement;
    if (metricGrid) {
        metricGrid.style.display = "grid";
        // Use 5 columns to fit more metrics per row
        metricGrid.style.gridTemplateColumns = "repeat(5, 1fr)";
        metricGrid.style.width = "100%";
        // Use standard setProperty for priority
        metricGrid.style.setProperty("grid-template-columns", "repeat(5, 1fr)", "important");
        metricGrid.style.setProperty("display", "grid", "important");
        metricGrid.style.gap = "12px"; // Smaller gap for 5 columns
        metricGrid.style.setProperty("grid-auto-rows", "auto", "important");
        // Ensure all children are visible
        metricGrid.querySelectorAll(":scope > *").forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.display = "block";
            childEl.style.visibility = "visible";
            childEl.style.opacity = "1";
        });
    }

    root.querySelectorAll(".pdf-metric-grid > *").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = "#ffffff";
        elem.style.border = "1px solid #e2e8f0";
        elem.style.borderRadius = "8px";
        elem.style.padding = "10px"; // Comfortable padding
        elem.style.breakInside = "avoid";
        elem.style.overflow = "hidden";
        elem.style.minWidth = "0"; // CRITICAL: Allows grid items to shrink below content size
        elem.style.width = "100%"; // Ensure it fills the grid cell

        // Compact typography for children
        // Title
        const title = elem.querySelector("span.text-sm") as HTMLElement;
        if (title) {
            title.style.fontSize = "11px";
            title.style.marginBottom = "4px";
            title.style.fontWeight = "700";
        }

        // Badge
        const badge = elem.querySelector(".badge, .Badge") as HTMLElement;
        if (badge) {
            badge.style.display = "inline-flex";
            badge.style.alignItems = "center";
            badge.style.justifyContent = "center";
            badge.style.fontSize = "9px";
            badge.style.padding = "0 8px"; // Remove vertical padding to let flex center it
            badge.style.paddingTop = "0";
            badge.style.paddingBottom = "0";
            badge.style.minWidth = "auto";
            badge.style.height = "18px";
            badge.style.lineHeight = "1"; // Ensure no extra line height
            badge.style.boxSizing = "border-box";
        }

        // Header row adjustment
        const headerRow = elem.querySelector(".flex.items-center.justify-between.mb-3") as HTMLElement;
        if (headerRow) {
            headerRow.style.marginBottom = "6px";
        }

        // Score Display container
        const scoreRow = elem.querySelector(".flex.items-center.gap-3.mb-3") as HTMLElement;
        if (scoreRow) {
            scoreRow.style.marginBottom = "6px";
            scoreRow.style.gap = "8px";
        }

        // Score
        const score = elem.querySelector("p.text-2xl") as HTMLElement;
        if (score) {
            score.style.fontSize = "18px";
            score.style.lineHeight = "1.2";
        }

        // Score subtext
        const scoreSub = elem.querySelector(".text-xs.text-muted-foreground") as HTMLElement;
        if (scoreSub && (scoreSub.innerText === "Lower is better" || scoreSub?.innerText === "Higher is better")) {
            scoreSub.style.fontSize = "9px";
        }

        // Icon container
        const iconBox = elem.querySelector(".p-2.rounded-lg") as HTMLElement;
        if (iconBox) {
            iconBox.style.padding = "4px";
            iconBox.style.borderRadius = "6px";
        }
        
        // Icon itself
        const icon = elem.querySelector("svg") as unknown as HTMLElement;
        if (icon) {
            icon.style.width = "16px";
            icon.style.height = "16px";
        }

        // Progress bar container
        const progressContainer = elem.querySelector(".h-1\\.5") as HTMLElement;
        if (progressContainer) {
            progressContainer.style.marginBottom = "6px";
            progressContainer.style.height = "6px";
        }

        // Explanation / Analysis box - HIDE for PDF to make cards compact
        const analysisBox = elem.querySelector(".bg-muted\\/50") as HTMLElement;
        if (analysisBox) {
            analysisBox.style.display = "none";
        }

        // Analysis header
        const analysisHeader = elem.querySelector(".text-xs.font-medium") as HTMLElement;
        if (analysisHeader) {
            analysisHeader.style.fontSize = "10px";
            analysisHeader.style.marginBottom = "4px";
        }

        // Analysis icon
        const analysisIcon = analysisHeader?.querySelector("svg") as unknown as HTMLElement;
        if (analysisIcon) {
            analysisIcon.style.width = "12px";
            analysisIcon.style.height = "12px";
        }

        // Analysis text
        elem.querySelectorAll(".text-xs.text-muted-foreground.space-y-1\\.5").forEach(t => {
            const div = t as HTMLElement;
            div.style.lineHeight = "1.3";
            // Remove space-y
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.gap = "3px";
        });

        elem.querySelectorAll(".text-xs").forEach(t => {
            const el = t as HTMLElement;
            if (!el.style.fontSize) el.style.fontSize = "10px";
        });
    });
};

export const styleIcons = (root: HTMLElement) => {
    // Icon colors
    root.querySelectorAll("[class*='text-primary']").forEach(el => {
        (el as HTMLElement).style.color = "#4f46e5"; // indigo-600
    });
};

export const styleMutedBackgrounds = (root: HTMLElement) => {
    // Muted backgrounds
    root.querySelectorAll("[class*='bg-muted']").forEach(el => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        if (!classes.includes("bg-muted-foreground")) {
            elem.style.backgroundColor = "#f1f5f9"; // slate-100
        }
    });
};

export const fixProgressBars = (root: HTMLElement) => {
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
                innerBar.style.background = "#94a3b8"; 
            } else {
                innerBar.style.background = "#94a3b8";
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
                    // Changed from Blue to Gray as requested
                    bar.style.background = "#94a3b8"; // slate-400
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
                innerBar.style.background = "#94a3b8"; // slate-400
            } else {
                innerBar.style.background = "#94a3b8"; // slate-400
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
            elem.style.backgroundColor = "#94a3b8"; // slate-400
        }
    });
};
