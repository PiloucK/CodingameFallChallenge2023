"use strict";
// Import any necessary game data here
class InteractiveMap {
    constructor() {
        this.canvas = document.getElementById("interactive-map");
        this.context = this.canvas.getContext("2d");
        this.context.fillStyle = "rgb(200, 0, 0)";
        this.context.fillRect(10, 10, 50, 50);
        this.context.fillStyle = "rgba(0, 0, 200, 0.5)";
        this.context.fillRect(30, 30, 50, 50);
    }
}
const map = new InteractiveMap();
// const game = new Game();
// // game loop
// while (true) {
//   game.playTurn();
// }
//# sourceMappingURL=app.js.map