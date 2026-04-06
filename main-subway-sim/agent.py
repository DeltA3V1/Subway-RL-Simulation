import random
import copy
import math
import heapq

GRID_SIZE = 30
COVERAGE_RADIUS = 3
REWARD_CONFIG = {"coverage": 1, "track_cost": -0.5, "isolation_penalty": -5, "connectivity_bonus": 3, "station_cost": -15}
MAX_EDGE_LENGTH = 100
MUTATION_RATE = 0.1
GROWTH_RATE = 0.1
DECAY_RATE = 0.05


line_dna = [
    [1, 3, 5, 7],
    [2, 4, 6, 8]
]

class Agent:
    def __init__(self, dna=None):
        if dna:
            self.dna = copy.deepcopy(dna)
        else:
            self.dna = [self.get_random_action() for _ in range(10)]


    def get_random_action(self, num_candidates=30):
        if random.random() < 0.5:
            return {"type": "BUILD", "cand_index": random.randint(0, num_candidates - 1)}
        else:
            return {
                "type": "CONNECT", 
                "station_A_index": random.randint(0, num_candidates - 1), 
                "station_B_index": random.randint(0, num_candidates - 1)
            }
    
    def choose_random(self):
        return random.choice(self.dna)
    
    def build_network(self, candidates):
        cand_to_local_map = {}
        network = {
            "nodes": [],
            "edges": [], 
            "built_indices": set()
        }
        for action in self.dna:
            if action["type"] == "BUILD":
                if not candidates:
                    continue 
                    
                idx = action["cand_index"] % len(candidates) 
                
                if idx not in network["built_indices"]:
                    network["built_indices"].add(idx)
                    cand_to_local_map[idx] = len(network["nodes"])
                    network["nodes"].append(candidates[idx])
            
            elif action["type"] == "CONNECT":
                idx_a = action["station_A_index"]
                idx_b = action["station_B_index"]
                
                if idx_a == idx_b:
                    continue
                
                # exist check
                if idx_a in network["built_indices"] and idx_b in network["built_indices"]:
                    # disabled for now
                    # if math.dist((candidates[idx_a]["row"], candidates[idx_a]["col"]), (candidates[idx_b]["row"], candidates[idx_b]["col"])) > MAX_EDGE_LENGTH:
                    #    continue # too far, skip
                    # connect
                    network["edges"].append({"from": cand_to_local_map[idx_a], "to": cand_to_local_map[idx_b]})

        return network
    
    def mutate(self):
        new_dna = [action for action in self.dna if random.random() > DECAY_RATE]
        
        for i in range(len(new_dna)):
            if random.random() < MUTATION_RATE:
                # new random action
                new_dna[i] = self.get_random_action()

        if random.random() < GROWTH_RATE:
            new_dna.append(self.get_random_action())
        
        return Agent(dna=new_dna)
    
    def score(self, network, world):
        score = 0.0
        covered_cells = set()
        
        connected_indices = {edge["from"] for edge in network["edges"]} | \
                            {edge["to"] for edge in network["edges"]}

        for i, node in enumerate(network["nodes"]):
            score += REWARD_CONFIG["station_cost"] # Penalty for each station built
            if i not in connected_indices:
                score += REWARD_CONFIG["isolation_penalty"] # Penalty for being isolated
            else:
                degree = sum(1 for e in network["edges"] if e["from"] == i or e["to"] == i)
                score += degree * REWARD_CONFIG["connectivity_bonus"] # Bonus for connectivity

            center_row, center_col = node["row"], node["col"]
            radius = COVERAGE_RADIUS
                
            for r in range(max(0, center_row - radius), min(GRID_SIZE, center_row + radius + 1)):
                for c in range(max(0, center_col - radius), min(GRID_SIZE, center_col + radius + 1)):
                    if (r - center_row)**2 + (c - center_col)**2 <= radius**2:
                        if (r, c) not in covered_cells:
                            score += world.heatmap[r][c] * REWARD_CONFIG["coverage"]
                            covered_cells.add((r, c))

        # Apply the global track cost for each edge built
        for edge in network["edges"]:
            a = network["nodes"][edge["from"]]
            b = network["nodes"][edge["to"]]
            dist = math.dist((a["row"], a["col"]), (b["row"], b["col"]))
            score += dist * REWARD_CONFIG["track_cost"]

        return score


class EvolutionLoop:
    def __init__(self):
        self.population = [Agent() for _ in range(20)]
        self.generation = 0

    def run_generation(self, world):
        self.generation += 1
        candidates = world.get_candidate_stations()
        scored_agents = []

        for idx, agent in enumerate(self.population):
            network = agent.build_network(candidates)
            score = agent.score(network, world)
            scored_agents.append((score, idx, agent))

        scored_agents.sort(key=lambda x: x[0], reverse=True)
        top_3 = [item[2] for item in scored_agents[:3]]
        
        new_generation = []
        new_generation.extend(top_3)

        while len(new_generation) < 20:
            parent = random.choice(top_3)
            new_generation.append(parent.mutate())
                
        return new_generation, scored_agents[0][0] # new generation, best score


