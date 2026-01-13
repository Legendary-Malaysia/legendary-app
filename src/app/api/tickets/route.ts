import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  // You should set CSAGENT_API_KEY in your .env.local file
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
          error: "Error: Missing required fields",
        },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Initialize Supabase with Secret keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");

  // Validate API Key
  if (!apiKey || apiKey !== process.env.CSAGENT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  // Validate email parameter
  if (!email) {
    return NextResponse.json(
      { error: "Email query parameter is required" },
      { status: 400 },
    );
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  try {
    // Initialize Supabase with Secret keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("subject, description, status, created_at")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching tickets:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tickets: data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
