// Justified-rows / "flexbin" layout: greedy pack by aspect ratio so each completed row's
// items sum to a known total AR. Rendered with CSS aspect-ratio + flex-grow so the row
// scales fluidly with container width without re-running the algorithm in the browser.

export type LayoutInput<T> = {
  item: T;
  aspectRatio: number; // width / height
};

export type LayoutRow<T> = {
  items: LayoutInput<T>[];
  aspectRatio: number; // sum of item ARs — the row's overall AR at its natural height
  isLastRow: boolean;
};

export type LayoutOptions = {
  /** Target row height in px, used only as a packing heuristic — actual rendered height is CSS-driven. */
  targetRowHeight?: number;
  /** Width used to decide row breaks. Doesn't pin the final width; rows scale fluidly. */
  containerWidth?: number;
  /** Cap items per row so a tile doesn't shrink below readability on long thin runs. */
  maxItemsPerRow?: number;
};

export function justifiedRows<T>(
  inputs: LayoutInput<T>[],
  opts: LayoutOptions = {}
): LayoutRow<T>[] {
  const targetRowHeight = opts.targetRowHeight ?? 260;
  const containerWidth = opts.containerWidth ?? 1056;
  const maxItemsPerRow = opts.maxItemsPerRow ?? 5;

  const rows: LayoutRow<T>[] = [];
  let current: LayoutInput<T>[] = [];
  let currentARSum = 0;

  for (const input of inputs) {
    const ar = isFinite(input.aspectRatio) && input.aspectRatio > 0 ? input.aspectRatio : 1;
    const candidate = [...current, { ...input, aspectRatio: ar }];
    const candidateARSum = currentARSum + ar;
    const candidateWidth = candidateARSum * targetRowHeight;

    const wouldOverflow = candidateWidth >= containerWidth;
    const wouldHitCap = candidate.length > maxItemsPerRow;

    if (current.length > 0 && (wouldOverflow || wouldHitCap)) {
      // Pick the row that's closer to the target width: current (without this item) or candidate (with it).
      const currentWidth = currentARSum * targetRowHeight;
      const currentDelta = Math.abs(containerWidth - currentWidth);
      const candidateDelta = Math.abs(containerWidth - candidateWidth);
      const includeNow = !wouldHitCap && candidateDelta < currentDelta;

      if (includeNow) {
        rows.push({ items: candidate, aspectRatio: candidateARSum, isLastRow: false });
        current = [];
        currentARSum = 0;
      } else {
        rows.push({ items: current, aspectRatio: currentARSum, isLastRow: false });
        current = [{ ...input, aspectRatio: ar }];
        currentARSum = ar;
      }
    } else {
      current = candidate;
      currentARSum = candidateARSum;
    }
  }

  if (current.length > 0) {
    rows.push({ items: current, aspectRatio: currentARSum, isLastRow: true });
  }

  return rows;
}