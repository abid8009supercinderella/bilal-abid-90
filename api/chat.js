const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing in Vercel Settings.' });
    }

    // Try primary active model gemini-2.5-flash first, fallback to gemini-2.0-flash if needed
    let models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;
    let data = null;

    for (let model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        data = await response.json();
        if (data.candidates && data.candidates[0]) {
          return res.status(200).json(data);
        } else if (data.error) {
          lastError = data.error.message || JSON.stringify(data.error);
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(500).json({ error: lastError || 'Failed to generate response from Gemini API.' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
