const GRID      = 20;
const MAX_PATH  = 80;
const SPEED     = 8;          // frames between moves
const CELL      = 20;

function makeSnake(x, y, dir, color, algorithm) {
  return { x, y, dir, color, path: [], algorithm };
}

const algorithms = {

  random(snake) {
    const choices = [-90, 0, 0, 90];  // weighted to go straight more often
    return (snake.dir + random(choices) + 360) % 360;
  },

  biasedWander(snake) {
    const r = random(1);
    if (r < 0.05) return (snake.dir + 90)  % 360;
    if (r < 0.10) return (snake.dir + 270) % 360;
    return snake.dir;
  },

  wallHugger(snake) {
    const margin = 10;
    const W = width, H = height;
    if (snake.x <= margin)              return 90;   // left wall  → go down
    if (snake.y >= H - margin)          return 0;    // bottom     → go right
    if (snake.x >= W - margin)          return 270;  // right wall → go up
    if (snake.y <= margin)              return 180;  // top        → go left
    return snake.dir;  // keep going
  },

  spiralInward(snake) {
    if (!snake.segLen)   snake.segLen   = floor(width / 2);
    if (!snake.stepsTaken) snake.stepsTaken = 0;

    snake.stepsTaken++;
    if (snake.stepsTaken >= snake.segLen) {
      snake.stepsTaken = 0;
      snake.segLen = max(10, snake.segLen - 10);
      return (snake.dir + 90) % 360;   // turn right
    }
    return snake.dir;
  },
};


let snakes;

function setup() {
  createCanvas(400, 400);
  resetSnakes();
}

function resetSnakes() {
    snakes = [
        makeSnake(0, 0, 90, color(180,  60, 220), algorithms.random),                                 // top-left
        makeSnake((GRID-1)*CELL, 0, 180, color( 30, 160, 120), algorithms.biasedWander),              // top-right
        makeSnake((GRID-1)*CELL, (GRID-1)*CELL, 270, color(220,  80,  40), algorithms.spiralInward),  // bottom-right
        makeSnake(0, (GRID-1)*CELL, 0, color(200, 140,  20), algorithms.wallHugger),                  // bottom-left
    ];
}

function draw() {
  background(30);

  if (frameCount % SPEED === 0) {
    for (const snake of snakes) moveSnake(snake);
  }

  for (const snake of snakes) drawSnake(snake);
}


function moveSnake(snake) {
  snake.path.push({ x: snake.x, y: snake.y });
  if (snake.path.length > MAX_PATH) snake.path.shift();

  snake.dir = snake.algorithm(snake);

  const rad = radians(snake.dir);
  // move one cell
  snake.x = constrain(snake.x + round(cos(rad)) * CELL, 0, (GRID - 1) * CELL);
  snake.y = constrain(snake.y + round(sin(rad)) * CELL, 0, (GRID - 1) * CELL);
}

function drawSnake(snake) {
  // trail
  noStroke();
  for (let i = 1; i < snake.path.length; i++) {
    const t = i / snake.path.length;
    fill(red(snake.color), green(snake.color), blue(snake.color), t * 200);
    rect(snake.path[i].x, snake.path[i].y, CELL, CELL);
  }

  // head
  fill(snake.color);
  rect(snake.x, snake.y, CELL, CELL);
}

// reset
function mousePressed() {
  resetSnakes();
}