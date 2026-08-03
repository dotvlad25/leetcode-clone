import { seedStagedProblemIfNotExists } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Batch 4: 5 Google staged problems
// Google: 30001 – Meeting Rooms Scheduler
//         30002 – Restaurant Waitlist System
//         30003 – Network Connectivity Tracker
//         30004 – String Compression Decoder
//         30005 – Time-Based Key-Value Store
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBatch4Problems(): Promise<void> {

  // ── Problem 1: Meeting Rooms Scheduler ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 30001,
      slug: "meeting-rooms-scheduler",
      title: "Meeting Rooms Scheduler",
      difficulty: "Medium",
      badges: "google",
      tags: "heap,greedy,intervals",
      description: `You are building a conference room booking system. Given a list of meeting intervals, manage room allocation efficiently.

**Key concept:** Two meetings overlap if one starts before the other ends. Meetings sharing an endpoint (e.g. \`[0,5]\` and \`[5,10]\`) do **not** overlap.

- **Stage 1:** Find the minimum number of rooms needed to host all meetings.
- **Stage 2:** Given \`n\` rooms (0-indexed), find which room hosts the most meetings.`,
      starterCode: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals: list[list[int]]) -> int:
        pass`,
      methodName: "MeetingRooms",
    },
    [
      {
        stageNumber: 1,
        title: "Minimum Rooms Needed",
        description: `Implement \`min_rooms(intervals)\` returning the minimum number of conference rooms required.

**Approach:** Sort by start time. Use a min-heap of end times — if the earliest-ending room finishes ≤ current start, reuse it; otherwise allocate a new room.

\`\`\`python
s = MeetingRooms()
s.min_rooms([[0,30],[30,50],[50,90]])  # → 1
s.min_rooms([[0,30],[5,10],[15,20]])   # → 2
\`\`\``,
        baseClass: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals: list[list[int]]) -> int:
        pass`,
        starterCode: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals: list[list[int]]) -> int:
        # Sort by start time, use min-heap of end times
        pass`,
        solution: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals: list[list[int]]) -> int:
        if not intervals:
            return 0
        # Process meetings in start order so "has a room freed up yet?" only
        # ever needs to look at the single earliest end time.
        intervals = sorted(intervals, key=lambda x: x[0])
        # Min-heap of end times, one entry per room currently in use.
        heap = []
        for start, end in intervals:
            if heap and heap[0] <= start:
                # The earliest-finishing room is free: reuse it. heapreplace
                # is one sift instead of a separate pop and push.
                heapq.heapreplace(heap, end)
            else:
                heapq.heappush(heap, end)
        # Peak concurrency equals the number of rooms ever allocated.
        return len(heap)`,
        solutionExplanation: "Sort meetings by start time. Use a min-heap of end times. If the earliest-ending room finishes at or before the current meeting's start, reuse it (heapreplace). Otherwise allocate a new room (heappush). The heap size at the end is the answer.",
        testCases: [
          { description: "sequential meetings reuse one room", inputData: "s = MeetingRooms()\n_result = s.min_rooms([[0,30],[30,50],[50,90]])", expectedOutput: "1", orderIndex: 0 },
          { description: "two overlapping meetings need two rooms", inputData: "s = MeetingRooms()\n_result = s.min_rooms([[0,30],[5,10],[15,20]])", expectedOutput: "2", orderIndex: 1 },
          { description: "empty list needs zero rooms", inputData: "s = MeetingRooms()\n_result = s.min_rooms([])", expectedOutput: "0", orderIndex: 2 },
          { description: "single meeting needs one room", inputData: "s = MeetingRooms()\n_result = s.min_rooms([[1,5]])", expectedOutput: "1", orderIndex: 3 },
          { description: "two non-overlapping meetings share one room", inputData: "s = MeetingRooms()\n_result = s.min_rooms([[1,5],[6,10]])", expectedOutput: "1", orderIndex: 4 },
          { description: "two overlapping meetings need two rooms", inputData: "s = MeetingRooms()\n_result = s.min_rooms([[1,10],[2,6]])", expectedOutput: "2", orderIndex: 5 },
        ],
      },
      {
        stageNumber: 2,
        title: "Busiest Room",
        description: `Add \`busiest_room(n, meetings)\` returning the 0-indexed room that hosts the most meetings.

**Rule:** Assign each meeting to the lowest-numbered free room. If all rooms are busy, wait for the earliest-ending one and extend its duration.

\`\`\`python
s = MeetingRooms()
s.busiest_room(2, [[0,10],[1,5],[2,7],[3,4]])  # → 0
\`\`\``,
        baseClass: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals):
        if not intervals: return 0
        intervals = sorted(intervals, key=lambda x: x[0])
        heap = []
        for start, end in intervals:
            if heap and heap[0] <= start: heapq.heapreplace(heap, end)
            else: heapq.heappush(heap, end)
        return len(heap)

    def busiest_room(self, n: int, meetings: list[list[int]]) -> int:
        pass`,
        starterCode: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals):
        if not intervals: return 0
        intervals = sorted(intervals, key=lambda x: x[0])
        heap = []
        for start, end in intervals:
            if heap and heap[0] <= start: heapq.heapreplace(heap, end)
            else: heapq.heappush(heap, end)
        return len(heap)

    def busiest_room(self, n: int, meetings: list[list[int]]) -> int:
        # Two heaps: available (free room numbers), in_use (end_time, room)
        # Track count[room] and return argmax
        pass`,
        solution: `import heapq

class MeetingRooms:
    def min_rooms(self, intervals):
        # Carried over from Stage 1 — still tested cumulatively.
        if not intervals: return 0
        intervals = sorted(intervals, key=lambda x: x[0])
        heap = []
        for start, end in intervals:
            if heap and heap[0] <= start: heapq.heapreplace(heap, end)
            else: heapq.heappush(heap, end)
        return len(heap)

    def busiest_room(self, n: int, meetings: list[list[int]]) -> int:
        meetings = sorted(meetings, key=lambda x: (x[0], x[1]))
        # Two heaps: free rooms ordered by number (lowest wins ties), and
        # in-use rooms ordered by when they free up.
        available = list(range(n))
        heapq.heapify(available)
        in_use = []
        count = [0] * n
        for start, end in meetings:
            # Reclaim every room whose meeting has ended by now.
            while in_use and in_use[0][0] <= start:
                end_t, room = heapq.heappop(in_use)
                heapq.heappush(available, room)
            if available:
                room = heapq.heappop(available)
                heapq.heappush(in_use, (end, room))
            else:
                # Fully booked: the meeting waits for the earliest room and
                # keeps its original duration, so it ends later than planned.
                end_t, room = heapq.heappop(in_use)
                heapq.heappush(in_use, (end_t + (end - start), room))
            count[room] += 1
        # .index returns the first maximum, i.e. the lowest room number on a tie.
        return count.index(max(count))`,
        solutionExplanation: "Two heaps: available (free room numbers, min-heap for lowest-numbered), in_use (end_time, room). For each meeting, free rooms that ended, assign lowest-numbered free room, or wait for earliest-ending room. Track count per room and return argmax.",
        testCases: [
          { description: "room 0 hosts most meetings", inputData: "s = MeetingRooms()\n_result = s.busiest_room(2, [[0,10],[1,5],[2,7],[3,4]])", expectedOutput: "0", orderIndex: 0 },
          { description: "single room hosts all", inputData: "s = MeetingRooms()\n_result = s.busiest_room(1, [[0,5],[5,10],[10,15]])", expectedOutput: "0", orderIndex: 1 },
          { description: "two rooms equal count returns lower index", inputData: "s = MeetingRooms()\n_result = s.busiest_room(2, [[0,10],[1,5],[2,7]])", expectedOutput: "1", orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 2: Restaurant Waitlist System ───────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 30002,
      slug: "restaurant-waitlist-system",
      title: "Restaurant Waitlist System",
      difficulty: "Easy",
      badges: "google",
      tags: "queue,design",
      description: `Design a restaurant waitlist that manages parties waiting for a table.

- **Stage 1:** FIFO waitlist — add parties, seat the first fitting party, query position.
- **Stage 2:** VIP priority — VIP parties are always served before regular parties.`,
      starterCode: `from collections import deque

class Waitlist:
    def __init__(self):
        pass

    def add_party(self, name: str, party_size: int) -> None:
        pass

    def seat_next(self, table_size: int) -> str | None:
        pass

    def get_position(self, name: str) -> int:
        pass`,
      methodName: "Waitlist",
    },
    [
      {
        stageNumber: 1,
        title: "Basic FIFO Waitlist",
        description: `Implement a \`Waitlist\` class:
- \`add_party(name, party_size)\` — add party to end of waitlist.
- \`seat_next(table_size)\` — remove and return the **first** party with \`party_size <= table_size\`, or \`None\`.
- \`get_position(name)\` — return 1-indexed position, or \`-1\` if not found.

\`\`\`python
w = Waitlist()
w.add_party("Alice", 2); w.add_party("Bob", 4); w.add_party("Carol", 3)
w.seat_next(3)         # → "Alice"
w.get_position("Bob")  # → 1
\`\`\``,
        baseClass: `from collections import deque

class Waitlist:
    def __init__(self):
        pass`,
        starterCode: `from collections import deque

class Waitlist:
    def __init__(self):
        self.queue = deque()

    def add_party(self, name: str, party_size: int) -> None:
        pass

    def seat_next(self, table_size: int) -> str | None:
        pass

    def get_position(self, name: str) -> int:
        pass`,
        solution: `from collections import deque

class Waitlist:
    def __init__(self):
        self.queue = deque()

    def add_party(self, name: str, party_size: int) -> None:
        self.queue.append((name, party_size))

    def seat_next(self, table_size: int) -> str | None:
        # Not strictly FIFO: scan from the front for the first party that
        # actually fits, so one oversized party cannot block the whole line.
        for i, (name, size) in enumerate(self.queue):
            if size <= table_size:
                del self.queue[i]
                return name
        return None

    def get_position(self, name: str) -> int:
        # 1-based position for display; -1 when the party is not waiting.
        for i, (n, _) in enumerate(self.queue):
            if n == name:
                return i + 1
        return -1`,
        solutionExplanation: "Store parties in a deque. seat_next scans from front for first fitting party and removes it. get_position does a linear scan returning 1-indexed position.",
        testCases: [
          { description: "seat first fitting party", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4)\nw.add_party('Carol', 3)\n_result = w.seat_next(3)", expectedOutput: '"Alice"', orderIndex: 0 },
          { description: "position updates after seating", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4)\nw.add_party('Carol', 3)\nw.seat_next(3)\n_result = w.get_position('Bob')", expectedOutput: "1", orderIndex: 1 },
          { description: "seat second party when first doesn't fit", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4)\nw.add_party('Carol', 3)\nw.seat_next(3)\n_result = w.seat_next(4)", expectedOutput: '"Bob"', orderIndex: 2 },
          { description: "seat_next returns None when no party fits", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 5)\n_result = w.seat_next(3)", expectedOutput: "None", orderIndex: 3 },
          { description: "get_position returns -1 for unknown party", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\n_result = w.get_position('Bob')", expectedOutput: "-1", orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "VIP Priority Waitlist",
        description: `Add VIP support: \`add_party(name, party_size, is_vip=False)\`. VIP parties are always served before regular parties.

\`\`\`python
w = Waitlist()
w.add_party("Alice", 2)
w.add_party("Bob", 4, is_vip=True)
w.get_position("Bob")  # → 1  (VIP jumps ahead)
w.seat_next(4)         # → "Bob"
\`\`\``,
        baseClass: `from collections import deque

class Waitlist:
    def __init__(self):
        self.vip_queue = deque()
        self.reg_queue = deque()`,
        starterCode: `from collections import deque

class Waitlist:
    def __init__(self):
        self.vip_queue = deque()
        self.reg_queue = deque()

    def add_party(self, name: str, party_size: int, is_vip: bool = False) -> None:
        pass

    def seat_next(self, table_size: int) -> str | None:
        pass

    def get_position(self, name: str) -> int:
        pass`,
        solution: `from collections import deque

class Waitlist:
    def __init__(self):
        # Two independent queues rather than one sorted list: priority is a
        # strict tier, and FIFO order still holds within each tier.
        self.vip_queue = deque()
        self.reg_queue = deque()

    def add_party(self, name: str, party_size: int, is_vip: bool = False) -> None:
        if is_vip:
            self.vip_queue.append((name, party_size))
        else:
            self.reg_queue.append((name, party_size))

    def _seat_from(self, q, table_size):
        # Shared scan-for-first-that-fits used by both tiers.
        for i, (name, size) in enumerate(q):
            if size <= table_size:
                del q[i]
                return name
        return None

    def seat_next(self, table_size: int) -> str | None:
        # VIPs are exhausted first; regulars only get the table when no VIP
        # fits it. Explicit "is not None" because a name could be falsy.
        result = self._seat_from(self.vip_queue, table_size)
        return result if result is not None else self._seat_from(self.reg_queue, table_size)

    def get_position(self, name: str) -> int:
        for i, (n, _) in enumerate(self.vip_queue):
            if n == name: return i + 1
        # Regular positions are offset by the whole VIP queue, since every
        # VIP is ahead of every regular.
        offset = len(self.vip_queue)
        for i, (n, _) in enumerate(self.reg_queue):
            if n == name: return offset + i + 1
        return -1`,
        solutionExplanation: "Two deques: vip_queue and reg_queue. seat_next tries VIP first. get_position counts VIPs as positions 1..len(vip), regulars as len(vip)+1..",
        testCases: [
          { description: "VIP gets position 1 ahead of regular", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4, is_vip=True)\n_result = w.get_position('Bob')", expectedOutput: "1", orderIndex: 0 },
          { description: "regular party position is after VIPs", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4, is_vip=True)\n_result = w.get_position('Alice')", expectedOutput: "2", orderIndex: 1 },
          { description: "seat_next serves VIP first", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4, is_vip=True)\n_result = w.seat_next(4)", expectedOutput: '"Bob"', orderIndex: 2 },
          { description: "seat_next falls back to regular after VIPs exhausted", inputData: "from collections import deque\nw = Waitlist()\nw.add_party('Alice', 2)\nw.add_party('Bob', 4, is_vip=True)\nw.seat_next(4)\n_result = w.seat_next(2)", expectedOutput: '"Alice"', orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 3: Network Connectivity Tracker ─────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 30003,
      slug: "network-connectivity-tracker",
      title: "Network Connectivity Tracker",
      difficulty: "Medium",
      badges: "google",
      tags: "union-find,graph",
      description: `Monitor a network of \`n\` nodes (0-indexed). Edges are added over time with timestamps.

- **Stage 1:** Find the earliest timestamp when all nodes become fully connected.
- **Stage 2:** Find the earliest timestamp when a specific pair of nodes connects.`,
      starterCode: `class NetworkTracker:
    def earliest_fully_connected(self, n: int, edges: list[list[int]]) -> int:
        pass`,
      methodName: "NetworkTracker",
    },
    [
      {
        stageNumber: 1,
        title: "Earliest Full Connectivity",
        description: `Implement \`earliest_fully_connected(n, edges)\` returning the earliest timestamp when all \`n\` nodes are connected, or \`-1\`.

Each edge is \`[u, v, timestamp]\`. Sort by timestamp and use Union-Find.

\`\`\`python
t = NetworkTracker()
t.earliest_fully_connected(4, [[0,1,1],[1,2,2],[2,3,3]])  # → 3
t.earliest_fully_connected(3, [[0,1,1]])                   # → -1
\`\`\``,
        baseClass: `class NetworkTracker:
    def earliest_fully_connected(self, n: int, edges: list[list[int]]) -> int:
        pass`,
        starterCode: `class NetworkTracker:
    def earliest_fully_connected(self, n: int, edges: list[list[int]]) -> int:
        # Sort edges by timestamp, use Union-Find
        # Return timestamp when component count reaches 1
        pass`,
        solution: `class NetworkTracker:
    def _make_uf(self, n):
        # parent, union-by-rank heights, and a one-element list holding the
        # live component count (a list so helpers can mutate it in place).
        return list(range(n)), [0] * n, [n]

    def _find(self, parent, x):
        # Path halving: point each node at its grandparent while walking up,
        # which flattens the tree without a second pass.
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def _union(self, parent, rank, components, x, y):
        px, py = self._find(parent, x), self._find(parent, y)
        if px == py: return False   # already connected
        # Attach the shorter tree under the taller one to keep depth low.
        if rank[px] < rank[py]: px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]: rank[px] += 1
        components[0] -= 1
        return True

    def earliest_fully_connected(self, n: int, edges: list[list[int]]) -> int:
        # A single node is trivially connected but has no edge timestamp.
        if n == 1: return -1
        # Process edges in time order and stop the moment everything merges
        # into one component — that timestamp is the answer.
        edges = sorted(edges, key=lambda e: e[2])
        parent, rank, components = self._make_uf(n)
        for u, v, t in edges:
            self._union(parent, rank, components, u, v)
            if components[0] == 1: return t
        return -1   # never fully connects`,
        solutionExplanation: "Union-Find with path compression and union by rank. Start with n components. Each union reduces count by 1. Return timestamp when count reaches 1.",
        testCases: [
          { description: "4-node chain connects at t=3", inputData: "t = NetworkTracker()\n_result = t.earliest_fully_connected(4, [[0,1,1],[1,2,2],[2,3,3]])", expectedOutput: "3", orderIndex: 0 },
          { description: "2-node network connects at t=1", inputData: "t = NetworkTracker()\n_result = t.earliest_fully_connected(2, [[0,1,1]])", expectedOutput: "1", orderIndex: 1 },
          { description: "never fully connected returns -1", inputData: "t = NetworkTracker()\n_result = t.earliest_fully_connected(3, [[0,1,1]])", expectedOutput: "-1", orderIndex: 2 },
          { description: "redundant edges don't change answer", inputData: "t = NetworkTracker()\n_result = t.earliest_fully_connected(3, [[0,1,1],[0,2,2],[1,2,3]])", expectedOutput: "2", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Earliest Pair Connectivity",
        description: `Add \`earliest_pair_connected(n, edges, src, dst)\` returning the earliest timestamp when \`src\` and \`dst\` connect, or \`-1\`.

\`\`\`python
t = NetworkTracker()
edges = [[0,1,1],[1,2,2],[2,3,3]]
t.earliest_pair_connected(4, edges, 0, 3)  # → 3
t.earliest_pair_connected(4, edges, 0, 1)  # → 1
\`\`\``,
        baseClass: `class NetworkTracker:
    def _make_uf(self, n):
        return list(range(n)), [0] * n, [n]
    def _find(self, parent, x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def _union(self, parent, rank, components, x, y):
        px, py = self._find(parent, x), self._find(parent, y)
        if px == py: return False
        if rank[px] < rank[py]: px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]: rank[px] += 1
        components[0] -= 1; return True
    def earliest_fully_connected(self, n, edges):
        if n == 1: return -1
        edges = sorted(edges, key=lambda e: e[2])
        parent, rank, components = self._make_uf(n)
        for u, v, t in edges:
            self._union(parent, rank, components, u, v)
            if components[0] == 1: return t
        return -1
    def earliest_pair_connected(self, n: int, edges: list[list[int]], src: int, dst: int) -> int:
        pass`,
        starterCode: `class NetworkTracker:
    def _make_uf(self, n):
        return list(range(n)), [0] * n, [n]
    def _find(self, parent, x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def _union(self, parent, rank, components, x, y):
        px, py = self._find(parent, x), self._find(parent, y)
        if px == py: return False
        if rank[px] < rank[py]: px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]: rank[px] += 1
        components[0] -= 1; return True
    def earliest_fully_connected(self, n, edges):
        if n == 1: return -1
        edges = sorted(edges, key=lambda e: e[2])
        parent, rank, components = self._make_uf(n)
        for u, v, t in edges:
            self._union(parent, rank, components, u, v)
            if components[0] == 1: return t
        return -1
    def earliest_pair_connected(self, n: int, edges: list[list[int]], src: int, dst: int) -> int:
        # Same sweep but stop when find(src) == find(dst)
        pass`,
        solution: `class NetworkTracker:
    def _make_uf(self, n):
        # parent, union-by-rank heights, live component count (boxed in a list).
        return list(range(n)), [0] * n, [n]
    def _find(self, parent, x):
        # Path halving keeps the trees shallow.
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def _union(self, parent, rank, components, x, y):
        px, py = self._find(parent, x), self._find(parent, y)
        if px == py: return False
        if rank[px] < rank[py]: px, py = py, px
        parent[py] = px
        if rank[px] == rank[py]: rank[px] += 1
        components[0] -= 1; return True
    def earliest_fully_connected(self, n, edges):
        # Carried over from Stage 1.
        if n == 1: return -1
        edges = sorted(edges, key=lambda e: e[2])
        parent, rank, components = self._make_uf(n)
        for u, v, t in edges:
            self._union(parent, rank, components, u, v)
            if components[0] == 1: return t
        return -1
    def earliest_pair_connected(self, n: int, edges: list[list[int]], src: int, dst: int) -> int:
        # Same time-ordered sweep, but the stopping condition is local: watch
        # only whether src and dst have landed in the same component.
        edges = sorted(edges, key=lambda e: e[2])
        parent, rank, components = self._make_uf(n)
        for u, v, t in edges:
            self._union(parent, rank, components, u, v)
            if self._find(parent, src) == self._find(parent, dst): return t
        return -1`,
        solutionExplanation: "Same Union-Find sweep as Stage 1, but instead of checking global component count, check if find(src) == find(dst) after each union.",
        testCases: [
          { description: "pair 0-3 connects at t=3", inputData: "t = NetworkTracker()\n_result = t.earliest_pair_connected(4, [[0,1,1],[1,2,2],[2,3,3]], 0, 3)", expectedOutput: "3", orderIndex: 0 },
          { description: "pair 0-1 connects at t=1", inputData: "t = NetworkTracker()\n_result = t.earliest_pair_connected(4, [[0,1,1],[1,2,2],[2,3,3]], 0, 1)", expectedOutput: "1", orderIndex: 1 },
          { description: "pair never connected returns -1", inputData: "t = NetworkTracker()\n_result = t.earliest_pair_connected(3, [[0,1,1]], 0, 2)", expectedOutput: "-1", orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 4: String Compression Decoder ──────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 30004,
      slug: "string-compression-decoder",
      title: "String Compression Decoder",
      difficulty: "Medium",
      badges: "google",
      tags: "stack,string",
      description: `Decode run-length encoded strings of the form \`k[encoded_string]\`.

- **Stage 1:** Decode flat (non-nested) encoded strings.
- **Stage 2:** Decode arbitrarily nested encoded strings like \`2[3[a]b]\`.`,
      starterCode: `class Decoder:
    def decode(self, s: str) -> str:
        pass`,
      methodName: "Decoder",
    },
    [
      {
        stageNumber: 1,
        title: "Flat Decoding",
        description: `Implement \`decode(s)\` for strings without nesting. Format: \`k[chars]\`.

\`\`\`python
d = Decoder()
d.decode("3[ab]")      # → "ababab"
d.decode("2[ab]3[c]")  # → "ababccc"
d.decode("xy2[z]")     # → "xyzz"
\`\`\``,
        baseClass: `class Decoder:
    def decode(self, s: str) -> str:
        pass`,
        starterCode: `class Decoder:
    def decode(self, s: str) -> str:
        # Use a stack: push (current_string, repeat_count) on '['
        # On ']': pop and repeat current string
        pass`,
        solution: `class Decoder:
    def decode(self, s: str) -> str:
        # stack holds (text before this bracket, repeat count) pairs.
        stack = []
        current = ""
        k = 0
        for ch in s:
            if ch.isdigit():
                # Accumulate so multi-digit counts like 12[a] parse correctly.
                k = k * 10 + int(ch)
            elif ch == '[':
                # Park the outer context and start a fresh inner string.
                stack.append((current, k))
                current = ""; k = 0
            elif ch == ']':
                # Close the group: repeat it and splice it back onto the
                # parked prefix. This is what makes nesting work for free.
                prev, repeat = stack.pop()
                current = prev + current * repeat
            else:
                current += ch
        return current`,
        solutionExplanation: "Stack-based: '[' pushes (current, k) and resets. ']' pops and prepends. Handles multi-digit numbers with k = k*10 + digit.",
        testCases: [
          { description: "simple 3-repeat", inputData: "d = Decoder()\n_result = d.decode('3[ab]')", expectedOutput: '"ababab"', orderIndex: 0 },
          { description: "no encoding passthrough", inputData: "d = Decoder()\n_result = d.decode('abc')", expectedOutput: '"abc"', orderIndex: 1 },
          { description: "prefix before encoded group", inputData: "d = Decoder()\n_result = d.decode('xy2[z]')", expectedOutput: '"xyzz"', orderIndex: 2 },
          { description: "multiple groups", inputData: "d = Decoder()\n_result = d.decode('2[ab]3[c]')", expectedOutput: '"ababccc"', orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Nested Decoding",
        description: `Extend \`decode\` to handle arbitrarily nested encoded strings.

\`\`\`python
d = Decoder()
d.decode("2[3[a]b]")      # → "aaabaaab"
d.decode("2[2[2[a]]]")    # → "aaaaaaaa"
d.decode("3[a2[b]]")      # → "abbabbabb"
\`\`\`

**Hint:** The Stage 1 stack solution already handles nesting — no algorithm changes needed!`,
        baseClass: `class Decoder:
    def decode(self, s: str) -> str:
        pass`,
        starterCode: `class Decoder:
    def decode(self, s: str) -> str:
        # The Stage 1 stack solution handles nesting automatically.
        # Copy your solution here and test on nested inputs.
        stack = []
        current = ""
        k = 0
        for ch in s:
            if ch.isdigit(): k = k * 10 + int(ch)
            elif ch == '[': stack.append((current, k)); current = ""; k = 0
            elif ch == ']': prev, repeat = stack.pop(); current = prev + current * repeat
            else: current += ch
        return current`,
        solution: `class Decoder:
    def decode(self, s: str) -> str:
        # The stack is what makes nesting work: on '[' the partial result
        # and repeat count are parked, and on ']' they are popped and
        # combined. Stage 1's algorithm already handles arbitrary depth.
        stack = []
        current = ""
        k = 0
        for ch in s:
            # Digits accumulate so multi-digit counts like 12[a] parse.
            if ch.isdigit(): k = k * 10 + int(ch)
            elif ch == '[': stack.append((current, k)); current = ""; k = 0
            elif ch == ']': prev, repeat = stack.pop(); current = prev + current * repeat
            else: current += ch
        return current`,
        solutionExplanation: "The stack solution handles nesting naturally: each '[' is a new frame, each ']' merges back. Nesting depth = stack depth.",
        testCases: [
          { description: "two levels of nesting", inputData: "d = Decoder()\n_result = d.decode('2[3[a]b]')", expectedOutput: '"aaabaaab"', orderIndex: 0 },
          { description: "three levels of nesting", inputData: "d = Decoder()\n_result = d.decode('2[2[2[a]]]')", expectedOutput: '"aaaaaaaa"', orderIndex: 1 },
          { description: "nested with suffix", inputData: "d = Decoder()\n_result = d.decode('3[a2[b]]')", expectedOutput: '"abbabbabb"', orderIndex: 2 },
          { description: "mixed nested and flat", inputData: "d = Decoder()\n_result = d.decode('2[ab3[c]]')", expectedOutput: '"abcccabccc"', orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 5: Time-Based Key-Value Store ────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 30005,
      slug: "time-based-key-value-store",
      title: "Time-Based Key-Value Store",
      difficulty: "Medium",
      badges: "google",
      tags: "binary-search,design,hash-map",
      description: `Design a key-value store with time-versioned reads.

- **Stage 1:** \`set(key, value, timestamp)\` and \`get(key, timestamp)\` — return the value at the largest stored timestamp ≤ query.
- **Stage 2:** \`get_range(key, t1, t2)\` — return all (timestamp, value) pairs in [t1, t2].`,
      starterCode: `class TimeKV:
    def __init__(self):
        pass

    def set(self, key: str, value: str, timestamp: int) -> None:
        pass

    def get(self, key: str, timestamp: int) -> str:
        pass`,
      methodName: "TimeKV",
    },
    [
      {
        stageNumber: 1,
        title: "Versioned Get",
        description: `Implement \`TimeKV\` with:
- \`set(key, value, timestamp)\` — timestamps for same key are strictly increasing.
- \`get(key, timestamp)\` — return value at largest stored timestamp ≤ query, or \`""\`.

\`\`\`python
store = TimeKV()
store.set("foo", "bar", 1)
store.set("foo", "bar2", 4)
store.get("foo", 3)   # → "bar"
store.get("foo", 0)   # → ""
\`\`\``,
        baseClass: `class TimeKV:
    def __init__(self):
        pass`,
        starterCode: `class TimeKV:
    def __init__(self):
        self.store = {}

    def set(self, key: str, value: str, timestamp: int) -> None:
        pass

    def get(self, key: str, timestamp: int) -> str:
        # Binary search for rightmost timestamp <= query
        pass`,
        solution: `class TimeKV:
    def __init__(self):
        # key -> list of (timestamp, value), kept in insertion order.
        self.store = {}

    def set(self, key: str, value: str, timestamp: int) -> None:
        if key not in self.store:
            self.store[key] = []
        # Timestamps are assumed non-decreasing, so appending keeps the list
        # sorted for free and the binary search below stays valid.
        self.store[key].append((timestamp, value))

    def get(self, key: str, timestamp: int) -> str:
        if key not in self.store:
            return ""
        entries = self.store[key]
        # Binary search for the LAST entry at or before timestamp, giving
        # O(log n) lookups instead of a linear scan.
        lo, hi = 0, len(entries) - 1
        result = ""
        while lo <= hi:
            mid = (lo + hi) // 2
            if entries[mid][0] <= timestamp:
                # Candidate found; keep going right for a closer one.
                result = entries[mid][1]
                lo = mid + 1
            else:
                hi = mid - 1
        # "" means nothing was written at or before this time.
        return result`,
        solutionExplanation: "Since timestamps are strictly increasing, the list is sorted. Binary search for the rightmost entry with ts <= query using the 'find last valid' pattern.",
        testCases: [
          { description: "get at exact timestamp", inputData: "store = TimeKV()\nstore.set('foo', 'bar', 1)\nstore.set('foo', 'bar2', 4)\n_result = store.get('foo', 1)", expectedOutput: '"bar"', orderIndex: 0 },
          { description: "get between timestamps returns earlier value", inputData: "store = TimeKV()\nstore.set('foo', 'bar', 1)\nstore.set('foo', 'bar2', 4)\n_result = store.get('foo', 3)", expectedOutput: '"bar"', orderIndex: 1 },
          { description: "get at second timestamp", inputData: "store = TimeKV()\nstore.set('foo', 'bar', 1)\nstore.set('foo', 'bar2', 4)\n_result = store.get('foo', 4)", expectedOutput: '"bar2"', orderIndex: 2 },
          { description: "get before any timestamp returns empty string", inputData: "store = TimeKV()\nstore.set('foo', 'bar', 1)\n_result = store.get('foo', 0)", expectedOutput: '""', orderIndex: 3 },
          { description: "get missing key returns empty string", inputData: "store = TimeKV()\n_result = store.get('baz', 1)", expectedOutput: '""', orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "Range Query",
        description: `Add \`get_range(key, t1, t2)\` returning all (timestamp, value) tuples where \`t1 <= timestamp <= t2\`.

\`\`\`python
store = TimeKV()
store.set("x", "a", 1); store.set("x", "b", 3); store.set("x", "c", 5)
store.get_range("x", 1, 5)  # → [(1,"a"), (3,"b"), (5,"c")]
store.get_range("x", 2, 4)  # → [(3,"b")]
\`\`\``,
        baseClass: `import bisect

class TimeKV:
    def __init__(self):
        self.store = {}
    def set(self, key, value, timestamp):
        if key not in self.store: self.store[key] = []
        self.store[key].append((timestamp, value))
    def get(self, key, timestamp):
        if key not in self.store: return ""
        entries = self.store[key]
        lo, hi, result = 0, len(entries)-1, ""
        while lo <= hi:
            mid = (lo+hi)//2
            if entries[mid][0] <= timestamp: result = entries[mid][1]; lo = mid+1
            else: hi = mid-1
        return result
    def get_range(self, key: str, t1: int, t2: int) -> list[tuple[int, str]]:
        pass`,
        starterCode: `import bisect

class TimeKV:
    def __init__(self):
        self.store = {}
    def set(self, key, value, timestamp):
        if key not in self.store: self.store[key] = []
        self.store[key].append((timestamp, value))
    def get(self, key, timestamp):
        if key not in self.store: return ""
        entries = self.store[key]
        lo, hi, result = 0, len(entries)-1, ""
        while lo <= hi:
            mid = (lo+hi)//2
            if entries[mid][0] <= timestamp: result = entries[mid][1]; lo = mid+1
            else: hi = mid-1
        return result
    def get_range(self, key: str, t1: int, t2: int) -> list[tuple[int, str]]:
        # bisect_left for left bound, iterate until ts > t2
        pass`,
        solution: `import bisect

class TimeKV:
    def __init__(self):
        self.store = {}
    def set(self, key, value, timestamp):
        if key not in self.store: self.store[key] = []
        self.store[key].append((timestamp, value))
    def get(self, key, timestamp):
        # Carried over from Stage 1: binary search for the latest entry
        # at or before timestamp.
        if key not in self.store: return ""
        entries = self.store[key]
        lo, hi, result = 0, len(entries)-1, ""
        while lo <= hi:
            mid = (lo+hi)//2
            if entries[mid][0] <= timestamp: result = entries[mid][1]; lo = mid+1
            else: hi = mid-1
        return result
    def get_range(self, key: str, t1: int, t2: int) -> list[tuple[int, str]]:
        if key not in self.store: return []
        entries = self.store[key]
        # (t1,) sorts before every (t1, value) tuple, so bisect_left lands on
        # the first entry at exactly t1 rather than skipping past it.
        lo = bisect.bisect_left(entries, (t1,))
        result = []
        for i in range(lo, len(entries)):
            ts, val = entries[i]
            # Sorted order means the first out-of-range entry ends the scan.
            if ts > t2: break
            result.append((ts, val))
        return result`,
        solutionExplanation: "bisect_left(entries, (t1,)) finds the first entry with timestamp >= t1 (tuple comparison). Iterate forward until ts > t2. O(log n + k) time.",
        testCases: [
          { description: "full range returns all entries", inputData: "import bisect\nstore = TimeKV()\nstore.set('x', 'a', 1)\nstore.set('x', 'b', 3)\nstore.set('x', 'c', 5)\n_result = store.get_range('x', 1, 5)", expectedOutput: "[(1, 'a'), (3, 'b'), (5, 'c')]", orderIndex: 0 },
          { description: "partial range excludes endpoints", inputData: "import bisect\nstore = TimeKV()\nstore.set('x', 'a', 1)\nstore.set('x', 'b', 3)\nstore.set('x', 'c', 5)\n_result = store.get_range('x', 2, 4)", expectedOutput: "[(3, 'b')]", orderIndex: 1 },
          { description: "exact single timestamp range", inputData: "import bisect\nstore = TimeKV()\nstore.set('x', 'a', 1)\nstore.set('x', 'b', 3)\n_result = store.get_range('x', 3, 3)", expectedOutput: "[(3, 'b')]", orderIndex: 2 },
          { description: "range beyond all timestamps returns empty", inputData: "import bisect\nstore = TimeKV()\nstore.set('x', 'a', 1)\n_result = store.get_range('x', 5, 10)", expectedOutput: "[]", orderIndex: 3 },
        ],
      },
    ]
  );

  console.log("[Seed] Batch 4 (Google problems) seeded successfully.");
}
