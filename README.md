# 🛡️ Guardian MVP - Telecom Fraud Protection for Elderly

**Open Gateway Hackathon 2026 - Barcelona (Talent Arena)**

Sistema de protección de identidad telecom para personas de tercera edad usando **Nokia Network as Code APIs** + **MCP (Model Context Protocol)** + **IA Gemini**.

---

## 🎯 Concepto

María (75 años) intenta hacer una transferencia bancaria de 5000€.  
→ Sistema verifica **automáticamente** si es seguro (sin intervención manual)  
→ **MCP invisible** analiza señales de fraude  
→ Decisión: ✅ Permitir o ❌ Bloquear + explicación en lenguaje simple

**NO es un chatbot** - Es un motor de seguridad automático invisible para el usuario.

---

## 🏗️ Arquitectura

```
USUARIO INTENTA OPERACIÓN SENSIBLE
          ↓
┌─────────────────────────────────┐
│  Frontend (Automático)          │
│  POST /guardian/check           │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Backend                        │
│  1. Llamar APIs Nokia:          │
│     - SIM Swap Check            │
│     - KYC Match                 │
│  2. Calcular Trust Score        │
│  3. SI score < 50:              │
│     → MCP EJECUTA TOOL          │
│       (Motor invisible)         │
│     → IA genera explicación     │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Respuesta al Usuario           │
│                                 │
│  ✅ "Operación segura"          │
│                                 │
│  O                              │
│                                 │
│  ❌ "Operación bloqueada"       │
│     [Explicación IA simple]     │
│     "Contacta con familiar"     │
└─────────────────────────────────┘
```

---

## 📊 Trust Score

| Signal | Weight | Fuente |
|--------|--------|--------|
| **SIM Swap Reciente** | -60 puntos | Nokia SIM Swap API |
| **KYC No Coincide** | -30 puntos | Nokia KYC Match API |

**Estados**:
- `>= 75` → **NORMAL** (operación permitida)
- `50-74` → **WARNING** (advertencia)
- `< 50` → **PROTECTION_MODE** (operación bloqueada, MCP activado)

---

## 🧠 MCP (Motor Invisible)

El **Model Context Protocol** NO es un chatbot visible.

**Cómo funciona**:
1. Backend detecta `score < 50`
2. MCP ejecuta tool: `calculate_guardian_risk`
3. Tool llama APIs Nokia autonomamente
4. MCP recibe datos estructurados
5. IA Gemini genera explicación contextual
6. Usuario solo ve: ❌ Bloqueado + Explicación

**El usuario NO escribe nada**. Todo es automático.

---

## 🔌 APIs Nokia Usadas

- ✅ **SIM Swap** (`/sim-swap/v0/check`)
- ✅ **KYC Match** (`/kyc-match/v0.3/match`)

---

## 📁 Estructura del Proyecto

```
guardian-mvp/
├── backend/
│   ├── src/
│   │   ├── constants.js          ← Datos unificados (TEST_USER)
│   │   ├── mcpBridge.js           ← Conexión con MCP server
│   │   ├── mcpServer.js           ← MCP tool: calculate_guardian_risk
│   │   ├── routes/
│   │   │   └── guardian.js        ← Endpoints: /check, /simulate, /history
│   │   └── services/
│   │       ├── nokiaService.js    ← APIs Nokia
│   │       ├── trustScoreService.js
│   │       └── aiService.js       ← IA Gemini (explicaciones)
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── constants.js           ← Mismos datos que backend
│   │   ├── App.jsx                ← UI simple (sin chat)
│   │   └── index.css
│
└── README.md
```

---

## 🚀 Endpoints API

### 1. **POST `/guardian/check`** (Principal)

Verificación real con APIs Nokia.

```json
// Request
{
  "phone": "+99999991000",
  "firstName": "Federica",
  "lastName": "Sanchez Arjona",
  "birthDate": "1978-08-22"
}

// Response
{
  "trustScore": 40,
  "status": "PROTECTION_MODE",
  "actionAllowed": false,
  "explanation": "IA explanation...",
  "metadata": {
    "mode": "LIVE",
    "mcpUsed": true  ← MCP se ejecutó invisiblemente
  }
}
```

---

### 2. **POST `/guardian/simulate`** (Demo)

Simulaciones para presentación sin llamar APIs.

**Opciones**:
```json
{ "scenario": "safe" }        // ✅ Usuario seguro (score 100)
{ "scenario": "simswap" }     // ⚠️ SIM Swap (score 40, bloqueado)
{ "scenario": "kyc" }         // ⚠️ KYC fail (score 70, warning)
{ "scenario": "maximum" }     // 🔴 Ambos (score 10, bloqueado)
```

---

### 3. **GET `/guardian/history`**

Lista de verificaciones anteriores.

---

## 💻 Instalación

### Backend
```bash
cd backend
npm install
# Configurar .env con tus keys Nokia + Gemini
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Datos de Prueba Unificados

**Consistentes en todo el sistema** ([constants.js](backend/src/constants.js)):

```javascript
{
  phone: "+99999991000",
  firstName: "Federica",
  lastName: "Sanchez Arjona",
  birthDate: "1978-08-22"
}
```

---

## 🎬 Demo para Pitch

**Escenario**: Mostrar al jurado que el sistema bloquea fraude automáticamente.

1. **Usuario seguro**:  
   Click "✅ Usuario Seguro" → Score 100 → Operación permitida

2. **SIM Swap detectado**:  
   Click "⚠️ SIM Swap Detectado" → Score 40 → **BLOQUEADO** + Explicación IA

3. **Máximo riesgo**:  
   Click "🔴 Máximo Riesgo" → Score 10 → **PROTECCIÓN ACTIVADA**

**Mensaje final**:  
> "Esto protege a personas mayores de fraudes sin que necesiten saber de tecnología. El sistema decide por ellos."

---

## 🏆 Diferenciadores para Hackathon

✅ **MCP como motor invisible** (no chatbot)  
✅ **Protección automática** (sin input manual)  
✅ **Enfoque tercera edad** (UX simple)  
✅ **APIs Nokia reales** (SIM Swap + KYC)  
✅ **IA contextual** (explicaciones personalizadas)  
✅ **Demo estable** (simulaciones controladas)

---

## 📝 Configuración .env

```bash
# Nokia APIs
USE_LIVE_NOKIA=true
RAPIDAPI_KEY=tu_key_nokia
RAPIDAPI_HOST=network-as-code.nokia.rapidapi.com

# IA
GEMINI_API_KEY=tu_key_gemini

# Database (opcional para hackathon)
DATABASE_URL=postgresql://...
```

---

## 🎓 Equipo & Contexto

**Hackathon**: Open Gateway Hackathon 2026 - Barcelona  
**Fecha**: [Tu fecha]  
**Stack**: Node.js, React, Nokia NaC, MCP, IA Gemini

---

## 📌 Próximos Pasos (Post-Hackathon)

- [ ] Agregar Location Verification API
- [ ] Integrar notificaciones al familiar/tutor
- [ ] Dashboard para tutores legales
- [ ] Modo emergencia SMS
- [ ] Testear con usuarios reales de tercera edad



