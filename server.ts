import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  getDatabaseStatus, 
  loadAllData, 
  syncAllData, 
  clearAllDatabase,
  testMongoConnection
} from './server/db';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Prestige Owner CRM – SellMyGhar' });
  });

  // Database Endpoint 1: Get Connection & Sync Status
  app.get('/api/db/status', async (req, res) => {
    try {
      const status = await getDatabaseStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get DB status' });
    }
  });

  // Database Endpoint: Test MongoDB Connection directly
  app.post('/api/db/test-connection', async (req, res) => {
    try {
      const { uri } = req.body || {};
      const result = await testMongoConnection(uri);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error testing MongoDB connection' });
    }
  });

  // Database Endpoint 2: Load complete CRM state from MongoDB / persistent store
  app.get('/api/db/load-all', async (req, res) => {
    try {
      const data = await loadAllData();
      res.json(data);
    } catch (err: any) {
      console.error('Error loading CRM data:', err);
      res.status(500).json({ error: err.message || 'Failed to load data from database' });
    }
  });

  // Database Endpoint 3: Sync & persist complete CRM state
  app.post('/api/db/sync-all', async (req, res) => {
    try {
      const state = req.body;
      const success = await syncAllData(state);
      res.json({ success, message: 'CRM state synchronized with database successfully' });
    } catch (err: any) {
      console.error('Error syncing CRM data:', err);
      res.status(500).json({ error: err.message || 'Failed to sync data' });
    }
  });

  // Database Endpoint 4: Clear all database records
  app.post('/api/db/clear', async (req, res) => {
    try {
      const success = await clearAllDatabase();
      res.json({ success, message: 'Database wiped clean to 0 records' });
    } catch (err: any) {
      console.error('Error clearing database:', err);
      res.status(500).json({ error: err.message || 'Failed to clear database' });
    }
  });

  // AI Endpoint 1: Extract intent & data from Call Notes strictly without inferring unstated intents
  app.post('/api/ai/extract-note', async (req, res) => {
    try {
      const { noteText, ownerName, project } = req.body;
      if (!noteText) {
        return res.status(400).json({ error: 'Note text is required' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback local regex parsing if API key is not yet set
        return res.json({
          extractedData: {
            saleIntent: noteText.toLowerCase().includes('sell') && noteText.toLowerCase().includes('immediate') ? 'Immediate' : 'Not Interested',
            rentalIntent: noteText.toLowerCase().includes('rent') && noteText.toLowerCase().includes('immediate') ? 'Immediate' : 'Not Interested',
            expectedPrice: 0,
            expectedRent: 0,
            summary: noteText,
            nextFollowUpSuggestion: 'Call next week'
          }
        });
      }

      const prompt = `You are an AI assistant for a real estate CRM specializing in Prestige properties in Bengaluru.
Your task is to analyze the salesperson's call/WhatsApp note for owner "${ownerName || 'Owner'}" at "${project || 'Prestige'}".

CRITICAL RULE:
DO NOT INFER or guess whether an owner wants to sell or rent based on their name, property, or assumptions.
Sale/rental intent MUST ONLY come from explicit statements made by the owner in the note.
If the note does NOT explicitly state that the owner wants to sell or rent, return "Not Interested" or "Unknown".

Possible Sale Intent values: "Immediate", "Within 3 Months", "3–6 Months", "6–12 Months", "Considering", "Not Interested"
Possible Rental Intent values: "Immediate", "Within 3 Months", "3–6 Months", "6–12 Months", "Considering", "Not Interested"
Possible Property Status values: "Self Occupied", "Rented", "Vacant", "Planning to Rent", "Planning to Sell", "Considering Both", "Sold", "Unknown"

Note to analyze:
"""
${noteText}
"""

Extract only confirmed explicit facts.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              propertyStatus: { type: Type.STRING },
              saleIntent: { type: Type.STRING },
              rentalIntent: { type: Type.STRING },
              expectedPrice: { type: Type.NUMBER, description: 'Expected sale price in INR (e.g. 21500000), 0 if not mentioned' },
              expectedRent: { type: Type.NUMBER, description: 'Expected monthly rent in INR (e.g. 55000), 0 if not mentioned' },
              marketingAgreed: { type: Type.BOOLEAN, description: 'Whether owner explicitly agreed to list or market the property' },
              keySummary: { type: Type.STRING, description: 'One concise summary sentence of the conversation outcome' },
              suggestedNextAction: { type: Type.STRING, description: 'Specific next step for the sales agent' },
              suggestedFollowUpDays: { type: Type.INTEGER, description: 'Recommended days until next follow-up call' }
            },
            required: ['propertyStatus', 'saleIntent', 'rentalIntent', 'keySummary', 'suggestedNextAction']
          }
        }
      });

      const extractedData = JSON.parse(response.text || '{}');
      res.json({ extractedData });
    } catch (err: any) {
      console.error('Error in extract-note API:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze note' });
    }
  });

  // AI Endpoint 2: Generate High-Converting Listing Titles and Descriptions
  app.post('/api/ai/generate-listing', async (req, res) => {
    try {
      const { project, bhk, areaSqFt, furnishing, floor, expectedPrice, expectedRent, type, highlights } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          title: `${project} – Luxurious ${bhk} (${areaSqFt} sq.ft) for ${type}`,
          description: `Verified ${bhk} property located at ${project}, Bengaluru. Featuring ${furnishing} interiors, ${areaSqFt} sq.ft SBA on ${floor || 'high'} floor. Unmatched community amenities.`
        });
      }

      const prompt = `Generate a high-converting, professional real estate listing title and detailed property description for a verified property in Bengaluru.
Builder/Project: ${project}
Configuration: ${bhk}
Super Built-up Area: ${areaSqFt} sq.ft
Furnishing: ${furnishing}
Floor: ${floor}
Type: ${type} (Sale or Rent)
Price/Rent: ${expectedPrice ? '₹' + expectedPrice.toLocaleString('en-IN') : (expectedRent ? '₹' + expectedRent.toLocaleString('en-IN') + '/month' : 'Price on Request')}
Special Highlights: ${highlights || 'Prime location, club house amenities, 24/7 security'}

Write a captivating title (under 80 characters) and a detailed 2-3 paragraph description highlighting layout, natural lighting, prestige branding, and connectivity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              bulletPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['title', 'description', 'bulletPoints']
          }
        }
      });

      const listingData = JSON.parse(response.text || '{}');
      res.json(listingData);
    } catch (err: any) {
      console.error('Error in generate-listing API:', err);
      res.status(500).json({ error: err.message || 'Failed to generate listing' });
    }
  });

  // AI Endpoint 3: Summarize Owner & Property History
  app.post('/api/ai/summarize-history', async (req, res) => {
    try {
      const { owner, activities, followUps, property } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: `Owner ${owner?.name} owns ${owner?.flatNumber} at ${owner?.project}. Current status is ${owner?.propertyStatus}. Logged ${activities?.length || 0} interaction(s).`
        });
      }

      const prompt = `Summarize the complete relationship history and current disposition of this real estate owner in Bengaluru.
Owner: ${owner?.name} (${owner?.project}, Flat ${owner?.flatNumber}, Block ${owner?.block})
Property Status: ${owner?.propertyStatus}
Sale Intent: ${owner?.saleIntent}
Rental Intent: ${owner?.rentalIntent}
Lead Score: ${owner?.leadScore} (${owner?.leadTemperature})
Activities / Call Logs:
${JSON.stringify(activities || [], null, 2)}
Scheduled Follow-ups:
${JSON.stringify(followUps || [], null, 2)}

Provide a concise, 3-bullet executive briefing for the sales manager and recommend the highest-leverage next move.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      });

      res.json({ summary: response.text });
    } catch (err: any) {
      console.error('Error in summarize-history API:', err);
      res.status(500).json({ error: err.message || 'Failed to summarize history' });
    }
  });

  // AI Endpoint 4: Smart Telecaller Questions
  app.post('/api/ai/telecaller-questions', async (req, res) => {
    try {
      const { owner } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          questions: [
            "Are you currently residing in the property or is it rented out?",
            "Have you considered exploring the current market value for resale or rental in your block?",
            "What timeline would work best if a verified buyer or tenant is available?"
          ]
        });
      }

      const prompt = `You are an expert sales coach for Prestige properties in Bengaluru.
Given this owner's current state:
Name: ${owner.name}
Project: ${owner.project}, Flat: ${owner.flatNumber}
Status: ${owner.propertyStatus}
Sale Intent: ${owner.saleIntent}
Rental Intent: ${owner.rentalIntent}
Contact attempts: ${owner.contactAttempts}
Last outcome: ${owner.lastContactOutcome || 'None'}

Generate 4 polite, highly effective conversation opener questions that the telecaller or agent should ask during the upcoming phone call to qualify their intent without being pushy.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              opener: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              proTip: { type: Type.STRING }
            },
            required: ['opener', 'questions', 'proTip']
          }
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.error('Error in telecaller-questions API:', err);
      res.status(500).json({ error: err.message || 'Failed to generate questions' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SellMyGhar Prestige CRM Server running on port ${PORT}`);
  });
}

startServer();
