from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import heapq

network = {"stations": [], "edges": []}
adjacency = {}
MIN_DISTANCE = 20

class Station(BaseModel):
    x: float
    y: float

def add_station(new_node):
    distances = []
    for s in network["stations"]:
        d = math.dist((new_node["x"], new_node["y"]), (s["x"], s["y"]))
        if d < MIN_DISTANCE: return False
        distances.append((d, s["id"]))

    distances.sort()
    new_node["id"] = len(network["stations"])
    adjacency[new_node["id"]] = []
    network["stations"].append(new_node)

    for _, s_id in distances[:2]:
        if s_id == new_node["id"]: continue
        network["edges"].append({"from": new_node["id"], "to": s_id})

        adjacency[new_node["id"]].append(s_id)
        adjacency[s_id].append(new_node["id"])
    return True

class Node:
    def __init__(self):
        self.x = 0
        self.y = 0
        self.g = 0
        self.h = 0
        self.f = 0
        self.id = None
        self.parent = None
    
    def __lt__(self, other):
        return self.f < other.f


def a_star(start_id, end_id):
    if start_id == end_id: return [start_id]

    start = Node()
    start.x = network["stations"][start_id]["x"]
    start.y = network["stations"][start_id]["y"]
    start.g = 0
    start.h = math.dist((start.x, start.y), (network["stations"][end_id]["x"], network["stations"][end_id]["y"]))
    start.f = start.g + start.h
    start.id = start_id

    open_list = [start]
    g_scores = {start_id: 0}

    while open_list:
        current = heapq.heappop(open_list)
        if current.id == end_id:
            path = []
            while current is not None:
                path.append(current.id)
                current = current.parent
            return path[::-1]

        for neighbor_id in adjacency[current.id]:
            g = math.dist((current.x, current.y), (network["stations"][neighbor_id]["x"], network["stations"][neighbor_id]["y"]))
            tent_g = current.g + g
            if tent_g < g_scores.get(neighbor_id, float('inf')):
                neighbor = Node()
                neighbor.x = network["stations"][neighbor_id]["x"]
                neighbor.y = network["stations"][neighbor_id]["y"]
                neighbor.g = tent_g
                neighbor.h = math.dist((neighbor.x, neighbor.y), (network["stations"][end_id]["x"], network["stations"][end_id]["y"]))
                neighbor.f = neighbor.g + neighbor.h
                neighbor.id = neighbor_id
                neighbor.parent = current

                g_scores[neighbor_id] = tent_g
                heapq.heappush(open_list, neighbor)
    return None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins. Good for testing, change in production!
    allow_credentials=False,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/get_network")
async def get_network():
    return {"nodes": network["stations"], "edges": network["edges"]}

@app.get("/get_shortest_path")
async def get_shortest_path(from_id: int, to_id: int):
    num_stations = len(network["stations"])
    if from_id < 0 or to_id < 0 or from_id >= num_stations or to_id >= num_stations:
        return {"path": [], "error": "Invalid station IDs"}
    
    path_array = a_star(from_id, to_id)
    if path_array is not None: return {"path": path_array}
    else: return {"path": []}

@app.post("/add_station")
async def add_station_endpoint(station: Station):
    if add_station(station.model_dump()):
        return {"status": "ok"}
    else:
        return {"status": "error"}

@app.post("/reset_network")
async def reset_network():
    global network
    network = {"stations": [], "edges": []}

    global adjacency
    adjacency = {}
    return {"status": "ok"}

# To run the server, use the command:
# uvicorn 03-graph-pathfinder.main:app --reload