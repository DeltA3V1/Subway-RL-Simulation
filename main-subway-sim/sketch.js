const GRID_SIZE = 30;
const LINE_SPACING = 4;
const API_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev'; 

const STANDALONE_TERRAIN = {
    '-4': [20, 50, 150],  // deep water
    '-3': [30, 80, 200],  // water
    '-2': [50, 120, 220], // shallow water
    '-1': [230, 210, 150],// coast
    '0': [100, 180, 80],  // land
    '1': [60, 130, 50],   // forest
    '2': [100, 90, 70],   // foothills
    '3': [140, 140, 140], // mountain
    '4': [255, 255, 255]  // snow peak
};

const DEFAULT_TERRAIN = {
    '-4': [15, 25, 45],   // deep water
    '-3': [20, 35, 60],   // water
    '-2': [25, 45, 75],   // shallow water
    '-1': [45, 48, 42],   // coast
    '0': [38, 45, 35],    // land
    '1': [42, 50, 38],    // forest
    '2': [50, 47, 42],    // foothills
    '3': [58, 55, 52],    // mountain
    '4': [75, 72, 70]     // snow peak
};

const LINE_COLORS = [
    '#E3252B', // Red line
    '#F8A519', // Orange line  
    '#FECC00', // Yellow line
    '#008659', // Green line
    '#0070BD', // Blue line
    '#9B2EA0', // Purple line
    '#C0953B', // Brown line
];

let heatmapData = [];
let terrainData = [];
let network = [];
let stations = [];
let edges = [];

let worldState = null;
let displayText = true;
let fetchingAgent = false;
let fetchingPop = false; 
let running = false;

let evolutionInterval;
let popInterval;

// temporary: seperation of growth
let runAgent = false;
let runPop = true;

let popSpeed = 250;
let agentSpeed = 1000;

// layers
let terrainLayer = true;
let heatmapLayer = true;
let networkLayer = true;

// color
let terrainColors = {};
let electricCyan, cyanBlue;

function setup() {
    let cnv = createCanvas(600, 600);
    cnv.parent('canvas-container');
    fetchAndInit();
    textAlign(CENTER, CENTER);
    textSize(12);

    electricCyan = color(0, 240, 255);
    cyanBlue = color(0, 179, 255);
    setColors(DEFAULT_TERRAIN);
}

function setColors(colors) {
    for (let key in colors) {
        terrainColors[key] = color(...colors[key]);
    }
}

function draw() {
    if (heatmapData.length == 0 || terrainData.length == 0) {
        background(220);
        fill(0);
        text('Loading simulation data...', width / 2, height / 2);
        return;
    }
    let cellSize = width / GRID_SIZE;
        
    background(0);

    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE; row++) {
            let px = col * cellSize;
            let py = row * cellSize;

            if (terrainLayer) {drawTerrain(row, col, px, py, cellSize)};
            if (heatmapLayer) {
                drawHeatmap(row, col, px, py, cellSize)
                drawHeatmapText(row, col, px, py, cellSize)
            };
        }
    }
    if (networkLayer) {drawNetwork(stations, edges, cellSize)};
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
        let alpha = (networkLayer && terrainLayer) ? map(hVal, 0, 10, 8, 45) : map(hVal, 0, 10, 20, 200);
        fill(255, 160, 60, alpha); // warm amber
        noStroke();
        rect(px, py, cellSize, cellSize);
    }
}

