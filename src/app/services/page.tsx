"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ServicesPage() {
  const services = [
    {
      title: "Mock Interviews",
      description: "Practice with realistic interview scenarios tailored to your role",
      icon: "🎤",
    },
    {
      title: "AI Feedback",
      description: "Get personalized feedback on your answers and performance",
      icon: "💡",
    },
    {
      title: "PDF Analysis",
      description: "Upload your resume/CV for targeted interview preparation",
      icon: "📄",
    },
    {
      title: "Performance Tracking",
      description: "Track your progress and identify areas for improvement",
      icon: "📊",
    },
  ];

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h1>
          <p className="text-xl text-gray-600">Comprehensive tools to ace your interviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {services.map((service) => (
            <Card key={service.title} className="p-8">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">Begin your interview preparation journey today</p>
          <Link href="/sign-up">
            <Button size="lg">Sign Up Now</Button>
          </Link>
        </div>

        <Link href="/">
          <Button>Back Home</Button>
        </Link>
      </main>
    </div>
  );
}
