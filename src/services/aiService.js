import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the API key from environment variables
// Ensure VITE_GEMINI_API_KEY is set in your .env file
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const aiService = {
  isConfigured: !!apiKey,
  async analyzeReports(reports) {
    if (!this.isConfigured) {
      throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an AI intelligence officer for the Nepal Police Smart Emergency Response System (SERS).
      Analyze the following live emergency case reports and provide a brief, actionable intelligence summary.
      Highlight key risks, patterns, and resource allocation recommendations for the on-duty commanders.
      Format your response with clean markdown (bullet points, bold text). Keep it concise.
      
      Live Reports Data:
      ${JSON.stringify(reports.map(r => ({ type: r.type, status: r.status, time: r.date, priority: r.priority, officer: r.officer })), null, 2)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      throw error;
    }
  },
  
  async predictRiskZones(alerts) {
    if (!this.isConfigured) {
      return [
        { zone: 'API Key Missing', today: 0, tomorrow: 0, trend: 'down', action: 'Standard Patrol' }
      ];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an AI risk predictor for a police dashboard.
      Given the following recent emergency reports, predict the risk levels for 4 key zones.
      For each zone, provide:
      - zone: Name of the zone (e.g. Kathmandu, Patan, Bhaktapur, Lalitpur, or extract from data)
      - today: Risk percentage today (0-100)
      - tomorrow: Predicted risk percentage tomorrow (0-100)
      - trend: "up" or "down"
      - action: A short recommendation (e.g. "Increase Patrol")
      
      Live Reports Data:
      ${JSON.stringify(alerts.slice(0, 50).map(a => ({ location: a.location, type: a.type, status: a.status })))}
      
      Return ONLY a valid JSON array of objects. No markdown formatting, no code blocks, just raw JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      let text = response.text.trim();
      if (text.startsWith('\`\`\`json')) text = text.substring(7);
      if (text.startsWith('\`\`\`')) text = text.substring(3);
      if (text.endsWith('\`\`\`')) text = text.substring(0, text.length - 3);
      
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Prediction failed:", error);
      return [
        { zone: 'AI Error', today: 50, tomorrow: 50, trend: 'up', action: 'Check console' }
      ];
    }
  },

  async suggestNearestOfficer(alert, officers) {
    if (!this.isConfigured || !officers.length) return null;
    
    const available = officers.filter(o => o.status === 'available');
    if (!available.length) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are an AI dispatcher for a police department.
      An emergency has occurred at: "${alert.location || 'Unknown location'}"
      Incident Type: "${alert.type || alert.emergencyType}"
      
      Here are the available officers:
      ${JSON.stringify(available.map(o => ({ id: o.id, name: o.name, station: o.station, specialization: o.specialization })))}
      
      Determine the best officer to dispatch based on proximity of their station to the incident location, and their specialization (e.g. Traffic for accidents, Crime for theft). If you don't know the exact geography, make a logical guess based on the Kathmandu Valley area.
      
      Return ONLY the exact "id" string of the chosen officer. No other text, no quotes, no markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim().replace(/['"]/g, '');
    } catch (error) {
      console.error("AI Officer Suggestion failed:", error);
      return null;
    }
  }
};
