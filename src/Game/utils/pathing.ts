import {
  DRONE_MAX_MOVE_DIST,
  STATIC_SAFETY_RADIUS,
  STEP_RATIO,
} from "../Game.constants";
import { FishId, Vector } from "../Game.types";
import { Drone } from "../drone/Drone";
import { Fish } from "../fish/Fish";

function normalizedAngle(angle: number): number {
  if (angle < 0) angle += 2 * Math.PI; // Normalize angle to [0, 2π]
  return angle;
}

function normalizedAngleFromPos(dest: Vector, pos: Vector): number {
  let angle = Math.atan2(dest.y - pos.y, dest.x - pos.x);
  return normalizedAngle(angle);
}

function closestToTarget(
  target: Vector,
  moves: Vector[],
  drone: Drone
): Vector {
  if (moves.length === 0) {
    return { x: drone.pos.x, y: 0 };
  }

  const scaleToMaxDistPossible = (point: Vector): Vector => {
    const direction = { x: point.x - drone.pos.x, y: point.y - drone.pos.y };
    const magnitude = Math.hypot(direction.x, direction.y);

    return {
      x: drone.pos.x + (direction.x / magnitude) * DRONE_MAX_MOVE_DIST,
      y: drone.pos.y + (direction.y / magnitude) * DRONE_MAX_MOVE_DIST,
    };
  };

  moves.forEach((move) => {
    const destination = scaleToMaxDistPossible(move);
    move.x = destination.x;
    move.y = destination.y;
  });

  let closestDist =
    Math.pow(target.x - moves[0].x, 2) + Math.pow(target.y - moves[0].y, 2);
  let closest = moves[0];

  moves.forEach((move) => {
    const dist =
      Math.pow(target.x - move.x, 2) + Math.pow(target.y - move.y, 2);

    if (dist < closestDist) {
      closest = move;
    }
  });

  return closest;
}

// Assumes intersections exist
function circleIntersections(
  droneMovement: { center: Vector; radius: number },
  safetyLimit: { center: Vector; radius: number }
): Vector[] {
  const distBetweenCenters = Math.hypot(
    droneMovement.center.x - safetyLimit.center.x,
    droneMovement.center.y - safetyLimit.center.y
  );

  if (distBetweenCenters < Math.abs(droneMovement.radius - safetyLimit.radius)) {
    // console.error()
    return (circleIntersections(droneMovement, {center: safetyLimit.center, radius: safetyLimit.radius - 1}))
  }
  const distanceToLineOfIntersection =
    (Math.pow(droneMovement.radius, 2) -
      Math.pow(safetyLimit.radius, 2) +
      Math.pow(distBetweenCenters, 2)) /
    (2 * distBetweenCenters);

  const midPointOnLineOfIntersection = {
    x:
      droneMovement.center.x +
      (distanceToLineOfIntersection / distBetweenCenters) *
        (safetyLimit.center.x - droneMovement.center.x),
    y:
      droneMovement.center.y +
      (distanceToLineOfIntersection / distBetweenCenters) *
        (safetyLimit.center.y - droneMovement.center.y),
  };

  const perpendicularDistanceToIntersection = Math.sqrt(
    Math.pow(droneMovement.radius, 2) -
      Math.pow(distanceToLineOfIntersection, 2)
  );
  const offsetX =
    (safetyLimit.center.y - droneMovement.center.y) *
    (perpendicularDistanceToIntersection / distBetweenCenters);
  const offsetY =
    (safetyLimit.center.x - droneMovement.center.x) *
    (perpendicularDistanceToIntersection / distBetweenCenters);

  return [
    {
      x: midPointOnLineOfIntersection.x + offsetX,
      y: midPointOnLineOfIntersection.y - offsetY,
    },
    {
      x: midPointOnLineOfIntersection.x - offsetX,
      y: midPointOnLineOfIntersection.y + offsetY,
    },
  ];
}

