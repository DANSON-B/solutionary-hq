export interface VoicemailAnalysis {
  transcript: string;
  summary: string;
  intent: string;
  urgency: string;
  sentiment: string;
  customer_name: string | null;
  recommended_action: string;
  tags: string[];
}

export async function analyzeVoicemail(recordingUrl: string): Promise<VoicemailAnalysis> {
  // Download Twilio recording

  const audioResponse = await fetch(recordingUrl);

  if (!audioResponse.ok) {
    throw new Error("Unable to download recording.");
  }

  const audioBuffer = await audioResponse.arrayBuffer();

  const bytes = new Uint8Array(audioBuffer);

  let binary = "";

  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  const base64 = btoa(binary);

  const prompt = `
You are an AI assistant for a field-service CRM.

Listen to the voicemail.

Return ONLY valid JSON.

Schema:

{
"transcript":"",
"summary":"",
"intent":"",
"urgency":"",
"sentiment":"",
"customer_name":null,
"recommended_action":"",
"tags":[]
}

Rules:

- transcript = exact transcription

- summary = 1-2 sentences

- intent = customer's goal

- urgency = Low, Medium or High

- sentiment = Positive, Neutral or Negative

- customer_name = null if unknown

- recommended_action = one sentence

- tags = array of short keywords

Return JSON only.
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: "audio/mpeg",
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const json = await response.json();

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  // Gemini sometimes wraps JSON in ```json ... ```
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: VoicemailAnalysis;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini response:", text);
    throw new Error("Failed to parse Gemini JSON response.");
  }

  return parsed;
}
