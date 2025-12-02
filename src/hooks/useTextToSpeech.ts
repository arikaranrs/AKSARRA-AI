import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

export const useTextToSpeech = (language: string = "en-US") => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !synthRef.current) {
      return;
    }

    isPlayingRef.current = true;
    const text = audioQueueRef.current.shift()!;

    try {
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a voice that matches the language
      const voices = synthRef.current.getVoices();
      const matchingVoice = voices.find(voice => voice.lang.startsWith(language.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length === 0) {
          setIsSpeaking(false);
        } else {
          playNextInQueue();
        }
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        toast({
          title: "Speech error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
        isPlayingRef.current = false;
        setIsSpeaking(false);
        // Continue with next item in queue
        if (audioQueueRef.current.length > 0) {
          playNextInQueue();
        }
      };

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error playing speech:', error);
      toast({
        title: "Speech error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      isPlayingRef.current = false;
      setIsSpeaking(false);
      // Continue with next item in queue
      if (audioQueueRef.current.length > 0) {
        playNextInQueue();
      }
    }
  }, [language, toast]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    // Split long text into sentences for better streaming experience
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        audioQueueRef.current.push(sentence.trim());
      }
    });

    playNextInQueue();
  }, [playNextInQueue]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
  };
};
