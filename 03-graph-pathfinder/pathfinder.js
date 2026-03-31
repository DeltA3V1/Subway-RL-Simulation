let stations = [];
let edges = [];

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

    fill(0, 0, 255);
    strokeWeight(2);

    for (let i = 0; i < edges.length; i++) {
        let from = stations[edges[i].from];
        let to = stations[edges[i].to];
        line(from.x, from.y, to.x, to.y);
    }
    
    for (let i = 0; i < stations.length; i++) {
        ellipse(stations[i].x, stations[i].y, 8, 8);
    }
}

async function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    let station = {"x": mouseX, "y": mouseY}
    await addStation(station);
    await fetchData();
}

async function resetNetwork() {
    try {
        await fetch('https://crispy-capybara-r94xj4j7v7vcwpj-8000.app.github.dev/reset_network', {
            method: 'POST'
        });
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