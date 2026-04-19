"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PdfUploaderProps {
  onPdfProcessed: (data: {
    position: string;
    description: string;
    experience: number;
    techStack: string;
  }) => void;
  isLoading?: boolean;
}

export default function PdfUploader({ onPdfProcessed, isLoading }: PdfUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const toastId = toast.loading("Extracting text from PDF...");

      // Import PDF extraction dynamically - only runs on client
      const { extractTextFromPdf } = await import("@/lib/pdf-ocr");

      // Extract text from PDF using OCR
      const extractedText = await extractTextFromPdf(file);

      // Send OCR text to API to extract form fields
      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: extractedText }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract information");
      }

      const { data } = await response.json();

      // Call parent callback with extracted data
      onPdfProcessed({
        position: data.position || "",
        description: data.description || "",
        experience: data.experience || 0,
        techStack: data.techStack || "",
      });

      toast.success("PDF processed successfully! Fields auto-filled.", { id: toastId });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Failed to process PDF. Please fill the form manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-8 p-6 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
      <div className="text-center">
        <p className="text-gray-700 font-medium mb-4">📄 Upload Resume/Profile PDF (Optional)</p>
        <p className="text-gray-500 text-sm mb-4">Your PDF will be processed to auto-fill the form fields</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
          disabled={isProcessing || isLoading}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isLoading}
          className="w-full"
        >
          {isProcessing ? "Processing PDF..." : "Choose PDF File"}
        </Button>
      </div>
    </div>
  );
}
