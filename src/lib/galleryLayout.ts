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
  naturalWidthPx: number; // aspectRatio × targetRowHeight. Last rows render at this width capped to 100%; full rows render at 100% and ignore this.
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

// Defaults assume the gallery sits inside the standard max-w-6xl + px-12 container:
// 1152px max width − 48px padding × 2 = 1056px inner width. If the page chrome changes, update here.
export const DEFAULT_TARGET_ROW_HEIGHT = 260;
export const DEFAULT_CONTAINER_WIDTH = 1056;
export const DEFAULT_MAX_ITEMS_PER_ROW = 5;

export function justifiedRows<T>(
  inputs: LayoutInput<T>[],
  opts: LayoutOptions = {}
): LayoutRow<T>[] {
  const targetRowHeight = opts.targetRowHeight ?? DEFAULT_TARGET_ROW_HEIGHT;
  const containerWidth = opts.containerWidth ?? DEFAULT_CONTAINER_WIDTH;
  const maxItemsPerRow = opts.maxItemsPerRow ?? DEFAULT_MAX_ITEMS_PER_ROW;

  const rows: LayoutRow<T>[] = [];
  let current: LayoutInput<T>[] = [];
  let currentARSum = 0;

  const pushRow = (items: LayoutInput<T>[], arSum: number, isLastRow: boolean) => {
    rows.push({
      items,
      aspectRatio: arSum,
      naturalWidthPx: arSum * targetRowHeight,
      isLastRow,
    });
  };

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
        pushRow(candidate, candidateARSum, false);
        current = [];
        currentARSum = 0;
      } else {
        pushRow(current, currentARSum, false);
        current = [{ ...input, aspectRatio: ar }];
        currentARSum = ar;
      }
    } else {
      current = candidate;
      currentARSum = candidateARSum;
    }
  }

  if (current.length > 0) {
    pushRow(current, currentARSum, true);
  }

  return rows;
}