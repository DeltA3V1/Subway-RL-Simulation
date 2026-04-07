let heatmapData = [];
let terrainData = [];
let network = [];
let stations = [];
let edges = [];

let worldState = null;
let displayText = true;
let fetching = false;

// temporary: seperation of growth
let runAgent = false;
let runPop = true;

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
    let evolutionInterval = setInterval(runEvolutionStep, 500);
}

function draw() {
    if (heatmapData.length == 0 || terrainData.length == 0) {
        background(220);
        fill(0);
        text('Loading simulation data...', width / 2, height / 2);
        return;
    }

    if (runPop && frameCount % framesPerStep == 0) {
        step()
    }

    let cellSize = width / GRID_SIZE;
        
    background(0);

    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE; row++) {
            let px = col * cellSize;
            let py = row * cellSize;

            drawTerrain(row, col, px, py, cellSize)
            drawHeatmap(row, col, px, py, cellSize)
            drawHeatmapText(row, col, px, py, cellSize)
        }
    }
    drawNetwork(stations, edges, cellSize)
}

function drawTerrain(row, col, px, py, cellSize) {
    let tVal = terrainData[row][col].toString();
    let tColor = terrainColors[tVal] || color(0);
    fill(tColor);
    noStroke();
    rect(px, py, cellSize, cellSize);
}

function drawHeatmap(row, col, px, py, cellSize) {
    let hVal = heatmapData[row][col];
    if (hVal > 0) {
        let brightness = map(hVal, 0, 10, 100, 255); 
        let alpha = map(hVal, 0, 10, 50, 180);
        fill(255, 255, 200, alpha);
        rect(px, py, cellSize, cellSize);
    }
}

function drawNetwork(stations, edges, cellSize) {
    if (!edges || !stations) {
        return;
    }

    for (let edge of edges) {
        let fromNode = stations[edge.from];
        let toNode = stations[edge.to];
        
        let p1 = cellToPixel(fromNode.row, fromNode.col);
        let p2 = cellToPixel(toNode.row, toNode.col);

        stroke(0);
        strokeWeight(5);
        line(p1.x, p1.y, p2.x, p2.y);

        stroke("#00F0FF"); // Electric cyan
        strokeWeight(3);
        line(p1.x, p1.y, p2.x, p2.y);
    }

    noStroke();
    for (let station of stations) {
        let p = cellToPixel(station.row, station.col);
        
        let radius = 10 + (station.pop * 2); 
        
        stroke(0); // Black outline
        strokeWeight(2);
        fill("#00b3ff"); // Magenta/Pink
        circle(p.x, p.y, radius);
    }
}

// function drawHUD() {

// }

function drawHeatmapText(row, col, px, py, cellSize) {
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
        runPop = !runPop;
        runAgent = !runAgent;
        document.getElementById('stat-active').innerText = runPop ? "Population" : "Agent"
    }
}

function toggleGrowth() {
    runPop = !runPop;
    runAgent = !runAgent;
    document.getElementById('stat-active').innerText = runPop ? "Population" : "Agent"
}

function toggleSpeed() {
    framesPerStep = framesPerStep === 15 ? 3 : 15;
}

function cellToPixel(row, col) {
    let cellSize = width / GRID_SIZE;
    return { x: col * cellSize + (cellSize / 2), y: row * cellSize + (cellSize / 2) };
}

function pixelToCell(px, py) {
    let cellSize = width / GRID_SIZE;
    return { row: Math.floor(py / cellSize), col: Math.floor(px / cellSize) };
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
    if (!runAgent || fetching) return;
    fetching = true;
    
    try {
        const response = await fetch(`${API_URL}/step_generation`);
        const data = await response.json();
        
        stations = data.best_network.nodes;
        edges = data.best_network.edges;
        
        document.getElementById('stat-reward').innerText = data.score.toFixed(2);
        document.getElementById('stat-generation').innerText = data.generation;
        
    } catch (error) {
        console.error('Error fetching generation:', error);
    } finally {
        fetching = false;
    }
}

async function resetSimulation() {
    try {
        clearInterval(evolutionInterval);
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
        runPop = true;
        runAgent = false;
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