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
        # topic -> ordered list of subscriber ids
        self._subs = defaultdict(list)
        # subscriber id -> messages not yet read
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        # Guard against double-subscribing: a repeat call must not cause
        # the subscriber to receive each message twice.
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        # Fan out to everyone currently subscribed to this topic.
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        # Copy before clearing so the caller cannot mutate our internal list.
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        solutionExplanation: `Two dictionaries keep the design simple: topic -> subscriber list, and subscriber -> pending inbox. \`publish\` is O(number of subscribers on that topic) and \`get_messages\` returns a copy before clearing, so the caller cannot mutate internal state. The membership check in \`subscribe\` makes repeat subscriptions idempotent.`,
        testCases: [
          {
            description: `publish returns the recipient count`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("sports", "bob")
_result = ps.publish("sports", "goal!")`,
            expectedOutput: `2`,
            orderIndex: 0,
          },
          {
            description: `subscriber receives the published message`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.publish("sports", "goal!")
_result = ps.get_messages("alice")`,
            expectedOutput: `['goal!']`,
            orderIndex: 1,
          },
          {
            description: `get_messages drains the inbox`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.publish("sports", "goal!")
ps.get_messages("alice")
_result = ps.get_messages("alice")`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
          {
            description: `publishing to a topic with no subscribers delivers to nobody`,
            inputData: `ps = PubSub()
_result = ps.publish("empty", "hello")`,
            expectedOutput: `0`,
            orderIndex: 3,
          },
          {
            description: `subscribing twice does not double-deliver`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("sports", "alice")
_result = (ps.publish("sports", "goal!"), ps.get_messages("alice"))`,
            expectedOutput: `(1, ['goal!'])`,
            orderIndex: 4,
          },
        ],

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
        self._subs = defaultdict(list)   # topic -> subscriber ids
        self._inbox = defaultdict(list)  # subscriber id -> unread messages
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
        # Membership check keeps this idempotent — list.remove would raise
        # ValueError for a subscriber that was never registered.
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)
        # Note: the inbox is deliberately left alone, so messages already
        # delivered stay readable after unsubscribing.`,
        solutionExplanation: `\`unsubscribe\` only removes the topic subscription — it deliberately leaves the inbox alone, so messages already delivered remain readable. Guarding the \`remove\` with a membership test keeps the call idempotent instead of raising ValueError on an unknown subscriber.`,
        testCases: [
          {
            description: `unsubscribe lowers the recipient count`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("sports", "bob")
ps.unsubscribe("sports", "bob")
_result = ps.publish("sports", "final score")`,
            expectedOutput: `1`,
            orderIndex: 0,
          },
          {
            description: `unsubscribed subscriber receives nothing new`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "bob")
ps.unsubscribe("sports", "bob")
ps.publish("sports", "final score")
_result = ps.get_messages("bob")`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: `unsubscribing someone who never subscribed is a no-op`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.unsubscribe("sports", "carol")
_result = ps.publish("sports", "goal!")`,
            expectedOutput: `1`,
            orderIndex: 2,
          },
          {
            description: `messages delivered before unsubscribing are still readable`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "bob")
ps.publish("sports", "first")
ps.unsubscribe("sports", "bob")
_result = ps.get_messages("bob")`,
            expectedOutput: `['first']`,
            orderIndex: 3,
          },
        ],

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
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        pass
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
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
        # Subscriptions are keyed per topic but inboxes are keyed per
        # subscriber. That split is what lets one subscriber follow many
        # topics and still read one publish-ordered stream.
        self._subs = defaultdict(list)
        self._inbox = defaultdict(list)
    def subscribe(self, topic: str, subscriber_id: str) -> None:
        if subscriber_id not in self._subs[topic]:
            self._subs[topic].append(subscriber_id)
    def unsubscribe(self, topic: str, subscriber_id: str) -> None:
        # Only this topic's subscription is dropped; the others survive.
        if subscriber_id in self._subs[topic]:
            self._subs[topic].remove(subscriber_id)
    def publish(self, topic: str, message: str) -> int:
        # Topics are isolated: only this topic's list is ever consulted.
        recipients = self._subs[topic]
        for sub in recipients:
            self._inbox[sub].append(message)
        return len(recipients)
    def get_messages(self, subscriber_id: str) -> list:
        msgs = self._inbox[subscriber_id][:]
        self._inbox[subscriber_id].clear()
        return msgs`,
        solutionExplanation: `No new methods are needed here — this stage confirms the data model holds up under fan-out. Because subscriptions are keyed per topic but inboxes are keyed per subscriber, one subscriber following N topics accumulates messages in a single inbox in publish order, while topics stay fully isolated from each other.`,
        testCases: [
          {
            description: `a subscriber following two topics receives both messages`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("tech", "alice")
ps.publish("sports", "goal")
ps.publish("tech", "new release")
_result = ps.get_messages("alice")`,
            expectedOutput: `['goal', 'new release']`,
            orderIndex: 0,
          },
          {
            description: `publishing to one topic does not reach another topic's subscribers`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("tech", "bob")
ps.publish("tech", "new release")
_result = ps.get_messages("alice")`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: `each publish counts only that topic's subscribers`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("tech", "alice")
ps.subscribe("tech", "bob")
_result = (ps.publish("sports", "goal"), ps.publish("tech", "release"))`,
            expectedOutput: `(1, 2)`,
            orderIndex: 2,
          },
          {
            description: `unsubscribing from one topic leaves the other intact`,
            inputData: `ps = PubSub()
ps.subscribe("sports", "alice")
ps.subscribe("tech", "alice")
ps.unsubscribe("sports", "alice")
ps.publish("sports", "goal")
ps.publish("tech", "release")
_result = ps.get_messages("alice")`,
            expectedOutput: `['release']`,
            orderIndex: 3,
          },
        ],

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
    # Without memoisation this recursion is exponential: the same (i, j)
    # prefix pair is reached along many different edit paths. The cache
    # collapses it to one entry per pair, i.e. O(len(s) * len(t)) work.
    @lru_cache(maxsize=None)
    def dp(i, j):
        # Empty prefix: the only option is to insert/delete the rest.
        if i == 0: return j
        if j == 0: return i
        # Characters match, so no edit is charged at this position.
        if s[i-1] == t[j-1]:
            return dp(i-1, j-1)
        # Otherwise pay 1 and take the cheapest of delete / insert / replace.
        return 1 + min(dp(i-1, j), dp(i, j-1), dp(i-1, j-1))
    return dp(len(s), len(t))`,
        solutionExplanation: `Top-down recursion explores the same (i, j) pairs many times, so \`lru_cache\` is what turns an exponential search into O(m*n) work — one entry per prefix pair. The two base cases (an empty prefix costs the length of the other) anchor the recursion, and matching characters recurse without paying an edit.`,
        testCases: [
          {
            description: `classic kitten -> sitting`,
            inputData: `_result = edit_distance("kitten", "sitting")`,
            expectedOutput: `3`,
            orderIndex: 0,
          },
          {
            description: `empty source needs one insert per character`,
            inputData: `_result = edit_distance("", "abc")`,
            expectedOutput: `3`,
            orderIndex: 1,
          },
          {
            description: `identical strings need no edits`,
            inputData: `_result = edit_distance("abc", "abc")`,
            expectedOutput: `0`,
            orderIndex: 2,
          },
          {
            description: `empty target needs one delete per character`,
            inputData: `_result = edit_distance("abc", "")`,
            expectedOutput: `3`,
            orderIndex: 3,
          },
          {
            description: `single substitution`,
            inputData: `_result = edit_distance("a", "b")`,
            expectedOutput: `1`,
            orderIndex: 4,
          },
        ],

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
    # Base row/column: turning a prefix into the empty string costs one
    # delete per character, and vice versa one insert per character.
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                # Characters agree: inherit the diagonal, no edit charged.
                dp[i][j] = dp[i-1][j-1]
            else:
                # delete (up), insert (left), replace (diagonal) — all cost 1.
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]`,
        solutionExplanation: `The bottom-up table fills the same values as the memoized recursion but in a fixed order, so there is no recursion depth limit to worry about on long inputs. Row 0 and column 0 are seeded with the pure-insert and pure-delete costs; every other cell is 1 + min(left, up, diagonal), or the diagonal unchanged when the characters match.`,
        testCases: [
          {
            description: `intention -> execution`,
            inputData: `_result = edit_distance("intention", "execution")`,
            expectedOutput: `5`,
            orderIndex: 0,
          },
          {
            description: `horse -> ros`,
            inputData: `_result = edit_distance("horse", "ros")`,
            expectedOutput: `3`,
            orderIndex: 1,
          },
          {
            description: `both empty`,
            inputData: `_result = edit_distance("", "")`,
            expectedOutput: `0`,
            orderIndex: 2,
          },
          {
            description: `prefix extension costs one insert`,
            inputData: `_result = edit_distance("ab", "abc")`,
            expectedOutput: `1`,
            orderIndex: 3,
          },
        ],

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
    # Swap so the row we keep is the shorter side: space is O(min(m, n)).
    if m < n:
        s, t = t, s
        m, n = n, m
    # dp is a single row; initially the cost against the empty prefix.
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        # prev carries the diagonal value (row i-1, col j-1), which the
        # in-place update is about to overwrite.
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            temp = dp[j]  # save row i-1 value before overwriting it
            if s[i-1] == t[j-1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j], dp[j-1])
            prev = temp
    return dp[n]`,
        solutionExplanation: `Only the previous row is ever read when filling the current one, so the full table is unnecessary — keeping a single row cuts space from O(m*n) to O(min(m,n)). The subtlety is the diagonal value: it is overwritten as the row advances, so it must be saved in a \`prev\` variable before each cell is updated.`,
        testCases: [
          {
            description: `same answer as earlier stages`,
            inputData: `_result = edit_distance("kitten", "sitting")`,
            expectedOutput: `3`,
            orderIndex: 0,
          },
          {
            description: `longer pair still correct`,
            inputData: `_result = edit_distance("intention", "execution")`,
            expectedOutput: `5`,
            orderIndex: 1,
          },
          {
            description: `empty against non-empty`,
            inputData: `_result = edit_distance("", "abcd")`,
            expectedOutput: `4`,
            orderIndex: 2,
          },
          {
            description: `no shared characters`,
            inputData: `_result = edit_distance("abc", "xyz")`,
            expectedOutput: `3`,
            orderIndex: 3,
          },
        ],

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
        # Occupancy is derived from package_id rather than a separate flag,
        # so there is no second field that can drift out of sync.
        return self.package_id is None
