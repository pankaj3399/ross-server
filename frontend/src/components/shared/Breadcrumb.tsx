"use client";

import React from "react";
import Link from "next/link";
import { IconHome } from "@tabler/icons-react";
import {
    Breadcrumb as BreadcrumbRoot,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
        <BreadcrumbRoot className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1"
                        >
                            <IconHome className="w-4 h-4" />
                            <span className="sr-only">Dashboard</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <BreadcrumbItem>
                    {projectHref ? (
                        <BreadcrumbLink asChild>
                            <Link
                                href={projectHref}
                                className="font-medium truncate max-w-[200px]"
                                title={projectName}
                            >
                                {projectName}
                            </Link>
                        </BreadcrumbLink>
                    ) : (
                        <BreadcrumbPage className="font-medium truncate max-w-[200px]" title={projectName}>
                            {projectName}
                        </BreadcrumbPage>
                    )}
                </BreadcrumbItem>

                {items.map((item) => (
                    <React.Fragment key={item.href || item.label}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {item.href ? (
                                <BreadcrumbLink asChild>
                                    <Link href={item.href}>
                                        {item.label}
                                    </Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage className="font-semibold text-primary">
                                    {item.label}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </BreadcrumbRoot>
    );
};
