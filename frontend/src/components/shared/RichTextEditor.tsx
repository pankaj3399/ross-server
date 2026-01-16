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
          color: rgb(17 24 39);
        }
        .dark .rich-text-editor-wrapper .ql-editor {
          color: rgb(243 244 246);
        }
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: rgb(229 231 235);
        }
        .dark .rich-text-editor-wrapper .ql-toolbar {
          border-color: rgb(75 85 99);
          background-color: rgb(55 65 81);
        }
        .dark .rich-text-editor-wrapper .ql-stroke {
          stroke: rgb(209 213 219);
        }
        .dark .rich-text-editor-wrapper .ql-fill {
          fill: rgb(209 213 219);
        }
        .dark .rich-text-editor-wrapper .ql-picker-label {
          color: rgb(209 213 219);
        }
        .rich-text-editor-wrapper .ql-container {
          border-color: rgb(229 231 235);
          background-color: white;
        }
        .dark .rich-text-editor-wrapper .ql-container {
          border-color: rgb(75 85 99);
          background-color: rgb(55 65 81);
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: rgb(156 163 175);
          font-style: normal;
        }
        .dark .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: rgb(107 114 128);
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
