/**
 * DATOS DE PRUEBA UNIFICADOS (Frontend)
 * IMPORTANTE: Deben coincidir con backend/src/constants.js
 */

// ========================================
// SIM REAL (MasOrange - España)
// ========================================
export const TEST_USER = {
  phone: "+34640033282",
  firstName: "JOHN",
  lastName: "OPENTEST",
  birthDate: "1976-04-16",
  age: 49,
};

// Para usar número de prueba Nokia, comenta lo de arriba y descomenta esto:
// export const TEST_USER = {
//   phone: "+99999991000",
//   firstName: "Federica",
//   lastName: "Sanchez Arjona",
//   birthDate: "1978-08-22",
//   age: 47,
// };

/**
 * ESCENARIOS DE DEMO para botones de simulación
 */
export const DEMO_SCENARIOS = {
  SAFE: {
    label: "✅ Usuario Seguro",
    scenario: "safe",
    description: "Todas las verificaciones OK",
  },
  SIM_SWAP: {
    label: "⚠️ SIM Swap Detectado",
    scenario: "simswap",
    description: "Fraude de intercambio de SIM",
  },
  KYC_FAIL: {
    label: "⚠️ KYC No Coincide",
    scenario: "kyc",
    description: "Identidad no verificada",
  },
  MAXIMUM_RISK: {
    label: "🔴 Máximo Riesgo",
    scenario: "maximum",
    description: "Múltiples señales de fraude",
  },
};
