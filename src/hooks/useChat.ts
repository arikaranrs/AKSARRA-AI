import { useState, useRef } from "react";
import { useToast } from "./use-toast";
import { useTextToSpeech } from "./useTextToSpeech";

export interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

export const useChat = (language: string = "en-US") => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech(language);

  const sendMessage = async (userMessage: string, attachments?: File[]) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Convert files to base64
    const images: string[] = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        images.push(base64);
      }
    }

    const newUserMessage: Message = { 
      role: "user", 
      content: userMessage,
      images: images.length > 0 ? images : undefined
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    stopSpeaking(); // Stop any ongoing speech

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, newUserMessage] }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again later.",
            variant: "destructive",
          });
        } else if (response.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add credits to your workspace.",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;
      let lastSentenceEnd = 0;

      // Add assistant message immediately
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.content = assistantMessage;
                }
                return updated;
              });

              // Speak complete sentences as they arrive
              const sentenceMatch = assistantMessage.slice(lastSentenceEnd).match(/[^.!?]+[.!?]+/g);
              if (sentenceMatch) {
                sentenceMatch.forEach(sentence => {
                  speak(sentence);
                  lastSentenceEnd += sentence.length;
                });
              }
            }
          } catch (e) {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Speak any remaining text that doesn't end with punctuation
      if (assistantMessage.length > lastSentenceEnd) {
        speak(assistantMessage.slice(lastSentenceEnd));
      }

      setIsLoading(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Request aborted - user sent new message");
        return; // Don't show error for intentional abort
      }
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { messages, isLoading, isSpeaking, sendMessage, stopSpeaking };
};
