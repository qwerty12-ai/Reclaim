type SummaryCardsProps = {
    totalAtRisk: number;
    highRiskCases: number;
    recoveryCases: number;
}

export default function SummaryCards({
    totalAtRisk,
    highRiskCases,
    recoveryCases
}: SummaryCardsProps) {
    return (
        <section className="mb-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                <p className="text-sm text-gray-500">
                    Revenue at risk
                </p>

                <p className="mt-2 text-3xl font-semibold">
                    ₹{totalAtRisk.toLocaleString("en-IN")}
                </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                <p className="text-sm text-gray-500">
                    High-risk cases
                </p>

                <p className="mt-2 text-3xl font-semibold">
                    {highRiskCases}
                </p>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                <p className="text-sm text-gray-500">
                    Currently recovering
                </p>

                <p className="mt-2 text-3xl font-semibold">
                    {recoveryCases}
                </p>
            </div>
        </section>
    )
}