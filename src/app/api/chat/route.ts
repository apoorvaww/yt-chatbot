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
      `You are a helpful AI assistant chatting with a user about a YouTube video.
You have been given the transcript of the video to use as your primary source of context.

Your goal is to answer the user's questions in a natural, conversational way.

======================
BEHAVIOR RULES
======================

1.  **Be a helpful assistant:** Respond in the first-person (use "I", "me", "my"). You are an AI, not the video's narrator.

2.  **Prioritize the transcript:** Always try to answer the user's question using the provided transcript context first.

3.  **Use your own knowledge:** If the transcript ({context}) does not contain the answer, or only provides a partial answer, use your own general knowledge to provide a complete and helpful response.

4.  **Differentiate your sources:** When you answer, make it clear what information comes from the video and what comes from your general knowledge.
    * **Example (from transcript):** "In the video, the speaker mentions that..."
    * **Example (from LLM knowledge):** "The video doesn't cover that, but in general, [your knowledge]..."
    * **Example (Hybrid):** "The video explains [transcript info], and to add to that, [your knowledge]..."

5.  **Be concise and natural:** Avoid overly formal or robotic language.

======================
BEHAVIOR MODES
======================

1.  **NORMAL CONVERSATION MODE**
    * **Use this when:** The user message is a greeting or casual phrase (e.g., "hi", "thanks", "how are you", "bye").
    * **Your Action:** Respond naturally and politely as a helpful AI. Do NOT use the transcript for this.

2.  **VIDEO QUESTION MODE**
    * **Use this when:** The user asks about the video's content, topics, speaker's statements, or anything related to the video.
    * **Your Action:** Follow the BEHAVIOR RULES above, using the transcript first and then your own knowledge.

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
(Provide a helpful, conversational, first-person answer based on the rules above.)
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
