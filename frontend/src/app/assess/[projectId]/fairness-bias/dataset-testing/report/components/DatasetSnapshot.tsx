import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PreviewData } from "../../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const DatasetSnapshot = ({ preview }: { preview: PreviewData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 50;
    const totalPages = Math.ceil(preview.rows.length / PAGE_SIZE);

    return (
        <Card className="page-break-avoid">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-[#64748b] dark:text-muted-foreground">Dataset Snapshot</p>
                        <CardTitle className="text-lg">Dataset Content</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        {preview.rows.length} total rows • {preview.headers.length} columns
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr>
                                {preview.headers.map((header, headerIndex) => (
                                    <th key={`${headerIndex}-${header}`} className="text-left px-4 py-3 bg-[#f1f5f9] dark:bg-muted text-[#64748b] dark:text-muted-foreground font-medium whitespace-nowrap">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {preview.rows
                                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                                .map((row: any, rowIndex) => {
                                    // Handle rows whether they are arrays (frontend processed) or objects (backend processed)
                                    const cells = Array.isArray(row)
                                        ? row
                                        : preview.headers.map(h => row[h]);

                                    return (
                                        <tr key={rowIndex} className="border-t border-border">
                                            {cells.map((value: any, colIndex: number) => (
                                                <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2 text-foreground whitespace-nowrap">
                                                    {(value === null || value === undefined || value === '') ? <span className="text-[#64748b] dark:text-muted-foreground italic">—</span> : value}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
                {preview.rows.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t border-border pt-4" data-html2canvas-ignore="true">
                        <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, preview.rows.length)} of {preview.rows.length} rows
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <span className="text-sm font-medium text-foreground px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
