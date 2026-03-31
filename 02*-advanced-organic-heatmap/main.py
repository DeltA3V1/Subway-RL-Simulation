from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

heatmap = [[0 for _ in range(20)] for _ in range(20)]
terrain = [[0 for _ in range(20)] for _ in range(20)]
# terrain: -4 = deep water, -3 to -1 = shallow water, 0 = land, 1 = highland, 2 = mountain

def init_heatmap():
    for _ in range(5):
        rand_x, rand_y = random.randint(0, 19), random.randint(0, 19)
        if terrain[rand_x][rand_y] >= 0:
            heatmap[rand_x][rand_y] += 1
    
def init_terrain():
    for _ in range(10):
        rand_x, rand_y = random.randint(0, 19), random.randint(0, 19)
        terrain[rand_x][rand_y] = random.choice([-4, -3, 1])
    terrain_count = 10;
    while terrain_count < 40:
        if update_map(terrain, "terrain", 2):
            terrain_count += 1
        update_map(terrain, "heatmap", 2)

def update_map(data, map_type, max_value=3):
    rand_x, rand_y = random.randint(0, 19), random.randint(0, 19)
    if map_type == "heatmap" and terrain[rand_x][rand_y] < 0:
        return False
    
    if data[rand_x][rand_y] < max_value:
        neighbor = None
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                nx, ny = rand_x + dx, rand_y + dy
                
                if 0 <= nx < 20 and 0 <= ny < 20:
                    if data[nx][ny] > 0:
                        neighbor = (nx, ny)
                        break
            if neighbor: break
            
        if neighbor:
            if map_type == "heatmap":
                data[rand_x][rand_y] += 1
            elif map_type == "terrain":
                data[rand_x][rand_y] = data[neighbor[0]][neighbor[1]]
            return True
    return False

init_terrain()
init_heatmap()

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

@app.get("/get_maps")
async def read_maps():
    update_map(heatmap, "heatmap")
    update_map(heatmap, "heatmap")
    return {"heatmap": heatmap, "terrain": terrain}

@app.post("/reset_maps")
async def reset_maps():
    global heatmap, terrain
    heatmap = [[0 for _ in range(20)] for _ in range(20)]
    terrain = [[0 for _ in range(20)] for _ in range(20)]
    init_terrain()
    init_heatmap()
    return {"status": "ok"}

# To run the server, use the command:
# uvicorn 02*-advanced-organic-heatmap.main:app --reload