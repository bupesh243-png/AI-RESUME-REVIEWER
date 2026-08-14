import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as pdfjsLib from "pdfjs-dist";
import "./style.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer
  }).promise;

  let text = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item) => item.str)
      .join(" ");

    text += pageText + "\n";
  }

  return text.trim();
}

function App() {
  const [resumeText, setResumeText] = useState(
    "Data Analyst with experience in SQL, Python, Power BI and data visualization. Worked on dashboards and reporting projects."
  );

  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  // Handle PDF upload
  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFileName("");

    // Check PDF
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    // Optional 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("PDF must be smaller than 5 MB.");
      return;
    }

    setPdfLoading(true);

    try {
      const text = await extractPdfText(file);

      if (!text) {
        throw new Error(
          "No text could be extracted. This may be a scanned PDF."
        );
      }

      // Put extracted PDF text into textarea
      setResumeText(text);
      setFileName(file.name);
    } catch (err) {
      setError(err.message || "Unable to read PDF.");
    } finally {
      setPdfLoading(false);

      // Allows user to upload the same file again
      event.target.value = "";
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
          Upload a PDF or paste resume content and get AI-generated
          improvement suggestions, missing skills, and a rating.
        </p>
      </section>

      <section className="card">

        {/* PDF Upload */}
        <label htmlFor="pdf-upload">
          Upload Resume PDF
        </label>

        <div className="pdf-upload">
  <input
    id="pdf-upload"
    type="file"
    accept=".pdf,application/pdf"
    onChange={handlePdfUpload}
    disabled={pdfLoading || loading}
  />

  <label htmlFor="pdf-upload" className="pdf-upload-box">
    <div className="upload-icon">📄</div>

    <div className="upload-content">
      <strong>
        {pdfLoading ? "Reading your resume..." : "Upload your resume"}
      </strong>

      <span>
        {pdfLoading
          ? "Please wait while we extract your resume text"
          : "Drag & drop your PDF here or click to browse"}
      </span>

      <small>PDF only • Maximum 5 MB</small>
    </div>

    <div className="browse-button">
      Browse PDF
    </div>
  </label>
</div>
        {pdfLoading && (
          <p className="status">
            Reading PDF...
          </p>
        )}

        {fileName && !pdfLoading && (
          <p className="success">
            Uploaded: {fileName}
          </p>
        )}

        {/* Resume text */}
        <label htmlFor="resume">
          Resume Text
        </label>

        <textarea
          id="resume"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste resume text here..."
        />

        <button
          onClick={handleReview}
          disabled={
            loading ||
            pdfLoading ||
            !resumeText.trim()
          }
        >
          {loading ? "Reviewing..." : "Review Resume"}
        </button>

      </section>

      {error && (
        <section className="error">
          {error}
        </section>
      )}

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
