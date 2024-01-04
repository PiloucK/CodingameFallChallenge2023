import { Checkpoint, DroneId, FishId, RadarBlip, Vector } from "../Game.types";
import { Fish } from "../fish/Fish";
import { computeBestNextPos } from "../utils/pathing";

export class Drone {
  droneId: DroneId;
  pos: Vector;
  previousPos: Vector;
  dead: boolean;
  battery: number;
  lastBattery: number; // in order to keep track of foe's light activation
  scans: FishId[]; // fishes scanned but not saved
  blips: RadarBlip[];
  lastBlips: RadarBlip[];
  checkPoints: Checkpoint[];
  light: number;
  shouldAscend: boolean;

  constructor(id: DroneId, pos: Vector, dead: number, battery: number) {
    this.droneId = id;
    this.pos = pos;
    this.previousPos = {x: 0, y: 0}
    this.dead = dead !== 0;
    this.battery = battery;
    this.lastBattery = 30; // battery at start
    this.scans = [];
    this.blips = [];
    this.lastBlips = [];
    this.checkPoints = [];
    this.light = 0;
    this.shouldAscend = false;
  }

  update(pos: Vector, dead: number, battery: number) {
    this.previousPos = {x: this.pos.x, y: this.pos.y};
    this.pos = pos;
    this.dead = dead !== 0;
    this.lastBattery = this.battery;
    this.battery = battery;
    this.lastBlips = this.blips;
    this.blips = [];
  }

  move(fishes: Record<FishId, Fish>) {
    if (this.dead) {
      console.log("WAIT 1");
      this.scans = [];
      return;
    }

    let nextCheckPoint = this.checkPoints.find((value) => {
      return value.unseen;
    });

    // TODO: better light decision
    this.light = this.pos.y < 2000 ? 0 : this.light !== 0 ? 0 : 1;

    if (!nextCheckPoint) {
      const nextPos: Vector = computeBestNextPos(this, fishes, {
        x: this.pos.x,
        y: 0,
      });
      console.log(
        `MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`
      );
    } else {
      const nextPos: Vector = computeBestNextPos(
        this,
        fishes,
        nextCheckPoint.pos
      );

      console.log(
        `MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`
      );
    }
  }
}
