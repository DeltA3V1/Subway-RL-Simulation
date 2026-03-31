const GRID      = 20;
const SPEED     = 8;  
const CELL      = 20;
const MAX_PATH  = 40;

function makeSnake(x, y, dir, color, algorithm) {
  return { x, y, dir, color, path: [], algorithm };
}

const algorithms = {
  random(snake) {
    const choices = [-90, 0, 0, 90]; 
    return (snake.dir + random(choices) + 360) % 360;
  },

  biasedWander(snake) {
    const r = random(1);
    if (r < 0.05) return (snake.dir + 90)  % 360;
    if (r < 0.10) return (snake.dir + 270) % 360;
    return snake.dir;
  },

  wallHugger(snake) {
    const maxBound = (GRID - 1) * CELL;
    if (snake.x <= 0 && snake.dir === 180) return 90;   // At left, go down
    if (snake.y >= maxBound && snake.dir === 90) return 0;    // At bottom, go right
    if (snake.x >= maxBound && snake.dir === 0) return 270;  // At right, go up
    if (snake.y <= 0 && snake.dir === 270) return 180;  // At top, go left
    return snake.dir;
  },

  spiralInward(snake) {
    if (snake.segLen === undefined) snake.segLen = GRID - 1;
    if (snake.stepsTaken === undefined) snake.stepsTaken = 0;

    snake.stepsTaken++;
    if (snake.stepsTaken >= snake.segLen) {
      snake.stepsTaken = 0;
      // Shrink the path every two turns
      if (snake.dir === 0 || snake.dir === 180) {
          snake.segLen = max(1, snake.segLen - 1);
      }
      return (snake.dir + 90) % 360;
    }
    return snake.dir;
  },
};

let snakes;

function setup() {
    let cnv = createCanvas(400, 400);
    cnv.parent('canvas-container');
    resetSnakes();
}

function resetSnakes() {
    snakes = [
        makeSnake(0, 0, 0, color(180, 60, 220), algorithms.random),
        makeSnake((GRID-1)*CELL, 0, 180, color(30, 160, 120), algorithms.biasedWander),
        makeSnake((GRID-1)*CELL, (GRID-1)*CELL, 270, color(220, 80, 40), algorithms.spiralInward),
        makeSnake(0, (GRID-1)*CELL, 0, color(200, 140, 20), algorithms.wallHugger),
    ];
}

function draw() {
  background(11, 0, 20);

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
  const maxBound = (GRID - 1) * CELL;
  
  snake.x = constrain(snake.x + round(cos(rad)) * CELL, 0, maxBound);
  snake.y = constrain(snake.y + round(sin(rad)) * CELL, 0, maxBound);
}

function drawSnake(snake) {
  noStroke();
  // Draw Tail
  for (let i = 0; i < snake.path.length; i++) {
    const t = i / snake.path.length;
    let c = color(red(snake.color), green(snake.color), blue(snake.color), t * 255);
    fill(c);
    rect(snake.path[i].x, snake.path[i].y, CELL, CELL);
  }

  // Draw Head
  fill(snake.color);
  rect(snake.x, snake.y, CELL, CELL);
}

function mousePressed() {
  resetSnakes();
}