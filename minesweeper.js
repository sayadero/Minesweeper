const rows = 16;
const columns = 30;
const bombs = 99;
let minesweeper;

class Position {
  constructor(row, column) {
    this.row = row;
    this.column = column;
  }

  equals(anotherPosition) {
    return this.row === anotherPosition.row && this.column === anotherPosition.column;
  }

  validPosition(rows, columns) {
    return this.row >= 0 && this.row < rows && this.column >= 0 && this.column < columns;
  }

  static randomPosition(maxRows, maxColumns) {
    return new Position(Math.floor(Math.random() * maxRows), Math.floor(Math.random() * maxColumns));
  }
}

class Cell {
  constructor(value, visible = false, flag = false) {
    this.value = value;
    this.visible = visible;
    this.flag = flag;
  }

  getClass() {
    let result = '';
    if (this.visible) {
      result = 'show';
      if (this.value === -1) {
        result = ' bomb';
      }
      else if (this.value > 0) {
        result += ` warm${this.value}`
      }
    }
    else if(this.flag) {
      result = 'flag'
    }
    else {
      result = 'hidden';
    }
    return result;
  }

  getInnerHTML() {
    let result = '&nbsp;';
    if (this.flag) {
      result = '<i class="em em-triangular_flag_on_post"></i>';
    }
    else if (this.visible) {
      result = this.value > 0 ? `${this.value}` : this.value === -1 ? '<i class="em em-bomb"></i>' : '&nbsp;'
    }
    return result;
  }
}

class Minesweeper {
  constructor(bombs, rows, columns) {
    this.mode = 0;
    this.gameMode = ["Open", "Flag"];
    this.bombs = bombs;
    this.bombsPosition = [];
    this.rows = rows;
    this.columns = columns;
    this.invisibleCellsLeft = rows * columns;
    this.flaggedCells = 0;
    this.board = [];

    for (let row = 0; row < rows; ++row) {
      var rowNode = document.createElement("LI");
      document.querySelector('#Minesweeper').appendChild(rowNode);
      this.board.push([]);
      for (let column = 0; column < columns; ++column) {
        var columnNode = document.createElement("DIV");
        columnNode.addEventListener('mousedown', handleCellClick);
        columnNode.addEventListener('contextmenu', event => event.preventDefault());
        columnNode.id = `${row}-${column}`
        rowNode.appendChild(columnNode);
        this.board[row].push(new Cell(0));
      }
    }

    let bombsLeft = bombs;
    while (bombsLeft-- > 0) {
      this.placeBomb();
    }

    this.draw();
  }

  placeBomb() {
    let bombPosition = undefined;
    do {
      bombPosition = Position.randomPosition(rows, columns)
    } while (this.bombsPosition.find(bomb => bomb.equals(bombPosition)));
    this.bombsPosition.push(bombPosition);
    this.setBomb(bombPosition);
    for (let rowMod = -1; rowMod <= 1; ++rowMod) {
      for (let columnMod = -1; columnMod <= 1; ++columnMod) {
        const auxPosition = new Position(bombPosition.row + rowMod, bombPosition.column + columnMod);
        if (auxPosition.validPosition(rows, columns)) {
          this.increaseValue(auxPosition);
        }
      }
    }
  }

  isBomb(position) {
    return this.getPosition(position).value === -1;
  }

  setBomb(position) {
    this.getPosition(position).value = -1;
  }

  increaseValue(position) {
    if (!this.isBomb(position)) {
      this.getPosition(position).value += 1;
    }
  }

  isVisible(position) {
    return this.getPosition(position).visible;
  }

  isFlag(position) {
    return this.getPosition(position).flag;
  }

  getPosition(position) {
    return this.board[position.row][position.column];
  }

  changeMode() {
    this.mode = (++this.mode) % this.gameMode.length;
    document.querySelector('#Mode').innerHTML = this.gameMode[this.mode];
  }

  openClick(position) {
    let cell = this.getPosition(position)
    if (!cell.flag && !cell.visible) {
      if (cell.value === -1) {
        this.endGame();
      } else {
        cell.visible = true;
        this.invisibleCellsLeft -= 1;
        if (cell.value === 0) {
          for (let rowMod = -1; rowMod <= 1; ++rowMod) {
            for (let columnMod = -1; columnMod <= 1; ++columnMod) {
              const auxPosition = new Position(position.row + rowMod, position.column + columnMod);
              if (auxPosition.validPosition(rows, columns)) {
                this.openClick(auxPosition);
              } else {
                console.log(auxPosition);
              }
            }
          }
        }
      }
    }
  }

  flagClick(position) {
    if (!this.isVisible(position)) {
      const isFlagged = this.isFlag(position);
      this.flaggedCells = isFlagged ? this.flaggedCells - 1 : this.flaggedCells + 1;
      this.getPosition(position).flag = !isFlagged;
    }
  }

  draw() {
    for (let row = 0; row < this.board.length; row++) {
      let rowNode = document.querySelector('#Minesweeper').children[row];
      for (let column = 0; column < this.board[row].length; column++) {
        let columnNode = rowNode.children[column];
        columnNode.innerHTML = this.board[row][column].getInnerHTML();
        columnNode.className = this.board[row][column].getClass();
      }
    }
    document.querySelector('#BombsLeft').innerHTML = `${this.bombs - this.flaggedCells}`
  }

  checkWin() {
    if (this.invisibleCellsLeft === this.bombs) {
      console.log("You Win!!!");
      document.querySelector('#MessageDiv').hidden = false;
      document.querySelector('#ReloadButton').innerHTML = '<i class="em em-sunglasses"></i>';
      this.showAllBombs();
    }
  }

  endGame() {
    console.log("You Loose!!!");
    document.querySelector('#MessageDiv').hidden = false;
    document.querySelector('#ReloadButton').innerHTML = '<i class="em em-slightly_frowning_face"></i>';
    this.showAllBombs();
  }

  showAllBombs() {
    for (let i = 0; i < this.bombsPosition.length; i++) {
      const auxPosition = this.bombsPosition[i];
      this.board[auxPosition.row][auxPosition.column].visible = true;
    }
  }
}

function initializeEventListeners() {
  document.querySelector('#ReloadButton').addEventListener('click', reloadGame);
}

function start() {
  minesweeper = new Minesweeper(bombs, rows, columns);
}

function handleCellClick(event) {
  if (event.target) {
    const clickElement = event.target;
    const splitId = clickElement.id.split('-');
    const clickPosition = new Position(parseInt(splitId[0]), parseInt(splitId[1]));
    switch (event.button) {
      case 2:
        minesweeper.flagClick(clickPosition);
        break;
      case 0:
      default:
        minesweeper.openClick(clickPosition);
        break;
    }
    minesweeper.draw();
  }
}

function changeMode() {
  minesweeper.changeMode();
}

function reloadGame() {
  location.reload();
  //chrome.browserAction.setPopup({popup: "index.html"});
}

initializeEventListeners();
start();