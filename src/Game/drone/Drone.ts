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
  }

  update(pos: Vector, dead: number, battery: number) {
    this.pos = pos;
    this.dead = dead !== 0;
    this.lastBattery = this.battery;
    this.battery = battery;
    this.lastBlips = this.blips;
    this.blips = [];
  }
}
