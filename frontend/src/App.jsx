import { useState } from "react";
import axios from "axios";
import "./index.css";
import { TEST_USER, DEMO_SCENARIOS } from "./constants";
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  AlertOctagon, 
  Circle,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  CreditCard,
  Lock,
  MapPin
} from "lucide-react";

function App() {
  const [mode, setMode] = useState("user");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionType, setActionType] = useState(null);
  const itemsPerPage = 10;

  const checkGuardian = async (action = null) => {
    if (action) setActionType(action);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/guardian/check", {
        phone: TEST_USER.phone,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        birthDate: TEST_USER.birthDate,
        actionType: action, // 👈 NUEVO: Enviamos el tipo de acción al backend
      });
      setResult(res.data);
    } catch (error) {
      console.error("❌ Error en checkGuardian:", error);
      console.error("Error details:", error.response?.data || error.message);
      alert(`Backend error: ${error.response?.data?.error || error.message || "Connection failed"}`);
    }
    setLoading(false);
  };

  const resetCheck = () => {
    setResult(null);
    setActionType(null);
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
    setCurrentPage(1); // Reset to first page when loading new history
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Sensitive Actions Definitions
  const sensitiveActions = [
    {
      id: "sms",
      title: "Suspicious SMS",
      description: "Received SMS from my bank requesting action",
      icon: MessageSquare,
      color: "blue",
      context: "suspicious SMS from your bank"
    },
    {
      id: "transfer",
      title: "Bank Transfer",
      description: "Make a large bank transfer",
      icon: CreditCard,
      color: "green",
      context: "bank transfer"
    },
    {
      id: "password",
      title: "Change Password",
      description: "Update account password or sensitive data",
      icon: Lock,
      color: "purple",
      context: "password change"
    },
    {
      id: "location",
      title: "New Location Access",
      description: "Access account from unfamiliar location",
      icon: MapPin,
      color: "amber",
      context: "access from new location"
    }
  ];

  // Loader Component
  const Loader = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Guardian</h1>
            <p className="text-sm text-gray-500 mt-1 font-light">Elderly Protection System</p>
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

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* ================= USER MODE ================= */}
        {mode === "user" && (
          <div className="flex flex-col items-center justify-start px-6 pt-8 pb-10">
            
            {!result ? (
              <>
                <ShieldCheck className="w-20 h-20 text-blue-600 mb-4" />
                <h2 className="text-4xl md:text-5xl font-semibold mb-3 text-gray-900">
                  Guardian Protection
                </h2>

                <p className="text-gray-600 mb-8 text-lg md:text-xl max-w-2xl leading-relaxed text-center font-light">
                  Protect yourself before performing sensitive actions. Select what you want to do:
                </p>

                {/* SENSITIVE ACTIONS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-6">
                  {sensitiveActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => checkGuardian(action.id)}
                        disabled={loading}
                        className="group relative p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                            <Icon className={`w-6 h-6 text-${action.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-600 font-light">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        {loading && (
                          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-2xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm text-gray-500 text-center max-w-lg font-light">
                  We'll verify your identity using telecom signals before allowing the action.
                </p>
              </>
            ) : (
              <div className="w-full max-w-2xl">
                {/* ACTION CONTEXT HEADER */}
                {actionType && sensitiveActions.find(a => a.id === actionType) && (
                  <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                    {(() => {
                      const action = sensitiveActions.find(a => a.id === actionType);
                      const Icon = action.icon;
                      return (
                        <>
                          <Icon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Verification for: {action.title}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* RESULT CARD */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg">
                  
                  <div
                    className={`text-2xl md:text-3xl font-semibold mb-4 text-center ${
                      result.trustScore >= 75
                        ? "text-green-600"
                        : result.trustScore >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.trustScore >= 75
                      ? "✓ Secure"
                      : result.trustScore >= 50
                      ? "⚠ Review Recommended"
                      : "⛔ High Risk"}
                  </div>

                  {/* SCORE + ALERT ICON */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-[96px] md:text-[110px] font-semibold leading-none text-gray-900">
                      {result.trustScore}
                    </div>

                    {result.trustScore < 50 && (
                      <AlertOctagon className="w-14 h-14 text-red-500 animate-pulse" />
                    )}
                  </div>

                  <div className="text-gray-500 text-lg mb-6 font-light text-center">
                    Trust Score (0 – 100)
                  </div>

                  {/* TRAFFIC LIGHT MESSAGE */}
                  <div className="mb-6 flex justify-center">
                    {result.trustScore >= 75 && (
                      <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-green-50 border-2 border-green-200">
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                        <div>
                          <p className="text-lg font-semibold text-green-800">
                            All good. You can continue.
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            Your identity is verified and secure.
                          </p>
                        </div>
                      </div>
                    )}

                    {result.trustScore >= 50 && result.trustScore < 75 && (
                      <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
                        <AlertTriangle className="w-7 h-7 text-amber-600" />
                        <div>
                          <p className="text-lg font-semibold text-amber-900">
                            Please review before continuing.
                          </p>
                          <p className="text-sm text-amber-800 mt-1">
                            Some verification signals need attention.
                          </p>
                        </div>
                      </div>
                    )}

                    {result.trustScore < 50 && (
                      <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-50 border-2 border-red-200">
                        <ShieldAlert className="w-7 h-7 text-red-600" />
                        <div>
                          <p className="text-lg font-semibold text-red-800">
                            High risk detected. Do NOT continue.
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Your identity may be compromised. Contact support.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="h-5 bg-gray-200 rounded-full overflow-hidden mb-8 shadow-inner">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.trustScore >= 75
                          ? "bg-gradient-to-r from-green-400 to-green-500"
                          : result.trustScore >= 50
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-red-400 to-red-500"
                      }`}
                      style={{ width: `${result.trustScore}%` }}
                    ></div>
                  </div>

                  {/* AI EXPLANATION */}
                  {result.explanation && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            AI Explanation {result.mcpUsed && <span className="text-xs text-purple-600">(MCP Enhanced)</span>}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={resetCheck}
                    className="w-full py-5 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                  >
                    Check Another Action
                  </button>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= DASHBOARD MODE ================= */}
        {mode === "dashboard" && (
        <>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ACTIONS PANEL */}
          <section className="lg:col-span-1 space-y-4">
            {/* Live Check */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wider">
                Live Verification
              </h3>
              <button
                onClick={() => checkGuardian()}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  `Check: ${TEST_USER.firstName}`
                )}
              </button>
              {result?.apiMode && (
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5 ${
                  result.apiMode === 'LIVE' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Circle className={`h-2 w-2 ${result.apiMode === 'LIVE' ? 'fill-green-600 text-green-600' : 'fill-amber-600 text-amber-600'}`} />
                  {result.apiMode === 'LIVE' ? 'LIVE APIs' : 'DEMO Mode'} 
                  {result.apiCallsSuccessful && ` (${result.apiCallsSuccessful}/2 OK)`}
                </div>
              )}
            </div>

            {/* Demo Scenarios */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wider">
                Demo Scenarios
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => runSimulation("safe")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <CheckCircle2 className="h-4 w-4 text-green-600" />} 
                    Safe User
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Score: 100 | No SIM Swap | KYC Match</div>
                </button>
                <button
                  onClick={() => runSimulation("simswap")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <AlertTriangle className="h-4 w-4 text-amber-600" />} 
                    SIM Swap Detected
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Score: 40 | SIM Swap ✓ | KYC Match</div>
                </button>
                <button
                  onClick={() => runSimulation("kyc")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <FileText className="h-4 w-4 text-blue-600" />} 
                    KYC Mismatch
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Score: 70 | No SIM Swap | KYC Fail</div>
                </button>
                <button
                  onClick={() => runSimulation("maximum")}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <AlertOctagon className="h-4 w-4 text-red-600" />} 
                    Maximum Risk
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Score: 10 | SIM Swap ✓ | KYC Fail</div>
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
              <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900">Verification Results</h3>
                  {result?.simulated && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 uppercase">
                      🎬 Simulated
                    </span>
                  )}
                </div>
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
                  <p className="text-sm text-gray-400 mt-2 font-light">Click "Check" or run a simulation</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Scenario Info (if simulated) */}
                  {result.simulated && result.scenario && (
                    <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-700 font-semibold text-sm">🎬 Scenario:</span>
                        <span className="text-purple-900 font-medium text-sm">{result.scenario}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">SIM Swap:</span>
                          <span className={`font-semibold ${result.sim?.recentSwap ? 'text-red-700' : 'text-green-700'}`}>
                            {result.sim?.recentSwap ? '✓ Detected' : '✗ Not Detected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">KYC Match:</span>
                          <span className={`font-semibold ${result.kyc?.match ? 'text-green-700' : 'text-red-700'}`}>
                            {result.kyc?.match ? '✓ Matched' : '✗ Failed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trust Score */}
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Trust Score</p>
                    <p className="text-5xl font-semibold text-gray-900">{result.trustScore}</p>
                    <p className="text-base text-gray-500 mt-1 font-light">out of 100</p>
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
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">SIM Swap</p>
                          <p className={`text-xl font-semibold mt-2 flex items-center gap-2 ${
                            result.sim?.recentSwap ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {result.sim?.recentSwap ? (
                              <><AlertTriangle className="h-5 w-5" /> Detected</>
                            ) : (
                              <><ShieldCheck className="h-5 w-5" /> Not Detected</>
                            )}
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
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Match</p>
                          <p className={`text-xl font-semibold mt-2 flex items-center gap-2 ${
                            result.kyc?.match ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            {result.kyc?.match ? (
                              <><CheckCircle2 className="h-5 w-5" /> Matched</>
                            ) : (
                              <><AlertTriangle className="h-5 w-5" /> Mismatch</>
                            )}
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
                            <div className={`px-2 py-1 rounded text-center flex items-center justify-center gap-1 ${
                              result.kyc.details.givenNameMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.givenNameMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Name
                            </div>
                            <div className={`px-2 py-1 rounded text-center flex items-center justify-center gap-1 ${
                              result.kyc.details.familyNameMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.familyNameMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Surname
                            </div>
                            <div className={`px-2 py-1 rounded text-center flex items-center justify-center gap-1 ${
                              result.kyc.details.birthdateMatch 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.kyc.details.birthdateMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Birth
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
                          <p className="text-sm font-medium text-gray-700 mb-2">
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
                      <p className="text-sm font-medium text-gray-700 mb-3">Risk Factors</p>
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
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Verification History</h3>
              <span className="text-sm text-gray-500">{history.length} total records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIM Swap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item) => (
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
                      <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                        {item.sim_swap_result ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Yes
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            No
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, history.length)} of {history.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* JSON INPUT/OUTPUT SECTION */}
        {result && (
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">API Calls Trace (Debug)</h3>
              {result.apiCalls && (
                <p className="text-xs text-gray-500 mt-1">
                  {result.apiCalls.successfulCalls}/{result.apiCalls.totalCalls} calls successful
                </p>
              )}
            </div>
            <div className="p-6 space-y-6">
              {/* API CALLS: REQUEST + RESPONSE LADO A LADO */}
              {result.apiCalls && (
                <>
                  {/* 1. SIM SWAP API */}
                  <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
                      <p className="text-sm font-semibold text-purple-900">1. SIM Swap API</p>
                    </div>
                    <div className="grid md:grid-cols-2 divide-x divide-purple-200">
                      {/* REQUEST */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                             Request
                          </span>
                        </div>
                        <pre className="text-xs text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded-lg border border-gray-200">
{JSON.stringify(result.apiCalls.simSwap.request, null, 2)}
                        </pre>
                      </div>
                      
                      {/* RESPONSE */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                            result.apiCalls.simSwap.response.status >= 200 && result.apiCalls.simSwap.response.status < 300
                              ? 'bg-green-100 text-green-700'
                              : result.apiCalls.simSwap.response.status >= 400 && result.apiCalls.simSwap.response.status < 500
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                             Response: {result.apiCalls.simSwap.response.status}
                          </span>
                        </div>
                        <pre className="text-xs text-gray-700 overflow-x-auto bg-green-50 p-3 rounded-lg border border-green-200">
{JSON.stringify(result.apiCalls.simSwap.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* 2. KYC MATCH API */}
                  <div className="border-2 border-indigo-200 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-200">
                      <p className="text-sm font-semibold text-indigo-900">2. KYC Match API</p>
                    </div>
                    <div className="grid md:grid-cols-2 divide-x divide-indigo-200">
                      {/* REQUEST */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                             Request
                          </span>
                        </div>
                        <pre className="text-xs text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded-lg border border-gray-200">
{JSON.stringify(result.apiCalls.kyc.request, null, 2)}
                        </pre>
                      </div>
                      
                      {/* RESPONSE */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                            result.apiCalls.kyc.response.status >= 200 && result.apiCalls.kyc.response.status < 300
                              ? 'bg-green-100 text-green-700'
                              : result.apiCalls.kyc.response.status >= 400 && result.apiCalls.kyc.response.status < 500
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                             Response: {result.apiCalls.kyc.response.status}
                          </span>
                        </div>
                        <pre className="text-xs text-gray-700 overflow-x-auto bg-green-50 p-3 rounded-lg border border-green-200">
{JSON.stringify(result.apiCalls.kyc.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* 3. NUMBER VERIFICATION API */}
                  {result.apiCalls.numberVerification && (
                    <div className="border-2 border-teal-200 rounded-xl overflow-hidden">
                      <div className="bg-teal-50 px-4 py-2 border-b border-teal-200">
                        <p className="text-sm font-semibold text-teal-900">3. Number Verification API</p>
                      </div>
                      <div className="grid md:grid-cols-2 divide-x divide-teal-200">
                        {/* REQUEST */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                              📤 Request
                            </span>
                          </div>
                          <pre className="text-xs text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded-lg border border-gray-200">
{JSON.stringify(result.apiCalls.numberVerification.request, null, 2)}
                          </pre>
                        </div>
                        
                        {/* RESPONSE */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                              result.apiCalls.numberVerification.response.status >= 200 && result.apiCalls.numberVerification.response.status < 300
                                ? 'bg-green-100 text-green-700'
                                : result.apiCalls.numberVerification.response.status >= 400 && result.apiCalls.numberVerification.response.status < 500
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              📥 Response: {result.apiCalls.numberVerification.response.status}
                            </span>
                          </div>
                          <pre className="text-xs text-gray-700 overflow-x-auto bg-green-50 p-3 rounded-lg border border-green-200">
{JSON.stringify(result.apiCalls.numberVerification.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* FINAL PROCESSED RESULT */}
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">⚙️ Processed Result (Trust Score + MCP Decision)</p>
                </div>
                <div className="p-4">
                  <pre className="text-xs text-gray-700 overflow-x-auto bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}

export default App;