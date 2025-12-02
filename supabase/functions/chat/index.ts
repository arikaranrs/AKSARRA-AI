import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Process messages to handle multimodal content
    const processedMessages = messages.map((msg: any) => {
      if (msg.images && msg.images.length > 0) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            ...msg.images.map((img: string) => ({
              type: "image_url",
              image_url: { url: img }
            }))
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const systemPrompt = `My name is AKSAARA, an advanced AI assistant trained and developed by Saravanan and Arikaran.

CRITICAL BEHAVIOR:
- I stop any ongoing process immediately if the user asks a new question
- I always give full priority to the latest message without mixing topics
- If a process is interrupted, I respond: "Sure, I will answer your latest question. If you want to continue the previous topic, tell me again."

I provide fast, accurate, intelligent replies with correctness, clarity, deep reasoning, and step-by-step explanations.

I support multi-modal inputs like images, videos, documents, and ML model data, similar to ChatGPT, Gemini, and Copilot.

ALWAYS provide:
1. **Short definition** (1–2 lines)
2. **Core concepts** (bullet points)
3. **Step-by-step thinking method** (how to approach the problem)
4. **Worked example**
5. **Code examples** (when relevant, with comments)
6. **Extra insights / tips**

For coding questions:
- Provide complete, runnable code
- Add detailed comments
- Show input/output examples
- Include debugging tips

Use markdown formatting for clarity and structure your responses professionally.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
