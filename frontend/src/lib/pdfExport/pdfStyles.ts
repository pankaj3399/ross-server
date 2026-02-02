/**
 * PDF Styling Helper Functions
 * Shared styles for all report PDF exports
 */

const PDF_COLORS = {
    primary: "#4285f4",
    primaryDark: "#4f46e5", // Indigo-600 used in icons
    white: "#ffffff",
    text: {
        foreground: "#0f172a", // slate-900
        muted: "#64748b",      // slate-500
        default: "#374151",    // gray-700
        header: "#334155",     // slate-700
    },
    background: {
        white: "#ffffff",
        muted: "#f8fafc",      // slate-50
        slate100: "#f1f5f9",
        indigo50: "#eef2ff",
        green50: "#f0fdf4",
        amber50: "#fffbeb",
        red50: "#fef2f2",
        slate200: "#e2e8f0",
        slate800: "#1e293b",
        slate400: "#94a3b8",
    },
    border: {
        default: "#e2e8f0",
        indigo: "#c7d2fe",
        green: "#86efac",
        amber: "#fcd34d",
        red: "#fca5a5",
    },
    status: {
        success: "#059669",    // emerald-600
        successBright: "#10b981",
        warning: "#d97706",    // amber-600
        warningBright: "#f59e0b",
        destructive: "#dc2626", // red-600
        destructiveBright: "#ef4444",
    }
};

export const styleHeader = (root: HTMLElement) => {
    const header = root.querySelector("header");
    if (header) {
        const headerEl = header as HTMLElement;
        headerEl.style.backgroundColor = PDF_COLORS.primary; // Primary Blue
        headerEl.style.padding = "20px 0";
        headerEl.style.marginBottom = "24px";
        headerEl.style.textAlign = "center";
        
        // Remove bottom border if any
        headerEl.style.borderBottom = "none";
        
        // Style header text
        const h1 = headerEl.querySelector("h1");
        if (h1) {
            (h1 as HTMLElement).style.fontSize = "24px"; // Slightly smaller for better fit
            (h1 as HTMLElement).style.fontWeight = "700";
            (h1 as HTMLElement).style.color = PDF_COLORS.white; // White text
            (h1 as HTMLElement).style.letterSpacing = "-0.01em";
            (h1 as HTMLElement).style.margin = "0 0 4px 0";
        }
        
        // Style subtitle/label
        headerEl.querySelectorAll("p.text-xs").forEach((p) => {
            const pEl = p as HTMLElement;
            pEl.style.color = PDF_COLORS.white; // White text
            pEl.style.fontWeight = "600";
            pEl.style.textTransform = "uppercase";
            pEl.style.letterSpacing = "0.05em";
            pEl.style.margin = "0";
        });
    }
};

export const styleGrid = (root: HTMLElement) => {
    root.querySelectorAll(".grid").forEach((el) => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        
        elem.style.display = "grid";
        
        // Check for specific grid configurations
        if (classes.includes("pdf-metric-grid") || classes.includes("lg:grid-cols-5")) {
            // 3-column grid for metric cards - fits 3x3 layout on one page
            elem.style.setProperty("grid-template-columns", "repeat(3, 1fr)", "important");
            elem.style.gap = "12px";
        } else if (classes.includes("lg:grid-cols-2")) {
            // 2-column grid
            elem.style.setProperty("grid-template-columns", "repeat(2, 1fr)", "important");
            elem.style.gap = "16px";
        } else if (classes.includes("md:grid-cols-3")) {
            // 3-column grid on medium screens
            elem.style.setProperty("grid-template-columns", "repeat(3, 1fr)", "important");
            elem.style.gap = "12px";
        } else if (classes.includes("grid-cols-2")) {
            // 2-column grid
            elem.style.setProperty("grid-template-columns", "repeat(2, 1fr)", "important");
            elem.style.gap = "12px";
        } else {
            // Default gap
            elem.style.gap = "16px";
        }
    });
};

