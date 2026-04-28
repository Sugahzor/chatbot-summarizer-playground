import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Chunk = {
  role: string;
  text: string;
  embedding: number[];
};
const store: Chunk[] = [];

// cosine will measure how similar 2 vectors are, by determining the angle between them:
//  1 identical direction (very similar meaning)
//  0 unrelated
// -1 opposite
const cosine = (a: number[], b: number[]) => {
  const dot = a.reduce(
    (accumulator, currentOf_a, index) =>
      accumulator + currentOf_a * (b[index] ?? 0),
    0
  );
  // Normalize the result so length of the vector doesn't matter, only direction:
  return dot / (Math.hypot(...a) * Math.hypot(...b));
};

const embed = async (text: string) => {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0]?.embedding;
};

export const vectorStore = {
  async indexRole(role: string, text: string) {
    const chunks = text.split(/\n##\s/).filter(Boolean);
    for (const chunk of chunks) {
      store.push({ role, text: chunk, embedding: (await embed(chunk)) ?? [] });
    }
  },

  // topK -> how many of the top mathing criteria to return
  async search(query: string, role: string, topK = 3) {
    const q = await embed(query);
    return store
      .filter((chunk) => chunk.role === role)
      .map((chunk) => ({
        text: chunk.text,
        score: cosine(q ?? [], chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  listRoles() {
    return [...new Set(store.map((chunk) => chunk.role))];
  },
};
