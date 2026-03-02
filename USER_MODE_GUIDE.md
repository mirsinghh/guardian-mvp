# 🎯 User Mode - Eventos Sensibles

## ✅ Implementación Completada

### 📱 **4 Botones de Casos de Uso Sensibles**

Ahora el **User Mode** presenta 4 acciones sensibles que un usuario real (como María, 74 años) enfrentaría:

1. **📨 Suspicious SMS**
   - Icono: `MessageSquare`
   - Caso: "Recibí SMS del banco solicitando acción"
   - Color: Azul

2. **💳 Bank Transfer**
   - Icono: `CreditCard`
   - Caso: "Realizar transferencia bancaria grande"
   - Color: Verde

3. **🔒 Change Password**
   - Icono: `Lock`
   - Caso: "Actualizar contraseña o datos sensibles"
   - Color: Morado

4. **📍 New Location Access**
   - Icono: `MapPin`
   - Caso: "Acceder desde ubicación desconocida"
   - Color: Ámbar

---

## 🎬 Flujo de Usuario

### **Paso 1: Seleccionar Acción**
```
Usuario ve 4 cards con casos de uso
→ Click en "Suspicious SMS"
→ Sistema muestra loader
```

### **Paso 2: MCP Decide**
```
Backend recibe petición
→ MCP evalúa si es evento sensible (siempre TRUE en estos casos)
→ Ejecuta: SIM Swap + KYC Match
→ Calcula Trust Score
→ Si score < 50 → MCP genera explicación contextual con IA
```

### **Paso 3: Resultado Visual**
```
Trust Score mostrado con escala de colores
→ Verde (75-100): "All good. You can continue"
→ Ámbar (50-74): "Please review before continuing"
→ Rojo (0-49): "High risk. Do NOT continue"
```

---

## 🧠 MCP en Acción

### **Lo que hace el MCP (invisible para el usuario)**

1. **Detecta evento sensible** → Siempre activo en estos 4 casos
2. **Decide qué APIs ejecutar** → SIM Swap + KYC Match
3. **Calcula riesgo** → Trust Score automático
4. **Si score < 50** → Activa protección + explicación IA
5. **Responde al usuario** → Bloquea o permite acción

### **Lo que NO es el MCP**

❌ No es un chatbot  
❌ No lee SMS  
❌ No analiza contenido  
❌ No es visible para el usuario

✅ Es un **motor de decisión inteligente**  
✅ Usa señales telecom reales  
✅ Actúa **antes** del fraude  
✅ Es **invisible** y automático

---

## 📊 Arquitectura Implementada

