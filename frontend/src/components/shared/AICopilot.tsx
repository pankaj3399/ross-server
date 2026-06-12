"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconMessageChatbot,
  IconX,
  IconSend2,
  IconRobot,
} from "@tabler/icons-react";
import { apiService } from "@/lib/api";
import "./AICopilot.css";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

// ─── Starter Prompts ────────────────────────────────────────────────────────

const GENERIC_STARTER_PROMPTS = [
  "What does this control mean for my company?",
  "We have SOC 2 — what do I still need?",
  "Help me write my implementation notes",
  "How do I run a vulnerability scan?",
];

const PROJECT_STARTER_PROMPTS = [
  "What is my current CRC readiness?",
  "What are my open critical and high risks?",
  "What components do I have in my inventory?",
  "We have SOC 2 — what do I still need?",
];

// ─── Simple Markdown Renderer ───────────────────────────────────────────────

function renderMarkdown(text: string): string {
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Numbered lists
    .replace(/^(\d+)\.\s+(.*)$/gm, "<li>$2</li>")
    // Bullet lists
    .replace(/^[-•]\s+(.*)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(
    /(<li>[\s\S]*?<\/li>\n?)+/g,
    (match) => `<ul>${match}</ul>`
  );

  // Paragraphs — split by double newlines
  html = html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (
        block.startsWith("<ul>") ||
        block.startsWith("<ol>") ||
        block.startsWith("<li>")
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  return html;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showIntroPulse, setShowIntroPulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ─── Context Awareness ──────────────────────────────────────────────────

  const crcContext = useMemo(() => {
    // Check if user is on a CRC control page: /assess/[projectId]/crc?controlId=xxx
    if (!pathname?.includes("/crc")) return null;

    const controlId = searchParams?.get("controlId");
    if (!controlId) return null;

    return { controlId };
  }, [pathname, searchParams]);

  const projectContext = useMemo(() => {
    // Extract project UUID from URL path if present (e.g. /assess/[projectId]/...)
    const match = pathname?.match(/\/assess\/([a-f0-9-]{36})/i);
    return match ? { projectId: match[1] } : null;
  }, [pathname]);

  const starterPrompts = useMemo(() => {
    return projectContext ? PROJECT_STARTER_PROMPTS : GENERIC_STARTER_PROMPTS;
  }, [projectContext]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // ─── Auto-resize textarea ──────────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "38px";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  // ─── Focus textarea when panel opens ───────────────────────────────────

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to let the animation play
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Remove intro pulse after it plays
  useEffect(() => {
    const timer = setTimeout(() => setShowIntroPulse(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Send Message ─────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: content.trim(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      try {
        // Build the messages payload (strip local IDs and error flags)
        const apiMessages = updatedMessages
          .filter((m) => !m.isError)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await apiService.sendChatMessage({
          messages: apiMessages,
          controlId: crcContext?.controlId || undefined,
          projectId: projectContext?.projectId || undefined,
        });

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: response.reply,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Show unread dot if panel is closed
        if (!isOpen) {
          setHasUnread(true);
        }
      } catch (error: any) {
        const errorText =
          error?.message || "Something went wrong. Please try again.";
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: errorText,
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, crcContext, projectContext, isOpen]
  );

  // ─── Handle Submit ────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ─── Toggle Panel ────────────────────────────────────────────────────

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setHasUnread(false);
      }
      return !prev;
    });
    setShowIntroPulse(false);
  }, []);

  // ─── Starter Click ───────────────────────────────────────────────────

  const handleStarterClick = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={togglePanel}
        className={`copilot-trigger ${showIntroPulse ? "intro-pulse" : ""}`}
        aria-label={isOpen ? "Close Mira" : "Open Mira"}
        id="ai-copilot-trigger"
      >
        {isOpen ? (
          <IconX size={22} strokeWidth={2.5} />
        ) : (
          <IconMessageChatbot size={24} strokeWidth={2} />
        )}
        {hasUnread && !isOpen && <span className="unread-dot" />}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="copilot-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            id="ai-copilot-panel"
          >
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-header-left">
                <div className="copilot-header-icon">
                  <IconRobot size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="copilot-header-title">Mira</div>
                  <div className="copilot-header-subtitle">
                    {crcContext ? (
                      <span className="copilot-context-badge">
                        📍 Control context active
                      </span>
                    ) : projectContext ? (
                      <span
                        className="copilot-context-badge"
                        style={{
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          color: "#818cf8",
                        }}
                      >
                        📍 Project context active
                      </span>
                    ) : (
                      "AI governance assistant"
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="copilot-close-btn"
                onClick={togglePanel}
                aria-label="Close Mira"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Messages or Starters */}
            {messages.length === 0 && !isLoading ? (
              <div className="copilot-starters">
                <div className="copilot-starters-title">
                  👋 How can I help?
                </div>
                <div className="copilot-starters-sub">
                  {projectContext
                    ? "Ask me about AI compliance, your CRC progress, your Risk Register, and more."
                    : "Ask me about AI compliance, CRC controls, or the MATUR.ai platform."}
                </div>
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="copilot-starter-btn"
                    onClick={() => handleStarterClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="copilot-messages"
                ref={messagesContainerRef}
                aria-live="polite"
                aria-atomic="true"
                role="log"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`copilot-msg ${
                      msg.isError
                        ? "copilot-msg-error"
                        : msg.role === "user"
                        ? "copilot-msg-user"
                        : "copilot-msg-assistant"
                    }`}
                  >
                    {msg.role === "assistant" && !msg.isError ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(msg.content),
                        }}
                      />
                    ) : (
                      msg.content
                    )}
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="copilot-typing">
                    <div className="copilot-typing-dot" />
                    <div className="copilot-typing-dot" />
                    <div className="copilot-typing-dot" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area */}
            <div className="copilot-input-area">
              <textarea
                ref={textareaRef}
                className="copilot-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Mira about AI compliance..."
                rows={1}
                maxLength={2000}
                disabled={isLoading}
              />
              <button
                type="button"
                className="copilot-send-btn"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <IconSend2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
