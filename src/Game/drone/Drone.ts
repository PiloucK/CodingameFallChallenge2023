import { game } from "../../main";
import { STATIC_SAFETY_RADIUS } from "../Game.constants";
import { Checkpoint, DroneId, FishId, RadarBlip, Vector } from "../Game.types";
import { Fish } from "../fish/Fish";
import { boxFurthestCorner, squaredDistance } from "../utils/boxing";
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
  shouldStayAbove: boolean;
  shouldAscend: boolean;
  baseImpactStimate: number;
  safetyRadius: number;

  constructor(id: DroneId, pos: Vector, dead: number, battery: number) {
    this.droneId = id;
    this.pos = pos;
    this.previousPos = { x: 0, y: 0 };
    this.dead = dead !== 0;
    this.battery = battery;
    this.lastBattery = 30; // battery at start
    this.scans = [];
    this.blips = [];
    this.lastBlips = [];
    this.checkPoints = [];
    this.light = 0;
    this.shouldStayAbove = false;
    this.baseImpactStimate = 0;
    this.shouldAscend = false;
    this.safetyRadius = STATIC_SAFETY_RADIUS;
  }

  update(pos: Vector, dead: number, battery: number) {
    this.previousPos = { x: this.pos.x, y: this.pos.y };
    this.pos = pos;
    this.dead = dead !== 0;
    this.lastBattery = this.battery;
    this.battery = battery;
    this.scans = [];
    this.lastBlips = this.blips;
    this.blips = [];
    this.baseImpactStimate = 0;
    this.safetyRadius = STATIC_SAFETY_RADIUS;
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
    const getLightValue = (nextPos: Vector) => {
      const captures = new Set([
        ...game.drones[game.myDrones[0]].scans,
        ...game.drones[game.myDrones[1]].scans,
      ]);
      if (
        game.firstDescent &&
        nextPos.y > 5000 - 600 &&
        this.pos.y < 5000 &&
        captures.size < 2
      ) {
        this.light = 1;
        return;
      }

      Object.values(fishes).forEach((fish) => {
        if (fish.lastBlipTurn !== game.turn) {
          return;
        } else if (game.myScans.includes(fish.id)) {
          return;
        } else if (game.drones[game.myDrones[0]].scans.includes(fish.id)) {
          return;
        } else if (game.drones[game.myDrones[1]].scans.includes(fish.id)) {
          return;
        }

        const furthestCorner = boxFurthestCorner(nextPos, fish.box);
        const distToCorner = Math.hypot(
          nextPos.x - furthestCorner.x,
          nextPos.y - furthestCorner.y
        );
        console.error("light eval:", {
          id: this.droneId,
          fishId: fish.id,
          distToCorner,
          furthestCorner,
        });

        if (
          distToCorner >=
          Math.hypot(
            this.pos.x - furthestCorner.x,
            this.pos.y - furthestCorner.y
          )
        ) {
          return;
        }

        // TODO: find a condition to light depending on monster info
        if (fish.detail.type === 0) {
          if (distToCorner < 2000) {
            // console.error("close enough:", {
            //   id: this.droneId,
            //   fishId: fish.id,
            //   distToCorner,
            //   furthestCorner,
            // });
            this.light = 1;
          }
        } else if (fish.detail.type === 1) {
          if (
            distToCorner < 2600 &&
            (!game.firstDescent || this.battery >= 25)
          ) {
            // console.error("close enough:", {
            //   id: this.droneId,
            //   fishId: fish.id,
            //   distToCorner,
            //   furthestCorner,
            // });
            this.light = 1;
          }
        } else if (fish.detail.type === 2) {
          if (distToCorner < 4600) {
            // console.error("close enough:", {
            //   id: this.droneId,
            //   fishId: fish.id,
            //   distToCorner,
            //   furthestCorner,
            // });
            this.light = 1;
          }
        }
      });
    };

    this.light = 0;
    if (!nextCheckPoint) {
      const nextPos: Vector = computeBestNextPos(this, fishes, {
        x: this.pos.x,
        y: 0,
      });

      getLightValue(nextPos);
      //   this.light = this.pos.y < 2000 ? 0 : this.light !== 0 ? 0 : 1;

      console.log(
        `MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`
      );
    } else {
      const nextPos: Vector = computeBestNextPos(
        this,
        fishes,
        nextCheckPoint.pos
      );

      getLightValue(nextPos);
      //   this.light = this.pos.y < 2000 ? 0 : this.light !== 0 ? 0 : 1;

      console.log(
        `MOVE ${Math.floor(nextPos.x)} ${Math.floor(nextPos.y)} ${this.light}`
      );
    }
  }
}