export const styleCards = (root: HTMLElement) => {
    root.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl").forEach((el) => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        
        elem.style.backgroundColor = PDF_COLORS.background.white;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.overflow = "hidden";
        
        // Metric cards in the grid get tighter styling
        if (elem.closest(".pdf-metric-grid")) {
            elem.style.borderRadius = "6px";
            elem.style.boxShadow = "0 1px 3px -1px rgba(0, 0, 0, 0.06)";
            elem.style.padding = "6px";
        } else if (classes.includes("rounded-3xl")) {
            elem.style.borderRadius = "16px";
            elem.style.boxShadow = "0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)";
        } else if (classes.includes("rounded-2xl")) {
            elem.style.borderRadius = "12px";
            elem.style.boxShadow = "0 2px 12px -2px rgba(0, 0, 0, 0.06)";
        } else {
            elem.style.borderRadius = "8px";
            elem.style.boxShadow = "0 1px 6px -1px rgba(0, 0, 0, 0.05)";
        }
    });
};

export const styleSectionCards = (root: HTMLElement) => {
    root.querySelectorAll("section > .rounded-3xl").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.boxShadow = "0 8px 30px -8px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.06)";
        elem.style.padding = "16px"; // Compact padding for page fit
    });
    
    // Make the main section with metrics more compact
    root.querySelectorAll("section.rounded-3xl, section > .rounded-3xl").forEach((el) => {
        const elem = el as HTMLElement;
        // Reduce internal spacing
        elem.querySelectorAll(".space-y-8").forEach(spacer => {
            (spacer as HTMLElement).style.setProperty("gap", "16px", "important");
        });
        elem.querySelectorAll(".space-y-6").forEach(spacer => {
            (spacer as HTMLElement).style.setProperty("gap", "12px", "important");
        });
        elem.querySelectorAll(".space-y-4").forEach(spacer => {
            (spacer as HTMLElement).style.setProperty("gap", "8px", "important");
        });
    });
};

export const styleUploadInfo = (root: HTMLElement) => {
    root.querySelectorAll(".bg-slate-50\\/60, .bg-slate-50").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.muted;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.borderRadius = "8px";
        elem.style.padding = "12px"; // Compact padding
        
        // Reduce internal spacing
        elem.querySelectorAll(".space-y-3").forEach(spacer => {
            (spacer as HTMLElement).style.setProperty("gap", "6px", "important");
        });
        
        // Smaller text
        elem.querySelectorAll(".text-base").forEach(text => {
            (text as HTMLElement).style.fontSize = "13px";
        });
        elem.querySelectorAll(".text-sm").forEach(text => {
            (text as HTMLElement).style.fontSize = "11px";
        });
        elem.querySelectorAll(".text-xs").forEach(text => {
            (text as HTMLElement).style.fontSize = "9px";
        });
    });
};

export const styleAnalysisParams = (root: HTMLElement) => {
    root.querySelectorAll("[class*='bg-indigo-50']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.indigo50;
        elem.style.border = `1px solid ${PDF_COLORS.border.indigo}`;
        elem.style.borderRadius = "8px";
        elem.style.padding = "12px"; // Compact padding
        
        // Reduce internal spacing
        elem.querySelectorAll(".space-y-3").forEach(spacer => {
            (spacer as HTMLElement).style.setProperty("gap", "6px", "important");
        });
        
        // Smaller text
        elem.querySelectorAll(".text-lg").forEach(text => {
            (text as HTMLElement).style.fontSize = "14px";
        });
        elem.querySelectorAll(".text-sm").forEach(text => {
            (text as HTMLElement).style.fontSize = "11px";
        });
        elem.querySelectorAll(".text-xs").forEach(text => {
            (text as HTMLElement).style.fontSize = "9px";
        });
    });
};

