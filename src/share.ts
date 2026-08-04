
import type { DisplayMode, RunSequenceSpecification, SequenceChoice } from "./application";
import type { ReadPolicy, TimingConfiguration } from "./simulator/timing";
import type { CacheConfiguration } from "./simulator/types";

export const SHARE_QUERY_PARAM = "share";
const SHARE_SPEC_VERSION = 1;


export type SharedRunSpec = {
  readonly v: typeof SHARE_SPEC_VERSION;
  readonly blockSizeWords: number;
  readonly cacheBlockCount: number;
  readonly readPolicy: ReadPolicy;
  readonly cacheAccessTimeNs: number;
  readonly mainMemoryBlockFetchTimeNs: number;
  readonly sequence: readonly number[];
  readonly sequenceChoice: SequenceChoice;
  readonly randomSeed: string | null;
  readonly displayMode: DisplayMode;
  readonly step: number;
};

export type BuildShareSpecInput = {
  readonly configuration: CacheConfiguration;
  readonly timing: TimingConfiguration;
  readonly sequence: readonly number[];
  readonly sequenceSpecification: RunSequenceSpecification;
  readonly displayMode: DisplayMode;
  readonly step: number;
};


export function buildShareSpec(input: BuildShareSpecInput): SharedRunSpec {
  return {
    v: SHARE_SPEC_VERSION,
    blockSizeWords: input.configuration.blockSizeWords,
    cacheBlockCount: input.configuration.cacheBlockCount,
    readPolicy: input.timing.readPolicy,
    cacheAccessTimeNs: input.timing.cacheAccessTimeNs,
    mainMemoryBlockFetchTimeNs: input.timing.mainMemoryBlockFetchTimeNs,
    sequence: input.sequence,
    sequenceChoice: input.sequenceSpecification.choice,
    randomSeed: input.sequenceSpecification.randomSeed,
    displayMode: input.displayMode,
    step: input.step,
  };
}

/** UTF-8 safe base64url text, so the payload survives inside a query string. */
function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function encodeShareSpec(spec: SharedRunSpec): string {
  return encodeBase64Url(JSON.stringify(spec));
}

/** Build a shareable absolute URL for the current page carrying the spec. */
export function buildShareUrl(spec: SharedRunSpec): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_QUERY_PARAM, encodeShareSpec(spec));
  return url.toString();
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSequenceChoice(value: unknown): value is SequenceChoice {
  return (
    value === "sequential"
    || value === "mid-repeat"
    || value === "random"
    || value === "custom"
  );
}

function isReadPolicy(value: unknown): value is ReadPolicy {
  return value === "load-through" || value === "non-load-through";
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === "step" || value === "final";
}

/** Parse and structurally validate an untrusted share payload from a URL. */
export function decodeShareSpec(encoded: string): SharedRunSpec | null {
  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as Record<string, unknown>;

    if (
      parsed.v !== SHARE_SPEC_VERSION
      || !isFiniteNumber(parsed.blockSizeWords)
      || !isFiniteNumber(parsed.cacheBlockCount)
      || !isReadPolicy(parsed.readPolicy)
      || !isFiniteNumber(parsed.cacheAccessTimeNs)
      || !isFiniteNumber(parsed.mainMemoryBlockFetchTimeNs)
      || !Array.isArray(parsed.sequence)
      || parsed.sequence.length === 0
      || !parsed.sequence.every((value) => isFiniteNumber(value))
      || !isSequenceChoice(parsed.sequenceChoice)
      || !(parsed.randomSeed === null || typeof parsed.randomSeed === "string")
      || !isDisplayMode(parsed.displayMode)
      || !isFiniteNumber(parsed.step)
    ) {
      return null;
    }

    return parsed as unknown as SharedRunSpec;
  } catch {
    return null;
  }
}

/** Read and decode a share spec from the current page URL, if one is present. */
export function readShareSpecFromLocation(): SharedRunSpec | null {
  const encoded = new URLSearchParams(window.location.search).get(SHARE_QUERY_PARAM);
  return encoded ? decodeShareSpec(encoded) : null;
}

/** Remove the share parameter once its run has been loaded, without a reload. */
export function clearShareQueryParam(): void {
  const url = new URL(window.location.href);

  if (!url.searchParams.has(SHARE_QUERY_PARAM)) {
    return;
  }

  url.searchParams.delete(SHARE_QUERY_PARAM);
  window.history.replaceState({}, "", url.toString());
}
