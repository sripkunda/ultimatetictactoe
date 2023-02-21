const GUIOptions = {
  backgroundColor: [0, 0, 0],
  squareColor: [48, 48, 45],
  playerColors: [
    [0, 195, 255],
    [255, 87, 51],
  ],
  playSquareColor: [232, 224, 211],
  textColor: [255, 255, 255],
  boxLength: 60,
  padding: 4,
  offsetX: 0,
  offsetY: 20,
  colorLerpAmount: 0.2,
  gridColorDampening: 0.75,
};

const GUIState = {
  squareColors: Array(81).fill(GUIOptions.squareColor),
  squareTargetColors: Array(81).fill(GUIOptions.squareColor),
  gridColor: [0, 0, 0],
  originX: 0,
  originY: 0,
  centerX: 0,
  centerY: 0,
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Generate win masks at runtime to increase speed
  Game.SMALL_WIN_MASKS = generateWinMasks();
  Game.BIG_WIN_MASKS = generateWinMasks(true);
}

function hasSetBit(mask, k) {
  return mask & (1n << BigInt(k));
}

function checkAllPlayerMasks(masks, i) {
  for (let j in masks) {
    if (hasSetBit(masks[j], i)) {
      return j;
    }
  }
}

function relativeSquarePosition(i) {
  return (
    (GUIOptions.boxLength + GUIOptions.padding) * i +
    floor(i / 3) * GUIOptions.padding
  );
}

function gridLength(i) {
  return (
    (GUIOptions.boxLength + GUIOptions.padding) * i +
    (floor(i / 3) - 3 / 2) * GUIOptions.padding
  );
}

function draw() {
  clear();
  background(GUIOptions.backgroundColor);

  // Update center and origin based on window size
  GUIState.centerX =
    windowWidth / 2 - (GUIOptions.boxLength + GUIOptions.padding) * 4;
  GUIState.centerY =
    windowHeight / 2 - (GUIOptions.boxLength + GUIOptions.padding) * 4;
  GUIState.originX = GUIState.centerX + GUIOptions.offsetX;
  GUIState.originY = GUIState.centerY + GUIOptions.offsetY;
  GUIState.end =
    (GUIOptions.padding + GUIOptions.boxLength) * 9 + GUIOptions.padding;

  // Add text
  textFont("Georgia");
  textSize(32);
  textAlign(CENTER);
  fill(GUIOptions.textColor);
  text(
    "Ultimate Tic Tac Toe",
    GUIState.centerX + GUIState.end / 2,
    GUIState.centerY
  );

  // Redraw board
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      noStroke();
      if (i == 0 && j != 0 && j % 3 == 0) {
        fill(GUIState.gridColor);
        rect(
          GUIState.originX,
          GUIState.originY + gridLength(j),
          GUIState.end,
          GUIOptions.padding
        );
      }
      fill(GUIState.squareColors[8 - i + 9 * (8 - j)]);
      square(
        GUIState.originX + relativeSquarePosition(i),
        GUIState.originY + relativeSquarePosition(j),
        GUIOptions.boxLength
      );
    }
    if (i % 3 == 0 && i != 0) {
      fill(GUIState.gridColor);
      rect(
        GUIState.originX + gridLength(i),
        GUIState.originY,
        GUIOptions.padding,
        GUIState.end
      );
    }
  }

  // Update square colors
  for (let i = 0; i < 81; i++) {
    const j =
      Game.WINNER !== null
        ? Game.WINNER
        : checkAllPlayerMasks(Game.WINNERS, i) ||
          checkAllPlayerMasks(Game.BOARDS, i);
    if (j !== undefined) {
      GUIState.squareTargetColors[i] = GUIOptions.playerColors[Number(j) + 0];
    } else if (hasSetBit(Game.PLAY_SQUARES, i)) {
      GUIState.squareTargetColors[i] = GUIOptions.playSquareColor;
    } else {
      GUIState.squareTargetColors[i] = GUIOptions.squareColor;
    }
    GUIState.squareColors[i] = GUIState.squareColors[i].map(
      (e, j) =>
        e + (GUIState.squareTargetColors[i][j] - e) * GUIOptions.colorLerpAmount
    );
  }

  GUIState.gridColor = GUIState.gridColor.map(
    (e, j) =>
      (e +
        (GUIOptions.playerColors[Number(Game.turn)][j] - e) *
          GUIOptions.colorLerpAmount) *
      GUIOptions.gridColorDampening
  );
}

function getBoxAtMousePos() {
  // Compute relative mouse position
  const relMouseX = mouseX - GUIState.originX;
  const relMouseY = mouseY - GUIState.originY;

  // Find row and col
  const col = floor(relMouseX / (GUIOptions.padding + GUIOptions.boxLength));
  const row = floor(relMouseY / (GUIOptions.padding + GUIOptions.boxLength));

  // Check if mouse is outside of the tic tac toe board
  if (
    row < 0 ||
    col < 0 ||
    row > 8 ||
    col > 8 ||
    relMouseX > GUIState.originX + GUIState.end ||
    relMouseY > GUIState.originY + GUIState.end
  )
    return;

  // Shift to compensate for extra padding between tic tac boards after a certain point
  const shiftX = -(floor(col / 3) >= 1);
  const shiftY = -(floor(row / 3) >= 1);
  const currPosX = relativeSquarePosition(col + shiftX) + GUIOptions.boxLength;
  const nextPosX = relativeSquarePosition(col + shiftX + 1);
  const currPosY = relativeSquarePosition(row + shiftY) + GUIOptions.boxLength;
  const nextPosY = relativeSquarePosition(row + shiftY + 1);

  // Check if mouse is between padding
  if (
    (relMouseX >= currPosX && relMouseX <= nextPosX) ||
    (relMouseY >= currPosY && relMouseY <= nextPosY)
  )
    return;

  // Return the relevant index
  return 9 * (8 - row) + (8 - col);
}

function mousePressed() {
  Game.play(getBoxAtMousePos());
}
