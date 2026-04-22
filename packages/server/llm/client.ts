import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

type GenerateTextOptions = {
  model?: string;
  instructions?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  previousResponseId?: string;
};

type GenerateTextResult = {
  text: string;
  id: string;
};

export const llmClient = {
  async generateText({
    model = 'gpt-4.1',
    prompt,
    temperature = 0.2,
    maxTokens = 300,
    instructions,
    previousResponseId,
  }: GenerateTextOptions): Promise<GenerateTextResult> {
    const response = await client.responses.create({
      model,
      instructions,
      input: prompt,
      temperature,
      max_output_tokens: maxTokens,
      previous_response_id: previousResponseId,
    });
    return {
      text: response.output_text,
      id: response.id,
    };
  },
};
