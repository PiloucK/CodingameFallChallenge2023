import { DRONE_MAX_MOVE_DIST, FISH_HABITAT, MAP_SIZE } from "./Game.constants";
import { FishId, DroneId, GameData, Checkpoint } from "./Game.types";
import { Drone } from "./drone/Drone";
import { Fish, VisibleFish } from "./fish/Fish";
import {
  boxBoundSize,
  get1DMirror,
  getReminiblip,
  normalizeBlips,
} from "./utils/boxing";
import { computeBestNextPos } from "./utils/pathing";

export class Game implements GameData {
  weightedMap: Uint8ClampedArray = new Uint8ClampedArray(
    (MAP_SIZE * MAP_SIZE) / 100
  ); // contains probability of finding a fish
  fishes: Record<FishId, Fish> = {};
  drones: Record<DroneId, Drone> = {};

  // To update each turn
  turn: number = 0;
  myScore: number = 0;
  myScorestimate: number = 0;
  foeScore: number = 0;
  foeScorestimate: number = 0;
  myScans: FishId[] = []; // saved scans
  foeScans: FishId[] = []; // saved scans
  myDrones: DroneId[] = [];
  foeDrones: DroneId[] = [];
  firstDescent: boolean = true;
  ascending: boolean = false;
  now: boolean = false;

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
    this.myScans = [];
    this.foeScans = [];

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
        this.myDrones.push(droneId);
        this.drones[droneId] = new Drone(
          droneId,
          { x: droneX, y: droneY },
          dead,
          battery
        );
        // console.error('____', this.drones[droneId], this.checkPoints)
        // this.drones[droneId].checkPoints = this.checkPoints[droneId];
        this.drones[droneId].checkPoints = [];
      }
      const foeDroneCount = parseInt(readline());
      for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline()
          .split(" ")
          .map(Number);
        this.foeDrones.push(droneId);
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

    this.scorestimate();

    if (this.isFirstDescentDone()) {
      this.ascending = true;

      this.now = this.firstDescent;
      this.firstDescent = false;
    }
  }

  countScannedOfType(type: number): number {
    const fishIds = new Set();
    this.myScans.forEach((scan) => {
      if (this.fishes[scan].detail.type === type) {
        fishIds.add(scan);
      }
    });
    this.myDrones.forEach((droneId) => {
      this.drones[droneId].scans.forEach((scan) => {
        if (this.fishes[scan].detail.type === type) {
          fishIds.add(scan);
        }
      });
    });
    return fishIds.size;
  }

  isFirstDescentDone(): boolean {
    return this.countScannedOfType(2) >= 2;
  }

  // set boxes in which the fishes should be
  fishtimate() {
    let firstDrone: Drone = this.drones[this.myDrones[0]];
    let secondDrone: Drone = this.drones[this.myDrones[1]];

    // ensure number of blips is same between drones
    // boxes will be valid even if a drone doesn't receive blips
    if (firstDrone.dead) {
      firstDrone.pos = secondDrone.pos;
      firstDrone.blips = secondDrone.blips;
    } else if (secondDrone.dead) {
      secondDrone.pos = firstDrone.pos;
      secondDrone.pos = firstDrone.pos;
    }

    for (let i = 0; i < firstDrone.blips.length; ++i) {
      const fish = this.fishes[firstDrone.blips[i].fishId];

      // skip scanned and gone fishes
      if (
        fish.lastBlipTurn !== this.turn ||
        fish.lastSeenTurn! >= this.turn - 1
      ) {
        continue;
      }

      const mirroryBlipIndex = firstDrone.blips.findIndex(
        (blip) =>
          blip.fishId ===
          firstDrone.blips[i].fishId +
            (firstDrone.blips[i].fishId % 2 === 0 ? 1 : -1)
      );

      // if (mirroryBlipIndex !== -1 &&
      //   Math.sign(firstDrone.pos.x - 5000) !==
      //     Math.sign(secondDrone.pos.x - 5000)) {

      //       const mirroryFish =
      //       this.fishes[firstDrone.blips[mirroryBlipIndex].fishId];
    
      //     if (mirroryFish.lastSeenTurn! >= this.turn - 1 && mirroryFish.id !== -1) {
      //       // mirroryFish.guesstimateMove({ postBoundCheck: false });
      //       fish.box = {
      //         pos: {
      //           x: get1DMirror(mirroryFish.box.pos.x, 5000),
      //           y: mirroryFish.box.pos.y,
      //         },
      //         size: { x: 0, y: 0 },
      //       };
    
      //       console.error("mirrored exact pos:", {
      //         id: fish.id,
      //         mirror: mirroryFish.id,
      //         box: fish.box,
      //       });
      //       continue;
      //     }
    
      // }
    
      const getMirroryXBlips = () => {
        if (
          mirroryBlipIndex === -1 ||
          Math.sign(firstDrone.pos.x - 5000) ===
            Math.sign(secondDrone.pos.x - 5000)
        ) {
          return { starts: [], bounds: [] };
        }

        const mirroryBlips = normalizeBlips(
          firstDrone.pos,
          secondDrone.pos,
          firstDrone.blips[mirroryBlipIndex].blipDir,
          secondDrone.blips[mirroryBlipIndex].blipDir
        );
        const mirroredTLX = get1DMirror(mirroryBlips.topLeftBlip.pos.x, 5000);
        const mirroredBRX = get1DMirror(
          mirroryBlips.bottomRightBlip.pos.x,
          5000
        );

        return {
          starts: [
            mirroredTLX * -mirroryBlips.topLeftBlip.dir.x,
            mirroredBRX * -mirroryBlips.bottomRightBlip.dir.x,
          ],
          bounds: [mirroredTLX, mirroredBRX],
        };
      };

      const mirroryXBlips = getMirroryXBlips();

      const { topLeftBlip, bottomRightBlip } = normalizeBlips(
        firstDrone.pos,
        secondDrone.pos,
        firstDrone.blips[i].blipDir,
        secondDrone.blips[i].blipDir
      );

      const { topLeftBlip: tlReminiBlip, bottomRightBlip: brReminiBlip } =
        getReminiblip({
          firstDrone,
          secondDrone,
          fishId: firstDrone.blips[i].fishId,
          topLeftBlip,
          bottomRightBlip,
        });

      const closestX = Math.max(
        topLeftBlip.pos.x * topLeftBlip.dir.x,
        bottomRightBlip.pos.x * bottomRightBlip.dir.x,
        tlReminiBlip.pos.x * tlReminiBlip.dir.x,
        brReminiBlip.pos.x * brReminiBlip.dir.x,
        ...mirroryXBlips.starts
      );
      const closestY = Math.max(
        topLeftBlip.pos.y * topLeftBlip.dir.y,
        bottomRightBlip.pos.y * bottomRightBlip.dir.y,
        FISH_HABITAT[fish.detail.type][-topLeftBlip.dir.y] * topLeftBlip.dir.y,
        tlReminiBlip.pos.y * tlReminiBlip.dir.y,
        brReminiBlip.pos.y * brReminiBlip.dir.y
      );
      const boxStart = {
        x: Math.abs(closestX),
        y: Math.abs(closestY),
      };

      fish.box = {
        pos: boxStart,
        size: {
          x: boxBoundSize(
            [
              0,
              boxStart.x,
              topLeftBlip.pos.x,
              bottomRightBlip.pos.x,
              tlReminiBlip.pos.x,
              brReminiBlip.pos.x,
              MAP_SIZE,
              ...mirroryXBlips.bounds,
            ],
            boxStart.x,
            Math.sign(closestX) as -1 | 1
          ),
          y: boxBoundSize(
            [
              0,
              boxStart.y,
              topLeftBlip.pos.y,
              bottomRightBlip.pos.y,
              FISH_HABITAT[fish.detail.type][topLeftBlip.dir.y],
              tlReminiBlip.pos.y,
              brReminiBlip.pos.y,
              MAP_SIZE,
            ],
            boxStart.y,
            Math.sign(closestY) as -1 | 1
          ),
        },
      };
    }

    // for (const fish of Object.values(this.fishes)) {
    //   console.error({ id: fish.id, box: fish.box });
    // }
  }

  scorestimate() {
    console.error(
      "scorestimate_ myscore:",
      this.myScore,
      " foescore:",
      this.foeScore
    );

    this.myScorestimate = this.myScore;
    this.myDrones.forEach((droneId) => {
      this.drones[droneId].baseImpactStimate = this.impactstimate(
        this.drones[droneId],
        Object.values(this.drones).filter((value) => value.droneId !== droneId),
        -600,
        -600
      );
      this.myScorestimate += this.drones[droneId].baseImpactStimate;
      console.error("myscorestimate: ", this.myScorestimate);
    });

    this.foeScorestimate = this.foeScore;
    this.foeDrones.forEach((droneId) => {
      this.drones[droneId].baseImpactStimate = this.impactstimate(
        this.drones[droneId],
        Object.values(this.drones).filter((value) => value.droneId !== droneId),
        -600,
        -600
      );
      this.foeScorestimate += this.drones[droneId].baseImpactStimate;
      console.error("foescorestimate: ", this.foeScorestimate);
    });

    console.error(
      "||",
      {
        myFutureScore: this.myScorestimate,
        foeFutureScore: this.foeScorestimate,
      },
      "||"
    );
  }

  impactstimate(
    drone: Drone,
    otherDrones: Drone[],
    offsetY: number,
    globalOffsetY: number,
    specialOffsetY?: { droneId: number; offsetY: number }
  ): number {
    if (drone.dead) {
      console.error("deadge");
      return 0;
    }

    otherDrones.sort((droneA, droneB) => {
      const droneAPosY =
        droneA.pos.y +
        (droneA.droneId === specialOffsetY?.droneId
          ? specialOffsetY.offsetY
          : globalOffsetY);
      const droneBPosY =
        droneB.pos.y +
        (droneB.droneId === specialOffsetY?.droneId
          ? specialOffsetY.offsetY
          : globalOffsetY);
      return droneAPosY - droneBPosY;
    });
    // console.error(
    //   "impactstimate begin:",
    //   { droneId: drone.droneId, posY: drone.pos.y },
    //   otherDrones.map((value) => {
    //     return { droneId: value.droneId, posY: value.pos.y };
    //   })
    // );

    const isMyDrone = this.myDrones.includes(drone.droneId);
    const droneTeamDrones = isMyDrone ? this.myDrones : this.foeDrones;
    const [droneTeamScans, otherTeamScans] = isMyDrone
      ? [this.myScans, this.foeScans]
      : [this.foeScans, this.myScans];

    const droneTeamCombos: {
      type: Record<number, Set<number>>;
      color: Record<number, Set<number>>;
    } = {
      type: { 0: new Set(), 1: new Set(), 2: new Set() },
      color: { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() },
    };
    const otherTeamCombos: {
      type: Record<number, Set<number>>;
      color: Record<number, Set<number>>;
    } = {
      type: { 0: new Set(), 1: new Set(), 2: new Set() },
      color: { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() },
    };
    droneTeamScans.forEach((scan) => {
      droneTeamCombos.type[this.fishes[scan].detail.type].add(scan);
      droneTeamCombos.color[this.fishes[scan].detail.color].add(scan);
    });
    otherTeamScans.forEach((scan) => {
      otherTeamCombos.type[this.fishes[scan].detail.type].add(scan);
      otherTeamCombos.color[this.fishes[scan].detail.color].add(scan);
    });

    const scoringScans = drone.scans.filter(
      (scan) => !droneTeamScans.includes(scan)
    );
    const bonusingScans = scoringScans.filter(
      (scan) => !otherTeamScans.includes(scan)
    );

    // console.error({
    //   droneTeamScans,
    //   otherTeamScan: otherTeamScans,
    //   scoringScans,
    //   bonusingScans,
    // });

    const nextDroneY = drone.pos.y + offsetY;
    const droneTurnsBeforeSave = Math.floor(
      nextDroneY / DRONE_MAX_MOVE_DIST +
        (nextDroneY % DRONE_MAX_MOVE_DIST > 500 ? 1 : 0)
    );

    // console.error("impactstimate:", { nextDroneY, droneTurnsBeforeSave });

    otherDrones.forEach((otherDrone) => {
      const nextOtherDroneY =
        otherDrone.pos.y +
        (otherDrone.droneId === specialOffsetY?.droneId
          ? specialOffsetY?.offsetY
          : globalOffsetY);
      const otherDroneTurnsBeforeSave = Math.floor(
        nextOtherDroneY / DRONE_MAX_MOVE_DIST +
          (nextOtherDroneY % DRONE_MAX_MOVE_DIST > 500 ? 1 : 0)
      );

      // console.error("-", {
      //   nextDroneY,
      //   droneTurnsBeforeSave,
      //   otherDroneId: otherDrone.droneId,
      //   nextOtherDroneY,
      //   otherDroneTurnsBeforeSave,
      // });

      if (otherDroneTurnsBeforeSave > droneTurnsBeforeSave) {
        return;
      }

      const isDroneSameTeam: boolean = droneTeamDrones.includes(
        otherDrone.droneId
      );
      const hasPriority: boolean =
        drone.scans.length > otherDrone.scans.length ||
        (drone.scans.length === otherDrone.scans.length &&
          drone.droneId === droneTeamDrones[0]);

      // console.error({ isDroneSameTeam: isDroneSameTeam });
      // give the points to the drone with the most scaned fishes or the outter drone
      if (
        otherDroneTurnsBeforeSave === droneTurnsBeforeSave &&
        isDroneSameTeam &&
        hasPriority
      ) {
        return;
      }

      const comboToChange = isDroneSameTeam ? droneTeamCombos : otherTeamCombos;

      //   console.error(droneTeamCombos, {otherDroneId: otherDrone.droneId}, otherDrone.scans);
      // remove all common scans from counting
      otherDrone.scans.forEach((scan) => {
        const fish = this.fishes[scan];

        delete bonusingScans[bonusingScans.indexOf(scan)];
        if (isDroneSameTeam) {
          delete scoringScans[scoringScans.indexOf(scan)];
        }

        comboToChange.type[fish.detail.type].add(scan);
        comboToChange.color[fish.detail.color].add(scan);
      });
    });

    // console.error(droneTeamCombos);
    const combosFromDroneScans: {
      type: Record<number, boolean>;
      color: Record<number, boolean>;
    } = {
      type: { 0: false, 1: false, 2: false },
      color: { 0: false, 1: false, 2: false, 3: false },
    };
    const combonusesFromDroneScans: {
      type: Record<number, boolean>;
      color: Record<number, boolean>;
    } = {
      type: { 0: false, 1: false, 2: false },
      color: { 0: false, 1: false, 2: false, 3: false },
    };
    drone.scans.forEach((scan) => {
      const fish = this.fishes[scan];

      if (
        droneTeamCombos.type[fish.detail.type].size === 3 &&
        !droneTeamCombos.type[fish.detail.type].has(scan)
      ) {
        combosFromDroneScans.type[fish.detail.type] = true;
        combonusesFromDroneScans.type[fish.detail.type] =
          otherTeamCombos.type[fish.detail.type].size !== 4;
      }
      if (
        droneTeamCombos.color[fish.detail.color].size === 2 &&
        !droneTeamCombos.color[fish.detail.color].has(scan)
      ) {
        combosFromDroneScans.color[fish.detail.color] = true;
        combonusesFromDroneScans.color[fish.detail.color] =
          otherTeamCombos.color[fish.detail.color].size !== 3;
      }

      droneTeamCombos.type[fish.detail.type].add(scan);
      droneTeamCombos.color[fish.detail.color].add(scan);
    });
    // console.error({ combosFromDroneScans, combonusesFromDroneScans });

    // console.error('filtered:', {scoringScans, bonusingScans})
    let impact = 0;
    Object.keys(combonusesFromDroneScans.type).forEach((type) => {
      const numericType = Number(type);
      //   console.error(
      //     "__combonus:",
      //     { type },
      //     combonusesFromDroneScans.type[numericType]
      //   );
      impact += combonusesFromDroneScans.type[numericType] ? 4 : 0;
    });
    Object.keys(combonusesFromDroneScans.color).forEach((color) => {
      const numericColor = Number(color);
      //   console.error(
      //     "__combonus:",
      //     { color },
      //     combonusesFromDroneScans.color[numericColor]
      //   );
      impact += combonusesFromDroneScans.color[numericColor] ? 3 : 0;
    });
    Object.keys(combosFromDroneScans.type).forEach((type) => {
      const numericType = Number(type);
      //   console.error(
      //     "__comb:",
      //     { type },
      //     combosFromDroneScans.type[numericType]
      //   );
      impact += combosFromDroneScans.type[numericType] ? 4 : 0;
    });
    Object.keys(combosFromDroneScans.color).forEach((color) => {
      const numericColor = Number(color);
      //   console.error(
      //     "__comb:",
      //     { color },
      //     combosFromDroneScans.color[numericColor]
      //   );
      impact += combosFromDroneScans.color[numericColor] ? 3 : 0;
    });
    // console.error({ impact }, "before fish bonus", { bonusingScans });
    bonusingScans.forEach((scan) => {
      if (scan !== undefined) {
        impact += this.fishes[scan].detail.type + 1;
      }
    });
    // console.error({ impact }, "before fish point", { scoringScans });
    scoringScans.forEach((scan) => {
      if (scan !== undefined) {
        impact += this.fishes[scan].detail.type + 1;
      }
    });

    console.error("=confirmed impact:", { droneId: drone.droneId, impact });
    return impact;
  }

  diffstimate(drone: Drone, offsetY: number, globalOffsetY: number): number {
    let newScorestimate = this.myScore;
    this.myDrones.forEach((droneId) => {
      newScorestimate += this.impactstimate(
        this.drones[droneId],
        Object.values(this.drones).filter((value) => value.droneId !== droneId),
        droneId === drone.droneId ? offsetY : globalOffsetY,
        globalOffsetY,
        { droneId: drone.droneId, offsetY: offsetY }
      );
    });

    let newFoeScorestimate = this.foeScore;
    this.foeDrones.forEach((droneId) => {
      newFoeScorestimate += this.impactstimate(
        this.drones[droneId],
        Object.values(this.drones).filter((value) => value.droneId !== droneId),
        globalOffsetY,
        globalOffsetY,
        { droneId: drone.droneId, offsetY: offsetY }
      );
    });

    return (
      newScorestimate -
      newFoeScorestimate -
      (this.myScorestimate - this.foeScorestimate)
    );
  }

  updateDroneCheckpoints() {
    this.fishtimate();

    for (const droneId of this.myDrones) {
      const drone = this.drones[droneId];

      let otherDrone;
      for (const id of this.myDrones) {
        if (id !== droneId) {
          otherDrone = this.drones[id];
        }
      }

      // TODO: make it so it ascends if it participates towards the win
      // maybe it should chase fishes out of the map
      drone.shouldStayAbove = this.ascending;
      drone.shouldAscend =
        this.now ||
        // (this.firstDescent &&  // TODO: add if a drone with one type 2 should ascend
        //   drone.scans.find(
        //     (fishId) => this.fishes[fishId].detail.type === 2
        //   ) !== undefined) ||
        (!this.firstDescent &&
          ((this.myScorestimate >= this.foeScorestimate &&
            drone.baseImpactStimate > otherDrone?.baseImpactStimate!) ||
            (drone.baseImpactStimate == otherDrone?.baseImpactStimate &&
              drone.droneId < otherDrone.droneId)));

      console.error({
        above: drone.shouldStayAbove,
        ascending: drone.shouldAscend,
        now: this.now,
      });

      // reset if reached save range
      if (drone.pos.y < 500) {
        drone.checkPoints = [];
      }

      // TODO: handle too close centers
      // TODO: change to closest target, and use tangents to the inscribed circle
      let closestBoxCenter: Checkpoint | undefined = undefined;
      let shortestDist: number = Infinity;
      for (const fish of Object.values(this.fishes)) {
        if (fish.detail.type === -1) {
          //   console.error(fish.id, ":dont chase monster");
          continue;
        } else if (fish.lastBlipTurn !== this.turn) {
          //   console.error(fish.id, ":not in map anymore");
          continue;
        } else if (this.myScans.includes(fish.id)) {
          //   console.error(fish.id, ":already saved champ");
          continue;
        } else if (
          drone.scans.includes(fish.id) ||
          otherDrone?.scans.includes(fish.id)
        ) {
          //   console.error(fish.id, ":got that one");
          continue;
        } else if (this.firstDescent && fish.detail.type !== 2) {
          //   console.error(fish.id, ":not a priority");
          continue;
        }

        const boxCenter = {
          x: fish.box.pos.x + fish.box.size.x / 2,
          y: fish.box.pos.y + fish.box.size.y / 2,
        };

        const distToDrone = Math.hypot(
          boxCenter.x - drone.pos.x,
          boxCenter.y - drone.pos.y
        );

        if (this.now || (drone.shouldAscend && boxCenter.y <= drone.pos.y)) {
          continue;
        }

        if (drone.shouldStayAbove) {
          const theoreticalNextPos = computeBestNextPos(
            drone,
            this.fishes,
            boxCenter
          );

          const offsetY = Math.floor(theoreticalNextPos.y - drone.pos.y);

          console.error("drone should ascend, is it ok to go ", { offsetY });

          const moveImpact = this.diffstimate(drone, offsetY, -600);

          console.error("answer is ", { moveImpact });

          // consider the impact of getting a new fish or removing point from enemy potential
          if (moveImpact < 0) {
            // console.error(fish.id, ":makes me lose points");
            continue;
          }
        }

        if (distToDrone < shortestDist) {
          console.error("+", { id: fish.id, box: fish.box, distToDrone });
          shortestDist = distToDrone;
          closestBoxCenter = {
            pos: { x: boxCenter.x, y: boxCenter.y },
            unseen: 1,
          };
        }
      }

      if (closestBoxCenter) {
        drone.checkPoints = [closestBoxCenter];
      } else {
        drone.checkPoints = [{ pos: { x: drone.pos.x, y: 0 }, unseen: 1 }];
      }

      console.error({ droneId: drone.droneId }, drone.checkPoints);
    }
  }

  playTurn(): void {
    this.newTurn();
    console.error({ turn: this.turn });

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
          { x: fishVx, y: fishVy }
        )
      );

      this.fishes[fishId].guesstimatedPos = { x: fishX, y: fishY };
      this.fishes[fishId].guesstimatedSpeed = { x: fishVx, y: fishVy };
      this.fishes[fishId].lastSeenTurn = this.turn;

      this.fishes[fishId].guesstimateMove({ postBoundCheck: true });

      this.fishes[fishId].box = {
        pos: { x: fishX, y: fishY },
        size: { x: 0, y: 0 },
      };
    }

    const myRadarBlipCount = parseInt(readline());
    for (let i = 0; i < myRadarBlipCount; i++) {
      const [_droneId, _fishId, dir] = readline().split(" ");
      const droneId = parseInt(_droneId);
      const fishId = parseInt(_fishId);
      this.drones[droneId].blips.push({
        fishId,
        blipDir:
          dir === "TL"
            ? { y: -1, x: -1 }
            : dir === "TR"
            ? { y: -1, x: 1 }
            : dir === "BR"
            ? { y: 1, x: 1 }
            : { y: 1, x: -1 },
      });
      this.fishes[fishId].lastBlipTurn = this.turn;
    }

    this.updateDroneCheckpoints();

    for (const droneId of this.myDrones) {
      this.drones[droneId].move(this.fishes);
    }

    this.endTurn();
  }

  // make fishes guesstimatedPos = gesstimatedNextPos
  // if they are visible on the next turn it will be overwritten
  endTurn() {
    for (const fishId in this.fishes) {
      let fish = this.fishes[fishId];

      fish.guesstimateMove({ postBoundCheck: true, turn: this.turn });
      fish.move(this.turn);
    }
  }
}
