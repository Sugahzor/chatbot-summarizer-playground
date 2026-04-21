import axios from 'axios';
import { useMemo, useState } from 'react';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessages, type Message } from './ChatMessages';
import { ChatInput, type ChatFormData } from './ChatInput';

type ChatResponse = {
  message: string;
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const [error, setError] = useState<string>('');

  const onSubmit = async ({ prompt }: ChatFormData) => {
    try {
      setMessages((prev) => [...prev, { content: prompt, role: 'user' }]);
      setIsBotTyping(true);
      setError('');

      const { data } = await axios.post<ChatResponse>('/api/chat', {
        prompt,
        conversationId,
      });
      setMessages((prev) => [...prev, { content: data.message, role: 'bot' }]);
    } catch (error) {
      setError(
        'Something went wrong. Please try again later. Err: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 gap-3 mb-10 overflow-y-auto">
        <ChatMessages messages={messages} />
        {isBotTyping && <TypingIndicator />}
        {error && (
          <div className="bg-red-100 text-red-800 px-3 py-2 rounded">
            {error}
          </div>
        )}
      </div>
      <ChatInput onSubmit={onSubmit} />
    </div>
  );
};

export default Chatbot;
