import sim
import agent

world = sim.WorldState()
world.expand_heatmap(2000)
candidates = world.get_candidate_stations()
num_cands = len(candidates["stations"])

print(f"--- Testing Line-Based Reward Logic ---")
print(f"Total Candidates: {num_cands}")
if num_cands > 0:
    # Safely handle pop check
    pop = candidates["stations"][0].get('pop', 'Unknown') 
    print(f"Top Candidate Pop: {pop}")
print("-" * 50)

def check_scenario(name, dna):
    # Initialize agent with forced DNA state
    test_agent = agent.Agent(dna=dna, num_candidates=num_cands)
    
    # Build network
    net = test_agent.build_network(candidates["stations"])
    
    # Calculate score
    s = test_agent.score(net, world, candidates["distances"])
    
    nodes = len(net["nodes"])
    edges = len(net["edges"])
    
    print(f"{name:25} | Score: {s:8.2f} | Nodes: {nodes}, Edges: {edges}")


# Scenario A: Empty Network
check_scenario("Empty Network", [])

if num_cands >= 5:
    # Scenario B: Disconnected Lines
    # Tests that two separate lines don't get the full connectivity multiplier
    check_scenario("Two Disconnected Lines", [[0, 1], [2, 3]])

    # Scenario C: Single Long Line
    # A single continuous line of 4 stops
    check_scenario("Single Long Line", [[0, 1, 2, 3]])

    # Scenario D: Transfer Station (Intersection)
    # Station index 1 is shared (one component of size 5)
    check_scenario("Intersecting Lines", [[0, 1, 2], [3, 1, 4]])

else:
    print("Not enough candidate stations to run targeted topology tests (need >= 5).")

# 5. Scenario E: Random Initialized Agent
random_agent = agent.Agent(num_candidates=num_cands)

random_net = random_agent.build_network(candidates["stations"]) 
random_score = random_agent.score(random_net, world, candidates["distances"]) 

print("-" * 50)
print(f"{'Random Agent DNA':25} | Score: {random_score:8.2f} | Nodes: {len(random_net['nodes'])}, Edges: {len(random_net['edges'])}")