const API_BASE_URL = 'https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev';
const stepsElement = document.getElementById('steps');
const episodesElement = document.getElementById('episodes');
const rewardElement = document.getElementById('reward');
const totalRewardElement = document.getElementById('total-reward');

let pits = [];
let current_position = [0, 0];
let goal = [4, 4];
let current_episode = 0;
let steps = 0;
let reward = 0;
let total_reward = 0;
let framesPerStep = 60;
let running = true;
GRID_SIZE = 5;


function setup() {
    let cnv = createCanvas(400, 400);
    cnv.parent('canvas-container');
    fetchData();
}

function draw() {
    background(220);
    fill(255, 0, 0);

    if (frameCount % framesPerStep === 0 && running) {
        step();
    }

    fill(0, 0, 0, 100);
    strokeWeight(2);
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (pits.some(pit => pit[0] === i && pit[1] === j)) {
                fill(0, 0, 0);
            } else if (goal[0] === i && goal[1] === j) {
                fill(255, 255, 0);
            } else {
                fill(0, 0, 0, 100);
            }
            rect(j * 80, i * 80, 80, 80);
            if (current_position[0] === i && current_position[1] === j) {
                fill(0, 255, 0);
                rect(j * 80 + 20, i * 80 + 20, 40, 40);
                fill(0, 0, 0, 100);
            }
            
        }
    }
}

function keyPressed() {
    if (keyCode === ENTER) {
        step();
    }
    if (keyCode === 84) {
        framesPerStep = framesPerStep === 60 ? 5 : 60;
    }
}

async function resetData() {
    try {
        await fetch(`${API_BASE_URL}/reset_data`, {
            method: 'POST'
        });
        pits = [];
        current_position = [0, 0];
        goal = [4, 4];
        reward = 0;
        total_reward = 0;
        running = true;
        await fetchData();
    } catch (error) {
        console.error('Error resetting grid:', error);
    }
}


async function fetchData() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_data`);
        const incoming = await response.json();
        console.log('Data from backend:', incoming);
        pits = incoming.pits;
        current_position = incoming.current_position;
        goal = incoming.goal;

    } catch (error) {
        console.error('Error:', error);
    }
}

async function step() {
    try {
        const response = await fetch(`${API_BASE_URL}/step`);
        const data = await response.json();
        
        current_position = [data.x, data.y];
        reward = data.reward;
        total_reward += reward;
        steps += 1;

        stepsElement.textContent = `Steps: ${steps}`;
        episodesElement.textContent = `Episodes: ${current_episode}`;
        rewardElement.textContent = `Last Step Reward: ${reward}`;
        totalRewardElement.textContent = `Total Reward: ${total_reward.toFixed(1)}`;

        if (data.done) {
            current_episode++;
            running = false;
            setTimeout(resetData, framesPerStep * 10); 
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
