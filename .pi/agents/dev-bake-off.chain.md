---
name: dev-bake-off
description: "Model bake-off — same task, three models in parallel, then compare results"
---

## scout
output: context.md
model: nvidia/qwen/qwen3.5-122b-a10b

Recon the codebase for: {task}

## parallel
- agent: impl-worker
  output: solution-codex.md
  model: openai-codex/gpt-5.3-codex
  task: "Using {chain_dir}/context.md, implement: {task}. Write your full solution."

- agent: impl-worker
  output: solution-kimi.md
  model: nvidia/moonshotai/kimi-k2.5
  task: "Using {chain_dir}/context.md, implement: {task}. Write your full solution."

- agent: impl-worker
  output: solution-qwen.md
  model: nvidia/qwen/qwen3.5-397b-a17b
  task: "Using {chain_dir}/context.md, implement: {task}. Write your full solution."

## architect
output: comparison.md
model: nvidia/qwen/qwen3.5-397b-a17b

Compare the three solutions in {chain_dir}/solution-codex.md, {chain_dir}/solution-kimi.md, and {chain_dir}/solution-qwen.md for: {task}. Evaluate correctness, code quality, and adherence to project patterns. Pick the best approach and write a final recommendation.
