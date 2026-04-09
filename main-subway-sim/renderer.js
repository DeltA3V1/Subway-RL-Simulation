import { LINE_SPACING, LINE_COLORS, STANDALONE_TERRAIN, DEFAULT_TERRAIN } from './config.js';
import * as state from './state.js';

export const GRID_SIZE = 30;

export function cellToPixel(row, col) {
    let cellSize = width / GRID_SIZE;
    return { x: col * cellSize + (cellSize / 2), y: row * cellSize + (cellSize / 2) };
}

export function drawTerrain(row, col, px, py, cellSize) {
    let tVal = state.terrainData[row][col].toString();
    let tColor = state.terrainColors[tVal] || color(0);
    fill(tColor);
    noStroke();
    rect(px, py, cellSize, cellSize);
}

export function drawHeatmap(row, col, px, py, cellSize) {
    let hVal = state.heatmapData[row][col];
    if (hVal > 0) {
        let alpha = (state.networkLayer && state.terrainLayer) ? map(hVal, 0, 10, 8, 45) : map(hVal, 0, 10, 20, 200);
        fill(255, 160, 60, alpha); // warm amber
        noStroke();
        rect(px, py, cellSize, cellSize);
    }
}

export function drawHeatmapText(row, col, px, py, cellSize) {
    strokeWeight(0);
    let hVal = state.heatmapData[row][col];
    if (state.displayText && hVal > 0) {
        fill(255);
        text(hVal, px + cellSize / 2, py + cellSize / 2);
    }
}

export function drawNetwork(stations, edges, cellSize) {
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
        fill(state.cyanBlue);
        circle(p.x, p.y, radius);
    }
}