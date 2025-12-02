import { Button } from "./ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useLiveKitVoice } from "@/hooks/useLiveKitVoice";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const VoiceAssistant = () => {
  const { connect, disconnect, toggleMicrophone, isConnected, isAgentSpeaking, isMicrophoneEnabled } = useLiveKitVoice();
  const [roomName] = useState(`voice-room-${Date.now()}`);
  const [participantName] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect(roomName, participantName);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 flex flex-col gap-3 items-end">
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2 p-4 bg-card rounded-xl border shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isAgentSpeaking ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
              <span className="text-sm text-muted-foreground">
                {isAgentSpeaking ? 'AI Speaking...' : 'Listening'}
              </span>
            </div>
            
            <Button
              size="icon"
              variant={isMicrophoneEnabled ? "default" : "outline"}
              onClick={toggleMicrophone}
              className="w-12 h-12"
            >
              {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        onClick={handleConnect}
        className={`rounded-full w-16 h-16 shadow-lg ${
          isConnected 
            ? 'bg-destructive hover:bg-destructive/90' 
            : 'bg-gradient-to-br from-primary to-accent animate-pulse-glow'
        }`}
      >
        {isConnected ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
      </Button>
    </div>
  );
};
