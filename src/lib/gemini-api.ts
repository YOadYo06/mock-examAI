import OpenAI from "openai";

const apiKey = process.env.NVIDIA_API_KEY;
if (!apiKey) {
  console.error("NVIDIA_API_KEY is not set in environment variables");
  // Don't throw immediately - allow module to load and throw at runtime when used
}

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY environment variable is not set. Please check your environment variables.");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return openaiClient;
}

const cleanJsonResponse = (text: string) => {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
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
    const client = getOpenAI();
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
    
    const completion = await client.chat.completions.create({
      model: "z-ai/glm4.7",
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      top_p: 1,
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedJson = cleanJsonResponse(responseText);
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
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = getOpenAI();
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
      
      const completion = await client.chat.completions.create({
        model: "z-ai/glm4.7",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
        top_p: 1,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      const cleanedJson = cleanJsonResponse(responseText);
      const evaluation = JSON.parse(cleanedJson);
      return {
        rating: Math.min(10, Math.max(1, parseInt(evaluation.rating) || 5)),
        feedback: evaluation.feedback || "No feedback provided",
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isServiceUnavailable = error && typeof error === "object" && "status" in error && (error as Record<string, unknown>).status === 503;
      if (isServiceUnavailable && attempt < maxRetries) {
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
    const client = getOpenAI();
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
    
    const completion = await client.chat.completions.create({
      model: "z-ai/glm4.7",
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      top_p: 1,
      max_tokens: 512,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    const cleanedJson = cleanJsonResponse(responseText);
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
