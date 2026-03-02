import { useState } from "react";
import axios from "axios";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

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

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Guardian Dashboard</h1>

      <button onClick={checkGuardian} disabled={loading}>
        {loading ? "Checking..." : "Check User"}
      </button>

      <button
        style={{ marginLeft: 10 }}
        onClick={async () => {
          const res = await axios.post(
            "http://localhost:8080/guardian/simulate",
            {
              simSwap: true,
              kycMismatch: false,
              numberVerified: true,
            }
          );

          // console.log(res.data);

          setResult(res.data);
        }}
      >
        Simulate SIM Swap
      </button>

      <button
        style={{ marginLeft: 10 }}
        onClick={loadHistory}
      >
        Load History
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Status: {result.status}</h2>
          <h3>Trust Score: {result.trustScore}</h3>

          {result.explanation && (
            <div style={{ marginTop: 20 }}>
              <h3>AI Security Explanation</h3>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {result.explanation}
              </pre>
            </div>
          )}

          <p>SIM Swap: {result.sim.recentSwap ? "YES" : "NO"}</p>
          <p>KYC Match: {result.kyc.match ? "YES" : "NO"}</p>
          <p>Number Verified: {result.number.verified ? "YES" : "NO"}</p>

        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>Risk Check History</h2>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
                <th>SIM Swap</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
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
    </div>
  );
}

export default App;