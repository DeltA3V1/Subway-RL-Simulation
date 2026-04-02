let heatmapData = [];
let terrainData = [];
let worldState = null;
let displayText = true;
let running = true;
let terrainColors;

const GRID_SIZE = 50;
const API_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev'; 

function setup() {
    let cnv = createCanvas(500, 500);
    cnv.parent('canvas-container');
    fetchAndInit();
    textAlign(CENTER, CENTER);
    textSize(14);

    terrainColors = {
        '-4': color(20, 50, 150),  // Deep water
        '-3': color(30, 80, 200),  // Water
        '-2': color(50, 120, 220), // Shallow water
        '-1': color(230, 210, 150),// Sand/Coastline
        '0': color(100, 180, 80),  // Grassland
        '1': color(60, 130, 50),   // Forest
        '2': color(100, 90, 70),   // Foothills
        '3': color(140, 140, 140), // Mountain
        '4': color(255, 255, 255)  // Snow Peak
    };
}

function draw() {
    if (heatmapData.length == 0 || terrainData.length == 0) {
        background(220);
        fill(0);
        text('Loading simulation data...', width / 2, height / 2);
        return;
    }

    // if (!running) {
    // } else if (frameCount % 15 === 0) {
    //     fetchData();
    // }

    let cellSize = width / GRID_SIZE;
        
    background(0);

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            let px = x * cellSize;
            let py = y * cellSize;

            drawTerrain(x, y, px, py, cellSize)
            drawHeatmap(x, y, px, py, cellSize)
            drawNetwork(x, y, px, py, cellSize)
            drawHeatmapText(x, y, px, py, cellSize)
        }
    }
}

function drawTerrain(x, y, px, py, cellSize) {
    let tVal = terrainData[x][y].toString();
    let tColor = terrainColors[tVal] || color(0);
    fill(tColor);
    noStroke();
    rect(px, py, cellSize, cellSize);
}

function drawHeatmap(x, y, px, py, cellSize) {
    let hVal = heatmapData[x][y];
    if (hVal > 0) {
        let alpha = map(hVal, 0, 10, 0, 200); // Max alpha 200 for visible terrain
        fill(255, 0, 0, alpha);
        rect(px, py, cellSize, cellSize);
    }
}

function drawNetwork(x, y, px, py, cellSize) {
    
}

// function drawHUD() {

// }

function drawHeatmapText(x, y, px, py, cellSize) {
    let hVal = heatmapData[x][y];
    if (displayText && hVal > 0) {
        fill(255);
        text(hVal, px + cellSize / 2, py + cellSize / 2);
    }
}

function keyPressed() {
    if (key === 't' || key === 'T') {
        displayText = !displayText;
    }
    if (keyCode === ENTER) {
        running = !running;
    }
}

async function resetSimulation() {
    try {
        await fetch(`${API_URL}/reset`, { method: 'POST' });
        await fetchAndInit();
    } catch (error) {
        console.error('Error resetting maps:', error);
    }
}

async function fetchAndInit() {
    try {
        const response = await fetch(`${API_URL}/init`);
        const data = await response.json();
        heatmapData = data.heatmap;
        terrainData = data.terrain;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}