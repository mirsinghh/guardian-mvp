import "dotenv/config";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// Cargar datos de SMS reales (fraude y legítimos)
let smsData = [];
try {
  const jsonPath = path.join(__dirname, "../../../studio_results_20260303_1021.json");
  const jsonContent = fs.readFileSync(jsonPath, "utf-8");
  smsData = JSON.parse(jsonContent);
  console.log(`✅ SMS data cargada: ${smsData.length} entradas`);
} catch (error) {
  console.error("⚠️ Error cargando SMS data:", error.message);
}

  export async function generateExplanation({
    simSwap,
    kycMatch,
    score,
    status,
    riskFactors,
    context,
    actionType, // 👈 NUEVO: Tipo de acción sensible
  }) {
    
  try {
    // Mensajes contextuales según tipo de acción
    const actionContexts = {
      sms: "al intentar responder a un SMS sospechoso que parece ser del banco",
      transfer: "al intentar realizar una transferencia bancaria",
      password: "al intentar cambiar su contraseña o datos sensibles",
      location: "al intentar acceder desde una nueva ubicación o dispositivo",
    };

    const actionContext = actionContexts[actionType] || "al realizar una acción sensible";

    const prompt = `
      You are a telecom fraud prevention analyst specialized in protecting elderly users.

      Context: ${context}
      User Action: The user is attempting a sensitive operation - ${actionContext}

      Telecom Signals:
      - Recent SIM Swap: ${simSwap}
      - KYC Match: ${kycMatch}
      - Risk Factors: ${riskFactors?.join(", ") || "None"}
      - Trust Score: ${score}
      - Status: ${status}

      Explain clearly in Spanish (for an elderly user):
      1. What happened technically with the telecom signals.
      2. Why this is dangerous specifically for this action (${actionType || "generic"}).
      3. What action should be taken immediately.

      Keep the explanation concise, empathetic, and actionable. Use simple language.
    `;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No explanation generated.";

    return text;

  } catch (error) {
    console.error(
      "Gemini API ERROR:",
      error.response?.data || error.message
    );
    return "AI explanation unavailable.";
  }
}

/**
 * Genera contenido aleatorio contextual para simular acciones sensibles
 * @param {string} actionType - "sms", "transfer", "password", "location"
 * @param {boolean} isFraudulent - Si debe ser fraude (true) o legítimo (false)
 * @returns {object} { content, isFraudulent, actionType, details }
 */
