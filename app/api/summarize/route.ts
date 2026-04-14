import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_API_KEY);

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript || typeof transcript !== "string") {
            return Response.json({ error: "Transcript is required" }, { status: 400 });
        }

        const prompt = `Summarize the following meeting transcript into concise bullet points, decisions, and action items:\n\n${transcript}`;

        const result = await client.textGeneration({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            inputs: prompt,
            parameters: {
                max_new_tokens: 400,
                temperature: 0.3,
            },
        });

        return Response.json({ result: result.generated_text });
    } catch (error) {
        console.error(error);
        return Response.json({ error: "Summarization failed" }, { status: 500 });
    }
}