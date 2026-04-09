import { fetchAndInit, resetSimulation } from './api.js';
import { buildSimpleLayout, buildMetroLayout } from './layout.js';
import { drawTerrain, drawHeatmap, drawHeatmapText, drawSimpleLayout, drawMetroLayout, GRID_SIZE } from './renderer.js';
import { DEFAULT_TERRAIN, STANDALONE_TERRAIN } from './config.js';
import * as state from './state.js';
import { toggleActive, toggleState, toggleSpeed } from './controls.js';

function setup() {
    let cnv = createCanvas(600, 600);
    cnv.parent('canvas-container');
    fetchAndInit();
    textAlign(CENTER, CENTER);
    textSize(12);

    state.setCyanBlue(color(0, 179, 255));
    setColors(DEFAULT_TERRAIN);
}

function setColors(colors) {
    const terrainColors = {};
    for (let key in colors) {
        terrainColors[key] = color(...colors[key]);
    }
    state.setTerrainColors(terrainColors);
}

function draw() {
    if (state.heatmapData.length == 0 || state.terrainData.length == 0) {
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

            if (state.terrainLayer) {drawTerrain(row, col, px, py, cellSize)};
            if (state.heatmapLayer) {
                drawHeatmap(row, col, px, py, cellSize)
                drawHeatmapText(row, col, px, py, cellSize)
            };
        }
    }
    if (state.networkLayer) {
        if (state.simpleNetwork) {
            let layout = buildSimpleLayout(state.stations, state.edges, cellSize);
            drawSimpleLayout(layout);
        } else {
            let layout = buildMetroLayout(state.stations, state.edges, cellSize)
            drawMetroLayout(layout);
        }
    };
}

function keyPressed() {
    if (key === "1") {
        state.setTerrainLayer(!state.terrainLayer);
    }

    if (key === "2") {
        state.setHeatmapLayer(!state.heatmapLayer);
    }

    if (key === "3") {
        state.setNetworkLayer(!state.networkLayer);
    }

    if (key === 't' || key === 'T') {
        state.setDisplayText(!state.displayText);
    }

    if (key === 'm' || key === 'M') {
        state.setSimpleNetwork(!state.simpleNetwork);
    }

    if (keyCode === ENTER) {
        toggleState();
    }

    if (state.terrainLayer && (!state.networkLayer)) {
        setColors(STANDALONE_TERRAIN);
    } else {
        setColors(DEFAULT_TERRAIN);
    }
}

// Export p5.js functions for global scope
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;

// Export control functions for HTML buttons
window.toggleActive = toggleActive;
window.toggleState = toggleState;
window.toggleSpeed = toggleSpeed;
window.resetSimulation = resetSimulation;

