import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  // Require authenticated user (prevents anonymous abuse of AI quota)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (authErr || !claims?.claims?.sub) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }


  try {
    const { imageBase64, jobDescription, propertyType, services } = await req.json();

    if (!imageBase64 && !jobDescription) {
      return jsonResponse(req, { error: "Provide an image or job description" }, 400);
    }

    const systemPrompt = `You are an expert service business estimator. Analyze the provided property photo and/or job description to generate a detailed quote estimate.

Return a JSON object with this exact structure:
{
  "summary": "Brief description of what you see and recommend",
  "line_items": [
    { "description": "Service name or task", "quantity": 1, "unit_price": 150.00, "reasoning": "Why this is needed" }
  ],
  "notes": "Any additional recommendations or caveats",
  "confidence": "high" | "medium" | "low"
}

Consider:
- Property condition and size from the image
- Common industry pricing for the services described
- Include labor and materials as separate line items when appropriate
- Be realistic with pricing based on US market rates
${services ? `Available services: ${services}` : ""}
${propertyType ? `Property type: ${propertyType}` : ""}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    const userContent: any[] = [];
    if (jobDescription) {
      userContent.push({ type: "text", text: `Job description: ${jobDescription}` });
    }
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      });
    }
    messages.push({ role: "user", content: userContent });

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, line_items: [], notes: "Could not parse structured response", confidence: "low" };
    }

    return jsonResponse(req, parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse(req, { error: message }, 500);
  }
});
