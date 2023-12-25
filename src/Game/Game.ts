import { MAP_SIZE } from "./Game.constants";
import { Direction, FishId, DroneId, GameData, Vector } from "./Game.types";
import { Drone } from "./drone/Drone";
import { Fish, VisibleFish } from "./fish/Fish";

export class Game implements GameData {
  checkPoints: Record<DroneId, {pos: Vector, unseen: number}[]> = {
    0: [{pos: {x: 1560, y: 3750}, unseen: 1}, {pos: {x: 1560, y: 6250}, unseen: 1},
    {pos: {x: 1560, y: 8750}, unseen: 1}, {pos: {x: 4560, y: 8750}, unseen: 1}, {pos: {x: 7560, y: 8750}, unseen: 1}, {pos: {x: 9560, y: 8750}, unseen: 1},
    {pos: {x: 9560, y: 1000}, unseen: 1},],
    1: [{pos: {x: 6560, y: 3750}, unseen: 1}, {pos: {x: 3560, y: 3750}, unseen: 1}, {pos: {x: 3560, y: 6250}, unseen: 1}, {pos: {x: 4560, y: 6250}, unseen: 1}, {pos: {x: 7560, y: 6250}, unseen: 1},]
  }

  mapSize: number = MAP_SIZE;
  weightedMap: Uint8ClampedArray = new Uint8ClampedArray(
    (this.mapSize * this.mapSize) / 100
  ); // contains probability of finding a fish
  fishes: Record<FishId, Fish> = {};
  drones: Record<DroneId, Drone> = {};
  turn: number = 0;

  // To update each turn
  myScore: number = 0;
  foeScore: number = 0;
  myScans: FishId[] = []; // saved scans
  foeScans: FishId[] = []; // saved scans
  myDrones: Set<DroneId> = new Set();
  foeDrones: Set<DroneId> = new Set();

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
      this.myScans.push(fishId);
    }
    const foeScanCount = parseInt(readline());
    for (let i = 0; i < foeScanCount; i++) {
      const fishId = parseInt(readline());
      this.foeScans.push(fishId);
    }

    if (this.turn === 1) {
      const myDroneCount = parseInt(readline());
      for (let i = 0; i < myDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.myDrones.add(droneId);
        this.drones[droneId] = new Drone(
          droneId,
          { x: droneX, y: droneY },
          dead,
          battery
        );
        this.drones[droneId].checkPoints = this.checkPoints[i]
      }
      const foeDroneCount = parseInt(readline());
      for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.foeDrones.add(droneId);
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

  playTurn(): void {
    this.newTurn();
    console.error(this.turn)

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
          { x: fishVx, y: fishVy },
        )
      );

      this.fishes[fishId].guesstimatedPos = { x: fishX, y: fishY }
      this.fishes[fishId].guesstimatedSpeed = { x: fishVx, y: fishVy }
      this.fishes[fishId].lastSeenTurn = this.turn
      this.fishes[fishId].zone = Math.floor(fishY / 2500)
    }

    const myRadarBlipCount = parseInt(readline());
    for (let i = 0; i < myRadarBlipCount; i++) {
      const [_droneId, _fishId, dir] = readline().split(" ");
      const droneId = parseInt(_droneId);
      const fishId = parseInt(_fishId);
      this.drones[droneId].blips.push({ fishId, dir: dir as Direction });
    }

    this.updateMonsterPos()

    for (const droneId of this.myDrones) {
    //   this.estimateMonsterPos()
      this.drones[droneId].move(this.fishes)
    }

    this.endTurn()
  }

  // move monster
  // TODO: take into account potential monster collisions and foe chasing
  updateMonsterPos() {
    for (const fishId in this.fishes) {
        if (this.fishes[fishId].detail.type === -1) {
            this.fishes[fishId].move()
        }
    }
  }

  // make fishes guesstimatedPos = gesstimatedNextPos 
  // if they are visible on the next turn it will be overwritten
  endTurn() {
    for (const fishId in this.fishes) {
        let fish = this.fishes[fishId]

        if (fish.detail.type ===  -1) {
            fish.saveGuesstimates(this.turn)
        }
    }
  }
}
