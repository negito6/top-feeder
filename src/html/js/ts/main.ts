class Fish {
  world: World;
  cell: Cell;
  size: number;
  appetite: number;
  free: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;

  constructor(world: World, cell: Cell) {
    this.world = world;
    this.cell = cell;
    this.size = 1; // to 4
    this.appetite = 80;
    this.free = true;
    this.x = Math.random();
    this.z = Math.random();
    this.vx = parseInt((Math.random() * 2).toString()) * 2 - 1;
    this.vz = parseInt((Math.random() * 2).toString()) * 2 - 1;

    cell.fish.push(this);
  }

  update(future: World) {
    this.move(future);
    this.eat();
  }
  move(future: World) {
    if (this.appetite < 0) {
      // death
      return;
    }

    const boundaryRateX = 0.05;
    const upperLimitSearchFeed = 70;

    let tmpMaxFeed = this.cell.feed.amount;
    const leftCell = this.world.cellAt(this.cell.x - 1, this.cell.z);
    const rightCell = this.world.cellAt(this.cell.x + 1, this.cell.z);
    if (!leftCell) {
      if (this.x < this.speedX()) {
        this.vx = 1;
      }
    } else if (!rightCell) {
      if ((1 - this.speedX()) < this.x) {
        this.vx = -1;
      }
    } else if (this.appetite < upperLimitSearchFeed) {
      if (tmpMaxFeed < leftCell.feed.amount) {
        this.vx = -1;
        tmpMaxFeed = leftCell.feed.amount;
      }
      if (tmpMaxFeed < rightCell.feed.amount) {
        this.vx = 1;
        tmpMaxFeed = rightCell.feed.amount;
      }
    } else if (this.vx == 0) {
      this.vx = parseInt((Math.random() * 2).toString()) * 2 - 1;
    }

    tmpMaxFeed = this.cell.feed.amount;
    const topCell = this.world.cellAt(this.cell.x, this.cell.z - 1);
    const bottomCell = this.world.cellAt(this.cell.x, this.cell.z + 1);
    if (!topCell) {
      if (this.z < this.speedZ()) {
        this.vz = 1;
      }
    } else if (!bottomCell) {
      if (this.z > 0.8) {
        this.vz = -1;
      }
    } else if (this.appetite < upperLimitSearchFeed) {
      if (tmpMaxFeed < topCell.feed.amount) {
        this.vz = Math.max(-1, this.vz - 1);
        tmpMaxFeed = topCell.feed.amount;
      }
    } else if (this.vz == 0 && Math.random() < 0.5) {
      this.vz = parseInt((Math.random() * 2).toString()) * 2 - 1;
    } else if (Math.random() < 0.1) {
      this.vz *= -1;
    }
    this.x += this.vx * this.speedX();
    this.z += this.vz * this.speedZ();

    let diffCellX = 0;
    if (this.x < boundaryRateX) {
      diffCellX -= 1;
    } else if ((1 - boundaryRateX) < this.x) {
      diffCellX += 1;
    }
    const moveX = this.vx == diffCellX;
    if (this.world.cellAt(this.cell.x + diffCellX, this.cell.z) && moveX) {
      this.cell = this.world.cellAt(this.cell.x + diffCellX, this.cell.z);
      this.x = 0.5 - diffCellX / 2;
    } else {
      this.x = Math.max(0, Math.min(1, this.x));
    }

    const boundaryRateZ = this.speedZ();
    let diffCellZ = 0;
    if (this.z < boundaryRateZ) {
      diffCellZ -= 1;
    } else if ((1 - boundaryRateZ) < this.z) {
      diffCellZ += 1;
    }
    const moveZ = this.vz == diffCellZ;
    if (this.world.cellAt(this.cell.x, this.cell.z + diffCellZ) && moveZ) {
      this.cell = this.world.cellAt(this.cell.x, this.cell.z + diffCellZ);
      this.z = 0.5 - diffCellZ / 2;
    } else {
      this.z = Math.max(0, Math.min(1, this.z));
    }

    future.cellAt(this.cell.x, this.cell.z).addFish(this);
  }
  fcr() {
    return Math.sqrt(this.size);
  }
  speedX() {
    return this.size * 0.1;
  }
  speedZ() {
    return this.size * 0.02;
  }
  eat() {
    const sizeMax = 4;
    const upperLimitSearchFeed = 70;
    const lowerLimitGrow = 50 + upperLimitSearchFeed / 2;
    const appetiteDecrease = 0.05;

    if (this.cell.feed.present()) {
      const sizeEatBase = 256;
      const sizeFcrBase = 0.25;
      const appetiteBase = 16;

      const ateAmount = this.cell.feed.amount * (1 - this.appetite / 100) / sizeEatBase;
      this.cell.feed.merge(new Feed(this.cell, - ateAmount));
      if (lowerLimitGrow > this.appetite) {
        this.size = this.size + sizeFcrBase * ateAmount / this.fcr();
      }
      this.appetite += ateAmount * appetiteBase;
    }
    this.appetite -= appetiteDecrease;
    if (this.size > sizeMax) this.size = sizeMax;
    if (this.appetite > 100) this.appetite = 100;
  }
  html() {
    const hBase = 4;
    const wBase = 8;
    const hMax = 32;
    const wMax = 32;

    const h = Math.sqrt(this.size) * hBase;
    const w = Math.sqrt(this.size) * wBase;

    return '<div style="margin-top: %{marginTop}px; margin-left: %{marginLeft}px; width: %{width}px; height: %{height}px; background: rgba(%{color},%{alpha}); position: absolute; border-radius: %{borderRadius}">%{debug}</div>'
             .replace(/%{width}/, w.toString())
             .replace(/%{height}/, h.toString())
             .replace(/%{color}/, "0,0,128")
             .replace(/%{alpha}/, (this.appetite / 100).toString())
             .replace(/%{marginLeft}/, ((wMax - w) * this.x).toString())
             .replace(/%{marginTop}/, ((hMax + h) * (this.z - 0.5)).toString())
             // .replace(/%{debug}/, this.z.toString() + ' ' + this.vz.toString())
             .replace(/%{debug}/, "")
             .replace(/%{borderRadius}/, (this.vx * this.vz > 0) ? "0% 90% 0% 90%" : "90% 0% 90% 0%")
             ;
  }
}
class Feed {
  cell: Cell;
  vz: number;
  vx: number;
  amount: number;

