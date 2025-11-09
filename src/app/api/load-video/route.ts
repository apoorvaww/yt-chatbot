import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import yce from 'youtube-caption-extractor';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
// import { Chroma } from '@langchain/community/vectorstores/chroma';
import { QdrantClient } from "@qdrant/js-client-rest";
import {QdrantVectorStore} from '@langchain/qdrant'

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {videoId} = body;
        console.log("video id: ", videoId)

        if (!videoId) {
            return NextResponse.json(
                { error: "Video ID is required" },
                { status: 400 }
            );
        }

        //// 1. DOCUMENT INGESTION:
        const transcript_list = await yce.getSubtitles({
            videoID: videoId,
            lang: "en"
        });
        
        // const transcript = transcript_list.map(chunk => chunk.text).join(" ");
        let transcript = "";
        for(const chunk of transcript_list) {
            transcript += " " + chunk.text;
        }
        // console.log("transcript: ", transcript)
        

        if (!transcript) {
            return NextResponse.json(
                { error: "Failed to get transcript. Are captions available?" },
                { status: 400 }
            );
        }

        //// 2. TEXT SPLITTING:
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });
        const chunks = await splitter.createDocuments([transcript]);

        //// 3. VECTOR STORE CREATION:
        const embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HUGGINGFACE_API_KEY,
            model: "sentence-transformers/all-MiniLM-L6-v2",
            provider: 'hf-inference'
        });

        // This creates and stores the collection in your ChromaDB instance
        const client = new QdrantClient({
            url: process.env.QDRANT_URL!,
            apiKey: process.env.QDRANT_API_KEY!
        })

        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddings, {
                client,
                collectionName: videoId   
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: `Video ${videoId} processed and stored.` 
        });

    } catch (error) {
        console.error("Error in load-video route:", error);
        return NextResponse.json(
            { error: "Failed to process video" },
            { status: 500 }
        );
    }
}