import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useChat } from "@/hooks/useChat";
import { Sparkles, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [language, setLanguage] = useState("en-US");
  const { messages, isLoading, isSpeaking, sendMessage, stopSpeaking } = useChat(language);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient">
                AKSAARA AI Assistant
              </h1>
              <p className="text-xs text-muted-foreground">
                Trained by Saravanan & Arikaran
              </p>
            </div>
          </div>
          {isSpeaking && (
            <Button
              size="icon"
              variant="ghost"
              onClick={stopSpeaking}
              className="relative"
            >
              <Volume2 className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </Button>
          )}
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full px-4 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-br from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient">
              Welcome to AKSAARA AI
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Ask me anything! I provide fast, accurate answers with deep reasoning.
              Upload images, documents, or videos for multi-modal analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {[
                "Explain quantum computing simply",
                "Write a Python web scraper",
                "How to learn machine learning?",
                "Optimize this SQL query",
              ].map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(suggestion)}
                  className="p-4 rounded-xl border bg-card hover:bg-chat-hover transition-colors text-left text-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                images={msg.images}
                isStreaming={isLoading && idx === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput 
        onSend={sendMessage} 
        disabled={isLoading}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};

export default Index;
