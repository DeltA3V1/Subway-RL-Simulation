import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from perlin_noise import PerlinNoise

GRID_SIZE = 20

heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
terrain = [[1 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

def init_terrain():
    global terrain
    
    noise = PerlinNoise(octaves=2.5, seed=random.randint(1, 100000))
    
    for x in range(GRID_SIZE):
        for y in range(GRID_SIZE):
            # Normalize coordinates
            nx = x / GRID_SIZE
            ny = y / GRID_SIZE
            
            # This outputs a float roughly between -0.5 and 0.5
            raw_noise = noise([nx, ny])
            
            # Stretch the noise to fit scale.
            scaled_noise = raw_noise * 8
            
            # Round to integers and clamp
            terrain[x][y] = max(-4, min(4, round(scaled_noise)))

def init_heatmap():
    global heatmap
    heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
    # Seed 3 random heat sources on land
    attempts = 0
    seeds_placed = 0
    while seeds_placed < 3 and attempts < 100:
        x, y = random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1)
        if terrain[x][y] >= 0: # Only start heat on land
            heatmap[x][y] = 2
            seeds_placed += 1
        attempts += 1

def update_heatmap():
    # Find all land coordinates
    land_spots = [(x, y) for x in range(GRID_SIZE) for y in range(GRID_SIZE) if terrain[x][y] >= 0]
    if not land_spots: return

    for _ in range(3): # 3 updates per call
        rx, ry = random.choice(land_spots)
        
        is_near_heat = False
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                nx, ny = rx + dx, ry + dy
                if 0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE and heatmap[nx][ny] > 0:
                    is_near_heat = True
                    break
        
        if is_near_heat or random.random() < 0.05:
            heatmap[rx][ry] = min(10, heatmap[rx][ry] + 1)


init_terrain()
init_heatmap()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

@app.get("/get_maps")
async def read_maps():
    update_heatmap()
    return {"heatmap": heatmap, "terrain": terrain}

@app.post("/reset_maps")
async def reset_maps():
    init_terrain()
    init_heatmap()
    return {"status": "ok"}