// called only if I already had two directions to choose from
function rotateSafePos(
  safePositions: Vector[], // current best bets
  initialGuessPosition: Vector, // straight line to target
  safeIntersections: Vector[], // new threat avoiding points
  positionToRotate: Vector, // direction to overwrite in safePositions
  drone: Drone
): Vector | null {
    console.error("rotation----->", positionToRotate);
  // build an array of all the potential directions
  const angles: { angle: number; position: Vector }[] = safePositions
    .map((pos) => {
      return {
        angle: normalizedAngleFromPos(pos, drone.pos),
        position: pos,
      };
    })
    .concat(
      safeIntersections.map((pos) => {
        return {
          angle: normalizedAngleFromPos(pos, drone.pos),
          position: pos,
        };
      })
    );

  // include in the array the straight line to target to have a reference
  const initialGuessAngle = normalizedAngleFromPos(
    initialGuessPosition,
    drone.pos
  );
  angles.push({
    angle: initialGuessAngle,
    position: initialGuessPosition,
  });

  // make the straight line the reference
  angles.forEach(
    (value) => (value.angle = normalizedAngle(value.angle - initialGuessAngle))
  );
  // place the straight line at position 0 as the angle will be 0
  angles.sort((a, b) => {
    return a.angle - b.angle;
  });

  let i = 0,
  clockwise = false;
  while (angles[i].position.x !== positionToRotate.x || angles[i].position.y !== positionToRotate.y) {
    console.error(i, positionToRotate, angles[i].position)

    // if I see the other safe position, it mean this position is the first clockwise
    if (safePositions.includes(angles[i].position)) {
        console.error('clockwise------------------')
      clockwise = true;
    }
    i++;
  }

  // if rotating clockwise I take the previous value in the array
  // otherwise, the next value is the closest angle to the one to rotate and opposite to the initial direction
  i += clockwise ? -1 : 1;

  //   console.error("||", { positionToRotate }, angles, i, "||");
  // if I find one of the safe positions it means all new intersection land in danger zone
  if (safePositions.includes(angles[i].position)) {
    return null;
  }
  if (safePositions[0].x === positionToRotate.x && safePositions[0].y === positionToRotate.y) {
    // console.error(
    //   { positionToRotate },
    //   safePositions[0],
    //   angles[i].position,
    //   "rotation-----<"
    // );
    safePositions[0] = angles[i].position;
  } else {
    // console.error(
    //   { positionToRotate },
    //   safePositions[0],
    //   angles[i].position,
    //   "rotation-----<"
    // );
    safePositions[1] = angles[i].position;
  }
  return angles[i].position;
}

function isSafeStep(
  drone: Drone,
  currentlyCheckingPosition: Vector,
  ratio: number,
  monster: Fish
) {
  if (monster.guesstimatedNextPos === undefined) {
    return true;
  }

  const currentCheckDirection = {
    x: currentlyCheckingPosition.x - drone.pos.x,
    y: currentlyCheckingPosition.y - drone.pos.y,
  };
  const currentCheckMagnitude = Math.hypot(
    currentCheckDirection.x,
    currentCheckDirection.y
  );

  // move drone for the step
  const currentPos: Vector = {
    x:
      drone.pos.x +
      (currentCheckDirection.x / currentCheckMagnitude) *
        DRONE_MAX_MOVE_DIST *
        ratio,
    y:
      drone.pos.y +
      (currentCheckDirection.y / currentCheckMagnitude) *
        DRONE_MAX_MOVE_DIST *
        ratio,
  };

  // dist from positions after step
  const distToMonsterGuesstimatedNextPos = Math.hypot(
    monster.guesstimatedNextPos.x - currentPos.x,
    monster.guesstimatedNextPos.y - currentPos.y
  );

  return distToMonsterGuesstimatedNextPos >= STATIC_SAFETY_RADIUS;
}

function updateToSafePosForMonster(
  safePositions: Vector[],
  initialGuessPosition: Vector,
  currentlyCheckingPosition: Vector,
  ratio: number,
  drone: Drone,
  monster: Fish
): Vector | null {
  // console.error("---------Recursion|", currentlyCheckingPosition, ratio)

  // move monster for the step
  monster.guesstimateMove({ratio});

  //   console.error(monster);
  // if the ratio is over 1, we have checked for the max distance possible for the drone
  if (ratio > 1 || monster.guesstimatedNextPos === undefined) {
    return currentlyCheckingPosition;
  }

  // if this step is safe, repeat for the next increment (ratio + STEP_RATIO)
  if (isSafeStep(drone, currentlyCheckingPosition, ratio, monster)) {
    return updateToSafePosForMonster(
      safePositions,
      initialGuessPosition,
      currentlyCheckingPosition,
      ratio + STEP_RATIO,
      drone,
      monster
    );
  }

  console.error("---------|");
  console.error(
    "drone ",
    drone.droneId,
    "|",
    monster.id,
    " !dangerous move: ",
    safePositions,
    { first: initialGuessPosition },
    { current: currentlyCheckingPosition },
    ratio
  );
  // otherwise, compute pos at the intersections of the safety range and the travelled distance
  const safeIntersections: Vector[] = circleIntersections(
    { center: drone.pos, radius: DRONE_MAX_MOVE_DIST * ratio },
    { center: monster.guesstimatedNextPos, radius: STATIC_SAFETY_RADIUS + 10 }
  );
    console.error("--",  safeIntersections );

  if (safePositions.length === 0) {
    safeIntersections.forEach((point) => {
      safePositions.push(point);
    });
    const position1 = safePositions[0];
    const position2 = safePositions[1];

    if (
      // here call border push
      updateToSafePosForMonster(
        safePositions,
        initialGuessPosition,
        position1,
        ratio + STEP_RATIO,
        drone,
        monster
      ) === null
    ) {
      return closestToTarget(initialGuessPosition, [], drone);
    }
    if (
      // here call border push
      updateToSafePosForMonster(
        safePositions,
        initialGuessPosition,
        position2,
        ratio + STEP_RATIO,
        drone,
        monster
      ) === null
    ) {
      return closestToTarget(initialGuessPosition, [], drone);
    }
    return initialGuessPosition;
  }

  // logic of rotating explored boundaries
  const nextDirectionToCheck: Vector | null = rotateSafePos(
    safePositions,
    initialGuessPosition,
    safeIntersections,
    currentlyCheckingPosition,
    drone
  );

  if (nextDirectionToCheck === null) {
    return null;
  }
  // here call border push
  return updateToSafePosForMonster(
    safePositions,
    initialGuessPosition,
    nextDirectionToCheck,
    ratio + STEP_RATIO,
    drone,
    monster
  );
}

