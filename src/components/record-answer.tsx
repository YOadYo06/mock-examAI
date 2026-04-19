"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RecordAnswerProps {
  question: string;
  onAnswerChange: (answer: string) => void;
  savedAnswer?: string;
}

export default function RecordAnswer({
  question,
  onAnswerChange,
  savedAnswer = "",
}: RecordAnswerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [userAnswer, setUserAnswer] = useState(savedAnswer);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [browserSupported, setBrowserSupported] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const onAnswerChangeRef = useRef(onAnswerChange);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Keep track of the latest onAnswerChange function
  useEffect(() => {
    onAnswerChangeRef.current = onAnswerChange;
  }, [onAnswerChange]);

  // Update local state when savedAnswer changes (when toggling questions)
  useEffect(() => {
    setUserAnswer(savedAnswer);
  }, [savedAnswer]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setBrowserSupported(false);
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep recording until explicitly stopped
      recognitionRef.current.interimResults = true;
      recognitionRef.current.language = "en-US";

      recognitionRef.current.onstart = () => {
        setInterimTranscript("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);
        if (final) {
          setUserAnswer((prev) => {
            const updated = (prev + " " + final).trim();
            // Notify parent of the updated answer after recording completes
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              onAnswerChangeRef.current(updated);
            }, 100);
            return updated;
          });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast.error(`Error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleStartRecording = async () => {
    if (!browserSupported) {
      toast.error("Browser doesn't support speech recognition");
      return;
    }

    try {
      setIsRecording(true);
      setInterimTranscript("");
      recognitionRef.current?.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    try {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setInterimTranscript("");
      
      // Notify parent of the final answer after recording stops
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onAnswerChangeRef.current(userAnswer);
      }, 100);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
    }
  };

  const handleManualEdit = (value: string) => {
    setUserAnswer(value);
    
    // Debounce the parent callback - only notify after user stops typing for 300ms
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onAnswerChangeRef.current(value);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Recording Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">Record Your Answer:</h3>

        {!browserSupported && (
          <p className="text-red-600 mb-4">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari. You can type your answer instead.
          </p>
        )}

        <div className="space-y-4">
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!browserSupported}
            className={`w-full ${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRecording ? (
              <>
                🎤 Stop Recording
              </>
            ) : (
              "🎤 Start Recording"
            )}
          </Button>

          {isRecording && (
            <div className="text-sm text-blue-600 animate-pulse">
              🔴 Recording... Click "Stop Recording" when done
            </div>
          )}

          {interimTranscript && (
            <p className="text-sm italic text-gray-600 bg-white p-3 rounded border border-gray-200">
              {interimTranscript}
            </p>
          )}
        </div>
      </div>

      {/* User Answer Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer (edit anytime):
        </label>
        <textarea
          ref={textareaRef}
          value={userAnswer}
          onChange={(e) => handleManualEdit(e.target.value)}
          disabled={isRecording}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          placeholder="Your answer will appear here. You can edit it at any time..."
        />
        <p className="text-xs text-gray-500 mt-2">
          Characters: {userAnswer.length}
        </p>
      </div>
    </div>
  );
}


