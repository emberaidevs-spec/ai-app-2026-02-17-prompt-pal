export default async function handler(req, res) {
  try {
    const { method, headers, body } = req;
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (method === 'OPTIONS') {
      return res.writeHead(200, corsHeaders).end();
    }

    if (method !== 'POST' || headers['content-type'] !== 'application/json') {
      return res.status(405).json({ error: 'Only POST requests with JSON body are allowed' });
    }

    const { feature, input } = JSON.parse(body);
    const features = {
      'Text-to-Prompt': 'Generate a prompt based on the given text',
      'Image-to-Prompt': 'Generate a prompt based on the given image description',
      'Mood Board Generation': 'Generate a prompt based on the given mood board description',
    };

    if (!features[feature]) {
      return res.status(400).json({ error: 'Invalid feature' });
    }

    const systemPrompt = `You are an AI assistant for PromptPal, a tool that generates detailed prompts for Midjourney/DALL-E. Your goal is to assist artists, designers, and writers in sparking new ideas and exploring their creativity. You will receive a ${features[feature]}. Respond with a unique and often surprising prompt that can be shared with the community.`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from Groq API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ prompt: aiResponse }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}