export function boxBoundSize(
  thresholds: number[],
  start: number,
  direction: -1 | 1,
  useSymetry: boolean
): number {
    // const symetricLimit = 5000 - otherDrone?.pos.x! - 5000;

  const sortedThresholds = Array.from(new Set(thresholds)).sort(
    (a, b) => a - b
  );

  let i = sortedThresholds.findIndex((threshold) => {
    return threshold === start;
  });
//   console.error({ i, direction }, sortedThresholds);
  return Math.abs(start - sortedThresholds[i + direction]) * direction;
}
