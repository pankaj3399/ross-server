"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { MissingQuestion } from "../../lib/assessmentValidation";

interface Props {
    open: boolean;
    onClose: () => void;
    missing: MissingQuestion[];
    onGoToFirst: () => void;
}

export default function MissingAnswersDialog({
    open,
    onClose,
    missing,
    onGoToFirst,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconAlertTriangle className="w-5 h-5 text-warning" />
                        {missing.length} unanswered question{missing.length === 1 ? "" : "s"}
                    </DialogTitle>
                    <DialogDescription>
                        Please answer every question before submitting.
                    </DialogDescription>
                </DialogHeader>

                <ul className="max-h-[50vh] overflow-y-auto divide-y divide-border rounded-md border border-border">
                    {missing.map((m) => (
                        <li
                            key={`${m.domainId}:${m.practiceId}:${m.level}:${m.stream}:${m.questionIndex}`}
                            className="p-3 text-sm"
                        >
                            <div className="text-xs text-muted-foreground">
                                {m.domainTitle} &gt; {m.practiceTitle}
                            </div>
                            <div className="text-foreground mt-1">{m.questionText}</div>
                        </li>
                    ))}
                </ul>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onGoToFirst} disabled={missing.length === 0}>
                        Go to first unanswered
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
