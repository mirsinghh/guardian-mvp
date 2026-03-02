import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { calculateTrustScore } from "../services/trustScoreService.js";
import { generateExplanation } from "../services/aiService.js";
import {
  checkSimSwap,
  checkKYC,
  checkNumberVerification,
  getDeviceLocation,
  checkLocationVerification,
} from "../services/nokiaService.js";

const router = express.Router();

/* ===============================
   MAIN CHECK ENDPOINT
================================ */
router.post("/check", async (req, res) => {
  try {
    const { phone, firstName, lastName, birthDate } = req.body;

    /* ===== TELECOM SIGNALS ===== */
    const sim = await checkSimSwap(phone);

    const kyc = await checkKYC(phone, {
      firstName,
      lastName,
      birthDate,
    });

    // NUMBER VERIFICATION
    const number = await checkNumberVerification(phone);

    // DEVICE LOCATION (try to get device location from operator)
    const deviceLocation = await getDeviceLocation(phone);

    // Build location to verify: prefer coordinates passed in body, otherwise use deviceLocation
    const locationToVerify = {
      latitude: req.body.latitude ?? deviceLocation?.latitude,
      longitude: req.body.longitude ?? deviceLocation?.longitude,
      radius: req.body.radius ?? 1500,
      maxAge: req.body.maxAge ?? 120,
    };

    const locationVerification = await checkLocationVerification(
      phone,
      locationToVerify
    );

    const locationVerified =
      locationVerification?.verificationResult === "TRUE" ||
      locationVerification?.verificationResult === "PARTIAL";
    /* ===== TRUST SCORE ===== */
    const { score, status, riskFactors, actionAllowed } =
      calculateTrustScore({
        simSwap: sim.recentSwap,
        kycMatch: kyc.match,
      });

    const explanation = await generateExplanation({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
      score,
      status,
      riskFactors,
      context: "elderly_protection",
    });

    /* ===== DB SAVE ===== */
    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO risk_checks 
      (id, sim_swap_result, kyc_result, number_verification_result, location_verification_result, trust_score, status, risk_factors)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        sim.recentSwap,
        kyc.match,
        number.verified,
        locationVerified,
        score,
        status,
        JSON.stringify(riskFactors),
      ]
    );

    const isLiveMode = process.env.USE_LIVE_NOKIA === "true";
    const apiCallsSuccessful = [
      sim.apiSuccess,
      kyc.apiSuccess,
      number.apiSuccess,
      deviceLocation.apiSuccess,
      locationVerification.apiSuccess,
    ].filter(Boolean).length;

    res.json({
      sim,
      kyc,
      number,
      deviceLocation,
      locationVerification,
      locationVerified,
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      metadata: {
        mode: isLiveMode ? "LIVE" : "DEMO",
        timestamp: new Date().toISOString(),
        apiCallsSuccessful: isLiveMode ? apiCallsSuccessful : null,
        totalAPICalls: isLiveMode ? 5 : 0,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Check failed" });
  }
});

/* ===============================
   SIMULATION
================================ */
router.post("/simulate", async (req, res) => {
  try {
    const { simSwap, kycMismatch } = req.body;

    const { score, status, riskFactors, actionAllowed } =
      calculateTrustScore({
        simSwap: simSwap || false,
        kycMatch: !kycMismatch,
      });

    const explanation = await generateExplanation({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      score,
      status,
      riskFactors,
      context: "elderly_protection",
    });

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO risk_checks 
      (id, sim_swap_result, kyc_result, trust_score, status, risk_factors)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        id,
        simSwap || false,
        !kycMismatch,
        score,
        status,
        JSON.stringify(riskFactors),
      ]
    );

    res.json({
      simulated: true,
      sim: { recentSwap: simSwap || false },
      kyc: { match: !kycMismatch },
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

/* ===============================
   HISTORY
================================ */
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