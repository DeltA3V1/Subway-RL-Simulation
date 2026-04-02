import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from perlin_noise import PerlinNoise

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sim

world = sim.WorldState()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

@app.get("/init")
async def read_maps():
    return {"heatmap": world.heatmap, "terrain": world.terrain, "cand_pos": world.get_candidate_stations()}

@app.get("/step_generation")
async def step_generation():
    return {"status": "ok"}

@app.post("/event")
async def event():
    pass
    return {"status": "ok"}

@app.post("/reset")
async def reset():
    global world
    world = sim.WorldState()
    return {"status": "ok"}