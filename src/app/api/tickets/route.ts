import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  // You should set API_SECRET_KEY in your .env.local file
  if (!apiKey || apiKey !== process.env.CSAGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      subject,
      description,
      category,
      priority,
      customer_name,
      customer_email,
      customer_phone,
      created_by_user_id, // The ID of the profile creating this ticket
    } = body;

    // Validate required fields
    if (
      !subject ||
      !description ||
      !category ||
      !priority ||
      !customer_name ||
      !customer_email ||
      !created_by_user_id
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. created_by_user_id is required causing a foreign key constraint.",
        },
        { status: 400 },
      );
    }

    // Initialize Supabase with Service Role Key for admin privileges
    // Ensure SUPABASE_SERVICE_ROLE_KEY is in your .env.local
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        subject,
        description,
        category,
        priority,
        created_by: created_by_user_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
