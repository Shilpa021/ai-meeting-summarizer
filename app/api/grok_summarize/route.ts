import Groq from "groq-sdk";

const groq = new Groq();

export const getGroqChatCompletion = async (safeTranscript: string) => {
    return groq.chat.completions.create({
        messages: [
            // Set an optional system message. This sets the behavior of the
            // assistant and can be used to provide specific instructions for
            // how it should behave throughout the conversation.
            {
                role: "system",
                content: `
                Return ONLY valid JSON in this format:

                {
                    "summary": "",
                    "key_points": [],
                    "action_items": []
                }

                Rules:
                - Max 3 sentences in summary
                - Max 5 key points
                - Max 5 action items
                - If no action items, return ["No explicit action items detected"]

                Transcript:
                ${safeTranscript}
            `},
            {
                role: "user",
                content: `Transcript:\n${safeTranscript}`,
            },
        ],
        model: "openai/gpt-oss-20b",
    })
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const transcript =
            body && typeof body === "object" && "transcript" in body
                ? body.transcript
                : undefined;

        if (typeof transcript !== "string" || transcript.trim().length === 0) {
            return Response.json({ error: "Transcript is required" }, { status: 400 });
        }

        const safeTranscript = transcript.slice(0, 4000);
        let result = "";


        const completion = await getGroqChatCompletion(safeTranscript);

        result = completion.choices?.[0]?.message?.content?.trim() ?? "";

        if (!result) {
            return Response.json({ error: "No summary generated" }, { status: 502 });
        }

        return Response.json({ result });
    } catch (error: unknown) {
        console.error("Summarization error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Summarization failed";
        return Response.json({ error: errorMessage }, { status: 500 });
    }
}