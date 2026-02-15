"use client";



import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconCopy,
    IconDownload, IconChevronDown, IconChevronRight, IconArrowLeft,
    IconCheck, IconX, IconHistory, IconEye, IconArchive, IconSend
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
import { apiService } from "@/lib/api";

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import("@/components/shared/RichTextEditor").then(mod => mod.RichTextEditor), {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
});

// --- Constants ---

const CATEGORIES = [
    "Governance",
    "Risk Management",
    "Data Quality",
    "Model Performance",
    "Security",
    "Transparency",
    "Human Oversight",
    "Robustness"
];

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Draft", "In Review", "Published", "Archived"];
const TIMELINES = ["Immediate", "Short-term (1-3 months)", "Medium-term (3-6 months)", "Long-term (6+ months)"];

// --- Interfaces ---

interface Implementation {
    requirements: string[];
    steps: string[];
    timeline: string;
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
    category: string;
    priority: string;
    status: string;
    version: number;
    applicable_to: string[];
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
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="font-medium text-lg">{title}</h3>
                {isOpen ? <IconChevronDown className="size-5" /> : <IconChevronRight className="size-5" />}
            </div>
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
                            <label className="text-xs font-medium mb-1 block">{label1}</label>
                            <Input
                                value={item.ref}
                                onChange={(e) => updateItem(index, "ref", e.target.value)}
                                placeholder="e.g. Article 12(1)"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">{label2}</label>
                            <Input
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
    const [selectedControlId, setSelectedControlId] = useState<string | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form State
    const defaultControlState: Partial<Control> = {
        category: "",
        priority: "",
        status: "Draft",
        applicable_to: [],
        implementation: { requirements: [""], steps: [""], timeline: "" },
        evidence_requirements: [""],
        compliance_mapping: { eu_ai_act: [], nist_ai_rmf: [], iso_42001: [] },
        aima_mapping: { domain: "", area: "", maturity_enhancement: "" },
    };

    const [formData, setFormData] = useState<Partial<Control>>(defaultControlState);
    const [versions, setVersions] = useState<ControlVersion[]>([]);
    const [showTransitionDialog, setShowTransitionDialog] = useState(false);
    const [transitionNote, setTransitionNote] = useState("");
    const [targetStatus, setTargetStatus] = useState("");

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    // fetch controls
    const fetchControls = async () => {
        setLoading(true);
        try {
            const api = apiService;
            const params = new URLSearchParams();
            if (categoryFilter !== "all") params.append("category", categoryFilter);
            if (priorityFilter !== "all") params.append("priority", priorityFilter);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await api.getCRCControls(params);
            setControls(res.data);
        } catch (error) {
            toast.error("Failed to fetch controls");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchControls();
    }, [categoryFilter, priorityFilter, statusFilter]);

    // Handle Search Debounce
    useEffect(() => {
        const timer = setTimeout(fetchControls, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
            if (!formData.control_id || !formData.control_title || !formData.category || !formData.priority) {
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

    const openTransitionDialog = (status: string) => {
        setTargetStatus(status);
        setShowTransitionDialog(true);
    };

    const handleExport = async (format: "json" | "csv") => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one control to export");
            return;
        }
        try {
            const api = apiService;
            // We need to fetch blob/text manually as ApiService.request assumes JSON usually
            const authToken = localStorage.getItem("auth_token");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/crc/controls/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ ids: selectedIds, format })
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
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
                                <label className="text-sm font-medium">Category *</label>
                                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                                        implementation: { ...formData.implementation!, requirements: items }
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
                                        implementation: { ...formData.implementation!, steps: items }
                                    })}
                                    placeholder="Add step..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expected Timeline</label>
                                <Select value={formData.implementation?.timeline || ""} onValueChange={(val) => setFormData({ ...formData, implementation: { ...formData.implementation!, timeline: val } })}>
                                    <SelectTrigger><SelectValue placeholder="Select Timeline" /></SelectTrigger>
                                    <SelectContent>
                                        {TIMELINES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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
                                    onChange={(items) => setFormData({ ...formData, compliance_mapping: { ...formData.compliance_mapping!, eu_ai_act: items } })}
                                    label1="Reference (Article)"
                                    label2="Context"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold mt-4">NIST AI RMF Mapping</h4>
                                <PairedRepeatableField
                                    items={formData.compliance_mapping?.nist_ai_rmf || []}
                                    onChange={(items) => setFormData({ ...formData, compliance_mapping: { ...formData.compliance_mapping!, nist_ai_rmf: items } })}
                                    label1="Reference"
                                    label2="Context"
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold mt-4">ISO 42001 Mapping</h4>
                                <PairedRepeatableField
                                    items={formData.compliance_mapping?.iso_42001 || []}
                                    onChange={(items) => setFormData({ ...formData, compliance_mapping: { ...formData.compliance_mapping!, iso_42001: items } })}
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
                <Button onClick={handleCreate} size="lg">
                    <IconPlus className="mr-2 size-5" /> Create Control
                </Button>
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
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                                        <TableCell>{control.category}</TableCell>
                                        <TableCell>
                                            <Badge variant={control.priority === "High" ? "destructive" : control.priority === "Medium" ? "secondary" : "outline"}>
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
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(control.id)}>
                                                    <IconEdit className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleClone(control.id)}>
                                                    <IconCopy className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(control.id)}>
                                                    <IconTrash className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
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
        </div>
    );
}
