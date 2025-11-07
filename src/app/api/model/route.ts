import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import yce from 'youtube-caption-extractor'
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf'
import { Chroma } from '@langchain/community/vectorstores/chroma'
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from '@langchain/core/output_parsers'

export async function POST(request: Request) {
    try {
        const {videoId} = await request.json();
        // const videoId = body.videoId;

        if (!videoId) {
            return NextResponse.json(
                { error: "Video ID is required" },
            )
        }

        //// DOCUMENT INGESTION: 

        const transcript_list = await yce.getSubtitles({
            videoID: videoId,
            lang: "en"
        })
        // console.log(transcript_list)
        let transcript = "";
        for (const chunk of transcript_list) {
            transcript += " " + chunk.text;
        }

        //// TEXT SPLITTING: 
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        })

        const chunks = await splitter.createDocuments([transcript])

        console.log("chunks: ", chunks[0])


        //// VECTOR STORE CREATION:
        const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_API_KEY,
            model: "sentence-transformers/all-MiniLM-L6-v2",
            provider: "hf-inference"
        })

        // console.log("embeddings: ", embeddings)

        const vectorStore = await Chroma.fromDocuments(
            chunks,
            embeddings, {
            collectionName: "test-collection",
            url: "http://127.0.0.1:8000"   

        }
        )

        const retriever = vectorStore.asRetriever();


        //// PROMPTS: 
        const prompt = PromptTemplate.fromTemplate(
            `You are a helpful assistant. Answer ONLY from the provided transcript context. If the context is insufficient, just say you don't know the answer. 
            {context}
            Question: {question}
            `
        )

        const question = "Summarize the key points discussed in the video."
        const retrieved_docs = await retriever.invoke(question)

        // console.log("retrieved docs: ", retrieved_docs);

        const context = retrieved_docs.map(doc => doc.pageContent).join("\n\n")


        const finalPrompt = await prompt.format({
            context,
            question
        })

        // console.log("final prompt: ", finalPrompt)

        //// LLM: 
        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash",
            temperature: 0,
            apiKey: process.env.GOOGLE_API_KEY
        });

        const ans = await llm.invoke([
            {
                role: "user",
                content: finalPrompt,
            }
        ])

        const outputParser = new StringOutputParser();

        // const chain = prompt.pipe(model).pipe(outputParser)

        // const stream = await chain.stream({
        //     chat_history: forma
        // })

        
        return NextResponse.json({ answer: ans.content })

    } catch (error) {
        console.error("Error in model route:", error);
        return NextResponse.json(
            { error: "Failed to get model response" },
            { status: 500 }
        );
    }
}

