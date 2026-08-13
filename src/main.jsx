import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as pdfjslib from "pdfjs-dist";
import "./style.css";

pdfjslib.globalworkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
  ).toString();
function App() {
  const [resumeText, setResumeText] = useState(
    "Data Analyst with experience in SQL, Python, Power BI and data visualization. Worked on dashboards and reporting projects."
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

const handlePdfUpload = async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  if (file.type !== "application/pdf") {
    setError("Please select a PDF file.");
    return;
  }

  try {
    setPdfLoading(true);
    setError("");

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer
    }).promise;

    let extractedText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item) => item.str)
        .join(" ");

      extractedText += pageText + "\n\n";
    }

    if (!extractedText.trim()) {
      throw new Error(
        "No text found in this PDF. Please use a text-based PDF."
      );
    }

    setResumeText(extractedText.trim());
  } catch (err) {
    setError(err.message || "Failed to read PDF.");
  } finally {
    setPdfLoading(false);
  }
};
  
  const handleReview = async () => {
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resumeText })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setFeedback(data.feedback);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <p className="badge">Capstone Mini Project</p>
        <h1>AI Resume Reviewer</h1>
        <p className="subtitle">
          Paste resume content and get AI-generated improvement suggestions, missing skills, and a rating.
        </p>
      </section>

      <section className="card">
        <label htmlFor="resume">Resume Text</label>
        <input
          type="file"
          accept=".pdf.application/pdf"
          onchange={handlepdfupload}
          disabled={pdfloading}
          />
        {pdfloading & & <p>Extracting text from PDF...</p>
          
        <textarea
          id="resume"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste resume text here..."
        />

        <button onClick={handleReview} disabled={loading || !resumeText.trim()}>
          {loading ? "Reviewing..." : "Review Resume"}
        </button>
      </section>

      {error && <section className="error">{error}</section>}

      {feedback && (
        <section className="result">
          <h2>AI Resume Feedback</h2>
          <pre>{feedback}</pre>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
