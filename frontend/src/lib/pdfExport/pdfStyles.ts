/**
 * PDF Styling Helper Functions
 * Shared styles for all report PDF exports
 */

const PDF_COLORS = {
    primary: "#2563eb", // Standard Blue
    primaryDark: "#1e40af",
    white: "#ffffff",
    text: {
        foreground: "#020617", // slate-950 (High contrast)
        muted: "#475569",      // slate-600 (More readable)
        default: "#1e293b",    // slate-800
        header: "#0f172a",     // slate-900
    },
    background: {
        white: "#ffffff",
        muted: "#f8fafc",      // slate-50
        slate100: "#f8fafc",
        indigo50: "#eef2ff",
        green50: "#f0fdf4",
        amber50: "#fffbeb",
        red50: "#fef2f2",
        slate200: "#e2e8f0",
        slate800: "#1e293b",
        slate400: "#94a3b8",
    },
    border: {
        default: "#cbd5e1", // slate-300 (Visible)
        indigo: "#94a3b8",
        green: "#10b981",
        amber: "#f59e0b",
        red: "#ef4444",
    },
    status: {
        success: "#065f46",    // emerald-800 (High contrast)
        successBright: "#059669",
        warning: "#92400e",    // amber-800 (High contrast)
        warningBright: "#d97706",
        destructive: "#991b1b", // red-800 (High contrast)
        destructiveBright: "#dc2626",
    }
};

export const styleHeader = (root: HTMLElement) => {
    const header = root.querySelector("header");
    if (header) {
        const headerEl = header as HTMLElement;
        headerEl.style.setProperty("background-color", "#ffffff", "important");
        headerEl.style.setProperty("padding", "0 0 48px 0", "important");
        headerEl.style.marginBottom = "48px";
        headerEl.style.borderBottom = `2px solid ${PDF_COLORS.border.default}`;
        
        const h1 = headerEl.querySelector("h1");
        if (h1) {
            h1.style.setProperty("font-size", "48px", "important");
            h1.style.setProperty("font-weight", "900", "important");
            h1.style.setProperty("color", "#020617", "important");
            h1.style.setProperty("line-height", "1.1", "important");
            h1.style.setProperty("margin", "0 0 32px 0", "important");
            
            const span = h1.querySelector("span");
            if (span) span.style.setProperty("color", PDF_COLORS.primary, "important");
        }

        // Project metadata row
        const metaRow = headerEl.querySelector(".flex-wrap");
        if (metaRow) {
            const metaContainer = metaRow as HTMLElement;
            metaContainer.style.setProperty("display", "flex", "important");
            metaContainer.style.setProperty("flex-direction", "row", "important");
            metaContainer.style.setProperty("gap", "48px", "important");
            
            metaContainer.querySelectorAll(".flex-col").forEach(col => {
                const colEl = col as HTMLElement;
                const label = colEl.querySelector("span:first-child") as HTMLElement;
                const value = colEl.querySelector("span:last-child") as HTMLElement;
                
                if (label) {
                    label.style.setProperty("font-size", "10px", "important");
                    label.style.setProperty("font-weight", "900", "important");
                    label.style.setProperty("color", "#64748b", "important");
                    label.style.setProperty("margin-bottom", "4px", "important");
                }
                if (value) {
                    value.style.setProperty("font-size", "18px", "important");
                    value.style.setProperty("font-weight", "800", "important");
                    value.style.setProperty("color", "#020617", "important");
                }
            });
        }
    }
};

export const styleGrid = (root: HTMLElement) => {
    root.querySelectorAll(".grid").forEach((el) => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        elem.style.display = "grid";
        
        if (classes.includes("pdf-metric-grid") || classes.includes("lg:grid-cols-5") || classes.includes("lg:grid-cols-4")) {
            elem.style.setProperty("grid-template-columns", "repeat(2, 1fr)", "important");
            elem.style.gap = "32px"; // Increased back from 20
        } else if (classes.includes("lg:grid-cols-2") || classes.includes("md:grid-cols-2")) {
            elem.style.setProperty("grid-template-columns", "repeat(2, 1fr)", "important");
            elem.style.gap = "32px"; // Increased back from 20
        } else {
            elem.style.gap = "24px"; // Increased back from 16
        }
    });
};

