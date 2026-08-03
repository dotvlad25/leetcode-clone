import { eq } from "drizzle-orm";
import { problems } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Solutions ────────────────────────────────────────────────────────────────

const solutions = [
  // ── LC 146 ──────────────────────────────────────────────────────────────────
  {
    slug: "lru-cache",
    solution: `from collections import OrderedDict

class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()  # preserves insertion order

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        # Mark as most-recently used
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # Remove least-recently used (front of OrderedDict)
            self.cache.popitem(last=False)`,
    solutionExplanation: `## Approach — OrderedDict as a Doubly-Linked Hash Map

The classic LRU Cache requires both **O(1) lookup** (hash map) and **O(1) eviction of the least-recently used entry** (doubly-linked list). Python's \`collections.OrderedDict\` is exactly that combination under the hood.

### Key operations

| Operation | What we do | Why |
|-----------|-----------|-----|
| \`get(key)\` | \`move_to_end(key)\` | Marks the entry as most-recently used |
| \`put(key, value)\` | Insert / update + \`move_to_end\` | Keeps the order fresh |
| Eviction | \`popitem(last=False)\` | Removes the front (oldest) entry in O(1) |

### Complexity
- **Time:** O(1) for both \`get\` and \`put\` — all OrderedDict operations are O(1) amortised.
- **Space:** O(capacity) — we store at most \`capacity\` entries.

### Interview insight
If asked to implement without \`OrderedDict\`, use a **doubly-linked list + hash map** manually. The sentinel head/tail trick eliminates edge-case checks on empty lists. Python's \`OrderedDict\` is the idiomatic shortcut that interviewers accept — just be ready to explain the underlying structure.`,
  },

  // ── LC 588 ──────────────────────────────────────────────────────────────────
  {
    slug: "design-in-memory-file-system",
    solution: `from collections import defaultdict
from typing import List

class FileSystem:

    def __init__(self):
        # Maps directory path -> set of child names (files + subdirs)
        self.dirs: dict[str, set] = defaultdict(set)
        # Maps file path -> file content string
        self.files: dict[str, str] = {}

    def ls(self, path: str) -> List[str]:
        # If path points to a file, return just the filename
        if path in self.files:
            return [path.split("/")[-1]]
        # Otherwise list directory contents, sorted lexicographically
        return sorted(self.dirs.get(path, set()))

    def mkdir(self, path: str) -> None:
        parts = path.split("/")
        for i in range(1, len(parts) + 1):
            current = "/".join(parts[:i]) or "/"
            if i > 1:
                parent = "/".join(parts[:i - 1]) or "/"
                self.dirs[parent].add(parts[i - 1])
        self.dirs.setdefault(path, set())

    def addContentToFile(self, filePath: str, content: str) -> None:
        parts = filePath.split("/")
        # Ensure all ancestor directories exist
        for i in range(1, len(parts)):
            parent = "/".join(parts[:i]) or "/"
            self.dirs[parent].add(parts[i])
        # Append content (supports multiple writes to same file)
        self.files[filePath] = self.files.get(filePath, "") + content

    def readContentFromFile(self, filePath: str) -> str:
        return self.files.get(filePath, "")`,
    solutionExplanation: `## Approach — Two Hash Maps (Directory Tree + File Store)

We maintain two separate dictionaries:

1. **\`dirs\`** — maps each directory path to a \`set\` of its direct children (both subdirectory names and file names). Using a \`set\` gives O(1) insertion and O(k log k) sorted listing.
2. **\`files\`** — maps each file path to its content string.

### Why not a trie?
A trie is the "textbook" answer, but for Python interviews a pair of hash maps is cleaner, easier to reason about, and equally efficient.

### Operation breakdown

| Method | Strategy | Time |
|--------|----------|------|
| \`ls\` | Check \`files\` first; fall back to \`dirs\` | O(k log k) where k = children |
| \`mkdir\` | Walk each prefix, register child in parent | O(d) where d = path depth |
| \`addContentToFile\` | Ensure parent dirs, then append to \`files\` | O(d + len(content)) |
| \`readContentFromFile\` | Direct dict lookup | O(1) |

### Complexity
- **Time:** O(d) per operation where d is the path depth (typically small).
- **Space:** O(total characters stored across all files + total path segments).

### Interview insight
The tricky edge case is \`ls\` on a **file path** — it must return a single-element list with just the filename, not the full path. Always check \`files\` before \`dirs\`.`,
  },

  // ── LC 609 ──────────────────────────────────────────────────────────────────
  {
    slug: "find-duplicate-file-in-system",
    solution: `from collections import defaultdict
from typing import List

class Solution:

    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        # content -> list of "dir/filename" strings
        content_map: dict[str, list] = defaultdict(list)

        for path in paths:
            parts = path.split()
            directory = parts[0]
            for file_info in parts[1:]:
                # Each token is "filename(content)"
                fname, _, content = file_info.partition("(")
                content = content.rstrip(")")
                content_map[content].append(f"{directory}/{fname}")

        # Only return groups with at least 2 files
        return [group for group in content_map.values() if len(group) >= 2]`,
    solutionExplanation: `## Approach — Content-Keyed Hash Map

The core insight is to **group files by their content**, not by their name or location. A \`defaultdict(list)\` maps each unique content string to all file paths that contain it.

### Parsing each path string

Each input string has the form: \`"root/dir file1.txt(content1) file2.txt(content2)"\`

1. Split on whitespace — first token is the directory, the rest are \`name(content)\` tokens.
2. Use \`str.partition("(")\` to cleanly split on the first \`(\` without a regex.
3. Strip the trailing \`)\` from the content.
4. Build the full path as \`directory/filename\`.

### Complexity
- **Time:** O(N) where N is the total number of characters across all path strings.
- **Space:** O(N) for the hash map.

### Interview follow-ups (know these)
| Question | Answer |
|----------|--------|
| How to handle very large files? | Don't load into memory — compare hashes (MD5/SHA256) |
| How to avoid hash collisions? | Use a two-step check: hash first, then byte-compare |
| Real-world scale? | Distributed map-reduce: emit (content_hash, path) pairs, reduce by key |`,
  },

  // ── LC 636 ──────────────────────────────────────────────────────────────────
  {
    slug: "exclusive-time-of-functions",
    solution: `from typing import List

class Solution:

    def exclusiveTime(self, n: int, logs: List[str]) -> List[int]:
        result = [0] * n
        # Stack stores (func_id, current_start_time)
        stack: list[tuple[int, int]] = []

        for log in logs:
            func_id_str, event, ts_str = log.split(":")
            func_id, timestamp = int(func_id_str), int(ts_str)

            if event == "start":
                if stack:
                    # Pause the running function: credit elapsed time so far
                    result[stack[-1][0]] += timestamp - stack[-1][1]
                stack.append((func_id, timestamp))
            else:  # "end"
                # End is inclusive: add (end - start + 1) units
                result[func_id] += timestamp - stack.pop()[1] + 1
                if stack:
                    # Resume the caller from the next timestamp
                    stack[-1] = (stack[-1][0], timestamp + 1)

        return result`,
    solutionExplanation: `## Approach — Monotonic Call Stack

This is a **call stack simulation** problem. The key insight is that function calls nest like a stack: when a new function starts, the current one is paused; when it ends, the caller resumes.

### The tricky part — "end" is inclusive

The timestamp on an \`end\` event is the **last unit of time** the function ran, not the first unit after it finishes. So the duration is \`end - start + 1\`, not \`end - start\`.

When a function ends and its caller resumes, the caller's new start time is \`end_timestamp + 1\`.

### Walkthrough of \`["0:start:0","1:start:2","1:end:5","0:end:6"]\`

| Event | Stack | Action |
|-------|-------|--------|
| 0 start 0 | [(0,0)] | Push fn0, starts at t=0 |
| 1 start 2 | [(0,0),(1,2)] | Credit fn0 with 2-0=2 units, push fn1 |
| 1 end 5 | [(0,6)] | fn1 gets 5-2+1=4 units; fn0 resumes at t=6 |
| 0 end 6 | [] | fn0 gets 6-6+1=1 unit; total fn0=2+1=3 ✓ |

### Complexity
- **Time:** O(L) where L is the number of log entries.
- **Space:** O(n) for the result array + O(depth) for the call stack.`,
  },

  // ── LC 1236 ──────────────────────────────────────────────────────────────────
  {
    slug: "web-crawler",
    solution: `from urllib.parse import urlparse
from collections import deque
from typing import List

class Solution:

    def crawl(self, startUrl: str, htmlParser) -> List[str]:
        # Extract the hostname to stay within the same domain
        hostname = urlparse(startUrl).netloc

        visited = {startUrl}
        queue = deque([startUrl])

        while queue:
            url = queue.popleft()
            for next_url in htmlParser.getUrls(url):
                if (
                    next_url not in visited
                    and urlparse(next_url).netloc == hostname
                ):
                    visited.add(next_url)
                    queue.append(next_url)

        return list(visited)`,
    solutionExplanation: `## Approach — BFS with Hostname Filter

This is a standard **graph BFS** where each URL is a node and \`htmlParser.getUrls(url)\` returns its neighbours. The only domain-specific constraint is that we must stay on the **same hostname**.

### Why BFS over DFS?
BFS is preferred here because:
- It explores URLs level by level, making it easier to reason about depth limits.
- It naturally avoids deep recursion stack overflows on large graphs.
- It is the foundation for the multithreaded variant (LC 1242).

### Hostname extraction
\`urlparse(url).netloc\` returns the host (e.g. \`"news.yahoo.com"\`) without the scheme or path. This is the correct way to compare domains in Python — never use string prefix matching.

### Complexity
- **Time:** O(V + E) where V = reachable URLs, E = total links returned by \`getUrls\`.
- **Space:** O(V) for the visited set and queue.

### Interview insight
The follow-up is always LC 1242 (multithreaded). Know that the BFS structure maps cleanly to a thread pool where each level of the BFS is a batch of parallel \`getUrls\` calls.`,
  },

  // ── LC 1242 ──────────────────────────────────────────────────────────────────
  {
    slug: "web-crawler-multithreaded",
    solution: `from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List
import threading

class Solution:

    def crawl(self, startUrl: str, htmlParser) -> List[str]:
        hostname = urlparse(startUrl).netloc
        visited: set[str] = {startUrl}
        lock = threading.Lock()

        def worker(url: str) -> list[str]:
            """Fetch neighbours; return only newly discovered same-domain URLs."""
            new_urls = []
            for next_url in htmlParser.getUrls(url):
                if urlparse(next_url).netloc == hostname:
                    with lock:
                        if next_url not in visited:
                            visited.add(next_url)
                            new_urls.append(next_url)
            return new_urls

        frontier = [startUrl]
        with ThreadPoolExecutor(max_workers=16) as executor:
            while frontier:
                futures = {executor.submit(worker, url): url for url in frontier}
                frontier = []
                for future in as_completed(futures):
                    frontier.extend(future.result())

        return list(visited)`,
    solutionExplanation: `## Approach — Parallel BFS with ThreadPoolExecutor

This is LC 1236 (Web Crawler) with one critical change: \`htmlParser.getUrls(url)\` is a **blocking I/O call** (simulating an HTTP request), so we want to issue many of them concurrently.

### Structure: level-by-level parallel BFS

Each BFS level (frontier) is submitted as a batch of tasks to a \`ThreadPoolExecutor\`. We wait for all tasks in the current level to complete before starting the next level. This is sometimes called **synchronous parallel BFS**.

\`\`\`
frontier = [startUrl]
while frontier:
    submit all URLs in frontier to thread pool
    collect results → new frontier
\`\`\`

### Thread safety
The \`visited\` set is shared across threads. We protect it with a \`threading.Lock\`. The critical section is minimal: just the membership check + insert, so contention is low.

### Why not asyncio?
\`asyncio\` would be ideal if \`getUrls\` were async, but the interface is synchronous. \`ThreadPoolExecutor\` is the correct tool for blocking I/O in Python.

### Complexity
- **Time:** O((V + E) / T) amortised where T = number of threads (up to 16).
- **Space:** O(V) for the visited set.`,
  },

  // ── LC 1752 ──────────────────────────────────────────────────────────────────
  {
    slug: "check-if-array-is-sorted-and-rotated",
    solution: `from typing import List

class Solution:

    def check(self, nums: List[int]) -> bool:
        n = len(nums)
        # Count positions where the sequence "drops" (wrapping around)
        drops = sum(1 for i in range(n) if nums[i] > nums[(i + 1) % n])
        # A valid sorted-and-rotated array has at most one drop point
        return drops <= 1`,
    solutionExplanation: `## Approach — Count Inversions on a Circular Array

A sorted array rotated by k positions has **exactly one "drop point"** — the single position where \`nums[i] > nums[i+1]\` (wrapping around circularly). An unrotated sorted array has **zero** drop points.

### Visualisation

\`\`\`
Original sorted:  [1, 2, 3, 4, 5]  → 0 drops  ✓
Rotated by 2:     [4, 5, 1, 2, 3]  → 1 drop (5→1) ✓
Not sorted/rot:   [2, 1, 3, 4, 5]  → 1 drop (2→1) ... but also check wrap: 5→2 = another drop → 2 drops ✗
\`\`\`

Wait — \`[2,1,3,4,5]\` has one drop (index 0→1) and the wrap 5→2 is also a drop, giving **2 drops** — correctly rejected.

### The modulo trick
\`nums[(i + 1) % n]\` lets us check the circular wrap (last element vs first) without a special case.

### Complexity
- **Time:** O(n) — single pass.
- **Space:** O(1) — no extra data structures.

### Interview insight
This is a clean one-liner that demonstrates comfort with circular indexing. If asked to extend to "at most k rotations", you'd count drops and check \`drops <= k\`.`,
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

/** Backfills reference solutions onto already-seeded problems. Idempotent. */
export async function runSolutionsSeed(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const { slug, solution, solutionExplanation } of solutions) {
    const rows = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.slug, slug))
      .limit(1);
    if (rows.length === 0) continue;

    await db
      .update(problems)
      .set({ solution, solutionExplanation })
      .where(eq(problems.slug, slug));
  }
}
