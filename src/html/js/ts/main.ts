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

    const boundaryRate = 0.1;

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
    } else if (this.appetite < 70) {
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
      this.vz = -1;
    } else if (this.appetite < 70) {
      this.vz = 0;
      if (tmpMaxFeed < topCell.feed.amount) {
        this.vz = -1;
        tmpMaxFeed = topCell.feed.amount;
      }
      if (tmpMaxFeed < bottomCell.feed.amount) {
        this.vz = 1;
        tmpMaxFeed = bottomCell.feed.amount;
      }
    } else if (this.vz == 0) {
      this.vz = parseInt((Math.random() * 2).toString()) * 2 - 1;
    }
    this.x += this.vx * this.speedX();
    this.z += this.vz * this.speedZ();

    let diffCellX = 0;
    if (this.x < boundaryRate) {
      diffCellX -= 1;
    } else if ((1 - boundaryRate) < this.x) {
      diffCellX += 1;
    }
    const moveX = this.vx == diffCellX;
    if (this.world.cellAt(this.cell.x + diffCellX, this.cell.z) && moveX) {
      this.cell = this.world.cellAt(this.cell.x + diffCellX, this.cell.z);
      this.x = 0.5 - diffCellX / 2;
    } else {
      this.x = Math.max(0, Math.min(1, this.x));
    }

    let diffCellZ = 0;
    if (this.z < boundaryRate) {
      diffCellZ -= 1;
    } else if ((1 - boundaryRate) < this.z) {
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
    const sizeMax = 2;
    if (this.cell.feed.present()) {
      const sizeEatBase = 256;
      const sizeFcrBase = 0.25;
      const appetiteBase = 16;

      const ateAmount = this.cell.feed.amount * (1 - this.appetite / 100) / sizeEatBase;
      this.cell.feed.merge(new Feed(this.cell, - ateAmount));
      this.size = this.size + sizeFcrBase * ateAmount / this.fcr();
      this.appetite += ateAmount * appetiteBase;
    }
    this.appetite -= 0.1;
    if (this.size > sizeMax) this.size = sizeMax;
    if (this.appetite > 100) this.appetite = 100;
  }
  html() {
    const hBase = 4;
    const wBase = 8;
    const hMax = 32;
    const wMax = 32;

    const h = Math.sqrt(Math.sqrt(Math.sqrt(this.size))) * hBase;
    const w = Math.sqrt(Math.sqrt(Math.sqrt(this.size))) * wBase;

    return '<div style="margin-top: %{marginTop}px; margin-left: %{marginLeft}px; width: %{width}px; height: %{height}px; background: rgba(%{color},%{alpha}); position: absolute;"></div>'
             .replace(/%{width}/, w.toString())
             .replace(/%{height}/, h.toString())
             .replace(/%{color}/, "0,0,128")
             .replace(/%{alpha}/, (this.appetite / 100).toString())
             .replace(/%{marginLeft}/, ((wMax - w) * this.x).toString())
             .replace(/%{marginTop}/, ((hMax - h) * this.z).toString())
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
  move() {

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
  survival() {
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

  constructor(_x: number, _z: number) {
    this.time = 0;
    this.cells = {};
    this.feedQueue = [];
    this.x = _x;
    this.z = _z;
    this.timer = 0;

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

  stop() {
    if (this.timer > 0) {
      window.clearInterval(this.timer);
      console.log("world stopped");
    }
  }

  start(interval: number) {
    const world = this;
    this.timer = window.setInterval(() => {
      world.time++;
      console.log('time');
      world.process();
    }, interval);
  }
  process() {
    this.survival();
    this.moveFeed();
    this.updateFish();
    this.rerender();
    const status = document.getElementById('status');
    if (status) status.innerHTML = ['Time: ', this.time, ', Fish: ', this.count().toString()].join('');
  }
  count() {
    let c = 0;
    for (let z = 0; z < this.z; z++) {
      for (let x = - this.x; x <= this.x; x++) {
        c += this.cellAt(x, z).fish.length;
      }
    }
    return c;
  }
  survival() {
  }
  moveFeed() {
    const future = this.future();
    this.eachCell((world: World, cell: Cell) => {
      const currentFeed = cell.feed;
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

    document.body.innerHTML +='<table><tbody id="cells"></tbody></table>';
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
    let running = true;
    let interval = 0;
    for (let i = 0; i < duration; i++) {
      if (running) {
        for (let j = 0; j < run; j++) {
          this.world.addFeedQueue(new Feed(new Cell(0, -1), amount));
        }
        running = false;
      } else {
        for (let j = 0; j < pause; j++) {
          this.world.addFeedQueue(new Feed(new Cell(0, -1), 0));
        }
        running = true;
      }
    }
  }
}

const world = new World(10, 20);
world.addFish();
world.render();
world.start(100);
const feeder = new Feeder(world);
feeder.feed(192, 1024, 16, 192);
