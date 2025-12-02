import { useState, useEffect, useRef } from "react";
import { useToast } from "./use-toast";

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export const useSpeechRecognition = (language: string = "en-US") => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();

    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + " ";
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use voice input.",
            variant: "destructive",
          });
        } else if (event.error !== "no-speech") {
          toast({
            title: "Recognition error",
            description: `Error: ${event.error}`,
            variant: "destructive",
          });
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast, language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript("");
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
};
