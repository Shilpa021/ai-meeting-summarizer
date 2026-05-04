import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq();

export async function POST(req: Request) {
    try {
        const { audioUrl } = await req.json();

        if (!audioUrl) {
            return Response.json({ error: "No audio URL" }, { status: 400 });
        }

        // 🟢 STEP 1 — Fetch file from URL
        const response = await fetch(audioUrl);
        const blob = await response.blob();

        // 🟢 STEP 2 — Convert to File
        const file = new File([blob], "audio.wav", {
            type: blob.type || "audio/wav",
        });

        // 🟢 STEP 3 — Send to Groq
        const transcript = await groq.audio.transcriptions.create({
            file,
            model: "whisper-large-v3",
            temperature: 0,
            response_format: "verbose_json",
        });

        return Response.json({ transcript });

    } catch (error: any) {
        console.error(error);

        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}