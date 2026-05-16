import * as React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileSpreadsheet,
  Zap,
  Settings,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandMenu } from "@/features/dashboard/components/CommandMenu";
import { Button } from "@/components/ui/button";
import { NewInvoiceSheet } from "@/features/invoices/components/NewInvoiceSheet";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "CRM Pipeline", icon: Users, href: "/clients" },
  { label: "Automated Invoices", icon: FileSpreadsheet, href: "/invoices" },
  { label: "Agentic Reconciler", icon: Zap, href: "/ai" },
  { label: "Performance", icon: Briefcase, href: "/projects" },
];

export default function DashboardLayout() {
  const location = useLocation();

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");
    
    eventSource.onmessage = (e) => {
      // standard message handler if needed
    };
    
    eventSource.addEventListener("reconciliation_success", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Background worker completed:", data);
        // We could trigger a toast or optimistically update a table here
        // To keep it simple, we just dispatch a custom event
        window.dispatchEvent(new CustomEvent("ai_reconciliation_complete", { detail: data }));
      } catch (err) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans selection:bg-zinc-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-800 bg-[#09090b] flex flex-col hidden md:flex">
        <div className="p-4 flex items-center gap-3 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="font-semibold tracking-tight text-sm uppercase">CreatorOS</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-zinc-800/50 text-white"
                    : "text-zinc-400 hover:bg-zinc-900"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 border border-zinc-600"></div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Arch. Lead</span>
              <span className="text-[10px] text-zinc-500">Solo Enterprise Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>Projects</span>
              <span>/</span>
              <span className="text-zinc-100">Main_Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <CommandMenu />
            </div>
            <div className="w-8 h-8 rounded-md border border-zinc-800 flex items-center justify-center hover:bg-zinc-900 cursor-pointer">
               <Bell className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#09090b] scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
          <NewInvoiceSheet />
        </div>

        {/* Footer Status Bar */}
        <footer className="h-8 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between px-4 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              System Operational
            </div>
            <div>v1.04.12-production</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-300 cursor-pointer">API Docs</span>
            <span className="hover:text-zinc-300 cursor-pointer">CLI v4.2</span>
            <span className="text-zinc-700">|</span>
            <span className="text-indigo-400">Sub-100ms Optimized</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
