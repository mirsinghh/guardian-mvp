# 📱 GUÍA: Usar SIM Real MasOrange

Has configurado el sistema con tu **SIM real de MasOrange (España)**.

---

## 📋 Datos Configurados

```javascript
Número: +34640033282
Nombre: JOHN OPENTEST
Fecha Nac: 1976-04-16
Operador: MasOrange (España)
ID: OJAZ00936
```

---

## ✅ QUÉ FUNCIONARÁ

### 1. **SIM Swap API** ✅
**Estado**: Debería funcionar desde cualquier IP

```bash
Endpoint: /sim-swap/v0/check
Verifica: Si la SIM fue cambiada en las últimas 240 horas
```

**Cómo probar**:
- Click "Check: JOHN" en el dashboard
- El backend llamará automáticamente a Nokia
- Deberías ver: `simSwap: false` (si no has cambiado la SIM recientemente)

---

### 2. **KYC Match API** ✅
**Estado**: Debería funcionar desde cualquier IP

```bash
Endpoint: /kyc-match/v0.3/match
Verifica: Si nombre + apellido + fecha coinciden con lo registrado en MasOrange
```

**Cómo probar**:
- Click "Check: JOHN"
- Si los datos coinciden EXACTAMENTE con lo que MasOrange tiene registrado:
  - `kycMatch: true` ✅
- Si NO coinciden:
  - `kycMatch: false` ❌

**⚠️ IMPORTANTE**: Los datos deben coincidir **exactamente**:
- Nombre: `JOHN` (mayúsculas)
- Apellido: `OPENTEST` (mayúsculas)
- Fecha: `1976-04-16`

---

### 3. **Number Verification API** ❓
**Estado**: Requiere condiciones especiales

**Problema**: Number Verification típicamente requiere que la **llamada API venga desde el dispositivo con esa SIM activa**.

**Opciones**:
- ✅ Funciona si backend corre en el mismo dispositivo con la SIM
- ❌ No funciona si backend corre en tu PC y la SIM está en otro teléfono

---

## 🧪 FLUJO DE PRUEBA

### Prueba 1: Verificación Completa (LIVE)

1. **Asegúrate que el backend esté corriendo**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Verifica que use datos reales** en [constants.js](backend/src/constants.js):
   ```javascript
   export const TEST_USER = {
     phone: "+34640033282",
     firstName: "JOHN",
     lastName: "OPENTEST",
     birthDate: "1976-04-16",
   };
   ```

3. **Click "Check: JOHN"** en el dashboard

4. **Revisa logs del backend**:
   ```bash
   🔍 Guardian Check iniciado para: +34640033282
      SIM Swap: ✅ OK (esperado si no has cambiado SIM)
      KYC Match: ✅ OK (si datos coinciden)
      Trust Score: 100/100 → NORMAL
   ```

---

### Prueba 2: Simulación de SIM Swap (DEMO)

Para demostrar qué pasa si detectamos fraude:

1. **Click "⚠️ SIM Swap Detectado"**
2. El sistema simula que la SIM fue cambiada
3. Resultado:
   ```
   Trust Score: 40
   Status: PROTECTION_MODE
   Explicación IA: "Se detectó un cambio reciente de tarjeta SIM..."
   ```

---

## 🔍 Verificar Resultados

### En el Backend (Terminal)
Busca estos mensajes:

```bash
✅ CASO EXITOSO:
[LIVE API] SIM Swap SUCCESS: { swapped: false }
[LIVE API] KYC Match SUCCESS: { 
  givenNameMatch: 'true',
  familyNameMatch: 'true',
  birthdateMatch: 'true'
}

❌ CASO FALLO:
[LIVE API] KYC Match SUCCESS: {
  givenNameMatch: 'false',    ← Nombre no coincide
  familyNameMatch: 'false',   ← Apellido no coincide
  birthdateMatch: 'false'     ← Fecha no coincide
}
```

### En el Frontend
```
API Mode: LIVE 🟢 (2/2 APIs OK)

Trust Score: 100 / 100

✅ SIM Swap: NO
✅ KYC Match (Overall): YES
   Given Name: ✅ Family Name: ✅ Birthdate: ✅
```

---

## ⚠️ PROBLEMAS COMUNES

### 1. KYC Match devuelve `false`

**Causa**: Los datos no coinciden exactamente con el registro de MasOrange

**Solución**: Verifica que uses EXACTAMENTE:
- Nombre: `JOHN` (no "John" ni "john")
- Apellido: `OPENTEST` (no "Opentest")
- Fecha: `1976-04-16` (formato YYYY-MM-DD)

Si sigue fallando, es posible que MasOrange tenga registrados otros datos.

---

### 2. APIs devuelven timeout

**Causa**: Nokia blocking IP o SIM no activa en red MasOrange

**Solución**:
- Verifica que la SIM esté activa
- Prueba desde otra red/IP
- Contacta mentor Nokia para verificar acceso

---

### 3. Number Verification falla

**Esperado**: Esta API típicamente no funciona desde backend externo

**Alternativa**: Usa simulaciones para la demo del pitch

---

## 🎬 ESTRATEGIA PARA DEMO DEL HACKATHON

**Recomendación**: Combina SIM real + simulaciones

### Parte 1: Mostrar APIs Reales (Impresiona al jurado)
```
"Aquí tengo una SIM real de MasOrange..."
Click "Check: JOHN" 
→ Mostrar console logs con APIs respondiendo
→ "Ven que SIM Swap y KYC funcionan en tiempo real"
```

### Parte 2: Demo de Fraude (Simulación controlada)
```
"Ahora simulamos que un atacante cambió la SIM..."
Click "⚠️ SIM Swap Detectado"
→ Score baja a 40
→ Sistema bloquea operación
→ Explicación IA clara
```

**Mensaje final**:
> "Esto protege a personas mayores automáticamente. Funciona con APIs reales de operadores en producción."

---

## 🔄 Cambiar entre SIM Real y Sandbox

Si quieres volver a usar números de prueba Nokia:

### Backend: [constants.js](backend/src/constants.js)
```javascript
// Comenta SIM real:
// export const TEST_USER = {
//   phone: "+34640033282",
//   ...
// };

// Descomenta sandbox:
export const TEST_USER = {
  phone: "+99999991000",
  firstName: "Federica",
  lastName: "Sanchez Arjona",
  birthDate: "1978-08-22",
};
```

### Frontend: [constants.js](frontend/src/constants.js)
```javascript
// Mismo cambio
```

**Reinicia backend y frontend después del cambio.**

---

## 📊 Resumen

| API | SIM Real | Esperado |
|-----|----------|----------|
| SIM Swap | ✅ Funciona | `swapped: false` |
| KYC Match | ✅ Funciona | `match: true` (si datos coinciden) |
| Number Verification | ❌ Probablemente falla | Solo si backend en dispositivo |
| Location | ❌ Probablemente falla | Requiere SIM activa |

**Para hackathon**: Con 2/4 APIs funcionando es **suficiente** para demostrar el concepto.

---

## 🎯 Checklist Pre-Demo

- [ ] Backend corriendo sin errores
- [ ] Frontend muestra "Check: JOHN"
- [ ] Click "Check: JOHN" → Logs muestran APIs respondiendo
- [ ] Trust Score = 100 (si no hay fraude real)
- [ ] Simulaciones funcionan (4 botones de escenarios)
- [ ] Explicación IA genera texto claro

---

¿Listo para probar? Reinicia backend y frontend, luego haz click en "Check: JOHN" y revisa los logs!
