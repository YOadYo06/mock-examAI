import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("GROQ_API_KEY is not set in environment variables");
  // Don't throw immediately - allow module to load and throw at runtime when used
}

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please check your environment variables.");
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: apiKey,
    });
  }
  return groqClient;
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
    const client = getGroq();
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
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
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
      const client = getGroq();
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
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
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
    const client = getGroq();
    const prompt = `You are a resume parser. Extract information from this resume text and return ONLY a JSON object:

Resume Text:
${ocrText}

Return ONLY this JSON format with no extra text:
{"position":"job title","description":"job description","experience":0,"techStack":"tech,stack"}`;
    
    const completion = await client.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 256,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log("PDF extraction raw response:", responseText);
    
    if (!responseText || responseText.trim().length === 0) {
      console.warn("Empty response from PDF extraction API");
      return {
        position: "Software Developer",
        description: "Candidate with relevant experience",
        experience: 0,
        techStack: "Various",
      };
    }

    const cleanedJson = cleanJsonResponse(responseText);
    console.log("PDF extraction cleaned JSON:", cleanedJson);
    
    if (!cleanedJson || cleanedJson.trim().length === 0) {
      console.warn("No JSON found in response");
      return {
        position: "Software Developer",
        description: "Candidate with relevant experience",
        experience: 0,
        techStack: "Various",
      };
    }

    const info = JSON.parse(cleanedJson);
    return {
      position: info.position || "Software Developer",
      description: info.description || "Candidate with relevant experience",
      experience: Math.max(0, parseInt(info.experience) || 0),
      techStack: info.techStack || "Various",
    };
  } catch (error) {
    console.error("Error extracting PDF info:", error);
    console.error("Returning default values instead of failing");
    // Return sensible defaults instead of throwing
    return {
      position: "Software Developer",
      description: "Candidate with relevant experience",
      experience: 0,
      techStack: "Various",
    };
  }
}
