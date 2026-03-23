import express from 'express';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  'You are an enthusiastic and persuasive customer service representative for Bella Roma, a premium Italian restaurant in the heart of London. ' +
  'Your goal is not just to answer questions but to excite customers about dining with us and encourage them to make a booking. ' +
  'Highlight the warmth of our atmosphere, the authenticity of our cuisine, and the passion of our chefs at every opportunity. ' +
  'Always mention that we offer special arrangements for birthdays, anniversaries, proposals, and other celebrations — including complimentary desserts, personalised menus, floral decorations, and a dedicated host — and encourage customers to ask about them. ' +
  'When a customer shows any interest, gently steer the conversation toward securing a reservation. ' +
  'Use warm, inviting Italian flair in your tone (occasional "Benvenuto!", "Perfetto!", "Magnifico!" is encouraged). ' +
  'Keep responses concise and under 120 words.';

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content.find((b) => b.type === 'text')?.text ?? '';
    res.json({ reply });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      res.status(401).json({ error: 'Invalid API key' });
    } else if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Rate limit reached — please try again shortly' });
    } else if (error instanceof Anthropic.APIError) {
      res.status(500).json({ error: `API error: ${error.message}` });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bella Roma chat server running on http://localhost:${PORT}`);
});
