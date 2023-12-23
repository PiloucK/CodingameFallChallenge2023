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
          this.turn
        )
      );
    }

    const myRadarBlipCount = parseInt(readline());
    for (let i = 0; i < myRadarBlipCount; i++) {
      const [_droneId, _fishId, dir] = readline().split(" ");
      const droneId = parseInt(_droneId);
      const fishId = parseInt(_fishId);
      this.drones[droneId].blips.push({ fishId, dir: dir as Direction });
    }

    // Implement the strategy for each turn
    // Example: Move drone, scan creatures, update scores
    for (const droneId of this.myDrones) {
      let nextCheckPoint = this.drones[droneId].checkPoints.find((value) => {return value.unseen})
      const light = this.turn % 6 - 5 === 0 ? 1 : 0;

      const dist = Math.hypot(
        nextCheckPoint?.pos.x! - this.drones[droneId].pos.x,
        nextCheckPoint?.pos.y! - this.drones[droneId].pos.y
      )

      if (!nextCheckPoint) {
        if (this.drones[droneId].pos.y < 500) {
          this.drones[droneId].checkPoints.reverse()
          this.drones[droneId].checkPoints.forEach((checkpoint) => {checkpoint.unseen = 1})
        }
        console.log(`MOVE ${this.drones[droneId].pos.x} ${0} ${light}`);
      } else {
        if (dist < 1000) {
          nextCheckPoint.unseen = 0
        }
        console.log(`MOVE ${nextCheckPoint?.pos.x} ${nextCheckPoint?.pos.y} ${light}`)
      }
    }
  }

  // Additional methods as needed, e.g., for pathfinding, decision-making
}
