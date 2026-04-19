"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";

interface Result {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  feedback: string;
  rating: number;
}

interface AttemptData {
  results: Result[];
  submittedAt: any;
  overallRating: number;
}

export default function AttemptDetailsPage() {
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        if (!userId) return;

        const docRef = doc(db, "interviewResults", attemptId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          toast.error("Attempt not found");
          router.push("/dashboard");
          return;
        }

        const data = docSnap.data();

        // Verify ownership
        if (data.userId !== userId || data.mockIdRef !== interviewId) {
          toast.error("You don't have access to this attempt");
          router.push("/dashboard");
          return;
        }

        const results = data.results || [];
        const overallRating =
          results.length > 0
            ? results.reduce((sum: number, r: any) => sum + r.rating, 0) /
              results.length
            : 0;

        setAttempt({
          results,
          submittedAt: data.submittedAt,
          overallRating,
        });
      } catch (error) {
        console.error("Error fetching attempt:", error);
        toast.error("Failed to load attempt details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, interviewId, userId, router]);

  const getRatingColor = (rating: number) => {
    if (rating >= 7) return "green";
    if (rating >= 4) return "yellow";
    return "red";
  };

  const getRatingStyle = (rating: number) => {
    const color = getRatingColor(rating);
    const styles = {
      green: "bg-green-50 border-green-200",
      yellow: "bg-yellow-50 border-yellow-200",
      red: "bg-red-50 border-red-200",
    };
    return styles[color as keyof typeof styles];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Loading attempt details...</p>
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Attempt not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">
              AI Mock Interview
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary Card */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Attempt Review
              </h1>
              <p className="text-gray-600">
                Submitted on{" "}
                {attempt.submittedAt
                  ?.toDate?.()
                  ?.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-indigo-600">
                {attempt.overallRating.toFixed(1)}
              </p>
              <p className="text-gray-600">Overall Score</p>
            </div>
          </div>
        </Card>

        {/* Questions and Answers */}
        <div className="space-y-4">
          {attempt.results.map((result, index) => (
            <Card
              key={index}
              className={`p-6 border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                getRatingStyle(result.rating) === "bg-green-50 border-green-200"
                  ? "border-l-green-500"
                  : getRatingStyle(result.rating) === "bg-yellow-50 border-yellow-200"
                  ? "border-l-yellow-500"
                  : "border-l-red-500"
              } ${getRatingStyle(result.rating)}`}
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {result.question}
                    </h3>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-indigo-600">
                    {result.rating}
                  </p>
                  <p className="text-xs text-gray-500">/10</p>
                </div>
              </div>

              {/* Expandable Content */}
              {expandedIndex === index && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Expected Answer */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Expected Answer
                    </h4>
                    <p className="text-gray-700 bg-white p-4 rounded border border-green-200 whitespace-pre-wrap">
                      {result.expectedAnswer}
                    </p>
                  </div>

                  {/* Your Answer */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Your Answer
                    </h4>
                    <p className="text-gray-700 bg-white p-4 rounded border border-blue-200 whitespace-pre-wrap">
                      {result.userAnswer}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      AI Feedback
                    </h4>
                    <p className="text-gray-700 bg-purple-50 p-4 rounded border border-purple-200 whitespace-pre-wrap">
                      {result.feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Collapse Indicator */}
              <div className="text-center text-sm text-gray-500 mt-2">
                {expandedIndex === index ? "▼ Click to collapse" : "▶ Click to expand"}
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/interview/${interviewId}`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700" size="lg">
              Retake Interview
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
