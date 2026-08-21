---
name: dev-research
description: "Research pipeline: scout the code, then deep-dive analysis"
---

## scout
output: context.md
model: nvidia/qwen/qwen3.5-122b-a10b

Quick recon of the codebase for: {task}

## research-analyst
output: research.md
model: nvidia/qwen/qwen3.5-397b-a17b

Deep analysis based on {chain_dir}/context.md for: {task}. Produce a structured research brief.