  constructor(cell: Cell, amount: number) {
    this.cell = cell;
    this.amount = amount;
    this.vz = 0.2;
    this.vx = 0.05;
  }
  merge(feed: Feed) {
    this.amount += feed.amount;
  }
  present() {
    return this.amount > 0;
  }
  defused() {
    return new Feed(new Cell(0, -1), this.amount * this.vx);
  }
  remained() {
    return new Feed(new Cell(0, -1), this.amount * (1 - (2 * this.vx + this.vz)));
  }
  dropped() {
    return new Feed(new Cell(0, -1), this.amount * this.vz);
  }
}
class Cell {
  fish: Fish[];
  feed: Feed;
  x: number;
  z: number;

  constructor(x: number, z: number) {
    this.fish = [];
    this.feed = new Feed(this, 0);
    this.x = x;
    this.z = z;
  }
  removeFeed() {
    this.feed = new Feed(this, 0);
  }
  mergeFeed(feed: Feed) {
    this.feed.merge(feed);
  }
  addFish(fish: Fish) {
    this.fish.push(fish);
  }
  domId() {
    return 'cell_' + this.x + '_' + this.z;
  }

  render() {
    const td = document.getElementById(this.domId());
    const maxFeedAtCell = 256;
    if (td) {
      td.style.background = 'rgba(128,64,64,' + (this.feed.amount / maxFeedAtCell).toString() + ')';
      // td.innerHTML = this.feed.present() ? this.feed.amount.toString() : '';
      td.innerHTML = this.fish.map((f) => f.html()).join("");
    }
  }
}
class World {
  time: number;
  cells: { [key: string]: Cell; };
  feedQueue: Feed[];
  x: number;
  z: number;
  timer: number;
  totalFeed: number;

