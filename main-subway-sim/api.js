import * as state from './state.js';
import { saveSnapshot, clearSnapshots } from './snapshots.js';

const API_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev'; 

export async function step() {
    if (!state.runPop || state.fetchingPop) return;
    state.setFetchingPop(true);

    try {
        const response = await fetch(`${API_URL}/step`);
        const data = await response.json();
        state.setHeatmapData(data.heatmap);
    } catch (error) {
        console.error('Error fetching population step:', error);
    } finally {
        state.setFetchingPop(false);
    }
}

export async function runEvolutionStep() {
    if (!state.runAgent || state.fetchingAgent) return;
    state.setFetchingAgent(true);
    
    try {
        const response = await fetch(`${API_URL}/step_generation`);
        const data = await response.json();
        
        state.setStations(data.best_network.nodes);
        state.setEdges(data.best_network.edges);
        
        document.getElementById('stat-reward').innerText = data.score.toFixed(2);
        document.getElementById('stat-generation').innerText = data.generation;

        if (data.score_improved) {
            saveSnapshot(
                data.best_network.nodes,
                data.best_network.edges,
                data.generation,
                data.score,
            );
        }
        
    } catch (error) {
        console.error('Error fetching generation step:', error);
    } finally {
        state.setFetchingAgent(false);
    }
}

export async function resetSimulation() {
    try {
        state.setRunning(false);
        clearInterval(state.evolutionInterval);
        clearInterval(state.popInterval);
        document.getElementById('toggle-active').innerText = "Start Simulation";

        // --- NEW: clear timeline on reset ---
        clearSnapshots();

        await fetch(`${API_URL}/reset`, { method: 'POST' });
        await fetchAndInit();
    } catch (error) {
        console.error('Error resetting simulation:', error);
    }
}

export async function fetchAndInit() {
    try {
        const response = await fetch(`${API_URL}/init`);
        const data = await response.json();
        state.setHeatmapData(data.heatmap);
        state.setTerrainData(data.terrain);
        state.setRunPop(true);
        state.setRunAgent(false);
        document.getElementById('stat-active').innerText = "Population";
    } catch (error) {
        console.error('Error initializing simulation:', error);
    }
}