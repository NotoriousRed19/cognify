# Plan de Implementación: Sistema de Pagos SaaS (Suscripciones)

Este documento detalla la arquitectura técnica profesional para transformar a Cognify en un SaaS monetizable, operando bajo un modelo híbrido: cobros automáticos por tarjeta de crédito y control manual administrativo.

## Arquitectura del Sistema Híbrido

Para manejar pagos recurrentes de forma segura sin tocar datos de tarjetas de crédito (cumplimiento PCI-DSS), integraremos **Stripe**. El sistema tendrá dos fuentes de verdad para determinar si un usuario tiene acceso o no:
1. **La suscripción automática** (Controlada por Stripe y sincronizada vía Webhooks).
2. **El Override Manual** (Controlado por ti, el SuperAdmin).

---

## 1. Modificaciones a la Base de Datos (Supabase)

Actualizaremos la tabla `User` (o crearemos una tabla auxiliar `Subscriptions`) para incluir los siguientes campos:

### Nuevas Columnas
- `stripe_customer_id` (String): El ID del cliente en Stripe.
- `stripe_subscription_id` (String): El ID de la suscripción activa.
- `plan_type` (String): 'free' | 'pro' | 'enterprise'.
- `status` (String): 'active' | 'past_due' | 'canceled' | 'unpaid'.
- `is_manual_override` (Boolean): *[Clave para el modo dual]* Por defecto `false`. Si es `true`, el sistema ignora a Stripe y confía en el estado que el Admin haya puesto.
- `current_period_end` (DateTime): Fecha de expiración.

---

## 2. Flujo 1: Suscripciones Automáticas (Web)

El flujo para usuarios que pagan solos en la plataforma será:

1. **Portal de Precios:** El usuario en la landing page hace clic en "Comprar".
2. **Stripe Checkout:** Next.js genera un enlace seguro de Stripe y redirige al usuario. Allí el usuario mete su tarjeta.
3. **Webhooks (El Motor Invisible):** 
   - Crearemos una ruta en Next.js: `POST /api/webhooks/stripe`.
   - Cuando el pago es exitoso, Stripe llama silenciosamente a este Webhook.
   - Nuestro servidor verifica la firma criptográfica de Stripe y actualiza el campo `status = 'active'` en Supabase para ese usuario.
4. **Portal del Cliente:** Utilizaremos "Stripe Customer Portal" para que el psicólogo pueda cancelar su suscripción, cambiar de tarjeta o descargar facturas sin que tengamos que programar nada de eso.

---

## 3. Flujo 2: Panel de Administrador (Control Manual)

Para que puedas regalar meses, suspender cuentas por falta de pago (si te pagan por transferencia bancaria) o gestionar VIPs:

1. **Nuevo Rol de Seguridad (SuperAdmin):** Configuraremos una política de RLS en Supabase para que solo tu correo tenga permisos de `admin`.
2. **Ruta `/admin` en Next.js:** Un panel de control privado que lista a todos los psicólogos registrados.
3. **El Switch Mágico:** Cada usuario tendrá un toggle en este panel. Al modificarlo, se ejecutará una función que:
   - Cambiará el estado de `status` a 'active' o 'canceled'.
   - Cambiará `is_manual_override` a `true`.
   - Al estar el override en `true`, si un Webhook de Stripe intenta cancelar la cuenta (ej. tarjeta rechazada), nuestro backend ignorará a Stripe y respetará tu decisión manual.

---

## 4. Protección de Rutas (Paywall)

Modificaremos nuestro actual `src/lib/auth-guard.js` y el middleware de protección.
Actualmente verificamos: *¿Está logueado?*
A futuro verificaremos: *¿Está logueado?* **Y** *¿Tiene el `status` = 'active'?*

Si un usuario se atrasa en un pago, automáticamente será redirigido a una nueva pantalla `/billing` donde dirá: *"Tu suscripción ha expirado. Por favor, actualiza tu método de pago para seguir atendiendo a tus pacientes."*, bloqueándole el acceso al `/dashboard`.

---

## Siguientes Pasos (Para cuando inicie la programación)
1. Definir si ofreceremos Trial (Prueba gratis de 7 días).
2. Definir si existirá un plan "Free" con límites (ej. máximo 5 pacientes). Si es así, programaremos lógica de límites en lugar de bloqueos totales.
3. Crear cuenta en Stripe para obtener las llaves de desarrollo y producción.
