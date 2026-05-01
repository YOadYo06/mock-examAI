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
import { getFastApiUrl } from "@/lib/fastapi";
import { db } from "@/config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Dynamically import PDF uploader with ssr: false to avoid server-side DOM errors
const PdfUploader = dynamic(() => import("@/components/pdf-uploader"), {
  ssr: false,
  loading: () => <div className="p-6 text-gray-600">Loading PDF uploader...</div>,
});

const baseSchema = z.object({
  position: z.string().min(1, "Position is required").max(100),
  description: z.string().min(10, "Description is required"),
  experience: z.any().transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    if (isNaN(num) || num < 0) {
      throw new Error("Experience must be a non-negative number");
    }
    return num;
  }),
  techStack: z.string().min(1, "Tech stack is required"),
  hrCount: z.any().transform((val) => {
    const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
    if (isNaN(num) || num < 0) {
      throw new Error("HR question count must be 0 or more");
    }
    return num;
  }),
  techCount: z.any().transform((val) => {
    const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
    if (isNaN(num) || num < 0) {
      throw new Error("Technical question count must be 0 or more");
    }
    return num;
  }),
  realworldCount: z.any().transform((val) => {
    const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
    if (isNaN(num) || num < 0) {
      throw new Error("Real-world question count must be 0 or more");
    }
    return num;
  }),
});

const formSchema = baseSchema;

type FormData = {
  position: string;
  description: string;
  experience: number;
  techStack: string;
  hrCount: number;
  techCount: number;
  realworldCount: number;
};

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
      hrCount: 2,
      techCount: 2,
      realworldCount: 2,
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

      const fetchWithTimeout = async (input: RequestInfo, init: RequestInit, timeoutMs: number) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
      };

      const response = await fetchWithTimeout(
        `${getFastApiUrl()}/interviews/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: data.position,
            description: data.description,
            experience_years: data.experience,
            tech_stack: data.techStack.split(",").map((item) => item.trim()).filter(Boolean),
            n_results: 2,
            hr_count: data.hrCount,
            tech_count: data.techCount,
            realworld_count: data.realworldCount,
          }),
        },
        20000
      );

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      const { questions } = await response.json();

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error("No questions returned from VectorDB");
      }

      const interviewsRef = collection(db, "interviews");
      const addDocWithTimeout = async (timeoutMs: number) => {
        return await Promise.race([
          addDoc(interviewsRef, {
            position: data.position,
            description: data.description,
            experience: data.experience,
            techStack: data.techStack,
            questions,
            ocrText: "",
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Firestore write timed out")), timeoutMs)
          ),
        ]);
      };

      const docRef = await addDocWithTimeout(15000);

      toast.success("Interview created successfully!", { id: toastId });
      router.push(`/interview/${docRef.id}`);
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
                render={({ field }: { field: any }) => (
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
                render={({ field }: { field: any }) => (
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
                render={({ field }: { field: any }) => (
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
                render={({ field }: { field: any }) => (
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hrCount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>HR Questions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
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
                  name="techCount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Technical Questions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
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
                  name="realworldCount"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Real-world Questions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
