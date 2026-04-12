/**
 * snapshots.js
 * Manages the network history timeline strip.
 *
 * - Saves raw data snapshots (not images) whenever score improves.
 * - Culls middle snapshots when the cap is exceeded, keeping the most
 *   visually distinct landmarks (largest score-delta from neighbours).
 * - Renders each snapshot as a tiny vanilla Canvas-2D thumbnail.
 */

import * as state from './state.js';
import { LINE_COLORS } from './config.js';

const GRID_SIZE   = 30;
const THUMB_SIZE  = 88;   // px
const MAX_SNAPS   = 28;   // hard cap
const KEEP_ENDS   = 3;    // never cull first/last n snapshots

let _nextSnapId = 0; // monotonic ID


export function saveSnapshot(stations, edges, generation, score) {
    // deepcopy
    const snap = {
        _id:      _nextSnapId++,
        stations: JSON.parse(JSON.stringify(stations)),
        edges:    JSON.parse(JSON.stringify(edges)),
        generation,
        score,
    };

    const next = [...state.snapshots, snap];
    const culled = next.length > MAX_SNAPS ? cull(next) : next;
    state.setSnapshots(culled);
    appendThumbnail(snap, culled.length - 1);
}


export function clearSnapshots() {
    _nextSnapId = 0;
    state.setSnapshots([]);
    const strip = document.getElementById('snap-inner');
    if (strip) strip.innerHTML = '';
    updateEmptyState();
}


function cull(snaps) {
    if (snaps.length <= KEEP_ENDS * 2 + 1) return snaps;

    let minDelta = Infinity;
    let minIdx   = -1;

    for (let i = KEEP_ENDS; i < snaps.length - KEEP_ENDS; i++) {
        const prev  = snaps[i - 1].score;
        const curr  = snaps[i].score;
        const next  = snaps[i + 1].score;
        const delta = Math.abs(curr - prev) + Math.abs(next - curr);
        if (delta < minDelta) {
            minDelta = delta;
            minIdx   = i;
        }
    }

    if (minIdx === -1) return snaps;

    // Remove culled card from DOM too
    const strip = document.getElementById('snap-inner');
    if (strip) {
        const cards = strip.querySelectorAll('.snap-card');
        if (cards[minIdx]) cards[minIdx].remove();
    }

    return snaps.filter((_, i) => i !== minIdx);
}


function deleteSnapshot(snapId, card) {
    // Remove from state array
    state.setSnapshots(state.snapshots.filter(s => s._id !== snapId));

    // Animate out then remove DOM node
    card.style.transition = 'opacity 0.15s, transform 0.15s';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.88)';
    card.addEventListener('transitionend', () => {
        card.remove();
        updateEmptyState();
    }, { once: true });
}


function appendThumbnail(snap, index) {
    const strip = document.getElementById('snap-inner');
    if (!strip) return;

    // Remove empty-state placeholder if present
    const placeholder = strip.querySelector('.snap-empty');
    if (placeholder) placeholder.remove();

    const card = document.createElement('div');
    card.className = 'snap-card';
    card.dataset.snapId = snap._id;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'snap-delete';
    deleteBtn.title = 'Remove this snapshot';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // don't trigger card selection
        deleteSnapshot(snap._id, card);
    });
    card.appendChild(deleteBtn);

    // Canvas thumbnail
    const canvas = document.createElement('canvas');
    canvas.width  = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
    renderThumbnail(canvas, snap);
    card.appendChild(canvas);

    // Label row
    const label = document.createElement('div');
    label.className = 'snap-label';
    label.innerHTML =
        `<span class="snap-gen">G${snap.generation}</span>` +
        `<span class="snap-score">${snap.score.toFixed(0)}</span>`;
    card.appendChild(label);

    // Tooltip on hover
    card.title = `Generation ${snap.generation} · Score ${snap.score.toFixed(2)}`;

    // Click → highlight (could restore to main canvas in future)
    card.addEventListener('click', () => {
        document.querySelectorAll('.snap-card').forEach(c => c.classList.remove('snap-selected'));
        card.classList.add('snap-selected');
    });

    strip.appendChild(card);

    // Auto-scroll to newest
    const container = document.getElementById('snap-scroll');
    if (container) container.scrollLeft = container.scrollWidth;

    updateEmptyState();
}


function renderThumbnail(canvas, snap) {
    const ctx      = canvas.getContext('2d');
    const padding  = 4;
    const drawSize = THUMB_SIZE - padding * 2;
    const cell     = drawSize / GRID_SIZE;

    // Background
    ctx.fillStyle = '#12161f';
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);

    function stationXY(s) {
        return {
            x: padding + s.col * cell + cell / 2,
            y: padding + s.row * cell + cell / 2,
        };
    }

    // Edges
    ctx.lineWidth = 1.2;
    for (const edge of snap.edges) {
        const a = snap.stations[edge.from];
        const b = snap.stations[edge.to];
        if (!a || !b) continue;

        const pa = stationXY(a);
        const pb = stationXY(b);
        const hex = LINE_COLORS[edge.line_id % LINE_COLORS.length];

        // Soft shadow
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();

        // Coloured line
        ctx.strokeStyle = hex;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
    }

    // Stations
    const maxPop = Math.max(...snap.stations.map(s => s.pop || 1), 1);
    for (const station of snap.stations) {
        const { x, y } = stationXY(station);
        const pop    = station.pop || 1;
        const radius = 0.6 + (pop / maxPop) * 1.2;

        ctx.beginPath();
        ctx.arc(x, y, radius + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

function updateEmptyState() {
    const strip = document.getElementById('snap-inner');
    if (!strip) return;
    const hasCards = strip.querySelector('.snap-card');
    const hasEmpty = strip.querySelector('.snap-empty');
    if (!hasCards && !hasEmpty) {
        const el = document.createElement('div');
        el.className = 'snap-empty';
        el.textContent = 'Landmarks will appear here as the score improves';
        strip.appendChild(el);
    }
}