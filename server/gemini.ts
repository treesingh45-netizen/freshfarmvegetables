import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { Product } from '../src/types';

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API key is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateKitchenProcurementPlan(
  kitchenBrief: string,
  catalog: Product[]
): Promise<{
  summary: string;
  recommendations: {
    productId: string;
    productName: string;
    recommendedQuantity: number;
    unitSuggestion: string;
    culinaryReasoning: string;
  }[];
  modelUsed: string;
}> {
  const ai = createGeminiClient();
  const activeProducts = catalog
    .filter((p) => p.enabled)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      origin: p.origin,
      isSpecialty: p.isSpecialty,
      applications: p.culinaryApplications,
    }));

  const systemInstruction = `You are a senior culinary procurement specialist for Fresh Farm Vegetables in DHA Phase 6, Lahore.
Analyze the restaurant, hotel, cafe, or catering kitchen brief and calculate practical fresh vegetable requirements.
Rules:
1. ONLY recommend products that exist in the provided Fresh Farm Vegetables catalog JSON, using exact productId and productName values.
2. Account for realistic kitchen prep trim loss, portion weights, and cold-chain practicality (for example, highlighting Vacuum-Packed Lettuce or Iceberg Lettuce when high-volume burger, wrap, or banquet salad prep is involved).
3. Never invent prices, discounts, or delivery time promises.
4. Keep text concise, plain, and strictly free of emojis.`;

  const prompt = `Available Fresh Farm Vegetables Catalog:
${JSON.stringify(activeProducts)}

Customer Kitchen / Menu / Event Requirement:
${kitchenBrief}`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: 'Brief 1-2 sentence procurement overview tailored to the kitchen brief.',
      },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
            productName: { type: Type.STRING },
            recommendedQuantity: { type: Type.INTEGER },
            unitSuggestion: {
              type: Type.STRING,
              description: 'Practical ordering unit such as kg, heads, packs, or bunches.',
            },
            culinaryReasoning: {
              type: Type.STRING,
              description: 'Short explanation of yield and menu usage.',
            },
          },
          required: [
            'productId',
            'productName',
            'recommendedQuantity',
            'unitSuggestion',
            'culinaryReasoning',
          ],
        },
      },
    },
    required: ['summary', 'recommendations'],
  };

  const validIds = new Set(activeProducts.map((p) => p.productId));

  const runWithModel = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    const parsed = JSON.parse((response.text || '{}').trim());
    const filteredRecs = (parsed.recommendations || []).filter(
      (r: { productId: string; recommendedQuantity: number }) =>
        validIds.has(r.productId) && r.recommendedQuantity > 0
    );
    return {
      summary: String(parsed.summary || '').trim(),
      recommendations: filteredRecs,
      modelUsed: modelName,
    };
  };

  try {
    return await runWithModel('gemini-4-argon');
  } catch {
    return await runWithModel('gemini-3.8-flash');
  }
}

export async function parseQuickProduceList(
  rawText: string,
  catalog: Product[]
): Promise<{
  matchedItems: {
    productId: string;
    productName: string;
    quantity: number;
    unitOrPackage: string;
  }[];
  unmatchedNotes: string[];
}> {
  const ai = createGeminiClient();
  const activeProducts = catalog
    .filter((p) => p.enabled)
    .map((p) => ({ productId: p.id, productName: p.name, origin: p.origin }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: `Catalog: ${JSON.stringify(activeProducts)}\n\nCustomer text list:\n${rawText}`,
    config: {
      systemInstruction:
        'Match each requested vegetable in the customer text list to the exact productId and productName from the Fresh Farm Vegetables catalog. Default quantity to 1 if unspecified. List any unavailable items in unmatchedNotes. Never use emojis.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                productName: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                unitOrPackage: { type: Type.STRING },
              },
              required: ['productId', 'productName', 'quantity', 'unitOrPackage'],
            },
          },
          unmatchedNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['matchedItems', 'unmatchedNotes'],
      },
    },
  });

  const validIds = new Set(activeProducts.map((p) => p.productId));
  const parsed = JSON.parse((response.text || '{}').trim());
  return {
    matchedItems: (parsed.matchedItems || []).filter(
      (m: { productId: string; quantity: number }) => validIds.has(m.productId) && m.quantity > 0
    ),
    unmatchedNotes: Array.isArray(parsed.unmatchedNotes) ? parsed.unmatchedNotes : [],
  };
}

export async function parseAdminRateSheet(
  rawRatesText: string,
  catalog: Product[]
): Promise<{
  updates: {
    productId: string;
    productName: string;
    pricePkr: number;
    priceUnit: string;
  }[];
}> {
  const ai = createGeminiClient();
  const catalogRef = catalog.map((p) => ({
    productId: p.id,
    productName: p.name,
    currentUnit: p.priceUnit,
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `Catalog: ${JSON.stringify(catalogRef)}\n\nRaw market rate sheet:\n${rawRatesText}`,
    config: {
      systemInstruction:
        'Extract confirmed PKR rates from the administrator market rate note and map them strictly to matching productId entries in the catalog. Only include items where a clear numeric PKR price was stated in the input.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                productName: { type: Type.STRING },
                pricePkr: { type: Type.NUMBER },
                priceUnit: { type: Type.STRING },
              },
              required: ['productId', 'productName', 'pricePkr', 'priceUnit'],
            },
          },
        },
        required: ['updates'],
      },
    },
  });

  const validIds = new Set(catalogRef.map((p) => p.productId));
  const parsed = JSON.parse((response.text || '{}').trim());
  return {
    updates: (parsed.updates || []).filter(
      (u: { productId: string; pricePkr: number }) => validIds.has(u.productId) && u.pricePkr > 0
    ),
  };
}
