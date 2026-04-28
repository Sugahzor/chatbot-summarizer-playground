# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## CV screening — job criteria files

CV screening uses RAG over a set of role-specific criteria files in `rag/jobs/`. Each file describes one role and is indexed into the in-memory vector store at server startup.

### File location and naming

- Path: `packages/server/rag/jobs/<role-slug>.md`
- The filename (without `.md`) becomes the **role slug** sent in API requests and shown in the client dropdown.
- Use **kebab-case** for slugs: `node-backend.md`, `java-backend.md`, `ai-engineer.md`.
- Avoid spaces, uppercase, or special characters — the slug travels through HTTP and form data.

### Required structure

Every file must contain these three sections, in this order, each starting with a level-2 heading (`## `):

```markdown
# <Human-readable role title>

## Must have

- bullet
- bullet

## Nice to have

- bullet
- bullet

## Red flags

- bullet
- bullet
```

The level-1 heading (`# Title`) is optional and ignored by the indexer — it's there for humans reading the file. Only the `## ` sections become searchable chunks.

### How indexing works

At startup, `index.ts` walks `rag/jobs/`, and for each `.md` file:

1. Reads the file contents.
2. Splits the text on `\n##\s+` (newline + `## ` + whitespace).
3. Treats each resulting section as a **chunk**.
4. Embeds the chunk via OpenAI `text-embedding-3-small`.
5. Pushes `{ role, text, embedding }` into the vector store.

A 3-section file produces 3 chunks. With four roles, the store ends up with 12 chunks total.

### Writing good criteria

Embedding quality determines retrieval quality. A few rules of thumb:

- **One bullet per concrete signal.** `Express, Fastify, or NestJS in production` embeds with clear semantic neighbors. `Strong engineer` does not.
- **Don't merge unrelated requirements into one bullet.** `PostgreSQL and Kafka and Redis` dilutes the embedding — split them.
- **Keep bullets short** (~one line). Long paragraphs blur the signal across too many concepts.
- **Include red flags.** They give the LLM permission to push back on weak candidates instead of just enumerating strengths.
- **Use natural language.** Bullets are read by an embedding model, not parsed — `5+ years backend experience` is better than `experience>=5`.

### Adding a new role

1. Create `rag/jobs/<new-slug>.md` following the structure above.
2. Restart the server (`bun run dev` already watches, so saving triggers a reload).
3. The new role appears automatically in `GET /api/jobs/roles` and in the client dropdown.

No code changes required — discovery is filesystem-driven.

### Editing an existing role

Same — save the file, server restarts, new chunks replace old ones in the in-memory store. Note that since the store is in-memory only, **every restart re-runs all embeddings**. With ~12 chunks that's a few seconds; if you grow this to hundreds of chunks, consider persisting the embeddings to disk (or moving to pgvector).

### Common mistakes to avoid

- **Using `###` instead of `##`** for section headings → those subsections won't be split out as chunks; they'll get glued onto the parent chunk.
- **Skipping a section** (e.g., no `## Red flags`) → only works if you're OK with the LLM not having that signal. The screening prompt assumes all three exist.
- **Naming the file `Senior Backend.md`** → the space breaks URL/form handling. Use `senior-backend.md`.
- **Putting non-criteria content in the file** (e.g., notes, history) → it gets embedded along with the rest and pollutes retrieval. Keep these files lean.
