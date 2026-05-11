import { spawnSync } from "node:child_process";

/**
 * Known model tier classifications based on OpenCode Zen pricing data.
 *
 * Methodology: Models are classified by input cost per 1M tokens:
 *   cheap/fast:    free or ≤ $0.30/1M input tokens
 *   mid/balanced:  $0.50 – $1.75/1M input tokens
 *   premium/deep:  ≥ $2.00/1M input tokens
 *
 * Source: https://opencode.ai/docs/zen/#pricing
 *
 * Update this map on every npm patch release to keep in sync with
 * OpenCode's evolving model catalog.
 */
export const KNOWN_MODEL_TIERS: Record<
  string,
  "cheap/fast" | "mid/balanced" | "premium/deep"
> = {
  // ═══════════════════════════════════════════════════
  // CHEAP / FAST — free or ≤ $0.30/1M input tokens
  // ═══════════════════════════════════════════════════

  // Free models
  "big-pickle": "cheap/fast",
  "hy3-preview-free": "cheap/fast",
  "minimax-m2.5-free": "cheap/fast",
  "nemotron-3-super-free": "cheap/fast",
  "trinity-large-preview-free": "cheap/fast",

  // ≤ $0.30 input — OpenCode Zen/Go
  "deepseek-v4-flash": "cheap/fast",
  "gpt-5-nano": "cheap/fast",
  "gpt-5.1-codex-mini": "cheap/fast",
  "gpt-5.4-nano": "cheap/fast",
  "mimo-v2.5": "cheap/fast",
  "mimo-v2-omni": "cheap/fast",
  "minimax-m2.5": "cheap/fast",
  "minimax-m2.7": "cheap/fast",
  "qwen3.5-plus": "cheap/fast",

  // Popular 3rd-party cheap models
  "claude-3-5-haiku": "cheap/fast",
  "deepseek-chat": "cheap/fast",
  "gemini-2.0-flash": "cheap/fast",
  "gpt-4.1-mini": "cheap/fast",
  "gpt-4.1-nano": "cheap/fast",
  "gpt-4o-mini": "cheap/fast",
  "gpt-5-mini": "cheap/fast",
  "gpt-5.4-fast": "cheap/fast",
  "gpt-5.4-mini-fast": "cheap/fast",
  "grok-code-fast-1": "cheap/fast",
  "o4-mini": "cheap/fast",
  "ring-2.6-1t-free": "cheap/fast",

  // ═══════════════════════════════════════════════════
  // MID / BALANCED — $0.50 – $1.75/1M input tokens
  // ═══════════════════════════════════════════════════

  // OpenCode Zen/Go mid-tier models
  "claude-haiku-4-5": "mid/balanced",
  "deepseek-v4-pro": "mid/balanced",
  "gemini-3-flash": "mid/balanced",
  "glm-5": "mid/balanced",
  "gpt-5": "mid/balanced",
  "gpt-5.1": "mid/balanced",
  "gpt-5.1-codex": "mid/balanced",
  "gpt-5.1-codex-max": "mid/balanced",
  "gpt-5.2": "mid/balanced",
  "gpt-5.2-codex": "mid/balanced",
  "gpt-5.3-codex": "mid/balanced",
  "gpt-5.3-codex-spark": "mid/balanced",
  "gpt-5.4-mini": "mid/balanced",
  "gpt-5-codex": "mid/balanced",
  "kimi-k2.5": "mid/balanced",
  "kimi-k2.6": "mid/balanced",
  "mimo-v2-pro": "mid/balanced",
  "mimo-v2.5-pro": "mid/balanced",
  "qwen3.6-plus": "mid/balanced",

  // Popular 3rd-party mid models
  "deepseek-reasoner": "mid/balanced",
  "deepseek-v3": "mid/balanced",
  "gemini-2.5-pro": "mid/balanced",
  "gemini-3-flash-preview": "mid/balanced",
  "gpt-4.1": "mid/balanced",
  "gpt-4o": "mid/balanced",
  "gpt-5.5-fast": "mid/balanced",
  o1: "mid/balanced",

  // ═══════════════════════════════════════════════════
  // PREMIUM / DEEP — ≥ $2.00/1M input tokens
  // ═══════════════════════════════════════════════════

  // OpenCode Zen/Go premium models
  "claude-opus-4-1": "premium/deep",
  "claude-opus-4-5": "premium/deep",
  "claude-opus-4-6": "premium/deep",
  "claude-opus-4-7": "premium/deep",
  "claude-sonnet-4": "premium/deep",
  "claude-sonnet-4-5": "premium/deep",
  "claude-sonnet-4-6": "premium/deep",
  "gemini-3.1-pro": "premium/deep",
  "gemini-3.1-pro-preview": "premium/deep",
  "glm-5.1": "premium/deep",
  "gpt-5.4": "premium/deep",
  "gpt-5.4-pro": "premium/deep",
  "gpt-5.5": "premium/deep",
  "gpt-5.5-pro": "premium/deep",

  // Popular 3rd-party premium models
  "o1-pro": "premium/deep",
  o3: "premium/deep",
};

