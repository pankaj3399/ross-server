"use client";



import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconCopy,
    IconDownload, IconChevronDown, IconChevronRight, IconArrowLeft,
    IconCheck, IconX, IconHistory, IconEye, IconArchive, IconSend,
    IconUpload
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { apiService, type CRCControlStatus } from "@/lib/api";

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/shared/RichTextEditor").then(mod => mod.RichTextEditor), {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
});

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Draft", "In Review", "Published", "Archived"];

// --- Sample Data for Bulk Upload ---

const SAMPLE_CSV = `control_id,control_title,category,priority,control_statement
CRC-001,AI System Accountability,Governance,High,Establish clear lines of responsibility for AI system development and deployment.
CRC-002,Data Quality Standards,Data Quality,Medium,Implement rigorous data validation and cleansing processes.
CRC-003,Model Transparency,Transparency,Low,Provide clear documentation of model architecture and training data.`;

const SAMPLE_JSON = [
    {
        control_id: "CRC-001",
        control_title: "AI System Accountability",
        category: "Governance",
        priority: "High",
        control_statement: "Establish clear lines of responsibility for AI system development and deployment."
    },
    {
        control_id: "CRC-002",
        control_title: "Data Quality Standards",
        category: "Data Quality",
        priority: "Medium",
        control_statement: "Implement rigorous data validation and cleansing processes."
    }
];

const SAMPLE_TEXT = `How is human oversight maintained for the AI model?
What data encryption standards are used for stored PII?
Is there a clear incident response plan for AI failures?`;

// --- Interfaces ---

interface Implementation {
    requirements: string[];
    steps: string[];
}

interface ComplianceMappingItem {
    ref: string;
    context: string;
}

interface ComplianceMapping {
    eu_ai_act: ComplianceMappingItem[];
    nist_ai_rmf: ComplianceMappingItem[];
    iso_42001: ComplianceMappingItem[];
}

interface AimaMapping {
    domain: string;
    area: string;
    maturity_enhancement: string;
}

interface Control {
    id: string;
    control_id: string;
    control_title: string;
    category_id: number;
    category_name: string;
    priority: string;
    status: CRCControlStatus;
    version: number;
    applicable_to: string[];
    expected_timeline: string;
    control_statement: string;
    control_objective: string;
    risk_description: string;
    implementation: Implementation;
    evidence_requirements: string[];
    compliance_mapping: ComplianceMapping;
    aima_mapping: AimaMapping;
    created_at: string;
    updated_at: string;
}

interface ControlVersion {
    id: string;
    version: number;
    status_from: string;
    status_to: string;
    change_note: string;
    changed_by_name: string;
    created_at: string;
}

// --- Helper Components ---

const Section = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border rounded-md mb-4 bg-card">
            <button
                type="button"
                className="flex w-full items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors text-left"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h3 className="font-medium text-lg">{title}</h3>
                {isOpen ? <IconChevronDown className="size-5" /> : <IconChevronRight className="size-5" />}
            </button>
            {isOpen && <div className="p-4 border-t">{children}</div>}
        </div>
    );
};

interface RepeatableFieldProps {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    type?: "text" | "textarea";
}

