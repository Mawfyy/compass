import { loadConfig, type Config } from "../infrastructure/config";
import type { GuideGenerator } from "./guide-generator";
import { OpenRouterGuideGenerator } from "./openrouter/openrouter-guide-generator";

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
  });
}
