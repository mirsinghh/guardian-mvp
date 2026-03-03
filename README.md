# 🛡️ Guardian MVP - Telecom Fraud Protection for Elderly

**Open Gateway Hackathon 2026 - Barcelona (Talent Arena)**

Sistema de protección de identidad telecom para personas de tercera edad usando **Nokia Network as Code APIs** + **MCP (Model Context Protocol)** + **IA Gemini**.

---

## 🎯 Concepto

JOHN OPENTEST recibe un SMS sospechoso de su "banco" pidiendo clic urgente.  
→ Sistema **genera** contenido contextual aleatorio para simular el escenario  
→ **MCP inteligente** analiza el contenido y detecta indicadores de riesgo  
→ Decide **qué APIs ejecutar** según el nivel de riesgo (eficiencia)  
→ Calcula Trust Score y genera explicación en lenguaje simple  
→ Decisión: ✅ Permitir o ❌ Bloquear con explicación contextual

**NO es un chatbot** - Es un **motor de inteligencia automático** que genera escenarios, analiza patrones de fraude y ejecuta verificaciones solo cuando es necesario.

---

## 🏗️ Arquitectura MCP Inteligente

```
USUARIO SELECCIONA ACCIÓN SENSIBLE (SMS / Transfer / Password / Location)
          ↓
┌────────────────────────────────────────────────────────┐
│  Frontend - Modo Simulación                            │
│  ○ Safe (Legítimo)  ● Fraudulent (Sospechoso)         │
│  POST /guardian/mcp-check                              │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  Backend - Proceso MCP Inteligente (5 Pasos)          │
│                                                        │
│  【1】 GENERAR CONTENIDO CONTEXTUAL                    │
│       generateRandomAction(actionType, isFraudulent)   │
│       → SMS real de BD / Transfer / Password / Location│
│                                                        │
│  【2】 ANÁLISIS MCP INTELIGENTE                        │
│       analyzeAndDecide(content)                        │
│       → Detecta 15+ indicadores de riesgo             │
│       → Decide: ¿Qué APIs ejecutar?                   │
│         • Alto riesgo → SIM_SWAP + KYC                │
│         • Medio riesgo → SIM_SWAP o KYC               │
│         • Bajo riesgo → NINGUNA (eficiencia)          │
│                                                        │
│  【3】 EJECUTAR VERIFICACIONES (solo si necesario)     │
│       Nokia SIM Swap API + KYC Match API              │
│                                                        │
│  【4】 CALCULAR TRUST SCORE                            │
│       calculateTrustScore(simSwap, kycMatch)          │
│                                                        │
│  【5】 GENERAR EXPLICACIÓN AI (si score < 75)          │
│       Gemini API → Explicación en español simple      │
│                                                        │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  Respuesta Visualizada (5 Pasos Progresivos)          │
│                                                        │
│  1️⃣ SMS: "¡URGENTE! Haga clic aquí..."                │
│  2️⃣ MCP: 🔴 Alto Riesgo → SIM_SWAP + KYC              │
│  3️⃣ Verificaciones: ⚠️ SIM Swap detectado             │
│  4️⃣ Trust Score: 40/100 → PROTECTION_MODE             │
│  5️⃣ Explicación IA para María (75 años)               │
│                                                        │
│  ❌ OPERACIÓN BLOQUEADA                                │
└────────────────────────────────────────────────────────┘
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

## 🧠 MCP Motor Inteligente de Decisión

El **Model Context Protocol** funciona como un motor de inteligencia que:

### 🎲 Generación de Contenido Contextual
```javascript
generateRandomAction(actionType, isFraudulent)
```
- **SMS**: Usa datos reales de BD (studio_results.json) con fraude/legítimo
- **Transfer**: Genera transferencias con destinatarios/montos/IBANs sospechosos o legítimos
- **Password**: Simula cambios desde dominios oficiales vs phishing
- **Location**: Simula accesos desde ubicaciones normales vs alto riesgo

### 🔍 Análisis Inteligente (15+ Indicadores)
```javascript
analyzeAndDecide(content)
```

**Detecta automáticamente**:
- 🔗 URLs sospechosas (HTTP, dominios extraños)
- ⚡ Lenguaje de urgencia ("urgente", "inmediatamente", "bloqueado")
- 🔐 Solicitud de datos sensibles (contraseñas, PINs, tarjetas)
- 🎁 Premios/sorteos falsos
- 💰 Montos elevados (>200€)
- 🏦 IBANs sospechosos
- 📞 Destinatarios desconocidos
- 🌍 Ubicaciones de alto riesgo
- 📱 Dispositivos desconocidos
- 🔒 Dominios no oficiales

### ⚙️ Decisión Inteligente de APIs

**El sistema decide qué verificar según riesgo**:

| Riesgo | APIs a Ejecutar | Eficiencia |
|--------|----------------|-----------|
| 🟢 **Bajo** | Ninguna | ✅ Sin llamadas API (ahorro de costos) |
| 🟡 **Medio** | SIM_SWAP o KYC | ⚡ 1 llamada API |
| 🔴 **Alto** | SIM_SWAP + KYC | 🔒 Verificación completa |

**Ventaja**: No ejecuta APIs innecesarias para contenido claramente legítimo.

### 🎯 Flujo Completo

```
Contenido Generado
      ↓
