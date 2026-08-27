import { Case } from "@/types";
import { useRouter } from "next/navigation";

type DashboardCase = Case & {
    recovery_status?: string;
}

type CaseTableProps = {
    cases: DashboardCase[];
}

export default function CaseTable({ cases }: CaseTableProps) {
    const router = useRouter();
    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Revenue cases
                </h2>

                <span className="text-sm text-gray-500">
                    {cases.length} cases
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-800 bg-gray-950">
                            <tr>
                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Customer
                                </th>

                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Issue
                                </th>

                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Amount
                                </th>

                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Risk
                                </th>

                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-sm text-gray-500">
                                    Recovery
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {cases.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => router.push(`/cases/${item.id}`)}
                                    className="cursor-pointer border-b border-gray-900 last:border-b-0 hover:bg-gray-950"
                                >
                                    <td className="px-5 py-4">
                                        <div className="font-medium">
                                            {item.customer_name}
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            {item.customer_email}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4 text-gray-400">
                                        {item.issue_type}
                                    </td>

                                    <td className="px-5 py-4">
                                        ₹{Number(item.amount).toLocaleString("en-IN")}
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={
                                                item.risk_score >= 70
                                                    ? "font-semibold text-red-400"
                                                    : "text-yellow-400"
                                            }
                                        >
                                            {item.risk_score}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="rounded-full border border-gray-700 px-3 py-1 text-xs">
                                            {item.status}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="rounded-full border border-gray-700 px-3 py-1 text-xs">
                                            {item.recovery_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}