export const styleCards = (root: HTMLElement) => {
    root.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, .bg-card, .bg-white").forEach((el) => {
        const elem = el as HTMLElement;
        const classes = elem.className || "";
        
        // Skip header and charts/icons
        if (elem.tagName === "HEADER" || elem.closest("header")) return;
        if (classes.includes("recharts") || classes.includes("lucide")) return;

        elem.style.backgroundColor = PDF_COLORS.background.white;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.overflow = "hidden";
        
        if (classes.includes("rounded-3xl") || classes.includes("rounded-[2.5rem]")) {
            elem.style.borderRadius = "24px";
            elem.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.05)";
            elem.style.padding = "32px";
            
            // Special handling for the overall score card to ensure vertical centering
            if (elem.querySelector(".pdf-huge-score")) {
                elem.style.setProperty("display", "flex", "important");
                elem.style.setProperty("flex-direction", "column", "important");
                elem.style.setProperty("justify-content", "center", "important");
                elem.style.setProperty("min-height", "540px", "important");
                elem.style.setProperty("padding", "40px", "important");
            }
        } else {
            elem.style.borderRadius = "16px";
            elem.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
            elem.style.padding = "24px";
        }
    });
};

export const styleSectionCards = (root: HTMLElement) => {
    root.querySelectorAll("section.space-y-8, section.space-y-6, .max-w-7xl > .space-y-8, .max-w-7xl > .space-y-6, .max-w-7xl > .space-y-4").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.display = "flex";
        elem.style.flexDirection = "column";
        
        const classes = elem.className || "";
        if (classes.includes("space-y-8")) elem.style.gap = "40px"; // Increased from 32
        else if (classes.includes("space-y-6")) elem.style.gap = "32px"; // Increased from 24
        else if (classes.includes("space-y-4")) elem.style.gap = "20px"; // Increased from 16
        else elem.style.gap = "32px";
        
        elem.style.marginBottom = "48px"; // Increased from 32
    });
};

export const styleVerdictColors = (root: HTMLElement) => {
    const applyColors = (selector: string, bg: string, border: string, text: string) => {
        root.querySelectorAll(selector).forEach(el => {
            const elem = el as HTMLElement;
            elem.style.backgroundColor = bg;
            elem.style.borderColor = border;
            elem.style.color = text;
            // Failure boxes and alerts need better padding for readability
            elem.style.padding = "24px"; // Increased from 16
            elem.style.borderRadius = "16px"; // Increased from 12
        });
    };

    applyColors("[class*='bg-green-50'], [class*='bg-success'], [class*='bg-emerald-50']", "#f0fdf4", "#10b981", "#065f46");
    applyColors("[class*='bg-amber-50'], [class*='bg-warning'], [class*='bg-yellow-50']", "#fffbeb", "#f59e0b", "#92400e");
    applyColors("[class*='bg-red-50'], [class*='bg-destructive'], [class*='bg-rose-50']", "#fef2f2", "#ef4444", "#991b1b");

    root.querySelectorAll("[class*='text-green'], [class*='text-emerald']").forEach(el => { (el as HTMLElement).style.setProperty("color", "#065f46", "important"); });
    root.querySelectorAll("[class*='text-amber'], [class*='text-yellow']").forEach(el => { (el as HTMLElement).style.setProperty("color", "#92400e", "important"); });
    root.querySelectorAll("[class*='text-red'], [class*='text-rose']").forEach(el => { (el as HTMLElement).style.setProperty("color", "#991b1b", "important"); });
};