class LockerStation:
    # Ordinal ranking lets sizes be compared with >= and min().
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        # package id -> (locker id, pickup code)
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        # A locker qualifies if it is free AND at least the required size.
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        # Best fit, not first fit: taking the smallest adequate locker keeps
        # the large ones free for packages that actually need them.
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        # Implemented in Stage 2.
        pass`,
        solutionExplanation: `Choosing the smallest locker that still fits (\`min\` over the candidates by size rank) is what keeps large lockers free for large packages — a plain first-fit would strand them. The generated code is random, so tests assert its shape and round-trip it through \`pickup\` rather than comparing against a fixed value.`,
        testCases: [
          {
            description: `assigns the smallest locker that fits`,
            inputData: `lockers = [Locker("L1","S"), Locker("L2","M"), Locker("L3","L")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
_result = (code is not None, lockers[0].package_id, lockers[1].package_id)`,
            expectedOutput: `(True, 'PKG1', None)`,
            orderIndex: 0,
          },
          {
            description: `falls back to a larger locker when the exact size is taken`,
            inputData: `lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
s.assign("PKG1", "S")
s.assign("PKG2", "S")
_result = (lockers[0].package_id, lockers[1].package_id)`,
            expectedOutput: `('PKG1', 'PKG2')`,
            orderIndex: 1,
          },
          {
            description: `returns None when no locker is large enough`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
_result = s.assign("PKG1", "L")`,
            expectedOutput: `None`,
            orderIndex: 2,
          },
          {
            description: `returns None when every locker is occupied`,
            inputData: `lockers = [Locker("L1","M")]
s = LockerStation(lockers)
s.assign("PKG1", "S")
_result = s.assign("PKG2", "S")`,
            expectedOutput: `None`,
            orderIndex: 3,
          },
          {
            description: `pickup code is a 4-digit string`,
            inputData: `lockers = [Locker("L1","M")]
s = LockerStation(lockers)
code = s.assign("PKG1", "M")
_result = (len(code) == 4, code.isdigit())`,
            expectedOutput: `(True, True)`,
            orderIndex: 4,
          },
        ],

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
        # Occupancy is derived from package_id rather than a separate flag,
        # so there is no second field that can drift out of sync.
        return self.package_id is None
class LockerStation:
    # Ordinal ranking lets sizes be compared with >= and min().
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        # package id -> (locker id, pickup code)
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        # A locker qualifies if it is free AND at least the required size.
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        # Best fit, not first fit: taking the smallest adequate locker keeps
        # the large ones free for packages that actually need them.
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        # Three independent checks, each failing closed so a wrong guess
        # can never release someone else's locker.
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        # Dropping the code entry is what makes pickup single-use: a replay
        # now falls into the unknown-package branch above.
        del self._codes[package_id]
        return True`,
        solutionExplanation: `Pickup is a three-step check — package known, code matches, then release — and each failure returns False without touching state, so a wrong guess cannot free someone else's locker. Deleting the code entry after a successful pickup is what makes the operation single-use: replaying the same code afterwards falls through the unknown-package branch.`,
        testCases: [
          {
            description: `wrong code is rejected`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
wrong = "0000" if code != "0000" else "1111"
_result = s.pickup("PKG1", wrong)`,
            expectedOutput: `False`,
            orderIndex: 0,
          },
          {
            description: `correct code opens the locker and frees it`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
_result = (s.pickup("PKG1", code), lockers[0].package_id)`,
            expectedOutput: `(True, None)`,
            orderIndex: 1,
          },
          {
            description: `a second pickup with the same code fails`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
s.pickup("PKG1", code)
_result = s.pickup("PKG1", code)`,
            expectedOutput: `False`,
            orderIndex: 2,
          },
          {
            description: `unknown package is rejected`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
_result = s.pickup("NOPE", "1234")`,
            expectedOutput: `False`,
            orderIndex: 3,
          },
          {
            description: `a failed pickup does not release the locker`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
code = s.assign("PKG1", "S")
wrong = "0000" if code != "0000" else "1111"
s.pickup("PKG1", wrong)
_result = lockers[0].package_id`,
            expectedOutput: `'PKG1'`,
            orderIndex: 4,
          },
        ],

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
        pass
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
        # Occupancy is derived from package_id rather than a separate flag,
        # so there is no second field that can drift out of sync.
        return self.package_id is None
class LockerStation:
    # Ordinal ranking lets sizes be compared with >= and min().
    SIZE_ORDER = {'S': 0, 'M': 1, 'L': 2}
    def __init__(self, lockers: list):
        self.lockers = lockers
        # package id -> (locker id, pickup code)
        self._codes = {}
    def assign(self, package_id: str, required_size: str) -> str | None:
        req = self.SIZE_ORDER[required_size]
        # A locker qualifies if it is free AND at least the required size.
        candidates = [l for l in self.lockers
                      if l.is_available() and self.SIZE_ORDER[l.size] >= req]
        if not candidates:
            return None
        # Best fit, not first fit: taking the smallest adequate locker keeps
        # the large ones free for packages that actually need them.
        best = min(candidates, key=lambda l: self.SIZE_ORDER[l.size])
        best.package_id = package_id
        code = str(random.randint(1000, 9999))
        self._codes[package_id] = (best.locker_id, code)
        return code
    def pickup(self, package_id: str, code: str) -> bool:
        # Three independent checks, each failing closed so a wrong guess
        # can never release someone else's locker.
        if package_id not in self._codes:
            return False
        locker_id, stored = self._codes[package_id]
        if stored != code:
            return False
        for l in self.lockers:
            if l.locker_id == locker_id:
                l.package_id = None
                break
        # Dropping the code entry is what makes pickup single-use: a replay
        # now falls into the unknown-package branch above.
        del self._codes[package_id]
        return True`,
        solutionExplanation: `Availability is derived from \`package_id is None\` rather than a separate free-list, so releasing a locker in \`pickup\` is all that reuse requires — there is no second structure that can fall out of sync. The capacity limit then falls out naturally: when no candidate passes the availability and size filters, \`assign\` returns None.`,
        testCases: [
          {
            description: `a locker is reusable after pickup`,
            inputData: `lockers = [Locker("L1","S")]
s = LockerStation(lockers)
c1 = s.assign("PKG1", "S")
s.pickup("PKG1", c1)
c2 = s.assign("PKG2", "S")
_result = (c2 is not None, lockers[0].package_id)`,
            expectedOutput: `(True, 'PKG2')`,
            orderIndex: 0,
          },
          {
            description: `assign returns None once the station is full`,
            inputData: `lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
s.assign("PKG1", "S")
s.assign("PKG2", "S")
_result = s.assign("PKG3", "S")`,
            expectedOutput: `None`,
            orderIndex: 1,
          },
          {
            description: `freeing one locker allows exactly one more assignment`,
            inputData: `lockers = [Locker("L1","S"), Locker("L2","M")]
s = LockerStation(lockers)
c1 = s.assign("PKG1", "S")
s.assign("PKG2", "S")
s.pickup("PKG1", c1)
_result = (s.assign("PKG3", "S") is not None, s.assign("PKG4", "S"))`,
            expectedOutput: `(True, None)`,
            orderIndex: 2,
          },
          {
            description: `a large package cannot take a freed small locker`,
            inputData: `lockers = [Locker("L1","S"), Locker("L2","L")]
s = LockerStation(lockers)
c = s.assign("PKG1", "L")
s.pickup("PKG1", c)
_result = (s.assign("PKG2", "L") is not None, s.assign("PKG3", "L"))`,
            expectedOutput: `(True, None)`,
            orderIndex: 3,
          },
        ],

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
    # Set membership makes each half-lookup O(1) instead of a list scan.
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        # Split points run 1..n-1, so both halves are guaranteed non-empty
        # and the word can never match itself with an empty remainder.
        for i in range(1, n):
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break  # one valid split is enough; stop before duplicating
    return sorted(result)`,
        solutionExplanation: `Putting the words in a set turns each half-lookup into O(1), so the cost is one pass over every split point of every word: O(n * L) lookups for words of length L. The \`break\` after a match matters — without it a word with several valid splits would be reported more than once.`,
        testCases: [
          {
            description: `one compound word`,
            inputData: `_result = find_compound_words(["cat","dog","catdog","fish"])`,
            expectedOutput: `['catdog']`,
            orderIndex: 0,
          },
          {
            description: `both orderings count`,
            inputData: `_result = find_compound_words(["a","b","ab","ba"])`,
            expectedOutput: `['ab', 'ba']`,
            orderIndex: 1,
          },
          {
            description: `no compounds`,
            inputData: `_result = find_compound_words(["cat","dog"])`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
          {
            description: `a word cannot be built from parts that are absent`,
            inputData: `_result = find_compound_words(["catdog"])`,
            expectedOutput: `[]`,
            orderIndex: 3,
          },
        ],

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
    # Build a trie of the dictionary so prefixes can be tested by walking
    # one character at a time instead of slicing at every split point.
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
            # Fell off the trie: no dictionary word starts this way.
            if ch not in node.children:
                break
            node = node.children[ch]
            # is_end means word[:i+1] is a real word, so it is a candidate
            # first half. The i + 1 < len(word) guard forces a non-empty
            # second half, i.e. exactly two parts rather than the word itself.
            if node.is_end and word[i+1:] in word_set and i + 1 < len(word):
                result.append(word)
                break
    return sorted(result)`,
        solutionExplanation: `The trie replaces the scan over split points with a single walk down the word: each prefix that ends at a word-end node is a candidate first half, so only real prefixes are ever tested. The \`i + 1 < len(word)\` guard is what enforces *two* parts — without it a word would match itself as its own prefix with an empty suffix.`,
        testCases: [
          {
            description: `trie finds both compounds`,
            inputData: `_result = find_compound_words(["cat","cats","dog","catdog","dogcat"])`,
            expectedOutput: `['catdog', 'dogcat']`,
            orderIndex: 0,
          },
          {
            description: `repeated letters`,
            inputData: `_result = find_compound_words(["a","aa","aaa"])`,
            expectedOutput: `['aa', 'aaa']`,
            orderIndex: 1,
          },
          {
            description: `two-part concatenation`,
            inputData: `_result = find_compound_words(["ab","cd","abcd"])`,
            expectedOutput: `['abcd']`,
            orderIndex: 2,
          },
          {
            description: `no valid split`,
            inputData: `_result = find_compound_words(["ab","cd","abx"])`,
            expectedOutput: `[]`,
            orderIndex: 3,
          },
        ],

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
    # Explicit empty-input guard: nothing to split, and it keeps callers
    # that precompute a max word length from calling max() on an empty list.
    if not words:
        return []
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        for i in range(1, n):
            # A part may itself be a compound ('xyz' = 'xy' + 'z' counts):
            # the rule constrains the split, not how the parts were formed.
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break
    return sorted(result)`,
        solution: `def find_compound_words(words: list) -> list:
    # Explicit empty guard: nothing can be split, and it keeps variants that
    # precompute a maximum length from calling max() on an empty sequence.
    if not words:
        return []
    word_set = set(words)
    result = []
    for word in words:
        n = len(word)
        # Split points 1..n-1 guarantee two non-empty halves, so a word can
        # never match itself against an empty remainder.
        for i in range(1, n):
            # A half may itself be a compound: 'xyz' counts via 'xy' + 'z'.
            # The rule constrains the split, not how the parts were built.
            if word[:i] in word_set and word[i:] in word_set:
                result.append(word)
                break
    return sorted(result)`,
        solutionExplanation: `The edge cases are all about the definition of *exactly two* parts. 'xyz' qualifies because 'xy' + 'z' are both present, even though 'xy' is itself a compound — the rule is about the split, not about the parts being primitive. The empty-input guard avoids \`max()\` on an empty sequence in implementations that precompute a maximum length.`,
        testCases: [
          {
            description: `chained compounds`,
            inputData: `_result = find_compound_words(["x","y","z","xy","yz","xyz"])`,
            expectedOutput: `['xy', 'xyz', 'yz']`,
            orderIndex: 0,
          },
          {
            description: `empty input`,
            inputData: `_result = find_compound_words([])`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: `single-character parts`,
            inputData: `_result = find_compound_words(["a","b","ab"])`,
            expectedOutput: `['ab']`,
            orderIndex: 2,
          },
          {
            description: `prefix words that form nothing`,
            inputData: `_result = find_compound_words(["a","ab","abc"])`,
            expectedOutput: `[]`,
            orderIndex: 3,
          },
        ],

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
    # Reject window sizes that cannot fit inside the array.
    if not nums or k <= 0 or k > len(nums):
        return 0
    # Seed with the first window rather than 0, so an all-negative array
    # returns its largest (least negative) window instead of 0.
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        # Slide by one: add the entering element, drop the leaving one.
        # That keeps each step O(1) instead of re-summing k elements.
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum`,
        solutionExplanation: `Recomputing each window from scratch would be O(n*k); sliding it — add the element entering, subtract the one leaving — makes every step O(1) for O(n) overall with O(1) extra space. Seeding \`max_sum\` with the first window rather than 0 is what keeps the all-negative case correct.`,
        testCases: [
          {
            description: `sparse array with one dense window`,
            inputData: `_result = max_sum_sparse_window([0,0,5,0,0,3,0,0,2,0], 3)`,
            expectedOutput: `5`,
            orderIndex: 0,
          },
          {
            description: `window at the end`,
            inputData: `_result = max_sum_sparse_window([5,1,2,3,4], 2)`,
            expectedOutput: `7`,
            orderIndex: 1,
          },
          {
            description: `all zeros`,
            inputData: `_result = max_sum_sparse_window([0,0,0,0,0], 2)`,
            expectedOutput: `0`,
            orderIndex: 2,
          },
          {
            description: `single element`,
            inputData: `_result = max_sum_sparse_window([10], 1)`,
            expectedOutput: `10`,
            orderIndex: 3,
          },
          {
            description: `k larger than the array`,
            inputData: `_result = max_sum_sparse_window([1,2], 5)`,
            expectedOutput: `0`,
            orderIndex: 4,
          },
          {
            description: `negative values`,
            inputData: `_result = max_sum_sparse_window([-5,-2,-3], 1)`,
            expectedOutput: `-2`,
            orderIndex: 5,
          },
        ],

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
        description: `Add \`max_sum_window_with_index(nums, k)\` returning a tuple \`(max_sum, start_index)\` — the starting index of the **leftmost** window with the maximum sum.

Keep \`max_sum_sparse_window\` from Stage 1 working unchanged: later stages are tested cumulatively, so both functions must exist.
\`\`\`python
max_sum_window_with_index([1,2,9,1], 2)              # → (11, 1)
max_sum_window_with_index([5,1,2,3,4], 2)            # → (7, 3)
\`\`\``,
        baseClass: `def max_sum_sparse_window(nums: list, k: int) -> int:
    pass

def max_sum_window_with_index(nums: list, k: int):
    pass`,
        starterCode: `def max_sum_sparse_window(nums: list, k: int) -> int:
    # Carried over from Stage 1 — still tested here.
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum

def max_sum_window_with_index(nums: list, k: int):
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
        solution: `def max_sum_sparse_window(nums: list, k: int) -> int:
    # Carried over from Stage 1 unchanged — Stage 1's tests still run here.
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum

def max_sum_window_with_index(nums: list, k: int):
    if not nums or k <= 0 or k > len(nums):
        return (0, 0)
    window_sum = sum(nums[:k])
    max_sum = window_sum
    best_start = 0
    for i in range(k, len(nums)):
        # Slide: add the entering element, drop the leaving one — O(1) per step.
        window_sum += nums[i] - nums[i - k]
        # Strict > keeps the LEFTMOST maximum; >= would keep the rightmost.
        if window_sum > max_sum:
            max_sum = window_sum
            best_start = i - k + 1
    return (max_sum, best_start)`,
        solutionExplanation: `The window sum is maintained incrementally, so each of the n-k slides costs O(1) and the whole scan is O(n) time, O(1) space. Tracking \`best_start\` costs nothing extra — it is just recorded whenever a strictly larger sum is seen, which is what makes the result the leftmost maximum rather than the rightmost.`,
        testCases: [
          {
            description: `returns sum and start index`,
            inputData: `_result = max_sum_window_with_index([1,2,9,1], 2)`,
            expectedOutput: `(11, 1)`,
            orderIndex: 0,
          },
          {
            description: `best window at the end`,
            inputData: `_result = max_sum_window_with_index([5,1,2,3,4], 2)`,
            expectedOutput: `(7, 3)`,
            orderIndex: 1,
          },
          {
            description: `ties resolve to the leftmost window`,
            inputData: `_result = max_sum_window_with_index([3,1,2,1,3], 2)`,
            expectedOutput: `(4, 0)`,
            orderIndex: 2,
          },
          {
            description: `all negative`,
            inputData: `_result = max_sum_window_with_index([-5,-2,-3], 1)`,
            expectedOutput: `(-2, 1)`,
            orderIndex: 3,
          },
          {
            description: `stage 1 function still works`,
            inputData: `_result = max_sum_sparse_window([5,1,2,3,4], 2)`,
            expectedOutput: `7`,
            orderIndex: 4,
          },
        ],

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
        description: `Add \`max_sum_variable(nums, lo, hi)\` — the maximum sum over all subarrays whose length is between \`lo\` and \`hi\` (inclusive).

Both earlier functions must keep working; all three are tested together.
\`\`\`python
max_sum_variable([0,0,5,0,3,0,2,0], lo=2, hi=4)  # → 8  (window [5,0,3])
max_sum_variable([1,2,3,4,5], lo=1, hi=3)        # → 12 (window [3,4,5])
\`\`\``,
        baseClass: `def max_sum_sparse_window(nums: list, k: int) -> int:
    pass

def max_sum_window_with_index(nums: list, k: int):
    pass

def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    pass`,
        starterCode: `def max_sum_sparse_window(nums: list, k: int) -> int:
    # Carried over from Stage 1.
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum

def max_sum_window_with_index(nums: list, k: int):
    # Carried over from Stage 2.
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
    return (max_sum, best_start)

def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    if not nums:
        return 0
    best = float('-inf')
    for k in range(lo, hi + 1):
        if k > len(nums):
            break
        # TODO: run the sliding window for this k and update best
        pass
    return best if best != float('-inf') else 0`,
        solution: `def max_sum_sparse_window(nums: list, k: int) -> int:
    # Carried over from Stage 1 — still tested cumulatively.
    if not nums or k <= 0 or k > len(nums):
        return 0
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        if window_sum > max_sum:
            max_sum = window_sum
    return max_sum

def max_sum_window_with_index(nums: list, k: int):
    # Carried over from Stage 2 — still tested cumulatively.
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
    return (max_sum, best_start)

def max_sum_variable(nums: list, lo: int, hi: int) -> int:
    if not nums:
        return 0
    best = float('-inf')
    # Every allowed window length gets its own O(n) sliding pass.
    # Cap hi at len(nums): a window longer than the array has no sum.
    for k in range(lo, min(hi, len(nums)) + 1):
        window = sum(nums[:k])
        best = max(best, window)
        for i in range(k, len(nums)):
            window += nums[i] - nums[i - k]
            best = max(best, window)
    # best stays -inf only when the lo..hi range yielded no valid window.
    return best if best != float('-inf') else 0`,
        solutionExplanation: `Running one sliding window per allowed length gives O((hi-lo+1) * n) time and O(1) space. This beats the O(n^2) recompute-every-subarray approach because each length's pass reuses the running sum. Note the \`min(hi, len(nums))\` cap — without it, lengths longer than the array would produce sums over a partial window and corrupt the answer.`,
        testCases: [
          {
            description: `variable window picks the best length`,
            inputData: `_result = max_sum_variable([0,0,5,0,3,0,2,0], 2, 4)`,
            expectedOutput: `8`,
            orderIndex: 0,
          },
          {
            description: `longest allowed window wins`,
            inputData: `_result = max_sum_variable([1,2,3,4,5], 1, 3)`,
            expectedOutput: `12`,
            orderIndex: 1,
          },
          {
            description: `empty array`,
            inputData: `_result = max_sum_variable([], 1, 3)`,
            expectedOutput: `0`,
            orderIndex: 2,
          },
          {
            description: `hi larger than the array is capped`,
            inputData: `_result = max_sum_variable([5], 1, 5)`,
            expectedOutput: `5`,
            orderIndex: 3,
          },
          {
            description: `all negative prefers the shortest window`,
            inputData: `_result = max_sum_variable([-1,-2,-3], 1, 2)`,
            expectedOutput: `-1`,
            orderIndex: 4,
          },
          {
            description: `earlier stages still work`,
            inputData: `_result = (max_sum_sparse_window([5,1,2,3,4], 2), max_sum_window_with_index([5,1,2,3,4], 2))`,
            expectedOutput: `(7, (7, 3))`,
            orderIndex: 5,
          },
        ],

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
