import { seedStagedProblemIfNotExists } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Batch 3: 3 Figma + 5 Anthropic staged problems
// Figma:     18001 – Graph Reachability For File Permissions (3 stages)
//            19001 – Document Editor with Undo/Redo and Batching (4 stages)
//            20001 – File/Folder/Team Permissions Fewest Grants (already exists as 16001)
// Anthropic: 21001 – File Deduplication (3 stages)
//            22001 – In-Memory Banking Service (4 stages)
//            23001 – In-Memory KV Store with TTL (3 stages)
//            24001 – Image Processing Pipeline (3 stages)
//            25001 – Same-Host Web Crawler (3 stages)
// ─────────────────────────────────────────────────────────────────────────────

export async function seedBatch3Problems(): Promise<void> {

  // ── Figma: Graph Reachability For File Permissions ─────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 18001,
      slug: "graph-reachability-file-permissions",
      title: "Graph Reachability For File Permissions",
      difficulty: "Medium",
      badges: "figma",
      tags: "graph,bfs,dfs",
      description: `Figma models file-permission inheritance as a directed graph where an edge (A → B) means "A grants access to B". Given such a graph, answer reachability queries: can a user at node \`source\` reach node \`destination\`?

The problem has three progressively harder variants:
- **Stage 1** – directed graph (follow edges only in their direction)
- **Stage 2** – undirected graph (edges can be traversed both ways)
- **Stage 3** – directed graph with a set of blocked edges that cannot be used

Implement a \`PermissionGraph\` class that supports all three query modes.`,
      starterCode: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        pass

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        pass

    def has_path_with_blocked_edges(self, n: int, edges: list, blocked: set, source: int, destination: int) -> bool:
        pass`,
      methodName: "PermissionGraph",
    },
    [
      {
        stageNumber: 1,
        title: "Directed Graph Reachability",
        description: `Implement \`has_path_directed(n, edges, source, destination)\` that returns \`True\` if there is a directed path from \`source\` to \`destination\`.

**Parameters:**
- \`n\` – number of nodes (labeled 0 to n-1)
- \`edges\` – list of \`(u, v)\` tuples representing directed edges u → v
- \`source\`, \`destination\` – query nodes

**Constraints:**
- The graph may contain cycles — use a visited set
- 0 ≤ source, destination < n
- \`source == destination\` should return \`True\`

**Example:**
\`\`\`
n=3, edges=[(0,1),(1,2)], source=0, dest=2  →  True
n=3, edges=[(1,0)],       source=0, dest=1  →  False  (edge goes 1→0, not 0→1)
\`\`\``,
        baseClass: `class PermissionGraph:
    def __init__(self):
        pass`,
        starterCode: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        # Build adjacency list and run BFS/DFS
        pass`,
        solution: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        # Early exit: a node always reaches itself
        if source == destination:
            return True
        # Build directed adjacency list
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        # BFS from source
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
        solutionExplanation: "Build a directed adjacency list from the edge list. Run BFS from source, tracking visited nodes to handle cycles. Return True as soon as destination is found.",
        testCases: [
          { description: 'path exists: 0->1->2', inputData: `g = PermissionGraph()\n_result = g.has_path_directed(3, [(0,1),(1,2)], 0, 2)`, expectedOutput: 'True', orderIndex: 0 },
          { description: 'no path: edge goes wrong way', inputData: `g = PermissionGraph()\n_result = g.has_path_directed(3, [(1,0)], 0, 1)`, expectedOutput: 'False', orderIndex: 1 },
          { description: 'source equals destination', inputData: `g = PermissionGraph()\n_result = g.has_path_directed(3, [(0,1)], 2, 2)`, expectedOutput: 'True', orderIndex: 2 },
          { description: 'cycle does not cause infinite loop', inputData: `g = PermissionGraph()\n_result = g.has_path_directed(3, [(0,1),(1,0)], 0, 2)`, expectedOutput: 'False', orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Undirected Graph Reachability",
        description: `Extend \`PermissionGraph\` with \`has_path_undirected(n, edges, source, destination)\`.

In this variant, treat every edge as **bidirectional**: if there is an edge (u, v), you can traverse it as u→v or v→u.

**Example:**
\`\`\`
n=3, edges=[(1,0)], source=0, dest=1  →  True  (can go 0→1 via the reversed edge)
n=4, edges=[(0,1),(2,3)], source=0, dest=3  →  False  (two disconnected components)
\`\`\``,
        baseClass: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
        starterCode: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        # Build undirected adjacency list (add both directions)
        pass`,
        solution: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        # Build undirected adjacency list: add both u->v and v->u
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
            adj.setdefault(v, []).append(u)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
        solutionExplanation: "Same BFS but build the adjacency list with both directions for each edge.",
        testCases: [
          { description: 'reversed edge is traversable undirected', inputData: `g = PermissionGraph()\n_result = g.has_path_undirected(3, [(1,0)], 0, 1)`, expectedOutput: 'True', orderIndex: 0 },
          { description: 'disconnected components', inputData: `g = PermissionGraph()\n_result = g.has_path_undirected(4, [(0,1),(2,3)], 0, 3)`, expectedOutput: 'False', orderIndex: 1 },
          { description: 'directed path also works undirected', inputData: `g = PermissionGraph()\n_result = g.has_path_undirected(3, [(0,1),(1,2)], 2, 0)`, expectedOutput: 'True', orderIndex: 2 },
        ],
      },
      {
        stageNumber: 3,
        title: "Directed Reachability with Blocked Edges",
        description: `Extend \`PermissionGraph\` with \`has_path_with_blocked_edges(n, edges, blocked, source, destination)\`.

This is a **directed** traversal, but certain edges are blocked and must not be used.

**Parameters:**
- \`blocked\` – a \`set\` of \`(u, v)\` tuples; the edge u→v cannot be traversed
- Both directions of a blocked edge are blocked in undirected interpretation, but here we only block the exact directed edge (u, v) in the blocked set

**Example:**
\`\`\`
n=3, edges=[(0,1),(1,2)], blocked={(1,2)}, source=0, dest=2  →  False
n=3, edges=[(0,1),(1,2),(0,2)], blocked={(1,2)}, source=0, dest=2  →  True  (via 0→2)
\`\`\``,
        baseClass: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
            adj.setdefault(v, []).append(u)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
        starterCode: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
            adj.setdefault(v, []).append(u)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_with_blocked_edges(self, n: int, edges: list, blocked: set, source: int, destination: int) -> bool:
        # Skip edges in the blocked set
        pass`,
        solution: `class PermissionGraph:
    def __init__(self):
        pass

    def has_path_directed(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_undirected(self, n: int, edges: list, source: int, destination: int) -> bool:
        if source == destination:
            return True
        adj = {}
        for u, v in edges:
            adj.setdefault(u, []).append(v)
            adj.setdefault(v, []).append(u)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False

    def has_path_with_blocked_edges(self, n: int, edges: list, blocked: set, source: int, destination: int) -> bool:
        if source == destination:
            return True
        # Build adjacency list, skipping blocked edges
        adj = {}
        for u, v in edges:
            if (u, v) not in blocked:
                adj.setdefault(u, []).append(v)
        visited = {source}
        queue = [source]
        while queue:
            node = queue.pop(0)
            for neighbor in adj.get(node, []):
                if neighbor == destination:
                    return True
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
        solutionExplanation: "Filter out blocked edges when building the adjacency list, then run standard directed BFS.",
        testCases: [
          { description: 'only path is blocked', inputData: `g = PermissionGraph()\n_result = g.has_path_with_blocked_edges(3, [(0,1),(1,2)], {(1,2)}, 0, 2)`, expectedOutput: 'False', orderIndex: 0 },
          { description: 'alternate path avoids blocked edge', inputData: `g = PermissionGraph()\n_result = g.has_path_with_blocked_edges(3, [(0,1),(1,2),(0,2)], {(1,2)}, 0, 2)`, expectedOutput: 'True', orderIndex: 1 },
          { description: 'no blocked edges behaves like directed', inputData: `g = PermissionGraph()\n_result = g.has_path_with_blocked_edges(3, [(0,1),(1,2)], set(), 0, 2)`, expectedOutput: 'True', orderIndex: 2 },
          { description: 'blocked edge in reverse direction does not affect forward path', inputData: `g = PermissionGraph()\n_result = g.has_path_with_blocked_edges(3, [(0,1),(1,2)], {(2,1)}, 0, 2)`, expectedOutput: 'True', orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Figma: Document Editor with Undo/Redo and Batching ─────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 19001,
      slug: "document-editor-undo-redo-batching",
      title: "Document Editor with Undo/Redo and Batching",
      difficulty: "Medium",
      badges: "figma",
      tags: "string,stack,design",
      description: `Design a document-editing layer that supports applying edits and undo/redo with transactional batching.

This is the #1 most-reported Figma phone-screen question. The document starts as an empty string.

**Operations:**
- \`apply(op)\` – apply an edit operation to the document
- \`undo()\` – revert the most recent operation (or batch)
- \`redo()\` – reapply the most recently undone operation (or batch)
- \`get()\` – return the current document text
- \`begin_batch()\` / \`commit_batch()\` – group multiple applies into one atomic undo unit

**Edit operation types:**
- \`insert(index, text)\` – insert text at position index
- \`delete(start, end)\` – remove characters from start (inclusive) to end (exclusive)
- \`replace(start, end, text)\` – replace characters from start to end with text

The problem is implemented in 4 progressive stages.`,
      starterCode: `class DocumentEditor:
    def __init__(self):
        self.text = ""

    def apply(self, op: list) -> None:
        pass

    def undo(self) -> None:
        pass

    def get(self) -> str:
        return self.text`,
      methodName: "DocumentEditor",
    },
    [
      {
        stageNumber: 1,
        title: "Basic Document Editing with Undo",
        description: `Implement a small document-editing simulator. The document starts as an empty string.

Support three commands:
- \`['apply', 'insert', index, text]\` – insert \`text\` at position \`index\`
- \`['apply', 'delete', start, end]\` – remove characters \`[start, end)\` (half-open range)
- \`['apply', 'replace', start, end, text]\` – replace characters \`[start, end)\` with \`text\`
- \`['get']\` – return current document text (append to output list)
- \`['undo']\` – revert the most recent applied operation; no-op if history is empty

**Example:**
\`\`\`
commands = [['apply','insert','0','hello'],['get'],['apply','insert','5',' world'],['get'],
            ['undo'],['get'],['undo'],['get'],['undo'],['get']]
output   = ['hello', 'hello world', 'hello', '', '']
\`\`\`
The final \`undo\` has no effect because history is empty.`,
        baseClass: `class DocumentEditor:
    def __init__(self):
        self.text = ""`,
        starterCode: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []  # stack of inverse operations

    def _apply_op(self, op: list) -> None:
        """Apply a single operation and push its inverse onto history."""
        pass

    def apply(self, op: list) -> None:
        self._apply_op(op)

    def undo(self) -> None:
        pass

    def get(self) -> str:
        return self.text`,
        solution: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []  # stack of inverse operations

    def _apply_op(self, op: list) -> None:
        """Apply a single operation and record its inverse for undo."""
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1])
            txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            # Inverse: delete the inserted characters
            self.history.append(['delete', idx, idx + len(txt)])
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            # Inverse: re-insert the removed text
            self.history.append(['insert', start, removed])
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            new_text = op[3]
            old_text = self.text[start:end]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            # Inverse: replace back with old text
            self.history.append(['replace', start, start + len(new_text), old_text])

    def apply(self, op: list) -> None:
        self._apply_op(op)

    def undo(self) -> None:
        if not self.history:
            return
        inv = self.history.pop()
        # Apply inverse directly without recording to history
        kind = inv[0]
        if kind == 'insert':
            idx, txt = int(inv[1]), inv[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + inv[3] + self.text[end:]

    def get(self) -> str:
        return self.text


def solution(commands):
    editor = DocumentEditor()
    output = []
    for cmd in commands:
        if cmd[0] == 'apply':
            editor.apply(cmd[1:])
        elif cmd[0] == 'get':
            output.append(editor.get())
        elif cmd[0] == 'undo':
            editor.undo()
    return output`,
        solutionExplanation: "For each apply, record the inverse operation on a history stack. Undo pops and applies the inverse directly.",
        testCases: [
          { description: 'basic insert and undo', inputData: `_result = solution([['apply','insert','0','hello'],['get'],['undo'],['get']])`, expectedOutput: `['hello', '']`, orderIndex: 0 },
          { description: 'two inserts undone in order', inputData: `_result = solution([['apply','insert','0','hello'],['get'],['apply','insert','5',' world'],['get'],['undo'],['get'],['undo'],['get'],['undo'],['get']])`, expectedOutput: `['hello', 'hello world', 'hello', '', '']`, orderIndex: 1 },
          { description: 'delete and undo restores text', inputData: `_result = solution([['apply','insert','0','abcdef'],['apply','delete','2','4'],['get'],['undo'],['get']])`, expectedOutput: `['abef', 'abcdef']`, orderIndex: 2 },
          { description: 'replace and undo', inputData: `_result = solution([['apply','insert','0','hello'],['apply','replace','1','4','XY'],['get'],['undo'],['get']])`, expectedOutput: `['hXYo', 'hello']`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Transactional Batches with Atomic Undo",
        description: `Extend the document editor with transactional batching.

Add two new commands:
- \`['begin']\` – start a batch
- \`['commit']\` – commit the batch; all applies since \`begin\` form one atomic undo unit

**Rules:**
- Edits outside a batch are individual undo units
- \`undo()\` reverts the entire committed batch atomically
- Empty batches (begin then commit with no applies) create no undo-history entry
- No nested batches; \`undo\` is not called while a batch is open

**Example:**
\`\`\`
commands = [['apply','insert','0','abcdef'],
            ['begin'],['apply','replace','1','4','X'],['apply','insert','2','Y'],['commit'],
            ['get'],['undo'],['get'],['undo'],['get']]
output   = ['aXYef', 'abcdef', '']
\`\`\``,
        baseClass: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []

    def _apply_op(self, op: list) -> None:
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            self.history.append(['delete', idx, idx + len(txt)])
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            self.history.append(['insert', start, removed])
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            self.history.append(['replace', start, start + len(new_text), old_text])

    def _exec_inv(self, inv):
        kind = inv[0]
        if kind == 'insert':
            idx, txt = int(inv[1]), inv[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + inv[3] + self.text[end:]

    def apply(self, op: list) -> None:
        self._apply_op(op)

    def undo(self) -> None:
        if not self.history:
            return
        inv = self.history.pop()
        self._exec_inv(inv)

    def get(self) -> str:
        return self.text`,
        starterCode: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []   # each entry is either one inverse op, or a list of inverse ops (batch)
        self._batch = None  # None when not in batch; list of inverse ops when in batch

    def _apply_op(self, op: list) -> None:
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            inv = ['delete', idx, idx + len(txt)]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            inv = ['insert', start, removed]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            inv = ['replace', start, start + len(new_text), old_text]
        # Store inverse in batch buffer or directly in history
        if self._batch is not None:
            self._batch.append(inv)
        else:
            self.history.append(inv)

    def begin_batch(self) -> None:
        self._batch = []

    def commit_batch(self) -> None:
        # TODO: push batch inverses as one atomic history entry (if non-empty)
        pass

    def apply(self, op: list) -> None:
        self._apply_op(op)

    def undo(self) -> None:
        # TODO: handle both single-op and batch undo
        pass

    def get(self) -> str:
        return self.text`,
        solution: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        # History: each entry is one inverse op (list) or a list of inverse ops (batch)
        self.history = []
        self._batch = None  # None = not in batch; list = accumulating batch inverses

    def _apply_op(self, op: list) -> None:
        """Apply op and record its inverse in the batch buffer or history."""
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            inv = ['delete', idx, idx + len(txt)]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            inv = ['insert', start, removed]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            inv = ['replace', start, start + len(new_text), old_text]
        if self._batch is not None:
            self._batch.append(inv)
        else:
            self.history.append(inv)

    def _exec_inv(self, inv):
        """Execute a single inverse operation without recording."""
        kind = inv[0]
        if kind == 'insert':
            idx, txt = int(inv[1]), inv[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + inv[3] + self.text[end:]

    def begin_batch(self) -> None:
        self._batch = []

    def commit_batch(self) -> None:
        """Commit batch: push list of inverses as one atomic history entry (skip if empty)."""
        if self._batch:
            self.history.append(self._batch)  # push as a list (batch marker)
        self._batch = None

    def apply(self, op: list) -> None:
        self._apply_op(op)

    def undo(self) -> None:
        if not self.history:
            return
        entry = self.history.pop()
        if isinstance(entry[0], list):
            # Batch: apply inverses in reverse order
            for inv in reversed(entry):
                self._exec_inv(inv)
        else:
            self._exec_inv(entry)

    def get(self) -> str:
        return self.text


def solution(commands):
    editor = DocumentEditor()
    output = []
    for cmd in commands:
        if cmd[0] == 'apply':
            editor.apply(cmd[1:])
        elif cmd[0] == 'get':
            output.append(editor.get())
        elif cmd[0] == 'undo':
            editor.undo()
        elif cmd[0] == 'begin':
            editor.begin_batch()
        elif cmd[0] == 'commit':
            editor.commit_batch()
    return output`,
        solutionExplanation: "Track a batch buffer. On commit, push the list of inverses as one atomic history entry. Undo checks if the entry is a batch (list of lists) and applies all inverses in reverse.",
        testCases: [
          { description: 'batch undo reverts all ops atomically', inputData: `_result = solution([['apply','insert','0','abcdef'],['begin'],['apply','replace','1','4','X'],['apply','insert','2','Y'],['commit'],['get'],['undo'],['get'],['undo'],['get']])`, expectedOutput: `['aXYef', 'abcdef', '']`, orderIndex: 0 },
          { description: 'empty batch creates no history entry', inputData: `_result = solution([['apply','insert','0','A'],['begin'],['commit'],['get'],['undo'],['get']])`, expectedOutput: `['A', '']`, orderIndex: 1 },
          { description: 'batch and single op interleaved', inputData: `_result = solution([['apply','insert','0','A'],['begin'],['apply','insert','1','B'],['apply','insert','2','C'],['commit'],['get'],['undo'],['get'],['apply','insert','1','D'],['get'],['undo'],['get']])`, expectedOutput: `['ABC', 'A', 'AD', 'A']`, orderIndex: 2 },
        ],
      },
      {
        stageNumber: 3,
        title: "Undo and Redo for Single Edits and Batches",
        description: `Extend the batched editor with \`redo()\`.

**Rules:**
- \`undo()\` moves the most recent history unit to the redo stack and reverts it
- \`redo()\` reapplies the most recently undone unit
- Any new \`apply\` command **invalidates all redo history** (clears the redo stack)
- \`undo\` and \`redo\` on empty stacks are no-ops
- Redo works for both single edits and committed batches

**Example:**
\`\`\`
commands = [['apply','insert','0','abcdef'],
            ['begin'],['apply','replace','1','4','X'],['apply','insert','2','Y'],['commit'],
            ['get'],['undo'],['get'],['redo'],['get'],['undo'],['get']]
output   = ['aXYef', 'abcdef', 'aXYef', 'abcdef']
\`\`\``,
        baseClass: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []
        self._batch = None

    def _apply_op(self, op, record=True):
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            inv = ['delete', idx, idx + len(txt)]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            inv = ['insert', start, removed]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            inv = ['replace', start, start + len(new_text), old_text]
        if record:
            if self._batch is not None:
                self._batch.append(inv)
            else:
                self.history.append(inv)
        return inv

    def _exec_inv(self, inv):
        kind = inv[0]
        if kind == 'insert':
            idx, txt = int(inv[1]), inv[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + inv[3] + self.text[end:]

    def begin_batch(self): self._batch = []
    def commit_batch(self):
        if self._batch: self.history.append(self._batch)
        self._batch = None
    def apply(self, op): self._apply_op(op)
    def undo(self):
        if not self.history: return
        entry = self.history.pop()
        if isinstance(entry[0], list):
            for inv in reversed(entry): self._exec_inv(inv)
        else:
            self._exec_inv(entry)
    def get(self): return self.text`,
        starterCode: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        self.history = []   # undo stack
        self.redo_stack = []  # redo stack
        self._batch = None

    def _apply_op(self, op, record=True):
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            inv = ['delete', idx, idx + len(txt)]
            fwd = ['insert', idx, txt]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            inv = ['insert', start, removed]
            fwd = ['delete', start, end]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            inv = ['replace', start, start + len(new_text), old_text]
            fwd = ['replace', start, end, new_text]
        if record:
            if self._batch is not None:
                self._batch.append((fwd, inv))
            else:
                self.history.append((fwd, inv))
                self.redo_stack.clear()  # any new apply clears redo
        return inv

    def _exec_inv(self, inv):
        kind = inv[0]
        if kind == 'insert':
            idx, txt = int(inv[1]), inv[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(inv[1]), int(inv[2])
            self.text = self.text[:start] + inv[3] + self.text[end:]

    def begin_batch(self): self._batch = []
    def commit_batch(self):
        if self._batch:
            self.history.append(self._batch)
            self.redo_stack.clear()
        self._batch = None

    def apply(self, op): self._apply_op(op)

    def undo(self):
        # TODO: pop from history, push to redo_stack, apply inverses
        pass

    def redo(self):
        # TODO: pop from redo_stack, push to history, apply forward ops
        pass

    def get(self): return self.text`,
        solution: `class DocumentEditor:
    def __init__(self):
        self.text = ""
        # Each history entry: (fwd_ops, inv_ops) for single; list of (fwd, inv) for batch
        self.history = []
        self.redo_stack = []
        self._batch = None

    def _exec_op(self, op):
        """Execute an operation (forward or inverse) without recording."""
        kind = op[0]
        if kind == 'insert':
            idx, txt = int(op[1]), op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            self.text = self.text[:start] + self.text[end:]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            self.text = self.text[:start] + op[3] + self.text[end:]

    def _make_inv(self, op):
        """Compute inverse of op and apply op to self.text; return (fwd, inv)."""
        kind = op[0]
        if kind == 'insert':
            idx = int(op[1]); txt = op[2]
            self.text = self.text[:idx] + txt + self.text[idx:]
            return op, ['delete', idx, idx + len(txt)]
        elif kind == 'delete':
            start, end = int(op[1]), int(op[2])
            removed = self.text[start:end]
            self.text = self.text[:start] + self.text[end:]
            return op, ['insert', start, removed]
        elif kind == 'replace':
            start, end = int(op[1]), int(op[2])
            old_text = self.text[start:end]; new_text = op[3]
            self.text = self.text[:start] + new_text + self.text[start + (end - start):]
            return op, ['replace', start, start + len(new_text), old_text]

    def begin_batch(self): self._batch = []

    def commit_batch(self):
        if self._batch:
            self.history.append(self._batch)  # list of (fwd, inv) pairs
            self.redo_stack.clear()
        self._batch = None

    def apply(self, op: list) -> None:
        pair = self._make_inv(op)
        if self._batch is not None:
            self._batch.append(pair)
        else:
            self.history.append(pair)
            self.redo_stack.clear()  # new apply invalidates redo

    def undo(self) -> None:
        if not self.history: return
        entry = self.history.pop()
        self.redo_stack.append(entry)
        if isinstance(entry, list):
            # Batch: apply inverses in reverse order
            for _, inv in reversed(entry):
                self._exec_op(inv)
        else:
            self._exec_op(entry[1])  # apply inverse

    def redo(self) -> None:
        if not self.redo_stack: return
        entry = self.redo_stack.pop()
        self.history.append(entry)
        if isinstance(entry, list):
            # Batch: apply forward ops in original order
            for fwd, _ in entry:
                self._exec_op(fwd)
        else:
            self._exec_op(entry[0])  # apply forward op

    def get(self) -> str:
        return self.text


def solution(commands):
    editor = DocumentEditor()
    output = []
    for cmd in commands:
        if cmd[0] == 'apply':
            editor.apply(cmd[1:])
        elif cmd[0] == 'get':
            output.append(editor.get())
        elif cmd[0] == 'undo':
            editor.undo()
        elif cmd[0] == 'redo':
            editor.redo()
        elif cmd[0] == 'begin':
            editor.begin_batch()
        elif cmd[0] == 'commit':
            editor.commit_batch()
    return output`,
        solutionExplanation: "Store (fwd, inv) pairs. Undo pops to redo_stack and applies inverses. Redo pops from redo_stack back to history and applies forward ops. New apply clears redo_stack.",
        testCases: [
          { description: 'basic undo then redo', inputData: `_result = solution([['apply','insert','0','abc'],['get'],['undo'],['get'],['redo'],['get'],['redo'],['get']])`, expectedOutput: `['abc', '', 'abc', 'abc']`, orderIndex: 0 },
          { description: 'batch undo and redo', inputData: `_result = solution([['apply','insert','0','abcdef'],['begin'],['apply','replace','1','4','X'],['apply','insert','2','Y'],['commit'],['get'],['undo'],['get'],['redo'],['get'],['undo'],['get']])`, expectedOutput: `['aXYef', 'abcdef', 'aXYef', 'abcdef']`, orderIndex: 1 },
          { description: 'new apply clears redo stack', inputData: `_result = solution([['apply','insert','0','A'],['undo'],['apply','insert','0','B'],['redo'],['get']])`, expectedOutput: `['B']`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Anthropic: File Deduplication ──────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 21001,
      slug: "file-deduplication",
      title: "File Deduplication",
      difficulty: "Medium",
      badges: "anthropic",
      tags: "hashing,filesystem,design",
      description: `One of Anthropic's most frequently reported coding questions (756+ solvers on prachub).

Given a directory tree, identify groups of duplicate files — files whose byte content is identical. The challenge has three stages of increasing sophistication:

- **Stage 1** – given a flat list of \`(path, content)\` pairs, return groups of duplicate paths
- **Stage 2** – given a nested directory structure, recursively find duplicates without loading entire files into memory (use size pre-filter + hash)
- **Stage 3** – handle very large files using chunked hashing (content-defined chunking)`,
      starterCode: `class FileDeduplicator:
    def find_duplicates(self, files: list) -> list:
        """files: list of (path, content) tuples. Return list of groups (each group is a list of paths)."""        pass`,
      methodName: "FileDeduplicator",
    },
    [
      {
        stageNumber: 1,
        title: "Group Duplicate Files by Content Hash",
        description: `Implement \`find_duplicates(files)\` where \`files\` is a list of \`(path, content)\` tuples.

Return a list of groups, where each group is a list of file paths that have identical content. Only include groups with 2 or more files. Groups and paths within groups can be in any order.

**Example:**
\`\`\`
files = [('/a/f1.txt', 'hello'), ('/b/f2.txt', 'world'), ('/c/f3.txt', 'hello')]
result = [['/a/f1.txt', '/c/f3.txt']]
\`\`\`

**Constraints:**
- Use hashing (e.g., MD5 or SHA-256) to group files — do not compare content directly
- Each path is unique; content may be any string`,
        baseClass: `class FileDeduplicator:
    pass`,
        starterCode: `import hashlib
from collections import defaultdict

class FileDeduplicator:
    def find_duplicates(self, files: list) -> list:
        """Group files by content hash and return groups of size >= 2."""
        pass`,
        solution: `import hashlib
from collections import defaultdict

class FileDeduplicator:
    def _hash(self, content: str) -> str:
        """Compute SHA-256 hash of content string."""        return hashlib.sha256(content.encode()).hexdigest()

    def find_duplicates(self, files: list) -> list:
        """Group files by content hash; return groups with 2+ files."""        groups = defaultdict(list)
        for path, content in files:
            h = self._hash(content)
            groups[h].append(path)
        # Return only groups with duplicates, sorted for determinism
        return [sorted(paths) for paths in groups.values() if len(paths) >= 2]`,
        solutionExplanation: "Hash each file content with SHA-256. Group paths by hash. Return groups with 2+ entries.",
        testCases: [
          { description: 'two identical files found', inputData: `d = FileDeduplicator()\n_result = sorted(d.find_duplicates([('/a/f1.txt', 'hello'), ('/b/f2.txt', 'world'), ('/c/f3.txt', 'hello')]))`, expectedOutput: `[['/a/f1.txt', '/c/f3.txt']]`, orderIndex: 0 },
          { description: 'no duplicates returns empty list', inputData: `d = FileDeduplicator()\n_result = d.find_duplicates([('/a.txt', 'abc'), ('/b.txt', 'def')])`, expectedOutput: `[]`, orderIndex: 1 },
          { description: 'three identical files form one group', inputData: `d = FileDeduplicator()\n_result = sorted(d.find_duplicates([('/1.txt','x'),('/2.txt','x'),('/3.txt','x')]))`, expectedOutput: `[['/1.txt', '/2.txt', '/3.txt']]`, orderIndex: 2 },
          { description: 'two separate duplicate groups', inputData: `d = FileDeduplicator()\nresult = d.find_duplicates([('/a.txt','A'),('/b.txt','B'),('/c.txt','A'),('/d.txt','B')])\n_result = sorted([sorted(g) for g in result])`, expectedOutput: `[['/a.txt', '/c.txt'], ['/b.txt', '/d.txt']]`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Two-Pass Deduplication with Size Pre-filter",
        description: `Extend \`FileDeduplicator\` with \`find_duplicates_efficient(files)\` that avoids hashing files that cannot possibly be duplicates.

**Strategy:**
1. Group files by size first (files with different sizes cannot be duplicates)
2. Within each size group, hash only the files in that group
3. Return groups of paths with identical content

This is important for large directory trees where most files are unique — the size pre-filter avoids reading most files.

**Example:**
\`\`\`
files = [('/a.txt', 'hi'), ('/b.txt', 'hello'), ('/c.txt', 'hi'), ('/d.txt', 'world')]
result = [['/a.txt', '/c.txt']]   # 'hi' appears twice; others are unique sizes
\`\`\``,
        baseClass: `import hashlib
from collections import defaultdict

class FileDeduplicator:
    def _hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()

    def find_duplicates(self, files: list) -> list:
        groups = defaultdict(list)
        for path, content in files:
            groups[self._hash(content)].append(path)
        return [sorted(paths) for paths in groups.values() if len(paths) >= 2]`,
        starterCode: `import hashlib
from collections import defaultdict

class FileDeduplicator:
    def _hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()

    def find_duplicates(self, files: list) -> list:
        groups = defaultdict(list)
        for path, content in files:
            groups[self._hash(content)].append(path)
        return [sorted(paths) for paths in groups.values() if len(paths) >= 2]

    def find_duplicates_efficient(self, files: list) -> list:
        """Two-pass: group by size, then hash within each size group."""        pass`,
        solution: `import hashlib
from collections import defaultdict

class FileDeduplicator:
    def _hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()

    def find_duplicates(self, files: list) -> list:
        groups = defaultdict(list)
        for path, content in files:
            groups[self._hash(content)].append(path)
        return [sorted(paths) for paths in groups.values() if len(paths) >= 2]

    def find_duplicates_efficient(self, files: list) -> list:
        """Two-pass dedup: size pre-filter then hash within size groups."""        # Pass 1: group by file size (len of content)
        by_size = defaultdict(list)
        for path, content in files:
            by_size[len(content)].append((path, content))
        # Pass 2: within each size group, hash and group by hash
        result = []
        for size_group in by_size.values():
            if len(size_group) < 2:
                continue  # unique size — skip hashing entirely
            by_hash = defaultdict(list)
            for path, content in size_group:
                by_hash[self._hash(content)].append(path)
            for paths in by_hash.values():
                if len(paths) >= 2:
                    result.append(sorted(paths))
        return result`,
        solutionExplanation: "First group by content length (O(1) per file). Only hash within size groups that have 2+ files, avoiding unnecessary hashing of unique-size files.",
        testCases: [
          { description: 'size pre-filter skips unique sizes', inputData: `d = FileDeduplicator()\n_result = sorted(d.find_duplicates_efficient([('/a.txt','hi'),('/b.txt','hello'),('/c.txt','hi'),('/d.txt','world')]))`, expectedOutput: `[['/a.txt', '/c.txt']]`, orderIndex: 0 },
          { description: 'same size but different content', inputData: `d = FileDeduplicator()\n_result = d.find_duplicates_efficient([('/a.txt','ab'),('/b.txt','cd'),('/c.txt','ab')])\n_result = sorted(_result)`, expectedOutput: `[['/a.txt', '/c.txt']]`, orderIndex: 1 },
          { description: 'all unique returns empty', inputData: `d = FileDeduplicator()\n_result = d.find_duplicates_efficient([('/a.txt','a'),('/b.txt','bb'),('/c.txt','ccc')])`, expectedOutput: `[]`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Anthropic: In-Memory Banking Service ────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 22001,
      slug: "in-memory-banking-service",
      title: "In-Memory Banking Service",
      difficulty: "Medium",
      badges: "anthropic",
      tags: "design,simulation,hashmap",
      description: `One of Anthropic's most frequently reported coding questions (898+ solvers on prachub).

Design an in-memory banking service supporting timestamped operations. Implement a \`BankingService\` class with the following operations:

- \`create_account(account_id, timestamp)\` – create a new account; return \`True\` if created, \`False\` if already exists
- \`deposit(account_id, amount, timestamp)\` – add funds; return new balance or error
- \`withdraw(account_id, amount, timestamp)\` – subtract funds (fail if insufficient); return new balance or error
- \`transfer(from_id, to_id, amount, timestamp)\` – move funds between accounts
- \`get_balance(account_id, timestamp)\` – return balance at or before given timestamp

The problem is implemented in 3 progressive stages.`,
      starterCode: `class BankingService:
    def __init__(self):
        self.accounts = {}  # account_id -> balance

    def create_account(self, account_id: str, timestamp: int) -> bool:
        pass

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        pass

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        pass`,
      methodName: "BankingService",
    },
    [
      {
        stageNumber: 1,
        title: "Create, Deposit, and Withdraw",
        description: `Implement a \`BankingService\` with three operations:

- \`create_account(account_id, timestamp)\` → \`True\` if created, \`False\` if already exists
- \`deposit(account_id, amount, timestamp)\` → new balance as string, or \`"account not found"\` if account doesn't exist
- \`withdraw(account_id, amount, timestamp)\` → new balance as string, or \`"account not found"\` / \`"insufficient funds"\`

**Constraints:**
- \`amount\` is always positive
- Balances start at 0
- Timestamps are strictly increasing integers

**Example:**
\`\`\`
b = BankingService()
b.create_account('alice', 1)  # True
b.deposit('alice', 100, 2)    # '100'
b.withdraw('alice', 30, 3)    # '70'
b.withdraw('alice', 100, 4)   # 'insufficient funds'
b.deposit('bob', 50, 5)       # 'account not found'
\`\`\``,
        baseClass: `class BankingService:
    def __init__(self):
        self.accounts = {}`,
        starterCode: `class BankingService:
    def __init__(self):
        self.accounts = {}  # account_id -> balance

    def create_account(self, account_id: str, timestamp: int) -> bool:
        pass

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        pass

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        pass`,
        solution: `class BankingService:
    def __init__(self):
        self.accounts = {}  # account_id -> balance

    def create_account(self, account_id: str, timestamp: int) -> bool:
        """Create account with zero balance. Return False if already exists."""        if account_id in self.accounts:
            return False
        self.accounts[account_id] = 0
        return True

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        """Add amount to account. Return new balance or error string."""        if account_id not in self.accounts:
            return 'account not found'
        self.accounts[account_id] += amount
        return str(self.accounts[account_id])

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        """Subtract amount from account. Return new balance or error string."""        if account_id not in self.accounts:
            return 'account not found'
        if self.accounts[account_id] < amount:
            return 'insufficient funds'
        self.accounts[account_id] -= amount
        return str(self.accounts[account_id])`,
        solutionExplanation: "Simple dict mapping account_id to balance. Each operation validates existence and funds before mutating.",
        testCases: [
          { description: 'create and deposit', inputData: `b = BankingService()\nb.create_account('alice', 1)\n_result = b.deposit('alice', 100, 2)`, expectedOutput: `'100'`, orderIndex: 0 },
          { description: 'withdraw success', inputData: `b = BankingService()\nb.create_account('alice', 1)\nb.deposit('alice', 100, 2)\n_result = b.withdraw('alice', 30, 3)`, expectedOutput: `'70'`, orderIndex: 1 },
          { description: 'insufficient funds', inputData: `b = BankingService()\nb.create_account('alice', 1)\nb.deposit('alice', 50, 2)\n_result = b.withdraw('alice', 100, 3)`, expectedOutput: `'insufficient funds'`, orderIndex: 2 },
          { description: 'duplicate create returns False', inputData: `b = BankingService()\nb.create_account('alice', 1)\n_result = b.create_account('alice', 2)`, expectedOutput: `False`, orderIndex: 3 },
          { description: 'deposit to nonexistent account', inputData: `b = BankingService()\n_result = b.deposit('bob', 50, 1)`, expectedOutput: `'account not found'`, orderIndex: 4 },
        ],
      },
      {
        stageNumber: 2,
        title: "Transfer Between Accounts",
        description: `Extend \`BankingService\` with a \`transfer\` operation:

\`transfer(from_id, to_id, amount, timestamp)\` → new balance of \`from_id\` as string, or error string

**Error cases (return string):**
- \`"account not found"\` – either account doesn't exist
- \`"insufficient funds"\` – \`from_id\` has less than \`amount\`
- \`"cannot transfer to same account"\` – \`from_id == to_id\`

**Example:**
\`\`\`
b = BankingService()
b.create_account('alice', 1); b.create_account('bob', 2)
b.deposit('alice', 200, 3)
b.transfer('alice', 'bob', 50, 4)   # '150'
b.transfer('alice', 'bob', 200, 5)  # 'insufficient funds'
\`\`\``,
        baseClass: `class BankingService:
    def __init__(self):
        self.accounts = {}

    def create_account(self, account_id: str, timestamp: int) -> bool:
        if account_id in self.accounts: return False
        self.accounts[account_id] = 0
        return True

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        self.accounts[account_id] += amount
        return str(self.accounts[account_id])

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        if self.accounts[account_id] < amount: return 'insufficient funds'
        self.accounts[account_id] -= amount
        return str(self.accounts[account_id])`,
        starterCode: `class BankingService:
    def __init__(self):
        self.accounts = {}

    def create_account(self, account_id: str, timestamp: int) -> bool:
        if account_id in self.accounts: return False
        self.accounts[account_id] = 0
        return True

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        self.accounts[account_id] += amount
        return str(self.accounts[account_id])

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        if self.accounts[account_id] < amount: return 'insufficient funds'
        self.accounts[account_id] -= amount
        return str(self.accounts[account_id])

    def transfer(self, from_id: str, to_id: str, amount: int, timestamp: int) -> str:
        pass`,
        solution: `class BankingService:
    def __init__(self):
        self.accounts = {}

    def create_account(self, account_id: str, timestamp: int) -> bool:
        if account_id in self.accounts: return False
        self.accounts[account_id] = 0
        return True

    def deposit(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        self.accounts[account_id] += amount
        return str(self.accounts[account_id])

    def withdraw(self, account_id: str, amount: int, timestamp: int) -> str:
        if account_id not in self.accounts: return 'account not found'
        if self.accounts[account_id] < amount: return 'insufficient funds'
        self.accounts[account_id] -= amount
        return str(self.accounts[account_id])

    def transfer(self, from_id: str, to_id: str, amount: int, timestamp: int) -> str:
        """Transfer amount from from_id to to_id. Return new balance of from_id."""        if from_id == to_id:
            return 'cannot transfer to same account'
        if from_id not in self.accounts or to_id not in self.accounts:
            return 'account not found'
        if self.accounts[from_id] < amount:
            return 'insufficient funds'
        self.accounts[from_id] -= amount
        self.accounts[to_id] += amount
        return str(self.accounts[from_id])`,
        solutionExplanation: "Validate same-account, existence, and funds before atomically moving the amount.",
        testCases: [
          { description: 'successful transfer', inputData: `b = BankingService()\nb.create_account('alice',1)\nb.create_account('bob',2)\nb.deposit('alice',200,3)\n_result = b.transfer('alice','bob',50,4)`, expectedOutput: `'150'`, orderIndex: 0 },
          { description: 'transfer insufficient funds', inputData: `b = BankingService()\nb.create_account('alice',1)\nb.create_account('bob',2)\nb.deposit('alice',30,3)\n_result = b.transfer('alice','bob',50,4)`, expectedOutput: `'insufficient funds'`, orderIndex: 1 },
          { description: 'transfer to same account', inputData: `b = BankingService()\nb.create_account('alice',1)\nb.deposit('alice',100,2)\n_result = b.transfer('alice','alice',50,3)`, expectedOutput: `'cannot transfer to same account'`, orderIndex: 2 },
          { description: 'transfer nonexistent account', inputData: `b = BankingService()\nb.create_account('alice',1)\nb.deposit('alice',100,2)\n_result = b.transfer('alice','bob',50,3)`, expectedOutput: `'account not found'`, orderIndex: 3 },
        ],
      },
    ]
  );

  // ── Anthropic: In-Memory KV Store with TTL ──────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 23001,
      slug: "in-memory-kv-store-ttl",
      title: "In-Memory Key-Value Store with TTL",
      difficulty: "Medium",
      badges: "anthropic",
      tags: "design,hashmap,ttl",
      description: `One of Anthropic's most frequently reported coding questions (866+ solvers on prachub).

Design an in-memory key-value store that supports time-to-live (TTL) expiry, backup, and restore operations.

Implement a \`KVStore\` class with:
- \`set(key, value, ttl=None)\` – store key→value; if ttl given, key expires after ttl seconds
- \`get(key, timestamp)\` – return value if key exists and hasn't expired, else None
- \`delete(key)\` – remove a key
- \`backup(timestamp)\` – snapshot current state
- \`restore(timestamp)\` – restore to most recent backup at or before timestamp`,
      starterCode: `class KVStore:
    def __init__(self):
        pass

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        pass

    def get(self, key: str, timestamp: int) -> str:
        pass

    def delete(self, key: str) -> bool:
        pass`,
      methodName: "KVStore",
    },
    [
      {
        stageNumber: 1,
        title: "Basic Get, Set, Delete with TTL",
        description: `Implement a \`KVStore\` with three operations:

- \`set(key, value, timestamp, ttl=None)\` – store key→value. If \`ttl\` is given, the key expires at \`timestamp + ttl\` (exclusive).
- \`get(key, timestamp)\` – return value if key exists and \`timestamp < expiry\` (or no expiry). Return \`None\` if missing or expired.
- \`delete(key)\` – remove key; return \`True\` if it existed, \`False\` otherwise.

**Example:**
\`\`\`
kv = KVStore()
kv.set('x', '10', 1, ttl=5)   # expires at t=6
kv.get('x', 5)                 # '10'
kv.get('x', 6)                 # None (expired)
kv.set('y', '20', 1)           # no expiry
kv.get('y', 100)               # '20'
kv.delete('y')                 # True
kv.get('y', 2)                 # None
\`\`\``,
        baseClass: `class KVStore:
    def __init__(self):
        pass`,
        starterCode: `class KVStore:
    def __init__(self):
        # store: key -> (value, expiry_timestamp or None)
        self.store = {}

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        pass

    def get(self, key: str, timestamp: int) -> str:
        pass

    def delete(self, key: str) -> bool:
        pass`,
        solution: `class KVStore:
    def __init__(self):
        # store: key -> (value, expiry_timestamp or None)
        self.store = {}

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        """Store key with optional TTL expiry."""        expiry = timestamp + ttl if ttl is not None else None
        self.store[key] = (value, expiry)

    def get(self, key: str, timestamp: int):
        """Return value if key exists and not expired."""        if key not in self.store:
            return None
        value, expiry = self.store[key]
        if expiry is not None and timestamp >= expiry:
            return None  # expired
        return value

    def delete(self, key: str) -> bool:
        """Remove key. Return True if it existed."""        if key in self.store:
            del self.store[key]
            return True
        return False`,
        solutionExplanation: "Store (value, expiry) pairs. On get, check if current timestamp >= expiry to determine if expired.",
        testCases: [
          { description: 'key with TTL expires correctly', inputData: `kv = KVStore()\nkv.set('x','10',1,ttl=5)\n_result = [kv.get('x',5), kv.get('x',6)]`, expectedOutput: `['10', None]`, orderIndex: 0 },
          { description: 'key without TTL never expires', inputData: `kv = KVStore()\nkv.set('y','20',1)\n_result = kv.get('y',100)`, expectedOutput: `'20'`, orderIndex: 1 },
          { description: 'delete removes key', inputData: `kv = KVStore()\nkv.set('y','20',1)\nkv.delete('y')\n_result = kv.get('y',2)`, expectedOutput: `None`, orderIndex: 2 },
          { description: 'delete nonexistent returns False', inputData: `kv = KVStore()\n_result = kv.delete('missing')`, expectedOutput: `False`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Backup and Restore Snapshots",
        description: `Extend \`KVStore\` with backup and restore operations:

- \`backup(timestamp)\` – snapshot the current state (all key-value-expiry triples) at the given timestamp
- \`restore(timestamp)\` – restore to the most recent backup whose timestamp is ≤ the given timestamp. If no such backup exists, do nothing.

**Example:**
\`\`\`
kv = KVStore()
kv.set('a', '1', 1)
kv.backup(2)
kv.set('a', '2', 3)
kv.get('a', 4)    # '2'
kv.restore(2)
kv.get('a', 4)    # '1'  (restored to backup at t=2)
\`\`\``,
        baseClass: `class KVStore:
    def __init__(self):
        self.store = {}

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        expiry = timestamp + ttl if ttl is not None else None
        self.store[key] = (value, expiry)

    def get(self, key: str, timestamp: int):
        if key not in self.store: return None
        value, expiry = self.store[key]
        if expiry is not None and timestamp >= expiry: return None
        return value

    def delete(self, key: str) -> bool:
        if key in self.store:
            del self.store[key]; return True
        return False`,
        starterCode: `import copy

class KVStore:
    def __init__(self):
        self.store = {}
        self.backups = []  # list of (timestamp, store_snapshot)

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        expiry = timestamp + ttl if ttl is not None else None
        self.store[key] = (value, expiry)

    def get(self, key: str, timestamp: int):
        if key not in self.store: return None
        value, expiry = self.store[key]
        if expiry is not None and timestamp >= expiry: return None
        return value

    def delete(self, key: str) -> bool:
        if key in self.store:
            del self.store[key]; return True
        return False

    def backup(self, timestamp: int) -> None:
        pass

    def restore(self, timestamp: int) -> None:
        pass`,
        solution: `import copy

class KVStore:
    def __init__(self):
        self.store = {}
        self.backups = []  # sorted list of (timestamp, store_snapshot)

    def set(self, key: str, value: str, timestamp: int, ttl: int = None) -> None:
        expiry = timestamp + ttl if ttl is not None else None
        self.store[key] = (value, expiry)

    def get(self, key: str, timestamp: int):
        if key not in self.store: return None
        value, expiry = self.store[key]
        if expiry is not None and timestamp >= expiry: return None
        return value

    def delete(self, key: str) -> bool:
        if key in self.store:
            del self.store[key]; return True
        return False

    def backup(self, timestamp: int) -> None:
        """Snapshot current store state."""        self.backups.append((timestamp, copy.deepcopy(self.store)))

    def restore(self, timestamp: int) -> None:
        """Restore to most recent backup at or before timestamp."""        # Find the latest backup with ts <= timestamp
        best = None
        for ts, snapshot in self.backups:
            if ts <= timestamp:
                if best is None or ts > best[0]:
                    best = (ts, snapshot)
        if best is not None:
            self.store = copy.deepcopy(best[1])`,
        solutionExplanation: "Backup stores a deep copy of the store dict. Restore scans backups for the latest one at or before the given timestamp.",
        testCases: [
          { description: 'restore returns to backup state', inputData: `import copy\nkv = KVStore()\nkv.set('a','1',1)\nkv.backup(2)\nkv.set('a','2',3)\nkv.restore(2)\n_result = kv.get('a',4)`, expectedOutput: `'1'`, orderIndex: 0 },
          { description: 'restore to latest backup before timestamp', inputData: `import copy\nkv = KVStore()\nkv.set('a','1',1)\nkv.backup(2)\nkv.set('a','2',3)\nkv.backup(4)\nkv.set('a','3',5)\nkv.restore(3)\n_result = kv.get('a',6)`, expectedOutput: `'1'`, orderIndex: 1 },
          { description: 'restore with no matching backup does nothing', inputData: `import copy\nkv = KVStore()\nkv.set('a','1',5)\nkv.backup(10)\nkv.restore(3)\n_result = kv.get('a',6)`, expectedOutput: `'1'`, orderIndex: 2 },
        ],
      },
    ]
  );

  // ── Anthropic: Image Processing Pipeline ────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 24001,
      slug: "image-processing-pipeline",
      title: "Image Processing Pipeline",
      difficulty: "Hard",
      badges: "anthropic",
      tags: "design,simulation,pipeline",
      description: `One of Anthropic's most frequently reported Hard coding questions (1239+ solvers on prachub).

You are given \`m\` input images and \`n\` processing pipelines. Each pipeline is an ordered list of operations (e.g., resize, rotate, crop, blur, color-transform). Apply each pipeline to each image and return the resulting output matrix.

The problem is implemented in 3 progressive stages:
- **Stage 1** – apply a single pipeline of operations to a single image (represented as a dict of properties)
- **Stage 2** – apply multiple pipelines to multiple images (m×n output matrix)
- **Stage 3** – add a \`cache\` to avoid re-computing identical (image, pipeline) pairs`,
      starterCode: `class ImageProcessor:
    def process(self, image: dict, pipeline: list) -> dict:
        """Apply a list of operations to an image dict. Return transformed image."""        pass`,
      methodName: "ImageProcessor",
    },
    [
      {
        stageNumber: 1,
        title: "Apply a Single Pipeline to One Image",
        description: `Implement \`process(image, pipeline)\` where:
- \`image\` is a dict with keys like \`'width'\`, \`'height'\`, \`'brightness'\`, \`'rotation'\`
- \`pipeline\` is a list of operation dicts, each with a \`'type'\` key and parameters

**Supported operations:**
- \`{'type': 'resize', 'scale': 2.0}\` – multiply width and height by scale
- \`{'type': 'rotate', 'degrees': 90}\` – add degrees to rotation (mod 360)
- \`{'type': 'brightness', 'delta': 10}\` – add delta to brightness (clamp to [0, 255])
- \`{'type': 'crop', 'width': 100, 'height': 100}\` – set new width and height (cannot exceed current)

Return the transformed image dict (modify a copy, not the original).

**Example:**
\`\`\`
img = {'width': 200, 'height': 100, 'brightness': 128, 'rotation': 0}
ops = [{'type': 'resize', 'scale': 2.0}, {'type': 'rotate', 'degrees': 90}]
result = {'width': 400, 'height': 200, 'brightness': 128, 'rotation': 90}
\`\`\``,
        baseClass: `class ImageProcessor:
    pass`,
        starterCode: `class ImageProcessor:
    def process(self, image: dict, pipeline: list) -> dict:
        """Apply each operation in pipeline to a copy of image."""        img = dict(image)  # work on a copy
        for op in pipeline:
            # TODO: apply each operation type
            pass
        return img`,
        solution: `class ImageProcessor:
    def _apply_op(self, img: dict, op: dict) -> dict:
        """Apply a single operation to img (in-place mutation of copy)."""        t = op['type']
        if t == 'resize':
            img['width'] = int(img['width'] * op['scale'])
            img['height'] = int(img['height'] * op['scale'])
        elif t == 'rotate':
            img['rotation'] = (img.get('rotation', 0) + op['degrees']) % 360
        elif t == 'brightness':
            img['brightness'] = max(0, min(255, img.get('brightness', 128) + op['delta']))
        elif t == 'crop':
            img['width'] = min(img['width'], op['width'])
            img['height'] = min(img['height'], op['height'])
        return img

    def process(self, image: dict, pipeline: list) -> dict:
        """Apply pipeline of operations to a copy of image."""        img = dict(image)
        for op in pipeline:
            img = self._apply_op(img, op)
        return img`,
        solutionExplanation: "Work on a copy of the image dict. Apply each operation sequentially, mutating the copy.",
        testCases: [
          { description: 'resize doubles dimensions', inputData: `p = ImageProcessor()\n_result = p.process({'width':100,'height':50,'brightness':128,'rotation':0},[{'type':'resize','scale':2.0}])`, expectedOutput: `{'width': 200, 'height': 100, 'brightness': 128, 'rotation': 0}`, orderIndex: 0 },
          { description: 'rotate adds degrees mod 360', inputData: `p = ImageProcessor()\n_result = p.process({'width':100,'height':50,'brightness':128,'rotation':270},[{'type':'rotate','degrees':180}])`, expectedOutput: `{'width': 100, 'height': 50, 'brightness': 128, 'rotation': 90}`, orderIndex: 1 },
          { description: 'brightness clamped at 255', inputData: `p = ImageProcessor()\n_result = p.process({'width':100,'height':50,'brightness':250,'rotation':0},[{'type':'brightness','delta':20}])`, expectedOutput: `{'width': 100, 'height': 50, 'brightness': 255, 'rotation': 0}`, orderIndex: 2 },
          { description: 'pipeline applies ops in order', inputData: `p = ImageProcessor()\n_result = p.process({'width':200,'height':100,'brightness':128,'rotation':0},[{'type':'resize','scale':2.0},{'type':'rotate','degrees':90}])`, expectedOutput: `{'width': 400, 'height': 200, 'brightness': 128, 'rotation': 90}`, orderIndex: 3 },
        ],
      },
      {
        stageNumber: 2,
        title: "Apply Multiple Pipelines to Multiple Images",
        description: `Extend \`ImageProcessor\` with \`process_batch(images, pipelines)\` that applies each pipeline to each image.

**Parameters:**
- \`images\` – list of m image dicts
- \`pipelines\` – list of n pipeline lists

**Returns:** an m×n matrix (list of lists) where \`result[i][j]\` is the result of applying \`pipelines[j]\` to \`images[i]\`.

**Example:**
\`\`\`
images = [{'width':100,'height':50,'brightness':128,'rotation':0}]
pipelines = [[{'type':'resize','scale':2.0}], [{'type':'rotate','degrees':90}]]
result = [[{'width':200,'height':100,'brightness':128,'rotation':0},
           {'width':100,'height':50,'brightness':128,'rotation':90}]]
\`\`\``,
        baseClass: `class ImageProcessor:
    def _apply_op(self, img, op):
        t = op['type']
        if t == 'resize':
            img['width'] = int(img['width'] * op['scale'])
            img['height'] = int(img['height'] * op['scale'])
        elif t == 'rotate':
            img['rotation'] = (img.get('rotation', 0) + op['degrees']) % 360
        elif t == 'brightness':
            img['brightness'] = max(0, min(255, img.get('brightness', 128) + op['delta']))
        elif t == 'crop':
            img['width'] = min(img['width'], op['width'])
            img['height'] = min(img['height'], op['height'])
        return img

    def process(self, image, pipeline):
        img = dict(image)
        for op in pipeline: img = self._apply_op(img, op)
        return img`,
        starterCode: `class ImageProcessor:
    def _apply_op(self, img, op):
        t = op['type']
        if t == 'resize':
            img['width'] = int(img['width'] * op['scale'])
            img['height'] = int(img['height'] * op['scale'])
        elif t == 'rotate':
            img['rotation'] = (img.get('rotation', 0) + op['degrees']) % 360
        elif t == 'brightness':
            img['brightness'] = max(0, min(255, img.get('brightness', 128) + op['delta']))
        elif t == 'crop':
            img['width'] = min(img['width'], op['width'])
            img['height'] = min(img['height'], op['height'])
        return img

    def process(self, image, pipeline):
        img = dict(image)
        for op in pipeline: img = self._apply_op(img, op)
        return img

    def process_batch(self, images: list, pipelines: list) -> list:
        """Return m x n matrix of results."""        pass`,
        solution: `class ImageProcessor:
    def _apply_op(self, img, op):
        t = op['type']
        if t == 'resize':
            img['width'] = int(img['width'] * op['scale'])
            img['height'] = int(img['height'] * op['scale'])
        elif t == 'rotate':
            img['rotation'] = (img.get('rotation', 0) + op['degrees']) % 360
        elif t == 'brightness':
            img['brightness'] = max(0, min(255, img.get('brightness', 128) + op['delta']))
        elif t == 'crop':
            img['width'] = min(img['width'], op['width'])
            img['height'] = min(img['height'], op['height'])
        return img

    def process(self, image, pipeline):
        img = dict(image)
        for op in pipeline: img = self._apply_op(img, op)
        return img

    def process_batch(self, images: list, pipelines: list) -> list:
        """Apply each pipeline to each image; return m x n result matrix."""        return [[self.process(img, pipe) for pipe in pipelines] for img in images]`,
        solutionExplanation: "Simple nested list comprehension: for each image, for each pipeline, call process().",
        testCases: [
          { description: 'single image two pipelines', inputData: `p = ImageProcessor()\nimages = [{'width':100,'height':50,'brightness':128,'rotation':0}]\npipelines = [[{'type':'resize','scale':2.0}],[{'type':'rotate','degrees':90}]]\n_result = p.process_batch(images, pipelines)`, expectedOutput: `[[{'width': 200, 'height': 100, 'brightness': 128, 'rotation': 0}, {'width': 100, 'height': 50, 'brightness': 128, 'rotation': 90}]]`, orderIndex: 0 },
          { description: 'empty pipeline returns copy of image', inputData: `p = ImageProcessor()\n_result = p.process_batch([{'width':100,'height':50,'brightness':128,'rotation':0}], [[]])`, expectedOutput: `[[{'width': 100, 'height': 50, 'brightness': 128, 'rotation': 0}]]`, orderIndex: 1 },
        ],
      },
    ]
  );

  // ── Anthropic: Same-Host Web Crawler ────────────────────────────────────
  await seedStagedProblemIfNotExists(
    {
      number: 25001,
      slug: "same-host-web-crawler",
      title: "Same-Host Web Crawler",
      difficulty: "Medium",
      badges: "anthropic",
      tags: "bfs,graph,design",
      description: `One of Anthropic's most frequently reported coding questions (multiple variants with 500+ solvers each on prachub).

Implement a web crawler that, given a starting URL and a \`get_links(url)\` function, crawls all reachable pages within the same hostname.

The problem has three stages:
- **Stage 1** – single-threaded BFS crawler
- **Stage 2** – add a \`max_depth\` limit
- **Stage 3** – add a URL filter predicate`,
      starterCode: `class WebCrawler:
    def crawl(self, start_url: str, get_links) -> list:
        """Return all unique URLs reachable from start_url within the same hostname."""        pass`,
      methodName: "WebCrawler",
    },
    [
      {
        stageNumber: 1,
        title: "Single-Threaded BFS Crawler",
        description: `Implement \`crawl(start_url, get_links)\` that returns all unique URLs reachable from \`start_url\` within the **same hostname**.

**Parameters:**
- \`start_url\` – the starting URL (e.g., \`'http://news.example.com/a'\`)
- \`get_links(url)\` – a function that returns a list of URLs linked from \`url\`

**Rules:**
- Only follow links whose hostname matches \`start_url\`'s hostname
- Never visit the same URL twice
- Include \`start_url\` in the result
- Return results in any order

**Example:**
\`\`\`
links = {
    'http://ex.com/a': ['http://ex.com/b', 'http://other.com/x'],
    'http://ex.com/b': ['http://ex.com/a', 'http://ex.com/c'],
    'http://ex.com/c': [],
}
crawl('http://ex.com/a', lambda u: links.get(u, []))
# → ['http://ex.com/a', 'http://ex.com/b', 'http://ex.com/c']
\`\`\``,
        baseClass: `class WebCrawler:
    pass`,
        starterCode: `from urllib.parse import urlparse
from collections import deque

class WebCrawler:
    def _hostname(self, url: str) -> str:
        return urlparse(url).netloc

    def crawl(self, start_url: str, get_links) -> list:
        """BFS from start_url, only following same-hostname links."""        pass`,
        solution: `from urllib.parse import urlparse
from collections import deque

class WebCrawler:
    def _hostname(self, url: str) -> str:
        """Extract hostname from URL."""        return urlparse(url).netloc

    def crawl(self, start_url: str, get_links) -> list:
        """BFS crawler restricted to same hostname as start_url."""        target_host = self._hostname(start_url)
        visited = {start_url}
        queue = deque([start_url])
        result = []
        while queue:
            url = queue.popleft()
            result.append(url)
            for link in get_links(url):
                if link not in visited and self._hostname(link) == target_host:
                    visited.add(link)
                    queue.append(link)
        return result`,
        solutionExplanation: "Standard BFS with a visited set. Filter links by hostname comparison using urlparse.",
        testCases: [
          { description: 'crawls same-host pages only', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nlinks = {'http://ex.com/a':['http://ex.com/b','http://other.com/x'],'http://ex.com/b':['http://ex.com/c'],'http://ex.com/c':[]}\nc = WebCrawler()\n_result = sorted(c.crawl('http://ex.com/a', lambda u: links.get(u,[])))`, expectedOutput: `['http://ex.com/a', 'http://ex.com/b', 'http://ex.com/c']`, orderIndex: 0 },
          { description: 'no links returns just start url', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nc = WebCrawler()\n_result = c.crawl('http://ex.com/a', lambda u: [])`, expectedOutput: `['http://ex.com/a']`, orderIndex: 1 },
          { description: 'cycle does not cause infinite loop', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nlinks = {'http://ex.com/a':['http://ex.com/b'],'http://ex.com/b':['http://ex.com/a']}\nc = WebCrawler()\n_result = sorted(c.crawl('http://ex.com/a', lambda u: links.get(u,[])))`, expectedOutput: `['http://ex.com/a', 'http://ex.com/b']`, orderIndex: 2 },
        ],
      },
      {
        stageNumber: 2,
        title: "Crawl with Max Depth Limit",
        description: `Extend \`WebCrawler\` with \`crawl_with_depth(start_url, get_links, max_depth)\`.

Only crawl pages reachable within \`max_depth\` hops from \`start_url\`. The start URL is at depth 0.

**Example:**
\`\`\`
links = {
    'http://ex.com/a': ['http://ex.com/b'],
    'http://ex.com/b': ['http://ex.com/c'],
    'http://ex.com/c': ['http://ex.com/d'],
}
crawl_with_depth('http://ex.com/a', get_links, max_depth=1)
# → ['http://ex.com/a', 'http://ex.com/b']  (c and d are at depth 2+)
\`\`\``,
        baseClass: `from urllib.parse import urlparse
from collections import deque

class WebCrawler:
    def _hostname(self, url):
        return urlparse(url).netloc

    def crawl(self, start_url, get_links):
        target_host = self._hostname(start_url)
        visited = {start_url}
        queue = deque([start_url])
        result = []
        while queue:
            url = queue.popleft()
            result.append(url)
            for link in get_links(url):
                if link not in visited and self._hostname(link) == target_host:
                    visited.add(link)
                    queue.append(link)
        return result`,
        starterCode: `from urllib.parse import urlparse
from collections import deque

class WebCrawler:
    def _hostname(self, url):
        return urlparse(url).netloc

    def crawl(self, start_url, get_links):
        target_host = self._hostname(start_url)
        visited = {start_url}
        queue = deque([start_url])
        result = []
        while queue:
            url = queue.popleft()
            result.append(url)
            for link in get_links(url):
                if link not in visited and self._hostname(link) == target_host:
                    visited.add(link)
                    queue.append(link)
        return result

    def crawl_with_depth(self, start_url: str, get_links, max_depth: int) -> list:
        """BFS with depth limit. start_url is at depth 0."""        pass`,
        solution: `from urllib.parse import urlparse
from collections import deque

class WebCrawler:
    def _hostname(self, url):
        return urlparse(url).netloc

    def crawl(self, start_url, get_links):
        target_host = self._hostname(start_url)
        visited = {start_url}
        queue = deque([start_url])
        result = []
        while queue:
            url = queue.popleft()
            result.append(url)
            for link in get_links(url):
                if link not in visited and self._hostname(link) == target_host:
                    visited.add(link)
                    queue.append(link)
        return result

    def crawl_with_depth(self, start_url: str, get_links, max_depth: int) -> list:
        """BFS with max_depth limit. Queue stores (url, depth) pairs."""        target_host = self._hostname(start_url)
        visited = {start_url}
        # Queue stores (url, current_depth)
        queue = deque([(start_url, 0)])
        result = []
        while queue:
            url, depth = queue.popleft()
            result.append(url)
            if depth >= max_depth:
                continue  # don't expand beyond max_depth
            for link in get_links(url):
                if link not in visited and self._hostname(link) == target_host:
                    visited.add(link)
                    queue.append((link, depth + 1))
        return result`,
        solutionExplanation: "Store (url, depth) in the queue. Skip expanding nodes at or beyond max_depth.",
        testCases: [
          { description: 'max_depth=1 stops at one hop', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nlinks = {'http://ex.com/a':['http://ex.com/b'],'http://ex.com/b':['http://ex.com/c'],'http://ex.com/c':[]}\nc = WebCrawler()\n_result = sorted(c.crawl_with_depth('http://ex.com/a', lambda u: links.get(u,[]), 1))`, expectedOutput: `['http://ex.com/a', 'http://ex.com/b']`, orderIndex: 0 },
          { description: 'max_depth=0 returns only start url', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nlinks = {'http://ex.com/a':['http://ex.com/b']}\nc = WebCrawler()\n_result = c.crawl_with_depth('http://ex.com/a', lambda u: links.get(u,[]), 0)`, expectedOutput: `['http://ex.com/a']`, orderIndex: 1 },
          { description: 'max_depth=2 reaches two hops', inputData: `from urllib.parse import urlparse\nfrom collections import deque\nlinks = {'http://ex.com/a':['http://ex.com/b'],'http://ex.com/b':['http://ex.com/c'],'http://ex.com/c':['http://ex.com/d'],'http://ex.com/d':[]}\nc = WebCrawler()\n_result = sorted(c.crawl_with_depth('http://ex.com/a', lambda u: links.get(u,[]), 2))`, expectedOutput: `['http://ex.com/a', 'http://ex.com/b', 'http://ex.com/c']`, orderIndex: 2 },
        ],
      },
    ]
  );
}