export const styleVerdictColors = (root: HTMLElement) => {
    // Pass/Success colors
    root.querySelectorAll("[class*='bg-green-50'], [class*='bg-success']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.green50;
        elem.style.border = `1px solid ${PDF_COLORS.border.green}`;
    });
    root.querySelectorAll("[class*='text-green'], [class*='text-success'], [class*='text-emerald']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.color = PDF_COLORS.status.success; // emerald-600
    });

    // Warning/Caution colors
    root.querySelectorAll("[class*='bg-amber-50'], [class*='bg-warning'], [class*='bg-yellow-50']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.amber50;
        elem.style.border = `1px solid ${PDF_COLORS.border.amber}`;
    });
    root.querySelectorAll("[class*='text-amber'], [class*='text-warning'], [class*='text-yellow']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.color = PDF_COLORS.status.warning; // amber-600
    });

    // Fail/Destructive colors
    root.querySelectorAll("[class*='bg-red-50'], [class*='bg-destructive']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.red50;
        elem.style.border = `1px solid ${PDF_COLORS.border.red}`;
    });
    root.querySelectorAll("[class*='text-red'], [class*='text-destructive']").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.color = PDF_COLORS.status.destructive; // red-600
    });
};

export const styleBadges = (root: HTMLElement) => {
    // Specifically target our new class and any other potential badges
    root.querySelectorAll(".pdf-badge, [class*='badge'], [class*='Badge']").forEach(el => {
        const elem = el as HTMLElement;
        
        // Check if this badge is inside the metric grid for extra compact styling
        const isInMetricGrid = elem.closest(".pdf-metric-grid") !== null;
        
        const fontSize = isInMetricGrid ? "9px" : "11px";
        const hPadding = isInMetricGrid ? "6px" : "10px";
        
        // Asymmetrical vertical padding to shift text UP (more padding on bottom)
        const vPaddingTop = isInMetricGrid ? "1px" : "1px";
        const vPaddingBottom = isInMetricGrid ? "8px" : "10px";
        
        elem.style.setProperty("font-weight", "700", "important");
        elem.style.setProperty("border-radius", "12px", "important");
        elem.style.setProperty("display", "inline-block", "important");
        elem.style.setProperty("font-size", fontSize, "important");
        elem.style.setProperty("padding", `${vPaddingTop} ${hPadding} ${vPaddingBottom} ${hPadding}`, "important");
        elem.style.setProperty("line-height", "1", "important");
        elem.style.setProperty("vertical-align", "middle", "important");
        elem.style.setProperty("box-sizing", "border-box", "important");
        elem.style.setProperty("text-align", "center", "important");
        elem.style.setProperty("min-width", isInMetricGrid ? "auto" : "55px", "important");
        
        // Force height to be auto based on padding + line-height (reliable for html2canvas)
        elem.style.setProperty("height", "auto", "important");
        elem.style.setProperty("margin", "0", "important");
    });
};

export const styleTypography = (root: HTMLElement) => {
    // Section headings
    root.querySelectorAll("h3, h4").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.fontWeight = "600";
        elem.style.color = PDF_COLORS.text.foreground;
        elem.style.letterSpacing = "-0.01em";
    });

    // Main content text
    root.querySelectorAll("p").forEach((el) => {
        const elem = el as HTMLElement;
        if (!elem.style.color || elem.style.color === "inherit") {
            elem.style.color = PDF_COLORS.text.default; // gray-700
        }
    });

    // Muted text
    root.querySelectorAll("[class*='text-muted'], [class*='text-slate-500'], [class*='text-slate-600']").forEach(el => {
        (el as HTMLElement).style.color = PDF_COLORS.text.muted; // slate-500
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
            thEl.style.backgroundColor = PDF_COLORS.background.slate100;
            thEl.style.color = PDF_COLORS.text.header;
            thEl.style.fontWeight = "600";
            thEl.style.padding = "12px 16px";
            thEl.style.textAlign = "left";
            thEl.style.borderBottom = `2px solid ${PDF_COLORS.border.default}`;
        });
        
        // Data rows with alternating colors
        tableEl.querySelectorAll("tbody tr").forEach((tr, index) => {
            const trEl = tr as HTMLElement;
            trEl.style.backgroundColor = index % 2 === 0 ? PDF_COLORS.background.white : PDF_COLORS.background.muted;
            trEl.style.borderBottom = `1px solid ${PDF_COLORS.border.default}`;
        });
        
        // Data cells
        tableEl.querySelectorAll("td").forEach(td => {
            const tdEl = td as HTMLElement;
            tdEl.style.padding = "10px 16px";
            tdEl.style.color = PDF_COLORS.text.default;
        });
    });
};

