import AccountForm from "./account-form";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Account() {
  // This will redirect to login if not authenticated
  const { user, role } = await requireAuth("/account");

  const supabase = await createClient();

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AccountForm
      user={user}
      profile={profile}
      role={role}
    />
  );
}
