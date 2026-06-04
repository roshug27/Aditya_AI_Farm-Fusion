// Edge function: find-markets
// Suggests nearest mandis/buyers based on farmer location, crop, and demand.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { location, crop, quantity, language } = body ?? {};
    const lang = language || 'English';

    if (!location || !crop) {
      return new Response(
        JSON.stringify({ error: "location and crop are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an Indian agriculture market intelligence expert with deep knowledge of mandis (APMC markets), wholesale buyers, FPOs, and processing units across India. Given a farmer's location, crop, and quantity, recommend the 5 best nearby markets/buyers where they can sell for maximum profit. Use realistic Indian mandi names, distances, and current price ranges in INR per quintal. Consider transport costs and demand level when ranking.

CRITICAL LANGUAGE INSTRUCTIONS: You MUST respond with ALL text fields (name, location, transport, tip) in ${lang} language ONLY. Do NOT mix languages. Every string value must be in ${lang}.`;

    const userPrompt = `Farmer location: ${location}
Crop: ${crop}
Quantity: ${quantity || "not specified"}
Response language: ${lang}

Suggest the 5 best nearby markets/mandis/buyers ranked by overall profitability (price minus transport). Include a mix of APMC mandis, wholesale buyers, and FPOs/processors when appropriate. ALL text must be in ${lang}.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_markets",
              description: "Return ranked list of markets/buyers for the crop.",
              parameters: {
                type: "object",
                properties: {
                  markets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Mandi/buyer name" },
                        type: { type: "string", enum: ["APMC Mandi", "Wholesale Buyer", "FPO", "Processor", "Export Hub", "Retail Chain"] },
                        location: { type: "string", description: "City/town, state" },
                        distanceKm: { type: "number", description: "Distance in km from farmer" },
                        avgPrice: { type: "number", description: "Average price ₹/quintal" },
                        priceRange: { type: "string", description: "e.g. ₹2100-₹2400/quintal" },
                        demand: { type: "string", enum: ["Very High", "High", "Moderate", "Low"] },
                        transport: { type: "string", description: "Suggested transport mode + est. cost" },
                        netProfitScore: { type: "number", description: "0-100 overall profitability score" },
                        tip: { type: "string", description: "One-line selling tip" },
                      },
                      required: ["name", "type", "location", "distanceKm", "avgPrice", "priceRange", "demand", "transport", "netProfitScore", "tip"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "1-2 sentence overall recommendation" },
                },
                required: ["markets", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_markets" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : null;

    if (!args) {
      return new Response(JSON.stringify({ error: "No structured response from AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort by netProfitScore desc
    args.markets?.sort((a: any, b: any) => (b.netProfitScore ?? 0) - (a.netProfitScore ?? 0));

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-markets error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
