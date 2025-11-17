import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate Twitch subscription reward image
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: "Generate a vibrant, modern graphic for a Twitch subscription reward. Include the iconic Twitch purple color (#9146FF), gaming elements, and streaming aesthetics. The image should be exciting and appealing for a rewards marketplace. High quality, professional design."
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!imageResponse.ok) {
      throw new Error(`Image generation failed: ${imageResponse.statusText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      throw new Error('No image generated');
    }

    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fileName = `twitch-subscription-${Date.now()}.png`;
    const filePath = `rewards/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('reward-images')
      .upload(filePath, binaryData, {
        contentType: 'image/png',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('reward-images')
      .getPublicUrl(filePath);

    // Insert reward into database
    const { data: reward, error: insertError } = await supabase
      .from('rewards')
      .insert([{
        title: 'Twitch Subscription - Your Favorite Streamer',
        description: 'Support your favorite creator with a month of Twitch subscription. Choose any partner or affiliate streamer and show your support!',
        category: 'entertainment',
        cost: 3,
        image_url: publicUrl,
        stock_quantity: null,
        is_active: true,
        is_featured: true,
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reward,
        message: 'Twitch subscription reward created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
