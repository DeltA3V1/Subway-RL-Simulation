let data = { x: 200, y: 200 };
let path = [];
let maxPathLength = 100;

function setup() {
    createCanvas(400, 400);
}

function draw() {
    background(220);
    
    if (frameCount % 10 == 0) {
        fetchData();
    
        path.push({ x: data.x, y: data.y });
        if (path.length > maxPathLength) {
            path.shift();
        }
    }

    fill(0, 0, 255);
    rect(data.x - 2.5, data.y - 2.5, 5, 5);
    noFill();
    stroke(0);
    strokeWeight(3);
    beginShape();
    for (let i = 0; i < path.length; i++) {
        vertex(path[i].x, path[i].y);
    }
    vertex(data.x, data.y);
    endShape();
}

async function fetchData() {
    try {
        const response = await fetch('https://reimagined-space-disco-9v7xp7p6x45fpgpr-8000.app.github.dev/get_step');
        const incoming = await response.json();
        console.log('Data from backend:', incoming);
        data.x += (data.x + incoming.x >= 0 && data.x + incoming.x < 400) ? incoming.x : 0;
        data.y += (data.y + incoming.y >= 0 && data.y + incoming.y < 400) ? incoming.y : 0;
    } catch (error) {
        console.error('Error:', error);
    }
}