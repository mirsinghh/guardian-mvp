import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { calculateTrustScore } from "../services/trustScoreService.js";
import { generateExplanation, generateRandomAction, analyzeAndDecide } from "../services/aiService.js";
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
    const { phone, firstName, lastName, birthDate, actionType } = req.body;

    console.log(`\n🔍 Guardian Check iniciado para: ${phone}`);
    console.log(`   📌 Tipo de acción: ${actionType || "genérica"}`);

    const timestamp = new Date().toISOString();

    /* ===== STEP 1: TELECOM SIGNALS ===== */
    const sim = await checkSimSwap(phone);
    const kyc = await checkKYC(phone, { firstName, lastName, birthDate });
    // Number Verification: Solo en Demo Scenarios, no en check de JOHN

    console.log(`   SIM Swap: ${sim.recentSwap ? "⚠️ DETECTADO" : "✅ OK"}`);
    console.log(`   KYC Match: ${kyc.match ? "✅ OK" : "⚠️ NO COINCIDE"}`);

    // Registrar llamadas API para trazabilidad (sin referencias circulares)
    const apiCalls = {
      simSwap: {
        request: {
          method: "POST",
          url: "https://network-as-code.p-eu.rapidapi.com/sim-swap/v0/retrieve-date",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "***hidden***",
            "X-RapidAPI-Host": "network-as-code.p-eu.rapidapi.com"
          },
          body: { phoneNumber: phone }
        },
        response: {
          status: sim.apiSuccess ? 200 : (sim.isDemo ? 200 : 500),
          data: sim.isDemo 
            ? { swapped: false, demo: true }
            : { swapped: sim.recentSwap },
          timestamp: timestamp
        }
      },
      kyc: {
        request: {
          method: "POST",
          url: "https://network-as-code.p-eu.rapidapi.com/kyc-match/v0.3/match",
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "***hidden***",
            "X-RapidAPI-Host": "network-as-code.p-eu.rapidapi.com"
          },
          body: {
            phoneNumber: phone,
            givenName: firstName,
            familyName: lastName,
            birthdate: birthDate
          }
        },
        response: {
          status: kyc.apiSuccess ? 200 : (kyc.isDemo ? 200 : 500),
          data: kyc.isDemo
            ? { matchResult: "false", demo: true }
            : {
                matchResult: kyc.match ? "true" : "false",
                matchDetails: kyc.details || {}
              },
          timestamp: timestamp
        }
      },
      totalCalls: 2,
      successfulCalls: [sim.apiSuccess, kyc.apiSuccess].filter(Boolean).length
    };

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
          actionType, // 👈 NUEVO: Contexto de acción sensible
        });

        // MCP devuelve análisis estructurado
        explanation = await generateExplanation({
          simSwap: mcpResult.simSwap,
          kycMatch: mcpResult.kycMatch,
          score: mcpResult.score,
          status: mcpResult.status,
          riskFactors: mcpResult.riskFactors,
          context: "elderly_protection",
          actionType, // 👈 NUEVO: Para explicaciones contextualizadas
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
          actionType,
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
            actionType,
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

    console.log(`   ✅ Check completado\n`);

    // Limpiar objetos sim, kyc y numberVerification para evitar referencias circulares
    const cleanSim = {
      recentSwap: sim.recentSwap,
      apiSuccess: sim.apiSuccess,
      isDemo: sim.isDemo,
      lastSwapDate: sim.lastSwapDate || null
    };

    const cleanKyc = {
      match: kyc.match,
      apiSuccess: kyc.apiSuccess,
      isDemo: kyc.isDemo,
      details: kyc.details || null
    };

    res.json({
      apiCalls, // 👈 NUEVO: Traza de llamadas API
      sim: cleanSim,
      kyc: cleanKyc,
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      metadata: {
        mode: isLiveMode ? "LIVE" : "DEMO",
        mcpUsed, // Indica si MCP fue usado (invisible para usuario)
        timestamp: timestamp,
        apiCallsSuccessful: apiCalls.successfulCalls,
        totalAPICalls: apiCalls.totalCalls,
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

    /* ===== SIMULAR LLAMADAS API CON DATOS REALISTAS ===== */
    const timestamp = new Date().toISOString();
    
    // SIMULAR: SIM Swap API Request/Response
    const simSwapApiCall = {
      request: {
        method: "POST",
        url: "https://network-as-code.p-eu.rapidapi.com/sim-swap/v0/retrieve-date",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "8e4***************************a7c (hidden)",
          "X-RapidAPI-Host": "network-as-code.p-eu.rapidapi.com"
        },
        body: {
          phoneNumber: TEST_USER.phone
        }
      },
      response: {
        status: 200,
        data: scenarioConfig.simSwap 
          ? { latestSimChange: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() } // 48h atrás
          : { latestSimChange: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString() }, // 500 días atrás
        timestamp: timestamp
      }
    };

    // SIMULAR: KYC Match API Request/Response
    const kycApiCall = {
      request: {
        method: "POST",
        url: "https://network-as-code.p-eu.rapidapi.com/kyc-match/v0.3/match",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "8e4***************************a7c (hidden)",
          "X-RapidAPI-Host": "network-as-code.p-eu.rapidapi.com"
        },
        body: {
          phoneNumber: TEST_USER.phone,
          givenName: TEST_USER.firstName,
          familyName: TEST_USER.lastName,
          birthdate: TEST_USER.birthDate
        }
      },
      response: {
        status: 200,
        data: {
          matchResult: scenarioConfig.kycMatch ? "true" : "false",
          matchDetails: {
            givenNameMatch: scenarioConfig.kycMatch,
            familyNameMatch: scenarioConfig.kycMatch,
            birthdateMatch: scenarioConfig.kycMatch
          }
        },
        timestamp: timestamp
      }
    };

    // SIMULAR: Number Verification API Request/Response
    const numberVerificationApiCall = {
      request: {
        method: "POST",
        url: "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/number-verification/number-verification/v0/verify",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "8e4***************************a7c (hidden)",
          "X-RapidAPI-Host": "network-as-code.nokia.rapidapi.com",
          "Authorization": "Bearer ***hidden***"
        },
        body: {
          phoneNumber: TEST_USER.phone
        }
      },
      response: {
        status: 200,
        data: {
          devicePhoneNumberVerified: true // En simulación siempre verificado
        },
        timestamp: timestamp
      }
    };

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
      
      // Datos simulados de las llamadas API
      apiCalls: {
        simSwap: simSwapApiCall,
        kyc: kycApiCall,
        numberVerification: numberVerificationApiCall,
        totalCalls: 3,
        successfulCalls: 3
      },

      // Resultados procesados
      sim: { 
        recentSwap: scenarioConfig.simSwap,
        apiSuccess: true,
        lastSwapDate: scenarioConfig.simSwap 
          ? new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          : null
      },
      kyc: { 
        match: scenarioConfig.kycMatch,
        apiSuccess: true,
        details: {
          givenNameMatch: scenarioConfig.kycMatch,
          familyNameMatch: scenarioConfig.kycMatch,
          birthdateMatch: scenarioConfig.kycMatch
        }
      },
      numberVerification: {
        verified: true,
        apiSuccess: true,
        isDemo: true
      },
      
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      
      metadata: {
        mode: "SIMULATION",
        timestamp: timestamp,
        apiCallsSuccessful: 3,
        totalAPICalls: 3
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

/* ===============================
   GENERATE RANDOM ACTION
   Genera contenido contextual aleatorio para simulaciones
================================ */
router.post("/generate-action", async (req, res) => {
  try {
    const { actionType, isFraudulent } = req.body;
    
    if (!actionType) {
      return res.status(400).json({ error: "actionType es requerido" });
    }
    
    console.log(`\n🎲 Generando acción aleatoria: ${actionType} (fraude: ${isFraudulent})`);
    
    const randomAction = generateRandomAction(actionType, isFraudulent);
    
    console.log(`   ✅ Contenido generado: ${randomAction.content.substring(0, 60)}...`);
    
    res.json({
      success: true,
      action: randomAction
    });
    
  } catch (error) {
    console.error("❌ Error generando acción:", error);
    res.status(500).json({ error: "Failed to generate action" });
  }
});

/* ===============================
   MCP INTELLIGENT CHECK
   Flujo completo con MCP como motor de decisión:
   1. Generar acción contextual aleatoria
   2. MCP analiza contenido y decide verificaciones
   3. Ejecutar APIs según decisión MCP
   4. Calcular Trust Score
   5. Retornar pasos para visualización UI
================================ */
router.post("/mcp-check", async (req, res) => {
  try {
    const { phone, firstName, lastName, birthDate, actionType, isFraudulent } = req.body;
    
    if (!actionType) {
      return res.status(400).json({ error: "actionType es requerido" });
    }
    
    console.log(`\n🤖 MCP CHECK iniciado para: ${phone}`);
    console.log(`   📌 Tipo de acción: ${actionType} (fraude esperado: ${isFraudulent})`);
    
    const steps = [];
    const timestamp = new Date().toISOString();
    
    // ===== PASO 1: GENERAR ACCIÓN ALEATORIA =====
    steps.push({
      step: 1,
      name: "Generando contenido contextual",
      status: "in-progress",
      timestamp: new Date().toISOString()
    });
    
    const randomAction = generateRandomAction(actionType, isFraudulent);
    
    steps[0].status = "completed";
    steps[0].result = {
      content: randomAction.content,
      type: randomAction.actionType,
      expectedFraud: randomAction.isFraudulent
    };
    
    console.log(`   ✅ Contenido generado: "${randomAction.content.substring(0, 80)}..."`);
    
    // ===== PASO 2: ANÁLISIS MCP =====
    steps.push({
      step: 2,
      name: "MCP analizando contenido",
      status: "in-progress",
      timestamp: new Date().toISOString()
    });
    
    const mcpAnalysis = analyzeAndDecide(randomAction);
    
    steps[1].status = "completed";
    steps[1].result = {
      riskLevel: mcpAnalysis.riskLevel,
      indicators: mcpAnalysis.riskIndicators,
      reasoning: mcpAnalysis.reasoning,
      verificationsNeeded: mcpAnalysis.verificationsNeeded
    };
    
    console.log(`   🔍 MCP Análisis: ${mcpAnalysis.analysis}`);
    console.log(`   📊 Indicadores: ${mcpAnalysis.riskIndicators.join(", ") || "Ninguno"}`);
    console.log(`   🔐 Verificaciones necesarias: ${mcpAnalysis.verificationsNeeded.join(", ") || "Ninguna"}`);
    
    // ===== PASO 3: EJECUTAR VERIFICACIONES SEGÚN DECISIÓN MCP =====
    let sim = { recentSwap: false, apiSuccess: false, isDemo: true };
    let kyc = { match: true, apiSuccess: false, isDemo: true };
    
    if (mcpAnalysis.verificationsNeeded.length > 0) {
      steps.push({
        step: 3,
        name: `Ejecutando verificaciones: ${mcpAnalysis.verificationsNeeded.join(", ")}`,
        status: "in-progress",
        timestamp: new Date().toISOString()
      });
      
      const verificationPromises = [];
      
      if (mcpAnalysis.verificationsNeeded.includes("SIM_SWAP")) {
        verificationPromises.push(
          checkSimSwap(phone).then(result => ({ type: "SIM_SWAP", result }))
        );
      }
      
      if (mcpAnalysis.verificationsNeeded.includes("KYC")) {
        verificationPromises.push(
          checkKYC(phone, { firstName, lastName, birthDate }).then(result => ({ type: "KYC", result }))
        );
      }
      
      const verificationResults = await Promise.all(verificationPromises);
      
      // Procesar resultados
      verificationResults.forEach(({ type, result }) => {
        if (type === "SIM_SWAP") {
          sim = result;
          console.log(`   ${sim.recentSwap ? "⚠️" : "✅"} SIM Swap: ${sim.recentSwap ? "DETECTADO" : "OK"}`);
        } else if (type === "KYC") {
          kyc = result;
          console.log(`   ${kyc.match ? "✅" : "⚠️"} KYC Match: ${kyc.match ? "OK" : "NO COINCIDE"}`);
        }
      });
      
      steps[2].status = "completed";
      steps[2].result = {
        simSwap: sim.recentSwap,
        kycMatch: kyc.match,
        executedVerifications: mcpAnalysis.verificationsNeeded
      };
      
    } else {
      steps.push({
        step: 3,
        name: "Sin verificaciones necesarias",
        status: "completed",
        timestamp: new Date().toISOString(),
        result: {
          message: "MCP determinó que el contenido es de bajo riesgo",
          skippedVerifications: true
        }
      });
      
      console.log(`   ℹ️ Sin verificaciones necesarias (bajo riesgo)`);
    }
    
    // ===== PASO 4: CALCULAR TRUST SCORE =====
    steps.push({
      step: 4,
      name: "Calculando Trust Score",
      status: "in-progress",
      timestamp: new Date().toISOString()
    });
    
    const { score, status, riskFactors, actionAllowed } = calculateTrustScore({
      simSwap: sim.recentSwap,
      kycMatch: kyc.match,
    });
    
    steps[3].status = "completed";
    steps[3].result = {
      score,
      status,
      riskFactors,
      actionAllowed
    };
    
    console.log(`   📊 Trust Score: ${score}/100 → ${status}`);
    
    // ===== PASO 5: GENERAR EXPLICACIÓN SI ES NECESARIO =====
    let explanation = "";
    
    if (score < 75) {
      steps.push({
        step: 5,
        name: "Generando explicación AI",
        status: "in-progress",
        timestamp: new Date().toISOString()
      });
      
      explanation = await generateExplanation({
        simSwap: sim.recentSwap,
        kycMatch: kyc.match,
        score,
        status,
        riskFactors,
        context: randomAction.content,
        actionType: actionType
      });
      
      steps[4].status = "completed";
      steps[4].result = {
        explanationGenerated: true,
        length: explanation.length
      };
      
      console.log(`   💬 Explicación generada (${explanation.length} chars)`);
    }
    
    // ===== GUARDAR EN BD =====
    const id = uuidv4();
    await pool.query(
      `INSERT INTO risk_checks 
       (id, sim_swap_result, kyc_result, trust_score, status, risk_factors)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, sim.recentSwap, kyc.match, score, status, JSON.stringify(riskFactors)]
    );
    
    console.log(`   ✅ MCP Check completado\n`);
    
    // ===== RESPONSE =====
    res.json({
      success: true,
      mcpMode: true,
      
      // Acción generada
      action: {
        content: randomAction.content,
        type: randomAction.actionType,
        isFraudulent: randomAction.isFraudulent,
        details: randomAction.details
      },
      
      // Análisis MCP
      mcpAnalysis: {
        riskLevel: mcpAnalysis.riskLevel,
        riskIndicators: mcpAnalysis.riskIndicators,
        reasoning: mcpAnalysis.reasoning,
        verificationsNeeded: mcpAnalysis.verificationsNeeded
      },
      
      // Resultados verificaciones
      verifications: {
        sim: {
          recentSwap: sim.recentSwap,
          apiSuccess: sim.apiSuccess,
          isDemo: sim.isDemo
        },
        kyc: {
          match: kyc.match,
          apiSuccess: kyc.apiSuccess,
          isDemo: kyc.isDemo
        }
      },
      
      // Trust Score final
      trustScore: score,
      status,
      riskFactors,
      actionAllowed,
      explanation,
      
      // Pasos para UI
      steps,
      
      // Metadata
      metadata: {
        mode: "MCP_INTELLIGENT",
        timestamp,
        totalSteps: steps.length,
        verificationsExecuted: mcpAnalysis.verificationsNeeded.length,
        checkId: id
      }
    });
    
  } catch (error) {
    console.error("❌ MCP Check failed:", error);
    res.status(500).json({ 
      success: false,
      error: "MCP Check failed",
      message: error.message 
    });
  }
});

export default router;