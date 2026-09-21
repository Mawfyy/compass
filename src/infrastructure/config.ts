export type ProviderName = "jev" | "openrouter" | "mock";

export interface Config {
  provider: ProviderName;
  providerTimeoutMs: number;
  typesafeApiKey: string | null;
  typesafeModel: string;
  openrouterApiKey: string | null;
  openrouterModel: string;
  openrouterBaseUrl: string;
  openrouterTimeoutMs: number;
  guideModel: string;
}

function readInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new Error(`Config ${name} must be an integer`);
  return parsed;
}

function readProvider(value: string | undefined): ProviderName {
  if (value === "jev" || value === "openrouter" || value === "mock") return value;
  if (value === undefined) return "mock";
  throw new Error(
    `Config PROVIDER must be "jev", "openrouter", or "mock", received "${value}"`,
  );
}

export function loadConfig(): Config {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional; values may come from the process environment.
  }

  return {
    provider: readProvider(process.env.PROVIDER),
    providerTimeoutMs: readInt(process.env.PROVIDER_TIMEOUT_MS, 10_000, "PROVIDER_TIMEOUT_MS"),
    typesafeApiKey: process.env.TYPESAFE_API_KEY ?? null,
    typesafeModel: process.env.TYPESAFE_MODEL ?? "jev-latest",
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? null,
    openrouterModel: process.env.OPENROUTER_MODEL ?? "google/gemini-3.8-flash",
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    openrouterTimeoutMs: readInt(
      process.env.OPENROUTER_TIMEOUT_MS,
      120_000,
      "OPENROUTER_TIMEOUT_MS",
    ),
    guideModel: process.env.OPENROUTER_GUIDE_MODEL ?? process.env.OPENROUTER_MODEL ?? "google/gemini-3.8-flash",
  };
}
