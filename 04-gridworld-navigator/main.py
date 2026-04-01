from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

start_state = (0, 0)

GRID_SIZE = 5
goal = (4, 4)
current_position = (0, 0)
pits = [(1, 1), (2, 2), (3, 3)]
done = False

MOVE_OFFSETS = {
    "up": (-1, 0), "down": (1, 0), 
    "left": (0, -1), "right": (0, 1)
}

# mach learn
q_table = {}
alpha = 0.1
gamma = 0.9
epsilon = 1.0
epsilon_decay = 0.99
min_epsilon = 0.05

def init():
    global pits, start_state, current_position, goal, epsilon, done, q_table
    done = False
    start_state = (random.randint(0, GRID_SIZE - 1), random.randint(0, GRID_SIZE - 1))
    
    while True:
        goal = (random.randint(0, GRID_SIZE - 1), random.randint(0, GRID_SIZE - 1))
        if goal != start_state:
            break
            
    pits = []
    while len(pits) < 3:
        p = (random.randint(0, GRID_SIZE - 1), random.randint(0, GRID_SIZE - 1))
        if p != start_state and p != goal and p not in pits:
            pits.append(p)

    current_position = start_state
    q_table = {}


def get_action(state, q_table, epsilon):
    if random.random() < epsilon:
        return random.choice(list(MOVE_OFFSETS.keys()))
    
    actions = q_table.setdefault(state, {a: 0.0 for a in MOVE_OFFSETS})
    return max(actions, key=actions.get)

def move(current_pos, action, grid_size):
    dr, dc = MOVE_OFFSETS[action]
    new_r = max(0, min(grid_size - 1, current_pos[0] + dr))
    new_c = max(0, min(grid_size - 1, current_pos[1] + dc))
    return (new_r, new_c)

def get_feedback(pos, goal, pits, old_pos):
    if pos in pits:
        return -10, True
    if pos == goal:
        return 10, True
    if pos == old_pos:
        return -1, False
    return -0.1, False

init()

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

@app.get("/get_data")
async def get_data():
    return {
        "pits": pits, 
        "current_position": {"row": current_position[0], "col": current_position[1]}, 
        "goal": goal
    }

@app.get("/step")
async def step():
    global current_position, done
    if done:
        return {"row": current_position[0], "col": current_position[1], "reward": 0, "done": True}
    
    old_state = current_position
    if old_state not in q_table:
        q_table[old_state] = {a: 0.0 for a in MOVE_OFFSETS}
    
    action = get_action(old_state, q_table, epsilon)
    current_position = move(old_state, action, GRID_SIZE)

    new_state = current_position
    step_reward, done = get_feedback(new_state, goal, pits, old_state)

    # Q-Learning Update
    old_q_value = q_table[old_state][action]
    if done:
        max_future_q = 0
    else:
        if new_state not in q_table:
            q_table[new_state] = {a: 0.0 for a in MOVE_OFFSETS}
        max_future_q = max(q_table[new_state].values())
    
    new_q_value = old_q_value + alpha * (step_reward + gamma * max_future_q - old_q_value)
    q_table[old_state][action] = new_q_value
    
    return {
        "row": current_position[0], 
        "col": current_position[1], 
        "reward": step_reward, 
        "done": done
    }

@app.post("/next_episode")
async def next_episode():
    global current_position, done, epsilon
    current_position = start_state
    done = False
    epsilon = max(min_epsilon, epsilon * epsilon_decay)
    return {"status": "ok"}

@app.post("/reset_data")
async def reset_data():
    init()
    done = False
    return {"status": "ok"}

# To run the server, use the command:
# uvicorn 03-graph-pathfinder.main:app --reload