MCP Analiza → Detecta Indicadores → Calcula Riesgo
      ↓
Decide: ¿Qué APIs ejecutar?
      ↓
Ejecuta solo las necesarias
      ↓
Trust Score + Explicación IA
```

**El usuario ve todo el proceso en 5 pasos visualizados progresivamente**.

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
│   │   ├── constants.js          ← Datos unificados (SIM_USER_DETAILS)
│   │   ├── db.js                 ← Conexión Google Cloud SQL
│   │   ├── routes/
│   │   │   └── guardian.js       ← Endpoints: /check, /simulate, /mcp-check, /history
│   │   └── services/
│   │       ├── nokiaService.js   ← APIs Nokia (SIM Swap + KYC)
│   │       ├── trustScoreService.js ← Cálculo de Trust Score
│   │       └── aiService.js      ← 【MCP ENGINE】
│   │           ├── generateRandomAction()   ← Genera contenido contextual
│   │           ├── analyzeAndDecide()       ← MCP análisis inteligente
│   │           └── generateExplanation()    ← IA Gemini explicaciones
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── constants.js          ← Mismos datos que backend
│   │   ├── App.jsx               ← UI con visualización MCP de 5 pasos
│   │   └── index.css             ← Tailwind + animaciones
│   └── vite.config.js
│
├── studio_results_20260303_1021.json  ← BD de SMS reales (fraude/legítimo)
└── README.md
```

---

## 🚀 Endpoints API

### 1. **POST `/guardian/mcp-check`** (⭐ Principal - MCP Inteligente)

Flujo completo MCP: Genera contenido → Analiza → Decide APIs → Verifica → Score

```json
// Request
{
  "phone": "640033282",
  "firstName": "JOHN",
  "lastName": "OPENTEST",
  "birthDate": "1976-04-16",
  "actionType": "sms",          // "sms" | "transfer" | "password" | "location"
  "isFraudulent": true          // true = escenario fraudulento, false = legítimo
}

// Response
{
  "action": {
    "content": "¡URGENTE! Su cuenta ha sido bloqueada. Haga clic aquí...",
    "actionType": "sms",
    "isFraudulent": true
  },
  "mcpAnalysis": {
    "riskLevel": "high",
    "riskIndicators": ["URL_SOSPECHOSA", "LENGUAJE_URGENTE"],
    "verificationsNeeded": ["SIM_SWAP", "KYC"],
    "reasoning": "URL sospechosa y lenguaje de urgencia detectados."
  },
  "verifications": {
    "simSwap": false,
    "kycMatch": true
  },
  "trustScore": 70,
  "status": "WARNING",
  "explanation": "...",
  "steps": [
    { "step": 1, "name": "Generando contenido contextual", "status": "completed", "result": {...} },
    { "step": 2, "name": "MCP analizando contenido", "status": "completed", "result": {...} },
    { "step": 3, "name": "Ejecutando verificaciones: SIM_SWAP, KYC", "status": "completed", "result": {...} },
    { "step": 4, "name": "Calculando Trust Score", "status": "completed", "result": {...} },
    { "step": 5, "name": "Generando explicación AI", "status": "completed", "result": {...} }
  ]
}
```

