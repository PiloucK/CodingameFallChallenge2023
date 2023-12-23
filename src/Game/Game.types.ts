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
