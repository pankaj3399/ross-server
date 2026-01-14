import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PreviewData } from "../../types";

export const DatasetSnapshot = ({ preview }: { preview: PreviewData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    return (
        <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 space-y-4 page-break-avoid">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Dataset Snapshot</p>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Dataset Content</h4>
                </div>
                <p className="text-xs text-slate-500">
                    {preview.rows.length} total rows • {preview.headers.length} columns
                </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            {preview.headers.map((header, headerIndex) => (
                                <th key={`${headerIndex}-${header}`} className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {preview.rows
                            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                            .map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t border-slate-100 dark:border-gray-800">
                                    {row.map((value, colIndex) => (
                                        <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2 text-slate-800 dark:text-slate-100 whitespace-nowrap">
                                            {(value === null || value === undefined || value === '') ? <span className="text-slate-400 italic">—</span> : value}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            {preview.rows.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-800 pt-4" data-html2canvas-ignore="true">
                    <p className="text-sm text-slate-500">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, preview.rows.length)} of {preview.rows.length} rows
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="text-sm font-medium text-slate-900 dark:text-white px-2">
                            Page {currentPage} of {Math.ceil(preview.rows.length / PAGE_SIZE)}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(preview.rows.length / PAGE_SIZE), p + 1))}
                            disabled={currentPage >= Math.ceil(preview.rows.length / PAGE_SIZE)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};