export function generateRandomAction(actionType, isFraudulent = false) {
  
  if (actionType === "sms") {
    // Usar datos reales del JSON
    const fraudSMS = smsData.filter(item => item.flag === "0");
    const legitSMS = smsData.filter(item => item.flag === "1");
    
    const pool = isFraudulent ? fraudSMS : legitSMS;
    
    if (pool.length === 0) {
      // Fallback si no hay datos
      return {
        content: isFraudulent 
          ? "¡URGENTE! Su cuenta bancaria ha sido bloqueada. Haga clic aquí inmediatamente."
          : "Su código de verificación es: 482913. No lo comparta.",
        isFraudulent,
        actionType: "sms",
        details: { source: "fallback" }
      };
    }
    
    const selected = pool[Math.floor(Math.random() * pool.length)];
    
    return {
      content: selected.valor,
      isFraudulent,
      actionType: "sms",
      details: { 
        source: "studio_results",
        originalFlag: selected.flag 
      }
    };
  }
  
  if (actionType === "transfer") {
    if (isFraudulent) {
      const fraudTransfers = [
        { to: "Ganador Sorteo Internacional", amount: "350€", iban: "ES9121000418450200051332" },
        { to: "Soporte Técnico Urgente", amount: "89€", iban: "ES6000491500051234567892" },
        { to: "Recuperación Cuenta", amount: "500€", iban: "ES1234567890123456789012" }
      ];
      const selected = fraudTransfers[Math.floor(Math.random() * fraudTransfers.length)];
      return {
        content: `Transferencia a: ${selected.to} | Cantidad: ${selected.amount} | IBAN: ${selected.iban}`,
        isFraudulent: true,
        actionType: "transfer",
        details: selected
      };
    } else {
      const legitTransfers = [
        { to: "María García López", amount: "45€", iban: "ES9121000418450200051332" },
        { to: "Supermercado Local", amount: "67€", iban: "ES6000491500051234567892" },
        { to: "Pedro Martínez", amount: "120€", iban: "ES7620770024003102575766" }
      ];
      const selected = legitTransfers[Math.floor(Math.random() * legitTransfers.length)];
      return {
        content: `Transferencia a: ${selected.to} | Cantidad: ${selected.amount} | IBAN: ${selected.iban}`,
        isFraudulent: false,
        actionType: "transfer",
        details: selected
      };
    }
  }
  
  if (actionType === "password") {
    if (isFraudulent) {
      const fraudPasswords = [
        { site: "secure-bank-login.com", reason: "Solicitud por SMS desconocido" },
        { site: "verify-account-now.net", reason: "Email sospechoso" },
        { site: "urgent-update-required.com", reason: "Llamada telefónica no verificada" }
      ];
      const selected = fraudPasswords[Math.floor(Math.random() * fraudPasswords.length)];
      return {
        content: `Cambio de contraseña solicitado desde: ${selected.site} | Motivo: ${selected.reason}`,
        isFraudulent: true,
        actionType: "password",
        details: selected
      };
    } else {
      const legitPasswords = [
        { site: "www.bancosantander.es", reason: "Cambio programado" },
        { site: "www.bbva.es", reason: "Actualización de seguridad" },
        { site: "www.caixabank.es", reason: "Solicitud del usuario" }
      ];
      const selected = legitPasswords[Math.floor(Math.random() * legitPasswords.length)];
      return {
        content: `Cambio de contraseña en: ${selected.site} | Motivo: ${selected.reason}`,
        isFraudulent: false,
        actionType: "password",
        details: selected
      };
    }
  }
  
  if (actionType === "location") {
    if (isFraudulent) {
      const fraudLocations = [
        { location: "Lagos, Nigeria", device: "Xiaomi RedMi desconocido", distance: "4,200 km" },
        { location: "Manila, Filipinas", device: "Samsung Galaxy A10", distance: "10,500 km" },
        { location: "Bucarest, Rumania", device: "Huawei P20 Lite", distance: "2,300 km" }
      ];
      const selected = fraudLocations[Math.floor(Math.random() * fraudLocations.length)];
      return {
        content: `Acceso desde: ${selected.location} | Dispositivo: ${selected.device} | Distancia: ${selected.distance}`,
        isFraudulent: true,
        actionType: "location",
        details: selected
      };
    } else {
      const legitLocations = [
        { location: "Madrid, España", device: "iPhone habitual", distance: "0 km" },
        { location: "Barcelona, España", device: "iPad registrado", distance: "620 km" },
        { location: "Valencia, España", device: "Samsung conocido", distance: "350 km" }
      ];
      const selected = legitLocations[Math.floor(Math.random() * legitLocations.length)];
      return {
        content: `Acceso desde: ${selected.location} | Dispositivo: ${selected.device} | Distancia: ${selected.distance}`,
        isFraudulent: false,
        actionType: "location",
        details: selected
      };
    }
  }
  
  // Fallback para tipo desconocido
  return {
    content: "Acción sensible no especificada",
    isFraudulent: false,
    actionType: actionType || "unknown",
    details: {}
  };
}

/**
 * Analiza contenido generado y decide qué verificaciones ejecutar (MCP Intelligence)
 * @param {object} action - Objeto retornado por generateRandomAction()
 * @returns {object} { analysis, riskIndicators, verificationsNeeded, reasoning, riskLevel }
 */
