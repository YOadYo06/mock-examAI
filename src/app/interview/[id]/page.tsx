"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import RecordAnswer from "@/components/record-answer";
import { getFastApiUrl } from "@/lib/fastapi";

interface Question {
  question: string;
  answer: string;
}

interface Interview {
  id: string;
  position: string;
  description: string;
  experience: number;
  techStack: string;
  questions: Question[];
}

export default function InterviewPage() {
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        if (!userId) return;

        const docRef = doc(db, "interviews", interviewId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error("Interview not found");
          router.push("/dashboard");
          return;
        }

        const data = docSnap.data();

        // Check if user owns this interview
        if (data.userId !== userId) {
          toast.error("You don't have access to this interview");
          router.push("/dashboard");
          return;
        }

        setInterview({
          id: docSnap.id,
          ...data,
        } as Interview);
      } catch (error) {
        console.error("Error fetching interview:", error);
        toast.error("Failed to load interview");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId, userId, router]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = new Map(userAnswers);
    if (answer.trim()) {
      newAnswers.set(questionIndex, answer);
    } else {
      newAnswers.delete(questionIndex);
    }
    setUserAnswers(newAnswers);
  };

  const handleSubmitInterview = async () => {
    if (!interview || !userId) return;

    // Validate all questions have answers
    if (userAnswers.size !== interview.questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      const toastId = toast.loading("Submitting interview and evaluating answers...");

      // Evaluate all answers
      const evaluationResults: any[] = [];
      
      for (let i = 0; i < interview.questions.length; i++) {
        const userAnswer = userAnswers.get(i);
        if (!userAnswer) continue;

        const response = await fetch(`${getFastApiUrl()}/evaluate/single`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: interview.questions[i].question,
            ideal_answer: interview.questions[i].answer,
            user_answer: userAnswer,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", response.status, errorData);
          throw new Error(`Failed to evaluate answer: ${response.status} ${errorData.error || ""}`);
        }

        const result = await response.json();
        evaluationResults.push({
          question: interview.questions[i].question,
          expectedAnswer: interview.questions[i].answer,
          userAnswer,
          rating: result.rating,
          feedback: result.feedback,
          answeredAt: Timestamp.now(),
        });
      }

      // Save all results to Firestore
      const resultsRef = collection(db, "interviewResults");
      const resultsDoc = await addDoc(resultsRef, {
        userId,
        mockIdRef: interviewId,
        results: evaluationResults,
        submittedAt: Timestamp.now(),
      });

      toast.success("Interview submitted successfully!", { id: toastId });
      router.push(`/feedback/${interviewId}`);
    } catch (error) {
      console.error("Error submitting interview:", error);
      toast.error("Failed to submit interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Loading interview...</p>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Interview not found</p>
        </Card>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentQuestionIndex];
  const currentAnswer = userAnswers.get(currentQuestionIndex) || "";
  const allAnswered = userAnswers.size === interview.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">
              AI Mock Interview
            </div>
          </Link>
          <div className="flex gap-4">
            <span className="text-gray-600 font-medium">
              Question {currentQuestionIndex + 1} of {interview.questions.length}
            </span>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question List */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-20">
              <h3 className="font-bold text-lg mb-4">Questions</h3>
              <div className="space-y-2">
                {interview.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentQuestionIndex === index
                        ? "bg-indigo-600 text-white"
                        : userAnswers.has(index)
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    <div className="text-sm font-medium">Q{index + 1}</div>
                    {userAnswers.has(index) && (
                      <div className="text-xs">✓ Answered</div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Question and Answer Section */}
          <div className="lg:col-span-3">
            <Card className="p-8 mb-6">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  Position: {interview.position}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Record Answer Component */}
              <RecordAnswer
                question={currentQuestion.question}
                onAnswerChange={(answer) =>
                  handleAnswerChange(currentQuestionIndex, answer)
                }
                savedAnswer={currentAnswer}
              />
            </Card>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                ← Previous
              </Button>

              {currentQuestionIndex < interview.questions.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex(
                      Math.min(
                        interview.questions.length - 1,
                        currentQuestionIndex + 1
                      )
                    )
                  }
                >
                  Next →
                </Button>
              ) : allAnswered ? (
                <Button
                  onClick={handleSubmitInterview}
                  disabled={isSubmitting}
                  className="w-auto bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Interview →"}
                </Button>
              ) : (
                <Button disabled>Complete all questions first</Button>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Answered: {userAnswers.size} / {interview.questions.length}{" "}
                questions
              </p>
              {allAnswered && (
                <p className="text-green-600 font-semibold mt-2">
                  ✓ All questions answered! Ready to submit.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