**Tipos de Acción**:
- 📱 **SMS**: Genera SMS fraudulentos/legítimos desde BD real
- 💳 **Transfer**: Transferencias con destinatarios/montos/IBANs sospechosos
- 🔐 **Password**: Cambios desde dominios oficiales vs phishing
- 📍 **Location**: Accesos desde ubicaciones normales vs alto riesgo

---

### 2. **POST `/guardian/check`** (Verificación Directa)

Verificación real con APIs Nokia (sin generación MCP).

```json
// Request
{
  "phone": "640033282",
  "firstName": "JOHN",
  "lastName": "OPENTEST",
  "birthDate": "1976-04-16",
  "actionType": "transfer"
}

// Response
{
  "trustScore": 100,
  "status": "NORMAL",
  "actionAllowed": true,
  "explanation": "...",
  "sim": { "recentSwap": false },
  "kyc": { "match": true }
}
```

---

### 3. **POST `/guardian/simulate`** (Demo Escenarios)

Simulaciones predefinidas para presentación sin llamar APIs.

**Opciones**:
```json
{ "scenario": "safe" }        // ✅ Usuario seguro (score 100)
{ "scenario": "simswap" }     // ⚠️ SIM Swap (score 40, bloqueado)
{ "scenario": "kyc" }         // ⚠️ KYC fail (score 70, warning)
{ "scenario": "maximum" }     // 🔴 Ambos (score 10, bloqueado)
```

---

### 4. **POST `/guardian/generate-action`** (Test Generación)

Prueba solo la generación de contenido (sin verificaciones).

```json
// Request
{
  "actionType": "sms",
  "isFraudulent": true
}

// Response
{
  "content": "¡URGENTE! Su cuenta ha sido bloqueada...",
  "actionType": "sms",
  "isFraudulent": true,
  "details": { "source": "studio_results" }
}
```

---

### 5. **GET `/guardian/history`**

Lista de verificaciones anteriores.

---

## 💻 Instalación y Uso

### Requisitos Previos
- Node.js 18+
- NPM o Yarn
- Cuenta Nokia RapidAPI (para APIs reales)
- API Key de Google Gemini (para explicaciones IA)
- Google Cloud SQL (PostgreSQL) - Opcional

### Backend
```bash
cd backend
npm install

# Configurar .env (ver sección de configuración abajo)
npm run dev  # Puerto 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Puerto 5174
```

### Probar MCP Inteligente

#### Desde la UI (Recomendado)
1. Abrir `http://localhost:5174`
2. Seleccionar modo: **Safe** o **Fraudulent**
3. Click en cualquier acción sensible (SMS, Transfer, Password, Location)
4. Ver los 5 pasos del proceso MCP en tiempo real
5. Click en **▲** para colapsar/expandir detalles

#### Desde cURL (Backend directo)

**Test SMS fraudulento**:
```bash
curl -X POST http://localhost:8080/guardian/mcp-check \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "640033282",
    "firstName": "JOHN",
    "lastName": "OPENTEST",
    "birthDate": "1976-04-16",
    "actionType": "sms",
    "isFraudulent": true
  }'
```

**Test Transfer legítimo**:
```bash
curl -X POST http://localhost:8080/guardian/mcp-check \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "640033282",
    "firstName": "JOHN",
    "lastName": "OPENTEST",
    "birthDate": "1976-04-16",
    "actionType": "transfer",
    "isFraudulent": false
  }'
```

**Test Password phishing**:
```bash
curl -X POST http://localhost:8080/guardian/mcp-check \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "640033282",
    "firstName": "JOHN",
    "lastName": "OPENTEST",
    "birthDate": "1976-04-16",
    "actionType": "password",
    "isFraudulent": true
  }'
```

**Resultado esperado**: JSON con action, mcpAnalysis, verifications, trustScore, steps[]

---

## 🎯 Datos de Prueba Unificados

**Consistentes en todo el sistema** ([constants.js](backend/src/constants.js)):

```javascript
const SIM_USER_DETAILS = {
  simNumber: "640033282",
  idDocument: "OJAZ00936",
  name: "JOHN OPENTEST",
  givenName: "JOHN",
  familyName: "OPENTEST",
  birthdate: "1976-04-16",
  email: "roberto.garcia@masorange.es",
  phone: "640033282"
};
```

