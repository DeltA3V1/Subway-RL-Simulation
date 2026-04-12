import random
import copy
import math
import heapq

GRID_SIZE = 30
COVERAGE_RADIUS = 3
REWARD_CONFIG = {"coverage": 1, "track_cost": -1.5, "connectivity_bonus": 200, "station_cost": -25}
MAX_EDGE_LENGTH = 100

MAX_LINE_LENGTH = 15
MAX_LINES = 9
AGENTS = 30

MUTATION_RATE = 0.1
GROWTH_RATE = 0.1
DECAY_RATE = 0.05
ELITE_THRESHOLD = 0.85
TRACK_COST_SCALING = 1.4
COVERAGE_REWARD_SCALING = 1.2

line_dna = [
    [1, 3, 5, 7],
    [2, 4, 6, 8]
]

#TODO: check how lines sharing tracks work (later: spatial checks)

class Agent:
    def __init__(self, num_candidates=30, dna=None):
        self.num_candidates = num_candidates
        if dna is not None:
            self.dna = copy.deepcopy(dna)
        else:
            self.dna = [self.get_random_line(num_candidates) for _ in range(random.randint(1, MAX_LINES))]


    def get_random_action(self, line, num_candidates):
        match random.randint(1, 7):
            case 1:
                return self.extend_line(line, num_candidates)
            case 2:
                return self.remove_station(line)
            case 3:
                return self.split_line(line)
            case 4:
                return self.replace_station(line, num_candidates)
            case 5:
                return self.swap_stations(line)
            case 6:
                return self.reverse_segment(line)
            case 7:
                return self.move_station(line)
        
    def get_random_line(self, num_candidates=30):
        line_length = random.randint(3, MAX_LINE_LENGTH)
        return random.sample(range(num_candidates), line_length)
    
    def extend_line(self, line, num_candidates):
        if len(line) >= MAX_LINE_LENGTH:
            return line
        
        station = random.randrange(0, num_candidates)
        while station in line:
            station = random.randrange(0, num_candidates)
        line.insert(random.randint(0, len(line)), station)
        return line

    def remove_station(self, line):
        if len(line) <= 2:
            return line
        line.pop(random.randrange(0, len(line)))
        return line

    def split_line(self, line):
        if len(line) < 4:
            return line
        
        idx = random.randrange(1, len(line) - 1)
        return (line[:idx], line[idx:])

    def replace_station(self, line, num_candidates):
        idx = random.randrange(0, len(line))
        station = random.randrange(0, num_candidates)
        
        while station in line:
            station = random.randrange(0, num_candidates)
        line[idx] = station
        return line

    def swap_stations(self, line):
        if len(line) < 3:
            return line
        
        idx1, idx2 = sorted(random.sample(range(len(line)), 2))
        line[idx1], line[idx2] = line[idx2], line[idx1]
        return line

    def reverse_segment(self, line):
        if len(line) < 3:
            return line
        
        idx1, idx2 = sorted(random.sample(range(len(line)), 2))
        line[idx1:idx2+1] = reversed(line[idx1:idx2+1])
        return line
    
    def move_station(self, line):
        if len(line) < 3:
            return line

        old = random.randrange(len(line))
        new = random.randrange(len(line))
        if old != new:
            item = line.pop(old)
            line.insert(new, item)

        return line
    
    def build_network(self, candidates):
        cand_to_local_map = {}
        network = {
            "nodes": [],
            "edges": set(), 
            "render_edges": [],
            "built_indices": set()
        }

        for line_idx, line in enumerate(self.dna):
            valid_line = [idx for idx in line if isinstance(idx, int) and 0 <= idx < len(candidates)]
            if not valid_line:
                continue

            for idx in valid_line:
                if idx not in cand_to_local_map:
                    local_idx = len(network["nodes"])
                    network["nodes"].append(candidates[idx])
                    cand_to_local_map[idx] = local_idx
                
                network["built_indices"].add(idx)

            for i in range(len(valid_line) - 1):
                from_idx = cand_to_local_map[valid_line[i]]
                to_idx = cand_to_local_map[valid_line[i + 1]]

                if from_idx != to_idx:
                    network["edges"].add(frozenset([from_idx, to_idx]))

                    network["render_edges"].append({
                        "from": from_idx, 
                        "to": to_idx, 
                        "line_id": line_idx
                    })

        return network

    def return_network(self, candidates):
        network = self.build_network(candidates)
        network["edges"] = network["render_edges"]
        del network["render_edges"]
        return network

    def mutate(self, num_candidates, cycles=1):
        working_dna = [list(line) for line in self.dna]
        for _ in range(cycles):
            working_dna = [line for line in working_dna if random.random() > DECAY_RATE]
            temp_dna = []
            for i, line in enumerate(working_dna):
                if random.random() < MUTATION_RATE:
                    new_line = self.get_random_action(line, num_candidates)
                    
                    if isinstance(new_line, tuple):
                        if (len(working_dna) + len(temp_dna)) < MAX_LINES:
                            working_dna[i] = new_line[0]
                            temp_dna.append(new_line[1])
                        else:
                            # Don't split if above max lines
                            working_dna[i] = line 
                    else:
                        working_dna[i] = new_line

            working_dna = [line for line in working_dna if len(line) >= 2]
            working_dna.extend(temp_dna)

            if random.random() < GROWTH_RATE and len(working_dna) < MAX_LINES:
                working_dna.append(self.get_random_line(num_candidates))

        return Agent(num_candidates=num_candidates, dna=working_dna)
    

    def crossover(self, other, num_candidates):
        if not self.dna or not other.dna:
            return self.mutate(num_candidates)
        
        new_dna = [list(line) for line in self.dna]
        donor_line = random.choice(other.dna)
        
        existing_stops = set(s for line in new_dna for s in line)
        if len(new_dna) < MAX_LINES:
            if len(set(donor_line) & existing_stops) < len(donor_line) * 0.5:
                new_dna.append(list(donor_line))

        return Agent(dna=new_dna, num_candidates=num_candidates)
    
    
    def score(self, network, world):
        score = 0.0
        covered_cells = set()

        # Apply the global track cost for each edge built
        for u, v in network["edges"]:
            node_u = network["nodes"][u]
            node_v = network["nodes"][v]
            dist = math.dist((node_u["row"], node_u["col"]), (node_v["row"], node_v["col"]))
            score += (dist ** TRACK_COST_SCALING) * REWARD_CONFIG["track_cost"]

        radius_sq = COVERAGE_RADIUS**2
        for i, node in enumerate(network["nodes"]):
            score += REWARD_CONFIG["station_cost"] # Penalty for each station built

            center_row, center_col = node["row"], node["col"]
                
            for r in range(max(0, center_row - COVERAGE_RADIUS), min(GRID_SIZE, center_row + COVERAGE_RADIUS + 1)):
                for c in range(max(0, center_col - COVERAGE_RADIUS), min(GRID_SIZE, center_col + COVERAGE_RADIUS + 1)):
                    if (r, c) in covered_cells:
                        continue

                    if (r - center_row)**2 + (c - center_col)**2 <= radius_sq:
                        score += (world.heatmap[r][c] * REWARD_CONFIG["coverage"]) ** COVERAGE_REWARD_SCALING
                        covered_cells.add((r, c))

        parent = {i: i for i in range(len(network["nodes"]))}

        def find(i):
            if parent[i] == i:
                return i
            parent[i] = find(parent[i])
            return parent[i]

        def union(i, j):
            root_i = find(i)
            root_j = find(j)
            if root_i != root_j:
                parent[root_i] = root_j

        for edge in network["edges"]:
            u, v = tuple(edge)
            union(u, v)

        # Find the size of the largest connected component
        component_sizes = {}
        for i in range(len(network["nodes"])):
            root = find(i)
            component_sizes[root] = component_sizes.get(root, 0) + 1

        largest_component_size = max(component_sizes.values()) if component_sizes else 0

        try:
            score += (largest_component_size / len(network["nodes"])) * REWARD_CONFIG["connectivity_bonus"]
        except ZeroDivisionError:
            pass

        return score


