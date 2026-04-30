import { GoogleGenAI } from '@google/genai';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const GEN_AI_MODEL = 'gemini-3-flash-preview';

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getProductContext() {
  try {
    const q = query(
      collection(db, 'products'),
      where('stock', '>', 0),
      limit(20)
    );
    const snap = await getDocs(q);
    const products = snap.docs.map(doc => ({
      name: doc.data().nameBn,
      price: doc.data().salePrice || doc.data().price,
      stock: doc.data().stock,
      category: doc.data().categoryId
    }));

    return JSON.stringify(products);
  } catch (err) {
    console.error('Error fetching product context:', err);
    return '[]';
  }
}

export const SYSTEM_INSTRUCTION = `
You are "glixbd AI", the premium shopping assistant. 
Your primary goal is to provide FAST, accurate, and helpful support to customers in Bangladesh.

IMPORTANT RULES:
1. STOCK AWARENESS: ONLY recommend products that are currently in stock. If a product is out of stock (stock <= 0), do not mention it as available.
2. LANGUAGE: Always communicate in polite and fluent Bengali (Bangla) unless the user asks in English.
3. IDENTITY: Identify yourself as "glixbd AI".
4. SPEED: Keep your responses concise and direct to ensure speed.
5. PRODUCT INFO: Use the provided product context to suggest actual items.
6. SUPPORT: For returns or order issues, guide them to the Profiles/Order Tracking section.

Context (Available Products): {{PRODUCT_CONTEXT}}
`;

export async function* chatWithAIStream(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  const ai = getAI();
  const productContext = await getProductContext();
  const systemInstruction = SYSTEM_INSTRUCTION.replace('{{PRODUCT_CONTEXT}}', productContext);
  
  try {
    const result = await ai.models.generateContentStream({
      model: GEN_AI_MODEL,
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 500,
      },
    });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('AI Stream Error:', error);
    throw error;
  }
}

export async function chatWithAI(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  const ai = getAI();
  const productContext = await getProductContext();
  const systemInstruction = SYSTEM_INSTRUCTION.replace('{{PRODUCT_CONTEXT}}', productContext);
  
  try {
    const response = await ai.models.generateContent({
      model: GEN_AI_MODEL,
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 500,
      },
    });

    return response.text;
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
}

export async function analyzeImageForSearch(base64Image: string, mimeType: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: GEN_AI_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Identify the main product in this image. Return only 2-3 accurate keywords in Bengali (or English if more appropriate for tech/brand) that help find this specific item. No fluff, just keywords." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error('Image analysis error:', error);
    return "";
  }
}

export async function findSimilarProducts(query: string, allProducts: any[]) {
  const ai = getAI();
  try {
    const context = JSON.stringify(allProducts.map(p => ({
      id: p.id,
      name: p.nameBn,
      nameEn: p.name,
      category: p.categoryId,
      description: p.description?.substring(0, 50)
    })));

    const response = await ai.models.generateContent({
      model: GEN_AI_MODEL,
      contents: {
        parts: [
          { text: `The user is searching for: "${query}". 
          The database returned no exact matches. 
          The user might have:
          - Reversed the words (e.g. "সাদা পাঞ্জাবী" vs "পাঞ্জাবী সাদা")
          - Used synonyms or brand variations
          - Used English names for Bengali products
          - Made typos
          
          Analyze the following product list and identify the TOP 4 most relevant items based on Intent/Idea.
          Return ONLY their IDs as a comma-separated list. If nothing even remotely matches, return "none".
          
          Products List: ${context}` }
        ]
      }
    });

    const result = response.text?.trim() || "";
    if (result.toLowerCase().includes("none")) return [];
    return result.split(',').map(s => s.trim().replace(/['"\[\]]/g, ''));
  } catch (error) {
    console.error('AI similarity search error:', error);
    return [];
  }
}
