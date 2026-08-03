import { and, eq } from "drizzle-orm";
import { problems, testCases } from "../drizzle/schema";
import { getDb } from "./db";

const PROBLEMS = [
  {
    number: 146,
    title: "LRU Cache",
    slug: "lru-cache",
    difficulty: "Medium",
    methodName: "lru_cache",
    description: `## 146. LRU Cache

Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` — Initialize the LRU cache with **positive size** \`capacity\`.
- \`int get(int key)\` — Return the value of the \`key\` if it exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` — Update the value of the \`key\` if it exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the \`capacity\`, **evict the least recently used key**.

The functions \`get\` and \`put\` must each run in **O(1)** average time complexity.

**Example 1:**
\`\`\`
Input:
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output:
[null, null, null, 1, null, -1, null, -1, 3, 4]

Explanation:
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1); // cache is {1=1}
lRUCache.put(2, 2); // cache is {1=1, 2=2}
lRUCache.get(1);    // return 1
lRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}
lRUCache.get(2);    // returns -1 (not found)
lRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}
lRUCache.get(1);    // return -1 (not found)
lRUCache.get(3);    // return 3
lRUCache.get(4);    // return 4
\`\`\`

**Constraints:**
- \`1 <= capacity <= 3000\`
- \`0 <= key <= 10^4\`
- \`0 <= value <= 10^5\`
- At most \`2 * 10^5\` calls will be made to \`get\` and \`put\`.`,
    starterCode: `class LRUCache:
    def __init__(self, capacity: int):
        # Your initialization here
        pass

    def get(self, key: int) -> int:
        # Return value if key exists, else -1
        pass

    def put(self, key: int, value: int) -> None:
        # Insert or update key-value pair
        # Evict LRU if over capacity
        pass
`,
    testCases: [
      {
        description: "Basic LRU cache operations from the example",
        input: JSON.stringify({ ops: ["LRUCache","put","put","get","put","get","put","get","get","get"], args: [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]] }),
        expectedOutput: JSON.stringify([null,null,null,1,null,-1,null,-1,3,4]),
      },
      {
        description: "Single capacity cache eviction",
        input: JSON.stringify({ ops: ["LRUCache","put","put","get"], args: [[1],[1,1],[2,2],[1]] }),
        expectedOutput: JSON.stringify([null,null,null,-1]),
      },
      {
        description: "Get updates recency — prevents eviction",
        input: JSON.stringify({ ops: ["LRUCache","put","put","get","put","get"], args: [[2],[1,10],[2,20],[1],[3,30],[2]] }),
        expectedOutput: JSON.stringify([null,null,null,10,null,-1]),
      },
      {
        description: "Update existing key does not add duplicate",
        input: JSON.stringify({ ops: ["LRUCache","put","put","put","get","get"], args: [[2],[1,1],[2,2],[1,100],[1],[2]] }),
        expectedOutput: JSON.stringify([null,null,null,null,100,2]),
      },
      {
        description: "Capacity 3 with multiple evictions",
        input: JSON.stringify({ ops: ["LRUCache","put","put","put","put","get","get","get"], args: [[3],[1,1],[2,2],[3,3],[4,4],[1],[2],[3]] }),
        expectedOutput: JSON.stringify([null,null,null,null,null,-1,2,3]),
      },
    ],
  },
  {
    number: 588,
    title: "Design In-Memory File System",
    slug: "design-in-memory-file-system",
    difficulty: "Hard",
    methodName: "file_system",
    description: `## 588. Design In-Memory File System

Design an in-memory file system to simulate the following functions:

Implement the \`FileSystem\` class:
- \`ls(path)\` — If \`path\` is a file path, return a list containing only that file's name. If it is a directory path, return the list of file and directory names **in this directory** in **lexicographical order**.
- \`mkdir(path)\` — Make a new directory according to the given \`path\`. The given directory path does not exist. If the middle directories in the path do not exist, you should create them as well.
- \`addContentToFile(filePath, content)\` — If \`filePath\` does not exist, create that file containing given \`content\`. If \`filePath\` already exists, append the given \`content\` to original content.
- \`readContentFromFile(filePath)\` — Return the content in the file at \`filePath\`.

**Example 1:**
\`\`\`
Input:
["FileSystem","ls","mkdir","addContentToFile","ls","readContentFromFile"]
[[], ["/"], ["/a/b/c"], ["/a/b/file1.txt","hello"], ["/"], ["/a/b/file1.txt"]]
Output:
[null, [], null, null, ["a"], "hello"]
\`\`\`

**Constraints:**
- \`1 <= path.length, filePath.length <= 100\`
- \`path\` and \`filePath\` are absolute paths beginning with \`'/'\`
- You can assume that all directory names and file names only contain lowercase letters and \`/\`
- You can assume that all operations will be passed valid parameters
- \`1 <= content.length <= 50\`
- At most \`300\` calls will be made to \`ls\`, \`mkdir\`, \`addContentToFile\`, and \`readContentFromFile\``,
    starterCode: `class FileSystem:
    def __init__(self):
        # Initialize your in-memory file system here
        pass

    def ls(self, path: str) -> list[str]:
        # List files/dirs at path in lexicographical order
        pass

    def mkdir(self, path: str) -> None:
        # Create directory (and all intermediate dirs)
        pass

    def addContentToFile(self, filePath: str, content: str) -> None:
        # Create or append content to file
        pass

    def readContentFromFile(self, filePath: str) -> str:
        # Return file content
        pass
`,
    testCases: [
      {
        description: "Basic file system operations from the example",
        input: JSON.stringify({ ops: ["FileSystem","ls","mkdir","addContentToFile","ls","readContentFromFile"], args: [[],["/"], ["/a/b/c"],["/a/b/file1.txt","hello"],["/"],[ "/a/b/file1.txt"]] }),
        expectedOutput: JSON.stringify([null,[],null,null,["a"],"hello"]),
      },
      {
        description: "ls on a file path returns just the filename",
        input: JSON.stringify({ ops: ["FileSystem","addContentToFile","ls"], args: [[],["/dir/file.txt","data"],["/dir/file.txt"]] }),
        expectedOutput: JSON.stringify([null,null,["file.txt"]]),
      },
      {
        description: "Append content to existing file",
        input: JSON.stringify({ ops: ["FileSystem","addContentToFile","addContentToFile","readContentFromFile"], args: [[],["/f.txt","Hello"],["/f.txt"," World"],["/f.txt"]] }),
        expectedOutput: JSON.stringify([null,null,null,"Hello World"]),
      },
      {
        description: "ls returns lexicographical order",
        input: JSON.stringify({ ops: ["FileSystem","mkdir","mkdir","mkdir","ls"], args: [[],["/z"],["/a"],["/m"],["/"] ] }),
        expectedOutput: JSON.stringify([null,null,null,null,["a","m","z"]]),
      },
      {
        description: "Deep nested mkdir and ls",
        input: JSON.stringify({ ops: ["FileSystem","mkdir","addContentToFile","ls","ls"], args: [[],["/a/b/c"],["/a/b/c/d.txt","hi"],["/a/b"],["/a/b/c"]] }),
        expectedOutput: JSON.stringify([null,null,null,["c"],["d.txt"]]),
      },
    ],
  },
  {
    number: 1236,
    title: "Web Crawler",
    slug: "web-crawler",
    difficulty: "Medium",
    methodName: "crawl",
    description: `## 1236. Web Crawler

Given a URL \`startUrl\` and an interface \`HtmlParser\`, implement a web crawler to crawl all links that are under the **same hostname** as \`startUrl\`.

Return all URLs obtained by your web crawler in **any order**.

Your crawler should:
1. Start from the page: \`startUrl\`
2. Call \`HtmlParser.getUrls(url)\` to get all URLs from a webpage of the given URL.
3. Do not crawl the same link twice.
4. Explore only the links that are under the **same hostname** as \`startUrl\`.

The hostname is the part after \`http://\` and before the next \`/\`. For example, in \`http://news.yahoo.com/article\`, the hostname is \`news.yahoo.com\`.

**Example 1:**
\`\`\`
Input:
urls = [
  "http://news.yahoo.com",
  "http://news.yahoo.com/news",
  "http://news.yahoo.com/news/topics/",
  "http://news.google.com",
  "http://news.yahoo.com/us"
]
edges = [[2,0],[2,1],[3,2],[3,1],[0,4]]
startUrl = "http://news.yahoo.com/news/topics/"
Output: ["http://news.yahoo.com","http://news.yahoo.com/news","http://news.yahoo.com/news/topics/","http://news.yahoo.com/us"]
\`\`\`

**Constraints:**
- \`1 <= urls.length <= 1000\`
- \`1 <= urls[i].length <= 300\`
- \`startUrl\` is one of the \`urls\`.
- Hostname label must be from 1 to 63 characters long.
- The hostname may not start or end with the \`'-'\` character.
- See RFC 952 for more details.`,
    starterCode: `# The HtmlParser interface is provided in the test harness.
# You do NOT need to define it — just use it as shown below.
#
# class HtmlParser:
#     def getUrls(self, url: str) -> list[str]: ...

class Solution:
    def crawl(self, startUrl: str, htmlParser: 'HtmlParser') -> list[str]:
        # Your solution here
        pass
`,
    testCases: [
      {
        description: "Crawl yahoo news — stay within same hostname",
        input: JSON.stringify({ urls: ["http://news.yahoo.com","http://news.yahoo.com/news","http://news.yahoo.com/news/topics/","http://news.google.com","http://news.yahoo.com/us"], edges: [[2,0],[2,1],[3,2],[3,1],[0,4]], startUrl: "http://news.yahoo.com/news/topics/" }),
        expectedOutput: JSON.stringify(["http://news.yahoo.com","http://news.yahoo.com/news","http://news.yahoo.com/news/topics/","http://news.yahoo.com/us"]),
      },
      {
        description: "Single page with no links",
        input: JSON.stringify({ urls: ["http://example.com"], edges: [], startUrl: "http://example.com" }),
        expectedOutput: JSON.stringify(["http://example.com"]),
      },
      {
        description: "Do not cross hostname boundary",
        input: JSON.stringify({ urls: ["http://a.com","http://b.com","http://a.com/page"], edges: [[0,1],[0,2]], startUrl: "http://a.com" }),
        expectedOutput: JSON.stringify(["http://a.com","http://a.com/page"]),
      },
      {
        description: "No duplicate URLs in result",
        input: JSON.stringify({ urls: ["http://site.com","http://site.com/a","http://site.com/b"], edges: [[0,1],[0,2],[1,0],[2,0]], startUrl: "http://site.com" }),
        expectedOutput: JSON.stringify(["http://site.com","http://site.com/a","http://site.com/b"]),
      },
      {
        description: "Start from a sub-page and reach root",
        input: JSON.stringify({ urls: ["http://x.com","http://x.com/sub","http://x.com/other"], edges: [[1,0],[0,2]], startUrl: "http://x.com/sub" }),
        expectedOutput: JSON.stringify(["http://x.com","http://x.com/other","http://x.com/sub"]),
      },
    ],
  },
  {
    number: 1752,
    title: "Check if Array Is Sorted and Rotated",
    slug: "check-if-array-is-sorted-and-rotated",
    difficulty: "Easy",
    methodName: "check",
    description: `## 1752. Check if Array Is Sorted and Rotated

Given an array \`nums\`, return \`true\` if the array was originally sorted in **non-decreasing order**, then rotated **some number of positions** (including zero). Otherwise, return \`false\`.

There may be **duplicates** in the original array.

**Note:** An array \`A\` rotated by \`x\` positions results in the array \`B\` where \`B[i] == A[(i+x) % A.length]\`.

**Example 1:**
\`\`\`
Input: nums = [3,4,5,1,2]
Output: true
Explanation: [1,2,3,4,5] is the sorted array. Rotating by 3 positions gives [3,4,5,1,2].
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [2,1,3,4]
Output: false
Explanation: There is no sorted array once rotated that can make nums.
\`\`\`

**Example 3:**
\`\`\`
Input: nums = [1,2,3]
Output: true
Explanation: [1,2,3] is the sorted array. Rotating by 0 positions gives [1,2,3].
\`\`\`

**Constraints:**
- \`1 <= nums.length <= 100\`
- \`1 <= nums[i] <= 100\``,
    starterCode: `from typing import List

class Solution:
    def check(self, nums: List[int]) -> bool:
        # Your solution here
        pass
`,
    testCases: [
      {
        description: "Rotated sorted array [3,4,5,1,2] → true",
        input: JSON.stringify({ nums: [3,4,5,1,2] }),
        expectedOutput: "true",
      },
      {
        description: "Not a rotation [2,1,3,4] → false",
        input: JSON.stringify({ nums: [2,1,3,4] }),
        expectedOutput: "false",
      },
      {
        description: "Already sorted [1,2,3] → true (0 rotation)",
        input: JSON.stringify({ nums: [1,2,3] }),
        expectedOutput: "true",
      },
      {
        description: "Single element → always true",
        input: JSON.stringify({ nums: [1] }),
        expectedOutput: "true",
      },
      {
        description: "Array with duplicates [1,1,1] → true",
        input: JSON.stringify({ nums: [1,1,1] }),
        expectedOutput: "true",
      },
    ],
  },
];

/** Upserts the batch-2 problems and replaces their test cases. Idempotent. */
export async function runBatch2Seed(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const p of PROBLEMS) {
    const existing = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.slug, p.slug))
      .limit(1);

    const values = {
      number: p.number,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
      description: p.description,
      starterCode: p.starterCode,
      methodName: p.methodName,
    };

    let problemId: number;
    if (existing.length > 0) {
      problemId = existing[0].id;
      await db.update(problems).set(values).where(eq(problems.id, problemId));
    } else {
      const [inserted] = await db.insert(problems).values(values).returning({ id: problems.id });
      problemId = inserted.id;
      console.log(`[Seed] Seeded problem ${p.number}: ${p.title}`);
    }

    await db.delete(testCases).where(eq(testCases.problemId, problemId));
    await db.insert(testCases).values(
      p.testCases.map((tc, i) => ({
        problemId,
        description: tc.description,
        inputData: tc.input,
        expectedOutput: tc.expectedOutput,
        orderIndex: i,
      }))
    );
  }
}
