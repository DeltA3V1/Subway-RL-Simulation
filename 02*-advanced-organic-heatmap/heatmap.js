let heatmapData = [];
let terrainData = [];
let displayText = true;
let running = true;
let terrainColors;

const API_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev'; 

function setup() {
    let cnv = createCanvas(500, 500);
    cnv.parent('canvas-container');
    fetchData();
    textAlign(CENTER, CENTER);
    textSize(14);

    terrainColors = {
        '-4': color(20, 50, 150),  // Deep water
        '-3': color(30, 80, 200),  // Water
        '-2': color(50, 120, 220), // Shallow water
        '-1': color(100, 180, 240),// Coastline water
        '0': color(230, 210, 150), // Sand/Beach
        '1': color(100, 180, 80),  // Grassland
        '2': color(60, 130, 50),   // Forest
        '3': color(120, 100, 80),  // Mountain
        '4': color(220, 220, 220)  // Snow Peak
    };
}

function draw() {
    if (heatmapData.length == 0 || terrainData.length == 0) {
        background(220);
        fill(0);
        text('Loading simulation data...', width / 2, height / 2);
        return;
    }

    if (!running) {
    } else if (frameCount % 15 === 0) {
        fetchData();
    }

    let gridSize = 20;
    let cellSize = width / gridSize;
        
    background(0);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            let px = x * cellSize;
            let py = y * cellSize;

            // LAYER 1: Draw Terrain Map
            let tVal = terrainData[x][y].toString();
            let tColor = terrainColors[tVal] || color(0);
            fill(tColor);
            noStroke();
            rect(px, py, cellSize, cellSize);

            // LAYER 2: Draw Heatmap Overlay (Semi-transparent red)
            let hVal = heatmapData[x][y];
            if (hVal > 0) {
                let alpha = map(hVal, 0, 10, 0, 200); // Max alpha 200 for visible terrain
                fill(255, 0, 0, alpha);
                rect(px, py, cellSize, cellSize);
            }

            // LAYER 3: Draw Text
            if (displayText && hVal > 0) {
                fill(255); // White text shows up better on dark heat/terrain
                text(hVal, px + cellSize / 2, py + cellSize / 2);
            }
        }
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

async function resetMaps() {
    try {
        await fetch(`${API_URL}/reset_maps`, { method: 'POST' });
        await fetchData();
    } catch (error) {
        console.error('Error resetting maps:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch(`${API_URL}/get_maps`);
        const data = await response.json();
        heatmapData = data.heatmap;
        terrainData = data.terrain;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}