function recursiveCheckThrough(
  safePositions: Vector[],
  initialGuessPosition: Vector,
  drone: Drone,
  monsters: Fish[]
): Vector[] | null {
  const previousCheckPositions: Vector[] =
    safePositions.length !== 0
      ? [
          { x: safePositions[0].x, y: safePositions[0].y },
          { x: safePositions[1].x, y: safePositions[1].y },
        ]
      : [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ];

  const monstersAvoided: Fish[] = [];
  //   console.error({ monsters });
  // for each monster we will rotate the initial guess until we have one or two safe spots
  for (const monster of monsters) {
    // if never seen
    if (monster.guesstimatedPos === undefined) {
      continue;
    }

    if (safePositions.length === 0) {
      if (
        updateToSafePosForMonster(
          safePositions,
          initialGuessPosition,
          initialGuessPosition,
          STEP_RATIO,
          drone,
          monster
        ) === null
      ) {
        return null;
      }
    } else {
      const position1 = { x: safePositions[0].x, y: safePositions[0].y };
      const position2 = { x: safePositions[1].x, y: safePositions[1].y };
      if (
        updateToSafePosForMonster(
          safePositions,
          initialGuessPosition,
          position1,
          STEP_RATIO,
          drone,
          monster
        ) === null
      ) {
        return null;
      }
      if (
        updateToSafePosForMonster(
          safePositions,
          initialGuessPosition,
          position2,
          STEP_RATIO,
          drone,
          monster
        ) === null
      ) {
        return null;
      }
    }

    if (
      safePositions.length !== 0 &&
      (previousCheckPositions[0].x !== safePositions[0].x ||
        previousCheckPositions[0].y !== safePositions[0].y ||
        previousCheckPositions[1].x !== safePositions[1].x ||
        previousCheckPositions[1].y !== safePositions[1].y)
    ) {
      monstersAvoided.push(monster);

      previousCheckPositions[0].x = safePositions[0].x;
      previousCheckPositions[0].y = safePositions[0].y;
      previousCheckPositions[1].x = safePositions[1].x;
      previousCheckPositions[1].y = safePositions[1].y;
    }
  }

  if (monstersAvoided.length !== 0) {
    console.error("$$$$$recheck->", {
      previousCheckPositions,
      safePositions,
      droneId: drone.droneId,
    });
    return recursiveCheckThrough(
      safePositions,
      initialGuessPosition,
      drone,
      monsters
    );
  }

  console.error("|||||||||", safePositions);
  return safePositions;
}

// returns the best next pos or vertical to 0 if no safe move is possible
export function computeBestNextPos(
  drone: Drone,
  fishes: Record<FishId, Fish>,
  target: Vector
): Vector {
  console.error("\n\n Computation\n", {
    droneId: drone.droneId,
    // dronePos: drone.pos,
    // target,
  });
  if (drone.pos.x === target.x && drone.pos.y === target.y) {
    return (closestToTarget({ x: 0, y: 0 }, [], drone))
  }
  const safePositions: Vector[] = [];

  const distToTarget = Math.hypot(
    target.x - drone.pos.x,
    target.y - drone.pos.y
  );
  // straight line to next checkpoint or best position if no monsters in the way
  const initialGuessPosition: Vector = {
    x:
      drone.pos.x +
      ((target.x - drone.pos.x) * DRONE_MAX_MOVE_DIST) / distToTarget,
    y:
      drone.pos.y +
      ((target.y - drone.pos.y) * DRONE_MAX_MOVE_DIST) / distToTarget,
  };

  //   console.error(
  //     "next pos for a straight line to target:\n",
  //     initialGuessPosition
  //   );

  // make an array with only copies of the monsters
  let monsters: Fish[] = [];
  for (const fishId in fishes) {
    const fish = fishes[fishId];

    if (fish.detail.type === -1) {
      monsters.push(new Fish(fish.id, fish.detail, fish));
    }
  }

  if (recursiveCheckThrough(safePositions, target, drone, monsters) === null) {
    console.error("damn, null??");
    return closestToTarget({ x: 0, y: 0 }, [], drone);
  }
  console.error("-before checking closest to target: ", { safePositions });

  if (safePositions.length === 0) {
    safePositions.push(initialGuessPosition);
  }

  console.error("before checking closest to target: ", { safePositions });
  console.error("Compute ends\n\n");

  // TODO: redo calculation for immediate next turn to see which one end up closer
  // TODO: guesstimate and move monsters to do next turn calc
  return closestToTarget(target, safePositions, drone);
}
