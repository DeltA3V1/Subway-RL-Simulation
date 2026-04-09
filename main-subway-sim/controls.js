// Control functions for simulation

import { step, runEvolutionStep } from './api.js';
import { DEFAULT_SPEEDS } from './config.js';
import * as state from './state.js';

export function toggleActive() {
    state.setRunning(!state.running);
    if (!state.running) {
        clearInterval(state.evolutionInterval);
        clearInterval(state.popInterval);
    } else {
        state.setEvolutionInterval(setInterval(runEvolutionStep, state.agentSpeed));
        state.setPopInterval(setInterval(step, state.popSpeed));
    }
    document.getElementById('toggle-active').innerText = state.running ? "Pause Simulation" : "Start Simulation";
}

export function toggleState() {
    state.setRunPop(!state.runPop);
    state.setRunAgent(!state.runAgent);
    document.getElementById('stat-active').innerText = state.runPop ? "Population" : "Agent"
}

export function toggleSpeed() {
    const newPopSpeed = state.popSpeed === DEFAULT_SPEEDS.popSlow ? DEFAULT_SPEEDS.popFast : DEFAULT_SPEEDS.popSlow;
    const newAgentSpeed = state.agentSpeed === DEFAULT_SPEEDS.agentSlow ? DEFAULT_SPEEDS.agentFast : DEFAULT_SPEEDS.agentSlow;
    
    state.setPopSpeed(newPopSpeed);
    state.setAgentSpeed(newAgentSpeed);
    
    if (newPopSpeed === DEFAULT_SPEEDS.popFast) {
        document.getElementById('toggle-speed').innerText = "Speed: Fast";
    } else {
        document.getElementById('toggle-speed').innerText = "Speed: Slow";
    }
    
    if (state.running) {
        clearInterval(state.evolutionInterval);
        clearInterval(state.popInterval);
        state.setEvolutionInterval(setInterval(runEvolutionStep, state.agentSpeed));
        state.setPopInterval(setInterval(step, state.popSpeed));
    }
}