import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { calculateTrustScore } from "../services/trustScoreService.js";
import { generateExplanation } from "../services/aiService.js";
import {
  checkSimSwap,
  checkKYC,
  checkNumberVerification,
} from "../services/nokiaService.js";

const router = express.Router();

router.post("/check", async (req, res) => {
  try {
    const { phone } = req.body;

    const sim = await checkSimSwap(phone);
    const kyc = await checkKYC(phone);
    const number = await checkNumberVerification(phone);

    const { score, status } = calculateTrustScore({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
      numberVerified: number.verified,
    });

    const explanation = generateExplanation({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
      numberVerified: number.verified,
      score,
      status,
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
        sim.recentSwap,
        kyc.match,
        number.verified,
        score,
        status,
      ]
    );

    res.json({
      sim,
      kyc,
      number,
      trustScore: score,
      status,
      explanation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check failed" });
  }
});

router.post("/simulate", async (req, res) => {
  try {
    const { simSwap, kycMismatch, numberVerified } = req.body;

    const { score, status } = calculateTrustScore({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      numberVerified: numberVerified ?? true,
    });

    const explanation = generateExplanation({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      numberVerified: numberVerified ?? true,
      score,
      status,
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

    // res.json({
    //   simulated: true,
    //   trustScore: score,
    //   status,
    //   explanation,
    // });

    res.json({
      simulated: true,
      sim: { recentSwap: simSwap || false },
      kyc: { match: !kycMismatch },
      number: { verified: numberVerified ?? true },
      trustScore: score,
      status,
      explanation,
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

// basic location verification endpoint
router.post("/verify-location", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    // rudimentary check - in a real app you might call a geo service
    let valid = true;
    let message = "Location looks OK";

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      valid = false;
      message = "Coordinates out of range";
    }

    res.json({ valid, message, latitude, longitude });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Location check failed" });
  }
});

export default router;