export const styleTypography = (root: HTMLElement) => {
    const isSecurityIterationHeader = (text: string) => {
        const normalized = text.toUpperCase();
        return /JAILBREAK|ITERATION|PROMPT|TEST|OVERALL|FAILED|PASSED/.test(normalized);
    };

    root.querySelectorAll("h1, h2, h3, h4").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.fontWeight = "900";
        elem.style.color = "#020617";
        elem.style.lineHeight = "1.2";
        elem.style.margin = "12px 0 16px 0";
        elem.style.display = "block";
        
        if (elem.tagName === "H3") elem.style.fontSize = "24px";
        if (elem.tagName === "H4") elem.style.fontSize = "18px";
    });

    // Handle small labels (often used above input/data boxes)
    // Scope to avoid restyling contextual semantic labels like status badges
    root.querySelectorAll(".pdf-prompt-box ~ label, .pdf-reason-box ~ label, .grid label, .space-y-4 > label, .text-\\[10px\\]:not(.rounded-md):not(.rounded-full):not(.pdf-badge):not(.status):not(.severity)").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.setProperty("font-size", "11px", "important");
        elem.style.setProperty("letter-spacing", "0.05em", "important");
        elem.style.setProperty("margin-top", "24px", "important"); // Increase space from content above
        elem.style.setProperty("margin-bottom", "12px", "important"); // Increase space to box below
        elem.style.setProperty("font-weight", "800", "important");
        elem.style.setProperty("text-transform", "uppercase", "important");
        elem.style.setProperty("color", "#475569", "important");
        elem.classList.add("pdf-label-processed");
    });


    root.querySelectorAll("p, span, div, li, label").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.overflow = "visible";
        
        let hasDirectText = false;
        for (let i = 0; i < elem.childNodes.length; i++) {
            if (elem.childNodes[i].nodeType === 3 && elem.childNodes[i].nodeValue?.trim() !== "") {
                hasDirectText = true;
                break;
            }
        }
        
        if (hasDirectText && !elem.classList.contains("pdf-label-processed")) {
            elem.style.lineHeight = "1.6"; // Balanced
            if (!elem.style.paddingTop) elem.style.paddingTop = "3px";
            if (!elem.style.paddingBottom) elem.style.paddingBottom = "3px";
            
            // Bump up base text size for better readability
            const currentSize = window.getComputedStyle(elem).fontSize;
            if (parseInt(currentSize) < 16) {
                elem.style.fontSize = "16px";
            }
        }
    });

    // GLOBAL VERTICAL REALIGNMENT for category headers (JAILBREAK 4 OVERALL type blocks)
    root.querySelectorAll(".flex.items-center.gap-3.text-xs.font-black, .flex.items-center.gap-2.text-sm.font-semibold").forEach(el => {
        const elem = el as HTMLElement;
        if (!isSecurityIterationHeader(elem.textContent || "")) return;

        elem.style.setProperty("display", "flex", "important");
        elem.style.setProperty("align-items", "center", "important");
        elem.style.setProperty("min-height", "24px", "important");
        elem.style.setProperty("padding-left", "16px", "important"); // Add gap from vertical line
        
        elem.querySelectorAll("span, div").forEach((child, idx) => {
            const childEl = child as HTMLElement;
            // Use index to differentiate between category text (0) and badge (1+)
            if (idx === 0) {
                childEl.style.setProperty("margin-top", "-18px", "important");
                childEl.style.setProperty("padding-bottom", "4px", "important");
            } else {
                // Bring the badge ("4 OVERALL") down slightly
                childEl.style.setProperty("margin-top", "-14px", "important");
                childEl.style.setProperty("padding-bottom", "2px", "important");
            }
            childEl.style.setProperty("display", "inline-flex", "important");
            childEl.style.setProperty("align-items", "center", "important");
        });
    });

    // GLOBAL FIX for all elements with icons (Headers, Badges, Rows)
    root.querySelectorAll(".flex.items-center, .inline-flex.items-center, .flex.gap-2, .flex.gap-3").forEach(el => {
        const container = el as HTMLElement;
        container.style.setProperty("display", "flex", "important");
        container.style.setProperty("flex-direction", "row", "important");
        container.style.setProperty("align-items", "center", "important");
        container.style.setProperty("flex-wrap", "nowrap", "important");
        
        // CRITICAL: Wrap naked text nodes so they can be targeted for nudging
        Array.from(container.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                const span = document.createElement("span");
                span.textContent = node.textContent;
                node.parentNode?.replaceChild(span, node);
            }
        });

        // If it contains an SVG or Lucide icon, or is a header, apply more aggressive alignment
        const hasIcon = container.querySelector("svg, .lucide");
        const isHeader = container.tagName.match(/^H[1-6]$/);
        const shouldRealign = isSecurityIterationHeader(container.textContent || "");
        
        if ((hasIcon || isHeader) && shouldRealign) {
            container.style.setProperty("min-height", "32px", "important");
            
            // For headers and icon rows, nudge icons and text differently
            container.childNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const child = node as HTMLElement;
                    const isIcon = child.querySelector("svg") || child.tagName === "SVG" || child.classList.contains("lucide");
                    
                    if (isIcon) {
                        child.style.setProperty("display", "inline-flex", "important");
                        child.style.setProperty("align-items", "center", "important");
                        const svg = child.querySelector("svg") || (child.tagName === "SVG" ? child : null) as HTMLElement;
                        if (svg) {
                            svg.style.setProperty("margin-top", "0px", "important");
                        }
                    } else {
                        // Text node handling
                        const hasFlexGrow = child.classList.contains("flex-grow") || child.classList.contains("flex-1");
                        
                        if (hasFlexGrow) {
                            child.style.setProperty("display", "block", "important");
                            child.style.setProperty("flex", "1", "important");
                            child.style.setProperty("flex-grow", "1", "important");
                        } else {
                            child.style.setProperty("display", "inline-block", "important");
                        }
                        
                        child.style.setProperty("line-height", "1.2", "important");
                        
                        const isJustifyBetween = container.classList.contains("justify-between");
                        if (!isJustifyBetween && !hasFlexGrow) {
                            child.style.setProperty("transform", "translateY(-4px)", "important");
                        }
                    }
                }

                // Premium AIMA AI-insight body formatting for clean PDF readability
                root.querySelectorAll("h5, h4").forEach((el) => {
                    const heading = el as HTMLElement;
                    const headingText = (heading.textContent || "").trim().toUpperCase();
                    const isInsightHeading = /STRATEGIC ANALYSIS|KEY INDICATORS|ACTION PLAN|TOP RECOMMENDATIONS/.test(headingText);
                    if (!isInsightHeading) return;

                    heading.style.setProperty("font-size", "12px", "important");
                    heading.style.setProperty("font-weight", "800", "important");
                    heading.style.setProperty("line-height", "1.35", "important");
                    heading.style.setProperty("letter-spacing", "0.06em", "important");
                    heading.style.setProperty("margin", "0 0 8px 0", "important");
                    heading.style.setProperty("transform", "none", "important");

                    const section = heading.closest(".space-y-4") as HTMLElement | null;
                    if (!section) return;

                    section.style.setProperty("display", "flex", "important");
                    section.style.setProperty("flex-direction", "column", "important");
                    section.style.setProperty("gap", "10px", "important");

                    section.querySelectorAll("p, li").forEach(node => {
                        const textNode = node as HTMLElement;
                        textNode.style.setProperty("font-size", "12px", "important");
                        textNode.style.setProperty("line-height", "1.55", "important");
                        textNode.style.setProperty("letter-spacing", "0", "important");
                        textNode.style.setProperty("word-break", "break-word", "important");
                        textNode.style.setProperty("white-space", "normal", "important");
                        textNode.style.setProperty("margin", "0", "important");
                        textNode.style.setProperty("padding", "0", "important");
                    });
                });
            });
        }
    });

    root.querySelectorAll("[class*='text-muted'], [class*='text-slate-500'], [class*='text-slate-400']").forEach(el => {
        (el as HTMLElement).style.color = PDF_COLORS.text.muted;
    });

    // Specific fix for the blue vertical status bars in headers
    root.querySelectorAll(".w-1.h-8.bg-primary, .w-1\\.5.h-6.bg-primary\\/20, .bg-primary").forEach(bar => {
        const barEl = bar as HTMLElement;
        if (barEl.classList.contains("bg-primary") && !barEl.classList.contains("rounded-full")) {
            barEl.style.setProperty("background-color", PDF_COLORS.primary, "important");
            barEl.style.setProperty("min-width", "4px", "important");
            barEl.style.setProperty("height", "24px", "important");
            barEl.style.setProperty("border-radius", "4px", "important");
        }
    });
};

