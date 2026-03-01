import { useState } from "react";
import axios from "axios";

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
          setResult(res.data);
        }}
      >
        Simulate SIM Swap
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Status: {result.status}</h2>
          <h3>Trust Score: {result.trustScore}</h3>

          <p>SIM Swap: {result.sim.recentSwap ? "YES" : "NO"}</p>
          <p>KYC Match: {result.kyc.match ? "YES" : "NO"}</p>
          <p>Number Verified: {result.number.verified ? "YES" : "NO"}</p>
        </div>
      )}
    </div>
  );
}

export default App;