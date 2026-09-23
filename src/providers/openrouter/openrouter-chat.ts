import type { ChatMessage } from "../../domain/chat/schemas";
import type { ChatClient } from "../chat-client";

export interface OpenRouterChatConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  webSearch?: boolean;
  webSearchMaxResults?: number;
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export class OpenRouterChatClient implements ChatClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly webSearch: boolean;
  private readonly webSearchMaxResults: number;
  private readonly fetchFn: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(config: OpenRouterChatConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.webSearch = config.webSearch ?? false;
    this.webSearchMaxResults = config.webSearchMaxResults ?? 5;
    this.fetchFn = config.fetch ?? ((input, init) => fetch(input, init));
  }

  async stream(
    system: string,
    messages: ChatMessage[],
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const upstream = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.4,
          stream: true,
          ...(this.webSearch && {
            plugins: [{ id: "web", max_results: this.webSearchMaxResults }],
          }),
          messages: [
            { role: "system", content: system },
            ...messages,
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!upstream.ok) {
        const body = await upstream.text();
        throw new Error(`OpenRouter ${upstream.status}: ${body.slice(0, 500)}`);
      }

      return upstream;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}
