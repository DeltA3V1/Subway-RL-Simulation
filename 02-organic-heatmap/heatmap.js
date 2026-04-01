let heatmapData = [];
let displayText = true;
let running = true;

function setup() {
    let cnv = createCanvas(400, 400);
    cnv.parent('canvas-container');
    fetchData();
    textAlign(CENTER, CENTER);
    textSize(14);
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

    background(220);
    const GRID_SIZE = 20;
    let cellSize = width / GRID_SIZE; // Calculate size of each cell

    stroke(200);
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            let alpha = map(heatmapData[x][y], 0, 10, 0, 255);
            fill(255, 0, 0, alpha);
            rect(x * cellSize, y * cellSize, cellSize, cellSize);
            if (displayText) {
                fill(0);
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

async function resetHeatmap() {
    try {
        await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/reset_heatmap', {
            method: 'POST'
        });
        await fetchData();
    } catch (error) {
        console.error('Error resetting heatmap:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/get_heatmap');
        const data = await response.json();
        heatmapData = data.heatmap;
        console.log('Heatmap data from backend:', heatmapData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}