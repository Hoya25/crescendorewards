import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Create a professional S.W.E.A.T. Token image for the Mike Rowe WORKS Foundation. 
    
    Design requirements:
    - Feature a premium metallic token/coin design
    - Use the Mike Rowe WORKS brand colors: navy blue (#1a2b4a) and light blue (#5ba3d0)
    - Include "S.W.E.A.T." text prominently on the token (Skills & Work Ethic Aren't Taboo)
    - Incorporate subtle work-themed elements (tools, gears, or craftsmanship symbols)
    - Professional, clean design that represents skilled trades and work ethic
    - Premium quality feel, like a commemorative coin or medallion
    - Clean background with subtle blue tones
    - High resolution, photorealistic 3D render style
    - The token should look valuable and inspiring`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    // Return the base64 image
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        message: "S.W.E.A.T. Token image generated successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
