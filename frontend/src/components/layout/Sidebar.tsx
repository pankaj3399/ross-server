"use client";

import { useEffect, useMemo } from "react";
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
  IconMenu2,
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
  useSidebar,
} from "@/components/ui/sidebar";
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

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
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
  },
  {
    id: "settings",
    label: "Settings",
    icon: IconSettings,
    href: "/settings",
  },
];

function SidebarContentComponent({ items = defaultSidebarItems }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const handleLogout = () => {
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
      });
    }
    if (user?.role === ROLES.ADMIN && !allSidebarItemsMap.has("admin-premium-domains")) {
      allSidebarItemsMap.set("admin-premium-domains", {
        id: "admin-premium-domains",
        label: "Premium Domains",
        href: "/admin/premium-domains",
        icon: IconCrown,
      });
    }
    return Array.from(allSidebarItemsMap.values());
  }, [items, user?.role]);

  const isActive = (href: string, id: string) => {
    if (href === "#") return false;

    const currentPath = pathname || "";

    const itemMatchesPath = (itemHref: string, itemId: string) => {
      if (itemHref === "#") return false;
      if (itemId === "premium" && currentPath.includes("/premium-features")) return true;
      if (itemId === "settings" && (currentPath.includes("/settings") || currentPath.includes("/manage-subscription"))) return true;
      if (itemId === "admin-aima" && currentPath.includes("/admin/aima-data")) return true;
      if (itemId === "admin-premium-domains" && currentPath.includes("/admin/premium-domains")) return true;
      return currentPath === itemHref || (itemHref !== "/" && currentPath.startsWith(itemHref));
    };

    if (id === "dashboard") {
      if (currentPath === "/dashboard" || currentPath === "/") {
        return true;
      }

      const otherItemMatches = allSidebarItems.some((item) => {
        if (item.id === "dashboard" || item.disabled) {
          return false;
        }
        return itemMatchesPath(item.href, item.id);
      });

      return !otherItemMatches;
    }

    return itemMatchesPath(href, id);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          <span className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">
            MATHUR.ai
          </span>
          <SidebarTrigger className="" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allSidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.id);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      disabled={item.disabled}
                      tooltip={item.label}
                    >
                      <Link href={item.disabled ? "#" : item.href}>
                        <Icon className="size-6" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />

        {/* Theme Toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              <div
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                {theme === "dark" ? (
                  <IconSun className="size-6" />
                ) : (
                  <IconMoon className="size-6" />
                )}
                <span>Theme</span>
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
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <IconUser className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">{user.name || "User"}</span>
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
                    <Link href="/settings">
                      <IconSettings className="size-5 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconLogout className="size-5 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebar({ items = defaultSidebarItems }: AppSidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const shouldHideSidebar = pathname === "/" || pathname?.startsWith("/auth");

  if (shouldHideSidebar || !isAuthenticated) {
    return null;
  }

  return <SidebarContentComponent items={items} />;
}

// Mobile trigger button
export function SidebarMobileTrigger() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const shouldHide = pathname === "/" || pathname?.startsWith("/auth");

  if (shouldHide || !isAuthenticated) {
    return null;
  }

  return (
    <div className="md:hidden fixed top-4 left-4 z-50">
      <SidebarTrigger />
    </div>
  );
}
