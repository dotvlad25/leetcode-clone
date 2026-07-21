import { seedStagedProblemIfNotExists } from "./db";

// Batch 6: 5 More Google staged problems
export async function seedBatch6Problems(): Promise<void> {

  await seedStagedProblemIfNotExists(
    {
      number: 30006,
      slug: `min-deletions-avoid-overlap`,
      title: `Min Deletions to Avoid Overlap`,
      difficulty: `Medium`,
      badges: `google`,
      tags: `greedy,intervals,sorting`,
      frequency: 342,
      description: `Given a list of intervals \`[start, end]\`, return the **minimum number of intervals to remove** so that the remaining intervals are non-overlapping.

Two intervals overlap if one starts before the other ends (exclusive: \`[1,2]\` and \`[2,3]\` do NOT overlap).

- **Stage 1:** Return the minimum number of intervals to remove.
- **Stage 2:** Return the actual intervals to remove (not just the count).`,
      starterCode: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        pass`,
      methodName: `IntervalScheduler`,
    },
    [
      {
        stageNumber: 1,
        title: `Count Minimum Removals`,
        description: `Implement \`min_deletions(intervals)\` returning the minimum number of intervals to remove so the rest are non-overlapping.

\`\`\`python
s = IntervalScheduler()
s.min_deletions([[1,2],[2,3],[3,4],[1,3]])  # → 1
s.min_deletions([[1,2],[1,2],[1,2]])         # → 2
s.min_deletions([[1,2],[2,3]])               # → 0
\`\`\``,
        baseClass: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        pass`,
        starterCode: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 0
        last_end = float('-inf')
        for start, end in intervals:
            if start >= last_end:
                kept += 1
                last_end = end
        return len(intervals) - kept`,
        solution: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 0
        last_end = float('-inf')
        for start, end in intervals:
            if start >= last_end:
                kept += 1
                last_end = end
        return len(intervals) - kept`,
        solutionExplanation: `**Greedy interval scheduling**: sort by end time, greedily keep intervals that don't overlap with the last kept one. This maximizes the number of non-overlapping intervals, so removals = total - kept.

This is the classic "Activity Selection Problem".

**Time:** O(n log n). **Space:** O(1).`,
        testCases: [
          {
            description: `one removal`,
            inputData: `s = IntervalScheduler()
result = s.min_deletions([[1,2],[2,3],[3,4],[1,3]])`,
            expectedOutput: `1`,
            orderIndex: 0,
          },
          {
            description: `two removals`,
            inputData: `s = IntervalScheduler()
result = s.min_deletions([[1,2],[1,2],[1,2]])`,
            expectedOutput: `2`,
            orderIndex: 1,
          },
          {
            description: `no removal`,
            inputData: `s = IntervalScheduler()
result = s.min_deletions([[1,2],[2,3]])`,
            expectedOutput: `0`,
            orderIndex: 2,
          },
          {
            description: `empty`,
            inputData: `s = IntervalScheduler()
result = s.min_deletions([])`,
            expectedOutput: `0`,
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: `Return the Intervals to Remove`,
        description: `Add \`get_deletions(intervals)\` that returns the list of intervals to remove.

\`\`\`python
s = IntervalScheduler()
s.get_deletions([[1,2],[2,3],[3,4],[1,3]])  # → [[1,3]]
\`\`\``,
        baseClass: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 0
        last_end = float('-inf')
        for start, end in intervals:
            if start >= last_end:
                kept += 1
                last_end = end
        return len(intervals) - kept`,
        starterCode: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 0
        last_end = float('-inf')
        for start, end in intervals:
            if start >= last_end:
                kept += 1
                last_end = end
        return len(intervals) - kept

    def get_deletions(self, intervals: list[list[int]]) -> list[list[int]]:
        # Track which intervals are kept, return the rest
        pass`,
        solution: `class IntervalScheduler:
    def min_deletions(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        kept = 0
        last_end = float('-inf')
        for start, end in intervals:
            if start >= last_end:
                kept += 1
                last_end = end
        return len(intervals) - kept

    def get_deletions(self, intervals: list[list[int]]) -> list[list[int]]:
        sorted_ivs = sorted(intervals, key=lambda x: x[1])
        kept_indices = set()
        last_end = float('-inf')
        for i, (start, end) in enumerate(sorted_ivs):
            if start >= last_end:
                kept_indices.add(i)
                last_end = end
        return [iv for i, iv in enumerate(sorted_ivs) if i not in kept_indices]`,
        solutionExplanation: `Same greedy pass, but now we track which indices are kept. The deletions are all intervals NOT in the kept set.`,
        testCases: [
          {
            description: `one deletion`,
            inputData: `s = IntervalScheduler()
result = s.get_deletions([[1,2],[2,3],[3,4],[1,3]])`,
            expectedOutput: `[[1, 3]]`,
            orderIndex: 0,
          },
          {
            description: `count matches`,
            inputData: `s = IntervalScheduler()
result = len(s.get_deletions([[1,2],[1,2],[1,2]]))`,
            expectedOutput: `2`,
            orderIndex: 1,
          },
          {
            description: `no deletions`,
            inputData: `s = IntervalScheduler()
result = s.get_deletions([[1,2],[2,3]])`,
            expectedOutput: `[]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  await seedStagedProblemIfNotExists(
    {
      number: 30007,
      slug: `check-substrings-dictionary-words`,
      title: `Check if All Substrings Are Dictionary Words`,
      difficulty: `Medium`,
      badges: `google`,
      tags: `string,dp,trie`,
      frequency: 316,
      description: `Given a string \`s\` and a dictionary of words, determine if \`s\` can be **segmented** into a sequence of one or more dictionary words.

- **Stage 1:** Return True/False (Word Break — DP).
- **Stage 2:** Return all valid segmentations (Word Break II — backtracking).`,
      starterCode: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        pass`,
      methodName: `WordBreak`,
    },
    [
      {
        stageNumber: 1,
        title: `Word Break (DP)`,
        description: `Implement \`can_break(s, word_dict)\` returning True if s can be segmented into dictionary words.

\`\`\`python
wb = WordBreak()
wb.can_break('leetcode', ['leet','code'])  # → True
wb.can_break('catsandog', ['cats','dog','sand','and','cat'])  # → False
\`\`\``,
        baseClass: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        pass`,
        starterCode: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        words = set(word_dict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]`,
        solution: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        words = set(word_dict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]`,
        solutionExplanation: `**DP**: dp[i] = True if s[:i] can be segmented. For each position i, check all substrings s[j:i].

**Time:** O(n^2). **Space:** O(n). LeetCode 139.`,
        testCases: [
          {
            description: `leetcode`,
            inputData: `wb = WordBreak()
result = wb.can_break('leetcode', ['leet','code'])`,
            expectedOutput: `True`,
            orderIndex: 0,
          },
          {
            description: `applepenapple`,
            inputData: `wb = WordBreak()
result = wb.can_break('applepenapple', ['apple','pen'])`,
            expectedOutput: `True`,
            orderIndex: 1,
          },
          {
            description: `catsandog`,
            inputData: `wb = WordBreak()
result = wb.can_break('catsandog', ['cats','dog','sand','and','cat'])`,
            expectedOutput: `False`,
            orderIndex: 2,
          },
          {
            description: `single word`,
            inputData: `wb = WordBreak()
result = wb.can_break('hello', ['hello'])`,
            expectedOutput: `True`,
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: `Word Break II (All Segmentations)`,
        description: `Add \`all_breaks(s, word_dict)\` returning all valid segmentations as lists of words.

\`\`\`python
wb = WordBreak()
wb.all_breaks('catsanddog', ['cat','cats','and','sand','dog'])
# → [['cat','sand','dog'], ['cats','and','dog']]
\`\`\``,
        baseClass: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        words = set(word_dict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]`,
        starterCode: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        words = set(word_dict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]

    def all_breaks(self, s: str, word_dict: list[str]) -> list[list[str]]:
        words = set(word_dict)
        memo = {}
        def backtrack(start):
            if start in memo:
                return memo[start]
            if start == len(s):
                return [[]]
            result = []
            for end in range(start + 1, len(s) + 1):
                word = s[start:end]
                if word in words:
                    for rest in backtrack(end):
                        result.append([word] + rest)
            memo[start] = result
            return result
        return backtrack(0)`,
        solution: `class WordBreak:
    def can_break(self, s: str, word_dict: list[str]) -> bool:
        words = set(word_dict)
        n = len(s)
        dp = [False] * (n + 1)
        dp[0] = True
        for i in range(1, n + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[n]

    def all_breaks(self, s: str, word_dict: list[str]) -> list[list[str]]:
        words = set(word_dict)
        memo = {}
        def backtrack(start):
            if start in memo:
                return memo[start]
            if start == len(s):
                return [[]]
            result = []
            for end in range(start + 1, len(s) + 1):
                word = s[start:end]
                if word in words:
                    for rest in backtrack(end):
                        result.append([word] + rest)
            memo[start] = result
            return result
        return backtrack(0)`,
        solutionExplanation: `**Memoized backtracking**: backtrack(start) returns all valid segmentations of s[start:]. LeetCode 140.`,
        testCases: [
          {
            description: `two segmentations`,
            inputData: `wb = WordBreak()
result = sorted([sorted(r) for r in wb.all_breaks('catsanddog', ['cat','cats','and','sand','dog'])])`,
            expectedOutput: `[['and', 'cat', 'dog'], ['and', 'cats', 'dog']]`,
            orderIndex: 0,
          },
          {
            description: `no segmentation`,
            inputData: `wb = WordBreak()
result = wb.all_breaks('catsandog', ['cat','cats','and','sand','dog'])`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: `single word`,
            inputData: `wb = WordBreak()
result = wb.all_breaks('hello', ['hello'])`,
            expectedOutput: `[['hello']]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  await seedStagedProblemIfNotExists(
    {
      number: 30008,
      slug: `next-word-frequency-predictor`,
      title: `Build a Next-Word Frequency Predictor`,
      difficulty: `Medium`,
      badges: `google`,
      tags: `hash-map,string,design`,
      frequency: 271,
      description: `Build a **bigram language model** that predicts the most likely next word given a previous word.

- **Stage 1:** Train on a corpus and return the most frequent next word.
- **Stage 2:** Return the top-k next words with their probabilities.`,
      starterCode: `from collections import defaultdict, Counter

class BigramPredictor:
    def train(self, corpus: str) -> None:
        pass

    def predict(self, word: str) -> str | None:
        pass`,
      methodName: `BigramPredictor`,
    },
    [
      {
        stageNumber: 1,
        title: `Most Frequent Next Word`,
        description: `Implement \`BigramPredictor\` with \`train(corpus)\` and \`predict(word)\` returning the most frequent next word.

\`\`\`python
bp = BigramPredictor()
bp.train('the cat sat on the mat the cat ate')
bp.predict('the')   # → 'cat'
bp.predict('xyz')   # → None
\`\`\``,
        baseClass: `from collections import defaultdict, Counter

class BigramPredictor:
    def train(self, corpus: str) -> None:
        pass

    def predict(self, word: str) -> str | None:
        pass`,
        starterCode: `from collections import defaultdict, Counter

class BigramPredictor:
    def __init__(self):
        self.bigrams = defaultdict(Counter)

    def train(self, corpus: str) -> None:
        words = corpus.split()
        for i in range(len(words) - 1):
            self.bigrams[words[i]][words[i+1]] += 1

    def predict(self, word: str) -> str | None:
        if word not in self.bigrams or not self.bigrams[word]:
            return None
        return self.bigrams[word].most_common(1)[0][0]`,
        solution: `from collections import defaultdict, Counter

class BigramPredictor:
    def __init__(self):
        self.bigrams = defaultdict(Counter)

    def train(self, corpus: str) -> None:
        words = corpus.split()
        for i in range(len(words) - 1):
            self.bigrams[words[i]][words[i+1]] += 1

    def predict(self, word: str) -> str | None:
        if word not in self.bigrams or not self.bigrams[word]:
            return None
        return self.bigrams[word].most_common(1)[0][0]`,
        solutionExplanation: `A **bigram model** counts how often each word follows each other word. \`Counter.most_common(1)\` returns the most frequent next word in O(n) time.`,
        testCases: [
          {
            description: `predict the`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('the cat sat on the mat the cat ate')
result = bp.predict('the')`,
            expectedOutput: `'cat'`,
            orderIndex: 0,
          },
          {
            description: `unseen word`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('hello world')
result = bp.predict('xyz')`,
            expectedOutput: `None`,
            orderIndex: 1,
          },
          {
            description: `single bigram`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('hello world')
result = bp.predict('hello')`,
            expectedOutput: `'world'`,
            orderIndex: 2,
          },
        ],
      },
      {
        stageNumber: 2,
        title: `Top-K Predictions with Probabilities`,
        description: `Add \`predict_topk(word, k)\` returning top-k next words as (word, probability) tuples.

\`\`\`python
bp.predict_topk('the', 2)
# → [('cat', 2/3), ('mat', 1/3)]
\`\`\``,
        baseClass: `from collections import defaultdict, Counter

class BigramPredictor:
    def __init__(self):
        self.bigrams = defaultdict(Counter)

    def train(self, corpus: str) -> None:
        words = corpus.split()
        for i in range(len(words) - 1):
            self.bigrams[words[i]][words[i+1]] += 1

    def predict(self, word: str) -> str | None:
        if word not in self.bigrams or not self.bigrams[word]:
            return None
        return self.bigrams[word].most_common(1)[0][0]`,
        starterCode: `from collections import defaultdict, Counter

class BigramPredictor:
    def __init__(self):
        self.bigrams = defaultdict(Counter)

    def train(self, corpus: str) -> None:
        words = corpus.split()
        for i in range(len(words) - 1):
            self.bigrams[words[i]][words[i+1]] += 1

    def predict(self, word: str) -> str | None:
        if word not in self.bigrams or not self.bigrams[word]:
            return None
        return self.bigrams[word].most_common(1)[0][0]

    def predict_topk(self, word: str, k: int) -> list[tuple]:
        if word not in self.bigrams:
            return []
        counts = self.bigrams[word]
        total = sum(counts.values())
        return [(w, c / total) for w, c in counts.most_common(k)]`,
        solution: `from collections import defaultdict, Counter

class BigramPredictor:
    def __init__(self):
        self.bigrams = defaultdict(Counter)

    def train(self, corpus: str) -> None:
        words = corpus.split()
        for i in range(len(words) - 1):
            self.bigrams[words[i]][words[i+1]] += 1

    def predict(self, word: str) -> str | None:
        if word not in self.bigrams or not self.bigrams[word]:
            return None
        return self.bigrams[word].most_common(1)[0][0]

    def predict_topk(self, word: str, k: int) -> list[tuple]:
        if word not in self.bigrams:
            return []
        counts = self.bigrams[word]
        total = sum(counts.values())
        return [(w, c / total) for w, c in counts.most_common(k)]`,
        solutionExplanation: `Probabilities are computed as count/total — maximum likelihood estimation (MLE). \`Counter.most_common(k)\` gives the top-k in O(n log k) time.`,
        testCases: [
          {
            description: `top 2 for the`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('the cat sat on the mat the cat ate')
result = bp.predict_topk('the', 2)`,
            expectedOutput: `[('cat', 0.6666666666666666), ('mat', 0.3333333333333333)]`,
            orderIndex: 0,
          },
          {
            description: `unseen`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('hello world')
result = bp.predict_topk('xyz', 2)`,
            expectedOutput: `[]`,
            orderIndex: 1,
          },
          {
            description: `single follower`,
            inputData: `from collections import defaultdict, Counter
bp = BigramPredictor()
bp.train('hello world')
result = bp.predict_topk('hello', 1)`,
            expectedOutput: `[('world', 1.0)]`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  await seedStagedProblemIfNotExists(
    {
      number: 30009,
      slug: `detect-remove-matched-words-char-stream`,
      title: `Detect and Remove Matched Words in a Char Stream`,
      difficulty: `Hard`,
      badges: `google`,
      tags: `trie,design,string`,
      frequency: 238,
      description: `Design a system that processes a **character stream** and detects when a complete word from a dictionary has been formed.

- **Stage 1:** Detect when any dictionary word appears as a suffix of the current buffer.
- **Stage 2:** Remove the matched word from the buffer and continue streaming.`,
      starterCode: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        pass

    def add_char(self, c: str) -> str | None:
        pass`,
      methodName: `StreamWordDetector`,
    },
    [
      {
        stageNumber: 1,
        title: `Detect Word Suffix`,
        description: `Implement \`StreamWordDetector(words)\` with \`add_char(c)\` that returns the matched word if the buffer ends with any dictionary word, else None.

\`\`\`python
d = StreamWordDetector(['code', 'coder'])
d.add_char('c'); d.add_char('o'); d.add_char('d')
d.add_char('e')  # → 'code'
\`\`\``,
        baseClass: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        pass

    def add_char(self, c: str) -> str | None:
        pass`,
        starterCode: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        self.words = set(words)
        self.max_len = max(len(w) for w in words) if words else 0
        self.buffer = []

    def add_char(self, c: str) -> str | None:
        self.buffer.append(c)
        buf = ''.join(self.buffer[-self.max_len:])
        for w in self.words:
            if buf.endswith(w):
                return w
        return None`,
        solution: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        self.words = set(words)
        self.max_len = max(len(w) for w in words) if words else 0
        self.buffer = []

    def add_char(self, c: str) -> str | None:
        self.buffer.append(c)
        buf = ''.join(self.buffer[-self.max_len:])
        for w in self.words:
            if buf.endswith(w):
                return w
        return None`,
        solutionExplanation: `We only need to check the last max_len characters of the buffer. For large dictionaries, a suffix Trie enables O(|word|) detection.`,
        testCases: [
          {
            description: `detect code`,
            inputData: `d = StreamWordDetector(['code','coder','coding'])
for c in 'cod': d.add_char(c)
result = d.add_char('e')`,
            expectedOutput: `'code'`,
            orderIndex: 0,
          },
          {
            description: `detect coder`,
            inputData: `d = StreamWordDetector(['code','coder','coding'])
for c in 'code': d.add_char(c)
result = d.add_char('r')`,
            expectedOutput: `'coder'`,
            orderIndex: 1,
          },
          {
            description: `no match`,
            inputData: `d = StreamWordDetector(['code'])
result = d.add_char('x')`,
            expectedOutput: `None`,
            orderIndex: 2,
          },
          {
            description: `mid stream`,
            inputData: `d = StreamWordDetector(['code'])
d.add_char('x'); d.add_char('c'); d.add_char('o'); d.add_char('d')
result = d.add_char('e')`,
            expectedOutput: `'code'`,
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: `Remove Matched Word and Continue`,
        description: `Upgrade \`add_char\` to also **remove** the matched word from the buffer when a match is found.

\`\`\`python
d = StreamWordDetector(['code', 'decode'])
for c in 'decod': d.add_char(c)
d.add_char('e')  # → 'decode'  (buffer cleared)
\`\`\``,
        baseClass: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        self.words = set(words)
        self.max_len = max(len(w) for w in words) if words else 0
        self.buffer = []

    def add_char(self, c: str) -> str | None:
        self.buffer.append(c)
        buf = ''.join(self.buffer[-self.max_len:])
        for w in self.words:
            if buf.endswith(w):
                return w
        return None`,
        starterCode: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        self.words = set(words)
        self.max_len = max(len(w) for w in words) if words else 0
        self.buffer = []

    def add_char(self, c: str) -> str | None:
        self.buffer.append(c)
        buf = ''.join(self.buffer)
        for w in self.words:
            if buf.endswith(w):
                self.buffer = list(buf[:-len(w)])
                return w
        return None`,
        solution: `class StreamWordDetector:
    def __init__(self, words: list[str]):
        self.words = set(words)
        self.max_len = max(len(w) for w in words) if words else 0
        self.buffer = []

    def add_char(self, c: str) -> str | None:
        self.buffer.append(c)
        buf = ''.join(self.buffer)
        for w in self.words:
            if buf.endswith(w):
                self.buffer = list(buf[:-len(w)])
                return w
        return None`,
        solutionExplanation: `When a word is matched, we trim the matched suffix from the buffer. The remaining prefix stays for future matching — enabling chained detections.`,
        testCases: [
          {
            description: `detect and clear`,
            inputData: `d = StreamWordDetector(['code','decode'])
for c in 'decod': d.add_char(c)
result = d.add_char('e')`,
            expectedOutput: `'decode'`,
            orderIndex: 0,
          },
          {
            description: `buffer cleared then detect again`,
            inputData: `d = StreamWordDetector(['code'])
for c in 'code': d.add_char(c)
d.add_char('c'); d.add_char('o'); d.add_char('d')
result = d.add_char('e')`,
            expectedOutput: `'code'`,
            orderIndex: 1,
          },
          {
            description: `no match`,
            inputData: `d = StreamWordDetector(['code'])
result = d.add_char('x')`,
            expectedOutput: `None`,
            orderIndex: 2,
          },
        ],
      },
    ]
  );

  await seedStagedProblemIfNotExists(
    {
      number: 30010,
      slug: `compute-minimax-grid-path`,
      title: `Compute Minimax Grid Path`,
      difficulty: `Hard`,
      badges: `google`,
      tags: `dp,binary-search,graph`,
      frequency: 233,
      description: `Given an N×M grid of integers, find a path from the top-left to the bottom-right (moving only right or down) that **minimizes the maximum value** encountered along the path.

- **Stage 1:** Return the minimax value (DP approach).
- **Stage 2:** Return the actual path (backtracking).`,
      starterCode: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        pass`,
      methodName: `MinimaxPath`,
    },
    [
      {
        stageNumber: 1,
        title: `Minimax Value (DP)`,
        description: `Implement \`minimax(grid)\` returning the minimum possible maximum value on any path from (0,0) to (n-1,m-1).

\`\`\`python
mp = MinimaxPath()
mp.minimax([[1,3,1],[1,5,1],[4,2,1]])  # → 3
\`\`\``,
        baseClass: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        pass`,
        starterCode: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        return dp[n-1][m-1]`,
        solution: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        return dp[n-1][m-1]`,
        solutionExplanation: `**DP**: dp[i][j] = minimum possible maximum value on any path from (0,0) to (i,j). At each cell, take the min over incoming directions, then max with the current cell value.

**Time:** O(n*m). **Space:** O(n*m).`,
        testCases: [
          {
            description: `3x3 grid`,
            inputData: `mp = MinimaxPath()
result = mp.minimax([[1,3,1],[1,5,1],[4,2,1]])`,
            expectedOutput: `3`,
            orderIndex: 0,
          },
          {
            description: `2x2 grid`,
            inputData: `mp = MinimaxPath()
result = mp.minimax([[1,2],[3,4]])`,
            expectedOutput: `3`,
            orderIndex: 1,
          },
          {
            description: `single cell`,
            inputData: `mp = MinimaxPath()
result = mp.minimax([[7]])`,
            expectedOutput: `7`,
            orderIndex: 2,
          },
          {
            description: `1x3 row`,
            inputData: `mp = MinimaxPath()
result = mp.minimax([[1,5,2]])`,
            expectedOutput: `5`,
            orderIndex: 3,
          },
        ],
      },
      {
        stageNumber: 2,
        title: `Return the Actual Path`,
        description: `Add \`minimax_path(grid)\` that returns the list of (row, col) coordinates of the optimal path.

\`\`\`python
mp.minimax_path([[1,3,1],[1,5,1],[4,2,1]])
# → [(0,0),(1,0),(1,1),(1,2),(2,2)]
\`\`\``,
        baseClass: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        return dp[n-1][m-1]`,
        starterCode: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        return dp[n-1][m-1]

    def minimax_path(self, grid: list[list[int]]) -> list[tuple]:
        # Run DP, then backtrack from (n-1,m-1) to (0,0)
        pass`,
        solution: `class MinimaxPath:
    def minimax(self, grid: list[list[int]]) -> int:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        return dp[n-1][m-1]

    def minimax_path(self, grid: list[list[int]]) -> list[tuple]:
        n, m = len(grid), len(grid[0])
        dp = [[float('inf')] * m for _ in range(n)]
        dp[0][0] = grid[0][0]
        for i in range(n):
            for j in range(m):
                if i == 0 and j == 0:
                    continue
                candidates = []
                if i > 0:
                    candidates.append(dp[i-1][j])
                if j > 0:
                    candidates.append(dp[i][j-1])
                dp[i][j] = max(grid[i][j], min(candidates))
        path = []
        i, j = n - 1, m - 1
        while i > 0 or j > 0:
            path.append((i, j))
            if i == 0:
                j -= 1
            elif j == 0:
                i -= 1
            elif dp[i-1][j] <= dp[i][j-1]:
                i -= 1
            else:
                j -= 1
        path.append((0, 0))
        return list(reversed(path))`,
        solutionExplanation: `After computing the DP table, we backtrack from (n-1,m-1) to (0,0) by always moving to the neighbor with the smaller dp value.`,
        testCases: [
          {
            description: `path starts at origin`,
            inputData: `mp = MinimaxPath()
result = mp.minimax_path([[1,3,1],[1,5,1],[4,2,1]])[0]`,
            expectedOutput: `(0, 0)`,
            orderIndex: 0,
          },
          {
            description: `path ends at corner`,
            inputData: `mp = MinimaxPath()
result = mp.minimax_path([[1,3,1],[1,5,1],[4,2,1]])[-1]`,
            expectedOutput: `(2, 2)`,
            orderIndex: 1,
          },
          {
            description: `single cell path`,
            inputData: `mp = MinimaxPath()
result = mp.minimax_path([[7]])`,
            expectedOutput: `[(0, 0)]`,
            orderIndex: 2,
          },
          {
            description: `path max equals minimax`,
            inputData: `mp = MinimaxPath()
grid = [[1,3,1],[1,5,1],[4,2,1]]
path = mp.minimax_path(grid)
result = max(grid[r][c] for r,c in path)`,
            expectedOutput: `3`,
            orderIndex: 3,
          },
        ],
      },
    ]
  );

  console.log("[Seed] Batch 6 (More Google problems) seeded successfully.");
}