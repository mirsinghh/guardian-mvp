import { useState } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [mode, setMode] = useState("user");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const checkGuardian = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/guardian/check", {
        phone: "+99999991000",
        firstName: "Federica",
        lastName: "Sanchez Arjona",
        birthDate: "1978-08-22",
      });
      setResult(res.data);
    } catch {
      alert("Backend connection failed");
    }
    setLoading(false);
  };

  const simulateSimSwap = async () => {
    const res = await axios.post("http://localhost:8080/guardian/simulate", {
      simSwap: true,
      kycMismatch: false,
      numberVerified: true,
    });
    setResult(res.data);
  };

  const loadHistory = async () => {
    const res = await axios.get("http://localhost:8080/guardian/history");
    setHistory(res.data);
  };

  const resetCheck = () => setResult(null);

  const isSafe =
    result?.status &&
    result.status.toLowerCase().includes("safe");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Guardian
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => setMode("user")}
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              User Mode
            </button>

            <button
              onClick={() => setMode("dashboard")}
              className={`px-4 py-2 rounded-full text-sm ${
                mode === "dashboard"
                  ? "bg-black text-white"
                  : "bg-gray-100"
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* ================= USER MODE ================= */}
      {mode === "user" && (
        <div className="flex flex-col items-center justify-start px-6 pt-16 pb-24 text-center">

          <h2 className="text-4xl font-semibold mb-6">
            Security Verification
          </h2>

          <p className="text-gray-600 mb-12 text-lg max-w-md">
            Verify telecom security before performing an important action.
          </p>

          {!result && (
            <button
              onClick={checkGuardian}
              disabled={loading}
              className="w-full max-w-md py-7 text-xl font-semibold rounded-2xl 
              bg-black text-white hover:opacity-80 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? "Checking..." : "Start Verification"}
            </button>
          )}

          {result && (
            <div className="mt-14 max-w-md w-full bg-white border border-gray-200 rounded-3xl p-12 shadow-sm">

              <div
                className={`text-3xl font-semibold mb-6 ${
                  isSafe ? "text-green-600" : "text-red-600"
                }`}
              >
                {isSafe ? "Secure" : "Review Recommended"}
              </div>

              <div className="text-[110px] font-semibold leading-none mb-6">
                {result.trustScore}
              </div>

              <div className="text-gray-500 text-lg mb-8">
                Trust Score (0 – 100)
              </div>

              {/* PROGRESS BAR */}
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
                <div
                  className={`h-full transition-all duration-700 ${
                    isSafe
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.trustScore}%` }}
                ></div>
              </div>

              <button
                onClick={checkGuardian}
                className="w-full py-5 text-lg rounded-2xl bg-black text-white hover:opacity-80 transition"
              >
                Run New Verification
              </button>

              <button
                onClick={resetCheck}
                className="w-full mt-4 py-3 text-sm rounded-2xl border border-gray-300"
              >
                Clear Result
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= DASHBOARD ================= */}
      {mode === "dashboard" && (
        <main className="max-w-6xl mx-auto px-6 py-16">

          <div className="grid gap-6 lg:grid-cols-3">

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">

              <button
                onClick={checkGuardian}
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-medium hover:opacity-80"
              >
                Run Check
              </button>

              <button
                onClick={simulateSimSwap}
                className="w-full border border-gray-300 py-3 rounded-xl"
              >
                Simulate SIM Swap
              </button>

              <button
                onClick={loadHistory}
                className="w-full border border-gray-300 py-3 rounded-xl"
              >
                Load History
              </button>
            </div>

            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm">

              <div className="border-b border-gray-200 px-6 py-4 flex justify-between">
                <h3 className="font-medium">
                  Verification Results
                </h3>
                <span className="text-sm text-gray-500">
                  {result ? result.status : "No Data"}
                </span>
              </div>

              {!result ? (
                <div className="p-10 text-center text-gray-500">
                  No verification executed.
                </div>
              ) : (
                <div className="p-6 space-y-6">

                  <div>
                    <p className="text-sm text-gray-500">
                      Trust Score
                    </p>
                    <p className="text-2xl font-semibold">
                      {result.trustScore} / 100
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500">SIM Swap</p>
                      <p className="text-lg font-medium">
                        {result.sim?.recentSwap ? "Detected" : "Not Detected"}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500">KYC Match</p>
                      <p className="text-lg font-medium">
                        {result.kyc?.match ? "Matched" : "Mismatch"}
                      </p>
                    </div>

                  </div>

                </div>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="mb-4 font-medium">
                Verification History
              </h3>

              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-left">Score</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-left">SIM Swap</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td>{item.trust_score}</td>
                      <td>{item.status}</td>
                      <td>{item.sim_swap_result ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;