import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from perlin_noise import PerlinNoise

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sim
import agent

world = sim.WorldState()
test_agent = agent.Agent()
evolution = agent.EvolutionLoop()

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

@app.get("/test")
async def test():
    world.expand_heatmap(100)
    network = test_agent.build_network(world.get_candidate_stations())
    return {"network": network}

@app.get("/step")
async def step():
    world.expand_heatmap(2)
    return {"heatmap": world.heatmap}

@app.get("/step_generation")
async def step_generation():
    # mutate best three
    new_agents, best_score = evolution.run_generation(world)
    # set new population
    evolution.population = new_agents
    # send best network
    best_network = new_agents[0].build_network(world.get_candidate_stations())
    return {"best_network": best_network, "score": best_score, "generation": evolution.generation}

@app.post("/event")
async def event():
    pass
    return {"status": "ok"}

@app.post("/reset")
async def reset():
    global world, evolution
    world = sim.WorldState()
    evolution = agent.EvolutionLoop()
    return {"status": "ok"}