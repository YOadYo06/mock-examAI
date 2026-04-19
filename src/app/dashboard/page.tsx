"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

interface Interview {
  id: string;
  position: string;
  description: string;
  experience: number;
  techStack: string;
  createdAt: any;
}

interface HistoryEntry {
  id: string;
  submittedAt: any;
  overallRating: number;
  results: Array<{
    question: string;
    rating: number;
    feedback: string;
  }>;
}

export default function Dashboard() {
  const { userId, isLoaded } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isLoaded && !userId) {
      redirect("/sign-in");
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!userId) return;

    const interviewsRef = collection(db, "interviews");
    const q = query(interviewsRef, where("userId", "==", userId));

    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interviewsList: Interview[] = [];
      snapshot.forEach((doc) => {
        interviewsList.push({
          id: doc.id,
          ...doc.data(),
        } as Interview);
      });

      // Sort by creation date (newest first)
      interviewsList.sort(
        (a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()
      );

      setInterviews(interviewsList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleShowHistory = async (interviewId: string) => {
    setSelectedHistoryId(interviewId);
    setIsLoadingHistory(true);

    try {
      const resultsRef = collection(db, "interviewResults");
      const q = query(
        resultsRef,
        where("userId", "==", userId),
        where("mockIdRef", "==", interviewId)
      );

      const resultsSnap = await getDocs(q);
      const history: HistoryEntry[] = [];

      resultsSnap.forEach((doc) => {
        const data = doc.data();
        const results = data.results || [];
        const overallRating =
          results.length > 0
            ? results.reduce((sum: number, r: any) => sum + r.rating, 0) /
              results.length
            : 0;

        history.push({
          id: doc.id,
          submittedAt: data.submittedAt,
          overallRating,
          results,
        });
      });

      // Sort by date (newest first)
      history.sort(
        (a, b) => b.submittedAt?.toDate?.() - a.submittedAt?.toDate?.()
      );

      setHistoryData(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) return;

    try {
      await deleteDoc(doc(db, "interviews", interviewId));
      toast.success("Interview deleted");
    } catch (error) {
      console.error("Error deleting interview:", error);
      toast.error("Failed to delete interview");
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">
              AI Mock Interview
            </div>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/create-interview">
              <Button>+ Create New Interview</Button>
            </Link>
            <UserButton />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Interviews
          </h1>
          <p className="text-gray-600">
            Practice and improve your interview skills
          </p>
        </div>

        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">Loading interviews...</p>
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4 text-lg">
              No interviews yet. Create your first one!
            </p>
            <Link href="/create-interview">
              <Button size="lg">Create Interview</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((interview) => (
              <Card
                key={interview.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {interview.position}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {interview.description.substring(0, 100)}...
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>
                      <span className="font-medium">Experience:</span>{" "}
                      {interview.experience} years
                    </p>
                    <p>
                      <span className="font-medium">Tech Stack:</span>{" "}
                      {interview.techStack}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/interview/${interview.id}`} className="flex-1">
                    <Button className="w-full">Start Interview</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleShowHistory(interview.id)}
                  >
                    History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteInterview(interview.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* History Modal */}
        {selectedHistoryId && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setSelectedHistoryId(null)}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <Card 
                className="w-full max-w-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Interview Attempts
                  </h2>
                  <button
                    onClick={() => setSelectedHistoryId(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {isLoadingHistory ? (
                  <p className="text-gray-600 text-center py-8">
                    Loading history...
                  </p>
                ) : historyData.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No previous attempts yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historyData.map((entry, index) => (
                      <Link
                        key={entry.id}
                        href={`/dashboard/history/${selectedHistoryId}/${entry.id}`}
                      >
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Attempt {index + 1}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {entry.submittedAt
                                  ?.toDate?.()
                                  ?.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-indigo-600">
                                {entry.overallRating.toFixed(1)}/10
                              </p>
                              <p className="text-xs text-gray-500">
                                {entry.results.length} questions
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm">
                            <div className="flex flex-wrap gap-2">
                              {entry.results.map((result, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    result.rating >= 7
                                      ? "bg-green-100 text-green-800"
                                      : result.rating >= 4
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  Q{idx + 1}: {result.rating}/10
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
