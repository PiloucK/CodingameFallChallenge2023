import { MAP_SIZE } from "../Game.constants";
import { Creature, FishDetail, FishId, Vector } from "../Game.types";

export class Fish implements Creature {
  id: FishId;
  lastSeenTurn?: number = undefined;
  guesstimatedPos?: Vector = undefined;
  guesstimatedSpeed?: Vector = undefined;
  guesstimatedNextPos?: Vector = undefined;
  guesstimatedNextSpeed?: Vector = undefined;
  detail: FishDetail;
  zone?: number;

  constructor(id: FishId, detail: FishDetail) {
    this.id = id;
    this.detail = detail;
  }


  // move monsters
  // TODO: take into account potential monsters collisions and foe chasing
  move() {
    if (this.guesstimatedSpeed === undefined ||
        this.guesstimatedPos === undefined) {
        return
    }

    this.guesstimatedNextPos = {
        x: this.guesstimatedPos.x + this.guesstimatedSpeed.x,
        y: this.guesstimatedPos.y + this.guesstimatedSpeed.y
    }
    this.guesstimatedNextSpeed = this.guesstimatedSpeed

    if (this.guesstimatedNextPos.x <= 0 || this.guesstimatedNextPos.x >= MAP_SIZE) {
        this.guesstimatedNextSpeed.x *= -1; // Reverse the horizontal direction
        this.guesstimatedNextPos.x = this.guesstimatedPos.x + this.guesstimatedSpeed.x; // Recompute the x position after bounce
    }

    if (this.guesstimatedNextPos.y <= 5000 || this.guesstimatedNextPos.y >= MAP_SIZE) {
        this.guesstimatedNextSpeed.y *= -1; // Reverse the vertical direction
        this.guesstimatedNextPos.y = this.guesstimatedPos.y + this.guesstimatedSpeed.y; // Recompute the y position after bounce
    }
  }

  saveGuesstimates(turn: number) {
    console.error(this)

    if (this.guesstimatedNextPos === undefined ||
        this.guesstimatedNextSpeed === undefined) {
            return
        }

    this.guesstimatedPos = this.guesstimatedNextPos
    this.guesstimatedSpeed = this.guesstimatedNextSpeed

    // if not visible last turn, the monster has a speed divided by 2
    if (this.detail.type === -1 && this.lastSeenTurn !== turn) {
        this.guesstimatedSpeed.x = Math.floor(this.guesstimatedSpeed.x / 2)
        this.guesstimatedSpeed.y = Math.floor(this.guesstimatedSpeed.y / 2)
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
