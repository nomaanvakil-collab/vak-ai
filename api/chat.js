module.exports = async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  var body = req.body || {};
  var need = process.env.ACCESS_CODE;
  if (need && body.code !== need) return res.status(401).json({ error: "bad_code" });

  var prompt = String(body.prompt || "");
  if (!prompt || prompt.length > 12000) return res.status(400).json({ error: "bad_prompt" });

  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ text: "Setup problem: ANTHROPIC_API_KEY is missing on Vercel. Check the name, then redeploy." });

  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }]
      })
    });
    var d = await r.json();
    if (!r.ok) {
      var msg = (d && d.error && d.error.message) || ("status " + r.status);
      return res.status(200).json({ text: "Setup problem from the AI service: " + msg });
    }
    var text = (d.content || []).map(function (c) { return c.text || ""; }).join("");
    return res.status(200).json({ text: text });
  } catch (e) {
    return res.status(200).json({ text: "Server problem: " + e.message });
  }
};