---

## 🎬 Demo para Pitch

**Escenario**: Mostrar al jurado el MCP inteligente en acción.

### Interfaz con Control Segmentado

```
┌─────────────────────────────────────┐
│  ○ Safe Mode    ● Fraudulent Mode  │  ← Toggle de simulación
└─────────────────────────────────────┘
```

### 4 Tipos de Acciones Sensibles:

1. **📱 Suspicious SMS**  
   Click → MCP genera SMS fraudulento/legítimo → Analiza → Decide APIs → Resultado

2. **💳 Bank Transfer**  
   Click → Genera transferencia → Detecta destinatario/monto sospechoso → Verifica

3. **🔐 Change Password**  
   Click → Simula cambio desde dominio oficial/phishing → Analiza → Decide

4. **📍 New Location Access**  
   Click → Genera acceso desde ubicación normal/alto riesgo → Verifica

### Visualización de 5 Pasos Progresivos:

```
MCP Intelligent Process (5 steps) ▲

1️⃣ Generando contenido contextual
   SMS: "¡URGENTE! Su cuenta ha sido bloqueada..."

2️⃣ MCP analizando contenido
   Risk Level: HIGH
   Indicators: URL_SOSPECHOSA, LENGUAJE_URGENTE
   Verifications: SIM_SWAP, KYC

3️⃣ Ejecutando verificaciones: SIM_SWAP, KYC
   SIM Swap: ⚠️ Detectado | KYC: ✅ OK

4️⃣ Calculando Trust Score
   Trust Score: 40/100 → PROTECTION_MODE

5️⃣ Generando explicación AI
   "Se detectó un cambio reciente de tarjeta SIM..."
```

### Resultado Final:

```
┌──────────────────────────────────────────┐
│           🛡️ 40                          │
│         Trust Score                      │
│      High Risk - Protection Mode         │
│                                          │
│  ❌ OPERACIÓN BLOQUEADA                  │
│                                          │
│  Tu tarjeta SIM cambió hace 2 días.     │
│  Esto puede ser un intento de fraude.   │
│  No hagas esta operación.                │
│  Contacta con tu banco por teléfono.     │
└──────────────────────────────────────────┘
```

**Mensaje para jurado**:  
> "El sistema MCP no solo verifica, sino que **genera escenarios realistas**, **analiza inteligentemente** el contenido, y **decide qué verificar** para maximizar eficiencia. Todo visualizado en tiempo real para que María (75 años) entienda qué está pasando."

---

## 🏆 Diferenciadores para Hackathon

✅ **MCP como motor inteligente de decisión** (no solo verificación pasiva)  
✅ **Generación de contenido contextual** (SMS reales, transferencias, passwords, ubicaciones)  
✅ **Análisis inteligente con 15+ indicadores** (URLs, urgencia, montos, ubicaciones, etc.)  
✅ **Ejecución eficiente de APIs** (solo llama APIs cuando es necesario según riesgo)  
✅ **Visualización progresiva del proceso** (usuario ve 5 pasos en tiempo real)  
✅ **Simulación dual** (modo seguro vs fraudulento con toggle)  
✅ **Enfoque tercera edad** (UX compacto, iconos profesionales, explicaciones simples)  
✅ **APIs Nokia reales** (SIM Swap + KYC con fallback demo)  
✅ **IA contextual Gemini** (explicaciones personalizadas según tipo de acción)  
✅ **Base de datos real de SMS** (studio_results.json con casos reales de fraude)  
✅ **Demo estable y visual** (muestra inteligencia en acción, no solo resultados)

---
## 📊 Base de Datos de SMS Reales

El sistema usa `studio_results_20260303_1021.json` con SMS clasificados:

```json
[
  {
    "valor": "¡URGENTE! Su cuenta ha sido bloqueada. Haga clic aquí...",
    "flag": "0"  // ← 0 = Fraude
  },
  {
    "valor": "Su código de verificación es: 482913. No lo comparta.",
    "flag": "1"  // ← 1 = Legítimo
  }
]
```

**Funcionamiento**:
- `generateRandomAction("sms", true)` → Selecciona SMS con `flag: "0"` (fraude)
- `generateRandomAction("sms", false)` → Selecciona SMS con `flag: "1"` (legítimo)
- El contenido real hace que el análisis MCP sea más preciso y realista

