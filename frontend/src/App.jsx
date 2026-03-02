import { useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [location, setLocation] = useState(null);

  const checkGuardian = async (coords = null) => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/guardian/check", {
        phone: "+34600000000",
        firstName: "John",
        lastName: "Doe",
        birthDate: "1990-01-01",
        latitude: coords?.latitude,
        longitude: coords?.longitude,
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
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        checkGuardian({ latitude, longitude });
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
    if (s.includes("normal"))
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    if (s.includes("warning"))
      return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    if (s.includes("protection"))
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
          <section>
            <div className="rounded-2xl border bg-white p-6 space-y-3">
              <button
                onClick={() => checkGuardian()}
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 text-white py-2.5"
              >
                {loading ? "Checking..." : "Check User"}
              </button>

              <button
                onClick={simulateSimSwap}
                className="w-full rounded-xl border py-2.5"
              >
                Simulate SIM Swap
              </button>

              <button
                onClick={verifyLocation}
                className="w-full rounded-xl border py-2.5"
              >
                Verify Location & Check
              </button>

              <button
                onClick={loadHistory}
                className="w-full rounded-xl border py-2.5"
              >
                Load History
              </button>
            </div>
          </section>

          {/* RESULTS */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border bg-white shadow-sm">

              <div className="flex justify-between border-b px-6 py-5">
                <h2 className="text-sm font-semibold">Results</h2>
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

                  <div>
                    <p className="text-sm text-slate-600">Trust Score</p>
                    <p className="text-3xl font-semibold">
                      {result.trustScore} / 100
                    </p>
                  </div>

                  <div className="space-y-3">
                    {metricChip("SIM Swap", result.sim?.recentSwap, false)}
                    {metricChip("KYC Match", result.kyc?.match, true)}
                    {metricChip("Number Verified", result.number?.verified, true)}
                    {metricChip(
                      "Location Verified",
                      result.location?.verificationResult === "TRUE",
                      true
                    )}
                  </div>

                  {result.explanation && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        AI Security Explanation
                      </p>
                      <pre className="bg-slate-50 p-4 rounded-xl text-xs whitespace-pre-wrap">
                        {result.explanation}
                      </pre>
                    </div>
                  )}

                </div>
              )}
            </div>
          </section>
        </div>

        {/* HISTORY */}
        {history.length > 0 && (
          <div className="mt-10 rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-4">
              Risk Check History
            </h2>

            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>SIM</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{item.trust_score}</td>
                    <td>{item.status}</td>
                    <td>{item.sim_swap_result ? "YES" : "NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;