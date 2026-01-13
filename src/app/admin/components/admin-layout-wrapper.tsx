"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LegendaryLogo } from "@/components/icons/legendary";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  user: SupabaseUser;
  role: string | null;
}

export function AdminLayoutWrapper({
  children,
  user,
  role,
}: AdminLayoutWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl md:block">
        <AdminSidebar
          user={user}
          role={role}
        />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-700/50 px-4 md:hidden">
          <div className="flex items-center gap-3">
            <LegendaryLogo
              width={107}
              height={16}
              darkMode={true}
            />
          </div>
          <Sheet
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[80%] max-w-[300px] border-r-slate-700 bg-slate-900 p-0 text-slate-300"
            >
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <AdminSidebar
                user={user}
                role={role}
                onLinkClick={() => setIsOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
