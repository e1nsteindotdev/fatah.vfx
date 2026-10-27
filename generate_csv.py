import csv
import json
from collections import defaultdict, deque, Counter

# Load candidates
with open('candidates.csv') as f:
    candidates = list(csv.reader(f))

# Load interviewers
with open('interviewers.json') as f:
    interviewers = json.load(f)

def norm(d):
    d = d.strip()
    if d == 'RH': return 'LRH'
    return d

prioritized_ids = {21, 2, 4, 6, 12, 27}

# We treat 39 as having LRH (consistent with all solo interviewers in the document)
intervs = [dict(i) for i in interviewers]
for i in intervs:
    if i['id'] == 39:
        i['departments'] = ['LRH']

class MCMF:
    def __init__(self, n):
        self.n = n
        self.adj = [[] for _ in range(n)]
        self.edges = []

    def add_edge(self, u, v, cap, cost):
        e1 = [v, cap, cost, len(self.edges) + 1]
        e2 = [u, 0, -cost, len(self.edges)]
        self.adj[u].append(len(self.edges))
        self.edges.append(e1)
        self.adj[v].append(len(self.edges))
        self.edges.append(e2)

    def solve(self, s, t):
        flow = 0
        total_cost = 0
        while True:
            dist = [float('inf')] * self.n
            parent = [-1] * self.n
            in_queue = [False] * self.n
            q = deque([s])
            dist[s] = 0
            in_queue[s] = True

            while q:
                u = q.popleft()
                in_queue[u] = False
                for edge_idx in self.adj[u]:
                    v, cap, edge_cost, rev = self.edges[edge_idx]
                    if cap > 0 and dist[u] + edge_cost < dist[v]:
                        dist[v] = dist[u] + edge_cost
                        parent[v] = edge_idx
                        if not in_queue[v]:
                            q.append(v)
                            in_queue[v] = True

            if dist[t] == float('inf'):
                break

            push = float('inf')
            curr = t
            while curr != s:
                edge_idx = parent[curr]
                push = min(push, self.edges[edge_idx][1])
                curr = self.edges[self.edges[edge_idx][3]][0]

            curr = t
            while curr != s:
                edge_idx = parent[curr]
                rev = self.edges[edge_idx][3]
                self.edges[edge_idx][1] -= push
                self.edges[rev][1] += push
                total_cost += push * self.edges[edge_idx][2]
                curr = self.edges[rev][0]

            flow += push
        return flow, total_cost

K = len(intervs)
N = len(candidates)
S = 0
T = N + K + 1
mcmf = MCMF(N + K + 2)

for c_idx, c in enumerate(candidates):
    c_node = c_idx + 1
    mcmf.add_edge(S, c_node, 1, 0)
    c_d1 = norm(c[2])
    c_d2 = norm(c[3])

    for i_idx, interv in enumerate(intervs):
        i_node = N + 1 + i_idx
        i_deps = interv['departments']
        has_1 = c_d1 in i_deps
        has_2 = c_d2 in i_deps and c_d2 != ''

        if has_1 and has_2:
            cost = 0 # best match: both 1st and 2nd priority matched
        elif has_1:
            cost = 10 # 1st priority matched
        elif has_2:
            cost = 1000 # 2nd priority matched
        else:
            cost = 100000 # neither
        mcmf.add_edge(c_node, i_node, 1, cost)

for i_idx, interv in enumerate(intervs):
    i_node = N + 1 + i_idx
    prio = interv['id'] in prioritized_ids
    # Lower cost for prioritized pairs to get the 6th candidate
    extra_cost = 1 if prio else 20
    # Minimum 5 candidates per interviewer
    mcmf.add_edge(i_node, T, 5, -1000000)
    # 6th candidate
    mcmf.add_edge(i_node, T, 1, extra_cost)
    # 7th+ candidate (heavily penalized)
    mcmf.add_edge(i_node, T, 2, 5000000)

flow, total_cost = mcmf.solve(S, T)
assert flow == N, f"Flow {flow} != {N}"

# Map assignments
pair_assignments = defaultdict(list)
for c_idx, c in enumerate(candidates):
    c_node = c_idx + 1
    for edge_idx in mcmf.adj[c_node]:
        v, cap, cost, rev = mcmf.edges[edge_idx]
        if v > N and v <= N + K and cap == 0:
            i_idx = v - (N + 1)
            interv = intervs[i_idx]
            pair_assignments[interv['id']].append(c)
            break

# Verification
print("Total candidates assigned:", sum(len(v) for v in pair_assignments.values()))
counts = {interv['id']: len(pair_assignments[interv['id']]) for interv in intervs}
print("Candidate count distribution:", Counter(counts.values()))
print("Prioritized pairs counts:", {pid: counts[pid] for pid in sorted(prioritized_ids)})

# Write result to CSV
output_path = 'distributed_candidates.csv'
with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        "Interviewer Pair",
        "Candidate Last Name",
        "Candidate First Name",
        "First Selected Department",
        "Second Selected Department"
    ])
    for interv in intervs:
        pair_name = " + ".join(interv['members'])
        cands = pair_assignments[interv['id']]
        for c in cands:
            writer.writerow([
                pair_name,
                c[0], # Last name
                c[1], # First name
                c[2], # First selected dep (original from candidate)
                c[3]  # Second selected dep (original from candidate)
            ])

print("Successfully written to", output_path)
