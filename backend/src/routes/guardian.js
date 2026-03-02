import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { calculateTrustScore } from "../services/trustScoreService.js";
import { generateExplanation } from "../services/aiService.js";
import { runMcpTool } from "../mcpBridge.js";
import { checkSimSwap, checkKYC } from "../services/nokiaService.js";
import { TEST_USER, DEMO_SCENARIOS, THRESHOLDS } from "../constants.js";

const router = express.Router();

/* ===============================
   MAIN CHECK ENDPOINT
   
   Flujo automático (NO requiere input del usuario):
   1. Verificar APIs Nokia (SIM Swap + KYC)
   2. Calcular Trust Score
   3. SI score < 50: MCP genera explicación contextual (INVISIBLE)
   4. Guardar en DB
   5. Devolver decisión + explicación
================================ */
router.post("/check", async (req, res) => {
  try {
    const { phone, firstName, lastName, birthDate } = req.body;

    console.log(`\n🔍 Guardian Check iniciado para: ${phone}`);

    /* ===== STEP 1: TELECOM SIGNALS ===== */
    const sim = await checkSimSwap(phone);
    const kyc = await checkKYC(phone, { firstName, lastName, birthDate });

    console.log(`   SIM Swap: ${sim.recentSwap ? "⚠️ DETECTADO" : "✅ OK"}`);
    console.log(`   KYC Match: ${kyc.match ? "✅ OK" : "⚠️ NO COINCIDE"}`);

    /* ===== STEP 2: TRUST SCORE ===== */
    const { score, status, riskFactors, actionAllowed } = calculateTrustScore({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
    });

    console.log(`   Trust Score: ${score}/100 → ${status}`);

    /* ===== STEP 3: MCP COMO MOTOR INTERNO (INVISIBLE) ===== */
    let explanation;
    let mcpUsed = false;

    if (score < THRESHOLDS.PROTECTION_MODE) {
      // Trust Score crítico → MCP genera análisis contextual
      console.log(`   🤖 MCP activado (score < ${THRESHOLDS.PROTECTION_MODE})`);
      
      try {
        // MCP ejecuta tool "calculate_guardian_risk" automáticamente
        const mcpResult = await runMcpTool({
          phone,
          firstName,
          lastName,
          birthDate,
        });

        // MCP devuelve análisis estructurado
        explanation = await generateExplanation({
          simSwap: mcpResult.simSwap,
          kycMatch: mcpResult.kycMatch,
          score: mcpResult.score,
          status: mcpResult.status,
          riskFactors: mcpResult.riskFactors,
          context: "elderly_protection",
        });

        mcpUsed = true;
        console.log(`   ✅ MCP generó explicación contextual`);
      } catch (mcpError) {
        console.error(`   ❌ MCP falló, usando explicación básica:`, mcpError.message);
        // Fallback: generación directa sin MCP
        explanation = await generateExplanation({
          simSwap: sim.recentSwap,
          kycMatch: kyc.match,
          score,
          status,
          riskFactors,
          context: "elderly_protection",
        });
      }
    } else {
      // Score aceptable → explicación simple sin MCP
      explanation = actionAllowed
        ? "Todas las verificaciones de seguridad han pasado correctamente. La identidad digital del usuario es consistente y segura."
        : await generateExplanation({
            simSwap: sim.recentSwap,
            kycMatch: kyc.match,
            score,
            status,
            riskFactors,
            context: "elderly_protection",
          });
    }

    /* ===== STEP 4: DB SAVE ===== */
    const id = uuidv4();
    await pool.query(
      `INSERT INTO risk_checks 
       (id, sim_swap_result, kyc_result, trust_score, status, risk_factors)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, sim.recentSwap, kyc.match, score, status, JSON.stringify(riskFactors)]
    );

    /* ===== STEP 5: RESPONSE ===== */
    const isLiveMode = process.env.USE_LIVE_NOKIA === "true";
    const apiCallsSuccessful = [sim.apiSuccess, kyc.apiSuccess].filter(Boolean).length;

    console.log(`   ✅ Check completado\n`);

    res.json({
      sim,
      kyc,
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      metadata: {
        mode: isLiveMode ? "LIVE" : "DEMO",
        mcpUsed, // Indica si MCP fue usado (invisible para usuario)
        timestamp: new Date().toISOString(),
        apiCallsSuccessful: isLiveMode ? apiCallsSuccessful : null,
        totalAPICalls: isLiveMode ? 2 : 0,
      },
    });
  } catch (error) {
    console.error("❌ Check failed:", error);
    res.status(500).json({ error: "Check failed" });
  }
});

/* ===============================
   SIMULATION ENDPOINT
   
   Propósito: Simular escenarios para DEMO sin llamar APIs Nokia
   
   Escenarios disponibles:
   - "safe": Usuario seguro (score 100)
   - "simswap": SIM Swap detectado (score 40, PROTECTION_MODE)
   - "kyc": KYC no coincide (score 70, WARNING)
   - "maximum": Ambos fallan (score 10, PROTECTION_MODE)
   
   O enviar flags manualmente: { simSwap, kycMismatch }
================================ */
router.post("/simulate", async (req, res) => {
  try {
    const { scenario, simSwap, kycMismatch } = req.body;

    // Determinar escenario
    let scenarioConfig;
    
    if (scenario) {
      // Usar escenario predefinido
      switch (scenario.toLowerCase()) {
        case "safe":
          scenarioConfig = DEMO_SCENARIOS.SAFE_USER;
          break;
        case "simswap":
          scenarioConfig = DEMO_SCENARIOS.SIM_SWAP_DETECTED;
          break;
        case "kyc":
          scenarioConfig = DEMO_SCENARIOS.KYC_MISMATCH;
          break;
        case "maximum":
          scenarioConfig = DEMO_SCENARIOS.MAXIMUM_RISK;
          break;
        default:
          return res.status(400).json({ 
            error: "Invalid scenario. Use: safe, simswap, kyc, maximum" 
          });
      }
    } else {
      // Usar flags manuales
      scenarioConfig = {
        name: "Custom Scenario",
        simSwap: simSwap || false,
        kycMatch: !kycMismatch,
      };
    }

    console.log(`\n🎬 Simulación: ${scenarioConfig.name}`);

    /* ===== CALCULAR TRUST SCORE ===== */
    const { score, status, riskFactors, actionAllowed } = calculateTrustScore({
      simSwap: scenarioConfig.simSwap,
      kycMatch: scenarioConfig.kycMatch,
    });

    /* ===== GENERAR EXPLICACIÓN ===== */
    const explanation = await generateExplanation({
      simSwap: scenarioConfig.simSwap,
      kycMatch: scenarioConfig.kycMatch,
      score,
      status,
      riskFactors,
      context: "elderly_protection",
    });

    /* ===== DB SAVE ===== */
    const id = uuidv4();
    await pool.query(
      `INSERT INTO risk_checks 
       (id, sim_swap_result, kyc_result, trust_score, status, risk_factors)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, scenarioConfig.simSwap, scenarioConfig.kycMatch, score, status, JSON.stringify(riskFactors)]
    );

    console.log(`   Trust Score: ${score}/100 → ${status}\n`);

    res.json({
      simulated: true,
      scenario: scenarioConfig.name,
      sim: { recentSwap: scenarioConfig.simSwap },
      kyc: { match: scenarioConfig.kycMatch },
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      metadata: {
        mode: "SIMULATION",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Simulation failed:", error);
    res.status(500).json({ error: "Simulation failed" });
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