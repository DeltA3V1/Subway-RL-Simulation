import random
import copy
import math
import heapq

COVERAGE_RADIUS = 3
REWARD_CONFIG = {"coverage": 1.5, "track_cost": -0.5, "isolation_penalty": -20.0}

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
                    # connect
                    network["edges"].append({"from": cand_to_local_map[idx_a], "to": cand_to_local_map[idx_b]})

        return network
    
    def mutate(self):
        new_dna = copy.deepcopy(self.dna)
        mutation_rate = 0.1
        growth_rate = 0.02
        
        for i in range(len(new_dna)):
            if random.random() < mutation_rate:
                # new random action
                new_dna[i] = random.choice(action_templates)()

        if random.random() < growth_rate:
            new_dna.append(random.choice(action_templates)())
        
        return Agent(dna=new_dna)

class EvolutionLoop:
    def __init__(self):
        self.population = [Agent() for _ in range(20)]

    def run_generation(self, agents, world):
        candidates = world.get_candidate_stations()
        scored_agents = []

        for idx, agent in enumerate(agents):
            network = agent.build_network(candidates)
            score = score_network(network, world)
            scored_agents.append((score, idx, agent))

        scored_agents.sort(key=lambda x: x[0], reverse=True)
        top_3 = [item[2] for item in scored_agents[:3]]
        
        new_generation = []
        new_generation.extend(top_3)

        while len(new_generation) < 20:
            parent = random.choice(top_3)
            new_generation.append(parent.mutate())
                
        return new_generation, scored_agents[0][0] # new generation, best score


# add in the future: stations close to each other do not count pop twice
def score_network(network, world):
    score = 0.0
    
    # Coverage Reward
    for node in network["nodes"]:
        score += (world.sum_in_radius(node["y"], node["x"], COVERAGE_RADIUS) * REWARD_CONFIG["coverage"])
        
    # Track Penalty
    connected_indices = set()
    for edge in network["edges"]:
        connected_indices.add(edge["from"])
        connected_indices.add(edge["to"])

    # Coverage Reward
    for i, node in enumerate(network["nodes"]):
        if i in connected_indices:
            score += (world.sum_in_radius(node["y"], node["x"], COVERAGE_RADIUS) * REWARD_CONFIG["coverage"])
        else:
            # Isolation Penalty
            score += REWARD_CONFIG["isolation_penalty"]

                        
    return score