"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">AI Mock Interview</div>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600">Empowering job seekers with AI-powered interview practice</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700">
              At AI Mock Interview, our mission is to help job seekers prepare for their interviews with
              confidence. We leverage cutting-edge AI technology to provide realistic interview simulations
              and valuable feedback.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Create a mock interview with your target job details</li>
              <li>AI generates relevant interview questions based on your role</li>
              <li>Record your answers and receive instant feedback</li>
              <li>Track your progress and improve your skills</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Powered by advanced AI technology</li>
              <li>Realistic interview simulations</li>
              <li>Personalized feedback and insights</li>
              <li>Practice anytime, anywhere</li>
            </ul>
          </div>
        </div>

        <Link href="/">
          <Button>Back Home</Button>
        </Link>
      </main>
    </div>
  );
}
