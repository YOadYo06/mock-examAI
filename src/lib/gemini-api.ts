import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

const cleanJsonResponse = (text: string) => {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (arrayMatch) return arrayMatch[0];
  if (objectMatch) return objectMatch[0];
  return cleaned;
};

export async function generateInterviewQuestions(
  position: string,
  description: string,
  experience: number,
  techStack: string,
  ocrText?: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const context = ocrText ? `\n\nResume/Profile Text:\n${ocrText}` : "";
    const prompt = `You are an expert technical interviewer. Generate exactly 5 technical interview questions and answers for the following position:

Position: ${position}
Description: ${description}
Years of Experience: ${experience}
Tech Stack: ${techStack}${context}

Generate the response as a valid JSON array with exactly 5 objects. Each object should have:
- "question": A technical interview question (string)
- "answer": The ideal/expected answer (string)

Important: Questions should be technical and relevant. Answers should be comprehensive but concise. Return ONLY valid JSON, no other text.`;
    const result = await model.generateContent(prompt);
    const cleanedJson = cleanJsonResponse(result.response.text());
    const questions = JSON.parse(cleanedJson);
    if (!Array.isArray(questions) || questions.length !== 5) throw new Error("Invalid response format");
    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

export async function evaluateAnswer(question: string, correctAnswer: string, userAnswer: string) {
  const maxRetries = 5;
  const retryDelay = 3000;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

Question: ${question}

Expected Answer: ${correctAnswer}

User's Answer: ${userAnswer}

Evaluate and provide a rating (1-10) and detailed feedback. Return as JSON:
{
  "rating": <number 1-10>,
  "feedback": "<feedback string>"
}

Return ONLY valid JSON, no other text.`;
      const result = await model.generateContent(prompt);
      const cleanedJson = cleanJsonResponse(result.response.text());
      const evaluation = JSON.parse(cleanedJson);
      return {
        rating: Math.min(10, Math.max(1, parseInt(evaluation.rating) || 5)),
        feedback: evaluation.feedback || "No feedback provided",
      };
    } catch (error: any) {
      lastError = error;
      if (error?.status === 503 && attempt < maxRetries) {
        const delay = retryDelay * attempt;
        console.log(`API unavailable, retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error("Failed to evaluate answer");
}

export async function extractPdfInfoFromOcr(ocrText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `Extract information from this resume text:

${ocrText}

Return as JSON with these fields (use reasonable defaults if not found):
{
  "position": "<job position>",
  "description": "<job description>",
  "experience": <years as number>,
  "techStack": "<comma-separated technologies>"
}

Return ONLY valid JSON, no other text.`;
    const result = await model.generateContent(prompt);
    const cleanedJson = cleanJsonResponse(result.response.text());
    const info = JSON.parse(cleanedJson);
    return {
      position: info.position || "",
      description: info.description || "",
      experience: Math.max(0, parseInt(info.experience) || 0),
      techStack: info.techStack || "",
    };
  } catch (error) {
    console.error("Error extracting PDF info:", error);
    throw error;
  }
}
