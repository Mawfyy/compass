import { describe, it, expect } from "vitest";
import {
  createDecisionProvider,
  createMapGenerator,
} from "../../src/providers/provider-factory";
import { MockProvider } from "../../src/providers/mock/mock-provider";
import { JevProvider } from "../../src/providers/jev/jev-provider";
import { OpenRouterMapGenerator } from "../../src/providers/openrouter/openrouter-map-generator";
import type { Config } from "../../src/infrastructure/config";

function config(overrides: Partial<Config>): Config {
  return {
    provider: "mock",
    providerTimeoutMs: 10_000,
    typesafeApiKey: null,
    typesafeModel: "jev-latest",
    openrouterApiKey: null,
    openrouterModel: "deepseek/deepseek-v4-flash-0731",
    openrouterBaseUrl: "https://openrouter.ai/api/v1",
    openrouterTimeoutMs: 120_000,
    ...overrides,
  };
}

describe("createDecisionProvider", () => {
  it("returns a MockProvider when PROVIDER=mock", () => {
    expect(createDecisionProvider(config({ provider: "mock" }))).toBeInstanceOf(
      MockProvider,
    );
  });

  it("returns a JevProvider when PROVIDER=jev and a key is set", () => {
    expect(
      createDecisionProvider(config({ provider: "jev", typesafeApiKey: "key" })),
    ).toBeInstanceOf(JevProvider);
  });

  it("throws when PROVIDER=jev without an API key", () => {
    expect(() => createDecisionProvider(config({ provider: "jev" }))).toThrow(
      /TYPESAFE_API_KEY/,
    );
  });
});

describe("createMapGenerator", () => {
  it("returns undefined for non-openrouter providers", () => {
    expect(createMapGenerator(config({ provider: "mock" }))).toBeUndefined();
    expect(createMapGenerator(config({ provider: "jev" }))).toBeUndefined();
  });

  it("returns an OpenRouterMapGenerator when PROVIDER=openrouter and a key is set", () => {
    expect(
      createMapGenerator(config({ provider: "openrouter", openrouterApiKey: "key" })),
    ).toBeInstanceOf(OpenRouterMapGenerator);
  });

  it("throws when PROVIDER=openrouter without an API key", () => {
    expect(() => createMapGenerator(config({ provider: "openrouter" }))).toThrow(
      /OPENROUTER_API_KEY/,
    );
  });
});
