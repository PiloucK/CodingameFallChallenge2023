import { FISH_HABITAT, MAP_SIZE } from "../Game.constants";
import { Creature, FishDetail, FishId, Vector } from "../Game.types";

export class Fish implements Creature {
  id: FishId;
  lastSeenTurn?: number = undefined;
  guesstimatedPos?: Vector = undefined;
  guesstimatedSpeed?: Vector = undefined;
  guesstimatedNextPos?: Vector = undefined;
  guesstimatedNextSpeed?: Vector = undefined;
  detail: FishDetail;
  box: { pos: Vector; size: Vector } = {
    pos: { x: 0, y: 2500 },
    size: { x: MAP_SIZE, y: MAP_SIZE - 2500 },
  };
  lastBlipTurn: number = 0;

  constructor(id: FishId, detail: FishDetail, fish?: Fish) {
    this.id = id;
    this.detail = detail;
    if (fish) {
      this.guesstimatedPos = fish.guesstimatedPos;
      this.guesstimatedSpeed = fish.guesstimatedSpeed;
      // if seen, initialize the values
      this.guesstimatedNextPos = fish.guesstimatedPos;
      this.guesstimatedNextSpeed = fish.guesstimatedSpeed;
      this.lastSeenTurn = fish.lastSeenTurn;
    }
  }

  // move monsters
  // TODO: take into account potential monsters collisions and foe chasing
  guesstimateMove({ratio, postBoundCheck = false, turn = 0}: {ratio?: number, postBoundCheck?: boolean, turn?: number}) {
    if (
      this.guesstimatedSpeed === undefined ||
      this.guesstimatedPos === undefined
    ) {
      return
    }

    if (ratio === undefined) {
      ratio = 1;
    }

    this.guesstimatedNextPos = {
      x: this.guesstimatedPos.x + this.guesstimatedSpeed.x * ratio,
      y: this.guesstimatedPos.y + this.guesstimatedSpeed.y * ratio,
    };
    this.guesstimatedNextSpeed = this.guesstimatedSpeed;

    if (postBoundCheck === false) {
        return
    }
    // fails over 2500 as the intersection between monster dir and drone dir is calculated before rebound
    // maybe solved by checking monster pos and calculate intersections again at ratio 1 but after rebound
    if (
      this.guesstimatedNextPos.x <= 0 ||
      this.guesstimatedNextPos.x >= MAP_SIZE - 1
    ) {
      this.guesstimatedNextSpeed.x *= -1; // Reverse the horizontal direction
      this.guesstimatedNextPos.x =
        this.guesstimatedPos.x + this.guesstimatedNextSpeed.x * ratio; // snap to fish zone
    }

    if (
      this.guesstimatedNextPos.y <= FISH_HABITAT[this.detail.type][-1] ||
      this.guesstimatedNextPos.y >= FISH_HABITAT[this.detail.type][1]
    ) {
      this.guesstimatedNextSpeed.y *= -1; // Reverse the vertical direction
      this.guesstimatedNextPos.y =
        this.guesstimatedPos.y + this.guesstimatedNextSpeed.y * ratio; // Recompute the y position after bounce
    }
  }

  // make sure to guesstimate before
  move(turn: number) {
    if (
      this.guesstimatedNextPos === undefined ||
      this.guesstimatedNextSpeed === undefined
    ) {
      return;
    }

    this.guesstimatedPos = this.guesstimatedNextPos;
    this.guesstimatedSpeed = this.guesstimatedNextSpeed;

    // half the speed for the next turn. if visible, it will be reset, if not, it will not be halved again
    if (this.detail.type === -1 && this.lastSeenTurn === turn) {
      this.guesstimatedSpeed.x = Math.floor(this.guesstimatedSpeed.x / 2);
      this.guesstimatedSpeed.y = Math.floor(this.guesstimatedSpeed.y / 2);
    } else if (this.lastSeenTurn === turn - 3) {
      this.guesstimatedPos = undefined;
      this.guesstimatedSpeed = undefined;
      this.guesstimatedNextPos = undefined;
      this.guesstimatedNextSpeed = undefined;
    }
  }
}

export class VisibleFish implements Pick<Creature, "id" | "detail"> {
  id: FishId;
  detail: FishDetail;
  pos: Vector;
  speed: Vector;

  constructor(fish: Fish, pos: Vector, speed: Vector) {
    this.id = fish.id;
    this.detail = fish.detail;
    this.pos = pos;
    this.speed = speed;
  }
}
