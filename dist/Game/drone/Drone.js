"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drone = void 0;
class Drone {
    constructor(id, pos, dead, battery) {
        this.droneId = id;
        this.pos = pos;
        this.dead = dead !== 0;
        this.battery = battery;
        this.lastBattery = 30; // battery at start
        this.scans = [];
        this.blips = [];
        this.lastBlips = [];
    }
    update(pos, dead, battery) {
        this.pos = pos;
        this.dead = dead !== 0;
        this.lastBattery = this.battery;
        this.battery = battery;
        this.lastBlips = this.blips;
        this.blips = [];
    }
}
exports.Drone = Drone;
//# sourceMappingURL=Drone.js.map