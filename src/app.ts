// Import any necessary game data here

import { Game } from "./Game/Game";

class InteractiveMap {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private map: ImageData;
  game: Game;

  constructor() {
    this.canvas = document.getElementById("interactive-map") as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d", { alpha: false })  as CanvasRenderingContext2D;
    this.map = this.context.createImageData(1000, 1000);

    this.game = new Game();
  }

  draw(weightedMap: Uint8ClampedArray) {
    const data = this.map.data;

    data.forEach((pixelInfo, index) => {data[index] = pixelInfo + index + weightedMap[index]});
    this.context.putImageData(this.map, 0, 0);
  }
}

const map = new InteractiveMap();

// const game = new Game();

// // game loop
// while (true) {
//   game.playTurn();
// }
