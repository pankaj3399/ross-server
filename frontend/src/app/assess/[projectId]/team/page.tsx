"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiService } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    IconLoader2,
    IconUserPlus,
    IconMail,
    IconDotsVertical,
    IconTrash,
    IconPencil,
    IconAlertTriangle,
    IconSend,
    IconX
} from "@tabler/icons-react";

export interface ProjectMember {
    id: string;
    canonicalId: string;
    name: string;
    email: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface Invitation {
    id: string;
    email: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    status: string;
}

export default function TeamManagementPage() {
    const { projectId } = useParams() as { projectId: string };
    const { user, isAuthenticated } = useAuth();
    // Removed useAssessmentContext as role is not present

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    // Invite state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('EDITOR');
    const [inviting, setInviting] = useState(false);

    // Edit/Remove state
    const [memberToEdit, setMemberToEdit] = useState<ProjectMember | null>(null);
    const [editRole, setEditRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER' | string>("");
    const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);
    const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(null);

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [projectId, isAuthenticated, user?.id]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const memRes = await apiService.getProjectMembers(projectId);
            const fetchedMembers = (memRes.members || []).map((m: any) => ({
                ...m,
                canonicalId: m.user_id || m.id
            })) as ProjectMember[];
            setMembers(fetchedMembers);

            const currentUserMember = fetchedMembers.find(
                (m) => String(m.canonicalId) === String(user?.id) || (user?.email && m.email === user?.email)
            );
            const currentUserIsOwner = currentUserMember?.role === "OWNER";
            setIsOwner(currentUserIsOwner);

            if (currentUserIsOwner) {
                try {
                    const invRes = await apiService.getProjectInvitations(projectId);
                    setInvitations(invRes.invitations || []);
                } catch (invErr) {
                    console.error("Failed to fetch invitations", invErr);
                    setInvitations([]);
                }
            } else {
                setInvitations([]);
            }
        } catch (error) {
            console.error("Failed to fetch team data", error);
            showToast.error("Failed to load team data");
            setMembers([]);
            setIsOwner(false);
            setInvitations([]);
        } finally {
            setLoading(false);
        }
    }, [projectId, user?.id, user?.email]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, fetchData]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            await apiService.inviteToProject(projectId, { email: inviteEmail, role: inviteRole });
            showToast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail("");
            setInviteRole("EDITOR");
            fetchData(); // refresh list
        } catch (err: any) {
            showToast.error(err.message || "Failed to send invitation");
        } finally {
            setInviting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!memberToEdit) return;
        setProcessing(true);
        try {
            await apiService.updateProjectMember(projectId, memberToEdit.canonicalId, { role: editRole });
            showToast.success("Member role updated");
            setMemberToEdit(null);
            fetchData();
        } catch (err: any) {
            showToast.error(err.message || "Failed to update role");
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;
        setProcessing(true);
        try {
            await apiService.removeProjectMember(projectId, memberToRemove.canonicalId);
            showToast.success("Member removed");
            setMemberToRemove(null);
            fetchData();
        } catch (err: any) {
            showToast.error(err.message || "Failed to remove member");
        } finally {
            setProcessing(false);
        }
    };

    const handleRevokeInvitation = async () => {
        if (!invitationToRevoke) return;
        setProcessing(true);
        try {
            await apiService.revokeProjectInvitation(projectId, invitationToRevoke.id);
            showToast.success("Invitation revoked");
            setInvitationToRevoke(null);
            fetchData();
        } catch (err: any) {
            showToast.error(err.message || "Failed to revoke invitation");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary to-primary">
                        Team Management
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage who has access to this project.
                    </p>
                </div>
            </div>

            {isOwner && (
                <Card className="border-primary/20 shadow-md ring-1 ring-primary/5">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <IconUserPlus className="w-5 h-5 text-primary" />
                            Invite New Member
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                            <div className="grid gap-2 sm:col-span-6">
                                <Label htmlFor="inviteEmail" className="text-sm font-medium">Email Address</Label>
                                <div className="relative">
                                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="inviteEmail"
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        required
                                        className="pl-10 h-10"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2 sm:col-span-3">
                                <Label className="text-sm font-medium">Role</Label>
                                <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as 'OWNER' | 'EDITOR' | 'VIEWER')}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EDITOR">Editor</SelectItem>
                                        <SelectItem value="VIEWER">Viewer</SelectItem>
                                        <SelectItem value="OWNER">Owner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 sm:col-span-3">
                                <Label className="hidden sm:block opacity-0">&nbsp;</Label>
                                <Button type="submit" disabled={inviting} className="w-full h-10 px-8">
                                    {inviting ? (
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <IconSend className="w-4 h-4" />
                                    )}
                                    Send Invite
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Members List */}
            <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <IconMail className="w-5 h-5 text-muted-foreground" />
                        Project Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    {isOwner && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isOwner ? 4 : 3} className="h-24 text-center text-muted-foreground">
                                            No members yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member) => {
                                        const isSelf = String(member.canonicalId) === String(user?.id);
                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/10 text-primary uppercase text-xs">
                                                                {member.name ? member.name.substring(0, 2) : "US"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span>{member.name} {isSelf && "(You)"}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {member.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={member.role === 'OWNER' ? 'default' : member.role === 'EDITOR' ? 'secondary' : 'outline'}
                                                    >
                                                        {member.role}
                                                    </Badge>
                                                </TableCell>
                                                {isOwner && (
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSelf}>
                                                                    <span className="sr-only">Open menu</span>
                                                                    <IconDotsVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setMemberToEdit(member);
                                                                        setEditRole(member.role);
                                                                    }}
                                                                >
                                                                    <IconPencil className="mr-2 h-4 w-4" />
                                                                    <span>Change Role</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setMemberToRemove(member)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <IconTrash className="mr-2 h-4 w-4" />
                                                                    <span>Remove Member</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Invitations */}
            {isOwner && invitations.length > 0 && (
                <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/50">
                    <CardHeader className="bg-amber-50/30 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
                            <IconLoader2 className="w-5 h-5 animate-spin-slow" />
                            Pending Invitations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium">{inv.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{inv.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-amber-600 dark:text-amber-500 text-sm">
                                                    <IconLoader2 className="w-3 h-3 animate-spin mr-1" />
                                                    Pending
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => setInvitationToRevoke(inv)}
                                                >
                                                    <IconX className="w-4 h-4 mr-1" /> Revoke
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modals */}

            {/* Edit Role Modal */}
            <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change Member Role</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm">Change role for <strong>{memberToEdit?.name}</strong>.</p>
                        <div className="space-y-2">
                            <Label>New Role</Label>
                            <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setMemberToEdit(null)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} disabled={processing} className="px-6">
                            {processing && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remove Member Modal */}
            <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center">
                            <IconAlertTriangle className="w-5 h-5 mr-2" />
                            Remove Member
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm">
                            Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from this project?
                            They will lose all access immediately.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setMemberToRemove(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRemoveMember} disabled={processing}>
                            {processing && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Remove Member
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Revoke Invitation Modal */}
            <Dialog open={!!invitationToRevoke} onOpenChange={(open) => !open && setInvitationToRevoke(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Revoke Invitation</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm">
                            Are you sure you want to revoke the invitation sent to <strong>{invitationToRevoke?.email}</strong>?
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setInvitationToRevoke(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRevokeInvitation} disabled={processing}>
                            {processing && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Revoke
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
