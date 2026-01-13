import AccountForm from "./account-form";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Account() {
  // This will redirect to login if not authenticated
  const { user, role } = await requireAuth("/admin/account");

  const supabase = await createClient();

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return (
    <AccountForm
      user={user}
      profile={profile}
      role={role}
    />
  );
}
