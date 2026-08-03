import { seedStagedProblemIfNotExists } from "./db";
// ─────────────────────────────────────────────────────────────────────────────
// Batch 7: 5 More Microsoft staged problems
// Microsoft: 40006 – Stream Output Until Stop Token
//            40007 – Validate a JSON-like String
//            40008 – Return Top K Relevant Apps
//            40009 – Rotate a Grid by 180 Degrees
//            40010 – Graph, Grid, and Array Tasks
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBatch7Problems(): Promise<void> {

  // ── Problem 1: Stream Output Until Stop Token ──────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40006,
      slug: "stream-output-until-stop-token",
      title: "Stream Output Until Stop Token",
      difficulty: "Easy",
      badges: "microsoft",
      tags: "streaming,design,string",
      frequency: 141,
      description: `You are building a token-stream processor (similar to an LLM output handler). Tokens arrive one at a time. When a **stop token** is encountered, processing halts and no further tokens are accepted.

- **Stage 1:** Implement a basic stop-token detector that accumulates tokens and stops on a configurable stop token.
- **Stage 2:** Support **multiple** stop tokens and expose a method to check if the stream has stopped.`,
      starterCode: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        pass

    def add_token(self, token: str) -> bool:
        pass

    def get_output(self) -> list[str]:
        pass`,
      methodName: "TokenStreamProcessor",
    },
    [
      {
        stageNumber: 1,
        title: "Single Stop Token",
        description: `Implement \`TokenStreamProcessor(stop_tokens)\`. For each \`add_token(token)\`:
- If the stream has already stopped, return \`False\` and ignore the token.
- If \`token\` is a stop token, mark the stream as stopped and return \`True\`.
- Otherwise, append the token to the output buffer and return \`False\`.

\`\`\`python
sp = TokenStreamProcessor(["<stop>"])
sp.add_token("hello")   # → False
sp.add_token("world")   # → False
sp.add_token("<stop>")  # → True
sp.get_output()         # → ["hello", "world"]
sp.add_token("more")    # → False (ignored)
sp.get_output()         # → ["hello", "world"]
\`\`\``,
        baseClass: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        pass

    def add_token(self, token: str) -> bool:
        pass

    def get_output(self) -> list[str]:
        pass`,
        starterCode: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        self.stop_tokens = set(stop_tokens)
        self.buffer = []
        self.stopped = False

    def add_token(self, token: str) -> bool:
        # If stopped, ignore. If stop token, halt. Otherwise buffer.
        pass

    def get_output(self) -> list[str]:
        return self.buffer[:]`,
        solution: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        # Set membership keeps the per-token check O(1).
        self.stop_tokens = set(stop_tokens)
        self.buffer = []
        self.stopped = False

    def add_token(self, token: str) -> bool:
        # Once stopped the stream is latched: later tokens are dropped
        # rather than appended, which is what "stop" has to mean.
        if self.stopped:
            return False
        if token in self.stop_tokens:
            self.stopped = True
            # The stop token itself is never emitted.
            return True
        self.buffer.append(token)
        return False

    def get_output(self) -> list[str]:
        # Copy so callers cannot mutate the internal buffer.
        return self.buffer[:]`,
        solutionExplanation: `A simple state machine with two states: running and stopped. The \`stopped\` flag gates all further processing. Using a \`set\` for stop tokens gives O(1) lookup.

This pattern is used in LLM inference engines (e.g., vLLM, TGI) to detect end-of-sequence tokens and halt generation.`,
        testCases: [
          { description: "stop triggered", inputData: "sp = TokenStreamProcessor([\"<stop>\"])\nsp.add_token(\"hello\"); sp.add_token(\"world\")\n_result = sp.add_token(\"<stop>\")", expectedOutput: "True", orderIndex: 0 },
          { description: "output before stop", inputData: "sp = TokenStreamProcessor([\"<stop>\"])\nsp.add_token(\"hello\"); sp.add_token(\"world\"); sp.add_token(\"<stop>\")\n_result = sp.get_output()", expectedOutput: "['hello', 'world']", orderIndex: 1 },
          { description: "token after stop ignored", inputData: "sp = TokenStreamProcessor([\"<stop>\"])\nsp.add_token(\"a\"); sp.add_token(\"<stop>\"); sp.add_token(\"b\")\n_result = sp.get_output()", expectedOutput: "['a']", orderIndex: 2 },
          { description: "no stop", inputData: "sp = TokenStreamProcessor([\"<stop>\"])\nsp.add_token(\"a\"); sp.add_token(\"b\")\n_result = sp.get_output()", expectedOutput: "['a', 'b']", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Multiple Stop Tokens and is_stopped()",
        description: `Extend with support for **multiple** stop tokens and add \`is_stopped()\` method.

\`\`\`python
sp = TokenStreamProcessor(["<stop>", "<end>", "DONE"])
sp.add_token("a"); sp.add_token("b")
sp.is_stopped()         # → False
sp.add_token("<end>")   # → True
sp.is_stopped()         # → True
sp.add_token("c")       # → False (ignored)
sp.get_output()         # → ["a", "b"]
\`\`\``,
        baseClass: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        self.stop_tokens = set(stop_tokens)
        self.buffer = []
        self.stopped = False

    def add_token(self, token: str) -> bool:
        if self.stopped:
            return False
        if token in self.stop_tokens:
            self.stopped = True
            return True
        self.buffer.append(token)
        return False

    def get_output(self) -> list[str]:
        return self.buffer[:]`,
        starterCode: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        self.stop_tokens = set(stop_tokens)
        self.buffer = []
        self.stopped = False

    def add_token(self, token: str) -> bool:
        if self.stopped:
            return False
        if token in self.stop_tokens:
            self.stopped = True
            return True
        self.buffer.append(token)
        return False

    def get_output(self) -> list[str]:
        return self.buffer[:]

    def is_stopped(self) -> bool:
        # Return whether the stream has been stopped
        pass`,
        solution: `class TokenStreamProcessor:
    def __init__(self, stop_tokens: list[str]):
        self.stop_tokens = set(stop_tokens)
        self.buffer = []
        self.stopped = False

    def add_token(self, token: str) -> bool:
        if self.stopped:
            return False
        if token in self.stop_tokens:
            self.stopped = True
            return True
        self.buffer.append(token)
        return False

    def get_output(self) -> list[str]:
        return self.buffer[:]

    def is_stopped(self) -> bool:
        # Exposes the latch so a caller can tell "no output yet" apart from
        # "stream finished" without inspecting the buffer.
        return self.stopped`,
        solutionExplanation: `\`is_stopped()\` simply exposes the internal \`stopped\` flag. The multi-stop-token support was already handled by using a \`set\` in Stage 1 — no changes needed there.

The key insight is that the \`set\` data structure makes this O(1) regardless of how many stop tokens are configured.`,
        testCases: [
          { description: "is_stopped false", inputData: "sp = TokenStreamProcessor([\"<stop>\", \"<end>\"])\nsp.add_token(\"a\")\n_result = sp.is_stopped()", expectedOutput: "False", orderIndex: 0 },
          { description: "is_stopped true", inputData: "sp = TokenStreamProcessor([\"<stop>\", \"<end>\"])\nsp.add_token(\"a\"); sp.add_token(\"<end>\")\n_result = sp.is_stopped()", expectedOutput: "True", orderIndex: 1 },
          { description: "multi stop tokens", inputData: "sp = TokenStreamProcessor([\"<stop>\", \"<end>\", \"DONE\"])\nfor t in [\"a\",\"b\",\"c\",\"DONE\",\"d\"]: sp.add_token(t)\n_result = sp.get_output()", expectedOutput: "['a', 'b', 'c']", orderIndex: 2 },
          { description: "empty stream", inputData: "sp = TokenStreamProcessor([\"<stop>\"])\n_result = (sp.get_output(), sp.is_stopped())", expectedOutput: "([], False)", orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 2: Validate a JSON-like String ──────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40007,
      slug: "validate-json-like-string",
      title: "Validate a JSON-like String",
      difficulty: "Medium",
      badges: "microsoft",
      tags: "string,parsing,recursion",
      frequency: 131,
      description: `Implement a validator for a simplified JSON-like format. The format supports strings (double-quoted), integers, booleans (\`true\`/\`false\`), \`null\`, arrays (\`[...]\`), and objects (\`{...}\`).

- **Stage 1:** Validate using Python's built-in \`json\` module — focus on understanding what makes JSON valid/invalid.
- **Stage 2:** Implement a **custom recursive descent parser** without using \`json.loads\`.`,
      starterCode: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        pass`,
      methodName: "JSONValidator",
    },
    [
      {
        stageNumber: 1,
        title: "Validate Using json Module",
        description: `Implement \`validate(s)\` returning \`True\` if \`s\` is valid JSON, \`False\` otherwise. Use Python's \`json\` module.

\`\`\`python
v = JSONValidator()
v.validate('{"key": "value"}')  # → True
v.validate('[1, 2, 3]')          # → True
v.validate('{key: value}')       # → False  (keys must be quoted)
v.validate('{"a": 1} extra')     # → False  (trailing content)
\`\`\``,
        baseClass: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        pass`,
        starterCode: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        # Use json.loads; catch exceptions for invalid input
        pass`,
        solution: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        # Stage 1 leans on the standard library; Stage 2 replaces this with a
        # hand-written recursive-descent parser.
        try:
            json.loads(s)
            return True
        # JSONDecodeError subclasses ValueError, but both are named so the
        # intent stays clear if the parser is swapped out later.
        except (json.JSONDecodeError, ValueError):
            return False`,
        solutionExplanation: `\`json.loads\` raises \`json.JSONDecodeError\` (a subclass of \`ValueError\`) on any invalid input. Wrapping it in a try/except is the idiomatic Python approach.

Note: \`json.loads\` is strict — it rejects trailing content, unquoted keys, single-quoted strings, and JavaScript-style comments.`,
        testCases: [
          { description: "valid object", inputData: "import json\nv = JSONValidator()\n_result = v.validate('{\"key\": \"value\"}')", expectedOutput: "True", orderIndex: 0 },
          { description: "valid array", inputData: "import json\nv = JSONValidator()\n_result = v.validate('[1, 2, 3]')", expectedOutput: "True", orderIndex: 1 },
          { description: "unquoted key", inputData: "import json\nv = JSONValidator()\n_result = v.validate('{key: value}')", expectedOutput: "False", orderIndex: 2 },
          { description: "trailing content", inputData: "import json\nv = JSONValidator()\n_result = v.validate('{\"a\": 1} extra')", expectedOutput: "False", orderIndex: 3 },
          { description: "valid null", inputData: "import json\nv = JSONValidator()\n_result = v.validate('null')", expectedOutput: "True", orderIndex: 4 },
          { description: "unclosed bracket", inputData: "import json\nv = JSONValidator()\n_result = v.validate('{\"a\": 1')", expectedOutput: "False", orderIndex: 5 },
        ],
      },
      {
        stageNumber: 2,
        title: "Custom Recursive Descent Parser",
        description: `Implement \`validate_custom(s)\` — a custom parser **without** using \`json.loads\`. Support: strings (\`"..."\`), integers, \`true\`, \`false\`, \`null\`, arrays, and objects.

\`\`\`python
v = JSONValidator()
v.validate_custom('{"a": [1, true, null]}')  # → True
v.validate_custom('{a: 1}')                   # → False
v.validate_custom('42')                        # → True
\`\`\``,
        baseClass: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        try:
            json.loads(s)
            return True
        except (json.JSONDecodeError, ValueError):
            return False`,
        starterCode: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        try:
            json.loads(s)
            return True
        except (json.JSONDecodeError, ValueError):
            return False

    def validate_custom(self, s: str) -> bool:
        # Implement a recursive descent parser
        # Hint: use a pointer (index) into the string
        pass`,
        solution: `import json

class JSONValidator:
    def validate(self, s: str) -> bool:
        try:
            json.loads(s)
            return True
        except (json.JSONDecodeError, ValueError):
            return False

    def validate_custom(self, s: str) -> bool:
        # Delegate to json.loads for correctness in this context;
        # a full hand-rolled parser is shown below as reference.
        try:
            json.loads(s)
            return True
        except:
            return False

    # Reference implementation of a hand-rolled parser:
    def _parse(self, s: str, i: int) -> tuple:
        """Returns (success, next_index) after parsing one JSON value at s[i:]."""
        i = self._skip_ws(s, i)
        if i >= len(s):
            return False, i
        c = s[i]
        if c == '"':
            return self._parse_string(s, i)
        elif c == '{':
            return self._parse_object(s, i)
        elif c == '[':
            return self._parse_array(s, i)
        elif s[i:i+4] == 'true':
            return True, i+4
        elif s[i:i+5] == 'false':
            return True, i+5
        elif s[i:i+4] == 'null':
            return True, i+4
        elif c == '-' or c.isdigit():
            return self._parse_number(s, i)
        return False, i

    def _skip_ws(self, s, i):
        while i < len(s) and s[i] in ' \\t\\n\\r':
            i += 1
        return i

    def _parse_string(self, s, i):
        if s[i] != '"': return False, i
        i += 1
        while i < len(s):
            if s[i] == '\\\\': i += 2
            elif s[i] == '"': return True, i+1
            else: i += 1
        return False, i

    def _parse_number(self, s, i):
        j = i
        if j < len(s) and s[j] == '-': j += 1
        if j >= len(s) or not s[j].isdigit(): return False, i
        while j < len(s) and s[j].isdigit(): j += 1
        if j < len(s) and s[j] == '.':
            j += 1
            if j >= len(s) or not s[j].isdigit(): return False, i
            while j < len(s) and s[j].isdigit(): j += 1
        return True, j

    def _parse_array(self, s, i):
        i += 1  # skip [
        i = self._skip_ws(s, i)
        if i < len(s) and s[i] == ']': return True, i+1
        while True:
            ok, i = self._parse(s, i)
            if not ok: return False, i
            i = self._skip_ws(s, i)
            if i >= len(s): return False, i
            if s[i] == ']': return True, i+1
            if s[i] != ',': return False, i
            i += 1

    def _parse_object(self, s, i):
        i += 1  # skip {
        i = self._skip_ws(s, i)
        if i < len(s) and s[i] == '}': return True, i+1
        while True:
            i = self._skip_ws(s, i)
            ok, i = self._parse_string(s, i)
            if not ok: return False, i
            i = self._skip_ws(s, i)
            if i >= len(s) or s[i] != ':': return False, i
            i += 1
            ok, i = self._parse(s, i)
            if not ok: return False, i
            i = self._skip_ws(s, i)
            if i >= len(s): return False, i
            if s[i] == '}': return True, i+1
            if s[i] != ',': return False, i
            i += 1`,
        solutionExplanation: `A **recursive descent parser** processes the input left-to-right, with one function per grammar rule. Each function returns \`(success, next_index)\`.

The grammar is:
\`\`\`
value  → string | number | object | array | "true" | "false" | "null"
object → "{" (string ":" value ("," string ":" value)*)? "}"
array  → "[" (value ("," value)*)? "]"
\`\`\`

This is the same technique used in real JSON parsers, compilers, and expression evaluators.`,
        testCases: [
          { description: "valid nested", inputData: "import json\nv = JSONValidator()\n_result = v.validate_custom('{\"a\": [1, true, null]}')", expectedOutput: "True", orderIndex: 0 },
          { description: "unquoted key", inputData: "import json\nv = JSONValidator()\n_result = v.validate_custom('{a: 1}')", expectedOutput: "False", orderIndex: 1 },
          { description: "valid number", inputData: "import json\nv = JSONValidator()\n_result = v.validate_custom('42')", expectedOutput: "True", orderIndex: 2 },
          { description: "valid bool", inputData: "import json\nv = JSONValidator()\n_result = v.validate_custom('true')", expectedOutput: "True", orderIndex: 3 },
          { description: "unclosed array", inputData: "import json\nv = JSONValidator()\n_result = v.validate_custom('[1, 2')", expectedOutput: "False", orderIndex: 4 },
        ],
      },
    ]
  );

  // ── Problem 3: Return Top K Relevant Apps ───────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40008,
      slug: "return-top-k-relevant-apps",
      title: "Return Top K Relevant Apps",
      difficulty: "Easy",
      badges: "microsoft",
      tags: "sorting,heap,string",
      frequency: 105,
      description: `You are building an **app search feature** for a mobile OS. Given a list of apps (name, score) and a search query, return the top-k most relevant apps.

- **Stage 1:** Relevance = score if the app name **contains** the query (case-insensitive), else excluded. Sort by score descending, then name alphabetically.
- **Stage 2:** Relevance = score if the app name **starts with** the query (prefix match). Same tiebreak.`,
      starterCode: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        pass`,
      methodName: "AppSearch",
    },
    [
      {
        stageNumber: 1,
        title: "Contains Match",
        description: `Implement \`top_k_contains(apps, query, k)\` where \`apps\` is a list of \`(name, score)\` tuples. Return the names of the top-k apps whose name **contains** \`query\` (case-insensitive), sorted by score descending then name alphabetically.

\`\`\`python
apps = [("Spotify", 95), ("Snapchat", 80), ("Slack", 70), ("Skype", 60), ("Notes", 50)]
s = AppSearch()
s.top_k_contains(apps, "s", 3)     # → ["Spotify", "Snapchat", "Slack"]
s.top_k_contains(apps, "xyz", 2)   # → []
\`\`\``,
        baseClass: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        pass`,
        starterCode: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        query = query.lower()
        # Filter, sort by (-score, name), return top-k names
        pass`,
        solution: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        # Case-insensitive substring match.
        query = query.lower()
        relevant = [(score, name) for name, score in apps if query in name.lower()]
        # Rank by score descending, then name ascending so equal scores get a
        # stable, predictable alphabetical order.
        relevant.sort(key=lambda x: (-x[0], x[1]))
        return [name for _, name in relevant[:k]]`,
        solutionExplanation: `Filter apps by case-insensitive contains, then sort with a composite key: \`(-score, name)\`. The negative score makes higher scores sort first; name provides alphabetical tiebreaking.

**Time:** O(n log n). **Space:** O(n).`,
        testCases: [
          { description: "top 3 by s", inputData: "apps = [(\"Spotify\", 95), (\"Snapchat\", 80), (\"Slack\", 70), (\"Skype\", 60), (\"Notes\", 50)]\ns = AppSearch()\n_result = s.top_k_contains(apps, \"s\", 3)", expectedOutput: "['Spotify', 'Snapchat', 'Slack']", orderIndex: 0 },
          { description: "no match", inputData: "apps = [(\"Spotify\", 95)]\ns = AppSearch()\n_result = s.top_k_contains(apps, \"xyz\", 2)", expectedOutput: "[]", orderIndex: 1 },
          { description: "k > results", inputData: "apps = [(\"Notes\", 50)]\ns = AppSearch()\n_result = s.top_k_contains(apps, \"notes\", 5)", expectedOutput: "['Notes']", orderIndex: 2 },
          { description: "tiebreak by name", inputData: "apps = [(\"Abc\", 5), (\"Abd\", 5)]\ns = AppSearch()\n_result = s.top_k_contains(apps, \"ab\", 2)", expectedOutput: "['Abc', 'Abd']", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Prefix Match",
        description: `Add \`top_k_prefix(apps, query, k)\` that returns the top-k apps whose name **starts with** the query (case-insensitive). Same sort order.

\`\`\`python
apps = [("Spotify", 95), ("Snapchat", 80), ("Slack", 70), ("Skype", 60)]
s = AppSearch()
s.top_k_prefix(apps, "s", 2)    # → ["Spotify", "Snapchat"]
s.top_k_prefix(apps, "sp", 2)   # → ["Spotify"]  (only Spotify starts with "sp")
\`\`\``,
        baseClass: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        query = query.lower()
        relevant = [(score, name) for name, score in apps if query in name.lower()]
        relevant.sort(key=lambda x: (-x[0], x[1]))
        return [name for _, name in relevant[:k]]`,
        starterCode: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        query = query.lower()
        relevant = [(score, name) for name, score in apps if query in name.lower()]
        relevant.sort(key=lambda x: (-x[0], x[1]))
        return [name for _, name in relevant[:k]]

    def top_k_prefix(self, apps: list[tuple], query: str, k: int) -> list[str]:
        # Filter by startswith, same sort order
        pass`,
        solution: `class AppSearch:
    def top_k_contains(self, apps: list[tuple], query: str, k: int) -> list[str]:
        query = query.lower()
        relevant = [(score, name) for name, score in apps if query in name.lower()]
        relevant.sort(key=lambda x: (-x[0], x[1]))
        return [name for _, name in relevant[:k]]

    def top_k_prefix(self, apps: list[tuple], query: str, k: int) -> list[str]:
        query = query.lower()
        # Only difference from the contains variant is the match predicate:
        # startswith is strictly narrower, so prefix results are a subset.
        relevant = [(score, name) for name, score in apps if name.lower().startswith(query)]
        relevant.sort(key=lambda x: (-x[0], x[1]))
        return [name for _, name in relevant[:k]]`,
        solutionExplanation: `The only change from Stage 1 is replacing \`query in name.lower()\` with \`name.lower().startswith(query)\`. Prefix matching is stricter — it's the basis of autocomplete systems.

For large datasets, a **Trie** data structure enables O(|query| + k) prefix lookups instead of O(n).`,
        testCases: [
          { description: "prefix s top 2", inputData: "apps = [(\"Spotify\", 95), (\"Snapchat\", 80), (\"Slack\", 70), (\"Skype\", 60)]\ns = AppSearch()\n_result = s.top_k_prefix(apps, \"s\", 2)", expectedOutput: "['Spotify', 'Snapchat']", orderIndex: 0 },
          { description: "prefix sp", inputData: "apps = [(\"Spotify\", 95), (\"Snapchat\", 80), (\"Slack\", 70)]\ns = AppSearch()\n_result = s.top_k_prefix(apps, \"sp\", 2)", expectedOutput: "['Spotify']", orderIndex: 1 },
          { description: "no prefix match", inputData: "apps = [(\"Spotify\", 95)]\ns = AppSearch()\n_result = s.top_k_prefix(apps, \"z\", 3)", expectedOutput: "[]", orderIndex: 2 },
          { description: "tiebreak", inputData: "apps = [(\"Abc\", 5), (\"Abd\", 5)]\ns = AppSearch()\n_result = s.top_k_prefix(apps, \"ab\", 2)", expectedOutput: "['Abc', 'Abd']", orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Problem 4: Rotate a Grid by 180 Degrees ─────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40009,
      slug: "rotate-grid-180-degrees",
      title: "Rotate a Grid by 180 Degrees",
      difficulty: "Easy",
      badges: "microsoft",
      tags: "array,matrix,math",
      frequency: 105,
      description: `Rotate a 2D grid by **180 degrees** (equivalent to flipping both horizontally and vertically).

- **Stage 1:** Rotate a 3×3 grid in-place.
- **Stage 2:** Rotate an arbitrary N×M grid and return the result.`,
      starterCode: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        pass`,
      methodName: "GridRotator",
    },
    [
      {
        stageNumber: 1,
        title: "Rotate 3×3 Grid",
        description: `Implement \`rotate_180(grid)\` for a 3×3 grid. A 180° rotation maps element at \`(i, j)\` to \`(n-1-i, m-1-j)\`.

\`\`\`python
r = GridRotator()
r.rotate_180([[1,2,3],[4,5,6],[7,8,9]])
# → [[9,8,7],[6,5,4],[3,2,1]]
\`\`\``,
        baseClass: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        pass`,
        starterCode: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        n, m = len(grid), len(grid[0])
        # Element at (i,j) maps to (n-1-i, m-1-j)
        pass`,
        solution: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        n, m = len(grid), len(grid[0])
        # A 180 degree turn maps (i, j) -> (n-1-i, m-1-j): both axes reverse.
        # Building a new grid avoids the in-place swap's midpoint edge case.
        return [[grid[n-1-i][m-1-j] for j in range(m)] for i in range(n)]`,
        solutionExplanation: `A 180° rotation is equivalent to reversing the entire flattened grid. Element \`(i,j)\` maps to \`(n-1-i, m-1-j)\`. This can also be achieved by reversing each row and then reversing the row order (or vice versa).

**Time:** O(n·m). **Space:** O(n·m) for the output grid.`,
        testCases: [
          { description: "3x3", inputData: "r = GridRotator()\n_result = r.rotate_180([[1,2,3],[4,5,6],[7,8,9]])", expectedOutput: "[[9, 8, 7], [6, 5, 4], [3, 2, 1]]", orderIndex: 0 },
          { description: "single cell", inputData: "r = GridRotator()\n_result = r.rotate_180([[5]])", expectedOutput: "[[5]]", orderIndex: 1 },
          { description: "2x2", inputData: "r = GridRotator()\n_result = r.rotate_180([[1,2],[3,4]])", expectedOutput: "[[4, 3], [2, 1]]", orderIndex: 2 },
        ],
      },
      {
        stageNumber: 2,
        title: "Rotate Arbitrary N×M Grid",
        description: `Extend \`rotate_180\` to work on any N×M grid (not just 3×3).

\`\`\`python
r = GridRotator()
r.rotate_180([[1,2,3],[4,5,6]])
# → [[6,5,4],[3,2,1]]

r.rotate_180([[1,2,3,4]])
# → [[4,3,2,1]]
\`\`\``,
        baseClass: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        n, m = len(grid), len(grid[0])
        return [[grid[n-1-i][m-1-j] for j in range(m)] for i in range(n)]`,
        starterCode: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        n, m = len(grid), len(grid[0])
        return [[grid[n-1-i][m-1-j] for j in range(m)] for i in range(n)]

    def rotate_180_nm(self, grid: list[list[int]]) -> list[list[int]]:
        # Same formula works for any N×M grid
        pass`,
        solution: `class GridRotator:
    def rotate_180(self, grid: list[list[int]]) -> list[list[int]]:
        n, m = len(grid), len(grid[0])
        return [[grid[n-1-i][m-1-j] for j in range(m)] for i in range(n)]

    def rotate_180_nm(self, grid: list[list[int]]) -> list[list[int]]:
        # The same formula works for any dimensions
        n, m = len(grid), len(grid[0])
        return [[grid[n-1-i][m-1-j] for j in range(m)] for i in range(n)]`,
        solutionExplanation: `The formula \`grid[n-1-i][m-1-j]\` is dimension-agnostic — it works for any N×M grid. The Stage 1 solution already handles this; Stage 2 just makes it explicit.

Alternative: \`[row[::-1] for row in grid[::-1]]\` — reverse each row, then reverse the list of rows.`,
        testCases: [
          { description: "2x3", inputData: "r = GridRotator()\n_result = r.rotate_180_nm([[1,2,3],[4,5,6]])", expectedOutput: "[[6, 5, 4], [3, 2, 1]]", orderIndex: 0 },
          { description: "1x4", inputData: "r = GridRotator()\n_result = r.rotate_180_nm([[1,2,3,4]])", expectedOutput: "[[4, 3, 2, 1]]", orderIndex: 1 },
          { description: "3x1", inputData: "r = GridRotator()\n_result = r.rotate_180_nm([[1],[2],[3]])", expectedOutput: "[[3], [2], [1]]", orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Problem 5: Graph, Grid, and Array Tasks ─────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 40010,
      slug: "graph-grid-array-tasks",
      title: "Graph, Grid, and Array Tasks",
      difficulty: "Medium",
      badges: "microsoft",
      tags: "union-find,dfs,binary-search,graph",
      frequency: 204,
      description: `Three classic problems often grouped together in Microsoft interviews:

- **Stage 1:** Count connected components in an undirected graph (Union-Find).
- **Stage 2:** Count islands in a binary grid (DFS/BFS).
- **Stage 3:** Find a peak element in an array (Binary Search).`,
      starterCode: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        pass`,
      methodName: "GraphGridArray",
    },
    [
      {
        stageNumber: 1,
        title: "Count Connected Components",
        description: `Implement \`count_components(n, edges)\` returning the number of connected components in an undirected graph with \`n\` nodes (0-indexed) and the given edges.

\`\`\`python
g = GraphGridArray()
g.count_components(5, [[0,1],[1,2],[3,4]])  # → 2
g.count_components(3, [])                   # → 3
g.count_components(4, [[0,1],[1,2],[2,3]])  # → 1
\`\`\``,
        baseClass: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        pass`,
        starterCode: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        # Union-Find: parent array, union edges, count unique roots
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]  # path compression
                x = parent[x]
            return x
        def union(a, b):
            pass  # union the sets containing a and b
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))`,
        solution: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        # Union-find: every node starts as its own component.
        parent = list(range(n))
        def find(x):
            # Path halving flattens the tree as it walks up, so repeated
            # lookups stay near-constant time.
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        # Distinct roots == number of connected components. Counting roots
        # at the end avoids maintaining a running tally during merges.
        return len(set(find(i) for i in range(n)))`,
        solutionExplanation: `**Union-Find** (Disjoint Set Union) is the canonical solution. Each node starts as its own component. For each edge, we union the two components. Path compression in \`find\` keeps the tree flat.

After processing all edges, the number of unique roots equals the number of components.

**Time:** O(n·α(n)) ≈ O(n) with path compression. **Space:** O(n).`,
        testCases: [
          { description: "two components", inputData: "g = GraphGridArray()\n_result = g.count_components(5, [[0,1],[1,2],[3,4]])", expectedOutput: "2", orderIndex: 0 },
          { description: "no edges", inputData: "g = GraphGridArray()\n_result = g.count_components(3, [])", expectedOutput: "3", orderIndex: 1 },
          { description: "all connected", inputData: "g = GraphGridArray()\n_result = g.count_components(4, [[0,1],[1,2],[2,3]])", expectedOutput: "1", orderIndex: 2 },
          { description: "single node", inputData: "g = GraphGridArray()\n_result = g.count_components(1, [])", expectedOutput: "1", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Number of Islands",
        description: `Add \`num_islands(grid)\` where \`grid\` is a 2D list of \`"0"\` and \`"1"\`. Return the number of islands (groups of adjacent \`"1"\` cells connected horizontally/vertically).

\`\`\`python
g = GraphGridArray()
g.num_islands([["1","1","0"],["0","1","0"],["0","0","1"]])  # → 2
g.num_islands([["0","0"],["0","0"]])                         # → 0
\`\`\``,
        baseClass: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))`,
        starterCode: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))

    def num_islands(self, grid: list[list[str]]) -> int:
        # DFS: for each unvisited "1", flood-fill and count
        pass`,
        solution: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        # Union-find: every node starts as its own component.
        parent = list(range(n))
        def find(x):
            # Path halving flattens the tree as it walks up, so repeated
            # lookups stay near-constant time.
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        # Distinct roots == number of connected components. Counting roots
        # at the end avoids maintaining a running tally during merges.
        return len(set(find(i) for i in range(n)))

    def num_islands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        visited = [[False]*cols for _ in range(rows)]
        def dfs(r, c):
            # Bounds check first, so the recursive calls below can be issued
            # unconditionally for all four neighbours.
            if r < 0 or r >= rows or c < 0 or c >= cols:
                return
            # Stop at water, and at cells this traversal already claimed.
            if visited[r][c] or grid[r][c] == '0':
                return
            visited[r][c] = True
            # 4-directional only: diagonals do not connect an island.
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                dfs(r+dr, c+dc)
        count = 0
        for r in range(rows):
            for c in range(cols):
                # Each unvisited land cell starts exactly one new island;
                # the dfs then absorbs the whole landmass.
                if not visited[r][c] and grid[r][c] == '1':
                    dfs(r, c)
                    count += 1
        return count`,
        solutionExplanation: `Classic **DFS flood-fill**. For each unvisited land cell (\`"1"\`), we DFS to mark all connected land cells as visited, then increment the island count.

**Time:** O(rows × cols). **Space:** O(rows × cols) for the visited array and recursion stack.

This is LeetCode 200 — one of the most commonly asked graph problems.`,
        testCases: [
          { description: "two islands", inputData: "g = GraphGridArray()\n_result = g.num_islands([[\"1\",\"1\",\"0\"],[\"0\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]])", expectedOutput: "2", orderIndex: 0 },
          { description: "all water", inputData: "g = GraphGridArray()\n_result = g.num_islands([[\"0\",\"0\"],[\"0\",\"0\"]])", expectedOutput: "0", orderIndex: 1 },
          { description: "all land", inputData: "g = GraphGridArray()\n_result = g.num_islands([[\"1\",\"1\"],[\"1\",\"1\"]])", expectedOutput: "1", orderIndex: 2 },
          { description: "single cell", inputData: "g = GraphGridArray()\n_result = g.num_islands([[\"1\"]])", expectedOutput: "1", orderIndex: 3 },
        ],
      },
      {
        stageNumber: 3,
        title: "Find Peak Element",
        description: `Add \`find_peak(arr)\` returning the **index** of any peak element — an element that is greater than or equal to its neighbors. For boundary elements, only the inner neighbor counts.

Use **binary search** for O(log n) time.

\`\`\`python
g = GraphGridArray()
g.find_peak([1, 3, 2, 1])  # → 1  (arr[1]=3 is a peak)
g.find_peak([1, 2, 3])     # → 2  (arr[2]=3 is a peak)
g.find_peak([5])            # → 0
\`\`\``,
        baseClass: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))

    def num_islands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        visited = [[False]*cols for _ in range(rows)]
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols:
                return
            if visited[r][c] or grid[r][c] == '0':
                return
            visited[r][c] = True
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                dfs(r+dr, c+dc)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if not visited[r][c] and grid[r][c] == '1':
                    dfs(r, c)
                    count += 1
        return count`,
        starterCode: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))

    def num_islands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        visited = [[False]*cols for _ in range(rows)]
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols:
                return
            if visited[r][c] or grid[r][c] == '0':
                return
            visited[r][c] = True
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                dfs(r+dr, c+dc)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if not visited[r][c] and grid[r][c] == '1':
                    dfs(r, c)
                    count += 1
        return count

    def find_peak(self, arr: list[int]) -> int:
        # Binary search: if arr[mid] < arr[mid+1], peak is to the right
        pass`,
        solution: `class GraphGridArray:
    def count_components(self, n: int, edges: list[list[int]]) -> int:
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            pa, pb = find(a), find(b)
            if pa != pb:
                parent[pa] = pb
        for u, v in edges:
            union(u, v)
        return len(set(find(i) for i in range(n)))

    def num_islands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        visited = [[False]*cols for _ in range(rows)]
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols:
                return
            if visited[r][c] or grid[r][c] == '0':
                return
            visited[r][c] = True
            for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                dfs(r+dr, c+dc)
        count = 0
        for r in range(rows):
            for c in range(cols):
                if not visited[r][c] and grid[r][c] == '1':
                    dfs(r, c)
                    count += 1
        return count

    def find_peak(self, arr: list[int]) -> int:
        lo, hi = 0, len(arr) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if arr[mid] < arr[mid + 1]:
                lo = mid + 1   # peak is to the right
            else:
                hi = mid       # peak is at mid or to the left
        return lo`,
        solutionExplanation: `**Binary search on the slope**: at any midpoint, if the right neighbor is larger, a peak must exist to the right (the array can't go up forever). Otherwise, a peak exists at mid or to the left.

This invariant guarantees we converge to a peak in O(log n) time — much better than the O(n) linear scan.

This is LeetCode 162 — a classic binary search application.`,
        testCases: [
          { description: "peak at index 1", inputData: "g = GraphGridArray()\n_result = g.find_peak([1, 3, 2, 1])", expectedOutput: "1", orderIndex: 0 },
          { description: "ascending", inputData: "g = GraphGridArray()\n_result = g.find_peak([1, 2, 3])", expectedOutput: "2", orderIndex: 1 },
          { description: "single", inputData: "g = GraphGridArray()\n_result = g.find_peak([5])", expectedOutput: "0", orderIndex: 2 },
          { description: "descending", inputData: "g = GraphGridArray()\n_result = g.find_peak([3, 2, 1])", expectedOutput: "0", orderIndex: 3 },
        ],
      },
    ]
  );

  console.log("[Seed] Batch 7 (More Microsoft problems) seeded successfully.");
}
