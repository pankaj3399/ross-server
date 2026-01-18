"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconHome } from "@tabler/icons-react";
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItemData {
  name: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItemData[] => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItemData[] = [{ name: "Home", href: "/" }];

    let currentPath = "";
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;

      // Skip dynamic routes (UUIDs, etc.)
      if (
        segment.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ) {
        return;
      }

      const name = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        name,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <ShadcnBreadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem key={breadcrumb.href}>
            {index > 0 && <BreadcrumbSeparator />}
            {index === breadcrumbs.length - 1 ? (
              <BreadcrumbPage className="flex items-center gap-1.5">
                {index === 0 && <IconHome className="h-4 w-4" />}
                {breadcrumb.name}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={breadcrumb.href} className="flex items-center gap-1.5">
                  {index === 0 && <IconHome className="h-4 w-4" />}
                  {breadcrumb.name}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
}
