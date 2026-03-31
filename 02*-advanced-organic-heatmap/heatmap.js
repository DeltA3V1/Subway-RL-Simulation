let heatmapData = [];
let terrainData = [];


let displayText = true;
let running = true;
let terrainColors;

function setup() {
    let cnv = createCanvas(400, 400);
    cnv.parent('canvas-container');
    fetchData();
    textAlign(CENTER, CENTER);
    textSize(16);

    terrainColors = {
        '-4': color(0, 0, 255), // Deep water
        '-3': color(0, 100, 255), // Shallow water
        '-2': color(0, 150, 255), // Shallow water
        '-1': color(0, 200, 255), // Shallow water
        '0': color(34, 139, 34), // Land
        '1': color(85, 107, 47), // Highland
        '2': color(139, 69, 19) // Mountain
    };
}

function draw() {
    if (!running) {
        background(220);
        fill(0);
        text('Simulation paused. Press Enter to resume.', width / 2, height / 2);
    }

    if (heatmapData.length == 0) {
        background(220);
        fill(0);
        text('Loading heatmap data...', width / 2, height / 2);
        return;
    }

    if (frameCount % 15 === 0 && running) {
        fetchData();
    }

    let gridSize = 20;
    let cellSize = width / gridSize; // Calculate size of each cell
        
    background(220);
    stroke(200);

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            let alpha = map(heatmapData[x][y], 0, 10, 0, 255);
            fill(255, 0, 0, alpha);
            if (terrainData[x][y] != 0) {
                fill(terrainColors[terrainData[x][y].toString()]);
            }
            
            rect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (displayText) {
                fill(0);
                if (terrainData[x][y] != 0) {
                    continue;
                }
                text(heatmapData[x][y], x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
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
        await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/reset_maps', {
            method: 'POST'
        });
        await fetchData();
    } catch (error) {
        console.error('Error resetting maps:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/get_maps');
        const data = await response.json();
        heatmapData = data.heatmap;
        terrainData = data.terrain;
        console.log('Heatmap data from backend:', heatmapData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}