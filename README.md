# Resume Interview MVP

A resume-driven mock interview app. It generates interview questions from a resume, lets the candidate answer one question at a time, and reveals the reference answer plus feedback immediately after each submitted answer.

## Requirements

The app uses only built-in Node.js APIs and has no package dependencies.

The local system `node` may not work if Homebrew libraries are broken. In that case, use the Codex bundled Node:

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

## Run Tests

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.js
```

## Run App

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js
```

Then open:

```text
http://localhost:3000
```

For stable local testing without calling OpenAI:

```bash
USE_MOCK_LLM=true /Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js
```

## Optional Environment

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
PORT=3000
USE_MOCK_LLM=false
```

If `OPENAI_API_KEY` is missing or `USE_MOCK_LLM=true`, the app uses deterministic mock interview data so the MVP still runs locally.
