import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestions } from "@/lib/gemini-api";
import { db } from "@/config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { position, description, experience, techStack, ocrText, userId } =
      await req.json();

    if (!position || !description || !techStack || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate questions using Gemini
    const questions = await generateInterviewQuestions(
      position,
      description,
      experience || 0,
      techStack,
      ocrText
    );

    // Save interview to Firestore
    const interviewsRef = collection(db, "interviews");
    const docRef = await addDoc(interviewsRef, {
      position,
      description,
      experience: experience || 0,
      techStack,
      questions,
      ocrText: ocrText || "",
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      interviewId: docRef.id,
      questions,
    });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
