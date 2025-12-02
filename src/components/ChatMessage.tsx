import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, images, isStreaming }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 p-6 ${!isUser ? "bg-chat-ai-bg" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? "bg-chat-user-bg text-chat-user-fg" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Attachment ${idx + 1}`}
                className="max-w-xs rounded-lg border border-border"
              />
            ))}
          </div>
        )}
        <div className={`prose prose-sm max-w-none ${!isUser ? "text-chat-ai-fg" : "text-foreground"}`}>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg !mt-2 !mb-2"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-2">{children}</li>,
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
