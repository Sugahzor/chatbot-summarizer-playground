import OpenAI from 'openai';
import { conversationRepository } from '../repositories/conversation.repository';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

type ChatResponse = {
  id: string;
  message: string;
};

export const chatService = {
  async sendMessage(
    prompt: string,
    conversationId: string
  ): Promise<ChatResponse> {
    const openaiResponse = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 200,
      previous_response_id:
        conversationRepository.getLastResponseId(conversationId),
    });

    conversationRepository.setLastResponseId(conversationId, openaiResponse.id);
    return { id: openaiResponse.id, message: openaiResponse.output_text };
  },
};
