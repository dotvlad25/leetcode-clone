import { seedStagedProblemIfNotExists } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Batch 5: 5 Microsoft staged problems
// Microsoft: 40001 – Interval Room Counter and Token Manager
//            40002 – Snapshot Set Iterator
//            40003 – DNA Fragment Assembler
//            40004 – Greedy Beam Search Decoder
//            40005 – Task Scheduler with Dependencies
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBatch5Problems(): Promise<void> {

  // ── Problem 40001: Interval Room Counter and Token Manager ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40001,
      slug: "interval-room-counter-token-manager",
      title: "Interval Room Counter and Token Manager",
      difficulty: "Medium",
      badges: "microsoft",
      tags: "intervals,design,sweep-line",
      description: `Design a room booking system with rate limiting.

- **Stage 1:** Book rooms with time intervals; query occupancy at a given time and find peak occupancy.
- **Stage 2:** Add a token bucket rate limiter — requests consume tokens that refill over time.`,
      starterCode: `class RoomCounter:
    def book(self, start: int, end: int) -> None:
        pass

    def count_at(self, time: int) -> int:
        pass

    def max_concurrent(self) -> int:
        pass`,
      methodName: "RoomCounter",
    },
    [
      {
        stageNumber: 1,
        title: "Room Occupancy Counter",
        description: `Implement \`RoomCounter\` with:
- \`book(start, end)\` — book a room for interval [start, end) (end-exclusive).
- \`count_at(time)\` — return number of rooms occupied at \`time\`.
- \`max_concurrent()\` — return the peak number of simultaneously occupied rooms.

\`\`\`python
rc = RoomCounter()
rc.book(1, 5); rc.book(2, 8); rc.book(6, 10)
rc.count_at(3)       # → 2
rc.max_concurrent()  # → 2
\`\`\``,
        baseClass: `class RoomCounter:
    def book(self, start: int, end: int) -> None:
        pass
    def count_at(self, time: int) -> int:
        pass
    def max_concurrent(self) -> int:
        pass`,
        starterCode: `class RoomCounter:
    def __init__(self):
        self.bookings = []

    def book(self, start: int, end: int) -> None:
        pass

    def count_at(self, time: int) -> int:
        # Count bookings where start <= time < end
        pass

    def max_concurrent(self) -> int:
        # Sweep line: +1 at start, -1 at end
        pass`,
        solution: `class RoomCounter:
    def __init__(self):
        self.bookings = []

    def book(self, start: int, end: int) -> None:
        self.bookings.append((start, end))

    def count_at(self, time: int) -> int:
        return sum(1 for s, e in self.bookings if s <= time < e)

    def max_concurrent(self) -> int:
        if not self.bookings: return 0
        events = []
        for s, e in self.bookings:
            events.append((s, 1))
            events.append((e, -1))
        events.sort()
        current = max_val = 0
        for _, delta in events:
            current += delta
            max_val = max(max_val, current)
        return max_val`,
        solutionExplanation: "count_at is a linear scan. max_concurrent uses a sweep line: +1 events at start, -1 at end, sort, scan to find peak.",
        testCases: [
          { description: "count_at 3 returns 2", inputData: `rc = RoomCounter()
rc.book(1, 5)
rc.book(2, 8)
rc.book(6, 10)
_result = rc.count_at(3)`, expectedOutput: `2`, orderIndex: 0 },
          { description: "count_at 6 returns 2", inputData: `rc = RoomCounter()
rc.book(1, 5)
rc.book(2, 8)
rc.book(6, 10)
_result = rc.count_at(6)`, expectedOutput: `2`, orderIndex: 1 },
          { description: "count_at 0 returns 0", inputData: `rc = RoomCounter()
rc.book(1, 5)
_result = rc.count_at(0)`, expectedOutput: `0`, orderIndex: 2 },
          { description: "count_at 5 returns 1 (end-exclusive)", inputData: `rc = RoomCounter()
rc.book(1, 5)
rc.book(2, 8)
rc.book(6, 10)
_result = rc.count_at(5)`, expectedOutput: `1`, orderIndex: 3 },
          { description: "max_concurrent returns peak", inputData: `rc = RoomCounter()
rc.book(1, 5)
rc.book(2, 8)
rc.book(6, 10)
_result = rc.max_concurrent()`, expectedOutput: `2`, orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "Token Bucket Rate Limiter",
        description: `Extend with a token bucket: \`RoomCounter(capacity, refill_rate)\` — bucket holds up to \`capacity\` tokens, refilling at \`refill_rate\` tokens/second.

\`request(current_time, tokens_needed=1)\` — return \`True\` if enough tokens (consume them), \`False\` otherwise.

\`\`\`python
rc = RoomCounter(capacity=10, refill_rate=2)
rc.request(0, 5)   # → True  (10→5 tokens)
rc.request(0, 5)   # → True  (5→0 tokens)
rc.request(0, 1)   # → False (0 tokens)
rc.request(2, 4)   # → True  (0+2*2=4 tokens→0)
\`\`\``,
        baseClass: `class RoomCounter:
    def __init__(self, capacity: int = 0, refill_rate: float = 0):
        self.bookings = []
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = 0
    def book(self, start, end): self.bookings.append((start, end))
    def count_at(self, time): return sum(1 for s,e in self.bookings if s<=time<e)
    def max_concurrent(self):
        if not self.bookings: return 0
        events = [(s,1) for s,e in self.bookings]+[(e,-1) for s,e in self.bookings]
        events.sort(); cur=mx=0
        for _,d in events: cur+=d; mx=max(mx,cur)
        return mx
    def request(self, current_time: int, tokens_needed: int = 1) -> bool:
        pass`,
        starterCode: `class RoomCounter:
    def __init__(self, capacity: int = 0, refill_rate: float = 0):
        self.bookings = []
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = 0
    def book(self, start, end): self.bookings.append((start, end))
    def count_at(self, time): return sum(1 for s,e in self.bookings if s<=time<e)
    def max_concurrent(self):
        if not self.bookings: return 0
        events = [(s,1) for s,e in self.bookings]+[(e,-1) for s,e in self.bookings]
        events.sort(); cur=mx=0
        for _,d in events: cur+=d; mx=max(mx,cur)
        return mx
    def request(self, current_time: int, tokens_needed: int = 1) -> bool:
        # Refill tokens based on elapsed time, then consume if possible
        pass`,
        solution: `class RoomCounter:
    def __init__(self, capacity: int = 0, refill_rate: float = 0):
        self.bookings = []
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = float(capacity)
        self.last_refill = 0
    def book(self, start, end): self.bookings.append((start, end))
    def count_at(self, time): return sum(1 for s,e in self.bookings if s<=time<e)
    def max_concurrent(self):
        if not self.bookings: return 0
        events = [(s,1) for s,e in self.bookings]+[(e,-1) for s,e in self.bookings]
        events.sort(); cur=mx=0
        for _,d in events: cur+=d; mx=max(mx,cur)
        return mx
    def _refill(self, current_time):
        elapsed = current_time - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = current_time
    def request(self, current_time: int, tokens_needed: int = 1) -> bool:
        self._refill(current_time)
        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False`,
        solutionExplanation: "Lazy refill: on each request, compute elapsed time, add refill_rate*elapsed tokens (capped at capacity), then consume if available.",
        testCases: [
          { description: "initial request consumes tokens", inputData: `rc = RoomCounter(capacity=10, refill_rate=2)
_result = rc.request(0, 5)`, expectedOutput: `True`, orderIndex: 0 },
          { description: "second request consumes remaining", inputData: `rc = RoomCounter(capacity=10, refill_rate=2)
rc.request(0, 5)
_result = rc.request(0, 5)`, expectedOutput: `True`, orderIndex: 1 },
          { description: "depleted bucket returns False", inputData: `rc = RoomCounter(capacity=10, refill_rate=2)
rc.request(0, 5)
rc.request(0, 5)
_result = rc.request(0, 1)`, expectedOutput: `False`, orderIndex: 2 },
          { description: "after refill request succeeds", inputData: `rc = RoomCounter(capacity=10, refill_rate=2)
rc.request(0, 5)
rc.request(0, 5)
_result = rc.request(2, 4)`, expectedOutput: `True`, orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 40002: Snapshot Set Iterator ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40002,
      slug: "snapshot-set-iterator",
      title: "Snapshot Set Iterator",
      difficulty: "Easy",
      badges: "microsoft",
      tags: "design,hash-set,snapshot",
      description: `Design a set that supports snapshots.

- **Stage 1:** Add/remove elements, take a snapshot (returns ID), and iterate a snapshot.
- **Stage 2:** Add \`diff(snap_id1, snap_id2)\` returning (added, removed) between two snapshots.`,
      starterCode: `class SnapshotSet:
    def add(self, val: int) -> None:
        pass

    def remove(self, val: int) -> None:
        pass

    def snapshot(self) -> int:
        pass

    def iterate(self, snap_id: int) -> list[int]:
        pass`,
      methodName: "SnapshotSet",
    },
    [
      {
        stageNumber: 1,
        title: "Snapshot and Iterate",
        description: `Implement \`SnapshotSet\` with:
- \`add(val)\` / \`remove(val)\` — modify current set.
- \`snapshot()\` — save current state, return auto-incrementing ID.
- \`iterate(snap_id)\` — return sorted list of elements in that snapshot.

\`\`\`python
s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
s.iterate(id0)  # → [1, 2, 3]
s.iterate(id1)  # → [1, 3, 4]
\`\`\``,
        baseClass: `class SnapshotSet:
    def add(self, val: int) -> None:
        pass
    def remove(self, val: int) -> None:
        pass
    def snapshot(self) -> int:
        pass
    def iterate(self, snap_id: int) -> list[int]:
        pass`,
        starterCode: `class SnapshotSet:
    def __init__(self):
        self.current = set()
        self.snapshots = {}
        self._next_id = 0

    def add(self, val: int) -> None:
        pass

    def remove(self, val: int) -> None:
        pass

    def snapshot(self) -> int:
        # Save frozenset copy, return and increment ID
        pass

    def iterate(self, snap_id: int) -> list[int]:
        pass`,
        solution: `class SnapshotSet:
    def __init__(self):
        self.current = set()
        self.snapshots = {}
        self._next_id = 0

    def add(self, val: int) -> None:
        self.current.add(val)

    def remove(self, val: int) -> None:
        self.current.discard(val)

    def snapshot(self) -> int:
        snap_id = self._next_id
        self.snapshots[snap_id] = frozenset(self.current)
        self._next_id += 1
        return snap_id

    def iterate(self, snap_id: int) -> list[int]:
        if snap_id not in self.snapshots: return []
        return sorted(self.snapshots[snap_id])`,
        solutionExplanation: "Store snapshots as frozensets (immutable copies). snapshot() copies current set into a frozenset keyed by auto-incrementing ID. iterate() returns sorted list.",
        testCases: [
          { description: "snap0 contains original elements", inputData: `s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
_result = s.iterate(id0)`, expectedOutput: `[1, 2, 3]`, orderIndex: 0 },
          { description: "snap1 reflects changes", inputData: `s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
_result = s.iterate(id1)`, expectedOutput: `[1, 3, 4]`, orderIndex: 1 },
          { description: "snap0 unchanged after snap1", inputData: `s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
_result = s.iterate(id0)`, expectedOutput: `[1, 2, 3]`, orderIndex: 2 },
          { description: "invalid snap_id returns empty list", inputData: `s = SnapshotSet()
_result = s.iterate(99)`, expectedOutput: `[]`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Snapshot Diff",
        description: `Add \`diff(snap_id1, snap_id2)\` returning \`(added, removed)\` where:
- \`added\` = elements in snap2 but not snap1 (sorted)
- \`removed\` = elements in snap1 but not snap2 (sorted)

\`\`\`python
s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
s.diff(id0, id1)  # → ([4], [2])
\`\`\``,
        baseClass: `class SnapshotSet:
    def __init__(self):
        self.current = set(); self.snapshots = {}; self._next_id = 0
    def add(self, val): self.current.add(val)
    def remove(self, val): self.current.discard(val)
    def snapshot(self):
        snap_id = self._next_id
        self.snapshots[snap_id] = frozenset(self.current)
        self._next_id += 1; return snap_id
    def iterate(self, snap_id):
        if snap_id not in self.snapshots: return []
        return sorted(self.snapshots[snap_id])
    def diff(self, snap_id1: int, snap_id2: int) -> tuple:
        pass`,
        starterCode: `class SnapshotSet:
    def __init__(self):
        self.current = set(); self.snapshots = {}; self._next_id = 0
    def add(self, val): self.current.add(val)
    def remove(self, val): self.current.discard(val)
    def snapshot(self):
        snap_id = self._next_id
        self.snapshots[snap_id] = frozenset(self.current)
        self._next_id += 1; return snap_id
    def iterate(self, snap_id):
        if snap_id not in self.snapshots: return []
        return sorted(self.snapshots[snap_id])
    def diff(self, snap_id1: int, snap_id2: int) -> tuple:
        # added = snap2 - snap1, removed = snap1 - snap2
        pass`,
        solution: `class SnapshotSet:
    def __init__(self):
        self.current = set(); self.snapshots = {}; self._next_id = 0
    def add(self, val): self.current.add(val)
    def remove(self, val): self.current.discard(val)
    def snapshot(self):
        snap_id = self._next_id
        self.snapshots[snap_id] = frozenset(self.current)
        self._next_id += 1; return snap_id
    def iterate(self, snap_id):
        if snap_id not in self.snapshots: return []
        return sorted(self.snapshots[snap_id])
    def diff(self, snap_id1: int, snap_id2: int) -> tuple:
        s1 = self.snapshots.get(snap_id1, frozenset())
        s2 = self.snapshots.get(snap_id2, frozenset())
        return (sorted(s2 - s1), sorted(s1 - s2))`,
        solutionExplanation: "frozenset operations: s2 - s1 gives added, s1 - s2 gives removed. Sort both for deterministic output.",
        testCases: [
          { description: "diff shows added and removed", inputData: `s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
_result = s.diff(id0, id1)`, expectedOutput: `([4], [2])`, orderIndex: 0 },
          { description: "diff reversed swaps added and removed", inputData: `s = SnapshotSet()
s.add(1); s.add(2); s.add(3)
id0 = s.snapshot()
s.add(4); s.remove(2)
id1 = s.snapshot()
_result = s.diff(id1, id0)`, expectedOutput: `([2], [4])`, orderIndex: 1 },
          { description: "diff same snapshot returns empty lists", inputData: `s = SnapshotSet()
s.add(1); s.add(2)
id0 = s.snapshot()
_result = s.diff(id0, id0)`, expectedOutput: `([], [])`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 40003: DNA Fragment Assembler ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40003,
      slug: "dna-fragment-assembler",
      title: "DNA Fragment Assembler",
      difficulty: "Hard",
      badges: "microsoft",
      tags: "greedy,string,assembly",
      description: `Assemble overlapping DNA fragments into the shortest superstring.

- **Stage 1:** Given a list of DNA fragment strings, merge them greedily by maximum overlap.
- **Stage 2:** Fragments come with position tags; sort by tag before assembling.`,
      starterCode: `class DNAAssembler:
    def assemble(self, fragments: list[str]) -> str:
        pass`,
      methodName: "DNAAssembler",
    },
    [
      {
        stageNumber: 1,
        title: "Greedy Fragment Assembly",
        description: `Implement \`assemble(fragments)\` that merges overlapping DNA fragments into the shortest superstring.

**Rules:**
- Remove any fragment that is a substring of another.
- Repeatedly merge the pair with the greatest overlap (suffix of one = prefix of other).
- Return the assembled string.

\`\`\`python
d = DNAAssembler()
d.assemble(["ATCG", "CGTA"])       # → "ATCGTA"
d.assemble(["ATCG", "CGTA", "TACC"]) # → "ATCGTACC"
\`\`\``,
        baseClass: `class DNAAssembler:
    def assemble(self, fragments: list[str]) -> str:
        pass`,
        starterCode: `class DNAAssembler:
    def assemble(self, fragments: list[str]) -> str:
        if not fragments: return ''
        fragments = list(fragments)
        # Step 1: Remove substrings
        # Step 2: Repeatedly find and merge the pair with greatest overlap
        pass`,
        solution: `class DNAAssembler:
    def assemble(self, fragments: list[str]) -> str:
        if not fragments: return ''
        fragments = list(fragments)
        fragments = [f for f in fragments
                     if not any(f != g and f in g for g in fragments)]
        while len(fragments) > 1:
            best_overlap = -1
            best_i = best_j = 0
            for i in range(len(fragments)):
                for j in range(len(fragments)):
                    if i == j: continue
                    a, b = fragments[i], fragments[j]
                    max_ov = min(len(a), len(b))
                    for k in range(max_ov, 0, -1):
                        if a.endswith(b[:k]):
                            if k > best_overlap:
                                best_overlap = k
                                best_i, best_j = i, j
                            break
            if best_overlap <= 0:
                fragments = [fragments[0] + fragments[1]] + fragments[2:]
            else:
                merged = fragments[best_i] + fragments[best_j][best_overlap:]
                new_frags = [merged]
                for k, f in enumerate(fragments):
                    if k != best_i and k != best_j: new_frags.append(f)
                fragments = new_frags
        return fragments[0]`,
        solutionExplanation: "Greedy shortest superstring: remove substrings, then repeatedly find the pair with maximum overlap (suffix of a = prefix of b) and merge them.",
        testCases: [
          { description: "simple two-fragment overlap", inputData: `d = DNAAssembler()
_result = d.assemble(['ATCG', 'CGTA'])`, expectedOutput: `\"ATCGTA\"`, orderIndex: 0 },
          { description: "single fragment unchanged", inputData: `d = DNAAssembler()
_result = d.assemble(['ATCG'])`, expectedOutput: `\"ATCG\"`, orderIndex: 1 },
          { description: "substring fragment removed", inputData: `d = DNAAssembler()
_result = d.assemble(['ATCGTA', 'TCG'])`, expectedOutput: `\"ATCGTA\"`, orderIndex: 2 },
          { description: "three fragments assembled", inputData: `d = DNAAssembler()
_result = d.assemble(['ATCG', 'CGTA', 'TACC'])`, expectedOutput: `\"ATCGTACC\"`, orderIndex: 3 },
          { description: "empty list returns empty string", inputData: `d = DNAAssembler()
_result = d.assemble([])`, expectedOutput: `\"\"`, orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "Tagged Fragment Assembly",
        description: `Add \`assemble_tagged(tagged_fragments)\` where each element is \`(tag, sequence)\`. Sort by tag (position hint) before assembling.

\`\`\`python
d = DNAAssembler()
d.assemble_tagged([(2,'CGTA'),(1,'ATCG'),(3,'TACC')])  # → 'ATCGTACC'
\`\`\``,
        baseClass: `class DNAAssembler:
    def assemble(self, fragments):
        if not fragments: return ''
        fragments = list(fragments)
        fragments = [f for f in fragments if not any(f != g and f in g for g in fragments)]
        while len(fragments) > 1:
            best_overlap = -1; best_i = best_j = 0
            for i in range(len(fragments)):
                for j in range(len(fragments)):
                    if i == j: continue
                    a, b = fragments[i], fragments[j]
                    for k in range(min(len(a),len(b)), 0, -1):
                        if a.endswith(b[:k]):
                            if k > best_overlap: best_overlap = k; best_i, best_j = i, j
                            break
            if best_overlap <= 0: fragments = [fragments[0]+fragments[1]]+fragments[2:]
            else:
                merged = fragments[best_i]+fragments[best_j][best_overlap:]
                fragments = [merged]+[f for k,f in enumerate(fragments) if k!=best_i and k!=best_j]
        return fragments[0]
    def assemble_tagged(self, tagged_fragments: list) -> str:
        pass`,
        starterCode: `class DNAAssembler:
    def assemble(self, fragments):
        if not fragments: return ''
        fragments = list(fragments)
        fragments = [f for f in fragments if not any(f != g and f in g for g in fragments)]
        while len(fragments) > 1:
            best_overlap = -1; best_i = best_j = 0
            for i in range(len(fragments)):
                for j in range(len(fragments)):
                    if i == j: continue
                    a, b = fragments[i], fragments[j]
                    for k in range(min(len(a),len(b)), 0, -1):
                        if a.endswith(b[:k]):
                            if k > best_overlap: best_overlap = k; best_i, best_j = i, j
                            break
            if best_overlap <= 0: fragments = [fragments[0]+fragments[1]]+fragments[2:]
            else:
                merged = fragments[best_i]+fragments[best_j][best_overlap:]
                fragments = [merged]+[f for k,f in enumerate(fragments) if k!=best_i and k!=best_j]
        return fragments[0]
    def assemble_tagged(self, tagged_fragments: list) -> str:
        # Sort by tag, extract sequences, call assemble
        pass`,
        solution: `class DNAAssembler:
    def assemble(self, fragments):
        if not fragments: return ''
        fragments = list(fragments)
        fragments = [f for f in fragments if not any(f != g and f in g for g in fragments)]
        while len(fragments) > 1:
            best_overlap = -1; best_i = best_j = 0
            for i in range(len(fragments)):
                for j in range(len(fragments)):
                    if i == j: continue
                    a, b = fragments[i], fragments[j]
                    for k in range(min(len(a),len(b)), 0, -1):
                        if a.endswith(b[:k]):
                            if k > best_overlap: best_overlap = k; best_i, best_j = i, j
                            break
            if best_overlap <= 0: fragments = [fragments[0]+fragments[1]]+fragments[2:]
            else:
                merged = fragments[best_i]+fragments[best_j][best_overlap:]
                fragments = [merged]+[f for k,f in enumerate(fragments) if k!=best_i and k!=best_j]
        return fragments[0]
    def assemble_tagged(self, tagged_fragments: list) -> str:
        sorted_frags = sorted(tagged_fragments, key=lambda x: x[0])
        return self.assemble([seq for _, seq in sorted_frags])`,
        solutionExplanation: "Sort by tag (position hint) to get approximate order, extract sequences, then call assemble().",
        testCases: [
          { description: "tagged fragments assembled in tag order", inputData: `d = DNAAssembler()
_result = d.assemble_tagged([(2,'CGTA'),(1,'ATCG'),(3,'TACC')])`, expectedOutput: `\"ATCGTACC\"`, orderIndex: 0 },
          { description: "single tagged fragment", inputData: `d = DNAAssembler()
_result = d.assemble_tagged([(1,'ATCG')])`, expectedOutput: `\"ATCG\"`, orderIndex: 1 },
          { description: "empty tagged list", inputData: `d = DNAAssembler()
_result = d.assemble_tagged([])`, expectedOutput: `\"\"`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 40004: Greedy Beam Search Decoder ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40004,
      slug: "greedy-beam-search-decoder",
      title: "Greedy Beam Search Decoder",
      difficulty: "Hard",
      badges: "microsoft",
      tags: "dynamic-programming,greedy,nlp",
      description: `Implement sequence decoders used in NLP/ML systems.

- **Stage 1:** Greedy decoding — at each step pick the token with the highest log-probability.
- **Stage 2:** Beam search — maintain the top-k sequences at each step for a better global result.`,
      starterCode: `class Decoder:
    def greedy_decode(self, log_probs_per_step: list[dict]) -> list[str]:
        pass`,
      methodName: "Decoder",
    },
    [
      {
        stageNumber: 1,
        title: "Greedy Decoding",
        description: `Implement \`greedy_decode(log_probs_per_step)\` where each step is a dict \`{token: log_prob}\`. Return the sequence of tokens with the highest log-probability at each step.

\`\`\`python
d = Decoder()
steps = [
    {'A': -0.1, 'B': -1.5},
    {'A': -2.0, 'B': -0.2},
]
d.greedy_decode(steps)  # → ['A', 'B']
\`\`\``,
        baseClass: `class Decoder:
    def greedy_decode(self, log_probs_per_step: list[dict]) -> list[str]:
        pass`,
        starterCode: `class Decoder:
    def greedy_decode(self, log_probs_per_step: list[dict]) -> list[str]:
        # At each step, pick the token with max log_prob
        pass`,
        solution: `class Decoder:
    def greedy_decode(self, log_probs_per_step: list[dict]) -> list[str]:
        result = []
        for step_probs in log_probs_per_step:
            best_token = max(step_probs, key=step_probs.get)
            result.append(best_token)
        return result`,
        solutionExplanation: "At each step, use max() with key=dict.get to find the token with the highest log-probability. Collect results into a list.",
        testCases: [
          { description: "greedy picks best token each step", inputData: `d = Decoder()
steps = [{'A': -0.1, 'B': -1.5, 'C': -2.0},{'A': -2.0, 'B': -0.2, 'C': -1.0},{'A': -0.5, 'B': -3.0, 'C': -0.3}]
_result = d.greedy_decode(steps)`, expectedOutput: `['A', 'B', 'C']`, orderIndex: 0 },
          { description: "single step", inputData: `d = Decoder()
_result = d.greedy_decode([{'X': -0.1, 'Y': -0.5}])`, expectedOutput: `['X']`, orderIndex: 1 },
          { description: "empty steps returns empty list", inputData: `d = Decoder()
_result = d.greedy_decode([])`, expectedOutput: `[]`, orderIndex: 2 },
        ],
      },
      {
        stageNumber: 2,
        title: "Beam Search Decoding",
        description: `Add \`beam_search(log_probs_per_step, beam_width)\` that maintains the top-\`beam_width\` sequences by cumulative log-probability at each step. Return the best sequence.

\`\`\`python
d = Decoder()
steps = [{'A': -0.1, 'B': -1.0},
         {'A': -4.0, 'B': -0.1},
         {'A': -0.1, 'B': -2.0}]
d.beam_search(steps, 2)  # → ['A', 'B', 'A']  (total -0.3)
d.beam_search(steps, 1)  # → ['A', 'A', 'A']  (greedy, total -4.2)
\`\`\``,
        baseClass: `class Decoder:
    def greedy_decode(self, log_probs_per_step):
        return [max(s, key=s.get) for s in log_probs_per_step]
    def beam_search(self, log_probs_per_step: list[dict], beam_width: int) -> list[str]:
        pass`,
        starterCode: `class Decoder:
    def greedy_decode(self, log_probs_per_step):
        return [max(s, key=s.get) for s in log_probs_per_step]
    def beam_search(self, log_probs_per_step: list[dict], beam_width: int) -> list[str]:
        # beams = [(cumulative_log_prob, sequence)]
        # Expand each beam with all tokens, keep top beam_width
        pass`,
        solution: `class Decoder:
    def greedy_decode(self, log_probs_per_step):
        return [max(s, key=s.get) for s in log_probs_per_step]
    def beam_search(self, log_probs_per_step: list[dict], beam_width: int) -> list[str]:
        if not log_probs_per_step: return []
        beams = [(0.0, [])]
        for step_probs in log_probs_per_step:
            candidates = []
            for cum_lp, seq in beams:
                for token, lp in step_probs.items():
                    candidates.append((cum_lp + lp, seq + [token]))
            candidates.sort(key=lambda x: x[0], reverse=True)
            beams = candidates[:beam_width]
        return beams[0][1]`,
        solutionExplanation: "Maintain a list of (cumulative_log_prob, sequence) beams. Each step: expand all beams with all tokens, keep top beam_width by cumulative log-prob. Return the best beam's sequence.",
        testCases: [
          { description: "beam=1 is equivalent to greedy", inputData: `d = Decoder()
steps = [{'A': -0.1, 'B': -1.0},{'A': -2.0, 'B': -0.1},{'A': -0.1, 'B': -2.0}]
_result = d.beam_search(steps, 1)`, expectedOutput: `['A', 'B', 'A']`, orderIndex: 0 },
          { description: "beam=2 finds globally better path", inputData: `d = Decoder()
steps = [{'A': -0.1, 'B': -0.9},{'A': -4.0, 'B': -0.1},{'A': -0.1, 'B': -4.0}]
_result = d.beam_search(steps, 2)`, expectedOutput: `['A', 'B', 'A']`, orderIndex: 1 },
          { description: "empty steps returns empty list", inputData: `d = Decoder()
_result = d.beam_search([], 3)`, expectedOutput: `[]`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 40005: Task Scheduler with Dependencies ─────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40005,
      slug: "task-scheduler-with-dependencies",
      title: "Task Scheduler with Dependencies",
      difficulty: "Medium",
      badges: "microsoft",
      tags: "topological-sort,graph,scheduling",
      description: `Schedule tasks respecting dependencies.

- **Stage 1:** Return a valid topological execution order (or empty list if cycle detected).
- **Stage 2:** Compute the minimum wall-clock time to complete all tasks given task durations.`,
      starterCode: `class TaskScheduler:
    def order_tasks(self, n: int, dependencies: list[list[int]]) -> list[int]:
        pass`,
      methodName: "TaskScheduler",
    },
    [
      {
        stageNumber: 1,
        title: "Topological Sort",
        description: `Implement \`order_tasks(n, dependencies)\` returning a valid topological order of \`n\` tasks (0-indexed). \`dependencies[i] = [a, b]\` means task \`a\` must run before \`b\`. Return \`[]\` if a cycle is detected.

\`\`\`python
t = TaskScheduler()
t.order_tasks(3, [[0,1],[1,2]])  # → [0, 1, 2]
t.order_tasks(2, [[0,1],[1,0]])  # → []  (cycle)
\`\`\``,
        baseClass: `class TaskScheduler:
    def order_tasks(self, n: int, dependencies: list[list[int]]) -> list[int]:
        pass`,
        starterCode: `from collections import deque

class TaskScheduler:
    def order_tasks(self, n: int, dependencies: list[list[int]]) -> list[int]:
        # Build adjacency list and in-degree array
        # BFS (Kahn's algorithm): start with nodes of in-degree 0
        pass`,
        solution: `from collections import deque

class TaskScheduler:
    def order_tasks(self, n: int, dependencies: list[list[int]]) -> list[int]:
        graph = [[] for _ in range(n)]
        in_degree = [0] * n
        for a, b in dependencies:
            graph[a].append(b)
            in_degree[b] += 1
        queue = deque(i for i in range(n) if in_degree[i] == 0)
        order = []
        while queue:
            node = queue.popleft()
            order.append(node)
            for nb in graph[node]:
                in_degree[nb] -= 1
                if in_degree[nb] == 0:
                    queue.append(nb)
        return order if len(order) == n else []`,
        solutionExplanation: "Kahn's algorithm: build in-degree array, start BFS from nodes with in-degree 0, decrement neighbors' in-degrees. If output length < n, a cycle exists.",
        testCases: [
          { description: "linear chain returns correct order", inputData: `from collections import deque
t = TaskScheduler()
_result = t.order_tasks(3, [[0,1],[1,2]])`, expectedOutput: `[0, 1, 2]`, orderIndex: 0 },
          { description: "no dependencies returns any valid order", inputData: `from collections import deque
t = TaskScheduler()
_result = t.order_tasks(3, [])`, expectedOutput: `[0, 1, 2]`, orderIndex: 1 },
          { description: "cycle returns empty list", inputData: `from collections import deque
t = TaskScheduler()
_result = t.order_tasks(2, [[0,1],[1,0]])`, expectedOutput: `[]`, orderIndex: 2 },
          { description: "diamond dependency resolved", inputData: `from collections import deque
t = TaskScheduler()
_result = t.order_tasks(4, [[0,1],[0,2],[1,3],[2,3]])`, expectedOutput: `[0, 1, 2, 3]`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Minimum Completion Time",
        description: `Add \`min_time(n, dependencies, durations, max_parallel)\` returning the minimum wall-clock time to complete all tasks. \`durations[i]\` is the time task \`i\` takes.

\`\`\`python
t = TaskScheduler()
t.min_time(3, [[0,1],[1,2]], [1,2,3], 1)   # → 6  (sequential)
t.min_time(3, [[0,1],[0,2]], [1,2,2], 2)   # → 3  (parallel after task 0)
\`\`\``,
        baseClass: `from collections import deque

class TaskScheduler:
    def order_tasks(self, n, dependencies):
        graph = [[] for _ in range(n)]; in_degree = [0]*n
        for a,b in dependencies: graph[a].append(b); in_degree[b]+=1
        queue = deque(i for i in range(n) if in_degree[i]==0); order=[]
        while queue:
            node=queue.popleft(); order.append(node)
            for nb in graph[node]:
                in_degree[nb]-=1
                if in_degree[nb]==0: queue.append(nb)
        return order if len(order)==n else []
    def min_time(self, n: int, dependencies: list, durations: list, max_parallel: int) -> int:
        pass`,
        starterCode: `from collections import deque

class TaskScheduler:
    def order_tasks(self, n, dependencies):
        graph = [[] for _ in range(n)]; in_degree = [0]*n
        for a,b in dependencies: graph[a].append(b); in_degree[b]+=1
        queue = deque(i for i in range(n) if in_degree[i]==0); order=[]
        while queue:
            node=queue.popleft(); order.append(node)
            for nb in graph[node]:
                in_degree[nb]-=1
                if in_degree[nb]==0: queue.append(nb)
        return order if len(order)==n else []
    def min_time(self, n: int, dependencies: list, durations: list, max_parallel: int) -> int:
        # Topological order + propagate earliest_start times
        # finish_time[i] = earliest_start[i] + durations[i]
        # Answer = max(finish_time)
        pass`,
        solution: `from collections import deque

class TaskScheduler:
    def order_tasks(self, n, dependencies):
        graph = [[] for _ in range(n)]; in_degree = [0]*n
        for a,b in dependencies: graph[a].append(b); in_degree[b]+=1
        queue = deque(i for i in range(n) if in_degree[i]==0); order=[]
        while queue:
            node=queue.popleft(); order.append(node)
            for nb in graph[node]:
                in_degree[nb]-=1
                if in_degree[nb]==0: queue.append(nb)
        return order if len(order)==n else []
    def min_time(self, n: int, dependencies: list, durations: list, max_parallel: int) -> int:
        graph = [[] for _ in range(n)]
        for a, b in dependencies: graph[a].append(b)
        topo = self.order_tasks(n, dependencies)
        if not topo and n > 0: return -1
        earliest_start = [0] * n
        finish_time = [0] * n
        for task in topo:
            finish_time[task] = earliest_start[task] + durations[task]
            for nb in graph[task]:
                earliest_start[nb] = max(earliest_start[nb], finish_time[task])
        return max(finish_time)`,
        solutionExplanation: "Process tasks in topological order. For each task, finish_time = earliest_start + duration. Propagate finish_time to all dependents as their earliest_start. Answer = max(finish_time).",
        testCases: [
          { description: "sequential chain takes sum of durations", inputData: `from collections import deque
t = TaskScheduler()
_result = t.min_time(3, [[0,1],[1,2]], [1,2,3], 1)`, expectedOutput: `6`, orderIndex: 0 },
          { description: "parallel tasks reduce total time", inputData: `from collections import deque
t = TaskScheduler()
_result = t.min_time(3, [[0,1],[0,2]], [1,2,2], 2)`, expectedOutput: `3`, orderIndex: 1 },
          { description: "no dependencies returns max duration", inputData: `from collections import deque
t = TaskScheduler()
_result = t.min_time(3, [], [2,3,4], 3)`, expectedOutput: `4`, orderIndex: 2 },
          { description: "single task", inputData: `from collections import deque
t = TaskScheduler()
_result = t.min_time(1, [], [5], 1)`, expectedOutput: `5`, orderIndex: 3 },
          { description: "diamond dependency", inputData: `from collections import deque
t = TaskScheduler()
_result = t.min_time(4, [[0,1],[0,2],[1,3],[2,3]], [1,2,2,1], 2)`, expectedOutput: `4`, orderIndex: 4 },
        ],
      },
    ]
  );

  console.log("[Seed] Batch 5 (Microsoft problems) seeded successfully.");
}