export const styleMetricCards = (root: HTMLElement) => {
    const metricGrid = root.querySelector(".pdf-metric-grid") as HTMLElement;
    if (metricGrid) {
        metricGrid.style.display = "grid";
        // Use 3 columns for a 3x3 grid layout that fits on one page
        metricGrid.style.setProperty("grid-template-columns", "repeat(3, 1fr)", "important");
        metricGrid.style.setProperty("display", "grid", "important");
        metricGrid.style.gap = "12px"; // Comfortable gap for 3-column layout
        metricGrid.style.setProperty("grid-auto-rows", "auto", "important");
        metricGrid.style.width = "100%";
        metricGrid.style.padding = "0";
        metricGrid.style.margin = "0";
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
        elem.style.backgroundColor = PDF_COLORS.background.white;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.borderRadius = "8px";
        elem.style.padding = "12px"; // Comfortable padding for 3x3 grid
        elem.style.breakInside = "avoid";
        elem.style.overflow = "hidden";
        elem.style.minWidth = "0"; // CRITICAL: Allows grid items to shrink below content size
        elem.style.width = "100%"; // Ensure it fills the grid cell
        elem.style.boxSizing = "border-box";

        // Compact typography for children
        // Title
        const title = elem.querySelector("span.text-sm") as HTMLElement;
        if (title) {
            title.style.fontSize = "11px";
            title.style.marginBottom = "4px";
            title.style.fontWeight = "600";
            title.style.lineHeight = "1.2";
        }

        // Badge - compact but readable for 3x3 grid
        elem.querySelectorAll(".pdf-badge, [class*='badge'], [class*='Badge']").forEach(b => {
            const badge = b as HTMLElement;
            badge.style.setProperty("display", "inline-block", "important");
            badge.style.setProperty("vertical-align", "middle", "important");
            badge.style.setProperty("font-size", "9px", "important");
            // Asymmetrical padding to shift text UP
            badge.style.setProperty("padding", "1px 8px 3px 8px", "important");
            badge.style.setProperty("line-height", "1", "important");
            badge.style.setProperty("height", "auto", "important");
            badge.style.setProperty("min-width", "auto", "important");
            badge.style.setProperty("box-sizing", "border-box", "important");
            badge.style.setProperty("border-radius", "10px", "important");
            badge.style.setProperty("font-weight", "700", "important");
            badge.style.setProperty("text-align", "center", "important");
        });

        // Header adjustment
        const headerRow = elem.querySelector(".flex.items-center.justify-between.mb-3") as HTMLElement;
        if (headerRow) {
            headerRow.style.marginBottom = "6px";
            headerRow.style.gap = "6px";
        }

        // Score Display container
        const scoreRow = elem.querySelector(".flex.items-center.gap-3.mb-3") as HTMLElement;
        if (scoreRow) {
            scoreRow.style.marginBottom = "6px";
            scoreRow.style.gap = "8px";
        }

        // Score - readable for 3x3 grid
        const score = elem.querySelector("p.text-2xl") as HTMLElement;
        if (score) {
            score.style.fontSize = "18px";
            score.style.lineHeight = "1.2";
            score.style.fontWeight = "700";
        }

        // Icon container
        const iconBox = elem.querySelector(".p-2.rounded-lg") as HTMLElement;
        if (iconBox) {
            iconBox.style.padding = "6px";
            iconBox.style.borderRadius = "6px";
        }
        
        // Icon itself
        elem.querySelectorAll("svg").forEach(svg => {
            const icon = svg as unknown as HTMLElement;
            icon.style.width = "16px";
            icon.style.height = "16px";
        });

        // Progress bar container
        const progressContainer = elem.querySelector(".h-1\\.5") as HTMLElement;
        if (progressContainer) {
            progressContainer.style.marginBottom = "6px";
            progressContainer.style.height = "6px";
        }

        // Explanation / Analysis box - HIDE for PDF to make cards compact and fit on one page
        const analysisBox = elem.querySelector(".bg-muted\\/50") as HTMLElement;
        if (analysisBox) {
            analysisBox.style.display = "none";
        }

        // Also hide any analysis sections by class pattern
        elem.querySelectorAll("[class*='bg-muted']").forEach(box => {
            const boxEl = box as HTMLElement;
            if (boxEl.querySelector(".text-xs.font-medium")) {
                boxEl.style.display = "none";
            }
        });
    });
};

