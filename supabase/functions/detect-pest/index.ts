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
    const { image, language = 'en' } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const languageInstructions: Record<string, string> = {
      en: 'Respond in English',
      hi: 'Respond in Hindi',
      ta: 'Respond in Tamil',
      bn: 'Respond in Bengali',
      mr: 'Respond in Marathi',
    };

    const systemPrompt = `You are an expert agricultural pathologist and entomologist. Analyze plant images to identify diseases, pests, and provide treatment recommendations.

${languageInstructions[language] || languageInstructions.en}.

When analyzing the image, provide:
1. **Disease/Pest Identification**: Name of the disease or pest affecting the plant
2. **Severity Level**: Low, Medium, High, or Critical
3. **Affected Plant Part**: Which part of the plant is affected
4. **Symptoms Observed**: Visual symptoms you can see
5. **Causes**: What causes this disease/pest
6. **Treatment Recommendations**: 
   - Organic treatments
   - Chemical treatments (with safety precautions)
   - Preventive measures
7. **Recovery Timeline**: Expected recovery time with proper treatment

Format your response as valid JSON with this structure:
{
  "identified": true/false,
  "disease_name": "name of disease or pest",
  "severity": "Low/Medium/High/Critical",
  "affected_part": "affected plant part",
  "symptoms": ["symptom1", "symptom2"],
  "causes": "cause description",
  "organic_treatment": ["treatment1", "treatment2"],
  "chemical_treatment": ["treatment1 with safety note", "treatment2"],
  "prevention": ["prevention1", "prevention2"],
  "recovery_time": "estimated recovery time",
  "confidence": 85,
  "additional_notes": "any important additional information"
}

If you cannot identify any disease or pest (healthy plant), return:
{
  "identified": false,
  "disease_name": "No disease detected",
  "severity": "None",
  "message": "The plant appears to be healthy with no visible signs of disease or pest infestation.",
  "confidence": 90,
  "prevention": ["tips for maintaining plant health"]
}`;

    console.log('Calling Lovable AI for pest detection...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this plant image for diseases and pests. Provide detailed identification and treatment recommendations.' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received:', content.substring(0, 200));

    // Parse JSON from response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          identified: false,
          disease_name: 'Analysis incomplete',
          message: content,
          confidence: 50
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      result = {
        identified: false,
        disease_name: 'Analysis incomplete',
        message: content,
        confidence: 50
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-pest function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
