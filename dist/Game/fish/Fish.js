"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisibleFish = exports.Fish = void 0;
class Fish {
    constructor(id, detail) {
        this.id = id;
        this.detail = detail;
    }
}
exports.Fish = Fish;
class VisibleFish {
    constructor(fish, pos, speed, turn) {
        this.id = fish.id;
        this.detail = fish.detail;
        this.pos = pos;
        this.speed = speed;
        fish.lastSeenPos = pos;
        fish.lastSeenSpeed = speed;
        fish.lastSeenTurn = turn;
        fish.zone = pos.y / 2500;
    }
}
exports.VisibleFish = VisibleFish;
//# sourceMappingURL=Fish.js.map