export const styleIcons = (root: HTMLElement) => {
    // Icon colors
    root.querySelectorAll("[class*='text-primary']").forEach(el => {
        (el as HTMLElement).style.color = PDF_COLORS.primaryDark; // indigo-600
    });
};

export const styleMutedBackgrounds = (root: HTMLElement) => {
    // Muted backgrounds
    root.querySelectorAll("[class*='bg-muted']").forEach(el => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        if (!classes.includes("bg-muted-foreground")) {
            elem.style.backgroundColor = PDF_COLORS.background.slate100; // slate-100
        }
    });
};

export const fixProgressBars = (root: HTMLElement) => {
    // ===== FAIRNESS SCORE PROGRESS BARS =====
    root.querySelectorAll(".pdf-progress-bar, [role='progressbar']").forEach((container) => {
        const containerEl = container as HTMLElement;
        
        containerEl.style.backgroundColor = PDF_COLORS.background.slate200;
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
                innerBar.style.backgroundColor = PDF_COLORS.background.slate800;
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
                innerBar.style.background = `linear-gradient(90deg, ${PDF_COLORS.status.success}, ${PDF_COLORS.status.successBright})`;
            } else if (innerClasses.includes("warning") || innerClasses.includes("amber") || innerClasses.includes("yellow") || innerClasses.includes("orange")) {
                innerBar.style.background = `linear-gradient(90deg, ${PDF_COLORS.status.warning}, ${PDF_COLORS.status.warningBright})`;
            } else if (innerClasses.includes("destructive") || innerClasses.includes("red") || innerClasses.includes("rose")) {
                innerBar.style.background = `linear-gradient(90deg, ${PDF_COLORS.status.destructive}, ${PDF_COLORS.status.destructiveBright})`;
            } else if (innerClasses.includes("primary") || innerClasses.includes("indigo")) {
                innerBar.style.background = PDF_COLORS.background.slate400; 
            } else {
                innerBar.style.background = PDF_COLORS.background.slate400;
            }
        });
    });

    // ===== GRADIENT BACKGROUNDS =====
    root.querySelectorAll("[class*='bg-gradient']").forEach((el) => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        elem.style.backgroundImage = "none";
        if (classes.includes("amber") || classes.includes("orange") || classes.includes("warning")) {
            elem.style.backgroundColor = PDF_COLORS.status.warningBright;
        } else if (classes.includes("emerald") || classes.includes("teal") || classes.includes("success") || classes.includes("green")) {
            elem.style.backgroundColor = PDF_COLORS.status.successBright;
        } else if (classes.includes("rose") || classes.includes("red") || classes.includes("destructive")) {
            elem.style.backgroundColor = PDF_COLORS.status.destructiveBright;
        } else if (classes.includes("primary") || classes.includes("indigo")) {
            elem.style.backgroundColor = PDF_COLORS.background.slate400; // slate-400
        }
    });
};

