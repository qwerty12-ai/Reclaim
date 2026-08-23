import RecoveryAnalysis from "@/components/dashboard/RecoveryAnalysis";

type CashPageProps = {
    params : Promise<{id: string;}>;
}

export default async function CasePage({params}: CashPageProps) {
    const {id} = await params;
    const response = await fetch(`http://localhost:3000/api/cases/${id}`, {cache: "no-store"})
    if(!response.ok) {
        return (
            <main className="min-h-screen bg-black p-10 text-red-400">
                Case not found. 
            </main>
        )
    }
    const data = await response.json();
    const caseData = data.case;
    return (
        <main className="min-h-screen bg-black p-10 text-white">
            <div className="mx-auto max-w-4xl">

                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                    Reclaim
                </p>

                <h1 className="mt-2 text-4xl font-semibold">
                    {caseData.customer_name}
                </h1>

                <p className="mt-2 text-gray-400">
                    {caseData.customer_email}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Issue
                        </p>

                        <p className="mt-2">
                            {caseData.issue_type}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Amount
                        </p>

                        <p className="mt-2">
                            ₹{Number(caseData.amount).toLocaleString("en-IN")}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Risk Score
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {caseData.risk_score}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-800 p-6">
                        <p className="text-sm text-gray-500">
                            Status
                        </p>

                        <p className="mt-2">
                            {caseData.status}
                        </p>
                    </div>

                </div>

                <RecoveryAnalysis caseId={id}/>
                
            </div>
        </main>
    );
}