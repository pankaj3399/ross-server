"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconLayoutDashboard,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconDiamond,
  IconUser,
  IconDatabase,
  IconMoon,
  IconSun,
  IconCrown,
  IconShieldCheck,
  IconBell,
} from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { AUTH_LOGIN_URL, ROLES } from "../../lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { isSidebarVisible } from "../../lib/route-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { useNotificationStore } from "@/store/notificationStore";

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  activePatterns?: string[];
}

interface AppSidebarProps {
  items?: SidebarItem[];
}

const defaultSidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "overview",
    label: "Overview",
    icon: IconChartBar,
    href: "#",
    disabled: true,
  },
  {
    id: "premium",
    label: "Premium Features",
    icon: IconDiamond,
    href: "/premium-features",
    activePatterns: ["/premium-features"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: IconSettings,
    href: "/settings",
    activePatterns: ["/settings", "/manage-subscription"],
  },
];

import { apiService } from "../../lib/api";

function SidebarContentComponent({ items = defaultSidebarItems }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpenMobile, state } = useSidebar();
  const { invitations: myInvitations, fetchInvitations, removeInvitation, clearInvitations } = useNotificationStore();
  const [decliningTokens, setDecliningTokens] = useState<Set<string>>(new Set());
  const fetchInProgress = useRef(false);
  const decliningTokensRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  useEffect(() => {
    if (isAuthenticated && !fetchInProgress.current) {
      fetchInProgress.current = true;
      fetchInvitations().finally(() => {
        fetchInProgress.current = false;
      });
    }
  }, [isAuthenticated, pathname, fetchInvitations]); // Re-check when path changes (e.g. going back to dashboard)

  const handleDecline = async (token: string) => {
    if (decliningTokensRef.current.has(token)) return;

    decliningTokensRef.current.add(token);
    setDecliningTokens(prev => new Set(prev).add(token));

    try {
      await apiService.declineInvitation(token);
      showToast.success("Invitation declined");
      removeInvitation(token);
    } catch (error: any) {
      showToast.error(error.message || "Failed to decline invitation");
    } finally {
      decliningTokensRef.current.delete(token);
      setDecliningTokens(prev => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  const handleLogout = () => {
    clearInvitations();
    logout();
    router.replace(AUTH_LOGIN_URL);
  };

  // Get all sidebar items including admin item if user is admin
  const allSidebarItems = useMemo(() => {
    const allSidebarItemsMap = new Map<string, SidebarItem>();
    items.forEach(item => {
      allSidebarItemsMap.set(item.id, item);
    });
    if (user?.role === ROLES.ADMIN && !allSidebarItemsMap.has("admin-aima")) {
      allSidebarItemsMap.set("admin-aima", {
        id: "admin-aima",
        label: "Manage AIMA Data",
        href: "/admin/aima-data",
        icon: IconDatabase,
        activePatterns: ["/admin/aima-data"],
      });
    }
    if (user?.role === ROLES.ADMIN && !allSidebarItemsMap.has("admin-crc")) {
      allSidebarItemsMap.set("admin-crc", {
        id: "admin-crc",
        label: "CRC Controls",
        href: "/admin/crc",
        icon: IconShieldCheck,
        activePatterns: ["/admin/crc"],
      });
    }
    return Array.from(allSidebarItemsMap.values());
  }, [items, user?.role]);

  const itemMatchesPath = (item: SidebarItem, currentPath: string): boolean => {
    if (item.href === "#" || item.disabled) return false;

    // Check activePatterns first
    if (item.activePatterns && item.activePatterns.length > 0) {
      return item.activePatterns.some(pattern => currentPath.startsWith(pattern));
    }

    // Fallback to exact match or prefix match
    return currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
  };

  const isActive = (item: SidebarItem) => {
    if (item.href === "#") return false;

    const currentPath = pathname || "";

    if (item.id === "dashboard") {
      if (currentPath === "/dashboard" || currentPath === "/") {
        return true;
      }

      const otherItemMatches = allSidebarItems.some((otherItem) => {
        if (otherItem.id === "dashboard" || otherItem.disabled) {
          return false;
        }
        return itemMatchesPath(otherItem, currentPath);
      });

      return !otherItemMatches;
    }

    return itemMatchesPath(item, currentPath);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          <img src="/matur-logo-slogan.png" alt="MATUR.ai" className="h-8 group-data-[collapsible=icon]:hidden" />
          <SidebarTrigger className="size-8" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allSidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      disabled={item.disabled}
                      tooltip={item.label}
                      className="group-data-[collapsible=icon]:p-1.5! relative"
                    >
                      <Link
                        href={item.disabled ? "#" : item.href}
                        className="flex items-center gap-3 w-full"
                      >
                        <Icon className="size-7 shrink-0" />
                        <span className="text-base font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:gap-2">
        <SidebarSeparator />

        {/* Notifications */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Notifications"
                  className="group-data-[collapsible=icon]:p-1.5! relative"
                >
                  <IconBell className="size-7" />
                  <span className="text-base font-medium group-data-[collapsible=icon]:hidden">Notifications</span>
                  {myInvitations.length > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border border-sidebar" />
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={`w-80 ${state === "collapsed" ? "ml-0" : "ml-4"}`}
                side="top"
                align="start"
              >
                <DropdownMenuLabel>Pending Invitations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {myInvitations.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto">
                    {myInvitations.map((inv) => (
                      <div key={inv.id} className="p-3 text-sm flex flex-col gap-2 border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <p className="text-foreground leading-snug">
                          <span className="font-semibold">{inv.inviter?.name || "Someone"}</span> invited you to join <span className="font-semibold text-primary">{inv.project.name}</span>
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => router.push(`/invite/accept?token=${inv.token}`)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDecline(inv.token)}
                            disabled={decliningTokens.has(inv.token)}
                          >
                            {decliningTokens.has(inv.token) ? "Declining..." : "Decline"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-sm text-muted-foreground text-center">No new notifications</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Theme Toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
              className="group-data-[collapsible=icon]:p-1.5!"
            >
              <div
                onClick={toggleTheme}
                className="cursor-pointer flex items-center gap-2"
              >
                {theme === "dark" ? (
                  <IconSun className="size-7" />
                ) : (
                  <IconMoon className="size-7" />
                )}
                <span className="text-base font-medium group-data-[collapsible=icon]:hidden">Theme</span>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto group-data-[collapsible=icon]:hidden"
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Profile */}
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user.name || "User"}
                  >
                    <Avatar className="size-8 shrink-0 group-data-[collapsible=icon]:!flex">
                      <AvatarFallback className="bg-primary text-primary-foreground group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:text-sidebar-foreground">
                        <IconUser className="size-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                      <span className="text-sm font-semibold">{user.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user.email || ""}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side="top"
                  align="start"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <IconSettings className="size-6 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconLogout className="size-6 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ items = defaultSidebarItems }: AppSidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Only hide on auth pages, homepage, or if not authenticated
  const shouldHideSidebar = !isSidebarVisible(pathname);

  if (shouldHideSidebar || !isAuthenticated) {
    return null;
  }

  return <SidebarContentComponent items={items} />;
}

// Mobile trigger button
export function SidebarMobileTrigger() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Only hide on auth pages, homepage, or if not authenticated
  const shouldHide = !isSidebarVisible(pathname);

  if (shouldHide || !isAuthenticated) {
    return null;
  }

  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <SidebarTrigger />
    </div>
  );
}
