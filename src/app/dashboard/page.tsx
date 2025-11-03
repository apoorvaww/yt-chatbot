"use client";
import axios from "axios";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [ans, setAns] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    try {
      const res = await axios.post("/api/model", {
        videoId: input,
      }, 
    {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log(input)
      console.log(res.data);
      setAns(res.data.answer);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input type="text" placeholder="Enter the youtube video id" value={input} onChange={(e) => setInput(e.target.value)} />
      <Button type="submit" variant="outline" onClick={getData} className="cursor-pointer">
        Submit
      </Button>
      <p>{ans}</p>
    </div>
  );
};

export default Dashboard;
