"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Dynamically import PDF uploader with ssr: false to avoid server-side DOM errors
const PdfUploader = dynamic(() => import("@/components/pdf-uploader"), {
  ssr: false,
  loading: () => <div className="p-6 text-gray-600">Loading PDF uploader...</div>,
});

const formSchema = z.object({
  position: z.string().min(1, "Position is required").max(100),
  description: z.string().min(10, "Description is required"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  techStack: z.string().min(1, "Tech stack is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateInterviewPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "",
      description: "",
      experience: 0,
      techStack: "",
    },
  });

  const handlePdfProcessed = (data: {
    position: string;
    description: string;
    experience: number;
    techStack: string;
  }) => {
    form.setValue("position", data.position);
    form.setValue("description", data.description);
    form.setValue("experience", data.experience);
    form.setValue("techStack", data.techStack);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!userId) {
        toast.error("User not authenticated");
        return;
      }

      setIsLoading(true);
      const toastId = toast.loading("Creating interview...");

      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const { interviewId } = await response.json();

      toast.success("Interview created successfully!", { id: toastId });
      router.push(`/interview/${interviewId}`);
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold text-indigo-600 cursor-pointer">AI Mock Interview</div>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Create New Interview</h1>
          <p className="text-gray-600 mb-8">Fill in your interview details or upload a resume/PDF to auto-fill</p>

          {/* PDF Upload Component */}
          <PdfUploader onPdfProcessed={handlePdfProcessed} isLoading={isLoading} />

          {/* Form Section */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Senior React Developer" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the job responsibilities, requirements, and tech stack..."
                        {...field}
                        disabled={isLoading}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tech Stack *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., React, Node.js, TypeScript, MongoDB" 
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Creating Interview..." : "Create Interview & Generate Questions"}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
