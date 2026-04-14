"use client";

import { useState } from "react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {

    if (!file) return;

    
    console.log("File size:", file.size);
console.log("Type:", file.type);

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
console.log("Transcript:", data.transcript);

    setTranscript(data.transcript);

    setLoading(false);
  };

  return (
    <div className="p-10">
      <input
        type="file"
         accept="audio/wav,audio/mpeg"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload}>
        {loading ? "Transcribing..." : "Upload"}
      </button>

      {transcript && (
        <div className="mt-4">
          <h2>Transcript:</h2>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}