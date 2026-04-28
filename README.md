# chatbot-summarizer-playground

A small playground app that combines an OpenAI-powered chatbot, two Hugging Face summarization flows, and a multi-role CV screening tool built on RAG. Built as a Bun monorepo with a React client and an Express server.

## Stack

- **Runtime / package manager:** [Bun](https://bun.com) (workspaces)
- **Server:** Bun + Express 5, Prisma (Postgres/SQLite via `DATABASE_URL`), OpenAI SDK, `@huggingface/inference`
- **Client:** React 19 + Vite, Tailwind v4, shadcn/ui, TanStack Query, react-hook-form, react-markdown
- **Tooling:** Prettier, Husky + lint-staged, ESLint (client)

## Project structure

```
chatbot-summarizer-playground/
├── packages/
│   ├── client/                  # Vite + React frontend
│   └── server/
│       ├── controllers/         # Express handlers (chat, review)
│       ├── services/            # business logic
│       ├── repositories/        # Prisma data access
│       ├── llm/
│       │   ├── client.ts        # unified LLM client (OpenAI + HF)
│       │   └── prompts/         # prompt templates (.txt / .md)
│       ├── rag/
│       │   ├── jobs/            # role-specific job criteria (one .md per role)
│       │   └── vector-store.ts  # in-memory embeddings + cosine search
│       ├── prisma/              # schema + migrations
│       └── routes.ts            # Express router
├── package.json                 # workspace root
└── tsconfig.json
```

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Environment variables

Create `packages/server/.env`:

```env
OPENAI_API_KEY=sk-...
HF_TOKEN=hf_...
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=3000              # optional, defaults to 3000
```

| Variable         | Purpose                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `OPENAI_API_KEY` | Auth for OpenAI Responses API (chatbot)                           |
| `HF_TOKEN`       | Auth for Hugging Face Inference (summarization, chat completions) |
| `DATABASE_URL`   | Prisma connection string                                          |
| `PORT`           | Server port (default `3000`)                                      |

### 3. Database

```bash
cd packages/server
bunx prisma migrate dev
bunx prisma generate
```

## Running

From the repo root:

```bash
bun run dev
```

Or per package:

```bash
bun --filter server dev      # server with --watch
bun --filter client dev      # Vite dev server
```

## LLM client

`packages/server/llm/client.ts` exposes a single `llmClient` object with three methods. Two providers are wired up:

- **OpenAI** via the official SDK, using the **Responses API**
- **Hugging Face Inference** via `@huggingface/inference`

### `generateText(options)` — OpenAI chatbot

Wraps `openAIClient.responses.create`. Used by the chat endpoint (`POST /api/chat`).

| Option               | Default      | Description                                                                                                                                               |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`              | `gpt-4.1`    | OpenAI model name.                                                                                                                                        |
| `instructions`       | _(none)_     | System-style instructions prepended to the conversation. Use it to set tone, persona, or rules.                                                           |
| `prompt`             | **required** | The user input for this turn (becomes the `input` field).                                                                                                 |
| `temperature`        | `0.2`        | Sampling randomness. Low = deterministic / focused; raise toward `1.0` for more creative output.                                                          |
| `maxTokens`          | `300`        | Caps the response length (mapped to `max_output_tokens`). Keeps cost and latency predictable.                                                             |
| `previousResponseId` | _(none)_     | Chains turns using the Responses API's stateful conversation feature. Pass back the `id` returned by the previous call to continue the same conversation. |

Returns `{ text, id }` — `id` should be persisted per conversation so the next call can pass it as `previousResponseId`.

### `summarize(text)` — Hugging Face summarization

Single-shot abstractive summarization via the BART model.

- **Model:** `facebook/bart-large-cnn` (hardcoded)
- **Provider:** `hf-inference`
- **Input:** raw text
- **Output:** `{ summary }`

Good for summarizing one document. Not configurable from the call site — change the model in `client.ts` if needed.

### `summarizeReviews(reviews)` — Hugging Face chat completion

Summarizes a batch of product reviews using a chat-completion model with a custom system prompt.

- **Model:** `meta-llama/Llama-3.1-8B-Instruct:novita` (hardcoded; routed through HF's Novita provider)
- **System prompt:** loaded from `llm/prompts/hf-summarize-reviews.txt` (imported as a text module)
- **User message:** the concatenated reviews string
- **Output:** the assistant's `message.content` (string), or `''` if the response is empty

Used by `POST /api/products/:id/reviews/summarize`.

## CV screening (RAG)

A retrieval-augmented screening tool that matches uploaded PDF CVs against role-specific job criteria. HR picks a role, drops in up to 20 PDFs, and gets back per-CV verdicts (score, strengths, gaps, recommendation).

**How it works:** at startup, each `.md` file in `packages/server/rag/jobs/` is split into chunks and embedded into an in-memory vector store, tagged by role. At upload time each CV is parsed (via `unpdf`), embedded, and matched against the chunks for the selected role using cosine similarity. The top matches are passed to the LLM as context for the screening verdict.

For the full file format, indexing rules, and instructions on adding or editing roles, see the **[Job criteria files section in the server README](./packages/server/README.md#cv-screening--job-criteria-files)**.

## API endpoints

| Method | Path                                  | Description                                 |
| ------ | ------------------------------------- | ------------------------------------------- |
| GET    | `/`                                   | Health check                                |
| GET    | `/api/hello`                          | Sample JSON response                        |
| POST   | `/api/chat`                           | Send a chat message (uses `generateText`)   |
| GET    | `/api/products/:id/reviews`           | List product reviews                        |
| POST   | `/api/products/:id/reviews/summarize` | Summarize reviews (uses `summarizeReviews`) |
| GET    | `/api/jobs/roles`                     | List available roles for CV screening       |
| POST   | `/api/screen-cvs`                     | Screen one or more CVs against a role (RAG) |

## Notes

- Prompt templates live in `packages/server/llm/prompts/` and are imported as raw text — keep them version-controlled alongside the code.
- The two HF methods hardcode their model and provider; promote them to options if you need runtime selection.
- The Responses API's `previousResponseId` is the cheapest way to maintain chat state — no need to re-send full history client-side.
