from perlin_noise import PerlinNoise
import random
import heapq
from itertools import chain
import math

GRID_SIZE = 30
LOW_BOUND = -1
HIGH_BOUND = 2
SEEDS = 3
MAX_POP = 10
NEW_HEAT_PROB = 0.005

class WorldState:
    def __init__(self):
        self.terrain = [[1 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]
        self.init_terrain()
        self.init_heatmap()
        self.land_spots = [(row, col) for row in range(GRID_SIZE) for col in range(GRID_SIZE) if self.terrain[row][col] >= LOW_BOUND and self.terrain[row][col] <= HIGH_BOUND]
        self.radius_masks = {} # cache for circle offsets


    def reset_heatmap(self):
        self.heatmap = [[0 for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

    def init_heatmap(self):
        # Seed 3 random heat sources on land
        attempts = 0
        seeds_placed = 0
        while seeds_placed < SEEDS and attempts < 100:
            row, col = random.randint(0, GRID_SIZE-1), random.randint(0, GRID_SIZE-1)
            if self.terrain[row][col] >= LOW_BOUND and self.terrain[row][col] <= HIGH_BOUND:
                self.heatmap[row][col] = 2
                seeds_placed += 1
            attempts += 1

    def init_terrain(self):
        noise = PerlinNoise(octaves=3, seed=random.randint(1, 100000))
        
        for row in range(GRID_SIZE):
            for col in range(GRID_SIZE):
                # Normalize coordinates
                nx = row / GRID_SIZE
                ny = col / GRID_SIZE
                
                # This outputs a float roughly between -0.5 and 0.5
                raw_noise = noise([nx, ny])
                
                # Stretch the noise to fit scale
                val = raw_noise * 8

                if -1.7 <= val and val <= -1.3:
                    scaled_noise = math.floor(val)
                elif -0.7 <= val and val <= -0.3:
                    scaled_noise = math.ceil(val)
                else:
                    scaled_noise = round(val) # Land       

                # Round to integers and clamp
                self.terrain[row][col] = max(-4, min(4, round(scaled_noise)))

    def expand_heatmap(self, i):
        for _ in range(i):
            row, col = random.choice(self.land_spots)
            
            is_near_heat = False
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    nx, ny = row + dx, col + dy
                    if 0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE and self.heatmap[nx][ny] > 0:
                        is_near_heat = True
                        break
            
            if is_near_heat or random.random() < NEW_HEAT_PROB:
                self.heatmap[row][col] = min(MAX_POP, self.heatmap[row][col] + 1)
    
    def get_candidate_stations(self, num_candidates=30):
        land_cells = [
            (val, r, c) 
            for r, row in enumerate(self.heatmap) 
            for c, val in enumerate(row)
            if self.terrain[r][c] >= -1  
        ]
        
        cand = heapq.nlargest(num_candidates, land_cells, key=lambda x: x[0])

        candidates = [{"row": r, "col": c, "pop": val} for val, r, c in cand]
        return candidates
    
    def get_circle_offsets(self, radius):
        if radius not in self.radius_masks:
            offsets = []
            for dr in range(-radius, radius + 1):
                for dc in range(-radius, radius + 1):
                    if dr**2 + dc**2 <= radius**2:
                        offsets.append((dr, dc))
            self.radius_masks[radius] = offsets
        return self.radius_masks[radius]

    def sum_in_radius(self, center_row, center_col, radius):
        total_sum = 0
        rows = len(self.heatmap)
        cols = len(self.heatmap[0]) if rows > 0 else 0
        
        for dr, dc in self.get_circle_offsets(radius):
            r, c = center_row + dr, center_col + dc
            if 0 <= r < rows and 0 <= c < cols:
                total_sum += self.heatmap[r][c]
                
        return total_sum
    