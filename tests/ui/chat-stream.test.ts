import { describe, it, expect } from "vitest";
import { parseSSEStream } from "../../src/ui/guide/chat-stream";

function toStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

describe("parseSSEStream", () => {
  it("yields delta content from well-formed SSE events", async () => {
    const data = [
      `data: {"choices":[{"delta":{"content":"hello"}}]}`,
      `data: {"choices":[{"delta":{"content":" world"}}]}`,
      `data: [DONE]`,
    ].join("\n");

    const chunks = await collect(toStream(data));
    expect(chunks).toEqual(["hello", " world"]);
  });

  it("handles events separated by multiple newlines", async () => {
    const data = `data: {"choices":[{"delta":{"content":"a"}}]}\n\n\n\n` +
      `data: {"choices":[{"delta":{"content":"b"}}]}\n\n` +
      `data: [DONE]\n\n`;

    const chunks = await collect(toStream(data));
    expect(chunks).toEqual(["a", "b"]);
  });

  it("skips malformed JSON lines", async () => {
    const data = [
      `data: {not json}`,
      `data: {"choices":[{"delta":{"content":"ok"}}]}`,
      `data: [DONE]`,
    ].join("\n");

    const chunks = await collect(toStream(data));
    expect(chunks).toEqual(["ok"]);
  });

  it("handles chunks split across reads", async () => {
    const full = `data: {"choices":[{"delta":{"content":"x"}}]}\ndata: [DONE]\n`;
    // split in the middle of a JSON payload
    const split1 = full.slice(0, 30);
    const split2 = full.slice(30);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(split1));
        controller.enqueue(encoder.encode(split2));
        controller.close();
      },
    });

    const chunks = await collect(stream);
    expect(chunks).toEqual(["x"]);
  });

  it("ignores non-data lines", async () => {
    const data = [
      `event: ping`,
      ``,
      `data: {"choices":[{"delta":{"content":"hi"}}]}`,
      `data: [DONE]`,
    ].join("\n");

    const chunks = await collect(toStream(data));
    expect(chunks).toEqual(["hi"]);
  });
});

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of parseSSEStream(stream)) {
    chunks.push(chunk);
  }
  return chunks;
}
