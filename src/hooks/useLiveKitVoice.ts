import { useState, useCallback, useEffect } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useLiveKitVoice = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const { toast } = useToast();

  const connect = useCallback(async (roomName: string, participantName: string) => {
    try {
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: { roomName, participantName },
      });

      if (error) throw error;
      if (!data?.token) throw new Error('No token received');

      const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://my-ai-assistant-3y4y9yxx.livekit.cloud';

      // Create room and connect
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
      });

      // Set up event listeners
      newRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          console.log('Subscribed to audio track');
        }
      });

      newRoom.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setIsAgentSpeaking(newRoom.canPlaybackAudio);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        console.log('Disconnected from room');
      });

      // Connect to LiveKit
      await newRoom.connect(LIVEKIT_URL, data.token);
      
      // Enable microphone
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      setRoom(newRoom);
      setIsConnected(true);

      toast({
        title: "Connected",
        description: "Voice assistant is ready. Start speaking!",
      });
    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: "destructive",
      });
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setIsAgentSpeaking(false);
    }
  }, [room]);

  const toggleMicrophone = useCallback(async () => {
    if (room) {
      const isEnabled = room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(!isEnabled);
    }
  }, [room]);

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    connect,
    disconnect,
    toggleMicrophone,
    isConnected,
    isAgentSpeaking,
    isMicrophoneEnabled: room?.localParticipant.isMicrophoneEnabled ?? false,
  };
};
