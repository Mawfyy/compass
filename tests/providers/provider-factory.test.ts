import { describe, it, expect } from "vitest";
import { createGuideGenerator } from "../../src/providers/provider-factory";
import { OpenRouterGuideGenerator } from "../../src/providers/openrouter/openrouter-guide-generator";
import type { Config } from "../../src/infrastructure/config";

function config(overrides: Partial<Config>): Config {
  return {
    provider: "mock",
    providerTimeoutMs: 10_000,
    openrouterApiKey: null,
    openrouterBaseUrl: "https://openrouter.ai/api/v1",
    openrouterTimeoutMs: 120_000,
    guideModel: "google/gemini-3.8-flash",
    ...overrides,
  };
}

describe("createGuideGenerator", () => {
  it("returns undefined for non-openrouter providers", () => {
    expect(createGuideGenerator(config({ provider: "mock" }))).toBeUndefined();
  });

  it("returns an OpenRouterGuideGenerator when PROVIDER=openrouter and a key is set", () => {
    expect(
      createGuideGenerator(config({ provider: "openrouter", openrouterApiKey: "key" })),
    ).toBeInstanceOf(OpenRouterGuideGenerator);
  });

  it("throws when PROVIDER=openrouter without an API key", () => {
    expect(() => createGuideGenerator(config({ provider: "openrouter" }))).toThrow(
      /OPENROUTER_API_KEY/,
    );
  });
});
