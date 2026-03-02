import { useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [location, setLocation] = useState(null);

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
      const res = await axios.post(
        "http://localhost:8080/guardian/simulate",
        {
          simSwap: true,
          kycMismatch: false,
          numberVerified: true,
        }
      );
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/guardian/history"
      );
      setHistory(res.data);
    } catch (error) {
      console.error(error);
      alert("Error loading history");
    }
  };

  const verifyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.post(
            "http://localhost:8080/guardian/verify-location",
            { latitude, longitude }
          );
          setLocation({ coords: { latitude, longitude }, server: res.data });
        } catch (error) {
          console.error(error);
          alert("Error verifying location");
        }
      },
      (err) => {
        alert("Unable to get location: " + err.message);
      }
    );
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
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-semibold text-slate-900">
            Guardian Dashboard
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ACTIONS */}
          <section className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-3">

              <button
                onClick={checkGuardian}
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300"
              >
                {loading ? "Checking..." : "Check User"}
              </button>

              <button
                onClick={simulateSimSwap}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Simulate SIM Swap
              </button>

              <button
                onClick={loadHistory}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Load History
              </button>

              <button
                onClick={verifyLocation}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Verify Location
              </button>
            </div>
          </section>

          {/* RESULTS */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Results
                </h2>

                <span className={statusBadge(result?.status)}>
                  {result ? `Status: ${result.status}` : "No data yet"}
                </span>
              </div>

              {!result ? (
                <div className="px-6 py-10 text-center text-slate-600">
                  Run a check to see results
                </div>
              ) : (
                <div className="px-6 py-6 space-y-6">

                  {/* Trust Score */}
                  <div>
                    <p className="text-sm text-slate-600">Trust Score</p>
                    <p className="text-3xl font-semibold">
                      {result.trustScore} / 100
                    </p>
                  </div>

                  {/* Signals */}
                  <div className="space-y-3">
                    {metricChip("SIM Swap", result.sim?.recentSwap, false)}
                    {metricChip("KYC Match", result.kyc?.match, true)}
                    {metricChip("Number Verified", result.number?.verified, true)}
                  </div>

                  {/* AI Explanation */}
                  {result.explanation && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        AI Security Explanation
                      </p>
                      <pre className="bg-slate-50 p-4 rounded-xl text-xs whitespace-pre-wrap">
                        {result.explanation}
                      </pre>
                    </div>
                  )}

                  {/* Raw JSON */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Raw response
                    </p>
                    <pre className="bg-slate-50 p-4 rounded-xl text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>

                  {location && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        Location Check
                      </p>
                      <p className="text-xs text-slate-600">
                       coords: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        Server response
                      </p>
                      <pre className="bg-slate-50 p-4 rounded-xl text-xs overflow-auto">
                        {JSON.stringify(location.server, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* HISTORY TABLE */}
        {history.length > 0 && (
          <>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Risk Check History
              </h2>

              {/* bar chart */}
              <div className="overflow-x-auto">
                <svg
                  className="block"
                  height={150}
                  width={Math.max(history.length * 30, 300)}
                >
                  {history.map((item, idx) => {
                    const score = item.trust_score;
                    const barHeight = (score / 100) * 140; // leave some padding
                    let color = "#f87171"; // red
                    if (score > 75) color = "#34d399"; // green
                    else if (score > 50) color = "#fbbf24"; // yellow
                    const x = idx * 30 + 5;
                    const y = 140 - barHeight + 5;
                    return (
                      <g key={item.id}>
                        <rect
                          x={x}
                          y={y}
                          width={20}
                          height={barHeight}
                          fill={color}
                        />
                        <text
                          x={x + 10}
                          y={150}
                          fontSize="8"
                          fill="#374151"
                          textAnchor="middle"
                        >
                          {new Date(item.created_at).toLocaleDateString()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left border-b">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Score</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">SIM Swap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td>{item.trust_score}</td>
                        <td>{item.status}</td>
                        <td>{item.sim_swap_result ? "YES" : "NO"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}

export default App;