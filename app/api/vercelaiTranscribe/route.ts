import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq();



export async function POST(req: Request) {
    try {
        
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const transcript = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3",
            temperature: 0,
            response_format: "verbose_json",
        });

        return Response.json({ transcript });

    } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Transcription failed";

        return Response.json({ error: message }, { status: 500 });
    }
}