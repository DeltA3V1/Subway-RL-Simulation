// Global state management

export let heatmapData = [];
export let terrainData = [];
export let stations = [];
export let edges = [];

// UI state
export let displayText = true;
export let fetchingAgent = false;
export let fetchingPop = false;
export let running = false;
export let metroNetwork = false;

// Simulation state
export let runAgent = false;
export let runPop = true;

// Speed settings
export let popSpeed = 250;
export let agentSpeed = 1000;

// Layer visibility
export let terrainLayer = true;
export let heatmapLayer = true;
export let networkLayer = true;

// Color mapping
export let terrainColors = {};
export let cyanBlue;

// Interval references
export let evolutionInterval;
export let popInterval;

// Setter functions
export function setHeatmapData(data) { heatmapData = data; }
export function setTerrainData(data) { terrainData = data; }
export function setStations(data) { stations = data; }
export function setEdges(data) { edges = data; }
export function setDisplayText(value) { displayText = value; }
export function setFetchingPop(value) { fetchingPop = value; }
export function setFetchingAgent(value) { fetchingAgent = value; }
export function setRunning(value) { running = value; }
export function setMetroNetwork(value) {metroNetwork = value; }
export function setRunAgent(value) { runAgent = value; }
export function setRunPop(value) { runPop = value; }
export function setPopSpeed(value) { popSpeed = value; }
export function setAgentSpeed(value) { agentSpeed = value; }
export function setTerrainLayer(value) { terrainLayer = value; }
export function setHeatmapLayer(value) { heatmapLayer = value; }
export function setNetworkLayer(value) { networkLayer = value; }
export function setTerrainColors(colors) { terrainColors = colors; }
export function setCyanBlue(c) { cyanBlue = c; }
export function setEvolutionInterval(interval) { evolutionInterval = interval; }
export function setPopInterval(interval) { popInterval = interval; }