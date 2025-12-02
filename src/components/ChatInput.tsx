import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Mic, MicOff, Languages, Paperclip, X } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

export const ChatInput = ({ onSend, disabled, language = "en-US", onLanguageChange }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition(language);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput("");
      setAttachments([]);
      resetTranscript();
      if (isListening) {
        stopListening();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type.includes('pdf') || file.type.includes('document');
      const isVideo = file.type.startsWith('video/');
      return isImage || isDocument || isVideo;
    });
    setAttachments(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm"
              >
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="en-GB">English (UK)</SelectItem>
              <SelectItem value="es-ES">Spanish</SelectItem>
              <SelectItem value="fr-FR">French</SelectItem>
              <SelectItem value="de-DE">German</SelectItem>
              <SelectItem value="it-IT">Italian</SelectItem>
              <SelectItem value="pt-BR">Portuguese</SelectItem>
              <SelectItem value="ja-JP">Japanese</SelectItem>
              <SelectItem value="ko-KR">Korean</SelectItem>
              <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
              <SelectItem value="ar-SA">Arabic</SelectItem>
              <SelectItem value="hi-IN">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask me anything or click the mic..."}
            disabled={disabled}
            rows={1}
            className="resize-none min-h-[52px] max-h-[200px]"
          />
          {isListening && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-primary">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Listening
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= 10}
          variant="outline"
          className="h-[52px] w-[52px] rounded-xl"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Button
          type="button"
          size="icon"
          onClick={toggleVoiceInput}
          disabled={disabled}
          variant={isListening ? "default" : "outline"}
          className={`h-[52px] w-[52px] rounded-xl ${isListening ? "animate-pulse-glow" : ""}`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="h-[52px] w-[52px] rounded-xl"
        >
          <Send className="w-5 h-5" />
        </Button>
        </div>
      </div>
    </form>
  );
};
