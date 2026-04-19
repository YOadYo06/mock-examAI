"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">AI Mock Interview</div>
          <div className="flex gap-4 items-center">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Practice Your Interview Skills with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get real-time feedback and improve your interview performance with our AI-powered mock interview platform
          </p>
          {!isSignedIn && (
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          )}
          {isSignedIn && (
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
