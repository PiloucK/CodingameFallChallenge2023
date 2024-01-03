import { FISH_HABITAT, MAP_SIZE } from "./Game.constants";
import {
  FishId,
  DroneId,
  GameData,
  Checkpoint,
  Vector,
  Direction,
} from "./Game.types";
import { Drone } from "./drone/Drone";
import { Fish, VisibleFish } from "./fish/Fish";
import { boxBoundSize } from "./utils/boxing";

export class Game implements GameData {
  weightedMap: Uint8ClampedArray = new Uint8ClampedArray(
    (MAP_SIZE * MAP_SIZE) / 100
  ); // contains probability of finding a fish
  fishes: Record<FishId, Fish> = {};
  drones: Record<DroneId, Drone> = {};
  turn: number = 0;
  useSymetry: boolean = true;

  // To update each turn
  myScore: number = 0;
  foeScore: number = 0;
  myScans: FishId[] = []; // saved scans
  foeScans: FishId[] = []; // saved scans
  myDrones: DroneId[] = [];
  foeDrones: DroneId[] = [];

  constructor() {
    const fishCount = parseInt(readline());

    for (let i = 0; i < fishCount; i++) {
      const [fishId, color, type] = readline().split(" ").map(Number);
      this.fishes[fishId] = new Fish(fishId, { color, type });
    }
  }

