import { requireAuth } from "@/lib/supabase/auth";
import { AdminLayoutWrapper } from "@/app/admin/components/admin-layout-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireAuth();

  return (
    <AdminLayoutWrapper
      user={user}
      role={role}
    >
      {children}
    </AdminLayoutWrapper>
  );
}
