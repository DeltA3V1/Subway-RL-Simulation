from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

heatmap = [[0 for _ in range(20)] for _ in range(20)]

def init_heatmap():
    for _ in range(5):
        rand_x, rand_y = random.randint(0, 19), random.randint(0, 19)
        heatmap[rand_x][rand_y] += 1

def update_heatmap():
    rand_x, rand_y = random.randint(0, 19), random.randint(0, 19)
    
    if heatmap[rand_x][rand_y] < 10:
        found_neighbor = False
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                nx, ny = rand_x + dx, rand_y + dy
                
                if 0 <= nx < 20 and 0 <= ny < 20:
                    if heatmap[nx][ny] > 0:
                        found_neighbor = True
                        break
            if found_neighbor: break
            
        if found_neighbor:
            heatmap[rand_x][rand_y] += 1

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

@app.get("/get_heatmap")
async def read_heatmap():
    update_heatmap()
    update_heatmap()
    return {"heatmap": heatmap}

@app.post("/reset_heatmap")
async def reset_heatmap():
    global heatmap
    heatmap = [[0 for _ in range(20)] for _ in range(20)]
    init_heatmap()
    return {"status": "ok"}

# To run the server, use the command:
# uvicorn 02-organic-heatmap.main:app --reload