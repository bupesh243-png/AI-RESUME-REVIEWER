import { GoogleGenAI } from "@google/genai";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { resumeText } = request.body || {};

  if (!resumeText || resumeText.trim().length < 20) {
    return response.status(400).json({ error: "Please provide at least 20 characters of resume text." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(500).json({ error: "GEMINI_API_KEY is missing in environment variables." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are an expert resume reviewer. Review the resume below and return:
1. Three improvement suggestions
2. Missing skills if any
3. Resume rating out of 10
4. One improved professional summary

Resume:
${resumeText}`
    });

    return response.status(200).json({ feedback: aiResponse.text });
  } catch (error) {
    return response.status(500).json({ error: error.message || "AI review failed" });
  }
}
