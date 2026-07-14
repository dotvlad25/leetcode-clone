#!/usr/bin/env python3
"""
Generates human-readable Python unittest files for each staged problem stage
and updates the testFileContent column in the problem_stages table.

Each stage gets its OWN test file showing only the NEW tests for that stage.
Cumulative execution (stage 1+2+...+N) still happens at runtime via the executor.
"""
import mysql.connector
import re
import sys
import os

DB_URL = os.environ.get("DATABASE_URL", "")

def parse_db_url(url):
    """Parse mysql://user:pass@host:port/db?ssl=... into connector kwargs."""
    m = re.match(r"mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)", url)
    if not m:
        raise ValueError(f"Cannot parse DATABASE_URL: {url[:60]}")
    user, password, host, port, database = m.groups()
    return dict(user=user, password=password, host=host, port=int(port), database=database,
                ssl_disabled=False, ssl_verify_cert=False, ssl_verify_identity=False)

def make_test_file(problem_title: str, class_name: str, stages_up_to: list[dict]) -> str:
    """Build a per-stage Python unittest file showing only that stage's own tests."""
    lines = [
        "import unittest",
        "import sys",
        "",
        f"# Test file for: {problem_title}",
        f"# Stage {stages_up_to[-1]['stageNumber']}: {stages_up_to[-1]['title']}",
        "# These are the NEW tests introduced in this stage.",
        "# When you submit, all previous stages' tests also run cumulatively.",
        "# Your solution.py code is injected before these tests at runtime.",
        "",
        "# ─── paste your solution here to run locally ───",
        "# from solution import *",
        "",
    ]

    test_num = 1
    # Only show this stage's own tests (not cumulative)
    stage = stages_up_to[-1]
    lines.append(f"# {'─' * 60}")
    lines.append(f"# Stage {stage['stageNumber']}: {stage['title']}")
    lines.append(f"# {'─' * 60}")
    lines.append("")
    for tc in stage["testCases"]:
        desc = tc["description"].replace("\n", " ")
        input_code = tc["inputData"]
        expected = tc["expectedOutput"]
        lines.append(f"class Test_Stage{stage['stageNumber']}_Case{test_num}(unittest.TestCase):")
        lines.append(f'    """')
        lines.append(f'    {desc}')
        lines.append(f'    Expected output:')
        for exp_line in expected.strip().split("\n"):
            lines.append(f'      {exp_line}')
        lines.append(f'    """')
        lines.append(f'    def test(self):')
        lines.append(f'        import io, contextlib')
        lines.append(f'        buf = io.StringIO()')
        lines.append(f'        with contextlib.redirect_stdout(buf):')
        # Indent the input code
        for code_line in input_code.split("\n"):
            lines.append(f'            {code_line}')
        lines.append(f'        actual = buf.getvalue().strip()')
        lines.append(f'        expected = {repr(expected.strip())}')
        lines.append(f'        self.assertEqual(actual, expected)')
        lines.append("")
        test_num += 1

    lines.append("")
    lines.append("if __name__ == '__main__':")
    lines.append("    unittest.main()")
    lines.append("")
    return "\n".join(lines)


def main():
    kwargs = parse_db_url(DB_URL)
    conn = mysql.connector.connect(**kwargs)
    cur = conn.cursor(dictionary=True)

    # Get all staged problems
    cur.execute("SELECT id, title FROM problems WHERE isStaged = 1 ORDER BY id")
    problems = cur.fetchall()
    print(f"Found {len(problems)} staged problems")

    for prob in problems:
        pid = prob["id"]
        title = prob["title"]
        # Get all stages for this problem
        cur.execute(
            "SELECT id, stageNumber, title FROM problem_stages WHERE problemId = %s ORDER BY stageNumber",
            (pid,)
        )
        stages = cur.fetchall()

        # Get test cases for each stage
        for stage in stages:
            cur.execute(
                "SELECT description, inputData, expectedOutput, orderIndex FROM stage_test_cases "
                "WHERE stageId = %s ORDER BY orderIndex",
                (stage["id"],)
            )
            stage["testCases"] = cur.fetchall()

        # Generate cumulative test files
        for i, stage in enumerate(stages):
            # Pass only this stage (not cumulative) — display only new tests for this stage
            test_content = make_test_file(title, title.replace(" ", ""), [stage])
            cur.execute(
                "UPDATE problem_stages SET testFileContent = %s WHERE id = %s",
                (test_content, stage["id"])
            )
            print(f"  [{title}] Stage {stage['stageNumber']}: {len(test_content)} chars, "
                  f"{len(stage['testCases'])} tests for this stage")

    conn.commit()
    cur.close()
    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
