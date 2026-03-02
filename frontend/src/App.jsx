import { useState } from "react";
import axios from "axios";
import "./index.css";
import { TEST_USER, DEMO_SCENARIOS } from "./constants";

function App() {
  const [mode, setMode] = useState("user");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const checkGuardian = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/guardian/check", {
        phone: TEST_USER.phone,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        birthDate: TEST_USER.birthDate,
      });
      setResult(res.data);
    } catch {
      alert("Backend connection failed");
    }
    setLoading(false);
  };

  const runSimulation = async (scenario) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/guardian/simulate",
        { scenario }
      );
      setResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    const res = await axios.get("http://localhost:8080/guardian/history");
    setHistory(res.data);
  };

  const resetCheck = () => setResult(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Guardian</h1>
            <p className="text-sm text-gray-500 mt-1">Elderly Protection System</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMode("user")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "user" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              User Mode
            </button>

            <button
              onClick={() => setMode("dashboard")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "dashboard" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ACTIONS PANEL */}
          <section className="lg:col-span-1 space-y-4">
            {/* Live Check */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Live Verification
              </h3>
              <button
                onClick={checkGuardian}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? "Checking..." : `Check: ${TEST_USER.firstName}`}
              </button>
              {result?.apiMode && (
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium text-center ${
                  result.apiMode === 'LIVE' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {result.apiMode === 'LIVE' ? '🟢 LIVE APIs' : '🟡 DEMO Mode'} 
                  {result.apiCallsSuccessful && ` (${result.apiCallsSuccessful}/2 OK)`}
                </div>
              )}
            </div>

            {/* Demo Scenarios */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Demo Scenarios
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => runSimulation("safe")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  ✅ Safe User
                </button>
                <button
                  onClick={() => runSimulation("simswap")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  ⚠️ SIM Swap Detected
                </button>
                <button
                  onClick={() => runSimulation("kyc")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  📄 KYC Mismatch
                </button>
                <button
                  onClick={() => runSimulation("maximum")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  🚨 Maximum Risk
                </button>
              </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <button
                onClick={loadHistory}
                className="w-full border border-gray-300 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Load History
              </button>
            </div>
          </section>

          {/* RESULTS PANEL */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          {/* RESULTS PANEL */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Verification Results</h3>
                {result?.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    result.status === 'NORMAL' 
                      ? 'bg-green-100 text-green-700' 
                      : result.status === 'WARNING' 
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {result.status}
                  </span>
                )}
              </div>

              {!result ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No verification executed</p>
                  <p className="text-sm text-gray-400 mt-2">Click "Check" or run a simulation</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Trust Score */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Trust Score</p>
                    <p className="text-5xl font-bold text-gray-900">{result.trustScore}</p>
                    <p className="text-lg text-gray-500 mt-1">out of 100</p>
                  </div>

                  {/* API Signals Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* SIM Swap */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${
                      result.sim?.recentSwap 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">SIM Swap</p>
                          <p className={`text-xl font-bold mt-2 ${
                            result.sim?.recentSwap ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {result.sim?.recentSwap ? "⚠️ Detected" : "✅ Not Detected"}
                          </p>
                        </div>
                        {!result.sim?.apiSuccess && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">DEMO</span>
                        )}
                      </div>
                    </div>

                    {/* KYC Match */}
                    <div className={`p-5 rounded-xl border-2 transition-all ${
                      result.kyc?.match 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">KYC Match</p>
                          <p className={`text-xl font-bold mt-2 ${
                            result.kyc?.match ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            {result.kyc?.match ? "✅ Matched" : "⚠️ Mismatch"}
                          </p>
                        </div>
                        {!result.kyc?.apiSuccess && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">DEMO</span>
                        )}
                      </div>

                      {/* KYC Details */}
                      {result.kyc?.details && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Details</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className={`px-2 py-1 rounded text-center ${
                              result.kyc.details.givenNameMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.givenNameMatch ? '✓' : '✗'} Name
                            </div>
                            <div className={`px-2 py-1 rounded text-center ${
                              result.kyc.details.familyNameMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.familyNameMatch ? '✓' : '✗'} Surname
                            </div>
                            <div className={`px-2 py-1 rounded text-center ${
                              result.kyc.details.birthdateMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.birthdateMatch ? '✓' : '✗'} Birth
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Allowed */}
                  <div className={`p-5 rounded-xl border-2 ${
                    result.actionAllowed 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        result.actionAllowed ? 'bg-blue-200' : 'bg-red-200'
                      }`}>
                        {result.actionAllowed ? (
                          <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {result.actionAllowed ? "Action Allowed" : "Action Blocked"}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.actionAllowed 
                            ? "User can proceed with sensitive operations" 
                            : "Additional verification required"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {result.explanation && (
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            AI Explanation {result.mcpUsed && <span className="text-xs text-purple-600">(MCP Enhanced)</span>}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {result.riskFactors && result.riskFactors.length > 0 && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Risk Factors</p>
                      <ul className="space-y-2">
                        {result.riskFactors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* HISTORY TABLE */}
        {history.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Verification History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SIM Swap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.trust_score}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'NORMAL' 
                            ? 'bg-green-100 text-green-700' 
                            : item.status === 'WARNING' 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.sim_swap_result ? "⚠️ Yes" : "✅ No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;