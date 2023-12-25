import { Creature, FishDetail, FishId, Vector } from "../Game.types";

export class Fish implements Creature {
  id: FishId;
  lastSeenTurn?: number;
  guesstimatePos?: Vector;
  guesstimateSpeed?: Vector;
  detail: FishDetail;
  zone?: number;

  constructor(id: FishId, detail: FishDetail) {
    this.id = id;
    this.detail = detail;
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
