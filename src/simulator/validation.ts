/** Validation boundary for cache geometry, block addresses, and access lists. */
import {
  MAIN_MEMORY_BLOCK_COUNT,
  type CacheConfiguration,
} from "./types";

export type CacheConfigurationInput = {
  readonly blockSizeWords: unknown;
  readonly cacheBlockCount: unknown;
  readonly mainMemoryBlockCount?: unknown;
};

export type ValidationIssue = {
  readonly field: string;
  readonly message: string;
};

export type ValidationResult<T> =
  | {
      readonly valid: true;
      readonly value: T;
      readonly issues: readonly ValidationIssue[];
    }
  | {
      readonly valid: false;
      readonly issues: readonly ValidationIssue[];
    };

export class CacheConfigurationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "CacheConfigurationError";
    this.issues = [...issues];
  }
}

export class MemoryBlockAddressError extends RangeError {
  readonly address: unknown;

  constructor(address: unknown, message: string) {
    super(message);
    this.name = "MemoryBlockAddressError";
    this.address = address;
  }
}

export class MemoryBlockSequenceError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "MemoryBlockSequenceError";
    this.issues = [...issues];
  }
}

function isPowerOfTwo(value: number): boolean {
  // log2 is integral exactly when a positive integer is a power of two.
  return Number.isSafeInteger(value) && Number.isInteger(Math.log2(value));
}

/** Validate user-supplied geometry without silently coercing invalid values. */
export function validateCacheConfiguration(
  input: CacheConfigurationInput,
): ValidationResult<CacheConfiguration> {
  const issues: ValidationIssue[] = [];
  const { blockSizeWords, cacheBlockCount } = input;
  const mainMemoryBlockCount =
    input.mainMemoryBlockCount ?? MAIN_MEMORY_BLOCK_COUNT;

  if (!Number.isSafeInteger(blockSizeWords) || Number(blockSizeWords) < 2) {
    issues.push({
      field: "blockSizeWords",
      message: "Block size must be a safe integer of at least 2 words.",
    });
  } else if (!isPowerOfTwo(Number(blockSizeWords))) {
    issues.push({
      field: "blockSizeWords",
      message: "Block size must be a power of two.",
    });
  }

  if (!Number.isSafeInteger(cacheBlockCount) || Number(cacheBlockCount) < 4) {
    issues.push({
      field: "cacheBlockCount",
      message: "Cache block count must be a safe integer of at least 4.",
    });
  } else if (!isPowerOfTwo(Number(cacheBlockCount))) {
    issues.push({
      field: "cacheBlockCount",
      message: "Cache block count must be a power of two.",
    });
  }

  if (mainMemoryBlockCount !== MAIN_MEMORY_BLOCK_COUNT) {
    issues.push({
      field: "mainMemoryBlockCount",
      message: `Main memory must contain exactly ${MAIN_MEMORY_BLOCK_COUNT} blocks.`,
    });
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      blockSizeWords: Number(blockSizeWords),
      cacheBlockCount: Number(cacheBlockCount),
      mainMemoryBlockCount: MAIN_MEMORY_BLOCK_COUNT,
    },
    issues: [],
  };
}

export function validateMemoryBlockAddress(
  address: unknown,
): ValidationResult<number> {
  if (!Number.isSafeInteger(address)) {
    return {
      valid: false,
      issues: [
        {
          field: "blockAddress",
          message: "Memory block address must be a safe integer.",
        },
      ],
    };
  }

  const numericAddress = Number(address);

  if (numericAddress < 0 || numericAddress >= MAIN_MEMORY_BLOCK_COUNT) {
    return {
      valid: false,
      issues: [
        {
          field: "blockAddress",
          message: `Memory block address must be between 0 and ${MAIN_MEMORY_BLOCK_COUNT - 1}.`,
        },
      ],
    };
  }

  return { valid: true, value: numericAddress, issues: [] };
}

export function assertValidMemoryBlockAddress(address: unknown): number {
  const result = validateMemoryBlockAddress(address);

  if (!result.valid) {
    throw new MemoryBlockAddressError(address, result.issues[0].message);
  }

  return result.value;
}

export function validateMemoryBlockSequence(
  sequence: unknown,
): ValidationResult<readonly number[]> {
  if (!Array.isArray(sequence)) {
    return {
      valid: false,
      issues: [
        {
          field: "accessSequence",
          message: "Access sequence must be an array of memory block addresses.",
        },
      ],
    };
  }

  if (sequence.length === 0) {
    return {
      valid: false,
      issues: [
        {
          field: "accessSequence",
          message: "Access sequence must contain at least one block address.",
        },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  const addresses: number[] = [];

  // Collect every bad position in one pass so the UI can report all errors at once.
  sequence.forEach((address, index) => {
    const result = validateMemoryBlockAddress(address);

    if (result.valid) {
      addresses.push(result.value);
      return;
    }

    issues.push({
      field: `accessSequence[${index}]`,
      message: `Access ${index + 1}: ${result.issues[0].message}`,
    });
  });

  return issues.length > 0
    ? { valid: false, issues }
    : { valid: true, value: addresses, issues: [] };
}

export function assertValidMemoryBlockSequence(
  sequence: unknown,
): readonly number[] {
  const result = validateMemoryBlockSequence(sequence);

  if (!result.valid) {
    throw new MemoryBlockSequenceError(result.issues);
  }

  return [...result.value];
}
