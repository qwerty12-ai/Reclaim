import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">

                <nav className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold tracking-[0.25em] text-white">
                            RECLAIM
                        </p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
                    >
                        Open Dashboard
                    </Link>
                </nav>

                <section className="flex flex-1 items-center py-24">
                    <div className="max-w-3xl">

                        <p className="mb-5 text-sm uppercase tracking-[0.3em] text-gray-500">
                            AI Revenue Recovery
                        </p>

                        <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                            Recover revenue
                            <br />
                            before it slips away.
                        </h1>

                        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
                            Reclaim detects revenue at risk, determines the right
                            intervention, and executes bounded recovery actions
                            while keeping every decision measurable and auditable.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="rounded-lg bg-white px-6 py-3 text-center font-medium text-black transition hover:bg-gray-200"
                            >
                                Open Recovery Dashboard
                            </Link>

                            <a
                                href="#how-it-works"
                                className="rounded-lg border border-gray-800 px-6 py-3 text-center font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
                            >
                                How it works
                            </a>
                        </div>

                    </div>
                </section>

                <section
                    id="how-it-works"
                    className="border-t border-gray-900 py-16"
                >
                    <div className="mb-10">
                        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                            Recovery workflow
                        </p>

                        <h2 className="mt-3 text-3xl font-semibold">
                            From risk to recovery.
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">

                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <p className="text-sm text-gray-600">
                                01
                            </p>

                            <h3 className="mt-5 text-lg font-semibold">
                                Detect
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Identify revenue cases that are at risk of being lost.
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <p className="text-sm text-gray-600">
                                02
                            </p>

                            <h3 className="mt-5 text-lg font-semibold">
                                Diagnose
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Analyze the case and determine an appropriate recovery intervention.
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <p className="text-sm text-gray-600">
                                03
                            </p>

                            <h3 className="mt-5 text-lg font-semibold">
                                Recover
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Execute only bounded recovery actions that the system supports.
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <p className="text-sm text-gray-600">
                                04
                            </p>

                            <h3 className="mt-5 text-lg font-semibold">
                                Measure
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                Track recovered revenue, stopping decisions, escalation, and audit history.
                            </p>
                        </div>

                    </div>
                </section>

                <footer className="border-t border-gray-900 py-6">
                    <p className="text-sm text-gray-600">
                      &copy; Reclaim - AI-powered revenue recovery. All rights reserved.
                    </p>
                </footer>

            </div>
        </main>
    );
}