export interface Model {
  id: string;
  name?: string;
}

export interface ClassifiedModels {
  cheap: Model[];
  mid: Model[];
  premium: Model[];
  /** Models not found in KNOWN_MODEL_TIERS — flagged for manual assignment. */
  unclassified: Model[];
}

export interface ScanResult {
  available: boolean;
  /** Full list of connected models (for manual mode). */
  models: Model[];
  /** Models grouped by tier (for auto mode). */
  classified: ClassifiedModels;
}

/** Extract the model slug from a full provider/model-id string. */
function getModelSlug(modelId: string): string {
  const slashIdx = modelId.indexOf("/");
  return slashIdx === -1 ? modelId : modelId.slice(slashIdx + 1);
}

export function parseModelsOutput(raw: string): Model[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as unknown[]).map((item) => {
        if (typeof item === "string") return { id: item };
        return item as Model;
      });
    }
  } catch {
    // Not JSON — fall through to text parsing
  }
  const modelIdPattern =
    /([a-zA-Z0-9][a-zA-Z0-9_-]*\/[a-zA-Z0-9][a-zA-Z0-9._:-]*)/g;
  const models: Model[] = [];
  const seen = new Set<string>();

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const match of trimmed.matchAll(modelIdPattern)) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.add(id);
        models.push({ id });
      }
    }
  }

  return models;
}

export function classifyModels(models: Model[]): ClassifiedModels {
  const cheap: Model[] = [];
  const mid: Model[] = [];
  const premium: Model[] = [];
  const unclassified: Model[] = [];

  for (const model of models) {
    const slug = getModelSlug(model.id || "").toLowerCase();
    const tier = KNOWN_MODEL_TIERS[slug];

    if (tier === "cheap/fast") {
      cheap.push(model);
    } else if (tier === "mid/balanced") {
      mid.push(model);
    } else if (tier === "premium/deep") {
      premium.push(model);
    } else {
      // Unknown model — put in mid as safe default, flag as unclassified
      mid.push(model);
      unclassified.push(model);
    }
  }

  return { cheap, mid, premium, unclassified };
}

export async function scanOpenCodeModels(): Promise<ScanResult> {
  // shell: true ensures the child process inherits the full login-shell PATH,
  // so `opencode` is found even when Node was launched without a shell profile.
  const result = spawnSync("opencode", ["models"], {
    encoding: "utf8",
    timeout: 10000,
    shell: true,
  });

  if (result.error || result.status !== 0) {
    return {
      available: false,
      models: [],
      classified: { cheap: [], mid: [], premium: [], unclassified: [] },
    };
  }

  const models = parseModelsOutput(result.stdout);
  const classified = classifyModels(models);
  return { available: true, models, classified };
}
