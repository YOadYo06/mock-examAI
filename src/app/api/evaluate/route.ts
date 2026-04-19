import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini-api";
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
    const {
      question,
      correctAnswer,
      userAnswer,
      mockIdRef,
      userId,
    } = await req.json();

    if (!question || !correctAnswer || !userAnswer || !mockIdRef || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Evaluate the answer using Gemini
    // TODO: Implement duplicate check after creating Firestore composite index
    const evaluation = await evaluateAnswer(
      question,
      correctAnswer,
      userAnswer
    );

    // Save answer to Firestore
    const answersRef = collection(db, "userAnswers");
    const docRef = await addDoc(answersRef, {
      mockIdRef,
      question,
      correct_ans: correctAnswer,
      user_ans: userAnswer,
      feedback: evaluation.feedback,
      rating: evaluation.rating,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      answerId: docRef.id,
      rating: evaluation.rating,
      feedback: evaluation.feedback,
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: `Failed to evaluate answer: ${errorMessage}` },
      { status: 500 }
    );
  }
}
