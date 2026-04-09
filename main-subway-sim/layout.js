import { LINE_SPACING } from './config.js';

// math helpers

export function cellToPixel(row, col, cellSize) {
    return { x: col * cellSize + (cellSize / 2), y: row * cellSize + (cellSize / 2) };
}

export function groupSegments(edges) {
    let segments = {};
    for (let edge of edges) {
        let minIdx = Math.min(edge.from, edge.to);
        let maxIdx = Math.max(edge.from, edge.to);
        let key = `${minIdx}_${maxIdx}`;

        if (!segments[key]) {
            segments[key] = [];
        }
        segments[key].push(edge);
    }
    return segments;
}

export function computeOffsets(p1, p2, index, total, spacing) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let len = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // Perpendicular unit vector
    let nx = -dy / len; 
    let ny = dx / len;

    let offsetMultiplier = index - (total - 1) / 2;
    
    return {
        offsetX: nx * spacing * offsetMultiplier,
        offsetY: ny * spacing * offsetMultiplier
    };
}

export function routeEdge(p1, p2) {
    if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p1.y !== 'number' || typeof p2.x !== 'number' || typeof p2.y !== 'number') {
        return [p1, p2].filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
    }
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // If nearly straight, skip the bend
    if (adx === 0 || ady === 0 || Math.min(adx, ady) / Math.max(adx, ady) < 0.05) {
        return [p1, p2];
    }
    
    // Diagonal then straight (octagonal routing)
    const bend = adx > ady
        ? { x: p1.x + Math.sign(dx) * ady, y: p2.y }  // horizontal-dominant
        : { x: p2.x, y: p1.y + Math.sign(dy) * adx }; // vertical-dominant
    
    return [p1, bend, p2];
}

export function offsetPolyline(pts, offsetIndex, spacing) {
    if (!pts || pts.length < 2) return pts || [];
    
    const dx = pts[pts.length - 1].x - pts[0].x;
    const dy = pts[pts.length - 1].y - pts[0].y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len; 
    
    const ox = nx * spacing * offsetIndex;
    const oy = ny * spacing * offsetIndex;
    
    return pts.map(p => ({ x: p.x + ox, y: p.y + oy }));
}

export function detectInterchanges(edges) {
    const stationLineCount = new Map();
    for (const edge of edges) {
        for (const idx of [edge.from, edge.to]) {
            if (!stationLineCount.has(idx)) stationLineCount.set(idx, new Set());
            stationLineCount.get(idx).add(edge.line_id);
        }
    }

    return new Set(
        [...stationLineCount.entries()]
        .filter(([_, lines]) => lines.size >= 2)
        .map(([idx]) => idx)
    );
}

// layout builders

export function buildSimpleLayout(stations, edges, cellSize) {
    if (!edges || !stations) return { lines: [], stations: [] };

    let segments = groupSegments(edges);
    let linesData = [];

    for (let key in segments) {
        let group = segments[key];
        let [fromIdx, toIdx] = key.split('_').map(Number);
        
        // Skip if station indices are out of bounds
        if (fromIdx >= stations.length || toIdx >= stations.length || !stations[fromIdx] || !stations[toIdx]) continue;
        
        let p1 = cellToPixel(stations[fromIdx].row, stations[fromIdx].col, cellSize);
        let p2 = cellToPixel(stations[toIdx].row, stations[toIdx].col, cellSize);

        group.forEach((edge, i) => {
            let { offsetX, offsetY } = computeOffsets(p1, p2, i, group.length, LINE_SPACING);
            linesData.push({
                lineId: edge.line_id,
                x1: p1.x + offsetX, y1: p1.y + offsetY,
                x2: p2.x + offsetX, y2: p2.y + offsetY
            });
        });
    }

    let stationsData = stations.map(s => ({
        ...s,
        pos: cellToPixel(s.row, s.col, cellSize)
    }));

    return { lines: linesData, stations: stationsData };
}

export function buildMetroLayout(stations, edges, cellSize) {
    if (!stations || !stations.length) return { stationPos: new Map(), linePolylines: [], interchanges: new Set(), rawStations: [] };

    let stationPos = new Map(stations.map((s, i) => [i, cellToPixel(s.row, s.col, cellSize)]));

    const routedEdges = edges.map(edge => ({
        ...edge,
        pts: routeEdge(stationPos.get(edge.from), stationPos.get(edge.to))
    }));

    const segments = groupSegments(routedEdges);
    const linePolylines = [];

    for (const key in segments) {
        const group = segments[key];
        group.forEach((edge, i) => {
            const offsetIndex = i - (group.length - 1) / 2;
            linePolylines.push({
                lineId: edge.line_id,
                pts: offsetPolyline(edge.pts, offsetIndex, LINE_SPACING)
            });
        });
    }

    const interchanges = detectInterchanges(edges);

    return { 
        stationPos, 
        linePolylines, 
        interchanges,
        rawStations: stations 
    };
}