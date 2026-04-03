let heatmapData = [];
let terrainData = [];
let network = [];
let stations = [];
let edges = [];
let worldState = null;
let displayText = true;
let running = true;
let terrainColors;
let framesPerStep = 15;

const GRID_SIZE = 30;
const API_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev'; 

function setup() {
    let cnv = createCanvas(600, 600);
    cnv.parent('canvas-container');
    fetchAndInit();
    textAlign(CENTER, CENTER);
    textSize(12);

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
    setInterval(runEvolutionStep, 500);
}

function draw() {
    if (heatmapData.length == 0 || terrainData.length == 0) {
        background(220);
        fill(0);
        text('Loading simulation data...', width / 2, height / 2);
        return;
    }

    if (running && frameCount % framesPerStep == 0) {
        step()
    }

    let cellSize = width / GRID_SIZE;
        
    background(0);

    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE; row++) {
            let px = col * cellSize;
            let py = row * cellSize;

            drawTerrain(col, row, px, py, cellSize)
            drawHeatmap(col, row, px, py, cellSize)
            drawHeatmapText(col, row, px, py, cellSize)
        }
    }
    drawNetwork(stations, edges, cellSize)
}

function drawTerrain(col, row, px, py, cellSize) {
    let tVal = terrainData[row][col].toString();
    let tColor = terrainColors[tVal] || color(0);
    fill(tColor);
    noStroke();
    rect(px, py, cellSize, cellSize);
}

function drawHeatmap(col, row, px, py, cellSize) {
    let hVal = heatmapData[row][col];
    if (hVal > 0) {
        let alpha = map(hVal, 0, 10, 0, 200); // Max alpha 200 for visible terrain
        fill(255, 0, 0, alpha);
        rect(px, py, cellSize, cellSize);
    }
}

function drawNetwork(stations, edges, cellSize) {

    if (edges && stations) {
        for (let i = 0; i < edges.length; i++) {
            let fromNode = stations[edges[i].from];
            let toNode = stations[edges[i].to];
            
            let fx = fromNode.col * cellSize + (cellSize / 2);
            let fy = fromNode.row * cellSize + (cellSize / 2);
            let tx = toNode.col * cellSize + (cellSize / 2);
            let ty = toNode.row * cellSize + (cellSize / 2);

            stroke("#333333");
            strokeWeight(5);
            line(fx, fy, tx, ty);

            stroke("#FFA500");
            strokeWeight(1);
            line(fx, fy, tx, ty);
        }
    }

    strokeWeight(2);
    stroke(0, 0, 0, 100);
    noFill();
    if (stations) {
        stroke(0);
        strokeWeight(2);
        noFill();
        rectMode(CENTER)
        for (let i = 0; i < stations.length; i++) {
            let sx = stations[i].col * cellSize + cellSize/2;
            let sy = stations[i].row * cellSize + cellSize/2;
            ;
            rect(sx, sy, cellSize * 0.9, cellSize * 0.9, 3);
        }
        rectMode(CORNER);
    }
}

// function drawHUD() {

// }

function drawHeatmapText(col, row, px, py, cellSize) {
    strokeWeight(0);
    let hVal = heatmapData[row][col];
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
        document.getElementById('stat-active').innerText = running ? "Population" : "Agent"
    }
}

function growPopulation() {
    running = !running;
    document.getElementById('stat-active').innerText = running ? "Population" : "Agent"
}

function toggleSpeed() {
    framesPerStep = framesPerStep === 15 ? 3 : 15;
}

async function step() {
    try {
        const response = await fetch(`${API_URL}/step`);
        const data = await response.json();
        heatmapData = data.heatmap;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function runEvolutionStep() {
    if (running) return;
    
    try {
        const response = await fetch(`${API_URL}/step_generation`);
        const data = await response.json();
        
        stations = data.best_network.nodes;
        edges = data.best_network.edges;
        
        document.getElementById('stat-reward').innerText = data.score.toFixed(2);
        document.getElementById('stat-generation').innerText = data.generation;
        
    } catch (error) {
        console.error('Error fetching generation:', error);
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
        running = true;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function test() {
    try {
        const response = await fetch(`${API_URL}/test`);
        const data = await response.json();
        network = data.network;
        stations = network["nodes"];
        edges = network["edges"];
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}