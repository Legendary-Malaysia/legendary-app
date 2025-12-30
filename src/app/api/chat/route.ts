import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  config?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  let connectionEstablished = false;
  let timeoutId: NodeJS.Timeout | null = null;
  
  const abortHandler = () => controller.abort();
  request.signal.addEventListener('abort', abortHandler);

  try {
    // Only timeout if connection isn't established within 30s
    timeoutId = setTimeout(() => {
      if (!connectionEstablished) {
        console.warn("Connection timeout - aborting request");
        controller.abort();
      }
    }, 30000);

    const body = await request.json() as ChatRequest;
    const { messages, config } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    const apiKey = process.env.CSAGENT_API_KEY;
    const apiUrl = process.env.CSAGENT_API_URL;
    const assistantId = process.env.CSAGENT_ASSISTANT_ID;

    if (!apiKey || !apiUrl || !assistantId) {
      return NextResponse.json(
        { error: "Server configuration incomplete" },
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Backend error:", response.status, errText);
      return NextResponse.json(
        { error: "Failed to fetch from backend" },
        { status: response.status }
      );
    }

    // Mark connection as established and clear timeout
    connectionEstablished = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    const stream = response.body;
    if (!stream) {
      return NextResponse.json(
        { error: "No response body from backend" },
        { status: 500 }
      );
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    // If streaming hasn't started, we can return a JSON error
    if (!connectionEstablished) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    
    // If streaming started, log the error (connection likely broken)
    console.error("Stream error after connection established:", errorMessage);
    
    // Attempt to send error as SSE event
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = JSON.stringify({ error: errorMessage });
        controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    });
    
    return new NextResponse(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    request.signal.removeEventListener('abort', abortHandler);
  }
}