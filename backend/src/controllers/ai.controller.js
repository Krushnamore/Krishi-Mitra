import { ENV } from '../lib/env.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

const groqChat = async (messages, systemPrompt = '') => {
  const cleaned = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => m.content && m.content.trim());

  const firstUserIdx = cleaned.findIndex(m => m.role === 'user');
  const validMessages = firstUserIdx >= 0 ? cleaned.slice(firstUserIdx) : cleaned;

  if (validMessages.length === 0) throw new Error('No valid messages to send');

  const body = {
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...validMessages]
      : validMessages,
  };

  console.log('Groq request — model:', body.model, '| messages:', body.messages.length);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq error:', err);
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
};

// POST /api/ai/chat
export const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ message: 'messages array required' });
    if (!ENV.GROQ_API_KEY)
      return res.status(500).json({ message: 'GROQ_API_KEY not set on server' });

    const system = `You are AgriBot, a helpful AI assistant for Indian farmers.
You provide practical advice on crop management, pest control, soil health, irrigation, government schemes, and market prices.
Answer in simple language. Keep responses concise and actionable. The user is a farmer in India.`;

    const reply = await groqChat(messages, system);
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'AI chat failed', error: error.message });
  }
};

// POST /api/ai/yojna
export const getYojnas = async (req, res) => {
  try {
    if (!ENV.GROQ_API_KEY)
      return res.status(500).json({ message: 'GROQ_API_KEY not set on server' });

    const { state, cropTypes, farmSize } = req.body;

    const prompt = `List 5-7 current Indian government agricultural schemes for a farmer in ${state || 'Maharashtra'}${cropTypes?.length ? ` who grows: ${cropTypes.join(', ')}` : ''}${farmSize ? ` with farm size: ${farmSize}` : ''}.
Return ONLY a valid JSON array with fields: name, benefit, howToApply, eligibility, ministry. No markdown, no extra text.`;

    const content = await groqChat([{ role: 'user', content: prompt }]);

    let schemes;
    try {
      schemes = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      schemes = [
        { name: 'PM-KISAN', benefit: '₹6000/year direct income support', howToApply: 'Apply at pmkisan.gov.in or nearest CSC', eligibility: 'All small and marginal farmers', ministry: 'Ministry of Agriculture & Farmers Welfare' },
        { name: 'PM Fasal Bima Yojana', benefit: 'Crop insurance at 2% premium for Kharif crops', howToApply: 'Through bank before sowing season', eligibility: 'All farmers including sharecroppers', ministry: 'Ministry of Agriculture & Farmers Welfare' },
        { name: 'Kisan Credit Card', benefit: 'Short-term credit at 4% interest', howToApply: 'Apply at any nationalized bank', eligibility: 'All farmers and sharecroppers', ministry: 'Ministry of Finance' },
        { name: 'Soil Health Card Scheme', benefit: 'Free soil testing and crop recommendations', howToApply: 'Contact local Krishi Vigyan Kendra', eligibility: 'All farmers across India', ministry: 'Ministry of Agriculture & Farmers Welfare' },
        { name: 'PM Krishi Sinchai Yojana', benefit: 'Up to 55% subsidy on drip/sprinkler irrigation', howToApply: 'Apply via state agriculture department portal', eligibility: 'All farmers with agricultural land', ministry: 'Ministry of Agriculture & Farmers Welfare' },
      ];
    }

    res.status(200).json({ schemes });
  } catch (error) {
    console.error('Yojna error:', error.message);
    res.status(500).json({ message: 'Failed to fetch schemes', error: error.message });
  }
};

// GET /api/ai/nearby-retailers
export const getNearbyRetailers = async (req, res) => {
  try {
    const { city } = req.query;
    const retailers = await User.find({ role: 'retailer' }).select('-password');

    const retailerList = retailers.map(r => ({
      id: r._id,
      name: r.name,
      phone: r.phone || '',
      shopName: r.shopName || r.name + "'s Shop",
      shopAddress: r.shopAddress || city || 'Location not set',
      email: r.email,
      city: r.location?.city || city || 'Unknown',
      lat: r.location?.lat,
      lng: r.location?.lng,
    }));

    res.status(200).json({ retailers: retailerList });
  } catch (error) {
    console.error('Nearby retailers error:', error.message);
    res.status(500).json({ message: 'Failed to fetch retailers', error: error.message });
  }
};

// POST /api/ai/crop-diagnosis
export const cropDiagnosis = async (req, res) => {
  try {
    if (!ENV.GROQ_API_KEY)
      return res.status(500).json({ message: 'GROQ_API_KEY not set on server' });

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64)
      return res.status(400).json({ message: 'imageBase64 is required' });

    const body = {
      model: 'qwen/qwen3.6-27b',
      max_tokens: 2048,
      temperature: 0.7,
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `You are an expert agricultural pathologist specializing in Indian crops.
Analyze this crop image and provide a detailed diagnosis in this EXACT JSON format only, no markdown:
{
  "cropName": "name of the crop (e.g. Wheat, Rice, Cotton, Tomato)",
  "healthStatus": "Healthy|Diseased|Stressed|Unknown",
  "confidence": "e.g. 85%",
  "disease": "disease name or None if healthy",
  "symptoms": ["symptom1", "symptom2"],
  "causes": ["cause1", "cause2"],
  "treatment": {
    "sprays": [
      { "name": "chemical/fungicide name", "dosage": "e.g. 2ml/L water", "frequency": "e.g. every 7 days for 3 weeks" }
    ],
    "organic": ["organic remedy 1", "organic remedy 2"],
    "cultural": ["cultural practice 1"]
  },
  "prevention": ["tip1", "tip2"],
  "urgency": "Low|Medium|High|Critical",
  "additionalNotes": "brief note for the farmer"
}`,
            },
          ],
        },
      ],
    };

    console.log('Crop diagnosis — model:', body.model);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq vision error:', errText);
      throw new Error(`Groq vision API error: ${errText}`);
    }

    const groqData = await groqRes.json();
    let content = groqData.choices[0].message.content || '';
    // Some Groq reasoning models can wrap output in <think>...</think> even with reasoning_effort='none';
    // strip it defensively so JSON parsing below doesn't break.
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    let diagnosis;
    try {
      diagnosis = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    res.status(200).json({ diagnosis });
  } catch (error) {
    console.error('Crop diagnosis error:', error.message);
    res.status(500).json({ message: 'Crop diagnosis failed', error: error.message });
  }
};

// GET /api/ai/retailer-products/:retailerId
export const getRetailerProducts = async (req, res) => {
  try {
    const { retailerId } = req.params;

    const products = await Product.find({ userId: retailerId, quantity: { $gt: 0 } })
      .select('productName quantity unit costPerUnit category')
      .sort({ productName: 1 });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Retailer products error:', error.message);
    res.status(500).json({ message: 'Failed to fetch retailer products', error: error.message });
  }
};