from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math

network = {"stations": [], "edges": []}
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
    network["stations"].append(new_node)
    for _, s_id in distances[:2]:
        network["edges"].append({"from": new_node["id"], "to": s_id})
    return True

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
    # Placeholder for shortest path calculation logic
    pass

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
    return {"status": "ok"}

# To run the server, use the command:
# uvicorn 03-graph-pathfinder.main:app --reload