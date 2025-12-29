import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for the FastAPI backend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, config } = body;

    const apiKey = process.env.CSAGENT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured on server" },
        { status: 500 }
      );
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured on server" },
        { status: 500 }
      );
    }
    const assistantId = process.env.CSAGENT_ASSISTANT_ID;
    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID not configured on server" },
        { status: 500 }
      );
    }

    const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

    const response = await fetch(`${normalizedApiUrl}/${assistantId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ messages, config }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: errText || "Failed to fetch from backend" },
        { status: response.status }
      );
    }

    // Stream the response back to the client
    const stream = response.body;
    if (!stream) {
      return NextResponse.json(
        { error: "No response body from backend" },
        { status: 500 }
      );
    }

    // Return a streaming response
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
