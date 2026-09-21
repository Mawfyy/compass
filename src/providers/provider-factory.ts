import { loadConfig, type Config } from "../infrastructure/config";
import type { DecisionProvider } from "./decision-provider";
import type { MapGenerator } from "./map-generator";
import { MockProvider } from "./mock/mock-provider";
import { JevProvider } from "./jev/jev-provider";
import { OpenRouterMapGenerator } from "./openrouter/openrouter-map-generator";

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
  return new MockProvider();
}

export function createMapGenerator(config: Config = loadConfig()): MapGenerator | undefined {
  if (config.provider !== "openrouter") return undefined;
  if (!config.openrouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required when PROVIDER=openrouter");
  }
  return new OpenRouterMapGenerator({
    apiKey: config.openrouterApiKey,
    model: config.openrouterModel,
    baseUrl: config.openrouterBaseUrl,
    timeoutMs: config.openrouterTimeoutMs,
  });
}
