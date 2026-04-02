from perlin_noise import PerlinNoise
import random
import heapq
from itertools import chain

GRID_SIZE = 50
LOW_BOUND = -1
HIGH_BOUND = 2
SEEDS = 3

class WorldState:
    def __init__(self):
        self.terrain = [[1 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.init_terrain()
        self.init_heatmap()

    def reset_heatmap(self):
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

    def init_heatmap(self):
        # Seed 3 random heat sources on land
        attempts = 0
        seeds_placed = 0
        while seeds_placed < SEEDS and attempts < 100:
            x, y = random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1)
            if self.terrain[x][y] >= LOW_BOUND and self.terrain[x][y] <= HIGH_BOUND:
                self.heatmap[x][y] = 2
                seeds_placed += 1
            attempts += 1

    def init_terrain(self):
        noise = PerlinNoise(octaves=3, seed=random.randint(1, 100000))
        
        for x in range(GRID_SIZE):
            for y in range(GRID_SIZE):
                # Normalize coordinates
                nx = x / GRID_SIZE
                ny = y / GRID_SIZE
                
                # This outputs a float roughly between -0.5 and 0.5
                raw_noise = noise([nx, ny])
                
                # Stretch the noise to fit scale
                val = raw_noise * 8
                if val < -1.2:
                    scaled_noise = round(val) # Deep water
                elif val < -0.8:
                    scaled_noise = -1         # Sand
                else:
                    scaled_noise = round(val) # Land       

                # Round to integers and clamp
                self.terrain[x][y] = max(-4, min(4, round(scaled_noise)))
    
    def get_candidate_stations(self, num_candidates=20):
        land_cells = [
            (val, r, c) 
            for r, row in enumerate(self.heatmap) 
            for c, val in enumerate(row)
            if self.terrain[r][c] >= -1  
        ]
        
        cand = heapq.nlargest(num_candidates, land_cells, key=lambda x: x[0])
        
        return [{"x": r, "y": c, "pop": val} for val, r, c in cand]
    
    def sum_in_radius(self, center_row, center_col, radius):
        total_sum = 0
        rows = len(self.heatmap)
        cols = len(self.heatmap[0]) if rows > 0 else 0
        
        # Iterate through a bounding box of radius
        for r in range(max(0, center_row - radius), min(rows, center_row + radius + 1)):
            for c in range(max(0, center_col - radius), min(cols, center_col + radius + 1)):
                # dist check
                if (r - center_row)**2 + (c - center_col)**2 <= radius**2:
                    total_sum += self.heatmap[r][c]
                    
        return total_sum