  constructor(_x: number, _z: number) {
    this.time = 0;
    this.cells = {};
    this.feedQueue = [];
    this.x = _x;
    this.z = _z;
    this.timer = 0;
    this.totalFeed = 0;

    for (let x = - this.x; x <= this.x; x++) {
    for (let z = 0; z < this.z; z++) {
      this.cells[x+"_"+z] = new Cell(x, z);
    }
    }
  }
  addFish() {
    for (let z = 0; z < this.z; z++) {
      for (let x = - this.x; x <= this.x; x++) {
        if ((x % 2) * (z % 2) == 0) {
          new Fish(this, this.cells[x+"_"+z]);
        }
      }
    }
  }
  future() {
    return new World(this.x, this.z);
  }

  pause() {
    if (this.timer > 0) {
      window.clearInterval(this.timer);
      console.log("world stopped");
    }
  }

  run(interval: number, callback: any) {
    this.pause();

    const world = this;
    this.timer = window.setInterval(() => {
      world.time++;
      world.step();
      callback(world);
    }, interval);
  }
  step() {
    this.moveFeed();
    this.updateFish();
    this.rerender();
  }
  moveFeed() {
    const future = this.future();
    this.eachCell((world: World, cell: Cell) => {
      future.cellAt(cell.x, cell.z).mergeFeed(cell.feed.remained());

      const bottomCell = future.cellAt(cell.x, cell.z + 1);
      if (bottomCell) bottomCell.mergeFeed(cell.feed.dropped());
      const rightCell = future.cellAt(cell.x + 1, cell.z);
      if (rightCell) rightCell.mergeFeed(cell.feed.defused());
      const leftCell = future.cellAt(cell.x - 1, cell.z);
      if (leftCell) leftCell.mergeFeed(cell.feed.defused());
      cell.removeFeed();
    });

    const feed = this.feedQueue.shift();
    if (feed && feed.present()) {
      // TODO:
      const droppedCell = future.cellAt(feed.cell.x, 0);
      feed.cell.removeFeed();
      if (droppedCell) droppedCell.mergeFeed(feed);
      this.totalFeed += feed.amount;
    }

    this.eachCell((world: World, cell: Cell) => {
      cell.mergeFeed(future.cellAt(cell.x, cell.z).feed);
    });
  }
  updateFish() {
    let future = this.future();
    this.eachCell((world: World, cell: Cell) => {
      for (let i = 0, l = cell.fish.length; i < l; i++) {
        cell.fish[i].update(future);
      }
    });
    this.eachCell((world: World, cell: Cell) => {
      cell.fish = future.cellAt(cell.x, cell.z).fish;
    });
  }

  clearFeedQueue() {
    this.feedQueue = [];
  }

  addFeedQueue(feed: Feed) {
    this.feedQueue.push(feed);
  }

  cellAt(x: number, z: number) {
    return this.cells[this.cellId(x, z)];
  }

  cellId(x: number, z: number) {
    return x + '_' + z;
  }

  // TOOD:
  eachCell(f: any) {
    for (let z = 0; z < this.z; z++) {
      for (let x = - this.x; x <= this.x; x++) {
        f(this, this.cellAt(x, z));
      }
    }
  }

  // TODO:
  createCell(x: number, z: number) {
    return new Cell(x, z);
  }

  rerender() {
    this.eachCell((world: World, cell: Cell) => {
      cell.render();
    });
  }

  render() {
    let rows = [];
    for (let z = 0; z < this.z; z++) {
      let cols = [];
      for (let x = - this.x; x <= this.x; x++) {
        let cell = this.cellAt(x, z);
        if (cell) {
          cols.push('<td id="' + cell.domId() + '"></td>');
        } else {
          console.log(['Not found cell', x, z]);
        }
      }
      rows.push('<tr>' + cols.join('') + '</tr>');
    }

    let cells = document.getElementById("cells")
    if (cells) cells.innerHTML = rows.join("");
  }
}
class Feeder {
  world: World;
  constructor(world: World) {
    this.world = world;
  }