  private newTurn() {
    this.turn++;
    // get fishes scanned this last turn
    this.myScore = parseInt(readline());
    this.foeScore = parseInt(readline());

    const myScanCount = parseInt(readline());
    for (let i = 0; i < myScanCount; i++) {
      const fishId = parseInt(readline());
      if (this.fishes[fishId].detail.type === 2) {
        this.useSymetry = false;
      }
      this.myScans.push(fishId);
    }
    const foeScanCount = parseInt(readline());
    for (let i = 0; i < foeScanCount; i++) {
      const fishId = parseInt(readline());
      if (this.fishes[fishId].detail.type === 2) {
        this.useSymetry = false;
      }
      this.foeScans.push(fishId);
    }

    if (this.turn === 1) {
      const myDroneCount = parseInt(readline());
      for (let i = 0; i < myDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.myDrones.push(droneId);
        this.drones[droneId] = new Drone(
          droneId,
          { x: droneX, y: droneY },
          dead,
          battery
        );
        // console.error('____', this.drones[droneId], this.checkPoints)
        // this.drones[droneId].checkPoints = this.checkPoints[droneId];
        this.drones[droneId].checkPoints = [];
      }
      const foeDroneCount = parseInt(readline());
      for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.foeDrones.push(droneId);
        this.drones[droneId] = new Drone(
          droneId,
          { x: droneX, y: droneY },
          dead,
          battery
        );
      }
    } else {
      const myDroneCount = parseInt(readline());
      for (let i = 0; i < myDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.drones[droneId].update({ x: droneX, y: droneY }, dead, battery);
      }
      const foeDroneCount = parseInt(readline());
      for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.drones[droneId].update({ x: droneX, y: droneY }, dead, battery);
      }
    }

    const droneScanCount = parseInt(readline());
    for (let i = 0; i < droneScanCount; i++) {
      const [droneId, fishId] = readline().split(" ").map(Number);
      this.drones[droneId].scans.push(fishId);
    }
  }

  // set boxes in which the fishes should be
  fishtimate() {
    let firstDrone: Drone = this.drones[this.myDrones[0]];
    let secondDrone: Drone = this.drones[this.myDrones[1]];

    // ensure number of blips is same between drones
    // boxes will be valid even if a drone doesn't receive blips
    if (firstDrone.dead) {
      firstDrone.pos = secondDrone.pos;
      firstDrone.blips = secondDrone.blips;
    } else if (secondDrone.dead) {
      secondDrone.pos = firstDrone.pos;
      secondDrone.pos = firstDrone.pos;
    }

    for (let i = 0; i < firstDrone.blips.length; ++i) {
      const fish = this.fishes[firstDrone.blips[i].fishId];

      // skip scanned and gone fishes
      if (
        fish.lastBlipTurn !== this.turn ||
        fish.lastSeenTurn! >= this.turn - 1
      ) {
        continue;
      }

      const topLeftBlip: { pos: Vector; dir: Direction } = {
        pos: { x: firstDrone.pos.x, y: firstDrone.pos.y },
        dir: {
          x: firstDrone.blips[i].blipDir.x,
          y: firstDrone.blips[i].blipDir.y,
        },
      };
      const bottomRightBlip: { pos: Vector; dir: Direction } = {
        pos: { x: secondDrone.pos.x, y: secondDrone.pos.y },
        dir: {
          x: secondDrone.blips[i].blipDir.x,
          y: secondDrone.blips[i].blipDir.y,
        },
      };

      if (firstDrone.pos.x > secondDrone.pos.x) {
        [topLeftBlip.pos.x, bottomRightBlip.pos.x] = [
          bottomRightBlip.pos.x,
          topLeftBlip.pos.x,
        ];
      }
      if (firstDrone.pos.y > secondDrone.pos.y) {
        [topLeftBlip.pos.y, bottomRightBlip.pos.y] = [
          bottomRightBlip.pos.y,
          topLeftBlip.pos.y,
        ];
      }

      const boxStart = {
        x: Math.abs(
          Math.max(
            firstDrone.pos.x * topLeftBlip.dir.x,
            secondDrone.pos.x * bottomRightBlip.dir.x
          )
        ),
        y: Math.abs(
          Math.max(
            firstDrone.pos.y * topLeftBlip.dir.y,
            secondDrone.pos.y * bottomRightBlip.dir.y,
            FISH_HABITAT[fish.detail.type][-topLeftBlip.dir.y] *
              topLeftBlip.dir.y
          )
        ),
      };
      fish.box = {
        pos: boxStart,
        size: {
          x: boxBoundSize(
            [0, boxStart.x, firstDrone.pos.x, secondDrone.pos.x, MAP_SIZE],
            boxStart.x,
            topLeftBlip.dir.x,
            false
          ),
          y: boxBoundSize(
            [
              0,
              boxStart.y,
              firstDrone.pos.y,
              secondDrone.pos.y,
              FISH_HABITAT[fish.detail.type][topLeftBlip.dir.y],
              MAP_SIZE,
            ],
            boxStart.y,
            topLeftBlip.dir.y,
            this.useSymetry
          ),
        },
      };
    }

    for (const fish of Object.values(this.fishes)) {
      console.error({ id: fish.id, box: fish.box });
    }
  }

  updateDroneCheckpoints() {
    this.fishtimate();
    for (const droneId of this.myDrones) {
      const drone = this.drones[droneId];

      let otherDrone;
      for (const id of this.myDrones) {
        if (id !== droneId) {
          otherDrone = this.drones[id];
        }
      }

      // reset if reached save range
      if (drone.pos.y < 500) {
        drone.checkPoints = [];
      }

      // TODO: handle too close centers
      let closestBoxCenter: Checkpoint | undefined = undefined;
      let shortestDist: number = Infinity;
      for (const fish of Object.values(this.fishes)) {
        if (fish.detail.type === -1) {
          continue;
        } else if (fish.lastBlipTurn !== this.turn) {
          continue;
        } else if (this.myScans.includes(fish.id)) {
          continue;
        } else if (
          drone.scans.includes(fish.id) ||
          otherDrone?.scans.includes(fish.id)
        ) {
          continue;
        }

        const boxCenter = {
          x: fish.box.pos.x + fish.box.size.x / 2,
          y: fish.box.pos.y + fish.box.size.y / 2,
        };
        const distToDrone =
          Math.pow(boxCenter.x - drone.pos.x, 2) +
          Math.pow(boxCenter.y - drone.pos.y, 2);

        if (distToDrone < shortestDist) {
          shortestDist = distToDrone;
          closestBoxCenter = {
            pos: { x: boxCenter.x, y: boxCenter.y },
            unseen: 1,
          };
        }
      }

      if (closestBoxCenter) {
        drone.checkPoints = [closestBoxCenter];
      } else {
        drone.checkPoints = [{ pos: { x: drone.pos.x, y: 0 }, unseen: 1 }];
      }

      console.error({ droneId: drone.droneId }, drone.checkPoints);
    }
  }

  playTurn(): void {
    this.newTurn();
    console.error(this.turn);

    const visibleFishes: VisibleFish[] = [];

    const visibleFishCount = parseInt(readline());
    for (let i = 0; i < visibleFishCount; i++) {
      const [fishId, fishX, fishY, fishVx, fishVy] = readline()
        .split(" ")
        .map(Number);
      visibleFishes.push(
        new VisibleFish(
          this.fishes[fishId],
          { x: fishX, y: fishY },
          { x: fishVx, y: fishVy }
        )
      );

      this.fishes[fishId].guesstimatedPos = { x: fishX, y: fishY };
      this.fishes[fishId].guesstimatedSpeed = { x: fishVx, y: fishVy };
      this.fishes[fishId].lastSeenTurn = this.turn;

      // TODO: init fish box and estimate next pos
      this.fishes[fishId].box = {
        pos: { x: fishX, y: fishY },
        size: { x: 0, y: 0 },
      };
    }

    const myRadarBlipCount = parseInt(readline());
    for (let i = 0; i < myRadarBlipCount; i++) {
      const [_droneId, _fishId, dir] = readline().split(" ");
      const droneId = parseInt(_droneId);
      const fishId = parseInt(_fishId);
      this.drones[droneId].blips.push({
        fishId,
        blipDir:
          dir === "TL"
            ? { y: -1, x: -1 }
            : dir === "TR"
            ? { y: -1, x: 1 }
            : dir === "BR"
            ? { y: 1, x: 1 }
            : { y: 1, x: -1 },
      });
      this.fishes[fishId].lastBlipTurn = this.turn;
    }

    this.updateDroneCheckpoints();

    for (const droneId of this.myDrones) {
      this.drones[droneId].move(this.fishes);
    }

    this.endTurn();
  }

  // make fishes guesstimatedPos = gesstimatedNextPos
  // if they are visible on the next turn it will be overwritten
  endTurn() {
    for (const fishId in this.fishes) {
      let fish = this.fishes[fishId];

      fish.guesstimateMove({postBoundCheck: true, turn: this.turn});
      fish.move(this.turn);
    }
  }
}
