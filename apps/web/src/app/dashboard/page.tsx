"use client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {useEffect, useState} from "react";
import { Case } from "@/types";

type DashboardCase = Case & {
  recovery_status?: string;
};

export default function DashboardPage() {
  const [cases, setCases] = useState<DashboardCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/cases");
        if(!response.ok) {
          throw new Error("Failed to fetch cases");
        }
        const data = await response.json();
        const casesWithRecovery = await Promise.all(
          data.cases.map(async (item: Case) => {
            try {
              const recoveryResponse = await fetch(`/api/recovery/execute?caseId=${item.id}`);
              if (!recoveryResponse.ok) {
                return {
                  ...item,
                  recovery_status: "not_started"
                };
              }
              const recoveryData = await recoveryResponse.json();
              const latestExecution = recoveryData.executions?.[0];
              return {
                ...item,
                recovery_status: latestExecution?.status || "not_started"
              }
            } catch (error) {
              return {
                ...item,
                recovery_status: "not_started"
              }
            }
          })
        )
        setCases(casesWithRecovery);
      } catch (error) {
        setError("Unable to load revenue cases.")
      } finally {
        setLoading(false)
      }
    }
    loadCases()
  }, []);

  const totalAtRisk = cases.reduce(
    (total, item) => total + Number(item.amount), 0
  );

  const highRiskCases = cases.filter(
    (item) => item.risk_score >= 70
  ).length;

  const recoveryCases = cases.filter(
    (item) => item.status === "recovering"
  ).length;

  if(loading) {
    return (
        <main className="min-h-screen bg-black p-10 text-white">
            Loading revenue cases...
        </main>
    )
  }

  if(error) {
    return (
        <main className="min-h-screen bg-black p-10 text-red-400">
            {error}
        </main>
    )
  }

  return (
    <DashboardShell
        cases={cases}
        totalAtRisk={totalAtRisk}
        highRiskCases={highRiskCases}
        recoveryCases={recoveryCases}
    />
  );
}