import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextRequest, NextResponse } from "next/server";

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
    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: videoId,
      url: "http://127.0.0.1:8000",
    });

    const retriever = vectorStore.asRetriever({ k: 4 });

    /// prompt:
    const prompt = PromptTemplate.fromTemplate(
      `You are a helpful assistant answering questions ABOUT the video.
You will use the transcript as factual evidence, but you should NOT speak as the narrator or in first-person.
You should describe things objectively.

Rules:
- DO NOT imitate the speaker.
- DO NOT answer in first-person unless the user asks for a quote.
- DO NOT pretend to be a character.
- Always answer about the content, not as the content.

Transcript context:
{context}

Question: {question}

Your answer (objective, third-person, based on context):
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