const RepeatableField = ({ items, onChange, placeholder = "Enter item...", min = 0, max = 10, type = "text" }: RepeatableFieldProps) => {
    const addItem = () => {
        if (items.length < max) {
            onChange([...items, ""]);
        }
    };

    const updateItem = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        onChange(newItems);
    };

    const removeItem = (index: number) => {
        if (items.length > min) {
            onChange(items.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                    {type === "textarea" ? (
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={placeholder}
                        />
                    ) : (
                        <Input
                            id={`item-${index}`}
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={placeholder}
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= min}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove item ${index + 1}`}
                    >
                        <IconX className="size-4" />
                    </Button>
                </div>
            ))}
            {items.length < max && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="mt-2"
                >
                    <IconPlus className="size-4 mr-2" /> Add Item
                </Button>
            )}
        </div>
    );
};

interface PairedRepeatableFieldProps {
    items: ComplianceMappingItem[];
    onChange: (items: ComplianceMappingItem[]) => void;
    label1: string;
    label2: string;
}

const PairedRepeatableField = ({ items, onChange, label1, label2 }: PairedRepeatableFieldProps) => {
    const addItem = () => onChange([...items, { ref: "", context: "" }]);

    const updateItem = (index: number, field: keyof ComplianceMappingItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start border p-3 rounded-md bg-muted/20">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                            <label htmlFor={`ref-${index}`} className="text-xs font-medium mb-1 block">{label1}</label>
                            <Input
                                id={`ref-${index}`}
                                value={item.ref}
                                onChange={(e) => updateItem(index, "ref", e.target.value)}
                                placeholder="e.g. Article 12(1)"
                            />
                        </div>
                        <div>
                            <label htmlFor={`context-${index}`} className="text-xs font-medium mb-1 block">{label2}</label>
                            <Input
                                id={`context-${index}`}
                                value={item.context}
                                onChange={(e) => updateItem(index, "context", e.target.value)}
                                placeholder="Context description..."
                            />
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="mt-6 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove mapping ${index + 1}`}
                    >
                        <IconTrash className="size-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <IconPlus className="size-4 mr-2" /> Add Mapping
            </Button>
        </div>
    );
};

// --- Main Page Component ---

export default function CRCAdminPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"list" | "form">("list");
    const [loading, setLoading] = useState(true);
    const [controls, setControls] = useState<Control[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedControlId, setSelectedControlId] = useState<string | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form State
    const defaultControlState: Partial<Control> = {
        category_id: undefined,
        expected_timeline: "",
        priority: "",
        status: "Draft",
        applicable_to: [],
        implementation: { requirements: [""], steps: [""] },
        evidence_requirements: [""],
        compliance_mapping: { eu_ai_act: [], nist_ai_rmf: [], iso_42001: [] },
        aima_mapping: { domain: "", area: "", maturity_enhancement: "" },
    };

    const [formData, setFormData] = useState<Partial<Control>>(defaultControlState);
    const [versions, setVersions] = useState<ControlVersion[]>([]);
    const [showTransitionDialog, setShowTransitionDialog] = useState(false);
    const [transitionNote, setTransitionNote] = useState("");
    const [targetStatus, setTargetStatus] = useState<CRCControlStatus | "">("");

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    // Bulk upload state
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [bulkStep, setBulkStep] = useState<"input" | "preview">("input");
    const [bulkInputType, setBulkInputType] = useState<"paste" | "csv" | "json">("paste");
    const [bulkPastedText, setBulkPastedText] = useState("");
    const [bulkPreviewRows, setBulkPreviewRows] = useState<Partial<Control>[]>([]);
    const [bulkErrors, setBulkErrors] = useState<Array<{ index: number; control_id?: string; message: string }>>([]);
    const [bulkEditIndex, setBulkEditIndex] = useState<number | null>(null);
    const [bulkEditFormData, setBulkEditFormData] = useState<Partial<Control>>(defaultControlState);
    const [bulkImporting, setBulkImporting] = useState(false);

    // fetch controls
    const fetchControls = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const api = apiService;
            const params = new URLSearchParams();
            if (categoryFilter !== "all") params.append("category_id", categoryFilter);
            if (priorityFilter !== "all") params.append("priority", priorityFilter);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await api.getCRCControls(params);
            if (signal?.aborted) return;
            setControls(res.data);
        } catch (error) {
            if (signal?.aborted) return;
            toast.error("Failed to fetch controls");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiService.getCRCCategories();
            setCategories(res.data);
        } catch (error) {
            toast.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => fetchControls(controller.signal), searchQuery ? 500 : 0);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [categoryFilter, priorityFilter, statusFilter, searchQuery]);

    const handleCreate = () => {
        setSelectedControlId(null);
        setFormData(defaultControlState);
        setViewMode("form");
    };

    const handleEdit = async (id: string) => {
        try {
            const api = apiService;
            const res = await api.getCRCControl(id);
            setSelectedControlId(id);
            setFormData(res.data);
            setViewMode("form");

            // Fetch versions
            const verRes = await api.getCRCControlVersions(id);
            setVersions(verRes.data);
        } catch (error) {
            toast.error("Failed to fetch control details");
        }
    };

    const handleSave = async () => {
        try {
            // Basic validation
            if (!formData.control_id || !formData.control_title || !formData.category_id || !formData.priority) {
                toast.error("Please fill in all required fields (ID, Title, Category, Priority)");
                return;
            }

            const api = apiService;
            if (selectedControlId) {
                await api.updateCRCControl(selectedControlId, formData);
                toast.success("Control updated successfully");
            } else {
                await api.createCRCControl(formData);
                toast.success("Control created successfully");
            }
            setViewMode("list");
            fetchControls();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save control");
        }
    };

    const handleDelete = (id: string) => {
        setIdToDelete(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            const api = apiService;
            await api.deleteCRCControl(idToDelete);
            toast.success("Control deleted");
            fetchControls();
            setShowDeleteDialog(false);
            setIdToDelete(null);
        } catch (error) {
            toast.error("Failed to delete control");
        }
    };

    const handleClone = async (id: string) => {
        try {
            const api = apiService;
            await api.cloneCRCControl(id);
            toast.success("Control cloned successfully");
            fetchControls();
        } catch (error) {
            toast.error("Failed to clone control");
        }
    };

    const handleTransition = async () => {
        if (!selectedControlId || !targetStatus) return;
        try {
            const api = apiService;
            await api.transitionCRCControl(selectedControlId, { status: targetStatus, note: transitionNote });
            toast.success(`Status updated to ${targetStatus}`);
            setShowTransitionDialog(false);
            setTransitionNote("");
            handleEdit(selectedControlId); // Refresh form data
        } catch (error: any) {
            toast.error(error.message || "Transition failed");
        }
    };

    const openTransitionDialog = (status: CRCControlStatus) => {
        setTargetStatus(status);
        setShowTransitionDialog(true);
    };

    const handleExport = async (format: "json" | "csv") => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one control to export");
            return;
        }
        try {
            const blob = await apiService.exportControls(selectedIds, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `crc_controls_export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Export failed");
        }
    };

    const openBulkDialog = () => {
        setShowBulkDialog(true);
        setBulkStep("input");
        setBulkInputType("paste");
        setBulkPastedText("");
        setBulkPreviewRows([]);
        setBulkErrors([]);
        setBulkEditIndex(null);
    };

    const parseBulkFromPaste = (): Partial<Control>[] => {
        const lines = bulkPastedText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        return lines.map((line, i) => ({
            ...defaultControlState,
            control_title: line.slice(0, 200),
            control_id: `CRC-BULK-${i + 1}`.slice(0, 20),
            category_id: categories[0]?.id,
            priority: "Medium",
            status: "Draft",
        }));
    };

    /**
     * Full CSV parser: handles quoted fields, doubled-quote escaping ("") and newlines inside quotes.
     * Returns rows and a flag if an unclosed quote was detected (malformed CSV).
     */
    const parseFullCSV = (text: string): { rows: string[][]; unclosedQuote: boolean } => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const next = text[i + 1];
            if (inQuotes) {
                if (c === '"' && next === '"') {
                    current += '"';
                    i++;
                } else if (c === '"') {
                    inQuotes = false;
                } else {
                    current += c;
                }
            } else {
                if (c === '"') {
                    inQuotes = true;
                } else if (c === ",") {
                    currentRow.push(current.trim());
                    current = "";
                } else if (c === "\n" || c === "\r") {
                    if (c === "\r" && next === "\n") i++;
                    currentRow.push(current.trim());
                    if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
                    currentRow = [];
                    current = "";
                } else {
                    current += c;
                }
            }
        }
        currentRow.push(current.trim());
        if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
        return { rows, unclosedQuote: inQuotes };
    };

    const parseBulkFromCSV = (text: string): Partial<Control>[] => {
        const { rows: allRows, unclosedQuote } = parseFullCSV(text);
        if (unclosedQuote) {
            toast.warning("Unclosed quote detected in CSV; results may be incorrect.");
        }
        if (allRows.length < 2) return [];
        const headers = allRows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
        const rows: Partial<Control>[] = [];
        for (let i = 1; i < allRows.length; i++) {
            const values = allRows[i];
            const row: Record<string, string> = {};
            headers.forEach((h, j) => {
                row[h] = (values[j] ?? "").trim();
            });
            const control_id = (row.control_id || `CRC-BULK-${i}`).slice(0, 20);
            const control_title = (row.control_title || row.title || "").slice(0, 200) || control_id;
            
            // Try to match category name or ID
            const catRaw = row.category_id || row.category || "";
            const matchedCat = categories.find(c => 
                c.name.toLowerCase() === catRaw.toLowerCase() || 
                c.id.toString() === catRaw
            );

            rows.push({
                ...defaultControlState,
                control_id,
                control_title,
                category_id: matchedCat?.id,
                priority: (row.priority || "Medium").slice(0, 20),
                control_statement: row.control_statement || row.statement || "",
                status: "Draft",
                expected_timeline: row.expected_timeline || row.timeline || "",
            });
        }
        return rows;
    };

    const parseBulkFromJSON = (text: string): Partial<Control>[] => {
        const raw = JSON.parse(text);
        if (!Array.isArray(raw)) return [];
        return raw.map((item: any, i: number) => {
            const c = item?.control_id;
            return {
                ...defaultControlState,
                control_id: (c || `CRC-BULK-${i + 1}`).toString().slice(0, 20),
                control_title: (item?.control_title ?? item?.title ?? "").toString().slice(0, 200),
                category_id: undefined,
                priority: (item?.priority ?? "Medium").toString().slice(0, 20),
                control_statement: (item?.control_statement ?? item?.statement ?? "").toString(),
                status: "Draft",
                applicable_to: Array.isArray(item?.applicable_to) ? item.applicable_to : [],
                expected_timeline: (item?.expected_timeline ?? "").toString(),
            };
        });
    };

    const handleBulkParse = () => {
        setBulkErrors([]);
        try {
            if (bulkInputType === "paste") {
                const rows = parseBulkFromPaste();
                if (rows.length === 0) {
                    toast.error("Enter at least one line of text (one question per line)");
                    return;
                }
                setBulkPreviewRows(rows);
            } else if (bulkInputType === "csv") {
                if (!bulkPastedText.trim()) {
                    toast.error("Paste CSV content or upload a file first");
                    return;
                }
                const rows = parseBulkFromCSV(bulkPastedText);
                if (rows.length === 0) {
                    toast.error("CSV must have a header row and at least one data row");
                    return;
                }
                setBulkPreviewRows(rows);
            } else {
                if (!bulkPastedText.trim()) {
                    toast.error("Paste JSON array or upload a file first");
                    return;
                }
                const rows = parseBulkFromJSON(bulkPastedText);
                if (rows.length === 0) {
                    toast.error("JSON must be an array of control objects");
                    return;
                }
                setBulkPreviewRows(rows);
            }
            setBulkStep("preview");
        } catch (e: any) {
            toast.error(e?.message || "Failed to parse input");
        }
    };

    const handleDownloadSample = (type: "csv" | "json") => {
        const content = type === "csv" ? SAMPLE_CSV : JSON.stringify(SAMPLE_JSON, null, 2);
        const blob = new Blob([content], { type: type === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crc_sample.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadSampleText = () => {
        setBulkPastedText(SAMPLE_TEXT);
        toast.info("Sample text loaded");
    };

    const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const handleBulkFileUpload = (file: File, type: "csv" | "json") => {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            toast.error("File too large. Maximum size is 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result);
            setBulkPastedText(text);
            setBulkInputType(type);
        };
        reader.onerror = () => {
            toast.error("Failed to read file");
            setBulkPastedText("");
        };
        reader.readAsText(file);
    };

    const handleBulkEditRow = (index: number) => {
        setBulkEditFormData({ ...defaultControlState, ...bulkPreviewRows[index] });
        setBulkEditIndex(index);
    };

    const saveBulkEditRow = () => {
        if (bulkEditIndex === null) return;
        setBulkPreviewRows((prev) => {
            const next = [...prev];
            next[bulkEditIndex] = { ...defaultControlState, ...bulkEditFormData };
            return next;
        });
        setBulkEditIndex(null);
    };

    const removeBulkPreviewRow = (index: number) => {
        setBulkPreviewRows((prev) => prev.filter((_, i) => i !== index));
        setBulkErrors((prev) => prev.filter((e) => e.index !== index).map((e) => ({ ...e, index: e.index > index ? e.index - 1 : e.index })));
    };

    const handleBulkImport = async () => {
        if (bulkPreviewRows.length === 0) return;
        const invalid = bulkPreviewRows.filter((r) => !r.control_id || !r.control_title);
        if (invalid.length > 0) {
            const validationErrors = bulkPreviewRows
                .map((r, idx) => {
                    const missing: string[] = [];
                    if (!r.control_id) missing.push("Control ID");
                    if (!r.control_title) missing.push("Title");
                    return { index: idx, missing };
                })
                .filter((e) => e.missing.length > 0)
                .map((e) => ({ index: e.index, message: `Missing ${e.missing.join(" and ")}` }));
            setBulkErrors(validationErrors);
            toast.error("Some rows are missing Control ID or Title. Edit or remove them and try again.");
            return;
        }
        const categoryPriorityErrors = bulkPreviewRows
            .map((r, idx) => {
                const issues: string[] = [];
                if (r.category_id && !categories.find(c => c.id === r.category_id)) issues.push("Invalid category");
                if (r.priority && !PRIORITIES.includes(r.priority)) issues.push("Invalid priority");
                return issues.length ? { index: idx, message: issues.join(", ") } : null;
            })
            .filter((e): e is { index: number; message: string } => e !== null);
        if (categoryPriorityErrors.length > 0) {
            setBulkErrors(categoryPriorityErrors);
            toast.error("Some rows have invalid category or priority. Use the allowed values.");
            return;
        }
        setBulkImporting(true);
        setBulkErrors([]);
        try {
            const payloads = bulkPreviewRows.map((r) => {
                const catId = r.category_id || categories[0]?.id;
                if (!catId) {
                    throw new Error("No categories available. Please ensure categories are loaded before importing.");
                }
                return {
                    control_id: r.control_id as string,
                    control_title: r.control_title as string,
                    category_id: catId,
                    priority: r.priority && PRIORITIES.includes(r.priority) ? r.priority : "Medium",
                    status: r.status || "Draft",
                    applicable_to: r.applicable_to ?? [],
                    expected_timeline: r.expected_timeline ?? "",
                    control_statement: r.control_statement ?? "",
                    control_objective: r.control_objective ?? "",
                    risk_description: r.risk_description ?? "",
                    implementation: r.implementation ?? { requirements: [], steps: [] },
                    evidence_requirements: r.evidence_requirements ?? [],
                    compliance_mapping: r.compliance_mapping ?? { eu_ai_act: [], nist_ai_rmf: [], iso_42001: [] },
                };
            });

            const { data } = await apiService.createCRCBulk(payloads);
            toast.success(`Created ${data.length} controls. You can edit or delete any control from the list.`);
            setShowBulkDialog(false);
            fetchControls();
        } catch (err: any) {
            if (err?.errors?.length) {
                setBulkErrors(err.errors);
                toast.error(`Import failed: ${err.errors.length} row(s) have errors. Fix or remove them and try again.`);
            } else {
                toast.error(err?.message || "Bulk import failed");
            }
        } finally {
            setBulkImporting(false);
        }
    };

    if (viewMode === "form") {
        return (
            <div className="flex flex-col h-full bg-background p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-background z-10 py-2 border-b">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setViewMode("list")}>
                            <IconArrowLeft className="size-5 mr-2" /> Back
                        </Button>
                        <h1 className="text-2xl font-bold">{selectedControlId ? "Edit Control" : "New Control"}</h1>
                        {selectedControlId && (
                            <Badge variant={
                                formData.status === "Published" ? "default" :
                                    formData.status === "Archived" ? "destructive" : "secondary"
                            }>
                                {formData.status} (v{formData.version})
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {selectedControlId && (
                            <>
                                {formData.status === "Draft" && (
                                    <Button variant="outline" onClick={() => openTransitionDialog("In Review")}>
                                        Submit for Review
                                    </Button>
                                )}
                                {formData.status === "In Review" && (
                                    <>
                                        <Button variant="outline" onClick={() => openTransitionDialog("Draft")}>Return to Draft</Button>
                                        <Button onClick={() => openTransitionDialog("Published")}>Publish</Button>
                                    </>
                                )}
                                {formData.status === "Published" && (
                                    <Button variant="destructive" onClick={() => openTransitionDialog("Archived")}>Archive</Button>
                                )}
                                {formData.status === "Archived" && (
                                    <Button variant="outline" onClick={() => openTransitionDialog("Draft")}>Reactivate to Draft</Button>
                                )}
                            </>
                        )}
                        <Button onClick={handleSave}>Save Control</Button>
                    </div>
                </div>

                <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Transition</DialogTitle>
                            <DialogDescription>
                                Change status to <strong>{targetStatus}</strong>? You can add a note describing this change.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Change Note (Optional)</label>
                                <Input
                                    value={transitionNote}
                                    onChange={(e) => setTransitionNote(e.target.value)}
                                    placeholder="E.g. Approved for release"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTransitionDialog(false)}>Cancel</Button>
                            <Button onClick={handleTransition}>Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid gap-6 max-w-5xl mx-auto w-full pb-20">
                    <Section title="Basic Information" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Control ID *</label>
                                <Input
                                    value={formData.control_id || ""}
                                    onChange={(e) => setFormData({ ...formData, control_id: e.target.value })}
                                    placeholder="e.g. GOV-ACC-01"
                                    maxLength={20}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Control Title *</label>
                                <Input
                                    value={formData.control_title || ""}
                                    onChange={(e) => setFormData({ ...formData, control_title: e.target.value })}
                                    placeholder="e.g. AI System Accountability"
                                    maxLength={200}
                                />
                            </div>
                            <div className="space-y-2">
                                        <label htmlFor="category" className="text-sm font-medium">Category *</label>
                                        <Select
                                            value={formData.category_id?.toString()}
                                            onValueChange={(val) => setFormData({ ...formData, category_id: parseInt(val) })}
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority *</label>
                                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <label className="text-sm font-medium">Applicable To</label>
                            <div className="text-xs text-muted-foreground mb-2">Separate tags with commas (e.g. "General Purpose AI, High Risk AI")</div>
                            <Input
                                value={formData.applicable_to?.join(", ") || ""}
                                onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                placeholder="Tags..."
                            />
                        </div>
                    </Section>

                    <Section title="Control Details" defaultOpen={true}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Control Statement (Rich Text)</label>
                                <RichTextEditor
                                    value={formData.control_statement || ""}
                                    onChange={(val) => setFormData({ ...formData, control_statement: val })}
                                    placeholder="Describe the control..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Control Objective</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.control_objective || ""}
                                    onChange={(e) => setFormData({ ...formData, control_objective: e.target.value })}
                                    placeholder="What is the objective of this control?"
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title="Implementation Guidance">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Requirements</label>
                                <RepeatableField
                                    items={formData.implementation?.requirements || []}
                                    onChange={(items) => setFormData({
                                        ...formData,
                                        implementation: {
                                            requirements: items,
                                            steps: formData.implementation?.steps || [],
                                        }
                                    })}
                                    placeholder="Add requirement..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Implementation Steps</label>
                                <RepeatableField
                                    type="textarea"
                                    items={formData.implementation?.steps || []}
                                    onChange={(items) => setFormData({
                                        ...formData,
                                        implementation: {
                                            requirements: formData.implementation?.requirements || [],
                                            steps: items,
                                        }
                                    })}
                                    placeholder="Add step..."
                                />
                            </div>
                            <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="expected_timeline" className="text-sm font-medium">Expected Timeline</label>
                                        <Input
                                            id="expected_timeline"
                                            value={formData.expected_timeline}
                                            onChange={(e) => setFormData({ ...formData, expected_timeline: e.target.value })}
                                            placeholder="e.g. Short-term (1-3 months)"
                                        />
                                    </div>
                                </div>
                        </div>
                    </Section>

                    <Section title="Evidence & Compliance">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Evidence Requirements</label>
                                <RepeatableField
                                    items={formData.evidence_requirements || []}
                                    onChange={(items) => setFormData({ ...formData, evidence_requirements: items })}
                                    placeholder="Required evidence..."
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold mt-4">EU AI Act Mapping</h4>
                                <PairedRepeatableField
                                    items={formData.compliance_mapping?.eu_ai_act || []}
                                    onChange={(items) => setFormData({
                                        ...formData,
                                        compliance_mapping: {
                                            eu_ai_act: items,
                                            nist_ai_rmf: formData.compliance_mapping?.nist_ai_rmf || [],
                                            iso_42001: formData.compliance_mapping?.iso_42001 || []
                                        }
                                    })}
                                    label1="Reference (Article)"
                                    label2="Context"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold mt-4">NIST AI RMF Mapping</h4>
                                <PairedRepeatableField
                                    items={formData.compliance_mapping?.nist_ai_rmf || []}
                                    onChange={(items) => setFormData({
                                        ...formData,
                                        compliance_mapping: {
                                            eu_ai_act: formData.compliance_mapping?.eu_ai_act || [],
                                            nist_ai_rmf: items,
                                            iso_42001: formData.compliance_mapping?.iso_42001 || []
                                        }
                                    })}
                                    label1="Reference"
                                    label2="Context"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold mt-4">ISO 42001 Mapping</h4>
                                <PairedRepeatableField
                                    items={formData.compliance_mapping?.iso_42001 || []}
                                    onChange={(items) => setFormData({
                                        ...formData,
                                        compliance_mapping: {
                                            eu_ai_act: formData.compliance_mapping?.eu_ai_act || [],
                                            nist_ai_rmf: formData.compliance_mapping?.nist_ai_rmf || [],
                                            iso_42001: items
                                        }
                                    })}
                                    label1="Reference"
                                    label2="Context"
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title="Risk Assessment">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Risk if Not Implemented</label>
                            <RichTextEditor
                                value={formData.risk_description || ""}
                                onChange={(val) => setFormData({ ...formData, risk_description: val })}
                                placeholder="Describe the risks..."
                            />
                        </div>
                    </Section>

                    <Section title="Version History">
                        {versions.length === 0 ? (
                            <div className="text-muted-foreground text-sm italic">No history available</div>
                        ) : (
                            <div className="relative border-l border-muted ml-4 space-y-6 pb-4">
                                {versions.map((ver) => (
                                    <div key={ver.id} className="relative pl-6">
                                        <div className="absolute -left-1.5 top-1.5 size-3 rounded-full bg-primary" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Version {ver.version}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(ver.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium text-foreground">{ver.changed_by_name || "Unknown User"}</span>
                                                {" "}changed status from <Badge variant="outline" className="text-[10px]">{ver.status_from || "None"}</Badge>
                                                {" "}to <Badge variant="outline" className="text-[10px]">{ver.status_to}</Badge>
                                            </div>
                                            {ver.change_note && (
                                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1 italic">
                                                    "{ver.change_note}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                </div>
            </div>
        );
    }

    // --- List View ---
    return (
        <div className="flex flex-col h-full bg-background p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CRC Controls</h1>
                    <p className="text-muted-foreground mt-2">Manage Compliance Readiness Controls and requirements.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={openBulkDialog} size="lg">
                        <IconUpload className="mr-2 size-5" /> Bulk upload
                    </Button>
                    <Button onClick={handleCreate} size="lg">
                        <IconPlus className="mr-2 size-5" /> Create Control
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Actions Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <IconSearch className="size-5 text-muted-foreground" />
                        <Input
                            placeholder="Search controls..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-none shadow-none focus-visible:ring-0 bg-transparent"
                        />
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <IconFilter className="size-4 text-muted-foreground" />
                        <Select
                                            value={categoryFilter}
                                            onValueChange={setCategoryFilter}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-5">
                            <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                                <IconDownload className="mr-2 size-4" /> JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                                <IconDownload className="mr-2 size-4" /> CSV
                            </Button>
                        </div>
                    )}
                </div>

                {/* List Table */}
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={controls.length > 0 && selectedIds.length === controls.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedIds(controls.map(c => c.id));
                                            else setSelectedIds([]);
                                        }}
                                    />
                                </TableHead>
                                <TableHead>Control ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                            ) : controls.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No controls found.</TableCell></TableRow>
                            ) : (
                                controls.map((control) => (
                                    <TableRow key={control.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(control.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedIds([...selectedIds, control.id]);
                                                    else setSelectedIds(selectedIds.filter(id => id !== control.id));
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{control.control_id}</TableCell>
                                        <TableCell>{control.control_title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{control.category_name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                control.priority === "High" ? "bg-destructive/10 text-destructive hover:bg-destructive/20" :
                                                    control.priority === "Medium" ? "bg-warning/10 text-warning hover:bg-warning/20" :
                                                        "bg-success/10 text-success hover:bg-success/20"
                                            }>
                                                {control.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                control.status === "Published" ? "default" :
                                                    control.status === "Archived" ? "destructive" : "outline"
                                            } className={control.status === "Published" ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {control.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(control.id)} aria-label={`Edit ${control.control_id}`}>
                                                    <IconEdit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleClone(control.id)} aria-label={`Clone ${control.control_id}`}>
                                                    <IconCopy className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDelete(control.id)} aria-label={`Delete ${control.control_id}`}>
                                                    <IconTrash className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div >
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this control? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowDeleteDialog(false);
                            setIdToDelete(null);
                        }}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete Control</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showBulkDialog} onOpenChange={(open) => { setShowBulkDialog(open); if (!open) setBulkEditIndex(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bulk upload CRC controls</DialogTitle>
                        <DialogDescription>
                            Paste a list of questions (one per line), or upload CSV/JSON. Then review, edit or remove rows and import.
                        </DialogDescription>
                    </DialogHeader>
                    {bulkStep === "input" ? (
                        <div className="space-y-4 py-4">
                            <Tabs value={bulkInputType} onValueChange={(v) => setBulkInputType(v as "paste" | "csv" | "json")}>
                                <TabsList>
                                    <TabsTrigger value="paste">Paste text</TabsTrigger>
                                    <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                                    <TabsTrigger value="json">Upload JSON</TabsTrigger>
                                </TabsList>
                                <TabsContent value="paste" className="space-y-4 mt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">One question per line. Control ID and category/priority will be auto-filled.</p>
                                        <Button variant="outline" size="sm" onClick={handleLoadSampleText}>
                                            Load Sample Text
                                        </Button>
                                    </div>
                                    <textarea
                                        className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Paste your list of questions here..."
                                        value={bulkPastedText}
                                        onChange={(e) => setBulkPastedText(e.target.value)}
                                    />
                                </TabsContent>
                                <TabsContent value="csv" className="space-y-4 mt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Upload a CSV with headers: control_id, control_title, category, priority (optional columns: control_statement).</p>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadSample("csv")}>
                                            <IconDownload className="mr-2 size-4" /> Download Sample CSV
                                        </Button>
                                    </div>
                                    <Input
                                        type="file"
                                        accept=".csv,.txt"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleBulkFileUpload(f, "csv");
                                            e.target.value = "";
                                        }}
                                    />
                                    {bulkPastedText && (
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                                            value={bulkPastedText}
                                            onChange={(e) => setBulkPastedText(e.target.value)}
                                            placeholder="Or paste CSV content..."
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent value="json" className="space-y-4 mt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Upload a JSON file with an array of objects (control_id, control_title, category, priority, etc.).</p>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadSample("json")}>
                                            <IconDownload className="mr-2 size-4" /> Download Sample JSON
                                        </Button>
                                    </div>
                                    <Input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleBulkFileUpload(f, "json");
                                            e.target.value = "";
                                        }}
                                    />
                                    {bulkPastedText && (
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                                            value={bulkPastedText}
                                            onChange={(e) => setBulkPastedText(e.target.value)}
                                            placeholder="Or paste JSON array..."
                                        />
                                    )}
                                </TabsContent>
                            </Tabs>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                                <Button onClick={handleBulkParse}>Parse and preview</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{bulkPreviewRows.length} control(s) ready. Edit or remove rows below, then import.</p>
                                <Button variant="ghost" size="sm" onClick={() => setBulkStep("input")}>Change input</Button>
                            </div>
                            {bulkErrors.length > 0 && (
                                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                                    {bulkErrors.map((e, i) => (
                                        <div key={i}>{e.index === -1 ? "Batch: " : `Row ${e.index + 1}: `}{e.message}</div>
                                    ))}
                                </div>
                            )}
                            <div className="rounded-md border overflow-x-auto max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Control ID</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkPreviewRows.map((row, idx) => (
                                            <TableRow key={idx} className={bulkErrors.some((e) => e.index === idx) ? "bg-destructive/5" : ""}>
                                                <TableCell className="font-medium">{row.control_id}</TableCell>
                                                <TableCell>{row.control_title}</TableCell>
                                                <TableCell>{categories.find(c => c.id === row.category_id)?.name || "Unassigned"}</TableCell>
                                                <TableCell>{row.priority}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleBulkEditRow(idx)} aria-label="Edit row">
                                                        <IconEdit className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeBulkPreviewRow(idx)} aria-label="Remove row">
                                                        <IconTrash className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                                <Button onClick={handleBulkImport} disabled={bulkPreviewRows.length === 0 || bulkImporting}>
                                    {bulkImporting ? "Importing..." : `Import ${bulkPreviewRows.length} control(s)`}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={bulkEditIndex !== null} onOpenChange={(open) => { if (!open) setBulkEditIndex(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit row {bulkEditIndex !== null ? bulkEditIndex + 1 : ""}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Control ID *</label>
                                <Input
                                    value={bulkEditFormData.control_id || ""}
                                    onChange={(e) => setBulkEditFormData({ ...bulkEditFormData, control_id: e.target.value.slice(0, 20) })}
                                    maxLength={20}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title *</label>
                                <Input
                                    value={bulkEditFormData.control_title || ""}
                                    onChange={(e) => setBulkEditFormData({ ...bulkEditFormData, control_title: e.target.value.slice(0, 200) })}
                                    maxLength={200}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                            <label className="text-xs font-medium">Category</label>
                                            <Select
                                                value={bulkEditFormData.category_id?.toString()}
                                                onValueChange={(val) => setBulkEditFormData({ ...bulkEditFormData, category_id: parseInt(val) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority *</label>
                                <Select value={bulkEditFormData.priority} onValueChange={(v) => setBulkEditFormData({ ...bulkEditFormData, priority: v })}>
                                    <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Control statement</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={bulkEditFormData.control_statement || ""}
                                onChange={(e) => setBulkEditFormData({ ...bulkEditFormData, control_statement: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkEditIndex(null)}>Cancel</Button>
                        <Button onClick={saveBulkEditRow}>Apply</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
