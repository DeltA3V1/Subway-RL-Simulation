let stations = [];
let edges = [];
let currentPath = [];

let trainIndex = 0;
let trainProgress = 0.0;

function setup() {
    let cnv = createCanvas(400, 400);
    cnv.parent('canvas-container');
}

function draw() {
    background(220);
    fill(255, 0, 0);
    ellipse(mouseX, mouseY, 4, 4);

    if (frameCount % 60 === 0) {
        fetchData();
    }

    stroke(0, 0, 0);
    strokeWeight(2);

    for (let i = 0; i < edges.length; i++) {
        let from = stations[edges[i].from];
        let to = stations[edges[i].to];
        line(from.x, from.y, to.x, to.y);
    }

    if (currentPath.length > 0) {
        strokeWeight(6);
        stroke(0, 0, 255, 100);
        for (let i = 0; i < currentPath.length - 1; i++) {
            let from = stations[currentPath[i]];
            let to = stations[currentPath[i + 1]];
            line(from.x, from.y, to.x, to.y);
        }
    }

    fill(255, 0, 0);
    stroke(0, 0, 0);
    strokeWeight(2);

    for (let i = 0; i < stations.length; i++) {
        if (i == 0 || i == stations.length - 1) { fill(0, 255, 0); }
        else { fill(255, 0, 0); }
        ellipse(stations[i].x, stations[i].y, 8, 8);
    }

    if (currentPath.length >= 2) {
        let fromIdx = currentPath[trainIndex];
        let toIdx = currentPath[trainIndex + 1];
        if (fromIdx === undefined || toIdx === undefined) {
            trainIndex = 0;
            return;
        }
        let from = stations[fromIdx];
        let to = stations[toIdx];
        let x = lerp(from.x, to.x, trainProgress);
        let y = lerp(from.y, to.y, trainProgress);
        fill(255, 255, 0);
        rect(x - 5, y - 5, 10, 10);

        trainProgress += 0.02;
        if (trainProgress >= 1.0) {
            trainProgress = 0.0;
            trainIndex++;
            if (trainIndex >= currentPath.length - 1) {
                trainIndex = 0;
            }
        }
    }
}

async function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    let station = {"x": mouseX, "y": mouseY}
    await addStation(station);
    await fetchData();
    if (stations.length >= 2) {
        await fetchShortestPath(0, stations.length - 1);
    }
}

async function resetNetwork() {
    try {
        await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/reset_network', {
            method: 'POST'
        });
        currentPath = [];
        await fetchData();
    } catch (error) {
        console.error('Error resetting network:', error);
    }
}

async function addStation(station) {
    try {
        await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/add_station', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(station)
        });
    } catch (error) {
        console.error('Error adding station:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/get_network');
        const incoming = await response.json();
        console.log('Data from backend:', incoming);
        stations = incoming.nodes;
        edges = incoming.edges;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchShortestPath(fromId, toId) {
    try {
        const response = await fetch(`https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/get_shortest_path?from_id=${fromId}&to_id=${toId}`);
        const data = await response.json();
        console.log('Shortest path:', data.path);
        currentPath = data.path;
        trainIndex = 0;
        trainProgress = 0.0;
    } catch (error) {
        console.error('Error fetching shortest path:', error);
    }
}