// Configuration and constants

export const LINE_SPACING = 4;

export const STANDALONE_TERRAIN = {
    '-4': [20, 50, 150],  // deep water
    '-3': [30, 80, 200],  // water
    '-2': [50, 120, 220], // shallow water
    '-1': [230, 210, 150],// coast
    '0': [100, 180, 80],  // land
    '1': [60, 130, 50],   // forest
    '2': [100, 90, 70],   // foothills
    '3': [140, 140, 140], // mountain
    '4': [255, 255, 255]  // snow peak
};

export const DEFAULT_TERRAIN = {
    '-4': [15, 25, 45],   // deep water
    '-3': [20, 35, 60],   // water
    '-2': [25, 45, 75],   // shallow water
    '-1': [45, 48, 42],   // coast
    '0': [38, 45, 35],    // land
    '1': [42, 50, 38],    // forest
    '2': [50, 47, 42],    // foothills
    '3': [58, 55, 52],    // mountain
    '4': [75, 72, 70]     // snow peak
};

export const LINE_COLORS = [
    '#E3252B', // Red line
    '#F8A519', // Orange line  
    '#FECC00', // Yellow line
    '#008659', // Green line
    '#0070BD', // Blue line
    '#9B2EA0', // Purple line
    '#C0953B', // Brown line
];

export const DEFAULT_SPEEDS = {
    popSlow: 250,
    popFast: 50,
    agentSlow: 1000,
    agentFast: 500
};