export const MAP_SIZE = 10000;
export const DRONE_MAX_MOVE_DIST = 600;
export const DRONE_RADIUS = 200;
export const MONSTER_RADIUS = 300;
export const MONSTER_DANGER_PRECISION = 40;
export const SAFETY_EPSYLON = 15;
export const STATIC_SAFETY_RADIUS = DRONE_RADIUS + MONSTER_RADIUS + SAFETY_EPSYLON;
export const STEP_RATIO = 0.1;
export const FISH_HABITAT: Record<number, Record<number, number>> = {
    '-1': {'-1': 2500, 1: MAP_SIZE},
    0: {'-1': 2500, 1: 5000},
    1: {'-1': 5000, 1: 7500},
    2: {'-1': 7500, 1: MAP_SIZE},
}
