import { DRONE_MAX_MOVE_DIST, STATIC_SAFETY_RADIUS } from "./Game.constants";
import { FishId, Vector } from "./Game.types";
import { Drone } from "./drone/Drone";
import { Fish } from "./fish/Fish";

function angleFromPos(dest: Vector, pos: Vector): number {
  let angle = Math.atan2(dest.y - pos.y, dest.x - pos.x);
  if (angle < 0) angle += 2 * Math.PI; // Normalize angle to [0, 2π]
  return angle;
}

export function computeBestNextPos(
  drone: Drone,
  fishes: Record<FishId, Fish>,
  target: Vector
): Vector {
  console.error(drone.droneId, drone.pos, drone.checkPoints, target);
  let safePositions: Vector[] = [];

  const distToTarget = Math.hypot(
    target.x - drone.pos.x,
    target.y - drone.pos.y
  );
  // straight line to next checkpoint or best position if no monsters in the way
  const initialGuess: Vector = {
    x:
      drone.pos.x + Math.floor(((target.x - drone.pos.x) * 600) / distToTarget),
    y:
      drone.pos.y + Math.floor(((target.y - drone.pos.y) * 600) / distToTarget),
  };
  console.error(
    "next pos for a straight line to target:\n",
    initialGuess,
    "\n\n\n"
  );

  // for each monster we will rotate the initial guess until we have one or two safe spots
  for (const fishId in fishes) {
    const fish = fishes[fishId];
    if (fish.detail.type !== -1 || fish.guesstimatedNextPos === undefined) {
      continue;
    }

    const distToMonsterDest = Math.hypot(
      fish.guesstimatedNextPos.x - initialGuess.x,
      fish.guesstimatedNextPos.y - initialGuess.y
    );

    if (distToMonsterDest >= STATIC_SAFETY_RADIUS) {
      continue;
    }
    const distanceToLineOfIntersection =
      (Math.pow(DRONE_MAX_MOVE_DIST, 2) -
        Math.pow(STATIC_SAFETY_RADIUS, 2) +
        Math.pow(distToMonsterDest, 2)) /
      (2 * distToMonsterDest);

    const midPointOnLineOfIntersection = {
      x:
        drone.pos.x +
        (distanceToLineOfIntersection / distToMonsterDest) *
          (fish.guesstimatedNextPos.x - drone.pos.x),
      y:
        drone.pos.y +
        (distanceToLineOfIntersection / distToMonsterDest) *
          (fish.guesstimatedNextPos.y - drone.pos.y),
    };

    const perpendicularDistanceToIntersection = Math.sqrt(
      Math.pow(DRONE_MAX_MOVE_DIST, 2) -
        Math.pow(distanceToLineOfIntersection, 2)
    );
    const offsetX =
      -(fish.guesstimatedNextPos.y - drone.pos.y) *
      (perpendicularDistanceToIntersection / distToMonsterDest);
    const offsetY =
      -(fish.guesstimatedNextPos.x - drone.pos.x) *
      (perpendicularDistanceToIntersection / distToMonsterDest);

    safePositions.push({
      x: Math.floor(midPointOnLineOfIntersection.x + offsetX),
      y: Math.floor(midPointOnLineOfIntersection.y - offsetY),
    });
    safePositions.push({
      x: Math.floor(midPointOnLineOfIntersection.x - offsetX),
      y: Math.floor(midPointOnLineOfIntersection.y + offsetY),
    });
  }

  if (safePositions.length === 0) {
    safePositions.push(initialGuess);
  }

  console.error({safePositions})
  return safePositions[0];
}
