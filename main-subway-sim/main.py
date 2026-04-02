import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from perlin_noise import PerlinNoise


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
    return {"status": "ok"}

@app.get("/step_generation")
async def step_generation():
    return {"status": "ok"}

@app.post("/event")
async def event():
    pass
    return {"status": "ok"}