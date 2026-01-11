import { requireAuth } from "@/lib/supabase/auth";
import Link from "next/link";
import { LayoutDashboard, Settings, User, LogOut, Ticket } from "lucide-react";
import { LegendaryLogo } from "@/components/icons/legendary";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
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
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/support"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
            >
              <Ticket className="h-5 w-5" />
              <span>Support Tickets</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <Link
              href="/admin/account"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
            >
              <User className="h-5 w-5" />
              <span>Account</span>
            </Link>
          </nav>

          {/* User section */}
          <div className="border-t border-slate-700/50 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-sm font-medium text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {user.email}
                </p>
                <p className="text-xs text-slate-400">Administrator</p>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