  feed(amount: number, duration: number, run: number, pause: number) {
    this.world.clearFeedQueue();

    let running = true;
    let interval = 0;
    for (let i = 0; i < duration; i++) {
      if (running) {
        for (let j = 0; j < run; j++) {
          this.world.addFeedQueue(new Feed(new Cell(0, -1), amount));
          i++;
          if (i > duration) break;
        }
        running = false;
      } else {
        for (let j = 0; j < pause; j++) {
          this.world.addFeedQueue(new Feed(new Cell(0, -1), 0));
          i++;
          if (i > duration) break;
        }
        running = true;
      }
    }
  }
}
class Game {
  feeder: Feeder;
  world: World;
  cInitialTotalFish: number;
  goalFishNumber: number;
  goalFishSize: number;
  finished: boolean;

  constructor() {
    this.world = new World(10, 20);
    this.feeder = new Feeder(this.world);
    this.goalFishNumber = 0;
    this.goalFishSize = 0;
    this.cInitialTotalFish = 0;
    this.finished = false;
  }
  setup(goalFishRate: number, goalFishSize: number) {
    this.world.addFish();
    this.goalFishSize = goalFishSize;

    for (let z = 0; z < this.world.z; z++) {
      for (let x = - this.world.x; x <= this.world.x; x++) {
        this.cInitialTotalFish += this.world.cellAt(x, z).fish.length;
      }
    }
    this.goalFishNumber = this.cInitialTotalFish * goalFishRate;

    this.world.render();
  }
  pause() {
    this.world.pause();
  }
  createWorldCallback() {
    const game = this;

    const sizeMax = 4;
    const dSize = 0.25;

    return ((world: World) => {
      let fishAttr = [];
      let cGoal = 0;

      for (let z = 0; z < world.z; z++) {
        for (let x = - world.x; x <= world.x; x++) {
          let fishInCell = world.cellAt(x, z).fish;
          for (let i = 0, l = fishInCell.length; i < l; i++) {
            fishAttr.push([fishInCell[i].size, fishInCell[i].appetite]);
            if (fishInCell[i].size > game.goalFishSize) {
              cGoal++;
            }
          }
        }
      }
      const cTotal = fishAttr.length;

      const status = document.getElementById('status');
      if (status) status.innerHTML = [['Time', world.time], ['Fish', cTotal.toString()], ['Feed', world.totalFeed]].map((h) => { return h[0] + ": " + h[1]; }).join('<br>');

      let trs = [];
      const dAppetite = 10;
      let currentSize = 1;

      for (let i = 0, l = (sizeMax - 1) / dSize; i <= l; i++) {
        let spans = [];
        for (let j = 0, m = 100 / dAppetite; j < m; j++) {
          let c = 0;
          for (let k = 0; k < cTotal; k++) {
            if (i != parseInt((parseInt((100 * fishAttr[k][0] - 100).toString()) / (100 * dSize)).toString())) {
              continue;
            }
            if (j != parseInt((fishAttr[k][1] / dAppetite).toString())) {
              continue;
            }
            c++;
          }
          let span = '<span style="height: 10px; width: %{width}px; background: rgba(%{color},%{alpha}); display: inline-block;"></span>'
                       .replace(/%{width}/, (c / 3.2).toString())
                       .replace(/%{color}/, "0,0,128")
                       .replace(/%{alpha}/, (j * dAppetite / 100).toString())
                     ;
          spans.push(span);
        }
        let tr = ['<tr><td>Size: ', currentSize.toString(), '</td><td style="width: 100px;">', spans.join(""), '</td></tr>'].join('');
        trs.push(tr);
        currentSize += dSize;
      }

      const summary = document.getElementById('summary');
      if (summary) summary.innerHTML = trs.join("");

      if (this.finished) {
        return;
      }

      if (cTotal < game.goalFishNumber) {
        world.pause();
        game.gameover(cTotal);
      } else if (cGoal > game.goalFishNumber) {
        world.pause();

        const mean = fishAttr.reduce((sum, attr) => sum + attr[0], 0) / cTotal;
        const stddev = Math.sqrt(fishAttr.map(attr => Math.pow(attr[0] - mean, 2)).reduce((sum, value) => sum + value, 0) / cTotal);
        game.finish(world, stddev);
      }
    });
  }
  run() {
    const inputInterval = document.getElementById("fps") as HTMLInputElement;
    if (inputInterval) {
      const interval = inputInterval.value;
      if (parseInt(interval) > 0) {
        this.world.run(1000 / parseInt(interval), this.createWorldCallback());
      } else {
        alert("Please set a numerical value");
      }
    } else {
      alert("try again");
    }
  }
  start() {
    document.getElementById("welcome")!.style.display = 'none';
    this.run();
  }
  gameover(cTotal: number) {
    document.getElementById("gameover-message")!.innerHTML = 'Too much motality %{ratePercent}%'.replace(/%{ratePercent}/, (100 - parseInt((100 * cTotal / this.cInitialTotalFish).toString())).toString());
    document.getElementById("gameover")!.style.display = 'block';
    this.finished = true;
  }
  finish(world: World, stddev: number) {
    document.getElementById("result")!.style.display = 'block';
    const bestTime = 4000;
    const bestTotalFeed = 16000;

    const trs = [
      '<tr><td style="text-align: right; width: 50%;">Time: </td><td style="text-align: left;">%{time-score}% (%{time})</td></tr>'
        .replace(/%{time}/, this.world.time.toString())
        .replace(/%{time-score}/, parseInt((100 * bestTime / this.world.time).toString()).toString())
        ,
      '<tr><td style="text-align: right; width: 50%;">Total Feed:</td><td style="text-align: left;"> %{feed-score}% (%{feed})</td></tr>'
        .replace(/%{feed}/, world.totalFeed.toString())
        .replace(/%{feed-score}/, parseInt((100 * bestTotalFeed / this.world.totalFeed).toString()).toString())
        ,
      '<tr><td style="text-align: right; width: 50%;">stddev: </td><td style="text-align: left;">%{stddev}</td></tr>'
        .replace(/%{stddev}/, stddev.toString())
        ,
    ];
    document.getElementById("result-list")!.innerHTML = trs.join('');
    this.finished = true;
  }
  feed() {
    let params : { [key: string]: number; } = {};
    const keys = ["amount", "duration", "run", "pause"];
    for (let i = 0, l = keys.length; i < l; i++) {
      const input = document.getElementById(keys[i]) as HTMLInputElement;
      if (input) {
        const value = input.value;
        if (parseInt(value) > 0) {
          params[keys[i]] = parseInt(value);
        } else {
          alert("Please set a numerical value");
          return;
        }
      } else {
        alert("try again");
      }
    }
    const maxAmount = 256;
    if (params.amount > maxAmount) {
      alert("Amount is less than " + maxAmount);
      return;
    }
    this.feeder.feed(params.amount, params.duration, params.run, params.pause);
  }
}
const game = new Game();

window.onload = () => {
  const strGoalFishSize = document.getElementById('goal-fish-size')!.innerHTML;
  const strGoalFishRatePercent = document.getElementById('goal-fish-rate-percent')!.innerHTML;
  if (strGoalFishSize && strGoalFishRatePercent) {
    game.setup(parseInt(strGoalFishRatePercent) / 100, parseFloat(strGoalFishSize));
  }
}
function submitRun() {
  game.run();
}
function submitPause() {
  game.pause();
}
function submitStart() {
  game.start();
}
function submitFeed() {
  game.feed();
}
function submitCloseResult() {
  document.getElementById("result")!.style.display = 'none';
  document.getElementById("gameover")!.style.display = 'none';
}

