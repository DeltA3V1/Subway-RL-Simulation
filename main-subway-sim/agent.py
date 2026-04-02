import random
import copy
import math

COVERAGE_RADIUS = 3
REWARD_CONFIG = {"coverage": 1.0, "track_cost": 0.5, "isolation_penalty": 20.0}

action_templates = [
    lambda: {"type": "BUILD", "cand_index": random.randint(0, 19)},
    lambda: {"type": "CONNECT", "station_A_index": random.randint(0, 19), "station_B_index": random.randint(0, 19)}
]

class Agent:
    def __init__(self, dna=None):
        if dna:
            self.dna = copy.deepcopy(dna)
        else:
            self.dna = [random.choice(action_templates)() for _ in range(10)]

    def choose_random(self):
        return random.choice(self.dna)
    
    # in progress
    def build_network(self, candidates):
        network = {
            "nodes": [],
            "edges": [], 
            "built_indices": set()
        }
        for action in self.dna:
            if action["type"] == "BUILD":
                idx = action["cand_index"]
                # exist check
                if idx not in network["built_indices"]:
                    network["built_indices"].add(idx)
                    # add coords
                    network["nodes"].append(candidates[idx])
            
            elif action["type"] == "CONNECT":
                idx_a = action["station_A_index"]
                idx_b = action["station_B_index"]
                
                if idx_a == idx_b:
                    continue
                
                # exist check
                if idx_a in network["built_indices"] and idx_b in network["built_indices"]:
                    # connect
                    network["edges"].append({"from": idx_a, "to": idx_b})

        return network
    
    def mutate(self):
        pass

class EvolutionLoop:
    def run_generation():
        pass

def score_network(network, world):
    score = 0.0
    
    # Coverage Reward
    for node in network["nodes"]:
        score += (world.sum_in_radius(node["x"], node["y"], COVERAGE_RADIUS) * REWARD_CONFIG["coverage"])
        
    # Track Penalty
    connected_indices = set()
    for edge in network["edges"]:
        n1 = network["nodes"][edge["from"]]
        n2 = network["nodes"][edge["to"]]
        
        dist = math.dist((n1["x"], n1["y"]), (n2["x"], n2["y"]))
        score -= (dist * REWARD_CONFIG["track_cost"])
        
        # Track which stations have connections
        connected_indices.add(edge["from"])
        connected_indices.add(edge["to"])

    # 3. Isolation Penalty
    for idx in network["built_indices"]:
        if idx not in connected_indices:
            score -= REWARD_CONFIG["isolation_penalty"]
            
    return score