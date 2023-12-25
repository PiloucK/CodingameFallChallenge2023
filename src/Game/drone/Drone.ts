import { DroneId, FishId, RadarBlip, Vector } from "../Game.types";

export class Drone {
  droneId: DroneId;
  pos: Vector;
  dead: boolean;
  battery: number;
  lastBattery: number; // in order to keep track of foe's light activation
  scans: FishId[]; // fishes scanned but not saved
  blips: RadarBlip[];
  lastBlips: RadarBlip[];
  checkPoints: {pos: Vector, unseen: number}[];
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

  move() {
    let nextCheckPoint = this.checkPoints.find((value) => {return value.unseen})
      const light = this.pos.y < 2000 ? 0
        : this.light !== 0 ? 0
        : 1

      const dist = Math.hypot(
        nextCheckPoint?.pos.x! - this.pos.x,
        nextCheckPoint?.pos.y! - this.pos.y
      )

      if (!nextCheckPoint) {
        if (this.pos.y < 500) {
          this.checkPoints.reverse()
          this.checkPoints.forEach((checkpoint) => {checkpoint.unseen = 1})
        }
        console.log(`MOVE ${this.pos.x} ${0} ${light}`);
      } else {
        if (dist < 1000) {
          nextCheckPoint.unseen = 0
        }
        console.log(`MOVE ${nextCheckPoint?.pos.x} ${nextCheckPoint?.pos.y} ${light}`)
      }
  }
}
