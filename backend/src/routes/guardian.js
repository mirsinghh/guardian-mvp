import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { calculateTrustScore } from "../services/trustScoreService.js";
import {
  checkSimSwap,
  checkKYC,
  checkNumberVerification,
} from "../services/nokiaService.js";

const router = express.Router();

router.post("/check", async (req, res) => {
  const { phone } = req.body;

  const sim = await checkSimSwap(phone);
  const kyc = await checkKYC(phone);
  const number = await checkNumberVerification(phone);

  const { score, status } = calculateTrustScore({
    simSwap: sim.recentSwap,
    kycMatch: kyc.match,
    numberVerified: number.verified,
  });

  res.json({
    sim,
    kyc,
    number,
    trustScore: score,
    status,
  });
});

router.post("/simulate", async (req, res) => {
  try {
    const { simSwap, kycMismatch, numberVerified } = req.body;

    const { score, status } = calculateTrustScore({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      numberVerified: numberVerified ?? true,
    });

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO risk_checks 
      (id, sim_swap_result, kyc_result, number_verification_result, trust_score, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        id,
        simSwap || false,
        !kycMismatch,
        numberVerified ?? true,
        score,
        status,
      ]
    );

    res.json({
      simulated: true,
      trustScore: score,
      status,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM risk_checks ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;