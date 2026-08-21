---
name: dev-implement
description: "Quick implement pipeline: scout → plan → build (no review step)"
---

## scout
output: context.md
model: nvidia/qwen/qwen3.5-122b-a10b

Quick recon of the codebase for: {task}

## planner
output: plan.md
model: nvidia/qwen/qwen3.5-397b-a17b

Based on {chain_dir}/context.md, create a focused implementation plan for: {task}

## impl-worker
output: progress.md
model: openai-codex/gpt-5.3-codex

Implement the plan in {chain_dir}/plan.md for: {task}. Update progress as you go.
