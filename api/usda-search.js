// Vercel serverless function (auto-deployed from the /api folder).
//
// Why this exists: browsers cannot call api.nal.usda.gov directly because that
// endpoint doesn't send the CORS header a cross-origin fetch requires, so a
// direct browser call fails. This tiny proxy sits in front of it -- the browser
// calls /api/usda-search (same origin, no CORS problem) and we forward the
// request to USDA server-side.
//
// USDA FoodData Central is FREE. Get a personal key in ~2 min at
// https://fdc.nal.usda.gov/api-key-signup.html and set it as an environment
// variable in your hosting dashboard. This reads either name so you don't have
// to reconfigure an existing setup:
//   - USDA_API_KEY       (preferred -- server-side only, not exposed to browsers)
//   - VITE_USDA_API_KEY  (also works; note this name is client-exposed by Vite)

const DATA_TYPES = "Foundation,SR Legacy,Survey (FNDDS)";

export default async function handler(req, res) {
  const apiKey = process.env.USDA_API_KEY || process.env.VITE_USDA_API_KEY;
  // Signal "no key configured" distinctly so the client can show a helpful hint
  // rather than a generic error.
  if (!apiKey) {
    return res.status(200).json({ error: "no-key" });
  }

  const query = req.query && typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (query.length < 2) {
    return res.status(200).json({ foods: [] });
  }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=10&dataType=${encodeURIComponent(DATA_TYPES)}`;
    const usdaRes = await fetch(url);
    if (!usdaRes.ok) {
      const errText = await usdaRes.text().catch(() => "");
      console.error("USDA API error:", usdaRes.status, errText);
      return res.status(502).json({ error: "USDA lookup failed. Check your USDA API key." });
    }
    const data = await usdaRes.json();
    // Forward only the fields the client maps (see mapUSDAFood), keeping the
    // response small and fast.
    const foods = (data.foods || []).slice(0, 10).map((f) => ({
      fdcId: f.fdcId,
      description: f.description,
      brandOwner: f.brandOwner,
      dataType: f.dataType,
      foodNutrients: f.foodNutrients,
    }));
    // Let the CDN/browser cache identical searches briefly.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    return res.status(200).json({ foods });
  } catch (e) {
    console.error("usda-search proxy error:", e);
    return res.status(502).json({ error: "USDA lookup failed." });
  }
}
