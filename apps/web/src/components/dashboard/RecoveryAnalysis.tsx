"use client";

import { useState } from "react";

type RecoveryAnalysisProps = {
    caseId: string;
}

export default function RecoveryAnalysis({caseId}:RecoveryAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    async function analyzeRecovery() {
        try {
            setLoading(true);
            setError("");
            const response = await fetch("/api/recovery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({caseId})
            })
            if(!response.ok) {
                throw new Error("Failed to analyze recovery.");
            }
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setError("Unable to analyze recovery.")
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mt-10">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold">
                    Recovery Analysis
                </h2>

                <p className="mt-1 text-gray-500">
                    Analyze this case and generate a recovery recommendation.
                </p>
            </div>

            <button
                onClick={analyzeRecovery}
                disabled={loading}
                className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
                {loading ? "Analyzing..." : "Analyze Recovery"}
            </button>

            {error && (
                <p className="mt-4 text-red-400">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Intervention
                        </p>

                        <p className="mt-2 font-medium">
                            {result.intervention.action}
                        </p>

                        <p className="mt-2 text-sm text-gray-400">
                            {result.intervention.reason}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Recovery Plan
                        </p>

                        <p className="mt-2 font-medium">
                            {result.recover.action}
                        </p>

                        <p className="mt-2 text-sm text-gray-400">
                            {result.recover.status}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            AI Recommendation
                        </p>

                        <p className="mt-2 font-medium">
                            {result.ai.recommendation}
                        </p>

                        <p className="mt-2 text-sm text-gray-400">
                            {result.ai.reason}
                        </p>
                    </div>

                </div>
            )}
        </section>
    );
}