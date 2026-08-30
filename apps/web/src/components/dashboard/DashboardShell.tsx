"use client";
import SummaryCards from "./SummaryCards"
import CaseTable from "./CaseTable";
import RecoveryPerformance from "./RecoveryPerformance";
import { Case } from "@/types";
import { useState } from "react";

type DashboardCase = Case & {
    recovery_status?: string;
}

type DashboardShellProps = {
    cases: DashboardCase[];
    totalAtRisk: number;
    highRiskCases: number;
    recoveryCases: number;
}

type BatchMetrics = {
    revenueAtRisk: number;
    revenueRecovered: number;
    recoveryRate: number;
    casesProcessed: number;
    casesRecovered: number;
    casesStopped: number;
    casesEscalated: number;
}

type BatchResponse = BatchMetrics & {
    casesSkipped: number;
    hasNewExecutions: boolean;
    message: string;
}

export default function DashboardShell({
    cases,
    totalAtRisk,
    highRiskCases,
    recoveryCases
}: DashboardShellProps) {
    const [batchMetrics, setBatchMetrics] = useState<BatchMetrics>({
        revenueAtRisk: 0,
        revenueRecovered: 0,
        recoveryRate: 0,
        casesProcessed: 0,
        casesRecovered: 0,
        casesStopped: 0,
        casesEscalated: 0,
    })
    const [casesSkipped, setCasesSkipped] = useState<number>(0);
    const [batchRunning, setBatchRunning] = useState<boolean>(false);
    const [batchMessage, setBatchMessage] = useState<string>("")
    const runBatchRecovery = async () => {
        try {
            setBatchRunning(true);
            setBatchMessage(""); 
            const response = await fetch("/api/recovery/batch", {
                method: "POST"
            });
            if(!response.ok) {
                throw new Error("Failed to run batch recovery.")
            }
            const data: BatchResponse = await response.json();
            setBatchMessage(data.message);
            setCasesSkipped(data.casesSkipped);
            if(data.hasNewExecutions) {
                setBatchMetrics((previous) => ({
                    revenueAtRisk: data.hasNewExecutions? data.revenueAtRisk: previous.revenueAtRisk,
                    revenueRecovered: data.hasNewExecutions? data.revenueRecovered: previous.revenueRecovered,
                    recoveryRate: data.hasNewExecutions? data.recoveryRate: previous.recoveryRate,
                    casesProcessed: data.hasNewExecutions? data.casesProcessed: previous.casesProcessed,
                    casesRecovered: data.hasNewExecutions? data.casesRecovered: previous.casesRecovered,
                    casesStopped: data.hasNewExecutions? data.casesStopped: previous.casesStopped,
                    casesEscalated: data.hasNewExecutions? data.casesEscalated: previous.casesEscalated,
                }))
            }
        } catch (error) {
            setBatchMessage("Unable to run batch recovery.")
            console.error("Batch recovery failed: ", error)
        } finally {
            setBatchRunning(false);
        }
    }
    return (
        <main className="min-h-screen bg-black px-6 py-10 text-white">
            <div className="mx-auto max-w-7xl">
                <header className="mb-10">
                    <p className="mb-2 text-sm uppercase tracking-[0.25em] text-gray-500">
                        Reclaim
                    </p>

                    <h1 className="text-4xl font-semibold">
                        Revenue Recovery
                    </h1>

                    <p className="mt-2 text-gray-400">
                        Detect revenue at risk and recover it intelligently.
                    </p>
                </header>

                <SummaryCards
                    totalAtRisk={totalAtRisk}
                    highRiskCases={highRiskCases}
                    recoveryCases={recoveryCases}
                />
                
                <button onClick={runBatchRecovery} disabled={batchRunning} className="mb-4 rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50">
                    {batchRunning ? "Running recovery..." : "Run Batch Recovery"}
                </button>

                {
                    batchMessage && (
                        <p className="mb-6 text-sm text-gray-500">
                            {batchMessage}
                        </p>
                    )
                }

                <RecoveryPerformance
                    revenueAtRisk={batchMetrics.revenueAtRisk}
                    revenueRecovered={batchMetrics.revenueRecovered}
                    recoveryRate={batchMetrics.recoveryRate}
                    casesProcessed={batchMetrics.casesProcessed}
                    casesRecovered={batchMetrics.casesRecovered}
                    casesStopped={batchMetrics.casesStopped}
                    casesEscalated={batchMetrics.casesEscalated}
                    casesSkipped={casesSkipped}
                />

                <CaseTable cases={cases} />
            </div>
        </main>
    );
}