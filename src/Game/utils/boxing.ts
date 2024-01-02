export function boxBoundSize(
  thresholds: number[],
  start: number,
  direction: -1 | 1,
  useSymetry: boolean
): number {
const sortedThresholds = Array.from(new Set(thresholds))

  let i = sortedThresholds.findIndex((threshold) => {
    return threshold === start;
  });
//   console.error({ i, direction }, sortedThresholds);
  return Math.abs(start - sortedThresholds[i + direction]) * direction;
}
