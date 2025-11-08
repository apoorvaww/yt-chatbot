# 🎥 YouTube Video Chatbot (RAG-Powered Video Analysis)

An intelligent chatbot that can **analyze any YouTube video using RAG (Retrieval-Augmented Generation)**.  
Simply enter a YouTube video ID → the app fetches the transcript → chunks it → embeds it → stores it in ChromaDB → and answers questions using Google Gemini, grounded only in the video content.

---

## ✨ Overview

This project transforms long YouTube videos into **searchable, interactive knowledge bases**.  
Instead of manually scrubbing through a video, users can:

✅ Ask questions directly about the video
✅ Get answers grounded in retrieved transcript segments  
✅ Avoid hallucinations thanks to strict RAG prompting  


---

# 🚀 Features

### ✅ Video Ingestion
Provide a YouTube video ID (e.g., `dQw4w9WgXcQ`) — the app automatically retrieves the transcript.

### ✅ Chunking & Embedding
- Transcript is split into manageable chunks  
- Each chunk is embedded using a HuggingFace embedding model  
- The vector embeddings of data is stored persistently in **ChromaDB**

### ✅ Vector Search
User questions are turned into vectors and matched against transcript chunks to retrieve relevant context.

### ✅ RAG Answering
The system sends:

- User question  
- Retrieved transcript snippets  

to **Google Gemini**, which returns an objective, context-bound answer.

### ✅ Chat Interface
- Clean chat-like UI (Next.js + Tailwind)  
- User questions and bot answers shown in bubbles  
- Persistent chat history per video  

### ✅ Local Vector Store
ChromaDB persists all processed video embeddings for ultra-fast retrieval.

---

# 🏗️ Architecture

YouTube Video → Transcript → Chunking → Embedding → ChromaDB
↑ ↓

└────────────── User Question → Embedding → Similarity Search

↓
LLM (Gemini) with Retrieved Context


---

# 🛠️ Tech Stack

### **Frontend**
- Next.js
- Tailwind CSS  
- TypeScript

### **LLM Orchestration**
- LangChain

### **Vector Database**
- ChromaDB

### **Embeddings**
- Hugging Face (Sentence Transformers)

### **Large Language Model**
- Google Gemini API

---

# 📸 Screenshots 

Replace these with actual images in your repo.

### Main Interface

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/baf433d0-91f8-4fb6-8ed0-50357aaeba2c" />


### Chat Response
<img width="1348" height="678" alt="image" src="https://github.com/user-attachments/assets/ddf71417-0d41-40ee-8ee6-3ae12cea5780" />


<img width="1363" height="743" alt="image" src="https://github.com/user-attachments/assets/1b537684-ec84-40cb-b9cf-8e8925d32a79" />



---

# ✅ Getting Started

## 1. Clone the Repository
```bash
git clone https://github.com/your-username/your-repo.git
cd yt-chatbot
```


## 2. Install Dependencies
```
npm install
# or
yarn install
```

## 3. Environment Variables

Create .env.local in the root:

```
GOOGLE_API_KEY=""
HUGGINGFACE_API_KEY=""
LANGCHAIN_VERBOSE=false

CHROMA_API_KEY=""
CHROMA_TENANT=""
CHROMA_DATABASE=""
```

## 4. ▶️ Run the Application

```
npm run dev
# or
yarn dev
```
Then visit:

http://localhost:3000

Ensure ChromaDB is running in command prompt.