function drawNetwork(stations, edges, cellSize) {
    if (!edges || !stations) {
        return;
    }

    // Group edges by shared segments
    let segments = {};
    for (let edge of edges) {
        let minIdx = Math.min(edge.from, edge.to);
        let maxIdx = Math.max(edge.from, edge.to);
        let key = `${minIdx}_${maxIdx}`;

        if (!segments[key]) {
            segments[key] = [];
        }
        segments[key].push(edge.line_id);
    }

    // Draw the segments with offsets
    for (let key in segments) {
        let [fromIdx, toIdx] = key.split('_').map(Number);
        let lineIds = segments[key];
        
        let fromNode = stations[fromIdx];
        let toNode = stations[toIdx];
        let p1 = cellToPixel(fromNode.row, fromNode.col);
        let p2 = cellToPixel(toNode.row, toNode.col);

        // Normal (perpendicular) vector
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize
        let nx = -dy / len; 
        let ny = dx / len;

        for (let i = 0; i < lineIds.length; i++) {
            let lineId = lineIds[i];
            let hexColor = LINE_COLORS[lineId % LINE_COLORS.length];
            
            // Calculate offset multiplier for centering
            let offsetMultiplier = i - (lineIds.length - 1) / 2;
            
            let offsetX = nx * LINE_SPACING * offsetMultiplier;
            let offsetY = ny * LINE_SPACING * offsetMultiplier;

            // Apply offsets to start and end points
            let x1 = p1.x + offsetX;
            let y1 = p1.y + offsetY;
            let x2 = p2.x + offsetX;
            let y2 = p2.y + offsetY;

            // Draw shadow/outline
            stroke(10, 10, 20, 180);
            strokeWeight(5);
            line(x1, y1, x2, y2);

            // Draw colored line
            stroke(color(hexColor));
            strokeWeight(2.5);
            line(x1, y1, x2, y2);
        }
    }

    // Draw stations
    noStroke();
    let maxPop = Math.max(...stations.map(s => s.pop || 1), 1);

    for (let station of stations) {
        let p = cellToPixel(station.row, station.col);
        let radius = map(station.pop || 1, 0, maxPop, 6, 14);
        
        stroke(0); // Black outline
        strokeWeight(2);
        fill(cyanBlue);
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
    if (key === "1") {
        terrainLayer = !terrainLayer;
    }

    if (key === "2") {
        heatmapLayer = !heatmapLayer;
    }

    if (key === "3") {
        networkLayer = !networkLayer;
    }

    if (key === 't' || key === 'T') {
        displayText = !displayText;
    }

    if (keyCode === ENTER) {
        runPop = !runPop;
        runAgent = !runAgent;
        document.getElementById('stat-active').innerText = runPop ? "Population" : "Agent"
    }

    if (terrainLayer && (!networkLayer)) {
        setColors(STANDALONE_TERRAIN);
    } else {
        setColors(DEFAULT_TERRAIN);
    }
}

function toggleActive() {
    running = !running;
    if (!running) {
        clearInterval(evolutionInterval);
        clearInterval(popInterval);
    } else {
        evolutionInterval = setInterval(runEvolutionStep, agentSpeed);
        popInterval = setInterval(step, popSpeed);
    }
    document.getElementById('toggle-active').innerText = running ? "Pause Simulation" : "Start Simulation";
}

function toggleGrowth() {
    runPop = !runPop;
    runAgent = !runAgent;
    document.getElementById('stat-active').innerText = runPop ? "Population" : "Agent"
}

function toggleSpeed() {
    popSpeed = popSpeed === 250 ? 50 : 250;
    agentSpeed = agentSpeed === 1000 ? 500 : 1000;

    if (running) {
        clearInterval(evolutionInterval);
        clearInterval(popInterval);
        evolutionInterval = setInterval(runEvolutionStep, agentSpeed);
        popInterval = setInterval(step, popSpeed);
    }
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
    if (!runPop || fetchingPop) return;
    fetchingPop = true;

    try {
        const response = await fetch(`${API_URL}/step`);
        const data = await response.json();
        heatmapData = data.heatmap;
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        fetchingPop = false;
    }
}

async function runEvolutionStep() {
    if (!runAgent || fetchingAgent) return;
    fetchingAgent = true;
    
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
        running = false;
        clearInterval(evolutionInterval);
        clearInterval(popInterval);
        document.getElementById('toggle-active').innerText = "Start Simulation";

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