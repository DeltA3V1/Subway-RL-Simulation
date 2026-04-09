import { LINE_COLORS } from './config.js';
import * as state from './state.js';

export const GRID_SIZE = 30;

// draw background layers

export function drawTerrain(row, col, px, py, cellSize) {
    if (!state.terrainData || !state.terrainData[row] || state.terrainData[row][col] === undefined || state.terrainData[row][col] === null) return;
    
    let tVal = state.terrainData[row][col].toString();
    let tColor = state.terrainColors[tVal] || color(0);
    fill(tColor);
    noStroke();
    rect(px, py, cellSize, cellSize);
}

export function drawHeatmap(row, col, px, py, cellSize) {
    if (!state.heatmapData || !state.heatmapData[row] || typeof state.heatmapData[row][col] !== 'number') return;
    
    let hVal = state.heatmapData[row][col];
    if (hVal > 0) {
        let alpha = (state.networkLayer && state.terrainLayer) ? map(hVal, 0, 10, 8, 45) : map(hVal, 0, 10, 20, 200);
        fill(255, 160, 60, alpha); // warm amber
        noStroke();
        rect(px, py, cellSize, cellSize);
    }
}

export function drawHeatmapText(row, col, px, py, cellSize) {
    if (!state.heatmapData || !state.heatmapData[row] || typeof state.heatmapData[row][col] !== 'number') return;
    
    strokeWeight(0);
    let hVal = state.heatmapData[row][col];
    if (state.displayText && hVal > 0) {
        fill(255);
        text(hVal, px + cellSize / 2, py + cellSize / 2);
    }
}

// draw network

export function drawSimpleLayout(layout) {
    // Draw straight lines
    for (let l of layout.lines) {
        let hexColor = LINE_COLORS[l.lineId % LINE_COLORS.length];

        // Shadow/Outline
        stroke(10, 10, 20, 180);
        strokeWeight(5);
        line(l.x1, l.y1, l.x2, l.y2);

        // Colored Line
        stroke(color(hexColor));
        strokeWeight(2.5);
        line(l.x1, l.y1, l.x2, l.y2);
    }

    // Draw basic stations
    noStroke();
    let maxPop = Math.max(...layout.stations.map(s => s.pop || 1), 1);

    for (let station of layout.stations) {
        let radius = map(station.pop || 1, 0, maxPop, 6, 14);
        
        stroke(0); // Black outline
        strokeWeight(2);
        fill(state.cyanBlue || color(0, 255, 255));
        circle(station.pos.x, station.pos.y, radius);
    }
}

export function drawMetroLayout(layout) {
    if (!layout || !layout.rawStations || !layout.stationPos || !layout.linePolylines || !layout.interchanges) return;
    
    // Draw polyline segments
    for (let poly of layout.linePolylines) {
        let hexColor = LINE_COLORS[poly.lineId % LINE_COLORS.length];
        let pts = poly.pts;

        // Shadow/Outline
        noFill();
        stroke(10, 10, 20, 180);
        strokeWeight(5);
        beginShape();
        for (let p of pts) vertex(p.x, p.y);
        endShape();

        // Colored Line
        stroke(color(hexColor));
        strokeWeight(2.5);
        beginShape();
        for (let p of pts) vertex(p.x, p.y);
        endShape();
    }

    // Draw Stations & Interchanges
    let maxPop = Math.max(...layout.rawStations.map(s => s.pop || 1), 1);

    for (let [idx, pos] of layout.stationPos.entries()) {
        let isInterchange = layout.interchanges.has(Number(idx));
        let pop = layout.rawStations[idx].pop || 1;
        let radius = map(pop, 0, maxPop, 6, 14);

        if (isInterchange) {
            // Interchange rings (white with black stroke)
            stroke(0);
            strokeWeight(3);
            fill(255);
            circle(pos.x, pos.y, radius + 4);
            
            // Inner dot
            noStroke();
            fill(0);
            circle(pos.x, pos.y, radius / 2);
        } else {
            // Standard station
            stroke(0);
            strokeWeight(2);
            fill(255); // White inner for metro style
            circle(pos.x, pos.y, radius);
        }
    }
}