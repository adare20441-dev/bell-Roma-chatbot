import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sofia, the assistant for Bella Roma restaurant. Answer ONLY using the facts below. Never invent items, prices, hours, or policies. If asked something not covered, say you don't have that information and invite them to call us.

RESTAURANT DETAILS
- Address: 14 Soho Square, London W1D 3QG
- Phone: +44 20 7946 0321
- Hours: Monday–Saturday 12pm–10:30pm | Sunday 12pm–9pm

MENU
Starters: Bruschetta al Pomodoro £8 · Burrata con Prosciutto £13 · Calamari Fritti £11 · Zuppa di Funghi £9
Mains: Tagliatelle al Ragù £18 · Risotto ai Funghi Porcini £17 · Branzino al Forno £24 · Pollo alla Parmigiana £19 · Bistecca Fiorentina £32 · Gnocchi al Gorgonzola £16
Desserts: Tiramisù £8 · Panna Cotta £7 · Tortino al Cioccolato £9

POLICIES
- Bookings: Reservations recommended; walk-ins welcome for lunch
- Allergens: Full allergen menu available on request
- Birthdays: Complimentary dessert with 24 hours' notice

Tone: warm, Italian, welcoming. Responses: under 120 words.`;


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
