# Arquitectura Técnica: Implementación de Tiers de Suscripción (Arquitectura Simplificada)

Este documento contiene un análisis técnico profesional basado en la estrategia de suscripciones (Básico, Premium, Enterprise y Trial de 7 días). Atendiendo a la decisión de **obviar el multi-tenancy por ahora**, este plan se adapta a la arquitectura actual de la base de datos para mantener la simplicidad del código y acelerar el desarrollo.

---

## 1. Mantenimiento de la Arquitectura Actual (Sin Multi-tenancy)

Actualmente, Cognify vincula un `Patient`, `Appointment` y `TherapySession` directamente al `doctor_id` (relación 1 a N). Para evitar refactorizaciones profundas y mantener el código simple, **conservaremos este modelo**.

- **Básico y Premium**: Funcionan perfectamente con la estructura actual (1 doctor = 1 cuenta).
- **Enterprise**: Temporalmente, este plan se tratará simplemente como un tier con "Todo Ilimitado" y soporte prioritario para un solo usuario, posponiendo las funcionalidades de roles y pacientes compartidos para una fase futura de mayor madurez del producto.

**Ventaja Principal:** 
No necesitas reescribir ninguna política RLS existente. Las políticas de `auth.uid() = doctor_id` seguirán protegiendo los datos con el mismo nivel de seguridad.

---

## 2. Sistema de Límites Dinámicos (Enforcement Seguro)

El plan Básico introduce límites estrictos: 5 pacientes, 50 citas/mes, 100 notas totales. 
**Regla de oro SaaS:** Nunca confíes en el Frontend para validar límites.

### Estrategia de Control (Backend & Database):
1. **Validación en Server Actions (Next.js):** 
   Antes de hacer un `INSERT` en la tabla `Patient` o `Appointment`, el Server Action cuenta los registros actuales del doctor.
   ```javascript
   // Ejemplo en un Server Action de Next.js
   const { count } = await supabase
     .from('Patient')
     .select('*', { count: 'exact', head: true })
     .eq('doctor_id', session.user.id);

   if (count >= 5 && userTier === 'BÁSICO') {
     throw new Error("Límite de pacientes alcanzado. Actualiza tu plan.");
   }
   ```
2. **Monitoreo de Uso (Opcional):** 
   Para evitar hacer COUNTs constantes (lo cual es eficiente ahora, pero puede escalar mal), se podría implementar una tabla auxiliar `UsageMetric` asociada al `user_id` que incremente contadores (`patients_count`, `appointments_this_month`).

---

## 3. Implementación del Free Trial (7 Días)

Stripe gestionará el Trial automáticamente, evitando escribir lógica compleja de fechas en nuestro backend.

**Flujo Técnico del Trial:**
1. Al registrarse, el usuario es redirigido a Stripe Checkout.
2. En la creación de la sesión de Checkout (`stripe.checkout.sessions.create`), inyectamos `subscription_data: { trial_period_days: 7 }`.
3. Stripe valida la tarjeta pero **cobra $0**.
4. Stripe envía un webhook `customer.subscription.created` con `status: 'trialing'`.
5. En Supabase (tabla `Subscription`), guardamos el status `trialing`. El middleware de Next.js permitirá acceso total (como si fuera Premium) bajo este estado.
6. Al día 7, Stripe cobra automáticamente. Si falla, envía el webhook con `status: 'past_due'`. Si es exitoso, envía `status: 'active'`.

---

## 4. Feature Flags y Funcionalidades por Tier

El Frontend y Backend necesitan saber qué puede ver o hacer un usuario según su Tier.

### Arquitectura de Control de Acceso:
En lugar de llenar los componentes de React con múltiples validaciones (`if (tier === 'PREMIUM')`), utilizaremos **Feature Flags** basadas en el plan del usuario.

- **Implementación en UI:**
  ```javascript
  const features = getFeaturesForTier(userSubscription.plan_type);
  
  // Dashboard Analytics
  {features.canViewAdvancedAnalytics ? <AdvancedCharts /> : <BasicCharts />}
  
  // Templates de notas
  {features.hasTemplates ? <TemplateSelector /> : <PremiumUpsellBanner />}
  ```
- **Protección de API Routes/Server Actions:** 
  Cualquier intento malicioso de acceder a funciones premium desde la red debe bloquearse en el backend validando el tier del usuario: `if (!features.hasTemplates) return new Response('Unauthorized', { status: 403 })`.

---

## 5. Resumen del Esquema de Datos Final (Supabase)

Para soportar las suscripciones sin tocar la lógica clínica actual, solo agregaremos una nueva tabla independiente:

- **`User`** (o `auth.users`): Datos de perfil del profesional.
- **`Subscription`** *(NUEVA)*: Vinculada 1 a 1 con el `User`. Define el plan (`BASIC`, `PREMIUM`, `ENTERPRISE`), el estado (`trialing`, `active`) y los IDs de Stripe.
- **`Patient`**: Mantiene su `doctor_id`.
- **`Appointment` / `TherapySession`**: Mantienen sus relaciones actuales (vinculados al paciente y al doctor).

---

## 6. Siguientes Pasos (Roadmap de Implementación)

Dado que evitamos el multi-tenancy, el desarrollo se simplifica drásticamente. El orden sugerido es:

1. **Fase Base de Datos:**
   - Crear la tabla `public.Subscription` vinculada al usuario.
2. **Fase Stripe & Trial:** 
   - Crear cuenta de Stripe, configurar productos y precios.
   - Implementar el checkout y los webhooks (`/api/webhooks/stripe`) para actualizar la tabla `Subscription`.
3. **Fase Feature Flags:** 
   - Crear un hook (`useFeatures`) o contexto de React que lea el tier del usuario.
   - Modificar la UI para ocultar/mostrar elementos (ej. gráficas avanzadas) según el plan.
4. **Fase Límites (Enforcement):** 
   - Implementar las validaciones de conteo (`COUNT`) en los Server Actions de creación de Pacientes, Citas y Notas para aplicar las restricciones del plan Básico.
