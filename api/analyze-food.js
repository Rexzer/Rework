// Vercel serverless function (auto-deployed from the /api folder).
//
// This is the ONLY place your Google Gemini API key should ever live. It reads
// from process.env.GEMINI_API_KEY -- a server-side environment variable you set
// in your hosting dashboard (Vercel: Project Settings > Environment Variables).
// Do NOT prefix it with VITE_ -- that prefix is what tells Vite to bundle a
// variable into the client-side JavaScript everyone can read. Keep it
// server-only.
//
// Why Gemini: Google's Gemini API has a genuinely free tier (no credit card
// required via Google AI Studio, rate-limited per project) that supports image
// input, so photo food-scanning costs nothing for personal use. Get a free key
// at https://aistudio.google.com/apikey.
//
// Client sends a POST with a base64-encoded photo; this function calls Gemini's
// vision model and returns a structured nutrition estimate.

const MODEL = "gemini-2.5-flash";

const PROMPT = `You are a nutrition estimation assistant inside a food-logging app. Look at this photo and identify the food shown.

Respond with ONLY a raw JSON object -- no markdown code fences, no commentary before or after -- in exactly this shape:
{
  "foodName": "short descriptive name of the dish/food shown",
  "servingDescription": "your best guess at the portion, e.g. '1 bowl, approx 350g'",
  "calories": <number, kcal for the whole portion shown>,
  "protein": <number, grams>,
  "carbs": <number, grams>,
  "fat": <number, grams>,
  "confidence": "low" | "medium" | "high",
  "notes": "one short sentence on what could make this estimate off -- e.g. hidden oil/sauce, unclear portion size, mixed dish"
}

If the photo shows multiple distinct food items together (e.g. a full plate), estimate the combined total for everything shown, not just one item.

If you cannot identify any food in the image at all, respond with exactly this instead:
{"error": "No food could be identified in this photo."}

Respond with the JSON object only.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it in your hosting dashboard's environment variables (server-side, not VITE_-prefixed), then redeploy. Get a free key at https://aistudio.google.com/apikey." });
  }

  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: "Missing image data." });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: mediaType || "image/jpeg", data: image } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          // Ask Gemini to emit raw JSON so we don't have to fight markdown fences.
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "");
      console.error("Gemini API error:", geminiRes.status, errText);
      if (geminiRes.status === 429) {
        return res.status(429).json({ error: "Gemini's free-tier rate limit was hit. Wait a minute and try again." });
      }
      return res.status(502).json({ error: "The vision model request failed. Check your GEMINI_API_KEY and that the Gemini API is enabled for your project." });
    }

    const data = await geminiRes.json();
    const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    const textBlock = parts.find((p) => typeof p.text === "string");
    const raw = textBlock ? textBlock.text : "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse model response as JSON:", raw);
      return res.status(502).json({ error: "Couldn't parse a nutrition estimate from that photo. Try a clearer, well-lit shot." });
    }

    if (parsed.error) {
      return res.status(200).json({ error: parsed.error });
    }

    return res.status(200).json({ result: parsed });
  } catch (e) {
    console.error("analyze-food handler error:", e);
    return res.status(500).json({ error: "Something went wrong analyzing that photo. Please try again." });
  }
}
