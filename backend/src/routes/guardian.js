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

router.post("/check", async (req, res) => {
  try {
    // const { phone, latitude, longitude, radius, maxAge } = req.body;

    const {
      phone,
      firstName,
      lastName,
      birthDate,
      latitude,
      longitude,
      radius,
      maxAge,
    } = req.body;

    const sim = await checkSimSwap(phone);
    const kyc = await checkKYC(phone, {
      firstName,
      lastName,
      birthDate,
    });
    const number = await checkNumberVerification(phone);
    
    // Get device location
    const deviceLocation = await getDeviceLocation(phone);
    
    // Verify location if coordinates provided, otherwise use retrieved location
    const locationToVerify = {
      latitude: latitude ?? deviceLocation.latitude,
      longitude: longitude ?? deviceLocation.longitude,
      radius: radius ?? 1500,
      maxAge: maxAge ?? 120,
    };
    
    const locationVerification = await checkLocationVerification(phone, locationToVerify);
    
    // Determine if location is verified based on result
    const locationVerified = locationVerification.verificationResult === "TRUE" || 
                            locationVerification.verificationResult === "PARTIAL";
    
    const { score, status } = calculateTrustScore({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
      numberVerified: number.verified,
      locationVerified,
    });

    const explanation = generateExplanation({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
      numberVerified: number.verified,
      locationVerified,
      score,
      status,
    });

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO risk_checks 
      (id, sim_swap_result, kyc_result, number_verification_result, location_verification_result, trust_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        id,
        sim.recentSwap,
        kyc.match,
        number.verified,
        locationVerified,
        score,
        status,
      ]
    );

    res.json({
      sim,
      kyc,
      number,
      deviceLocation,
      locationVerification,
      locationVerified,
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
    const { simSwap, kycMismatch, numberVerified, locationMismatch } = req.body;

    const locationVerified = !locationMismatch;

    const { score, status } = calculateTrustScore({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      numberVerified: numberVerified ?? true,
      locationVerified,
    });

    const explanation = generateExplanation({
      simSwap: simSwap || false,
      kycMatch: !kycMismatch,
      numberVerified: numberVerified ?? true,
      locationVerified,
      score,
      status,
    });

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO risk_checks 
      (id, sim_swap_result, kyc_result, number_verification_result, location_verification_result, trust_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        id,
        simSwap || false,
        !kycMismatch,
        numberVerified ?? true,
        locationVerified,
        score,
        status,
      ]
    );

    res.json({
      simulated: true,
      sim: { recentSwap: simSwap || false },
      kyc: { match: !kycMismatch },
      number: { verified: numberVerified ?? true },
      locationVerified,
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

export default router;