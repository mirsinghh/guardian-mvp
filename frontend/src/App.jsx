import { useState } from "react";
import axios from "axios";
import './index.css'

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkGuardian = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/guardian/check", {
        phone: "+34600000000",
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  const simulateSimSwap = async () => {
    try {
      const res = await axios.post("http://localhost:8080/guardian/simulate", {
        simSwap: true,
        kycMismatch: false,
        numberVerified: true,
      });
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
  };

  const statusBadge = (status) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";
    if (!status) return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
    const s = String(status).toLowerCase();
    if (s.includes("ok") || s.includes("safe") || s.includes("clear"))
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    if (s.includes("warn") || s.includes("review"))
      return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    if (s.includes("risk") || s.includes("fail") || s.includes("blocked"))
      return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
    return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
  };

  const metricChip = (label, value, positive = true) => (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
          value
            ? positive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-rose-200"
            : "bg-slate-50 text-slate-700 ring-slate-200",
        ].join(" ")}
      >
        {value ? "YES" : "NO"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Guardian Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Risk & verification signals in a clear, lightweight view.
              </p>
            </div>

            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Backend: localhost
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Actions card */}
          <section className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Actions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Trigger checks and simulations.
                </p>
              </div>

              <div className="space-y-3 px-6 py-5">
                <button
                  onClick={checkGuardian}
                  disabled={loading}
                  className={[
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2",
                    loading
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                  ].join(" ")}
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {loading ? "Checking..." : "Check User"}
                </button>

                <button
                  onClick={simulateSimSwap}
                  className={[
                    "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition",
                    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                    "focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2",
                  ].join(" ")}
                >
                  Simulate SIM Swap
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-700">
                    Demo phone
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-900">
                    +34 600 000 000
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Results card */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Results
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Latest verification output.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={
                      result ? statusBadge(result.status) : statusBadge(null)
                    }
                  >
                    {result ? `Status: ${result.status}` : "No data yet"}
                  </span>
                </div>
              </div>

              {!result ? (
                <div className="px-6 py-10">
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      Run a check to see results
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Use <span className="font-semibold">Check User</span> or{" "}
                      <span className="font-semibold">Simulate SIM Swap</span>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-medium text-slate-600">
                        Trust Score
                      </p>
                      <div className="mt-2 flex items-end gap-2">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">
                          {result.trustScore}
                        </p>
                        <p className="pb-1 text-sm text-slate-600">/ 100</p>
                      </div>

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, Number(result.trustScore) || 0)
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-3 text-sm text-slate-600">
                        Interprets signals into a single confidence metric.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-medium text-slate-600">
                        Key Signals
                      </p>
                      <div className="mt-4 space-y-3">
                        {/* SIM swap is “bad” when true */}
                        {metricChip("SIM Swap", result.sim?.recentSwap, false)}
                        {metricChip("KYC Match", result.kyc?.match, true)}
                        {metricChip(
                          "Number Verified",
                          result.number?.verified,
                          true
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium text-slate-600">
                      Raw response
                    </p>
                    <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 ring-1 ring-inset ring-slate-200">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-500">
          Guardian MVP • UI powered by Tailwind CSS
        </footer>
      </main>
    </div>
  );
}

export default App;