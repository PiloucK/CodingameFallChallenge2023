"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Drone_1 = require("./drone/Drone");
const Fish_1 = require("./fish/Fish");
class Game {
    constructor() {
        this.mapSize = 10000;
        this.fishes = {};
        this.drones = {};
        this.myScore = 0;
        this.foeScore = 0;
        this.myScans = [];
        this.foeScans = [];
        this.myDrones = new Set();
        this.foeDrones = new Set();
        this.turn = 0;
        const fishCount = parseInt(readline());
        for (let i = 0; i < fishCount; i++) {
            const [fishId, color, type] = readline().split(" ").map(Number);
            this.fishes[fishId] = new Fish_1.Fish(fishId, { color, type });
        }
    }
    newTurn() {
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
                this.drones[droneId] = new Drone_1.Drone(droneId, { x: droneX, y: droneY }, dead, battery);
            }
            const foeDroneCount = parseInt(readline());
            for (let i = 0; i < foeDroneCount; i++) {
                const [droneId, droneX, droneY, dead, battery] = readline()
                    .split(" ")
                    .map(Number);
                this.foeDrones.add(droneId);
                this.drones[droneId] = new Drone_1.Drone(droneId, { x: droneX, y: droneY }, dead, battery);
            }
        }
        else {
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
    // private estimateScore(): number {
    //     // Calculate score to know if saving scanned fished makes me win
    // }
    playTurn() {
        this.newTurn();
        const visibleFishes = [];
        const visibleFishCount = parseInt(readline());
        for (let i = 0; i < visibleFishCount; i++) {
            const [fishId, fishX, fishY, fishVx, fishVy] = readline()
                .split(" ")
                .map(Number);
            visibleFishes.push(new Fish_1.VisibleFish(this.fishes[fishId], { x: fishX, y: fishY }, { x: fishVx, y: fishVy }, this.turn));
        }
        const myRadarBlipCount = parseInt(readline());
        for (let i = 0; i < myRadarBlipCount; i++) {
            const [_droneId, _fishId, dir] = readline().split(" ");
            const droneId = parseInt(_droneId);
            const fishId = parseInt(_fishId);
            this.drones[droneId].blips.push({ fishId, dir: dir });
        }
        // Implement the strategy for each turn
        // Example: Move drone, scan creatures, update scores
        for (const drone of this.myDrones) {
            // const x = drone.pos.x
            // const y = drone.pos.y
            // Compute distance from fishes
            // for (const fish of visibleFishes) {
            //   fish.dist = Math.pow(x - fish.pos.x, 2) + Math.pow(y - fish.pos.y, 2)
            // }
            // Sort by closest fish
            // visibleFishes.sort((a, b) => {return a.dist - bchange type of variable
            // const target: Fish | undefined = getTarget()
            // const light = Math.sqrt(target?.dist!) <= 2000 ? 1 : 0
            console.log(`MOVE ${5000} ${5000} ${1}`);
        }
    }
}
//# sourceMappingURL=Game.js.map