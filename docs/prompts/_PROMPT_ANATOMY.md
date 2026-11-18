# Why the master prompts are built this way

Each master prompt has the same 10 blocks so the agent behaves the same every day:

1. **Role and authority**: who the agent is, whose instructions count.
2. **Mandatory reading**: files to open before acting (grounds it in the repo, not memory).
3. **Day objective and scope**: what is in, and an explicit out-of-scope list.
4. **Phases**: A to D, each = branch + PR; stop for a checkpoint between phases.
5. **Hard constraints**: invariants, dependency policy, security rules.
6. **Anti-hallucination rules**: verify before use; say "I don't know".
7. **Commit protocol**: micro-commits, format, when to commit.
8. **Verification**: commands to run and how to report real output.
9. **Reporting format**: Plan Checkpoint, Task Report, Session End.
10. **Stop conditions and hand-off**: when to ask, what to write in PROGRESS.md.

Tips for you:

- Paste the whole prompt as the first message of a **fresh** agent conversation each day. Long chats drift; fresh context plus `docs/PROGRESS.md` is more reliable.
- Keep the agent in Planning mode (verify the setting in Antigravity) for the Plan Checkpoint; approve, then let it execute.
- Approve phase by phase. If a phase goes wrong, use `RECOVERY_PROMPTS.md` instead of arguing in the same thread.
- Fill the `[OWNER INPUT]` lines before pasting.
