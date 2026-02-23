import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  Mountain,
  CalendarCheck,
  Users,
  Award,
  MessageSquare,
  LogOut,
  PanelLeft,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Mountain, label: "Trips", path: "/admin/trips" },
  { icon: CalendarCheck, label: "Bookings", path: "/admin/bookings" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Award, label: "Loyalty & NFC", path: "/admin/loyalty" },
  { icon: MessageSquare, label: "Community", path: "/admin/community" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-lime-400 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f0a]">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full">
          <Shield className="w-16 h-16 text-lime-400" />
          <h1 className="text-2xl font-bold text-white text-center">Admin Access Required</h1>
          <p className="text-gray-400 text-center text-sm">
            Sign in with an admin account to access the Mountain Rangers control panel.
          </p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-semibold"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (me && me.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0f0a]">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full text-center">
          <Shield className="w-16 h-16 text-red-400" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400 text-sm">
            You don't have admin privileges. Contact the site owner to get access.
          </p>
          <Button
            onClick={() => { window.location.href = "/"; }}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const activeMenuItem = menuItems.find(
    (item) => item.path === location || (item.path !== "/admin" && location.startsWith(item.path))
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-[#1a2a1a] bg-[#0d150d]" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-[#1a2a1a]">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-lime-500/10 rounded-lg transition-colors focus:outline-none shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-lime-400" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-4 w-4 text-lime-400 shrink-0" />
                  <span className="font-bold text-white tracking-tight truncate text-sm">
                    Admin Panel
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
                const isActive =
                  item.path === "/admin"
                    ? location === "/admin"
                    : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${
                        isActive
                          ? "bg-lime-500/15 text-lime-400 hover:bg-lime-500/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-lime-400" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Back to app link */}
            <div className="px-2 mt-2 border-t border-[#1a2a1a] pt-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setLocation("/")}
                    tooltip="Back to App"
                    className="h-10 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to App</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-[#1a2a1a]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/5 transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border border-lime-500/30 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-lime-500/20 text-lime-400">
                      {user?.name?.charAt(0).toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-medium truncate text-white">{user?.name ?? "Admin"}</p>
                    <p className="text-xs text-lime-400 truncate mt-0.5">Administrator</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0d150d] border-[#1a2a1a]">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-lime-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-[#0a0f0a]">
        {isMobile && (
          <div className="flex border-b border-[#1a2a1a] h-14 items-center justify-between bg-[#0d150d] px-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg text-lime-400" />
              <span className="text-white font-medium text-sm">
                {activeMenuItem?.label ?? "Admin"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
