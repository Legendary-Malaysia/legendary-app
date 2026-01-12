import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if a user's logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.signOut();
    }

    revalidatePath("/", "layout");
    return NextResponse.redirect(new URL("/login", req.url), {
      status: 302,
    });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Failed to sign out. Please try again." },
      { status: 500 },
    );
  }
}
