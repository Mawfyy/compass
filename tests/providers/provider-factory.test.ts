import { describe, it, expect } from "vitest";
import { createGuideGenerator, createChatClient } from "../../src/providers/provider-factory";
import { OpenRouterGuideGenerator } from "../../src/providers/openrouter/openrouter-guide-generator";
import { OpenRouterChatClient } from "../../src/providers/openrouter/openrouter-chat";
import type { Config } from "../../src/infrastructure/config";

function config(overrides: Partial<Config>): Config {
  return {
    provider: "mock",
    providerTimeoutMs: 10_000,
    openrouterApiKey: null,
    openrouterBaseUrl: "https://openrouter.ai/api/v1",
    openrouterTimeoutMs: 120_000,
    guideModel: "nvidia/nemotron-3-super-120b-a12b:free",
    webSearch: false,
    webSearchMaxResults: 5,
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

describe("createChatClient", () => {
  it("returns undefined for non-openrouter providers", () => {
    expect(createChatClient(config({ provider: "mock" }))).toBeUndefined();
  });

  it("returns an OpenRouterChatClient when PROVIDER=openrouter and a key is set", () => {
    expect(
      createChatClient(config({ provider: "openrouter", openrouterApiKey: "key" })),
    ).toBeInstanceOf(OpenRouterChatClient);
  });

  it("throws when PROVIDER=openrouter without an API key", () => {
    expect(() => createChatClient(config({ provider: "openrouter" }))).toThrow(
      /OPENROUTER_API_KEY/,
    );
  });
});
