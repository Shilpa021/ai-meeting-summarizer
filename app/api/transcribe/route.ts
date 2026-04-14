import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_API_KEY);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return Response.json({ error: "No file uploaded" }, { status: 400 });
        }

        // const response = await client.automaticSpeechRecognition({
        //     model: "openai/whisper-large-v3",
        //     data: file, // ✅ FIXED
        // });

        // const audioBuffer = req.body.audio;
        const response = await client.automaticSpeechRecognition({
            data: file,
            model: 'openai/whisper-large-v3-turbo'
        });

        return Response.json({ transcript: response.text });

    } catch (error: any) {
        console.error(error);

        return Response.json(
            { error: error.message || "Transcription failed" },
            { status: 500 }
        );
    }
}