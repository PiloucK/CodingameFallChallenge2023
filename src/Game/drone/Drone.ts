import { DroneId, FishId, GameData, RadarBlip, Vector } from "../Game.types";

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

  move(fishes: Pick<GameData, 'fishes'>) {
    let nextCheckPoint = this.checkPoints.find((value) => {
      return value.unseen;
    });
    this.light = this.pos.y < 2000 ? 0 : this.light !== 0 ? 0 : 1;

    if (!nextCheckPoint) {
      if (this.pos.y < 500) {
        this.checkPoints.reverse();
        this.checkPoints.forEach((checkpoint) => {
          checkpoint.unseen = 1;
        });
        this.move(fishes); // go to the next checkpoint if the scans got saved
      } else {
        console.log(`MOVE ${this.pos.x} ${0} ${this.light}`);
      }
    } else {
      const distToCheckpoint = Math.hypot(
        nextCheckPoint.pos.x - this.pos.x,
        nextCheckPoint.pos.y - this.pos.y
      );

      const speed: Vector = {
        x: Math.floor(((nextCheckPoint.pos.x - this.pos.x) * 600) / distToCheckpoint),
        y: Math.floor(((nextCheckPoint.pos.y - this.pos.y) * 600) / distToCheckpoint),
      };

      if (distToCheckpoint < 1000) {
        nextCheckPoint.unseen = 0;
      }
      console.log(
        `MOVE ${this.pos.x + speed.x} ${this.pos.y + speed.y} ${this.light}`
      );
    }
  }
}
