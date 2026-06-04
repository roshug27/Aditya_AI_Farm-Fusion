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
    const { crop_name, year, rainfall, pesticide, temperature, area } = await req.json();

    console.log('Predicting yield for:', { crop_name, year, rainfall, pesticide, temperature, area });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural AI that predicts crop yields based on environmental and farming parameters. 
Analyze the data provided and give a realistic yield prediction in kg/hectare.

Consider these factors:
- Crop type and its typical yield range (e.g., Rice: 3000-6000 kg/ha, Wheat: 2500-4500 kg/ha, Corn: 5000-12000 kg/ha, Sugarcane: 60000-100000 kg/ha)
- Historical year (recent years may have better techniques)
- Rainfall levels (optimal vs too much/too little)
- Pesticide usage (proper pest control vs overuse)
- Temperature (optimal range for the crop)
- Area size (efficiency factors)

Always provide a realistic non-zero yield prediction even in suboptimal conditions, as crops can still produce with irrigation and proper management.`;

    const userPrompt = `Predict the yield for the following crop:
- Crop: ${crop_name}
- Year: ${year}
- Rainfall: ${rainfall} mm
- Pesticide Usage: ${pesticide} kg/ha
- Average Temperature: ${temperature}°C
- Area: ${area} hectares

Use the predict_yield tool to provide your prediction.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "predict_yield",
              description: "Predict the crop yield based on environmental factors",
              parameters: {
                type: "object",
                properties: {
                  predicted_yield: {
                    type: "number",
                    description: "Predicted yield in kg/hectare (must be a positive number)"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence percentage (75-98)"
                  },
                  rainfall_impact: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "Impact of rainfall on yield"
                  },
                  temperature_impact: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "Impact of temperature on yield"
                  },
                  pesticide_impact: {
                    type: "string",
                    enum: ["positive", "negative", "neutral"],
                    description: "Impact of pesticide usage on yield"
                  },
                  recommendation_1: {
                    type: "string",
                    description: "First farming recommendation"
                  },
                  recommendation_2: {
                    type: "string",
                    description: "Second farming recommendation"
                  },
                  recommendation_3: {
                    type: "string",
                    description: "Third farming recommendation"
                  }
                },
                required: ["predicted_yield", "confidence", "rainfall_impact", "temperature_impact", "pesticide_impact", "recommendation_1", "recommendation_2", "recommendation_3"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "predict_yield" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse));

    // Extract tool call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const args = JSON.parse(toolCall.function.arguments);
    console.log('Parsed args:', args);

    // Build the prediction response
    const prediction = {
      predicted_yield: Math.max(100, args.predicted_yield || 0),
      confidence: args.confidence || 85,
      factors: {
        rainfall_impact: args.rainfall_impact || "neutral",
        temperature_impact: args.temperature_impact || "neutral",
        pesticide_impact: args.pesticide_impact || "neutral"
      },
      recommendations: [
        args.recommendation_1,
        args.recommendation_2,
        args.recommendation_3
      ].filter(Boolean)
    };

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-yield function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to predict yield" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
