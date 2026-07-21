import { seedStagedProblemIfNotExists } from "./db";
// ─────────────────────────────────────────────────────────────────────────────
// Batch 9: 5 Amazon staged problems (from prachub scrape)
// Amazon: 20015 – Design an In-Memory Pub-Sub Model (188 solvers)
//         20016 – Compute Edit Distance (39 solvers)
//         20017 – Design an Amazon Locker Service (45 solvers)
//         20018 – Find Two-Word Compound Words (17 solvers)
//         20019 – Find a Maximum-Sum Window in a Sparse Array (12 solvers)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedBatch9Problems(): Promise<void> {
  // ── Problem 1: In-Memory Pub-Sub Model ────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20015,
      slug: "amazon-pubsub-model",
      title: "Design an In-Memory Pub-Sub Model",
      difficulty: "Medium",
      badges: "amazon",
      tags: "design,oop,events",
      frequency: 188,
      description: `Design an **in-memory publish-subscribe (pub-sub) system** with topics, subscribers, and message delivery.
- **Stage 1:** Basic subscribe/publish — subscribers receive messages published to their topics.
- **Stage 2:** Unsubscribe and message drain — support removing a subscriber; \`get_messages\` clears the inbox.
- **Stage 3:** Multi-topic fan-out — a subscriber can follow multiple topics; \`publish\` returns recipient count.`,
      starterCode: `from collections import defaultdict
class PubSub:
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        pass
    def publish(self, topic: str, message: str) -> int:
        pass
    def get_messages(self, subscriber_id: str) -> list:
        pass`,
      methodName: "PubSub",
    },
    [
      {
        stageNumber: 1,
        title: "Basic Subscribe and Publish",
        description: `Implement \`PubSub\` with:
- \`subscribe(topic, subscriber_id)\` — register subscriber for a topic.
- \`publish(topic, message)\` — deliver message to all subscribers of that topic; return recipient count.
- \`get_messages(subscriber_id)\` — return all pending messages for this subscriber (clears inbox).
\`\`\`python
ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("sports", "bob")
ps.publish("sports", "goal!")   # → 2
ps.get_messages("alice")        # → ["goal!"]
ps.get_messages("bob")          # → ["goal!"]
ps.get_messages("alice")        # → []  (already drained)
\`\`\``,
        baseClass: `from collections import defaultdict
class PubSub:
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        pass
    def publish(self, topic: str, message: str) -> int:
        pass
    def get_messages(self, subscriber_id: str) -> list:
        pass`,
        starterCode: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        # TODO: add subscriber_id to topic's subscriber list (avoid duplicates)
        pass
    def publish(self, topic: str, message: str) -> int:
        # TODO: deliver message to all subscribers, return count
        pass
    def get_messages(self, subscriber_id: str) -> list:
        # TODO: return and clear inbox
        pass`,
        solution: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import PubSub
def test_basic_pubsub():
    ps = PubSub()
    ps.subscribe("sports", "alice")
    ps.subscribe("sports", "bob")
    assert ps.publish("sports", "goal!") == 2
    assert ps.get_messages("alice") == ["goal!"]
    assert ps.get_messages("bob") == ["goal!"]
    assert ps.get_messages("alice") == []
def test_no_subscribers():
    ps = PubSub()
    assert ps.publish("empty", "hello") == 0
def test_multiple_topics():
    ps = PubSub()
    ps.subscribe("a", "u1")
    ps.subscribe("b", "u1")
    ps.publish("a", "msg_a")
    ps.publish("b", "msg_b")
    msgs = ps.get_messages("u1")
    assert "msg_a" in msgs and "msg_b" in msgs
test_basic_pubsub()
test_no_subscribers()
test_multiple_topics()
print("Stage 1 tests passed")`,
      },
      {
        stageNumber: 2,
        title: "Unsubscribe Support",
        description: `Extend \`PubSub\` with:
- \`unsubscribe(topic, subscriber_id)\` — remove subscriber from a topic; future publishes skip them.
\`\`\`python
ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("sports", "bob")
ps.unsubscribe("sports", "bob")
ps.publish("sports", "final score")  # → 1
ps.get_messages("bob")               # → []
\`\`\``,
        baseClass: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        pass`,
        starterCode: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        # TODO: remove subscriber_id from topic's list if present
        pass`,
        solution: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import PubSub
def test_unsubscribe():
    ps = PubSub()
    ps.subscribe("sports", "alice")
    ps.subscribe("sports", "bob")
    ps.unsubscribe("sports", "bob")
    assert ps.publish("sports", "final score") == 1
    assert ps.get_messages("bob") == []
    assert ps.get_messages("alice") == ["final score"]
def test_unsubscribe_nonexistent():
    ps = PubSub()
    ps.subscribe("t", "u1")
    ps.unsubscribe("t", "u2")  # should not raise
    assert ps.publish("t", "hi") == 1
test_unsubscribe()
test_unsubscribe_nonexistent()
print("Stage 2 tests passed")`,
      },
      {
        stageNumber: 3,
        title: "Multi-Topic Fan-Out",
        description: `Verify the full system works with multiple topics and multiple subscribers:
- A subscriber can follow multiple topics simultaneously.
- \`publish\` on one topic does not affect other topics.
\`\`\`python
ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("tech", "alice")
ps.subscribe("tech", "bob")
ps.publish("sports", "goal")
ps.publish("tech", "new release")
ps.get_messages("alice")  # → ["goal", "new release"]
ps.get_messages("bob")    # → ["new release"]
\`\`\``,
        baseClass: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        starterCode: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        solution: `from collections import defaultdict
class PubSub:
    def __init__(self):
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import PubSub
def test_multi_topic():
    ps = PubSub()
    ps.subscribe("sports", "alice")
    ps.subscribe("tech", "alice")
    ps.subscribe("tech", "bob")
    ps.publish("sports", "goal")
    ps.publish("tech", "new release")
    alice_msgs = ps.get_messages("alice")
    assert "goal" in alice_msgs and "new release" in alice_msgs
    bob_msgs = ps.get_messages("bob")
    assert bob_msgs == ["new release"]
def test_isolation():
    ps = PubSub()
    ps.subscribe("a", "u1")
    ps.publish("b", "msg")
    assert ps.get_messages("u1") == []
test_multi_topic()
test_isolation()
print("Stage 3 tests passed")`,
      },
    ]
  );

  // ── Problem 2: Compute Edit Distance ──────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20016,
      slug: "amazon-edit-distance",
      title: "Compute Edit Distance",
      difficulty: "Medium",
      badges: "amazon",
      tags: "dp,string,classic",
      frequency: 39,
      description: `Given two strings \`s\` and \`t\`, return the **minimum number of single-character operations** (insert, delete, or replace) needed to transform \`s\` into \`t\` — the classic Levenshtein distance.
- **Stage 1:** Recursive solution with memoization.
- **Stage 2:** Bottom-up DP table (O(m·n) time, O(m·n) space).
- **Stage 3:** Space-optimized rolling array (O(min(m,n)) space).`,
      starterCode: `def edit_distance(s: str, t: str) -> int:
    pass`,
      methodName: "edit_distance",
    },
    [
      {
        stageNumber: 1,
        title: "Recursive with Memoization",
        description: `Implement \`edit_distance(s, t)\` using top-down recursion with a memo cache.
\`\`\`python
edit_distance("kitten", "sitting")  # → 3
edit_distance("", "abc")            # → 3
edit_distance("abc", "abc")         # → 0
\`\`\`
**Hint:** At each position \`(i, j)\`, if \`s[i] == t[j]\` recurse to \`(i+1, j+1)\`; otherwise take 1 + min of insert/delete/replace.`,
        baseClass: `def edit_distance(s: str, t: str) -> int:
    pass`,
        starterCode: `def edit_distance(s: str, t: str) -> int:
    from functools import lru_cache
    @lru_cache(maxsize=None)
    def dp(i, j):
        if i == 0: return j
        if j == 0: return i
        if s[i-1] == t[j-1]:
            return dp(i-1, j-1)
        # TODO: return 1 + min of three operations
        pass
    return dp(len(s), len(t))`,
        solution: `def edit_distance(s: str, t: str) -> int:
    from functools import lru_cache
    @lru_cache(maxsize=None)
    def dp(i, j):
        if i == 0: return j
        if j == 0: return i
        if s[i-1] == t[j-1]:
            return dp(i-1, j-1)
        return 1 + min(dp(i-1, j), dp(i, j-1), dp(i-1, j-1))
    return dp(len(s), len(t))`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import edit_distance
assert edit_distance("kitten", "sitting") == 3
assert edit_distance("", "abc") == 3
assert edit_distance("abc", "") == 3
assert edit_distance("abc", "abc") == 0
assert edit_distance("horse", "ros") == 3
print("Stage 1 tests passed")`,
      },
      {
        stageNumber: 2,
        title: "Bottom-Up DP Table",
        description: `Rewrite using a 2-D DP table — no recursion.
\`\`\`
dp[i][j] = edit distance between s[:i] and t[:j]
dp[0][j] = j   (insert j chars)
dp[i][0] = i   (delete i chars)
\`\`\`
\`\`\`python
edit_distance("intention", "execution")  # → 5
\`\`\``,
        baseClass: `def edit_distance(s: str, t: str) -> int:
    pass`,
        starterCode: `def edit_distance(s: str, t: str) -> int:
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                # TODO: fill in the recurrence
                pass
    return dp[m][n]`,
        solution: `def edit_distance(s: str, t: str) -> int:
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import edit_distance
assert edit_distance("kitten", "sitting") == 3
assert edit_distance("intention", "execution") == 5
assert edit_distance("", "") == 0
assert edit_distance("a", "b") == 1
print("Stage 2 tests passed")`,
      },
      {
        stageNumber: 3,
        title: "Space-Optimized Rolling Array",
        description: `Optimize space to O(min(m, n)) using a single 1-D array.
\`\`\`python
edit_distance("kitten", "sitting")  # → 3  (same result, less memory)
\`\`\`
**Hint:** Keep only the previous row and update in-place, tracking the diagonal cell with a \`prev\` variable.`,
        baseClass: `def edit_distance(s: str, t: str) -> int:
    pass`,
        starterCode: `def edit_distance(s: str, t: str) -> int:
    m, n = len(s), len(t)
    # Ensure s is the shorter string for space optimization
    if m < n:
        s, t = t, s
        m, n = n, m
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            temp = dp[j]
            if s[i-1] == t[j-1]:
                dp[j] = prev
            else:
                # TODO: update dp[j] using prev, dp[j], dp[j-1]
                pass
            prev = temp
    return dp[n]`,
        solution: `def edit_distance(s: str, t: str) -> int:
    m, n = len(s), len(t)
    if m < n:
        s, t = t, s
        m, n = n, m
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            temp = dp[j]
            if s[i-1] == t[j-1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j], dp[j-1])
            prev = temp
    return dp[n]`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import edit_distance
assert edit_distance("kitten", "sitting") == 3
assert edit_distance("intention", "execution") == 5
assert edit_distance("", "abc") == 3
assert edit_distance("abc", "") == 3
assert edit_distance("abc", "abc") == 0
print("Stage 3 tests passed")`,
      },
    ]
  );

  // ── Problem 3: Amazon Locker Service ──────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20017,
      slug: "amazon-locker-service",
      title: "Design an Amazon Locker Service",
      difficulty: "Easy",
      badges: "amazon",
      tags: "design,oop,greedy",
      frequency: 45,
      description: `Design a **single-station package locker** system.
- **Stage 1:** Assign a locker to a package (smallest available locker that fits).
- **Stage 2:** Pickup with a code — verify the code and release the locker.
- **Stage 3:** Handle capacity — return \`None\` when no suitable locker is available.`,
      starterCode: `class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size  # 'S', 'M', or 'L'
        self.package_id = None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
    def assign(self, package_id: str, required_size: str) -> str | None:
        pass
    def pickup(self, package_id: str, code: str) -> bool:
        pass`,
      methodName: "LockerStation",
    },
    [
      {
        stageNumber: 1,
        title: "Assign a Locker",
        description: `Implement \`assign(package_id, required_size)\`:
- Find the **smallest available** locker with size >= \`required_size\`.
- Mark it occupied and return a random 4-digit pickup code.
- Return \`None\` if no suitable locker is free.
\`\`\`python
lockers = [Locker("L1","S"), Locker("L2","M"), Locker("L3","L")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")   # assigns L1, returns e.g. "4821"
assert code is not None
\`\`\``,
        baseClass: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        pass
    def pickup(self, package_id: str, code: str) -> bool:
        pass`,
        starterCode: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        # TODO: pick smallest fitting locker, mark occupied, store code, return code
        pass
    def pickup(self, package_id: str, code: str) -> bool:
        pass`,
        solution: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        pass`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import Locker, LockerStation
lockers = [Locker("L1","S"), Locker("L2","M"), Locker("L3","L")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
assert code is not None and len(code) == 4
assert not lockers[0].is_available()
code2 = s.assign("PKG2", "M")
assert code2 is not None
print("Stage 1 tests passed")`,
      },
      {
        stageNumber: 2,
        title: "Pickup with Code Verification",
        description: `Implement \`pickup(package_id, code)\`:
- Return \`True\` if the code matches and release the locker.
- Return \`False\` for wrong code or unknown package.
\`\`\`python
code = s.assign("PKG1", "S")
s.pickup("PKG1", "0000")   # → False (wrong code)
s.pickup("PKG1", code)     # → True  (correct)
s.pickup("PKG1", code)     # → False (already picked up)
\`\`\``,
        baseClass: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        pass`,
        starterCode: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        # TODO: verify code, release locker, remove from _codes
        pass`,
        solution: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        del self._codes[package_id]
        return True`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import Locker, LockerStation
lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
assert s.pickup("PKG1", "0000") == False
assert s.pickup("PKG1", code) == True
assert s.pickup("PKG1", code) == False  # already picked up
assert lockers[0].is_available()
print("Stage 2 tests passed")`,
      },
      {
        stageNumber: 3,
        title: "Capacity and Reuse",
        description: `Verify that:
- After pickup, the locker becomes available for new packages.
- When all lockers are full, \`assign\` returns \`None\`.
\`\`\`python
lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
c1 = s.assign("PKG1", "S")
c2 = s.assign("PKG2", "M")
s.assign("PKG3", "S")     # → None (no S or M free)
s.pickup("PKG1", c1)
s.assign("PKG3", "S")     # → code (L1 is free again)
\`\`\``,
        baseClass: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        del self._codes[package_id]
        return True`,
        starterCode: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        del self._codes[package_id]
        return True`,
        solution: `import random
class Locker:
    def __init__(self, locker_id: str, size: str):
        self.locker_id = locker_id
        self.size = size
        self.package_id = None
    def is_available(self) -> bool:
        return self.package_id is None
class LockerStation:
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        del self._codes[package_id]
        return True`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import Locker, LockerStation
lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
c1 = s.assign("PKG1", "S")
c2 = s.assign("PKG2", "M")
assert s.assign("PKG3", "S") is None
s.pickup("PKG1", c1)
c3 = s.assign("PKG3", "S")
assert c3 is not None
print("Stage 3 tests passed")`,
      },
    ]
  );

  // ── Problem 4: Find Two-Word Compound Words ────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20018,
      slug: "amazon-compound-words",
      title: "Find Two-Word Compound Words",
      difficulty: "Hard",
      badges: "amazon",
      tags: "string,hash-set,trie",
      frequency: 17,
      description: `Given a list of unique lowercase words, return every word that can be formed by **concatenating exactly two other words** in the list.
- **Stage 1:** Brute-force O(n²·L) — for each word, try all split points.
- **Stage 2:** Trie-accelerated — build a trie to speed up prefix lookups.
- **Stage 3:** Edge cases — single-character words, words that are prefixes of others.`,
      starterCode: `def find_compound_words(words: list) -> list:
    pass`,
      methodName: "find_compound_words",
    },
    [
      {
        stageNumber: 1,
        title: "Brute-Force Split",
        description: `For each word, try every split point \`i\` (1 ≤ i < len(word)). If both halves exist in the word set, it is a compound word.
\`\`\`python
find_compound_words(["cat","dog","catdog","fish"])  # → ["catdog"]
find_compound_words(["a","b","ab","ba"])            # → ["ab","ba"]
\`\`\``,
        baseClass: `def find_compound_words(words: list) -> list:
    pass`,
        starterCode: `def find_compound_words(words: list) -> list:
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        for i in range(1, n):
            # TODO: check if word[:i] and word[i:] are both in word_set
            pass
    return sorted(result)`,
        solution: `def find_compound_words(words: list) -> list:
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        for i in range(1, n):
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break
    return sorted(result)`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import find_compound_words
assert find_compound_words(["cat","dog","catdog","fish"]) == ["catdog"]
assert find_compound_words(["a","b","ab","ba"]) == ["ab","ba"]
assert find_compound_words(["hello","world","helloworld"]) == ["helloworld"]
assert find_compound_words(["x"]) == []
print("Stage 1 tests passed")`,
      },
      {
        stageNumber: 2,
        title: "Trie-Accelerated Lookup",
        description: `Build a **Trie** from the word list. For each word, walk the trie character by character; whenever you reach a word-end node, check if the remaining suffix also exists in the trie.
\`\`\`python
find_compound_words(["cat","cats","dog","catdog","dogcat"])
# → ["catdog","dogcat"]
\`\`\``,
        baseClass: `def find_compound_words(words: list) -> list:
    pass`,
        starterCode: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
def find_compound_words(words: list) -> list:
    root = TrieNode()
    # TODO: build trie
    word_set = set(words)
    result = []
    for word in words:
        node = root
        for i, ch in enumerate(word):
            if ch not in node.children:
                break
            node = node.children[ch]
            if node.is_end and i + 1 < len(word):
                # TODO: check if word[i+1:] is in word_set
                pass
    return sorted(result)`,
        solution: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
def find_compound_words(words: list) -> list:
    root = TrieNode()
    for w in words:
        node = root
        for ch in w:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True
    word_set = set(words)
    result = []
    for word in words:
        node = root
        for i, ch in enumerate(word):
            if ch not in node.children:
                break
            node = node.children[ch]
            if node.is_end and word[i+1:] in word_set and i + 1 < len(word):
                result.append(word)
                break
    return sorted(result)`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import find_compound_words
assert find_compound_words(["cat","cats","dog","catdog","dogcat","fish"]) == ["catdog","dogcat"]
assert find_compound_words(["a","b","ab","ba","abc"]) == ["ab","ba"]
print("Stage 2 tests passed")`,
      },
      {
        stageNumber: 3,
        title: "Edge Cases",
        description: `Handle tricky inputs:
- Single-character words: \`["a","b","ab"]\` → \`["ab"]\`
- Words that are prefixes: \`["x","y","z","xy","yz","xyz"]\` → \`["xy","xyz","yz"]\`
- Empty list: \`[]\` → \`[]\`
\`\`\`python
find_compound_words(["x","y","z","xy","yz","xyz"])
# → ["xy","xyz","yz"]
\`\`\``,
        baseClass: `def find_compound_words(words: list) -> list:
    pass`,
        starterCode: `def find_compound_words(words: list) -> list:
    if not words:
        return []
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        for i in range(1, n):
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break
    return sorted(result)`,
        solution: `def find_compound_words(words: list) -> list:
    if not words:
        return []
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        for i in range(1, n):
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break
    return sorted(result)`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import find_compound_words
assert find_compound_words([]) == []
assert find_compound_words(["a","b","ab"]) == ["ab"]
assert find_compound_words(["x","y","z","xy","yz","xyz"]) == ["xy","xyz","yz"]
assert find_compound_words(["only"]) == []
print("Stage 3 tests passed")`,
      },
    ]
  );

  // ── Problem 5: Maximum-Sum Window in a Sparse Array ───────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 20019,
      slug: "amazon-max-sum-sparse-window",
      title: "Find a Maximum-Sum Window in a Sparse Array",
      difficulty: "Hard",
      badges: "amazon",
      tags: "sliding-window,array,binary-search",
      frequency: 12,
      description: `Given an integer array \`nums\` (mostly zeros) and a window size \`k\`, find the **maximum sum** of any contiguous subarray of length exactly \`k\`.
- **Stage 1:** Sliding window O(n) — maintain a running window sum.
- **Stage 2:** Return the starting index of the best window (ties: leftmost).
- **Stage 3:** Variable window — find the maximum sum subarray of length between \`lo\` and \`hi\` (inclusive).`,
      starterCode: `def max_sum_sparse_window(nums: list, k: int) -> int:
    pass`,
      methodName: "max_sum_sparse_window",
    },
    [
      {
        stageNumber: 1,
        title: "Sliding Window Sum",
        description: `Use a sliding window of size \`k\` to compute the maximum subarray sum in O(n).
\`\`\`python
max_sum_sparse_window([0,0,5,0,0,3,0,0,2,0], 3)  # → 5
max_sum_sparse_window([5,1,2,3,4], 2)              # → 7
max_sum_sparse_window([0,0,0,0,0], 2)              # → 0
\`\`\``,
        baseClass: `def max_sum_sparse_window(nums: list, k: int) -> int:
    pass`,
        starterCode: `def max_sum_sparse_window(nums: list, k: int) -> int:
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        # TODO: slide the window and update max_sum
        pass
    return max_sum`,
        solution: `def max_sum_sparse_window(nums: list, k: int) -> int:
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import max_sum_sparse_window
assert max_sum_sparse_window([0,0,5,0,0,3,0,0,2,0], 3) == 5
assert max_sum_sparse_window([5,1,2,3,4], 2) == 7
assert max_sum_sparse_window([0,0,0,0,0], 2) == 0
assert max_sum_sparse_window([10], 1) == 10
print("Stage 1 tests passed")`,
      },
      {
        stageNumber: 2,
        title: "Return Starting Index",
        description: `Extend to return a tuple \`(max_sum, start_index)\` — the starting index of the leftmost window with the maximum sum.
\`\`\`python
max_sum_sparse_window([0,0,5,0,0,3,0,0,2,0], 3)  # → (5, 2)
max_sum_sparse_window([5,1,2,3,4], 2)              # → (7, 3)
\`\`\``,
        baseClass: `def max_sum_sparse_window(nums: list, k: int):
    pass`,
        starterCode: `def max_sum_sparse_window(nums: list, k: int):
    if not nums or k <= 0 or k > len(nums):
        return (0, 0)
    window_sum = sum(nums[:k])
    max_sum = window_sum
    best_start = 0
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
            # TODO: update best_start
            pass
    return (max_sum, best_start)`,
        solution: `def max_sum_sparse_window(nums: list, k: int):
    if not nums or k <= 0 or k > len(nums):
        return (0, 0)
    window_sum = sum(nums[:k])
    max_sum = window_sum
    best_start = 0
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
            best_start = i - k + 1
    return (max_sum, best_start)`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import max_sum_sparse_window
assert max_sum_sparse_window([0,0,5,0,0,3,0,0,2,0], 3) == (5, 2)
assert max_sum_sparse_window([5,1,2,3,4], 2) == (7, 3)
assert max_sum_sparse_window([0,0,0], 2) == (0, 0)
print("Stage 2 tests passed")`,
      },
      {
        stageNumber: 3,
        title: "Variable Window Size",
        description: `Generalize to find the maximum sum subarray with length between \`lo\` and \`hi\` (inclusive).
\`\`\`python
max_sum_variable([0,0,5,0,3,0,2,0], lo=2, hi=4)  # → 8  (window [5,0,3])
max_sum_variable([1,2,3,4,5], lo=1, hi=3)         # → 12 (window [3,4,5])
\`\`\``,
        baseClass: `def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    pass`,
        starterCode: `def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    if not nums:
        return 0
    best = float('-inf')
    for k in range(lo, hi + 1):
        if k > len(nums):
            break
        # TODO: run sliding window for this k and update best
        pass
    return best if best != float('-inf') else 0`,
        solution: `def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    if not nums:
        return 0
    best = float('-inf')
    for k in range(lo, min(hi, len(nums)) + 1):
        window = sum(nums[:k])
        best = max(best, window)
        for i in range(k, len(nums)):
            window += nums[i] - nums[i - k]
            best = max(best, window)
    return best if best != float('-inf') else 0`,
        testCases: [],

        testFileContent: `import sys
sys.path.insert(0, '.')
from solution import max_sum_variable
assert max_sum_variable([0,0,5,0,3,0,2,0], 2, 4) == 8
assert max_sum_variable([1,2,3,4,5], 1, 3) == 12
assert max_sum_variable([], 1, 3) == 0
assert max_sum_variable([5], 1, 5) == 5
print("Stage 3 tests passed")`,
      },
    ]
  );
}
