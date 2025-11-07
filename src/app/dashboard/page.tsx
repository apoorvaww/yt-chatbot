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

export default function Dashboard() {
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
      const errorMessage = axiosError.response?.data?.error || (error as Error).message || "An unknown error occurred during video processing."
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async(e : React.FormEvent) => {
    e.preventDefault();
    if(!question || !videoLoaded) return;

    setIsReplying(true);
    setError(" ");

    const newHistory: Message[] = [...chatHistory, {role: "user", content: "question"}]
    setChatHistory(newHistory);
    const userQuestion = question;
    setQuestion('');

    try {
      const response = await axios.post('/api/chat', {
        videoId, 
        question: userQuestion
      })

      if(response.status != 200){
        const error = await response.data;
        throw new Error(error.error || "Failed to get answer")
      }

      const {answer} = await response.data;
      setChatHistory([...newHistory, {role: 'bot', content: answer}]);
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;

      const errorMessage = axiosError.response?.data?.error || (error as Error).message || "An unknown error occurred during video processing";
      setError(errorMessage)
    } finally {
      setIsReplying(false);
    }
  }

  // const getData = async () => {
  //   try {
  //     const res = await axios.post("/api/model", {
  //       videoId: input,
  //     },
  //   {
  //     headers: {
  //       "Content-Type": "application/json"
  //     }
  //   });
  //   console.log(input)
  //     console.log(res.data);
  //     setAns(res.data.answer);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  const styles = {
    container: "w-full max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10",
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
    <main className="flex flex-col items-center p-8 bg-gray-100 min-h-screen">
      <div className={styles.container}>
        <h1 className="text-2xl font-bold mb-4 text-center">YouTube Video Chatbot</h1>
        
        {/* Video ID Input */}
        <form onSubmit={handleProcessVideo} className={styles.form}>
          <input
            type="text"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID (e.g., 'dQw4w9WgXcQ')"
            className={styles.input}
            disabled={isProcessing}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={isProcessing || !videoId}
          >
            {isProcessing ? 'Processing...' : 'Load Video'}
          </button>
        </form>

        {/* Chat Area */}
        <div className={styles.chatBox}>
          {chatHistory.length === 0 && !videoLoaded && (
            <p className="text-gray-500 text-center">
              Please load a video ID to start chatting.
            </p>
          )}
          {chatHistory.map((msg, index) => (
            <div key={index} className={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
              <span className={`${styles.msgBubble} ${
                msg.role === 'user' ? styles.userBubble : styles.botBubble
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
          {isReplying && (
            <div className={styles.botMsg}>
                <span className={`${styles.msgBubble} ${styles.botBubble}`}>
                  Thinking...
                </span>
            </div>
          )}
        </div>

        {/* Question Input */}
        <form onSubmit={handleAskQuestion} className={styles.form}>
          <input
            type="text"
            value= {question}
            onChange= {(e) => setQuestion(e.target.value)}
            placeholder= "Ask a question about the video..."
            className= {styles.input}
            disabled= {!videoLoaded || isReplying}
          />
          <button
            type= "submit"
            className={`${styles.button} bg-green-600`}
            disabled= {!videoLoaded || isReplying || !question}
          >
            {isReplying ? '...' : 'Send'}
          </button>
        </form>

        {error && (
          <p className={styles.error}>{error}</p>
        )}
      </div>
    </main>
  );
}