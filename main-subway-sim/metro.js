function normalizePositions(nodes, canvasW, canvasH, padding = 60) {
  const rows = nodes.map(n => n.row), cols = nodes.map(n => n.col);
  const [rMin, rMax] = [Math.min(...rows), Math.max(...rows)];
  const [cMin, cMax] = [Math.min(...cols), Math.max(...cols)];
  const stationPos = new Map();
  nodes.forEach((n, i) => {
    stationPos.set(i, {
      x: rMax === rMin ? canvasW / 2 : map(n.col, cMin, cMax, padding, canvasW - padding),
      y: rMax === rMin ? canvasH / 2 : map(n.row, rMin, rMax, padding, canvasH - padding)
    });
  });

  return stationPos;
}

function routeEdge(p1, p2) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const adx = Math.abs(dx), ady = Math.abs(dy);

  // If nearly straight, skip
  if (adx === 0 || ady === 0 || Math.min(adx, ady) / Math.max(adx, ady) < 0.15) {
    return [p1, p2];
  }
  // diagonal then straight
  const bend = adx > ady
    ? { x: p1.x + Math.sign(dx) * ady, y: p2.y }  // horizontal-dominant
    : { x: p2.x, y: p1.y + Math.sign(dy) * adx }; // vertical-dominant
  return [p1, bend, p2];
}

function offsetPolyline(pts, offsetIndex, spacing) {
  // Compute a normal vector from first→last and shift all points perpendicular
  const dx = pts[pts.length - 1].x - pts[0].x;
  const dy = pts[pts.length - 1].y - pts[0].y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len; // perpendicular unit vector
  const ox = nx * spacing * offsetIndex;
  const oy = ny * spacing * offsetIndex;
  return pts.map(p => ({ x: p.x + ox, y: p.y + oy }));
}


function buildMetroLayout(network, canvasW, canvasH) {
    const { nodes, edges } = network;
    if (!nodes.length) return { stationPos: new Map(), linePolylines: [], interchanges: new Set() };

    const stationPos = normalizePositions(nodes, canvasW, canvasH)

    const routedEdges = edges.map(edge => ({
        ...edge,
        pts: routeEdge(stationPos.get(edge.from), stationPos.get(edge.to))
    }));

    const segmentGroups = {};
    for (const edge of routedEdges) {
        const key = [Math.min(edge.from, edge.to), Math.max(edge.from, edge.to)].join('_');
        if (!segmentGroups[key]) segmentGroups[key] = [];
        segmentGroups[key].push(edge);
    }

    const linePolylines = [];
    for (const key in segmentGroups) {
        const group = segmentGroups[key];
        const n = group.length;
        group.forEach((edge, i) => {
            const offsetIndex = i - (n - 1) / 2;  // centres the bundle around 0
            linePolylines.push({
                lineId: edge.line_id,
                color: LINE_COLORS[edge.line_id % LINE_COLORS.length],
                pts: offsetPolyline(edge.pts, offsetIndex, LINE_SPACING)
            });
        });
    }

    const stationLineCount = new Map();
    for (const edge of edges) {
        for (const idx of [edge.from, edge.to]) {
            if (!stationLineCount.has(idx)) stationLineCount.set(idx, new Set());
            stationLineCount.get(idx).add(edge.line_id);
        }
    }

    const interchanges = new Set(
        [...stationLineCount.entries()]
        .filter(([_, lines]) => lines.size >= 2)
        .map(([idx]) => idx)
    );

    return { stationPos, linePolylines, interchanges };
}