---
## 🎨 Interfaz de Usuario

### Control Segmentado de Simulación

```jsx
┌──────────────────────────────────────┐
│  ✓ Safe Mode    Fraudulent Mode     │  ← Modo Safe (legítimo)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Safe Mode    ⚠ Fraudulent Mode     │  ← Modo Fraudulent (sospechoso)
└──────────────────────────────────────┘
```

### 4 Tarjetas de Acciones Sensibles

```
┌─────────────────────┐  ┌─────────────────────┐
│  📱 Suspicious SMS  │  │  💳 Bank Transfer   │
│  Received SMS from  │  │  Make a large bank  │
│  my bank...         │  │  transfer           │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│  🔐 Change Password │  │  📍 New Location    │
│  Update account     │  │  Access account     │
│  password...        │  │  from unfamiliar... │
└─────────────────────┘  └─────────────────────┘
```

### Visualización MCP (Colapsable)

```
┌─────────────────────────────────────────────────┐
│  ● MCP Intelligent Process (5 steps) ▲         │
├─────────────────────────────────────────────────┤
│  1 Generando contenido contextual         ✓    │
│    SMS: "¡URGENTE! Su cuenta ha sido..."       │
│                                                 │
│  2 MCP analizando contenido               ✓    │
│    Risk Level: HIGH                             │
│    Indicators: URL_SOSPECHOSA, LENGUAJE_URGENTE│
│    Verifications: SIM_SWAP, KYC                 │
│                                                 │
│  3 Ejecutando verificaciones: SIM_SWAP, KYC ✓  │
│    SIM Swap: ⚠️ Detectado | KYC: ✅ OK          │
│                                                 │
│  4 Calculando Trust Score                  ✓    │
│    Trust Score: 40/100 → PROTECTION_MODE        │
│                                                 │
│  5 Generando explicación AI                ✓    │
└─────────────────────────────────────────────────┘
```

### Tarjeta de Resultado Compacta

```
┌───────────────────────────────────────────┐
│           🛡️ 40                           │
│         Trust Score                       │
│    High Risk - Protection Mode            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ← Barra 40%
│                                           │
│  ⛔ High risk detected. Do NOT continue.  │
│     Your identity may be compromised.     │
│     Contact support.                      │
│                                           │
│  💡 AI Explanation                        │
│     Se detectó un cambio reciente de      │
│     tarjeta SIM vinculada a tu número...  │
│                                           │
│  [ ↻ Check Another Action ]               │
└───────────────────────────────────────────┘
```

**Características UX**:
- ✅ Diseño compacto (no abrumador para personas mayores)
- ✅ Iconos Lucide React (sin emojis, profesional)
- ✅ Animaciones suaves (fadeIn, transitions)
- ✅ Colores semafóricos (verde/amarillo/rojo)
- ✅ Proceso visible pero colapsable
- ✅ Explicación destacada con icono

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

### Mejoras del Motor MCP
- [ ] Agregar más indicadores de riesgo (patrones de números, horarios sospechosos)
- [ ] Machine Learning para mejorar detección en tiempo real
- [ ] Integrar Nokia Number Verification API
- [ ] Sistema de aprendizaje de patrones de usuario

### Funcionalidades de Protección
- [ ] Notificaciones push al familiar/tutor cuando se detecta riesgo
- [ ] Dashboard para tutores legales con historial de alertas
- [ ] Modo emergencia vía SMS
- [ ] Whitelist de contactos/destinatarios de confianza
- [ ] Bloqueo automático temporal de acciones de alto riesgo

### UX/UI
- [ ] Modo oscuro para accesibilidad
- [ ] Voz AI para lectura de explicaciones (para personas con discapacidad visual)
- [ ] Tamaño de fuente ajustable
- [ ] Modo simplificado (solo semáforo sin detalles técnicos)

### Integración
- [ ] Plugin para apps bancarias
- [ ] Extensión de navegador para detección de phishing
- [ ] API pública para terceros
- [ ] Integración con sistemas de home banking

### Testing
- [ ] Testear con usuarios reales de tercera edad
- [ ] A/B testing de explicaciones IA
- [ ] Validación con organizaciones de protección al consumidor
- [ ] Certificación de seguridad



