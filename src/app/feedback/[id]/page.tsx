"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface EvaluationResult {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  feedback: string;
  rating: number;
}

interface Interview {
  position: string;
  questions: Array<{ question: string; answer: string }>;
}

export default function FeedbackPage() {
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) return;

        // Fetch interview
        const interviewRef = doc(db, "interviews", interviewId);
        const interviewSnap = await getDoc(interviewRef);

        if (!interviewSnap.exists()) {
          toast.error("Interview not found");
          router.push("/dashboard");
          return;
        }

        const interviewData = interviewSnap.data();

        if (interviewData.userId !== userId) {
          toast.error("You don't have access to this interview");
          router.push("/dashboard");
          return;
        }

        setInterview(interviewData as Interview);

        // Fetch evaluation results - query without orderBy to avoid composite index
        const resultsRef = collection(db, "interviewResults");
        const q = query(
          resultsRef,
          where("userId", "==", userId),
          where("mockIdRef", "==", interviewId)
        );

        const resultsSnap = await getDocs(q);

        if (resultsSnap.empty) {
          toast.error("No evaluation results found");
          router.push(`/interview/${interviewId}`);
          return;
        }

        const resultData = resultsSnap.docs[0].data();
        const evaluationResults: EvaluationResult[] = resultData.results || [];

        setResults(evaluationResults);

        // Calculate overall rating
        if (evaluationResults.length > 0) {
          const totalRating = evaluationResults.reduce(
            (sum, result) => sum + result.rating,
            0
          );
          setOverallRating(totalRating / evaluationResults.length);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
        toast.error("Failed to load feedback");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [interviewId, userId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-gray-600">Loading feedback...</p>
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
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Score Card */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-indigo-100 text-sm mb-2">Position</p>
              <h2 className="text-3xl font-bold">{interview.position}</h2>
            </div>
            <div>
              <p className="text-indigo-100 text-sm mb-2">Overall Rating</p>
              <div className="text-5xl font-bold">
                {overallRating.toFixed(1)}/10
              </div>
            </div>
            <div>
              <p className="text-indigo-100 text-sm mb-2">Answers Completed</p>
              <div className="text-5xl font-bold">
                {results.length}/{interview.questions.length}
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback Section */}
        {results.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-6">
              You haven't answered any questions yet.
            </p>
            <Link href={`/interview/${interviewId}`}>
              <Button>Back to Interview</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <Card key={index} className="p-8 border-l-4 border-l-indigo-600">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-2">
                      Question {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {result.question}
                    </h3>
                  </div>
                  <div className="ml-6 text-right">
                    <div className="text-4xl font-bold text-indigo-600">
                      {result.rating}
                    </div>
                    <p className="text-gray-500 text-sm">/10</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Expected Answer */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Expected Answer:
                    </h4>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-green-900 text-sm leading-relaxed">
                        {result.expectedAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Your Answer */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Your Answer:
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-900 text-sm leading-relaxed">
                        {result.userAnswer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    AI Feedback:
                  </h4>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-purple-900 text-sm leading-relaxed">
                      {result.feedback}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/create-interview" className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Create Another Interview
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
