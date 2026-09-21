import { loadConfig, type Config } from "../infrastructure/config";
import type { DecisionProvider } from "./decision-provider";
import type { GuideGenerator } from "./guide-generator";
import { MockProvider } from "./mock/mock-provider";
import { JevProvider } from "./jev/jev-provider";
import { OpenRouterGuideGenerator } from "./openrouter/openrouter-guide-generator";

export function createDecisionProvider(config: Config = loadConfig()): DecisionProvider {
  if (config.provider === "jev") {
    if (!config.typesafeApiKey) {
      throw new Error("TYPESAFE_API_KEY is required when PROVIDER=jev");
    }
    return new JevProvider({
      apiKey: config.typesafeApiKey,
      model: config.typesafeModel,
      timeoutMs: config.providerTimeoutMs,
    });
  }
  if (config.provider === "openrouter" && config.typesafeApiKey) {
    return new JevProvider({
      apiKey: config.typesafeApiKey,
      model: config.typesafeModel,
      timeoutMs: config.providerTimeoutMs,
    });
  }
  return new MockProvider();
}

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