```
┌─────────────────────────────────────────────────┐
│ USER MODE (Frontend)                            │
│                                                 │
│  [SMS Sospechoso]  [Transferencia]             │
│  [Cambio Password]  [Nueva Ubicación]          │
│                                                 │
│         ↓ Usuario hace click                   │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│ MCP (Backend Invisible)                         │
│                                                 │
│  1. Detecta evento sensible                    │
│  2. Decide: ¿Necesito verificar red?           │
│  3. Ejecuta: Nokia APIs (SIM Swap + KYC)       │
│  4. Calcula: Trust Score                        │
│  5. Si score < 50 → Generar explicación IA     │
│                                                 │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│ Nokia APIs + Gemini IA                          │
│                                                 │
│  • SIM Swap API v0                              │
│  • KYC Match API v0.3                           │
│  • Gemini Flash (explicación en español)        │
│                                                 │
└─────────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│ RESULTADO VISUAL                                │
│                                                 │
│  Trust Score: 40/100 ⚠️                         │
│  Status: HIGH RISK                              │
│  Action: BLOCKED                                │
│  Explanation: "Se detectó cambio reciente..."  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎨 UI Implementada

### **Pantalla Inicial (Sin verificación)**
- **Header**: "Guardian Protection" con icono ShieldCheck
- **Subtítulo**: "Protect yourself before performing sensitive actions"
- **Grid 2x2**: 4 cards con iconos, títulos y descripciones
- **Footer**: "We'll verify your identity using telecom signals"

### **Pantalla de Resultado**
- **Context Badge**: Muestra qué acción se verificó
- **Trust Score**: Número grande (96-110px) + icono de alerta si score < 50
- **Status Badge**: Verde/Ámbar/Rojo con mensaje contextual
- **Progress Bar**: Gradiente animado según score
- **AI Explanation**: Card morado/rosa con icono lightning + badge "(MCP Enhanced)"
- **Action Button**: "Check Another Action" para volver al inicio

---

## 🔄 Siguiente Paso: Integración Completa

### **¿Qué falta?**

1. **Backend debe reconocer el tipo de acción**
   - Actualmente `checkGuardian()` envía solo datos de usuario
   - Falta enviar: `actionType: "sms" | "transfer" | "password" | "location"`

2. **MCP debe adaptar decisiones según acción**
   - Ejemplo: "sms" → Mayor peso a SIM Swap
   - Ejemplo: "transfer" → Mayor peso a KYC Match
   - Ejemplo: "password" → Verificar ambos igual

3. **Explicación IA contextualizada**
   - Gemini debe recibir: `actionType` + `userContext`
   - Respuesta adaptada: "Detectamos riesgo al intentar {acción específica}"

---

## 🚀 Implementación Backend (Próximo Paso)

### **Modificar `/check` endpoint**

```javascript
router.post("/check", async (req, res) => {
  const { phone, firstName, lastName, birthDate, actionType } = req.body;
  
  console.log(`🔍 Guardian Check for ${actionType || "generic"} action: ${phone}`);
  
  // ... resto del código
  
  // Pasar actionType a MCP
  const mcpResult = await runMcpTool({
    phone,
    firstName,
    lastName,
    birthDate,
    actionType // 👈 NUEVO
  });
  
  // Generar explicación contextualizada
  explanation = await generateExplanation({
    simSwap: mcpResult.simSwap,
    kycMatch: mcpResult.kycMatch,
    score: mcpResult.score,
    status: mcpResult.status,
    riskFactors: mcpResult.riskFactors,
    context: "elderly_protection",
    actionType // 👈 NUEVO - Para mensajes específicos
  });
});
```

### **Adaptar prompts de Gemini**

```javascript
// aiService.js
export async function generateExplanation(data) {
  const actionContext = {
    sms: "al intentar responder a un SMS sospechoso",
    transfer: "al intentar realizar una transferencia bancaria",
    password: "al intentar cambiar su contraseña",
    location: "al intentar acceder desde una nueva ubicación"
  };
  
  const contextMessage = actionContext[data.actionType] || "al realizar una acción sensible";
  
  const prompt = `
    Explica en español simple para persona mayor que ${contextMessage}, 
    encontramos estos indicadores:
    - SIM Swap: ${data.simSwap ? "Detectado" : "No detectado"}
    - KYC Match: ${data.kycMatch ? "Coincide" : "No coincide"}
    - Trust Score: ${data.score}/100
    
    ${data.score < 50 ? "IMPORTANTE: Recomienda NO continuar y contactar soporte." : ""}
  `;
  
  // ... resto del código
}
```

---

## 📋 Checklist de Implementación

### ✅ **Completado**
- [x] User Mode UI con 4 botones de casos de uso
- [x] Iconos lucide-react sin emojis
- [x] Estado `actionType` en frontend
- [x] Loader animado durante verificación
- [x] Resultado visual con scores coloreados
- [x] Progress bar animado
- [x] Context badge mostrando acción verificada
- [x] AI Explanation card con badge MCP Enhanced

### 🔲 **Pendiente**
- [ ] Modificar `/check` endpoint para recibir `actionType`
- [ ] Actualizar `checkGuardian()` para enviar `actionType` al backend
- [ ] Adaptar prompts de Gemini según tipo de acción
- [ ] MCP ajusta pesos de APIs según acción (opcional)
- [ ] Tests de cada caso de uso con SIM real de MasOrange

---

## 🎬 Demo para Hackathon

### **Guión de Presentación**

**Slide 1: Problema**
> "María, 74 años, recibe SMS del banco pidiendo confirmar datos."

**Slide 2: Solución (LIVE USER MODE)**
> "Antes de hacer click, María usa Guardian."
> *[Mostrar pantalla con 4 botones]*
> *[Click en "Suspicious SMS"]*

**Slide 3: Tecnología**
> "Guardian activa MCP invisible que verifica señales telecom reales."
> *[Mostrar loading spinner]*

**Slide 4: Resultado**
> "Trust Score: 40/100 → BLOQUEADO"
> *[Mostrar pantalla de resultado rojo]*
> "PROTECTION MODE activado. Explicación simple por IA."

**Slide 5: Valor**
> "No es chatbot. Es motor de decisión inteligente."
> "Usa señales del operador. Actúa ANTES del fraude."

---

## 🔑 Mensajes Clave para Pitch

1. **MCP no es chatbot** → Es motor de decisión invisible
2. **Protegemos identidad digital** → Con señales telecom reales
3. **Actuamos ANTES del fraude** → No después
4. **Para personas vulnerables** → Ancianos sin conocimientos técnicos
5. **Combinamos IA + Red** → Gemini + Nokia APIs

---

¿Listo para el siguiente paso? Vamos a modificar el backend para recibir `actionType` y adaptar las respuestas de IA. 🚀
