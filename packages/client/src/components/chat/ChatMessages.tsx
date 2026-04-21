import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type ChatMessagesProps = {
  messages: Message[];
};
export type Message = {
  content: string;
  role: 'user' | 'bot';
};

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onMessageCopy = (e: React.ClipboardEvent): void => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', selection);
    }
  };

  return (
    <>
      {messages.map((message, index) => (
        <div
          key={index}
          ref={index === messages.length - 1 ? lastMessageRef : null}
          onCopy={onMessageCopy}
          className={`px-3 py-1 max-w-md rounded-xl ${
            message.role === 'user'
              ? 'bg-green-600 text-white self-end'
              : 'bg-gray-100 text-gray-800 self-start'
          }`}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      ))}
    </>
  );
};
