const Game = {
  turn: true,
  ALL_SQUARES: 2n ** 81n - 1n,
  PLAY_SQUARES: 2n ** 81n - 1n,
  BIG_WIN_MASKS: [],
  SMALL_WIN_MASKS: [],
  SINGLE_BOARD_MASK: 0x1c0e07n,
  BOARDS: [0n, 0n],
  WINNERS: [0n, 0n],
  WINNER: null,
  DRAW: false,
  MOVES: [],
  sequence(...moves) {
    for (const move of moves) {
      this.play(move);
    }
  },
  reset() {
    this.BOARDS = [0n, 0n];
    this.WINNERS = [0n, 0n];
    this.PLAY_SQUARES = this.ALL_SQUARES;
    this.WINNER = null;
    this.DRAW = false;
    this.turn = true;
    this.MOVES = [];
  },
  undo(k = 1) {
    let moves = this.MOVES.slice(0, this.MOVES.length - k);
    this.reset();
    this.sequence(...moves);
  },
  play(i) {
    // If the game is won or the square is invalid, return
    if (this.WINNER != null || this.draw || typeof i !== "number") return;
    const turn = this.turn + 0;
    if (i === undefined || i > 80 || i < 0)
      throw Error("Square index out of range.");
    const square = 1n << BigInt(i);

    // Return if that square has already been played, or the selected square is invalid.
    if (
      square &
      (BigInt(this.BOARDS[0]) |
        BigInt(this.BOARDS[1]) |
        (this.ALL_SQUARES ^ this.PLAY_SQUARES) |
        BigInt(this.WINNERS[0]) |
        BigInt(this.WINNERS[1]))
    )
      return this.turn;

    // Mark corresponding square
    this.BOARDS[turn] |= BigInt(square);
    this.MOVES.push(i);

    // Check for small board wins
    for (let mask of this.SMALL_WIN_MASKS) {
      for (k = 0; k < 9; k++) {
        if ((this.BOARDS[turn] & mask) == mask) {
          this.WINNERS[turn] |=
            this.SINGLE_BOARD_MASK << getBigShift(floor(k / 3), k % 3);
        }
        mask <<= (k + 1) % 3 == 0 && k != 0 ? 21n : 3n;
      }
    }

    // Check for draw
    if (!((this.BOARDS[0] | this.BOARDS[1]) & this.ALL_SQUARES))
      return (this.draw = true);

    // Check for game win
    for (const mask of this.BIG_WIN_MASKS) {
      if ((this.WINNERS[turn] & mask) == mask) {
        this.WINNER = turn;
        return;
      }
    }

    // If the next play square is already won, or every square has been played on, the player can play in all squares.
    const playSquare = getNextTurnPlaySquare(i);
    this.PLAY_SQUARES =
      playSquare & (BigInt(this.WINNERS[0]) | BigInt(this.WINNERS[1])) ||
      (playSquare & (this.BOARDS[0] | this.BOARDS[1])) == playSquare
        ? this.ALL_SQUARES
        : playSquare;

    return (this.turn = !this.turn);
  },
};

function getBigShift(row, col) {
  return BigInt(row * 27 + col * 3);
}

function printBoard(board) {
  // Convert board to string
  let str = board.toString(2);

  // Add trailing zeros to make 9 x 9 grid
  while (str.length < 81) {
    str = `0${str}`;
  }

  // Formulate output string
  let out = str
    .substring(str.length - 81)
    .replace(/.{9}/g, "$&\n")
    .replace(/./g, "$& ");
  console.log(out);
  return out;
}

function getNextTurnPlaySquare(i) {
  let row = floor(i / 9);
  let col = i - 9 * row;
  return Game.SINGLE_BOARD_MASK << getBigShift(row % 3, col % 3);
}

function generateWinMasks(big = false) {
  let size = big ? 3 : 1;
  let base = big ? Game.SINGLE_BOARD_MASK : 1n;
  let masks = [];

  function gen(m, baseShift, form = null, combiCount = 3) {
    for (let i = 0; i < 2; i++) {
      m |= m << BigInt(baseShift);
    }
    for (let i = 0; i < combiCount; i++) {
      masks.push(m << BigInt(form(i)));
    }
  }

  gen(base, size, (i) => i * size * 9);
  gen(base, 9 * size, (i) => i * size);
  gen(base, 10 * size, () => 0, 1);
  gen(base << BigInt(size * 2), 8 * size, () => 0, 1);

  return masks;
}
