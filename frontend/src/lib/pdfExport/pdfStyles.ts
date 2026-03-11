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
        // Clean white background for the content area
        headerEl.style.setProperty("background-color", "#ffffff", "important");
        headerEl.style.setProperty("padding", "40px 48px", "important");
        headerEl.style.marginBottom = "32px";
        headerEl.style.textAlign = "left";
        headerEl.style.borderBottom = `1px solid ${PDF_COLORS.border.default}`;
        
        // Target the outermost row and make it a simple container
        const outerRow = headerEl.querySelector(".flex.items-center.gap-4");
        if (outerRow) {
            (outerRow as HTMLElement).style.setProperty("display", "block", "important");
            (outerRow as HTMLElement).style.setProperty("width", "100%", "important");
        }

        const h1 = headerEl.querySelector("h1");
        if (h1 && h1.parentElement) {
            const wrapper = h1.parentElement as HTMLElement;
            // This is the CRITICAL container that needs to stack H1 and the URL div
            wrapper.style.setProperty("display", "flex", "important");
            wrapper.style.setProperty("flex-direction", "column", "important");
            wrapper.style.setProperty("align-items", "flex-start", "important");
            wrapper.style.setProperty("justify-content", "flex-start", "important");
            wrapper.style.setProperty("gap", "28px", "important"); // Increased gap between Title and URL
            wrapper.style.setProperty("width", "100%", "important");
            
            // Header Title (H1) styling
            h1.style.setProperty("font-size", "32px", "important");
            h1.style.setProperty("font-weight", "800", "important");
            h1.style.setProperty("color", "#0f172a", "important");
            h1.style.setProperty("margin", "-14px 0 0 0", "important");
            // Header Title (H1) styling - Clean alignment
            h1.style.setProperty("font-size", "34px", "important");
            h1.style.setProperty("font-weight", "800", "important");
            h1.style.setProperty("color", "#0f172a", "important");
            h1.style.setProperty("margin", "-14px 0 0 0", "important"); // Preserve user's top position
            h1.style.setProperty("display", "flex", "important");
            h1.style.setProperty("align-items", "center", "important");
            h1.style.setProperty("gap", "14px", "important");
            h1.style.setProperty("line-height", "1.2", "important");
            h1.style.setProperty("transform", "none", "important");
            
            // Icon in H1 - Perfectly centered
            h1.querySelectorAll("svg, .lucide").forEach(icon => {
                const iconEl = icon as HTMLElement;
                iconEl.style.setProperty("display", "inline-block", "important");
                iconEl.style.setProperty("width", "30px", "important");
                iconEl.style.setProperty("height", "30px", "important");
                iconEl.style.setProperty("color", "#3b82f6", "important");
                iconEl.style.setProperty("margin", "0", "important");
                iconEl.style.setProperty("transform", "none", "important");
                iconEl.style.setProperty("flex-shrink", "0", "important");
                // User requested: Don't bring icons down
                iconEl.style.setProperty("margin-top", "0", "important");
            });

            // Move the text UP by translate as requested
            h1.querySelectorAll("span").forEach(span => {
                span.style.setProperty("display", "inline-block", "important");
                span.style.setProperty("margin", "0", "important");
                span.style.setProperty("padding", "0", "important");
                span.style.setProperty("line-height", "1", "important");
                span.style.setProperty("transform", "translateY(-14px)", "important"); // Text nudge up
            });
        }
        
        // Select the URL metadata div
        const urlContainer = headerEl.querySelector(".text-muted-foreground");
        if (urlContainer) {
            const urlEl = urlContainer as HTMLElement;
            urlEl.style.setProperty("display", "flex", "important");
            urlEl.style.setProperty("align-items", "center", "important");
            urlEl.style.setProperty("gap", "10px", "important");
            urlEl.style.setProperty("color", "#64748b", "important");
            urlEl.style.setProperty("font-size", "15px", "important");
            urlEl.style.setProperty("margin", "0", "important");
            urlEl.style.setProperty("font-weight", "500", "important");
            urlEl.style.setProperty("line-height", "1", "important");
            urlEl.style.setProperty("margin-left", "44px", "important"); // Shift right to align with 'Security'
            urlEl.style.setProperty("transform", "none", "important"); // Reset container transform

            // PURGE the URL icon completely as requested
            urlEl.querySelectorAll("svg, .lucide").forEach(icon => {
                icon.remove();
            });

            // Move the URL text UP
            urlEl.querySelectorAll("span").forEach(span => {
                const s = span as HTMLElement;
                // Since icon is removed, we can keep the span flex or inline-block
                s.style.setProperty("display", "inline-block", "important");
                s.style.setProperty("transform", "translateY(-4px)", "important");
            });
        }

        // Force remove specific items: Back area dividers, generic buttons, etc.
        headerEl.querySelectorAll(".h-6.w-px, .hide-in-pdf, button").forEach(el => {
            el.remove();
        });
        
        // Remove any border and background that might have been applied to header wrapper
        headerEl.style.setProperty("border", "none", "important");
        headerEl.style.setProperty("box-shadow", "none", "important");
        headerEl.style.setProperty("background", "transparent", "important");
        headerEl.style.setProperty("border-bottom", `1px solid ${PDF_COLORS.border.default}`, "important");
        headerEl.style.setProperty("border-radius", "0", "important");
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
        
        if (classes.includes("rounded-3xl")) {
            elem.style.borderRadius = "24px";
            elem.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.05)";
            elem.style.padding = "32px"; // Increased from 24
        } else {
            elem.style.borderRadius = "16px";
            elem.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
            elem.style.padding = "24px"; // Increased from 20
        }
    });
};

