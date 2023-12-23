import { Drone } from "./drone/Drone";
import { Fish } from "./fish/Fish";

export interface Vector {
  x: number;
  y: number;
}

export type Direction = "TL" | "TR" | "BL" | "BR";

export type FishId = number;
export type DroneId = number;

export interface FishDetail {
  color: number;
  type: number;
}

export interface Creature {
  id: FishId;
  lastSeenTurn?: number;
  lastSeenPos?: Vector;
  lastSeenSpeed?: Vector;
  detail: FishDetail;
}

export interface RadarBlip {
  fishId: FishId;
  dir: Direction;
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
  myDrones: Set<DroneId>;
  foeDrones: Set<DroneId>;
}
