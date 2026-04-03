import sim
import agent

world = sim.WorldState()
# Ensure there is some population to actually score
world.expand_heatmap(200) 
candidates = world.get_candidate_stations()
test_agent = agent.Agent()

print(f"--- Testing Reward Logic ---")
print(f"Top Candidate Pop: {candidates[0]['pop']}")

def check_score(name, net):
    s = test_agent.score(net, world)
    total_pop = sum(sum(row) for row in world.heatmap)
    print(f"{name:20} | Score: {s:.2f} (pop: {total_pop})")

# 3. Scenario A: Empty Network (Baseline)
empty_net = {"nodes": [], "edges": []}
check_score("Empty Network", empty_net)

# 4. Scenario B: Disconnected (Isolation Penalty)
isolated_net = {
    "nodes": [candidates[0], candidates[1]],
    "edges": []
}
check_score("Isolated Stations", isolated_net)

# 5. Scenario C: A "Good" Connection
connected_net = {
    "nodes": [candidates[0], candidates[1]],
    "edges": [{"from": 0, "to": 1}]
}
check_score("Connected Pair", connected_net)

# 6. Scenario D: The Agent's current DNA
agent_net = test_agent.build_network(candidates)
check_score("Random Agent DNA", agent_net)