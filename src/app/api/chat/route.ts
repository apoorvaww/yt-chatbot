import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
// import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextRequest, NextResponse } from "next/server";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

export async function POST(request: NextRequest) {
  try {
    const { videoId, question } = await request.json();

    if (!videoId || !question) {
      return NextResponse.json(
        { error: "Video id and question are required" },
        { status: 400 }
      );
    }

    /// initializing embeddings and llm:
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "sentence-transformers/all-MiniLM-L6-v2",
      provider: "hf-inference",
    });

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    /// connect to the vector store:
    // Connect to Qdrant Cloud
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
    });

    // Load the existing collection in Qdrant
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client,
        collectionName: videoId,
      }
    );

    const retriever = vectorStore.asRetriever({ k: 4 });

    /// prompt:
    const prompt = PromptTemplate.fromTemplate(
      `You are an AI assistant that answers questions ABOUT a YouTube video based strictly on its transcript.

Your goal is to give clear, objective, third-person explanations of what the video contains.

======================  
BEHAVIOR RULES  
======================

1. **Never answer in first-person** unless directly quoting the transcript.  
   - Do NOT say “I”, “me”, “my”, or speak as the narrator or characters.  
   - You are not the speaker and must not role-play them.

2. **Describe information ABOUT the video**, not AS the video.
   - Summaries should always be in neutral third-person.

3. **Ground every answer in the transcript context.**
   - If the transcript does not contain enough information:
     Respond with: **"The video does not provide enough information to answer that."**

4. **Do not use outside knowledge.**
   - If the answer requires external facts not found in the transcript, give the fallback above.

5. **Be precise, concise, and factual.**
   - Avoid assumptions.
   - Do not fill in missing details.

6. **If the question asks about the video’s topic, themes, speaker claims, events, or opinions:**
   - Provide a clear third-person explanation summarizing what the speaker said.

7. **If multiple parts of the transcript are relevant:**
   - Combine them into a coherent summary.
   - Do not quote excessively unless necessary.

   ======================
BEHAVIOR MODES
======================

1. **NORMAL CONVERSATION MODE**
Use this when the user message is a greeting or casual phrase.
Examples:
- hi / hello / hey
- thank you / thanks
- how are you
- good morning / good night
- bye / see you

For these, respond naturally and politely as a normal assistant.
Do NOT use the transcript.

2. **VIDEO QUESTION MODE**
Use this when the user asks about:
- the video's content
- events in the video
- the speaker’s statements
- topics discussed in the transcript

======================  
TRANSCRIPT CONTEXT  
======================
{context}

======================  
USER QUESTION  
======================
{question}

======================  
YOUR ANSWER  
======================
Provide a helpful, third-person, transcript-grounded answer.
`
    );

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe((docs) =>
          docs.map((doc) => doc.pageContent).join("\n\n")
        ),
        question: new RunnablePassthrough(),
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const answer = await chain.invoke(question);
    console.log("chain answer: ", answer);

    return NextResponse.json({
      answer: answer,
    });
  } catch (error) {
    console.error("Error in chat route: ", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