export const styleTables = (root: HTMLElement) => {
    root.querySelectorAll("table").forEach(table => {
        const tableEl = table as HTMLTableElement;
        tableEl.style.width = "100%";
        tableEl.style.borderCollapse = "collapse";
        
        tableEl.querySelectorAll("th").forEach(th => {
            const thEl = th as HTMLElement;
            thEl.style.backgroundColor = PDF_COLORS.background.slate100;
            thEl.style.color = PDF_COLORS.text.header;
            thEl.style.fontWeight = "600";
            thEl.style.padding = "12px 16px";
            thEl.style.textAlign = "left";
            thEl.style.borderBottom = `2px solid ${PDF_COLORS.border.default}`;
        });
        
        tableEl.querySelectorAll("td").forEach(td => {
            const tdEl = td as HTMLElement;
            tdEl.style.padding = "12px 16px";
            tdEl.style.borderBottom = `1px solid ${PDF_COLORS.border.default}`;
        });
    });
};

export const styleMetricCards = (root: HTMLElement) => {
    // Selection for generic stat cards
    root.querySelectorAll(".grid > .bg-card, .grid > .bg-white, .pdf-metric-grid > *").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.white;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.borderRadius = "16px";
        elem.style.padding = "28px"; // Increased from 24
        elem.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";

        elem.style.setProperty("display", "flex", "important");
        elem.style.setProperty("flex-direction", "column", "important");
        elem.style.setProperty("justify-content", "center", "important");
        elem.style.setProperty("min-height", "120px", "important");

        // Style numbers - be specific to avoid hitting small labels with .font-bold
        const numbers = elem.querySelectorAll(".text-3xl, .text-2xl, .text-xl");
        numbers.forEach(n => {
            const num = n as HTMLElement;
            num.style.fontSize = "24px"; // Reduced from 28px
            num.style.fontWeight = "800";
            num.style.marginTop = "4px"; // Reduced from 8px for better centering
            num.style.marginBottom = "4px"; 
            num.style.setProperty("margin-top", "0px", "important");
            num.style.setProperty("padding-bottom", "4px", "important"); // Nudge up
            num.style.letterSpacing = "-0.02em";
        });

        // Style labels
        const labels = elem.querySelectorAll(".text-sm, .text-xs, [class*='text-[10px]']");
        labels.forEach(l => {
            const label = l as HTMLElement;
            label.style.fontSize = "12px";
            label.style.fontWeight = "900";
            label.style.letterSpacing = "0.1em";
            label.style.color = "#64748b";
            label.style.textTransform = "uppercase";
            label.style.marginBottom = "8px";
            label.style.display = "block";
        });
    });
    
    // Specifically target the prompt/reason boxes to be very readable - LOWERCASE & COMPACT
    root.querySelectorAll(".pdf-prompt-box, .pdf-reason-box, .pdf-prompt-box .bg-slate-50\\/50, .pdf-reason-box .bg-white\\/80").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.setProperty("font-size", "14px", "important"); 
        elem.style.setProperty("line-height", "1.6", "important");
        elem.style.setProperty("color", "#0f172a", "important");
        elem.style.setProperty("padding", "24px 16px 48px 16px", "important"); // Increased bottom padding
        elem.style.setProperty("margin-top", "24px", "important"); // Increased space from labels
        elem.style.setProperty("margin-bottom", "32px", "important"); // Increased space below box
        elem.style.setProperty("display", "flex", "important"); 
        elem.style.setProperty("align-items", "center", "important");
        elem.style.setProperty("min-height", "60px", "important"); 
        elem.style.setProperty("width", "100%", "important");
        
        // Target any direct text node or child for a forceful nudge
        elem.querySelectorAll("*").forEach(child => {
            (child as HTMLElement).style.setProperty("margin-top", "-8px", "important"); // gentler nudge
        });
    });
};

