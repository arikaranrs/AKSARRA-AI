import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomName, participantName } = await req.json();

    if (!roomName || !participantName) {
      throw new Error('roomName and participantName are required');
    }

    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create JWT token for LiveKit
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour expiration

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      exp,
      iss: LIVEKIT_API_KEY,
      nbf: now,
      sub: participantName,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      }
    };

    const base64UrlEncode = (str: string) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    // Use Web Crypto API for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(LIVEKIT_API_SECRET);
    const algorithm = { name: 'HMAC', hash: 'SHA-256' };
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      algorithm,
      false,
      ['sign']
    );

    const signatureData = encoder.encode(signatureInput);
    const signatureBuffer = await crypto.subtle.sign(
      algorithm.name,
      key,
      signatureData
    );

    const signatureArray = new Uint8Array(signatureBuffer);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const signature = signatureBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

    console.log('Generated LiveKit token for:', participantName, 'in room:', roomName);

    return new Response(
      JSON.stringify({ token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
