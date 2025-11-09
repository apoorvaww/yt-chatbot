"use client";
import axios from "axios";
import React, { useState } from "react";
// import BubbleBackground from "@/components/BubbleBackground";
import LiquidEther from "../components/LiquidEther.jsx";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface BackendErrorResponse {
  error: string;
}
1;
interface AxiosErrorResponse {
  response?: {
    data: BackendErrorResponse;
    status: number;
  };
  message: string;
}

export default function Page() {
  const [videoId, setVideoId] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState("");

  const handleProcessVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) return;

    setIsProcessing(true);
    setVideoLoaded(false);
    setError("");
    setChatHistory([]);

    try {
      const response = await axios.post("/api/load-video", {
        videoId,
      });

      if (response.status != 200) {
        const error = await response.data;
        throw new Error(error.error || "Failed to process video");
      }

      setVideoLoaded(true);
      setChatHistory([
        { role: "bot", content: "Video processed! You can now ask questions." },
      ]);
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorResponse;
      const errorMessage =
        axiosError.response?.data?.error ||
        (error as Error).message ||
        "An unknown error occurred during video processing.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !videoLoaded) return;

    setIsReplying(true);
    setError(" ");

    const userQuestion = question.trim();
    setQuestion("");

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userQuestion },
    ]);

    // const newHistory: Message[] = [
    //   ...chatHistory,
    //   { role: "user", content: userQuestion },
    // ];
    // setChatHistory(newHistory);

    try {
      const response = await axios.post("/api/chat", {
        videoId,
        question: userQuestion,
      });

      if (response.status != 200) {
        const error = await response.data;
        throw new Error(error.error || "Failed to get answer");
      }

      const { answer } = response.data;
      setChatHistory((prev) => [...prev, { role: "bot", content: answer }]);
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;

      const errorMessage =
        axiosError.response?.data?.error ||
        (error as Error).message ||
        "An unknown error occurred during video processing";
      setError(errorMessage);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden flex justify-center items-center p-4 md:p-8 text-white">
      {/* Liquid Effect Behind Everything (UNCHANGED) */}
      <div className="absolute inset-0 -z-10">
        <LiquidEther
          colors={[
            "#2d0b59", // purple
            "#120033", // deep violet
            "#ff4dff", // neon pink/purple glow
          ]}
          mouseForce={30}
          cursorSize={70}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      <div className="absolute inset-0 bg-[#0b0a1f]/90 -z-20" />

      {/* --- OPAQUE CHAT UI CONTAINER --- */}
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-[#0b0a1f] rounded-2xl border border-white/10 shadow-xl p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          YouTube Video Chatbot
        </h1>

        {/* Video Loader Form */}
        <form onSubmit={handleProcessVideo} className="flex gap-3 mb-4">
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID or URL"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none text-white placeholder:text-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !videoId}
            className={`px-5 py-3 rounded-xl text-white font-medium transition duration-200
            ${
              isProcessing || !videoId
                ? "bg-gray-600/50 cursor-not-allowed text-gray-400"
                : "bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
            }`}
          >
            {isProcessing ? "Processing..." : "Load"}
          </button>
        </form>

        {/* Chat History */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-white/10 rounded-xl bg-black/20 p-4 space-y-4 shadow-inner">
          {!videoLoaded && chatHistory.length === 0 && (
            <p className="text-center text-gray-400">
              Load a video to begin chatting...
            </p>
          )}

          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow break-words whitespace-pre-wrap leading-relaxed 
                ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none" // User message
                    : "bg-gray-800/80 text-gray-100 rounded-bl-none" // Bot message
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isReplying && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-gray-800/80 text-gray-100 shadow rounded-bl-none">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleAskQuestion} className="flex gap-3 mt-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder:text-gray-400"
            disabled={!videoLoaded || isReplying}
          />

          <button
            type="submit"
            disabled={!videoLoaded || isReplying || !question}
            className={`px-5 py-3 rounded-xl font-medium text-white transition duration-200
            ${
              !videoLoaded || isReplying || !question
                ? "bg-gray-600/50 cursor-not-allowed text-gray-400"
                : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            }`}
          >
            {isReplying ? "..." : "Send"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-400 text-center mt-3">{error}</p>
        )}
      </div>
    </main>
  );
}