export const styleCircleScores = (root: HTMLElement) => {
    // Huge Score Scaling (0.00 / 3.0)
    root.querySelectorAll(".pdf-huge-score").forEach(el => {
        const score = el as HTMLElement;
        score.style.setProperty("font-size", "92px", "important"); // Slightly smaller than 110px for better fit
        score.style.setProperty("font-weight", "900", "important");
        score.style.setProperty("line-height", "1", "important");
        score.style.setProperty("color", "#020617", "important");
        score.style.setProperty("margin", "0", "important");
        score.style.setProperty("letter-spacing", "-2px", "important");
        score.style.setProperty("display", "block", "important");
        score.style.setProperty("text-align", "center", "important");
    });

    root.querySelectorAll(".pdf-score-label").forEach(el => {
        const label = el as HTMLElement;
        label.style.setProperty("font-size", "14px", "important");
        label.style.setProperty("font-weight", "900", "important");
        label.style.setProperty("letter-spacing", "0.3em", "important");
        label.style.setProperty("color", "#64748b", "important");
        label.style.setProperty("margin-top", "24px", "important");
        label.style.setProperty("display", "block", "important");
        label.style.setProperty("text-align", "center", "important");
    });

    // Handle small score circles in lists
    root.querySelectorAll(".rounded-full.w-12.h-12").forEach(el => {
        const circle = el as HTMLElement;
        circle.style.width = "48px";
        circle.style.height = "48px";
        circle.style.lineHeight = "48px";
        circle.style.textAlign = "center";
        circle.style.fontWeight = "700";
    });
};

