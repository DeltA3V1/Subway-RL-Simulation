let heatmapData = [];
let displayText = true;
let running = true;

function setup() {
    createCanvas(400, 400);
    fetchData();
}

function draw() {
    if (!running) {
        textAlign(CENTER, CENTER);
        background(220);
        fill(0);
        textSize(16);
        text('Simulation paused. Press Enter to resume.', width / 2, height / 2);
    }
    
    if (heatmapData.length == 0) {
        background(220);
        fill(0);
        textSize(16);
        textAlign(CENTER, CENTER);
        text('Loading heatmap data...', width / 2, height / 2);
        return;
    }

    if (frameCount % 15 === 0 && running) {
        fetchData();
    }

    textAlign(CENTER, CENTER);
    background(220);
    let gridSize = 20;
    let cellSize = width / gridSize; // Calculate size of each cell

    stroke(200);
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
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
        await fetch('https://reimagined-space-disco-9v7xp7p6x45fpgpr-8000.app.github.dev/reset_heatmap', {
            method: 'POST'
        });
        await fetchData();
    } catch (error) {
        console.error('Error resetting heatmap:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch('https://reimagined-space-disco-9v7xp7p6x45fpgpr-8000.app.github.dev/get_heatmap');
        const data = await response.json();
        heatmapData = data.heatmap;
        console.log('Heatmap data from backend:', heatmapData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}