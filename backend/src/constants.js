/**
 * DATOS DE PRUEBA UNIFICADOS
 * Estos datos son consistentes en todo el sistema
 */

// ========================================
// OPCIÓN 1: SIM REAL (MasOrange - España)
// ========================================
export const TEST_USER = {
  phone: "+34640033282",        // Número real (E.164 format)
  firstName: "JOHN",             // Nombre en SIM
  lastName: "OPENTEST",          // Apellido en SIM
  birthDate: "1976-04-16",       // Fecha nacimiento exacta
  age: 49,
  idDocument: "OJAZ00936",       // Documento de identidad
  operator: "MasOrange",
  country: "ES",
  context: "elderly_protection",
};

// ========================================
// OPCIÓN 2: Número de prueba Nokia (sandbox)
// ========================================
// export const TEST_USER = {
//   phone: "+99999991000",
//   firstName: "Federica",
//   lastName: "Sanchez Arjona",
//   birthDate: "1978-08-22",
//   age: 47,
//   context: "elderly_protection",
// };

/**
 * IMPORTANTE: Con SIM real, las APIs Nokia funcionarán SOLO si:
 * 1. El dispositivo con esta SIM está conectado a red MasOrange
 * 2. Number Verification requiere que la llamada venga desde ese dispositivo
 * 3. SIM Swap y KYC deberían funcionar desde cualquier IP
 */

/**
 * ESCENARIOS DE SIMULACIÓN PARA DEMO
 */
export const DEMO_SCENARIOS = {
  // Escenario 1: Todo OK - Usuario seguro
  SAFE_USER: {
    name: "Usuario Seguro",
    simSwap: false,
    kycMatch: true,
    expectedScore: 100,
    expectedStatus: "NORMAL",
  },

  // Escenario 2: SIM Swap detectado - ALTO RIESGO
  SIM_SWAP_DETECTED: {
    name: "SIM Swap Detectado",
    simSwap: true,
    kycMatch: true,
    expectedScore: 40,
    expectedStatus: "PROTECTION_MODE",
  },

  // Escenario 3: KYC no coincide - RIESGO MEDIO
  KYC_MISMATCH: {
    name: "KYC No Coincide",
    simSwap: false,
    kycMatch: false,
    expectedScore: 70,
    expectedStatus: "WARNING",
  },

  // Escenario 4: MÁXIMO RIESGO - ambos fallan
  MAXIMUM_RISK: {
    name: "Máximo Riesgo",
    simSwap: true,
    kycMatch: false,
    expectedScore: 10,
    expectedStatus: "PROTECTION_MODE",
  },
};

/**
 * UMBRALES DE TRUST SCORE
 */
export const THRESHOLDS = {
  PROTECTION_MODE: 50, // < 50 = Bloquear operación
  WARNING: 75,         // < 75 = Advertencia
  NORMAL: 100,         // >= 75 = OK
};
