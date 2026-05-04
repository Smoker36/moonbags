/**
 * Detect if token price is at BOTTOM after pumpfun migration
 * Tracks lowest price and detects recovery signal
 */
type BottomSnippetCandidate = {
  priceUsd?: number;
};

type BottomSnippetWatchEntry = {
  firstPrice?: number;
  sourceMeta?: Record<string, unknown>;
};

function detectBottomPrice(
  candidate: Partial<BottomSnippetCandidate>,
  existing?: BottomSnippetWatchEntry
): {
  isAtBottom: boolean;
  currentPrice: number;
  lowestPrice: number;
  maxDropPct: number;
  isRecovering: boolean;
  reason: string;
} {
  const currentPrice = candidate.priceUsd ?? 0;
  const firstPrice = existing?.firstPrice ?? currentPrice;
  const previousLowest = (existing?.sourceMeta?.lowestPrice as number) ?? firstPrice;

  if (currentPrice <= 0 || firstPrice <= 0) {
    return {
      isAtBottom: false,
      currentPrice,
      lowestPrice: previousLowest,
      maxDropPct: 0,
      isRecovering: false,
      reason: "Invalid price data",
    };
  }

  // Update lowest price
  const lowestPrice = Math.min(previousLowest, currentPrice);
  const maxDropPct = ((firstPrice - lowestPrice) / firstPrice) * 100;

  // Check if price is recovering from bottom
  // Recovery = current price > lowest + 2% margin
  const recoveryThreshold = lowestPrice * 1.02;
  const isRecovering = currentPrice > recoveryThreshold;

  // At bottom when:
  // 1. Dumped at least 10%
  // 2. Currently at or near lowest point
  // 3. Starting to show recovery (price rising)
  const isAtBottom = maxDropPct >= 10 && isRecovering;

  return {
    isAtBottom,
    currentPrice,
    lowestPrice,
    maxDropPct: Math.round(maxDropPct * 100) / 100,
    isRecovering,
    reason: isAtBottom
      ? `At bottom! Drop: ${maxDropPct.toFixed(1)}%, Recovering: ${isRecovering}`
      : `Still dumping (${maxDropPct.toFixed(1)}% down) or waiting for recovery`,
  };
}