class EvolutionLoop:
    def __init__(self, num_candidates=30):
        self.num_candidates = num_candidates
        self.population = [Agent(num_candidates) for _ in range(AGENTS)]
        self.generation = 0
        self.best_score = 0
        self.stagnation_count = 0
        self.stagnation_threshold = 100 # generations

    def run_generation(self, world, num_candidates=None):
        num_candidates = self.num_candidates if num_candidates is None else num_candidates
        self.generation += 1
        candidates = world.get_candidate_stations(num_candidates)
        scored_agents = []

        for idx, agent in enumerate(self.population):
            network = agent.build_network(candidates)
            score = agent.score(network, world)
            scored_agents.append((score, idx, agent))

        scored_agents.sort(key=lambda x: x[0], reverse=True)
        
        new_generation = [item[2] for item in scored_agents[:2]]

        def get_parent():
            tournament = random.sample(scored_agents, 3) 
            winner_tuple = max(tournament, key=lambda x: x[0])
            return winner_tuple[2]

        if self.stagnation_count > self.stagnation_threshold:
            while len(new_generation) < AGENTS:
                if random.random() < 0.3:
                    new_generation.append(Agent(num_candidates))
                else:
                    parent = get_parent()
                    new_generation.append(parent.mutate(num_candidates, 2))
        else:
            while len(new_generation) < AGENTS:
                # crossover disabled temporarily until implementation is improved
                # if random.random() < 0.3:
                #     parent_a = get_parent()
                #     parent_b = get_parent()
                #     new_generation.append(parent_a.crossover(parent_b, num_candidates, candidates))
                # else:
                    parent = get_parent()
                    new_generation.append(parent.mutate(num_candidates))

        best_score = scored_agents[0][0]
        score_improved = best_score > self.best_score
        
        if score_improved:
            self.best_score = best_score
            self.stagnation_count = 0
        else:
            self.stagnation_count += 1
        
        return new_generation, best_score, score_improved