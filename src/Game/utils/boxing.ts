import { BoxingBlip, Direction, FishId, Vector } from "../Game.types";
import { Drone } from "../drone/Drone";

export const get1DMirror = (pos: number, reference: number) => {
  return reference - (pos - reference);
};

export function boxBoundSize(
  thresholds: number[],
  start: number,
  direction: -1 | 1
): number {
  const sortedThresholds = Array.from(new Set(thresholds)).sort(
    (a, b) => a - b
  );

  let i = sortedThresholds.findIndex((threshold) => {
    return threshold === start;
  });

  //   console.error({ i, direction }, sortedThresholds);
  return Math.abs(start - sortedThresholds[i + direction]) * direction;
}

export function normalizeBlips(
  firstDronePos: Vector,
  secondDronePos: Vector,
  firstDroneBlip: Direction,
  secondDroneBlip: Direction
): {
  topLeftBlip: BoxingBlip;
  bottomRightBlip: BoxingBlip;
} {
  const topLeftBlip: BoxingBlip = {
    pos: { x: firstDronePos.x, y: firstDronePos.y },
    dir: {
      x: firstDroneBlip.x,
      y: firstDroneBlip.y,
    },
  };
  const bottomRightBlip: BoxingBlip = {
    pos: { x: secondDronePos.x, y: secondDronePos.y },
    dir: {
      x: secondDroneBlip.x,
      y: secondDroneBlip.y,
    },
  };

  if (firstDronePos.x > secondDronePos.x) {
    [topLeftBlip.pos.x, bottomRightBlip.pos.x] = [
      bottomRightBlip.pos.x,
      topLeftBlip.pos.x,
    ];
    [topLeftBlip.dir.x, bottomRightBlip.dir.x] = [
      bottomRightBlip.dir.x,
      topLeftBlip.dir.x,
    ];
  }
  if (firstDronePos.y > secondDronePos.y) {
    [topLeftBlip.pos.y, bottomRightBlip.pos.y] = [
      bottomRightBlip.pos.y,
      topLeftBlip.pos.y,
    ];
    [topLeftBlip.dir.y, bottomRightBlip.dir.y] = [
      bottomRightBlip.dir.y,
      topLeftBlip.dir.y,
    ];
  }

  return { topLeftBlip, bottomRightBlip };
}

export function getReminiblip({
  firstDrone,
  secondDrone,
  fishId,
  topLeftBlip,
  bottomRightBlip,
}: {
  firstDrone: Drone;
  secondDrone: Drone;
  fishId: FishId;
  topLeftBlip: BoxingBlip;
  bottomRightBlip: BoxingBlip;
}): {
  topLeftBlip: BoxingBlip;
  bottomRightBlip: BoxingBlip;
} {
  let firstPreviousBlipDir = firstDrone.lastBlips.find((blip) => {
    return fishId === blip.fishId;
  })?.blipDir;
  let secondPreviousBlipDir = secondDrone.lastBlips.find((blip) => {
    return fishId === blip.fishId;
  })?.blipDir;

  if (firstPreviousBlipDir === undefined) {
    firstPreviousBlipDir = secondPreviousBlipDir;
  }
  if (secondPreviousBlipDir === undefined) {
    secondPreviousBlipDir = firstPreviousBlipDir;
  }

  if (
    firstPreviousBlipDir === undefined ||
    secondPreviousBlipDir === undefined
  ) {
    return { topLeftBlip, bottomRightBlip };
  }

  const {
    topLeftBlip: previousTopLeftBlip,
    bottomRightBlip: previousBottomRightBlip,
  } = normalizeBlips(
    firstDrone.previousPos,
    secondDrone.previousPos,
    firstPreviousBlipDir,
    secondPreviousBlipDir
  );

  if (previousTopLeftBlip.dir.x !== topLeftBlip.dir.x) {
    previousTopLeftBlip.pos.x = topLeftBlip.pos.x + 400 * topLeftBlip.dir.x;
  } else {
    previousTopLeftBlip.pos.x = topLeftBlip.pos.x;
    previousTopLeftBlip.dir.x = topLeftBlip.dir.x;
  }
  if (previousTopLeftBlip.dir.y !== topLeftBlip.dir.y) {
    previousTopLeftBlip.pos.y = topLeftBlip.pos.y + 400 * topLeftBlip.dir.y;
  } else {
    previousTopLeftBlip.pos.y = topLeftBlip.pos.y;
    previousTopLeftBlip.dir.y = topLeftBlip.dir.y;
  }
  if (previousBottomRightBlip.dir.x !== bottomRightBlip.dir.x) {
    previousBottomRightBlip.pos.x =
      bottomRightBlip.pos.x + 400 * bottomRightBlip.dir.x;
  } else {
    previousBottomRightBlip.pos.x = bottomRightBlip.pos.x;
    previousBottomRightBlip.dir.x = bottomRightBlip.dir.x;
  }
  if (previousBottomRightBlip.dir.y !== bottomRightBlip.dir.y) {
    previousBottomRightBlip.pos.y =
      bottomRightBlip.pos.y + 400 * bottomRightBlip.dir.y;
  } else {
    previousBottomRightBlip.pos.y = bottomRightBlip.pos.y;
    previousBottomRightBlip.dir.y = bottomRightBlip.dir.y;
  }

  return {
    topLeftBlip: previousTopLeftBlip,
    bottomRightBlip: previousBottomRightBlip,
  };
}

export function squaredDistance(pos: Vector, pos2: Vector) {
  return Math.pow(pos.x - pos2.x, 2) + Math.pow(pos.y - pos2.y, 2);
}

export function boxFurthestCorner(
  pos: Vector,
  box: { pos: Vector; size: Vector }
): Vector {
  let furthestCorner = pos;
  let furthestCornerDist = 0;

  let nextCorner = box.pos;
  let dist = squaredDistance(pos, nextCorner);
  if (dist > furthestCornerDist) {
    furthestCorner = nextCorner;
    furthestCornerDist = dist;
  }
  nextCorner = { x: box.pos.x + box.size.x, y: box.pos.y };
  dist = squaredDistance(pos, nextCorner);
  if (dist > furthestCornerDist) {
    furthestCorner = nextCorner;
    furthestCornerDist = dist;
  }
  nextCorner = { x: box.pos.x, y: box.pos.y + box.size.y };
  dist = squaredDistance(pos, nextCorner);
  if (dist > furthestCornerDist) {
    furthestCorner = nextCorner;
    furthestCornerDist = dist;
  }
  nextCorner = { x: box.pos.x + box.size.x, y: box.pos.y + box.size.y };
  dist = squaredDistance(pos, nextCorner);
  if (dist > furthestCornerDist) {
    furthestCorner = nextCorner;
    furthestCornerDist = dist;
  }
  return furthestCorner;
}
