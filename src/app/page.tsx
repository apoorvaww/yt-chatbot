"use client";
import axios from "axios";
import React, { useState } from "react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface BackendErrorResponse {
  error: string;
}
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

    const newHistory: Message[] = [
      ...chatHistory,
      { role: "user", content: "question" },
    ];
    setChatHistory(newHistory);
    const userQuestion = question;
    setQuestion("");

    try {
      const response = await axios.post("/api/chat", {
        videoId,
        question: userQuestion,
      });

      if (response.status != 200) {
        const error = await response.data;
        throw new Error(error.error || "Failed to get answer");
      }

      const { answer } = await response.data;
      setChatHistory([...newHistory, { role: "bot", content: answer }]);
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

  const styles = {
    container:
      "w-full max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10",
    form: "flex gap-2 mb-4",
    input: "flex-grow p-2 border rounded-md",
    button: "px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400",
    chatBox: "h-96 overflow-y-auto border rounded-md p-4 mb-4 bg-gray-50",
    userMsg: "text-right mb-3",
    botMsg: "text-left mb-3",
    msgBubble: "inline-block px-4 py-2 rounded-lg",
    userBubble: "bg-blue-500 text-white",
    botBubble: "bg-gray-200 text-gray-800",
    error: "text-red-500 mt-4 text-center",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          YouTube Video Chatbot
        </h1>

        {/* Load Video Form */}
        <form onSubmit={handleProcessVideo} className="flex gap-3 mb-6">
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !videoId}
            className={`px-5 py-3 rounded-xl text-white font-medium transition 
            ${
              isProcessing || !videoId
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing..." : "Load"}
          </button>
        </form>

        {/* Chat Box */}
        <div className="h-96 overflow-y-auto border rounded-xl bg-gray-50 p-5 space-y-4 shadow-inner">
          {!videoLoaded && chatHistory.length === 0 && (
            <p className="text-center text-gray-500">
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
                className={`px-4 py-3 rounded-2xl max-w-xs text-sm shadow 
                ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isReplying && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-gray-200 text-gray-700 shadow">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Question Input */}
        <form onSubmit={handleAskQuestion} className="flex gap-3 mt-6">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
            disabled={!videoLoaded || isReplying}
          />

          <button
            type="submit"
            disabled={!videoLoaded || isReplying || !question}
            className={`px-5 py-3 rounded-xl font-medium text-white transition 
            ${
              !videoLoaded || isReplying || !question
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isReplying ? "..." : "Send"}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </main>
  );
}