export const styleCircleScores = (root: HTMLElement) => {
    // Target the circular score indicators
    root.querySelectorAll(".pdf-percentage-circle, .rounded-full").forEach(el => {
        const elem = el as HTMLElement;
        const text = elem.innerText || "";
        
        // Only target if it's explicitly marked or looks like a score
        const isExplicit = elem.classList.contains("pdf-percentage-circle");
        const isScoreLike = text.includes("%") || /^\d+$/.test(text.trim());

        if (isExplicit || isScoreLike) {
            elem.style.setProperty("display", "block", "important");
            elem.style.setProperty("text-align", "center", "important");
            
            // Force dimensions to be stable
            const size = "48px"; // w-12 is 48px
            elem.style.setProperty("width", size, "important");
            elem.style.setProperty("height", size, "important");
            elem.style.setProperty("min-width", size, "important");
            elem.style.setProperty("min-height", size, "important");
            
            // Use line-height for perfect vertical centering in PDF
            // Set line-height equal to height for exact centering
            elem.style.setProperty("line-height", "32px", "important"); 
            elem.style.setProperty("padding", "0", "important");
            
            // Font adjustments
            elem.style.setProperty("font-size", "14px", "important");
            elem.style.setProperty("font-weight", "700", "important");
            
            // Ensure no flex interference
            elem.style.setProperty("flex-shrink", "0", "important");
            elem.style.setProperty("box-sizing", "border-box", "important");
        }
    });

    // Also target the overall score large circle text
    root.querySelectorAll(".pdf-overall-score-container").forEach(el => {
        const container = el as HTMLElement;
        const parent = container.parentElement as HTMLElement;
        
        if (parent) {
            // Force the container of the pie chart and the absolute text to have fixed dimensions
            // Matching w-64 (256px) for consistency with original layout
            const size = "256px";
            parent.style.setProperty("width", size, "important");
            parent.style.setProperty("height", size, "important");
            parent.style.setProperty("min-width", size, "important");
            parent.style.setProperty("min-height", size, "important");
            parent.style.setProperty("margin", "0 auto 20px auto", "important");
            parent.style.setProperty("position", "relative", "important");
            parent.style.setProperty("display", "block", "important");
            
            // Force the SVG wrapper and surface to match the parent exactly
            parent.querySelectorAll(".recharts-wrapper, .recharts-surface, .recharts-responsive-container").forEach(chartEl => {
                const cEl = chartEl as HTMLElement;
                cEl.style.setProperty("width", size, "important");
                cEl.style.setProperty("height", size, "important");
                cEl.style.setProperty("position", "absolute", "important");
                cEl.style.setProperty("top", "0", "important");
                cEl.style.setProperty("left", "0", "important");
            });
        }

        // Pin the text container to the absolute center of the parent
        container.style.setProperty("display", "flex", "important");
        container.style.setProperty("flex-direction", "column", "important");
        container.style.setProperty("align-items", "center", "important");
        container.style.setProperty("justify-content", "center", "important");
        container.style.setProperty("height", "100%", "important");
        container.style.setProperty("width", "100%", "important");
        container.style.setProperty("position", "absolute", "important");
        container.style.setProperty("top", "0", "important");
        container.style.setProperty("left", "0", "important");
        container.style.setProperty("z-index", "20", "important");
        
        const value = container.querySelector(".pdf-overall-score-value") as HTMLElement;
        if (value) {
            value.style.setProperty("font-size", "56px", "important"); // Large and bold
            value.style.setProperty("font-weight", "800", "important");
            value.style.setProperty("line-height", "1.2", "important");
            value.style.setProperty("padding", "0", "important");
            value.style.setProperty("margin", "0", "important");
            value.style.setProperty("color", PDF_COLORS.text.foreground, "important");
            value.style.setProperty("display", "block", "important");
            value.style.setProperty("text-align", "center", "important");
        }
        
        const label = container.querySelector(".pdf-overall-score-label") as HTMLElement;
        if (label) {
            label.style.setProperty("font-size", "14px", "important");
            label.style.setProperty("font-weight", "600", "important");
            label.style.setProperty("color", PDF_COLORS.text.muted, "important");
            label.style.setProperty("margin-top", "14px", "important"); // Increased margin to prevent overlap
            label.style.setProperty("text-transform", "uppercase", "important");
            label.style.setProperty("letter-spacing", "0.05em", "important");
            label.style.setProperty("display", "block", "important");
            label.style.setProperty("text-align", "center", "important");
        }
    });
};

