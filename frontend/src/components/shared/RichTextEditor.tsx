"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const normalizeValueForQuill = (value: string): string => {
  if (!value) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }
  return `<p>${value.replace(/\n/g, "<br>")}</p>`;
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text here...",
  className = "",
  rows = 4,
  disabled = false,
}) => {
  const normalizedValue = useMemo(() => normalizeValueForQuill(value || ""), [value]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    [],
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "link",
  ];

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-container {
          font-family: inherit;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${rows * 1.5}rem;
          color: var(--foreground);
        }
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: var(--border);
          background-color: var(--muted);
        }
        .rich-text-editor-wrapper .ql-stroke {
          stroke: var(--muted-foreground);
        }
        .rich-text-editor-wrapper .ql-fill {
          fill: var(--muted-foreground);
        }
        .rich-text-editor-wrapper .ql-picker-label {
          color: var(--muted-foreground);
        }
        .rich-text-editor-wrapper .ql-container {
          border-color: var(--border);
          background-color: var(--card);
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: var(--muted-foreground);
          font-style: normal;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={normalizedValue}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        className="rich-text-editor"
      />
    </div>
  );
};