export const fixProgressBars = (root: HTMLElement) => {
    root.querySelectorAll(".h-1\\.5, .h-2, .h-3, .h-4, [role='progressbar']").forEach((container) => {
        const containerEl = container as HTMLElement;
        if (!containerEl.classList.contains("rounded-full")) return;

        // Force container to be a stable relative base
        containerEl.style.setProperty("background-color", PDF_COLORS.background.slate200, "important");
        containerEl.style.setProperty("height", "12px", "important"); // Thicker for better visibility
        containerEl.style.setProperty("width", "100%", "important");
        containerEl.style.setProperty("border-radius", "6px", "important");
        containerEl.style.setProperty("overflow", "hidden", "important");
        containerEl.style.setProperty("margin-top", "12px", "important");
        containerEl.style.setProperty("position", "relative", "important");
        containerEl.style.setProperty("padding", "0", "important");
        containerEl.style.setProperty("display", "block", "important");

        const bar = containerEl.querySelector("div") as HTMLElement;
        if (bar) {
            bar.style.setProperty("height", "100%", "important");
            bar.style.setProperty("border-radius", "0", "important"); // NEW: Remove inner radius, let container clip it
            bar.style.setProperty("position", "absolute", "important");
            bar.style.setProperty("left", "0", "important");
            bar.style.setProperty("top", "0", "important");
            bar.style.setProperty("margin", "0", "important");
            bar.style.setProperty("transform", "none", "important");
            
            const classes = bar.className || "";
            if (classes.includes("green") || classes.includes("emerald") || classes.includes("success")) {
                bar.style.setProperty("background-color", PDF_COLORS.status.successBright, "important");
            } else if (classes.includes("amber") || classes.includes("yellow") || classes.includes("warning")) {
                bar.style.setProperty("background-color", PDF_COLORS.status.warningBright, "important");
            } else if (classes.includes("red") || classes.includes("destructive")) {
                bar.style.setProperty("background-color", PDF_COLORS.status.destructiveBright, "important");
            } else {
                bar.style.setProperty("background-color", PDF_COLORS.primary, "important");
            }
        }
    });
};

