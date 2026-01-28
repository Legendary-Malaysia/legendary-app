"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  LogOut,
  Ticket,
  MessageSquare,
} from "lucide-react";
import { LegendaryLogo } from "@/components/icons/legendary";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AdminSidebarProps {
  user: SupabaseUser;
  role: string | null;
  onLinkClick?: () => void;
}

export function AdminSidebar({ user, role, onLinkClick }: AdminSidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/support",
      label: "Support Tickets",
      icon: Ticket,
    },
    {
      href: "/admin/account",
      label: "Account",
      icon: User,
    },
    {
      href: "/admin/conversations",
      label: "Conversations",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
        <LegendaryLogo
          width={107}
          height={16}
          darkMode={true}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-sm font-medium text-white">
              {user.email?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user.email ?? "Unknown"}
            </p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
        </div>
        <form
          action="/auth/signout"
          method="post"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
