"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">We'd love to hear from you</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Get In Touch</h2>
          <p className="text-gray-600 mb-6">
            Have questions or feedback? Reach out to us and we'll get back to you as soon as possible.
          </p>
          <div className="space-y-4">
            <p><strong>Email:</strong> contact@aimockinterview.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105</p>
          </div>
        </div>

        <Link href="/">
          <Button>Back Home</Button>
        </Link>
      </main>
    </div>
  );
}
