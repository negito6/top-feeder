class Fish {
  cell: Cell;
  size: number;
  appetite: number;
  free: boolean;

  constructor(cell: Cell) {
    this.cell = cell;
    this.size = 1;
    this.appetite = 100;
    this.free = true;
  }

  update() {
    this.setDirection();
    this.move();
    this.eat();
  }
  setDirection() {
  }
  move() {
  }
  eat() {
  }
}
class Feed {
  cell: Cell;
  vz: number;
  amount: number;

  constructor(cell: Cell, amount: number) {
    this.cell = cell;
    this.vz = 1;
    this.amount = amount;
  }
  merge(feed: Feed) {
    this.amount += feed.amount;
  }
  move() {

  }
  present() {
    return this.amount > 0;
  }
  remained() {
    return new Feed(new Cell(0, -1), this.amount * 0.1);
  }
  dropped() {
    return new Feed(new Cell(0, -1), this.amount * 0.9);
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

  domId() {
    return 'cell_' + this.x + '_' + this.z;
  }

  render() {
    const td = document.getElementById(this.domId());
    const maxFeedAtCell = 256;
    if (td) {
      td.style.background = 'rgba(128,64,64,' + (this.feed.amount / maxFeedAtCell).toString() + ')';
      // td.innerHTML = this.feed.present() ? this.feed.amount.toString() : '';
    }
  }
}
class World {
  time: number;
  cells: { [key: string]: Cell; };
  feedQueue: Feed[];
  x: number;
  z: number;

  constructor(_x: number, _z: number) {
    this.time = 0;
    this.cells = {};
    this.feedQueue = [];
    this.x = _x;
    this.z = _z;

    for (let x = - this.x; x <= this.x; x++) {
    for (let z = 0; z < this.z; z++) { 
      this.cells[x+"_"+z] = new Cell(x, z);
    }
    }
    this.feedQueue = [
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 128),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 128),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 128),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 128),
      new Feed(new Cell(0, -1), 0),
      new Feed(new Cell(0, -1), 128),
      new Feed(new Cell(0, -1), 0),
    ];
  }

  start() {
    const world = this;
    window.setInterval(() => {
      world.time++;
      console.log('time');
      world.process();
    }, 3000);
  }
  process() {
    this.survival();
    this.moveFeed();
    this.updateFish();
    this.rerender();
  }
  survival() {
  }
  moveFeed() {
    const feed = this.feedQueue.shift();    
    if (feed && feed.present()) {
      // TODO:
      const nextCell = this.cellAt(feed.cell.x, feed.cell.z + feed.vz);
      feed.cell.removeFeed(); 
      nextCell.mergeFeed(feed); 
    }
    const future = new World(this.x, this.z);
    this.eachCell((world: World, cell: Cell) => {
      const currentFeed = cell.feed;
      future.cellAt(cell.x, cell.z).mergeFeed(cell.feed.remained());

      const nextCell = future.cellAt(cell.x, cell.z + cell.feed.vz);
      if (nextCell) nextCell.mergeFeed(cell.feed.dropped()); 
      cell.removeFeed(); 
    });
    this.eachCell((world: World, cell: Cell) => {
      cell.mergeFeed(future.cellAt(cell.x, cell.z).feed); 
    });
  }
  updateFish() {
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
        running = false;
      }
    }
  }
}

const world = new World(10, 20);
world.render();
world.start();
