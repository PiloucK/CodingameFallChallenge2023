import { Drone } from "./drone/Drone";
import { Fish } from "./fish/Fish";

export interface Vector {
  x: number;
  y: number;
}

export type Checkpoint = { pos: Vector; unseen: number };

export type Direction = {
  height: -1 | 1; // Top or Bottom
  side: -1 | 1; // Left or Right
};

export type FishId = number;
export type DroneId = number;

export interface FishDetail {
  color: number;
  type: number;
}

export interface Creature {
  id: FishId;
  lastSeenTurn?: number;
  guesstimatedPos?: Vector;
  guesstimatedSpeed?: Vector;
  guesstimatedNextPos?: Vector;
  guesstimatedNextSpeed?: Vector;
  detail: FishDetail;
}

export interface RadarBlip {
  fishId: FishId;
  blipDir: Direction;
}

export interface GameData {
  mapSize: number;
  weightedMap: Uint8ClampedArray; // contains probability of finding a fish
  fishes: Record<FishId, Fish>;
  drones: Record<DroneId, Drone>;
  turn: number;

  // To update each turn
  myScore: number;
  foeScore: number;
  myScans: FishId[]; // saved scans
  foeScans: FishId[]; // saved scans
  myDrones: DroneId[];
  foeDrones: DroneId[];
}
