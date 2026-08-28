"use client";

import { useState, useEffect } from "react";

type RecoveryAnalysisProps = {
    caseId: string;
}

export default function RecoveryAnalysis({ caseId }: RecoveryAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [execution, setExecution] = useState<any>(null);
    const [executing, setExecuting] = useState<any>(null);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [error, setError] = useState("");

    async function fetchAuditHistory() {
        try {
            setAuditLoading(true)
            const response = await fetch(`/api/recovery/execute?caseId=${caseId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch recovery audit history.")
            }
            const data = await response.json();
            setAuditHistory(data.executions || [])
        } catch (error) {
            console.error("Failed to fetch recovery audit history: ", error);
        } finally {
            setAuditLoading(false);
        }
    }

    useEffect(() => {
        fetchAuditHistory();
    }, [caseId])

    async function analyzeRecovery() {
        try {
            setLoading(true);
            setError("");
            setExecution(null);
            const response = await fetch("/api/recovery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ caseId })
            })
            if (!response.ok) {
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

    async function executeRecovery() {
        try {
            setExecuting(true);
            setError("");
            const response = await fetch("/api/recovery/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ caseId })
            })
            if (!response.ok) {
                throw new Error("Failed to execute recovery.");
            }
            const data = await response.json();
            setExecution(data.execution);
            await fetchAuditHistory();
        } catch (error) {
            setError("Unable to execute recovery.")
        } finally {
            setExecuting(false);
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
                disabled={loading || result !== null}
                className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
                {loading ? "Analyzing..." : result ? "Analysis Complete":"Analyze Recovery"}
            </button>

            {error && (
                <p className="mt-4 text-red-400">
                    {error}
                </p>
            )}

            {result && (
                <>
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
                                AI Analysis
                            </p>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Diagnosis
                                </p>

                                <p className="mt-1 font-medium">
                                    {result.ai.diagnosis}
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Recommendation
                                </p>

                                <p className="mt-1 font-medium">
                                    {result.ai.recommendation}
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Reason
                                </p>

                                <p className="mt-1 text-sm text-gray-400">
                                    {result.ai.reason}
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Confidence
                                </p>

                                <p className="mt-1 font-medium">
                                    {(Number(result.ai.confidence) * 100).toFixed(0)}%
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Customer Recovery Message
                                </p>

                                <p className="mt-1 font-medium">
                                    {result.ai.customer_message}
                                </p>
                            </div>
                        </div>

                    </div>

                    {result.recover.status === "ready" && !execution && (
                        <div className="mt-6 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-semibold">
                                Recovery Execution
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Execute the bounded recovery action for this case.
                            </p>

                            <button
                                onClick={executeRecovery}
                                disabled={executing}
                                className="mt-4 rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
                            >
                                {executing
                                    ? "Executing..."
                                    : "Execute Recovery"}
                            </button>
                        </div>
                    )}

                    {execution && (
                        <div className="mt-6 rounded-xl border border-gray-800 p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                    Recovery Execution
                                </p>

                                <h3 className="mt-1 text-xl font-semibold">
                                    {execution.status}
                                </h3>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Action
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {execution.action}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Amount Recovered
                                    </p>

                                    <p className="mt-1 font-medium">
                                        ₹
                                        {Number(
                                            execution.amountRecovered
                                        ).toLocaleString("en-IN")}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Case
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {execution.caseId}
                                    </p>
                                </div>

                            </div>

                            <div className="mt-4 rounded-lg border border-gray-800 p-4">
                                <p className="text-sm text-gray-500">
                                    Execution Reason
                                </p>

                                <p className="mt-1 text-sm text-gray-300">
                                    {execution.reason}
                                </p>
                            </div>
                        </div>
                    )}

                    {auditHistory.length > 0 && (
                        <div className="mt-6 rounded-xl border border-gray-800 p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-500">
                                    Recovery Audit
                                </p>

                                <h3 className="mt-1 text-xl font-semibold">
                                    Execution History
                                </h3>
                            </div>

                            {auditLoading ? (
                                <p className="text-sm text-gray-500">
                                    Loading audit history...
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {auditHistory.map((audit) => (
                                        <div
                                            key={audit.id}
                                            className="rounded-lg border border-gray-800 p-4"
                                        >
                                            <div className="grid gap-4 md:grid-cols-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Action
                                                    </p>

                                                    <p className="mt-1 font-medium">
                                                        {audit.action}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Status
                                                    </p>

                                                    <p className="mt-1 font-medium">
                                                        {audit.status}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Amount Recovered
                                                    </p>

                                                    <p className="mt-1 font-medium">
                                                        ₹
                                                        {Number(
                                                            audit.amount_recovered
                                                        ).toLocaleString("en-IN")}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Executed At
                                                    </p>

                                                    <p className="mt-1 text-sm">
                                                        {new Date(
                                                            audit.created_at
                                                        ).toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-lg border border-gray-800 p-4">
                                                <p className="text-sm text-gray-500">
                                                    Reason
                                                </p>

                                                <p className="mt-1 text-sm text-gray-300">
                                                    {audit.reason}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}