export const styleScoreBadges = (root: HTMLElement) => {
    root.querySelectorAll(".pdf-score-badge").forEach(el => {
        const badge = el as HTMLElement;
        badge.style.setProperty("display", "flex", "important");
        badge.style.setProperty("flex-direction", "row", "important");
        badge.style.setProperty("align-items", "center", "important");
        badge.style.setProperty("gap", "12px", "important");
        badge.style.setProperty("box-sizing", "border-box", "important");
        badge.style.setProperty("min-width", "135px", "important");
        badge.style.setProperty("min-height", "50px", "important");
        badge.style.setProperty("padding", "8px 14px", "important");
        badge.style.setProperty("background", PDF_COLORS.background.white, "important");
        badge.style.setProperty("height", "auto", "important"); // Allow content to dictate height
        
        // Target the icon container if it exists
        const iconContainer = badge.querySelector(".flex-shrink-0") as HTMLElement;
        if (iconContainer) {
            iconContainer.style.setProperty("display", "flex", "important");
            iconContainer.style.setProperty("align-items", "center", "important");
            iconContainer.style.setProperty("justify-content", "center", "important");
        }

        // Target all icons
        badge.querySelectorAll("svg").forEach(svg => {
            const icon = svg as unknown as HTMLElement;
            icon.style.setProperty("width", "18px", "important");
            icon.style.setProperty("height", "18px", "important");
            icon.style.setProperty("display", "block", "important");
            icon.style.setProperty("flex-shrink", "0", "important");
        });

        // Target text container
        const textCol = badge.querySelector(".flex-col") as HTMLElement;
        if (textCol) {
            textCol.style.setProperty("display", "flex", "important");
            textCol.style.setProperty("flex-direction", "column", "important");
            textCol.style.setProperty("justify-content", "center", "important");
            textCol.style.setProperty("padding", "0", "important");
            textCol.style.setProperty("margin", "0", "important");
            textCol.style.setProperty("line-height", "normal", "important");
        }

        // Target label
        badge.querySelectorAll(".pdf-label").forEach(l => {
            const label = l as HTMLElement;
            label.style.setProperty("font-size", "9px", "important");
            label.style.setProperty("line-height", "1.6", "important"); // Balanced space for label
            label.style.setProperty("margin", "0 0 2px 0", "important");
            label.style.setProperty("display", "block", "important");
            label.style.setProperty("font-weight", "700", "important");
            label.style.setProperty("letter-spacing", "0.02em", "important");
            label.style.setProperty("color", PDF_COLORS.text.muted, "important");
        });

        // Target value
        badge.querySelectorAll(".pdf-value").forEach(v => {
            const value = v as HTMLElement;
            value.style.setProperty("font-size", "16px", "important");
            value.style.setProperty("font-weight", "800", "important");
            value.style.setProperty("line-height", "1.6", "important"); // Balanced space for value
            value.style.setProperty("margin", "0 0 6px 0", "important"); // Added margin below percent
            value.style.setProperty("display", "block", "important");
            value.style.setProperty("color", PDF_COLORS.text.foreground, "important");
        });
    });
};