export const styleSectionCards = (root: HTMLElement) => {
    root.querySelectorAll("section.space-y-8, section.space-y-6, .max-w-7xl > .space-y-8, .space-y-6, .space-y-4").forEach((el) => {
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

    applyColors("[class*='bg-green-50'], [class*='bg-success'], [class*='bg-emerald-50']", PDF_COLORS.background.green50, PDF_COLORS.border.green, PDF_COLORS.status.success);
    applyColors("[class*='bg-amber-50'], [class*='bg-warning'], [class*='bg-yellow-50']", PDF_COLORS.background.amber50, PDF_COLORS.border.amber, PDF_COLORS.status.warning);
    applyColors("[class*='bg-red-50'], [class*='bg-destructive'], [class*='bg-rose-50']", PDF_COLORS.background.red50, PDF_COLORS.border.red, PDF_COLORS.status.destructive);

    root.querySelectorAll("[class*='text-green'], [class*='text-emerald']").forEach(el => { (el as HTMLElement).style.color = PDF_COLORS.status.success; });
    root.querySelectorAll("[class*='text-amber'], [class*='text-yellow']").forEach(el => { (el as HTMLElement).style.color = PDF_COLORS.status.warning; });
    root.querySelectorAll("[class*='text-red'], [class*='text-rose']").forEach(el => { (el as HTMLElement).style.color = PDF_COLORS.status.destructive; });
};

export const styleTypography = (root: HTMLElement) => {
    root.querySelectorAll("h1, h2, h3, h4").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.fontWeight = "700";
        elem.style.color = PDF_COLORS.text.foreground;
        elem.style.lineHeight = "1.4"; // Increased from 1.3
        elem.style.margin = "16px 0 24px 0"; // Increased margins back
        elem.style.display = "block";
    });

    // Handle small labels (often used above input/data boxes)
    root.querySelectorAll(".text-\\[10px\\]:not(.rounded-md):not(.rounded-full):not(.pdf-badge), label").forEach((el) => {
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
        
        if (hasIcon || isHeader) {
            container.style.setProperty("min-height", "32px", "important");
            
            // For headers and icon rows, nudge icons and text differently
            container.childNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const child = node as HTMLElement;
                    const isIcon = child.querySelector("svg") || child.tagName === "SVG" || child.classList.contains("lucide");
                    
                    if (isIcon) {
                        // Icons are floating too high, pull them DOWN
                        child.style.setProperty("margin-top", "0px", "important"); 
                        child.style.setProperty("margin-bottom", "0px", "important");
                        child.style.setProperty("vertical-align", "middle", "important");
                    } else {
                        // Text is too low relative to icons, pull it UP aggressively
                        // Using multiple properties to force the renderer's hand
                        child.style.setProperty("display", "inline-block", "important");
                        child.style.setProperty("margin-top", "0px", "important"); // Extreme nudge
                        child.style.setProperty("transform", "translateY(-4px)", "important"); // Layered nudge
                        child.style.setProperty("padding-bottom", "12px", "important");
                        child.style.setProperty("line-height", "1", "important");
                    }
                    
                    child.style.setProperty("display", "inline-flex", "important");
                    child.style.setProperty("align-items", "center", "important");
                }
            });
        }
    });

    root.querySelectorAll("[class*='text-muted'], [class*='text-slate-500'], [class*='text-slate-400']").forEach(el => {
        (el as HTMLElement).style.color = PDF_COLORS.text.muted;
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
        const labels = elem.querySelectorAll(".text-sm, .text-xs");
        labels.forEach(l => {
            const label = l as HTMLElement;
            label.style.fontSize = "14px"; // Increased
            label.style.fontWeight = "800"; // Bolder
            label.style.letterSpacing = "0.05em";
            label.style.color = "#475569";
            label.style.textTransform = "uppercase";
        });
    });
    
    // Specifically target the prompt/reason boxes to be very readable - LOWERCASE & COMPACT
    root.querySelectorAll(".italic.font-mono, .italic.leading-relaxed, .font-medium.leading-relaxed, .bg-slate-50\\/50, .bg-white\\/80").forEach(el => {
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
    root.querySelectorAll(".pdf-overall-score-container, .pdf-percentage-circle").forEach(el => {
        const container = el as HTMLElement;
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.position = "relative";
        
        if (container.classList.contains("pdf-overall-score-container")) {
            container.style.width = "240px";
            container.style.height = "240px";
            container.style.margin = "0 auto 32px auto";
            
            const value = container.querySelector(".pdf-overall-score-value");
            if (value) (value as HTMLElement).style.fontSize = "64px";
            
            const label = container.querySelector(".pdf-overall-score-label");
            if (label) (label as HTMLElement).style.fontSize = "16px";
        }
    });

    // Handle small score circles
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
    root.querySelectorAll(".h-1\\.5, .h-2, .h-3, [role='progressbar']").forEach((container) => {
        const containerEl = container as HTMLElement;
        if (!containerEl.classList.contains("rounded-full")) return;

        // Force container to be a stable relative base
        containerEl.style.setProperty("background-color", PDF_COLORS.background.slate200, "important");
        containerEl.style.setProperty("height", "6px", "important");
        containerEl.style.setProperty("width", "100%", "important");
        containerEl.style.setProperty("border-radius", "20px", "important");
        containerEl.style.setProperty("overflow", "hidden", "important");
        containerEl.style.setProperty("margin-top", "8px", "important");
        containerEl.style.setProperty("position", "relative", "important");
        containerEl.style.setProperty("padding", "0", "important");
        containerEl.style.setProperty("display", "block", "important"); // Switch from flex to block for absolute child

        const bar = containerEl.querySelector("div") as HTMLElement;
        if (bar) {
            bar.style.setProperty("height", "100%", "important");
            bar.style.setProperty("border-radius", "20px", "important");
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

    root.querySelectorAll(".rounded-lg.text-sm.font-semibold, .inline-flex.rounded-lg, .rounded-md.text-\\[10px\\], .pdf-badge").forEach(el => {
        const badge = el as HTMLElement;
        badge.style.setProperty("display", "inline-flex", "important");
        badge.style.setProperty("align-items", "center", "important");
        badge.style.setProperty("justify-content", "center", "important");
        badge.style.setProperty("padding", "6px 16px 10px 16px", "important"); // Stronger bottom padding for centering
        badge.style.setProperty("border-radius", "8px", "important");
        badge.style.setProperty("font-weight", "800", "important");
        badge.style.setProperty("font-size", "16px", "important"); 
        badge.style.setProperty("text-transform", "uppercase", "important");
    });
};

export const styleIcons = (root: HTMLElement) => {
    root.querySelectorAll("svg").forEach(svg => {
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
