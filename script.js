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
  buttonWidth: 100,
  buttonPaddingY: 75,
};

const GUIState = {
  squareColors: Array(81).fill(GUIOptions.squareColor),
  squareTargetColors: Array(81).fill(GUIOptions.squareColor),
  gridColor: [0, 0, 0],
  originX: 0,
  originY: 0,
  centerX: 0,
  centerY: 0,
  mouseDown: false,
};

const GUIElements = {
  resetBtn: null,
  undoBtn: null,
};

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

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Generate win masks at runtime to increase speed
  Game.SMALL_WIN_MASKS = generateWinMasks();
  Game.BIG_WIN_MASKS = generateWinMasks(true);

  GUIElements.resetBtn = createButton("🞭");
  GUIElements.undoBtn = createButton("🡄");

  GUIElements.resetBtn.mousePressed(() => {
    Game.reset();
  });
  GUIElements.undoBtn.mousePressed(() => {
    Game.undo();
  });
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

  // Add buttons
  GUIElements.resetBtn.position(
    GUIState.originX + GUIState.end,
    GUIState.originY + GUIOptions.buttonPaddingY
  );
  GUIElements.resetBtn.style("width", `${GUIOptions.buttonWidth}px`);

  GUIElements.undoBtn.position(
    GUIState.originX + GUIState.end,
    GUIState.originY
  );
  GUIElements.undoBtn.style("width", `${GUIOptions.buttonWidth}px`);

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

  // Store current mouse position relative to board origin
  const relMouseX = mouseX - GUIState.originX;
  const relMouseY = mouseY - GUIState.originY;

  // Update square colors
  for (let i = 0; i < 81; i++) {
    // Play the square if it is being clicked on
    const dist_x = relMouseX - relativeSquarePosition(i % 9);
    const dist_y = relMouseY - relativeSquarePosition(floor(i / 9));

    // Update the color
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

    if (
      dist_x > 0 &&
      dist_y > 0 &&
      dist_x < GUIOptions.boxLength &&
      dist_y < GUIOptions.boxLength
    ) {
      if (GUIState.mouseDown) Game.play(80 - i);
      document.body.style.cursor = hasSetBit(Game.PLAY_SQUARES, 80 - i)
        ? "pointer"
        : "auto";
    } else if (
      relMouseX < 0 ||
      relMouseY < 0 ||
      relMouseX > GUIState.end ||
      relMouseY > GUIState.end
    ) {
      document.body.style.cursor = "auto";
    }
  }

  GUIState.gridColor = GUIState.gridColor.map(
    (e, j) =>
      (e +
        (GUIOptions.playerColors[Number(Game.turn)][j] - e) *
          GUIOptions.colorLerpAmount) *
      GUIOptions.gridColorDampening
  );
}

function mousePressed() {
  GUIState.mouseDown = true;
}

function mouseReleased() {
  GUIState.mouseDown = false;
}