export function analyzeAndDecide(action) {
  const { content, actionType, isFraudulent, details } = action;
  
  const riskIndicators = [];
  let verificationsNeeded = [];
  let riskLevel = "low";
  let reasoning = "";
  
  const contentLower = content.toLowerCase();
  
  // ===== DETECTORES DE RIESGO COMUNES =====
  
  // URLs sospechosas (no HTTPS, dominios extraños)
  const suspiciousUrlPatterns = [
    /http:\/\//i,  // No HTTPS
    /\.com\//,     // Dominios genéricos
    /\-login/i,
    /\-verify/i,
    /\-update/i,
    /secure\-/i,
    /urgent\-/i,
  ];
  
  const hasSuspiciousUrl = suspiciousUrlPatterns.some(pattern => pattern.test(content));
  
  // Palabras de urgencia/presión
  const urgencyWords = [
    "urgent", "urgente", "immediately", "inmediatamente", 
    "final warning", "aviso final", "suspended", "suspendido",
    "blocked", "bloqueado", "click here", "haga clic",
    "verify now", "verificar ahora", "act now", "actuar ahora"
  ];
  
  const hasUrgency = urgencyWords.some(word => contentLower.includes(word));
  
  // Solicitudes de datos sensibles
  const dataSolicitation = [
    "password", "contraseña", "pin", "código",
    "credit card", "tarjeta", "account", "cuenta"
  ];
  
  const requestsSensitiveData = dataSolicitation.some(word => contentLower.includes(word));
  
  // ===== ANÁLISIS POR TIPO DE ACCIÓN =====
  
  if (actionType === "sms") {
    
    if (hasSuspiciousUrl) {
      riskIndicators.push("URL_SOSPECHOSA");
      riskLevel = "high";
    }
    
    if (hasUrgency) {
      riskIndicators.push("LENGUAJE_URGENTE");
      riskLevel = riskLevel === "high" ? "high" : "medium";
    }
    
    if (requestsSensitiveData) {
      riskIndicators.push("SOLICITA_DATOS_SENSIBLES");
      riskLevel = "high";
    }
    
    if (contentLower.includes("won") || contentLower.includes("ganado") || 
        contentLower.includes("prize") || contentLower.includes("premio")) {
      riskIndicators.push("PREMIO_FALSO");
      riskLevel = "high";
    }
    
    // Decisión MCP para SMS
    if (riskLevel === "high") {
      verificationsNeeded = ["SIM_SWAP", "KYC"];
      reasoning = "SMS contiene múltiples indicadores de fraude. Verificación completa requerida.";
    } else if (riskLevel === "medium") {
      verificationsNeeded = ["SIM_SWAP"];
      reasoning = "SMS muestra señales de riesgo moderado. Verificar SIM Swap.";
    } else {
      verificationsNeeded = [];
      reasoning = "SMS parece legítimo. Sin verificaciones necesarias.";
    }
    
  } else if (actionType === "transfer") {
    
    // Análisis de destinatario
    const suspiciousRecipients = [
      "sorteo", "ganador", "premio", "lottery", "winner",
      "soporte técnico", "technical support", "urgent",
      "recuperación", "recovery", "verificación", "verification"
    ];
    
    const hasSuspiciousRecipient = suspiciousRecipients.some(word => 
      contentLower.includes(word)
    );
    
    if (hasSuspiciousRecipient) {
      riskIndicators.push("DESTINATARIO_SOSPECHOSO");
      riskLevel = "high";
    }
    
    // Análisis de monto
    const amountMatch = content.match(/(\d+)€/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      if (amount > 300) {
        riskIndicators.push("MONTO_ELEVADO");
        riskLevel = riskLevel === "high" ? "high" : "medium";
      }
    }
    
    // Análisis de IBAN
    if (details.iban && details.iban.startsWith("ES12345")) {
      riskIndicators.push("IBAN_SOSPECHOSO");
      riskLevel = "high";
    }
    
    // Decisión MCP para transferencias
    if (riskLevel === "high") {
      verificationsNeeded = ["SIM_SWAP", "KYC"];
      reasoning = "Transferencia hacia destinatario sospechoso o monto elevado. Verificación completa.";
    } else if (riskLevel === "medium") {
      verificationsNeeded = ["KYC"];
      reasoning = "Transferencia de monto considerable. Verificar identidad.";
    } else {
      verificationsNeeded = [];
      reasoning = "Transferencia parece normal. Sin verificaciones necesarias.";
    }
    
  } else if (actionType === "password") {
    
    // Análisis de dominio
    const officialBanks = ["bancosantander.es", "bbva.es", "caixabank.es", "ing.es"];
    const isOfficialBank = officialBanks.some(bank => contentLower.includes(bank));
    
    if (!isOfficialBank) {
      riskIndicators.push("DOMINIO_NO_OFICIAL");
      riskLevel = "high";
    }
    
    // Análisis de motivo
    if (contentLower.includes("sms desconocido") || 
        contentLower.includes("email sospechoso") ||
        contentLower.includes("llamada no verificada")) {
      riskIndicators.push("ORIGEN_NO_VERIFICADO");
      riskLevel = "high";
    }
    
    // Decisión MCP para passwords
    if (riskLevel === "high") {
      verificationsNeeded = ["SIM_SWAP", "KYC"];
      reasoning = "Cambio de contraseña desde origen no confiable. Verificación completa.";
    } else {
      verificationsNeeded = ["KYC"];
      reasoning = "Cambio de contraseña en sitio oficial. Verificar identidad por precaución.";
    }
    
  } else if (actionType === "location") {
    
    // Análisis de ubicación
    const highRiskCountries = ["nigeria", "filipinas", "rumania", "ucrania", "rusia"];
    const isHighRiskLocation = highRiskCountries.some(country => 
      contentLower.includes(country)
    );
    
    if (isHighRiskLocation) {
      riskIndicators.push("UBICACION_ALTO_RIESGO");
      riskLevel = "high";
    }
    
    // Análisis de dispositivo
    if (contentLower.includes("desconocido") || contentLower.includes("unknown")) {
      riskIndicators.push("DISPOSITIVO_DESCONOCIDO");
      riskLevel = riskLevel === "high" ? "high" : "medium";
    }
    
    // Análisis de distancia
    const distanceMatch = content.match(/(\d+[,\.]?\d*)\s*km/);
    if (distanceMatch) {
      const distance = parseFloat(distanceMatch[1].replace(",", ""));
      if (distance > 2000) {
        riskIndicators.push("DISTANCIA_SOSPECHOSA");
        riskLevel = "high";
      }
    }
    
    // Decisión MCP para location
    if (riskLevel === "high") {
      verificationsNeeded = ["SIM_SWAP", "KYC"];
      reasoning = "Acceso desde ubicación de alto riesgo o dispositivo desconocido. Verificación completa.";
    } else if (riskLevel === "medium") {
      verificationsNeeded = ["SIM_SWAP"];
      reasoning = "Acceso desde ubicación inusual. Verificar SIM Swap.";
    } else {
      verificationsNeeded = [];
      reasoning = "Acceso desde ubicación habitual. Sin verificaciones necesarias.";
    }
  }
  
  // Si el contenido original era marcado como fraudulento, asegurar verificación
  if (isFraudulent && verificationsNeeded.length === 0) {
    verificationsNeeded = ["SIM_SWAP", "KYC"];
    riskLevel = "high";
    reasoning = "Contenido identificado como fraudulento. Verificación completa obligatoria.";
  }
  
  return {
    analysis: `Tipo: ${actionType} | Riesgo: ${riskLevel.toUpperCase()}`,
    riskIndicators,
    verificationsNeeded,
    reasoning,
    riskLevel
  };
}
