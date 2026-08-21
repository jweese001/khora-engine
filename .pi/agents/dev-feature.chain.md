---
name: dev-feature
description: "Full feature pipeline: scout → architect → implement → review"
---

## scout
output: context.md
model: nvidia/qwen/qwen3.5-122b-a10b

Investigate the codebase for: {task}. Focus on relevant types, existing patterns, and files that would need to change.

## architect
output: plan.md
model: nvidia/qwen/qwen3.5-397b-a17b

Based on the codebase analysis in {chain_dir}/context.md, design a solution for: {task}. Write a detailed implementation plan.

## impl-worker
output: progress.md
model: openai-codex/gpt-5.3-codex

Implement the plan in {chain_dir}/plan.md for: {task}. Follow the design exactly. Update progress as you go.

## reviewer
model: nvidia/moonshotai/kimi-k2.5

Review the implementation for: {task}. Check {chain_dir}/plan.md against {chain_dir}/progress.md. Run tests. Fix any issues found.
