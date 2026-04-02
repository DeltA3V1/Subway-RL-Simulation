from perlin_noise import PerlinNoise
import random
import heapq
from itertools import chain

GRID_SIZE = 20


class WorldState:
    def __init__(self):
        self.terrain = [[1 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.init_terrain()

    def reset_heatmap(self):
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

    def init_population(self):
        # Seed 3 random heat sources on land
        attempts = 0
        seeds_placed = 0
        while seeds_placed < 3 and attempts < 100:
            x, y = random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1)
            if self.terrain[x][y] >= 0: # Only start heat on land
                self.heatmap[x][y] = 2
                seeds_placed += 1
            attempts += 1

    def init_terrain(self):
        noise = PerlinNoise(octaves=2.5, seed=random.randint(1, 100000))
        
        for x in range(GRID_SIZE):
            for y in range(GRID_SIZE):
                # Normalize coordinates
                nx = x / GRID_SIZE
                ny = y / GRID_SIZE
                
                # This outputs a float roughly between -0.5 and 0.5
                raw_noise = noise([nx, ny])
                
                # Stretch the noise to fit scale
                scaled_noise = raw_noise * 8
                
                # Round to integers and clamp
                self.terrain[x][y] = max(-4, min(4, round(scaled_noise)))

    def get_candidate_stations(self, num_candidates=20):
        indexed_list = [
        (val, r, c) 
        for r, row in enumerate(self.heatmap) 
        for c, val in enumerate(row)
    ]
        cand = heapq.nlargest(num_candidates, chain.from_iterable(indexed_list))
        return [(r, c) for val, r, c in cand]