export const styleBadges = (root: HTMLElement) => {
    // Status text in bars (like FAILED or Test Iteration #)
    root.querySelectorAll("[class*='tracking-widest'], [class*='tracking-tighter']").forEach(el => {
        const span = el as HTMLElement;
        span.style.setProperty("font-size", "14px", "important"); // Reduced from 24px
        span.style.setProperty("font-weight", "900", "important");
        span.style.setProperty("line-height", "1", "important");
        span.style.setProperty("display", "inline-flex", "important");
        span.style.setProperty("align-items", "center", "important");
        span.style.setProperty("height", "auto", "important");
    });

    // Test Iteration # text specifically - MAX AGGRESSION
    root.querySelectorAll("span, div, p").forEach(el => {
        const span = el as HTMLElement;
        const text = (span.textContent || "").toUpperCase();
        if (text.includes("ITERATION") || text.includes("PROMPT #") || text.includes("TEST #")) {
            if (span.children.length > 0) return; // Only target the direct text span
            
            span.style.setProperty("font-size", "24px", "important"); // Reduced to 24px as requested
            span.style.setProperty("font-weight", "900", "important");
            span.style.setProperty("line-height", "1", "important");
            span.style.setProperty("display", "inline-flex", "important");
            span.style.setProperty("align-items", "center", "important");
            span.style.setProperty("margin-top", "-24px", "important"); // Aggressive -24px nudge as demonstrated
            span.style.setProperty("padding-bottom", "0px", "important"); // Reset padding
            span.style.setProperty("color", "#1e293b", "important");
            
            // Fix vertical alignment for the entire header bar
            let current: HTMLElement | null = span;
            while (current && current !== root) {
                if (current.classList.contains("flex") && current.classList.contains("items-center")) {
                    current.style.setProperty("align-items", "center", "important");
                    current.style.setProperty("gap", "12px", "important");
                    current.style.setProperty("padding", "12px 24px", "important");
                    current.style.setProperty("height", "auto", "important");
                    current.style.setProperty("min-height", "60px", "important");
                    
                    // Style the icon wrapper sibling
                    const iconWrapper = current.querySelector("div");
                    if (iconWrapper) {
                        iconWrapper.style.setProperty("display", "flex", "important");
                        iconWrapper.style.setProperty("align-items", "center", "important");
                        iconWrapper.style.setProperty("justify-content", "center", "important");
                        iconWrapper.style.setProperty("height", "40px", "important"); // Reduced from 60px
                        iconWrapper.style.setProperty("width", "40px", "important"); // Reduced from 60px
                        iconWrapper.style.setProperty("border-radius", "50%", "important");
                        
                        const svg = iconWrapper.querySelector("svg");
                        if (svg) {
                            svg.style.setProperty("width", "24px", "important"); // Reduced from 40px
                            svg.style.setProperty("height", "24px", "important"); // Reduced from 40px
                        }
                    }
                    break;
                }
                current = current.parentElement;
            }
        }
    });

    root.querySelectorAll(".rounded-lg.text-sm.font-semibold, .inline-flex.rounded-lg, .rounded-md.text-\\[10px\\], .pdf-badge, .rounded-xl:not(.w-12)").forEach(el => {
        const badge = el as HTMLElement;
        badge.style.setProperty("display", "inline-flex", "important");
        badge.style.setProperty("align-items", "center", "important");
        badge.style.setProperty("justify-content", "center", "important");
        badge.style.setProperty("padding", "6px 12px 8px 12px", "important"); 
        badge.style.setProperty("border-radius", "8px", "important");
        badge.style.setProperty("font-weight", "900", "important");
        badge.style.setProperty("font-size", "12px", "important"); 
        badge.style.setProperty("text-transform", "uppercase", "important");
        badge.style.setProperty("line-height", "1", "important");
    });
};

export const styleIcons = (root: HTMLElement) => {
    root.querySelectorAll("svg.pdf-icon, .pdf-icon svg, svg[data-pdf-icon]").forEach(svg => {
        const el = svg as unknown as HTMLElement;
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.flexShrink = "0";
    });
};

export const styleMutedBackgrounds = (root: HTMLElement) => {
    root.querySelectorAll(".bg-secondary\\/10, .bg-secondary\\/20").forEach(el => {
        const elem = el as HTMLElement;
        elem.style.backgroundColor = PDF_COLORS.background.muted;
        elem.style.border = `1px solid ${PDF_COLORS.border.default}`;
        elem.style.borderRadius = "8px";
    });
};

export const styleUploadInfo = (root: HTMLElement) => { /* Logic integrated into styleCards */ };
export const styleAnalysisParams = (root: HTMLElement) => {
    // 1. Force consistent padding below all labels in the configuration section
    const configCard = Array.from(root.querySelectorAll("h3"))
        .find((h) => h.textContent?.includes("Assessment Configuration"))
        ?.closest(".bg-card, .rounded-2xl") as HTMLElement | null;
    const configLabels = configCard?.querySelectorAll(".grid .text-xs.font-bold, .grid .text-\\[10px\\]") ?? [];

    configLabels.forEach((el) => {
        const label = el as HTMLElement;
        label.style.setProperty("margin-bottom", "12px", "important");
        label.style.setProperty("display", "block", "important");
        label.style.setProperty("font-weight", "800", "important");
        label.style.setProperty("color", "#475569", "important");
    });

    // 2. Remove the 'box inside a box' for the REDACTED key
    root.querySelectorAll(".ml-2.text-\\[10px\\].font-mono.border, .ml-2.text-\\[10px\\].font-mono").forEach(el => {
        const span = el as HTMLElement;
        const text = span.textContent || "";
        if (text.includes("KEY:")) {
            span.style.setProperty("background", "transparent", "important");
            span.style.setProperty("border", "none", "important");
            span.style.setProperty("padding", "0", "important");
            span.style.setProperty("margin-left", "8px", "important");
            span.style.setProperty("color", "#64748b", "important");
            span.style.setProperty("box-shadow", "none", "important");
        }
    });
};
export const styleScoreBadges = (root: HTMLElement) => { /* Logic integrated into styleCards */ };
