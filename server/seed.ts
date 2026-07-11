import { seedProblemIfNotExists } from "./db";

const LC609_DESCRIPTION = `## 609. Find Duplicate File in System

**Difficulty:** Medium

Given a list \`paths\` of directory info, including the directory path, and all the files with contents in this directory, return all the duplicate files in the file system in terms of their paths. You may return the answer in **any order**.

A group of duplicate files consists of at least two files that have the same content.

A single directory info string in the input list has the following format:
- \`"root/d1/d2/.../dm f1.txt(f1_content) f2.txt(f2_content) ... fn.txt(fn_content)"\`

It means there are \`n\` files (\`f1.txt\`, \`f2.txt\`, ..., \`fn.txt\`) with content (\`f1_content\`, \`f2_content\`, ..., \`fn_content\`) respectively in the directory \`root/d1/d2/.../dm\`. Note that \`n >= 1\` and \`m >= 0\`. If \`m = 0\`, it means the directory is just the root directory.

The output is a list of groups of duplicate file paths. For each group, it contains all the file paths of the files that have the same content. A file path is a string that has the following format:
- \`"directory_path/file_name.txt"\`

**Example 1:**
\`\`\`
Input: paths = ["root/a 1.txt(abcd) 2.txt(efgh)", "root/c 3.txt(abcd)", "root/c/d 4.txt(efgh)", "root 4.txt(efgh)"]
Output: [["root/a/2.txt","root/c/d/4.txt","root/4.txt"],["root/a/1.txt","root/c/3.txt"]]
\`\`\`

**Example 2:**
\`\`\`
Input: paths = ["root/a 1.txt(abcd)", "root/c 3.txt(efgh)"]
Output: []
\`\`\`

**Constraints:**
- \`1 <= paths.length <= 2 * 10^4\`
- \`1 <= paths[i].length <= 3000\`
- \`1 <= sum(paths[i].length) <= 5 * 10^5\`
- \`paths[i]\` consist of English letters, digits, \`/\`, \`.\`, \`(\`, \`)\`, and \`space\`
- You may assume no files or directories share the same name in the same directory.
- You may assume each given directory info represents a unique directory. A single blank space separates the directory path and file info.

**Follow up:**
- Imagine you are given a real file system, how will you search files? DFS or BFS?
- If the file content is very large (GB level), how will you modify your solution?
- If you can only read the file by 1kb each time, how will you modify your solution?
- What is the time complexity of your modified solution? What is the most time-efficient solution? If there are too many duplicates, what is the best way to handle this?
- How will you make sure the duplicates you find are not false positives?`;

const STARTER_CODE = `from typing import List
from collections import defaultdict

class Solution:
    def findDuplicate(self, paths: List[str]) -> List[List[str]]:
        # Your solution here
        # 
        # Hint: Use a hash map to group files by their content.
        # For each path string, parse the directory and each file's name + content.
        # Files with the same content belong in the same group.
        pass
`;

const TEST_CASES = [
  {
    description: "Basic case with two duplicate groups",
    inputData: JSON.stringify([["root/a 1.txt(abcd) 2.txt(efgh)", "root/c 3.txt(abcd)", "root/c/d 4.txt(efgh)", "root 4.txt(efgh)"]]),
    expectedOutput: JSON.stringify([["root/a/2.txt","root/c/d/4.txt","root/4.txt"],["root/a/1.txt","root/c/3.txt"]]),
    orderIndex: 0,
  },
  {
    description: "No duplicates — returns empty list",
    inputData: JSON.stringify([["root/a 1.txt(abcd)", "root/c 3.txt(efgh)"]]),
    expectedOutput: JSON.stringify([]),
    orderIndex: 1,
  },
  {
    description: "Single duplicate group across three directories",
    inputData: JSON.stringify([["root/a 1.txt(xyz)", "root/b 2.txt(xyz)", "root/c 3.txt(xyz)"]]),
    expectedOutput: JSON.stringify([["root/a/1.txt","root/b/2.txt","root/c/3.txt"]]),
    orderIndex: 2,
  },
  {
    description: "Multiple files in same directory, one duplicate",
    inputData: JSON.stringify([["root/a 1.txt(hello) 2.txt(world) 3.txt(hello)"]]),
    expectedOutput: JSON.stringify([["root/a/1.txt","root/a/3.txt"]]),
    orderIndex: 3,
  },
  {
    description: "Root-level files with duplicates",
    inputData: JSON.stringify([["root 1.txt(same) 2.txt(same) 3.txt(different)"]]),
    expectedOutput: JSON.stringify([["root/1.txt","root/2.txt"]]),
    orderIndex: 4,
  },
];

export async function runSeed() {
  try {
    await seedProblemIfNotExists(
      {
        slug: "find-duplicate-file-in-system",
        title: "Find Duplicate File in System",
        difficulty: "Medium",
        description: LC609_DESCRIPTION,
        starterCode: STARTER_CODE,
      },
      TEST_CASES
    );
  } catch (err) {
    console.error("[Seed] Error seeding problems:", err);
  }
}
