type RecoveryPerformanceProps = {
    revenueAtRisk: number;
    revenueRecovered: number;
    recoveryRate: number;
    casesProcessed: number;
    casesRecovered: number;
    casesStopped: number;
    casesEscalated: number;
    casesSkipped: number;
}

export default function RecoveryPerformance({
    revenueAtRisk, revenueRecovered, recoveryRate, casesProcessed, casesRecovered, casesStopped, casesEscalated, casesSkipped
}: RecoveryPerformanceProps) {
    return (
        <section className="mb-10">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">
                    Recovery Performance
                </h2>

                <p className="mt-1 text-gray-500">
                    Measure revenue recovered through bounded recovery actions.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                    <p className="text-sm text-gray-500">
                        Revenue at Risk
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                        ₹{revenueAtRisk.toLocaleString("en-IN")}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                    <p className="text-sm text-gray-500">
                        Revenue Recovered
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                        ₹{revenueRecovered.toLocaleString("en-IN")}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                    <p className="text-sm text-gray-500">
                        Recovery Rate
                    </p>

                    <p className="mt-2 text-3xl font-semibold">
                        {recoveryRate.toFixed(2)}%
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border border-gray-800 p-5">
                    <p className="text-sm text-gray-500">
                        Cases Processed
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                        {casesProcessed}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 p-5">
                    <p className="text-sm text-gray-500">
                        Recovered
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                        {casesRecovered}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 p-5">
                    <p className="text-sm text-gray-500">
                        Stopped
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                        {casesStopped}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 p-5">
                    <p className="text-sm text-gray-500">
                        Escalated
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                        {casesEscalated}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-800 p-5">
                    <p className="text-sm text-gray-500">
                        Skipped
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                        {casesSkipped}
                    </p>
                </div>
            </div>
        </section>
    );
}