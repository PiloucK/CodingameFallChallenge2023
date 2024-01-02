import { MAP_SIZE } from "./Game.constants";
import { FishId, DroneId, GameData, Checkpoint } from "./Game.types";
import { Drone } from "./drone/Drone";
import { Fish, VisibleFish } from "./fish/Fish";
import { boxBoundSize } from "./utils/boxing";

export class Game implements GameData {
  mapSize: number = MAP_SIZE;
  weightedMap: Uint8ClampedArray = new Uint8ClampedArray(
    (this.mapSize * this.mapSize) / 100
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
    let leftMostDrone: Drone = this.drones[this.myDrones[0]];
    let rightMostDrone: Drone = this.drones[this.myDrones[1]];

    // switch drones if the left most drone is on the right
    if (leftMostDrone.pos.x > rightMostDrone.pos.x) {
      [leftMostDrone, rightMostDrone] = [rightMostDrone, leftMostDrone];
    }

    // ensure number of blips is same between drones
    // boxes will be valid even if a drone doesn't receive blips
    if (leftMostDrone.dead) {
      leftMostDrone.pos = rightMostDrone.pos;
      leftMostDrone.blips = rightMostDrone.blips;
    }
    if (rightMostDrone.dead) {
      rightMostDrone.pos = leftMostDrone.pos;
      rightMostDrone.pos = leftMostDrone.pos;
    }

    for (let i = 0; i < leftMostDrone.blips.length; ++i) {
      const leftBlip = leftMostDrone.blips[i];
      const rightBlip = rightMostDrone.blips[i];
      const boxYPosRefComparison =
        leftMostDrone.pos.y > rightMostDrone.pos.y &&
        leftBlip.blipDir.height === rightBlip.blipDir.height
          ? Math.min
          : Math.max;
      const boxSizeYDirRef =
        leftMostDrone.pos.y > rightMostDrone.pos.y ||
        leftBlip.blipDir.height === rightBlip.blipDir.height
          ? leftBlip
          : rightBlip;

      const fish = this.fishes[leftBlip.fishId];

      if (fish.lastSeenTurn === this.turn - 1) {
        fish.box = {
          pos: {
            x: fish.guesstimatedPos?.x! + fish.guesstimatedSpeed?.x!,
            y: fish.guesstimatedPos?.y! + fish.guesstimatedSpeed?.y!,
          },
          size: { x: 0, y: 0 },
        };
      } else if (fish.lastSeenTurn === this.turn) {
        fish.box = {
          pos: {
            x: fish.guesstimatedPos?.x!,
            y: fish.guesstimatedPos?.y!,
          },
          size: { x: 0, y: 0 },
        };
      } else if (fish.lastBlipTurn === this.turn) {
        const boxStart = {
          x: Math.abs(
            Math.max(
              leftMostDrone.pos.x * leftBlip.blipDir.side,
              rightMostDrone.pos.x * rightBlip.blipDir.side
            )
          ),
          y: Math.abs(
            boxYPosRefComparison(
              leftMostDrone.pos.y * leftBlip.blipDir.height,
              rightMostDrone.pos.y * rightBlip.blipDir.height
            )
          ),
        };
        fish.box = {
          pos: boxStart,
          size: {
            x: boxBoundSize(
              [0, leftMostDrone.pos.x, rightMostDrone.pos.x, MAP_SIZE - 1],
              boxStart.x,
              leftBlip.blipDir.side,
              this.useSymetry
            ),
            y: boxBoundSize(
              [0, leftMostDrone.pos.y, rightMostDrone.pos.y, MAP_SIZE - 1],
              boxStart.y,
              boxSizeYDirRef.blipDir.height,
              this.useSymetry
            ),
          },
        };
      }
    }

    // for (const fish of Object.values(this.fishes)) {
    //   console.error({ id: fish.id, box: fish.box });
    // }
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

      // const symetricLimit = 5000 - otherDrone?.pos.x! - 5000;

      // reset if reached save range
      if (drone.pos.y < 500) {
        drone.checkPoints = [];
      }

      // if (drone.checkPoints.length === 0) {
      //   if (drone.droneId === 0 || drone.droneId === 1) {
      //     drone.checkPoints.push({
      //       pos: { x: drone.pos.x, y: 8500 },
      //       unseen: 1,
      //     });
      //   } else {
      //     drone.checkPoints.push({
      //       pos: { x: drone.pos.x < 5000 ? 2300 : 7700, y: 8500 },
      //       unseen: 1,
      //     });
      //   }
      // }

      // TODO: handle too close centers
      let closestBoxCenter: Checkpoint | undefined = undefined;
      let shortestDist: number = Infinity;
      for (const fish of Object.values(this.fishes)) {
        if (fish.detail.type === -1) {
          continue
        } else if (fish.lastBlipTurn !== this.turn) {
          continue;
        } else if (this.myScans.includes(fish.id)) {
          continue;
        } else if (drone.scans.includes(fish.id) || otherDrone?.scans.includes(fish.id)) {
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

      console.error({droneId: drone.droneId}, drone.checkPoints)
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
            ? { height: -1, side: -1 }
            : dir === "TR"
            ? { height: -1, side: 1 }
            : dir === "BR"
            ? { height: 1, side: 1 }
            : { height: 1, side: -1 },
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

      if (fish.detail.type === -1) {
        fish.guesstimateMove();
        fish.move(this.turn);
      }
    }
  }
}
