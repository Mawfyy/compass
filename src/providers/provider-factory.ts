import { loadConfig, type Config } from "../infrastructure/config";
import type { GuideGenerator } from "./guide-generator";
import type { ChatClient } from "./chat-client";
import { OpenRouterGuideGenerator } from "./openrouter/openrouter-guide-generator";
import { OpenRouterChatClient } from "./openrouter/openrouter-chat";

export function createGuideGenerator(config: Config = loadConfig()): GuideGenerator | undefined {
  if (config.provider !== "openrouter") return undefined;
  if (!config.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required when PROVIDER=openrouter");
  }
  return new OpenRouterGuideGenerator({
    apiKey: config.openrouterApiKey,
    model: config.guideModel,
    baseUrl: config.openrouterBaseUrl,
    timeoutMs: config.openrouterTimeoutMs,
    webSearch: config.webSearch,
    webSearchMaxResults: config.webSearchMaxResults,
  });
}

export function createChatClient(config: Config = loadConfig()): ChatClient | undefined {
  if (config.provider !== "openrouter") return undefined;
  if (!config.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required when PROVIDER=openrouter");
  }
  return new OpenRouterChatClient({
    apiKey: config.openrouterApiKey,
    model: config.guideModel,
    baseUrl: config.openrouterBaseUrl,
    webSearch: config.webSearch,
    webSearchMaxResults: config.webSearchMaxResults,
  });
}
