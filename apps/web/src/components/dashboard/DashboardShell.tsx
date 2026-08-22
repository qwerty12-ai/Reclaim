import SummaryCards from "./SummaryCards"
import CaseTable from "./CaseTable";

type Case = {
    id: string;
    customer_name: string;
    customer_email: string;
    amount: string;
    currency: string;
    issue_type: string;
    status: string;
    risk_score: number;
}

type DashboardShellProps = {
    cases: Case[];
    totalAtRisk: number;
    highRiskCases: number;
    recoveryCases: number;
}

export default function DashboardShell({
    cases,
    totalAtRisk,
    highRiskCases,
    recoveryCases
}: DashboardShellProps) {
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

                <CaseTable cases={cases} />
            </div>
        </main>
    );
}