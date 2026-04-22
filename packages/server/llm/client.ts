import OpenAI from 'openai';
import { InferenceClient } from '@huggingface/inference';
import template from '../llm/prompts/hf-summarize-reviews.txt';

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const inferenceClient = new InferenceClient(process.env.HF_TOKEN);

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

type SummarizeTextResult = {
  summary: string;
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
    const response = await openAIClient.responses.create({
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

  async summerize(text: string): Promise<SummarizeTextResult> {
    const output = await inferenceClient.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      provider: 'hf-inference',
    });
    return {
      summary: Array.isArray(output)
        ? output[0].summary_text
        : output.summary_text,
    };
  },

  async summerizeReviews(reviews: string) {
    const chatCompletion = await inferenceClient.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct:novita',
      messages: [
        {
          role: 'system',
          content: template,
        },
        {
          role: 'user',
          content: reviews,
        },
      ],
    });
    return chatCompletion?.choices[0]?.message.content || '';
  },
};
