"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface ProjectSettingsTabsProps {
  projectId: string;
}

export default function ProjectSettingsTabs({ projectId }: ProjectSettingsTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname?.split("/").filter(Boolean) || [];
  const lastSegment = segments[segments.length - 1];
  const activeTab = lastSegment === "team" ? "teams" : lastSegment === "wizard" ? "wizard" : "info";

  return (
    <div className="mb-8">
      <Tabs value={activeTab} className="w-full" onValueChange={(value) => {
        if (value === "teams") {
          router.push(`/assess/${projectId}/team`);
        } else if (value === "wizard") {
          router.push(`/assess/${projectId}/settings/wizard`);
        } else {
          router.push(`/assess/${projectId}/settings`);
        }
      }}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="info" className="px-6 data-[state=active]:bg-background">
            Project Information
          </TabsTrigger>
          <TabsTrigger value="teams" className="px-6 data-[state=active]:bg-background">
            Teams
          </TabsTrigger>
          <TabsTrigger value="wizard" className="px-6 data-[state=active]:bg-background">
            AI System Profile
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
