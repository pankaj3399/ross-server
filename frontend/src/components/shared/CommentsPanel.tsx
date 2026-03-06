"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { IconSend, IconDotsVertical, IconPencil, IconTrash, IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface CommentsPanelProps {
    projectId: string;
    objectType: string;
    objectId: string;
}

export default function CommentsPanel({ projectId, objectType, objectId }: CommentsPanelProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCommentBody, setNewCommentBody] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [editingComment, setEditingComment] = useState<any>(null);
    const [editBody, setEditBody] = useState("");
    const [deletingComment, setDeletingComment] = useState<any>(null);

    useEffect(() => {
        fetchComments();
    }, [projectId, objectType, objectId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await apiService.getProjectComments(projectId, { objectType, objectId });
            setComments(data.comments || []);
        } catch (err: any) {
            console.error("Failed to load comments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentBody.trim()) return;

        setSubmitting(true);
        try {
            await apiService.createProjectComment(projectId, {
                objectType,
                objectId,
                body: newCommentBody.trim(),
            });
            setNewCommentBody("");
            fetchComments();
        } catch (error: any) {
            showToast.error(error.message || "Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!editingComment || !editBody.trim()) return;
        setSubmitting(true);
        try {
            await apiService.updateComment(editingComment.id, editBody.trim());
            setEditingComment(null);
            fetchComments();
        } catch (error: any) {
            showToast.error(error.message || "Failed to update comment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!deletingComment) return;
        setSubmitting(true);
        try {
            await apiService.deleteComment(deletingComment.id);
            setDeletingComment(null);
            fetchComments();
        } catch (error: any) {
            showToast.error(error.message || "Failed to delete comment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Organize nested comments (1 level deep)
    const topLevelComments = comments.filter(c => !c.parent_comment_id);
    const repliesByParentId = comments.filter(c => c.parent_comment_id).reduce((acc, reply) => {
        if (!acc[reply.parent_comment_id]) acc[reply.parent_comment_id] = [];
        acc[reply.parent_comment_id].push(reply);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-6">
            <div className="border rounded-xl bg-card p-4 shadow-sm">
                <div className="space-y-4">
                    {topLevelComments.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        topLevelComments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                replies={repliesByParentId[comment.id] || []}
                                currentUser={user}
                                onEdit={(c: any) => { setEditingComment(c); setEditBody(c.body); }}
                                onDelete={(c: any) => setDeletingComment(c)}
                                onReplySuccess={fetchComments}
                                projectId={projectId}
                                objectType={objectType}
                                objectId={objectId}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Main Comment Input */}
            <div className="flex gap-3 items-start border rounded-xl p-4 bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">{user?.name?.substring(0, 2) || "U"}</AvatarFallback>
                </Avatar>
                <form onSubmit={handleAddComment} className="flex-1 flex flex-col gap-2">
                    <Textarea
                        placeholder="Add a comment..."
                        value={newCommentBody}
                        onChange={(e) => setNewCommentBody(e.target.value)}
                        className="min-h-[80px] border-none shadow-none focus-visible:ring-0 px-0 py-1 resize-none bg-transparent"
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!newCommentBody.trim() || submitting} size="sm">
                            {submitting ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : <IconSend className="w-4 h-4 mr-2" />}
                            Comment
                        </Button>
                    </div>
                </form>
            </div>

            {/* Edit Modal */}
            <Dialog open={!!editingComment} onOpenChange={(open) => !open && setEditingComment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Comment</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setEditingComment(null)}>Cancel</Button>
                        <Button onClick={handleUpdateComment} disabled={submitting || !editBody.trim()}>
                            {submitting && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={!!deletingComment} onOpenChange={(open) => !open && setDeletingComment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-destructive">
                            <IconAlertCircle className="w-5 h-5 mr-2" />
                            Delete Comment
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm">Are you sure you want to delete this comment? This action cannot be undone.</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeletingComment(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteComment} disabled={submitting}>
                            {submitting && <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />} Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component for individual comments and their replies
function CommentItem({ comment, replies, currentUser, onEdit, onDelete, onReplySuccess, projectId, objectType, objectId }: any) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyBody, setReplyBody] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const canModify = currentUser?.id === comment.author_id /* || currentUser is owner etc, assuming we just check author for now */;

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyBody.trim()) return;

        setSubmitting(true);
        try {
            await apiService.createProjectComment(projectId, {
                objectType,
                objectId,
                body: replyBody.trim(),
                parentCommentId: comment.id,
            });
            setReplyBody("");
            setIsReplying(false);
            onReplySuccess();
        } catch (err: any) {
            showToast.error(err.message || "Failed to post reply");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex gap-3 group/comment">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground font-medium uppercase">
                    {comment.author_name?.substring(0, 2) || "U"}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground" title={new Date(comment.created_at).toLocaleString()}>
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.updated_at !== comment.created_at && (
                            <span className="text-[10px] text-muted-foreground/60 leading-none">(edited)</span>
                        )}
                    </div>

                    {canModify && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                    <IconDotsVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(comment)}>
                                    <IconPencil className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(comment)} className="text-destructive">
                                    <IconTrash className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.body}</div>

                <div className="pt-1">
                    <button
                        type="button"
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:underline"
                    >
                        Reply
                    </button>
                </div>

                {/* Reply Input */}
                {isReplying && (
                    <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
                        <Textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Write a reply..."
                            className="min-h-[40px] text-sm py-2"
                            autoFocus
                        />
                        <div className="flex flex-col gap-1 justify-end">
                            <Button size="sm" type="submit" disabled={!replyBody.trim() || submitting}>
                                {submitting ? <IconLoader2 className="w-3 h-3 animate-spin" /> : "Reply"}
                            </Button>
                            <Button size="sm" type="button" variant="ghost" onClick={() => setIsReplying(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted/50">
                        {replies.map((reply: any) => (
                            <div key={reply.id} className="flex gap-2 group/reply">
                                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                        {reply.author_name?.substring(0, 2) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[13px]">{reply.author_name}</span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {currentUser?.id === reply.author_id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                        <IconDotsVertical className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onEdit(reply)}>
                                                        <IconPencil className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDelete(reply)} className="text-destructive">
                                                        <IconTrash className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <div className="text-[13px] whitespace-pre-wrap">{reply.body}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
