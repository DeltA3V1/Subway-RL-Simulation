import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from perlin_noise import PerlinNoise

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sim
import agent

NUM_CANDIDATES = 60

world = sim.WorldState()
test_agent = agent.Agent(NUM_CANDIDATES)
evolution = agent.EvolutionLoop(NUM_CANDIDATES)

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
    candidates = world.get_candidate_stations(NUM_CANDIDATES)
    return {"heatmap": world.heatmap, "terrain": world.terrain, "cand_pos": candidates}

@app.get("/test")
async def test():
    world.expand_heatmap(100)
    candidates = world.get_candidate_stations(NUM_CANDIDATES)
    network = test_agent.build_network(candidates)
    return {"network": network}

@app.get("/step")
async def step():
    world.expand_heatmap(5)
    return {"heatmap": world.heatmap}

@app.get("/step_generation")
async def step_generation():
    new_agents, best_score, score_improved = evolution.run_generation(world)
    evolution.population = new_agents
    candidates = world.get_candidate_stations(NUM_CANDIDATES)
    best_network = new_agents[0].return_network(candidates)
    return {
        "best_network": best_network,
        "score": best_score,
        "generation": evolution.generation,
        "score_improved": score_improved,
    }

@app.post("/event")
async def event():
    pass
    return {"status": "ok"}

@app.post("/reset")
async def reset():
    global world, evolution
    world = sim.WorldState()
    evolution = agent.EvolutionLoop(NUM_CANDIDATES)
    return {"status": "ok"}