"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      // Reset state for new image
      setJobId(null);
      setStatus(null);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setJobId(null);
    setStatus("uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://65.0.182.39:8000", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("API failed to upload and analyze image");
      }

      const data = await response.json();
      setJobId(data.job_id);
      setStatus(data.status);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
      setStatus(null);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollResults = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(`http://65.0.182.39:8000/results/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setStatus(data.status);
        
        if (data.status === "complete" || data.status === "failed") {
          setLoading(false);
          setResult(data);
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.message || "Failed to poll results");
        setLoading(false);
        clearInterval(intervalId);
      }
    };

    if (jobId && loading && status !== "complete" && status !== "failed") {
      intervalId = setInterval(pollResults, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId, loading, status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          AI Image Analyzer
        </h1>

        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">JPG, JPEG, or PNG</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {previewUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto object-cover max-h-64"
              />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-all flex justify-center items-center ${
              !file || loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing ({status})...
              </>
            ) : (
              "Analyze Image"
            )}
          </button>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {result && result.status === "complete" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-3 border-b border-green-200 pb-2">
                Analysis Complete
              </h2>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Detected Objects:
                </h3>
                {result.detected_objects && result.detected_objects.length > 0 ? (
                  <ul className="space-y-1">
                    {result.detected_objects.map((obj: string, index: number) => {
                      const confidence = result.confidence_scores[index]
                        ? result.confidence_scores[index].toFixed(2)
                        : "N/A";
                      return (
                        <li
                          key={index}
                          className="text-sm text-gray-600 flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-green-500 before:rounded-full before:mr-2"
                        >
                          {obj} ({confidence})
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No objects detected.</p>
                )}
              </div>
            </div>
          )}

          {result && result.status === "failed" && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Analysis Failed
              </h2>
              <p className="text-sm text-red-600">
                The image couldn't be processed. Please try another one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
