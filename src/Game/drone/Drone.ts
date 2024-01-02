import { DroneId, FishId, RadarBlip, Vector } from "../Game.types";
import { Fish } from "../fish/Fish";
import { computeBestNextPos } from "../utils/pathing";

export class Drone {
  droneId: DroneId;
  pos: Vector;
  dead: boolean;
  battery: number;
  lastBattery: number; // in order to keep track of foe's light activation
  scans: FishId[]; // fishes scanned but not saved
  blips: RadarBlip[];
  lastBlips: RadarBlip[];
  checkPoints: { pos: Vector; unseen: number }[];
  light: number;

  constructor(id: DroneId, pos: Vector, dead: number, battery: number) {
    this.droneId = id;
    this.pos = pos;
    this.dead = dead !== 0;
    this.battery = battery;
    this.lastBattery = 30; // battery at start
    this.scans = [];
    this.blips = [];
    this.lastBlips = [];
    this.checkPoints = [];
    this.light = 0;
  }

  update(pos: Vector, dead: number, battery: number) {
    this.pos = pos;
    this.dead = dead !== 0;
    this.lastBattery = this.battery;
    this.battery = battery;
    this.lastBlips = this.blips;
    this.blips = [];
  }

  move(fishes: Record<FishId, Fish>) {
    if (this.dead) {
        console.log('WAIT 1')
        return
    }

    let nextCheckPoint = this.checkPoints.find((value) => {
      return value.unseen;
    });

    // TODO: better light decision
    this.light = this.pos.y < 2000 ? 0 : this.light !== 0 ? 0 : 1;

    if (!nextCheckPoint) {
      if (this.pos.y < 500) {
        this.checkPoints.reverse();
        this.checkPoints.forEach((checkpoint) => {
          checkpoint.unseen = 1;
        });
        this.move(fishes); // go to the next checkpoint if the scans got saved
      } else {
        const nextPos: Vector = computeBestNextPos(
          this,
          fishes,
          {x: this.pos.x, y: 0}
        );
        console.log(`MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`);
      }
    } else {
      const nextPos: Vector = computeBestNextPos(
        this,
        fishes,
        nextCheckPoint.pos
      );

      // if after mooving i'm closer than 400 from the checkpoint, I consider it visited
      // it allows me to always move from at least 400
      if (
        Math.hypot(
          nextCheckPoint.pos.x - nextPos.x,
          nextCheckPoint.pos.y - nextPos.y
        ) < 400
      ) {
        nextCheckPoint.unseen = 0;
      }

      console.log(
        `MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`
      );
    }
  }

  updateCheckpoints() {
    if (this.checkPoints.length === 0) {
      if (this.droneId === 0 || this.droneId === 1) {
        this.checkPoints.push({ pos: { x: this.pos.x, y: 8500 }, unseen: 1 });
      } else {
        this.checkPoints.push({
          pos: { x: this.pos.x < 5000 ? 2300 : 7700, y: 8500 },
          unseen: 1,
        });
      }
    }
  }
}
