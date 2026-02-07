"use client";

import React from "react";
import Link from "next/link";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    projectName: string;
    projectHref?: string;
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ projectName, projectHref, items }) => {
    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors flex items-center gap-1"
            >
                <IconHome className="w-4 h-4" />
                <span className="sr-only">Dashboard</span>
            </Link>

            <IconChevronRight className="w-4 h-4 flex-shrink-0" />

            {projectHref ? (
                <Link
                    href={projectHref}
                    className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[200px]"
                    title={projectName}
                >
                    {projectName}
                </Link>
            ) : (
                <span className="font-medium text-foreground truncate max-w-[200px]" title={projectName}>
                    {projectName}
                </span>
            )}

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <IconChevronRight className="w-4 h-4 flex-shrink-0" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-semibold text-primary">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
