import { describe, it, expect } from "vitest";
import { OpenRouterChatClient } from "../../src/providers/openrouter/openrouter-chat";

function sseResponse(chunks: string[], done = true): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      if (done) controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}

function capturingFetch(
  response: Response,
  onInit?: (init: RequestInit) => void,
) {
  return async (_input: string, init?: RequestInit): Promise<Response> => {
    onInit?.(init!);
    return response;
  };
}

function capturingSSEFetch(onInit?: (init: RequestInit) => void) {
  const encoder = new TextEncoder();
  let resolve: (value: Response) => void;
  const responsePromise = new Promise<Response>((r) => { resolve = r; });

  const fetch = async (_input: string, init?: RequestInit): Promise<Response> => {
    onInit?.(init!);
    return responsePromise;
  };

  const fulfill = (chunks: string[]) => {
    resolve!(sseResponse(chunks));
  };

  return { fetch, fulfill };
}

describe("OpenRouterChatClient", () => {
  it("sends stream: true and correct model", async () => {
    let captured: RequestInit | undefined;
    const client = new OpenRouterChatClient({
      apiKey: "sk-test",
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      fetch: capturingFetch(sseResponse(["hello"]), (init) => { captured = init; }),
    });
    await client.stream("system prompt", [{ role: "user", content: "hi" }]);

    expect(captured).toBeDefined();
    const body = JSON.parse(captured!.body as string);
    expect(body.model).toBe("nvidia/nemotron-3-super-120b-a12b:free");
    expect(body.stream).toBe(true);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0]).toEqual({ role: "system", content: "system prompt" });
    expect(body.messages[1]).toEqual({ role: "user", content: "hi" });
  });

  it("includes web search plugins when enabled", async () => {
    let captured: RequestInit | undefined;
    const client = new OpenRouterChatClient({
      apiKey: "sk-test",
      webSearch: true,
      webSearchMaxResults: 3,
      fetch: capturingFetch(sseResponse(["ok"]), (init) => { captured = init; }),
    });
    await client.stream("system", [{ role: "user", content: "test" }]);

    const body = JSON.parse(captured!.body as string);
    expect(body.plugins).toEqual([{ id: "web", max_results: 3 }]);
  });

  it("omits plugins when web search is disabled", async () => {
    let captured: RequestInit | undefined;
    const client = new OpenRouterChatClient({
      apiKey: "sk-test",
      webSearch: false,
      fetch: capturingFetch(sseResponse(["ok"]), (init) => { captured = init; }),
    });
    await client.stream("system", [{ role: "user", content: "test" }]);

    const body = JSON.parse(captured!.body as string);
    expect(body.plugins).toBeUndefined();
  });

  it("returns the upstream SSE stream directly", async () => {
    const client = new OpenRouterChatClient({
      apiKey: "sk-test",
      fetch: capturingFetch(sseResponse(["hello", " world"])),
    });
    const res = await client.stream("system", [{ role: "user", content: "hi" }]);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    expect(text).toContain("hello");
    expect(text).toContain("world");
    expect(text).toContain("[DONE]");
  });

  it("rejects on non-2xx responses", async () => {
    const client = new OpenRouterChatClient({
      apiKey: "sk-test",
      fetch: capturingFetch(new Response("unauthorized", { status: 401 })),
    });
    await expect(
      client.stream("system", [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/OpenRouter 401/);
  });
});
