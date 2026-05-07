# Tareas de Desarrollo: Cognify SaaS

## Resumen de Especificaciones
**Requisitos Originales**: 
> "Transformar a Cognify en un SaaS monetizable, operando bajo un modelo híbrido: cobros automáticos por tarjeta de crédito y control manual administrativo."
> "Mantenimiento de la Arquitectura Actual (Sin Multi-tenancy)"
> "El plan Básico introduce límites estrictos: 5 pacientes, 50 citas/mes, 100 notas totales."
> "Stripe gestionará el Trial automáticamente... trial_period_days: 7"

**Stack Técnico**: Next.js, Supabase, Stripe, Resend/Twilio (para notificaciones)
**Plazo Estimado**: Por definir

## Tareas de Desarrollo

### [ ] Tarea 1: Actualizaciones del Esquema de Base de Datos en Supabase
**Descripción**: Modificar la base de datos para soportar suscripciones y anulaciones manuales.
**Criterios de Aceptación**: 
- Se crea una nueva tabla `Subscription` (o se actualiza la tabla `User`) con los campos: `stripe_customer_id`, `stripe_subscription_id`, `plan_type` ('BÁSICO'|'PREMIUM'|'ENTERPRISE'), `status`, `is_manual_override` (boolean, por defecto false), `current_period_end`.
- Las políticas de RLS son actualizadas o verificadas para asegurar que los usuarios solo puedan leer los datos de su propia suscripción.

**Archivos a Crear/Editar**:
- Archivo de migración SQL en Supabase

**Referencia**: Sección 1 & 5 de la especificación

### [ ] Tarea 2: Integración de Stripe Checkout y Portal de Cliente
**Descripción**: Implementar el flujo de checkout para que los usuarios se suscriban y gestionen su facturación.
**Criterios de Aceptación**:
- Ruta API creada para generar una sesión de Stripe Checkout.
- La sesión de checkout incluye `subscription_data: { trial_period_days: 7 }`.
- Integración con el Portal de Cliente de Stripe para que los usuarios gestionen sus tarjetas y facturas.

**Archivos a Crear/Editar**:
- `src/app/api/checkout/route.js` (o similar)
- Componentes de UI de Facturación/Precios

**Referencia**: Sección 2 & 3 de la especificación

### [ ] Tarea 3: Manejador de Webhooks de Stripe
**Descripción**: Crear un endpoint seguro para recibir eventos de Stripe y actualizar la base de datos.
**Criterios de Aceptación**:
- La ruta acepta peticiones POST y verifica la firma criptográfica de Stripe.
- Maneja eventos como `customer.subscription.created` y `customer.subscription.updated` para actualizar el `status` del usuario en la BD.
- Respeta la bandera `is_manual_override` (ignora las actualizaciones de estado de Stripe si es true).

**Archivos a Crear/Editar**:
- `src/app/api/webhooks/stripe/route.js`

**Referencia**: Sección 2 de la especificación

### [ ] Tarea 4: Middleware de Next.js y Guardia de Autenticación (Paywall)
**Descripción**: Implementar la protección de rutas para bloquear el acceso a cuentas con pagos pendientes.
**Criterios de Aceptación**:
- El middleware o guardia de autenticación comprueba si el usuario ha iniciado sesión Y si el `status` de la suscripción es 'active' o 'trialing'.
- Si la suscripción ha expirado o está sin pagar, redirige al usuario a `/billing` con un mensaje.
- El acceso a `/dashboard` está debidamente asegurado.

**Archivos a Crear/Editar**:
- `src/lib/auth-guard.js` (o el middleware existente)
- `src/app/billing/page.jsx`

**Referencia**: Sección 4 de la especificación

### [ ] Tarea 5: Aplicación de Límites por Nivel en el Backend
**Descripción**: Aplicar estrictamente los límites del plan Básico en el servidor antes de realizar inserciones en la base de datos.
**Criterios de Aceptación**:
- Los Server Actions para crear Pacientes, Citas y Notas comprueban el nivel de suscripción del usuario.
- Si el usuario está en el plan BÁSICO, se cuentan los registros existentes.
- Se lanza un error si se alcanzan los límites (ej. 5 pacientes).

**Archivos a Crear/Editar**:
- Server actions que manejan mutaciones en la base de datos (ej. `src/actions/patient-actions.js`)

**Referencia**: Sección 2 de la especificación de arquitectura

### [ ] Tarea 6: Feature Flags para la Interfaz de Usuario (UI)
**Descripción**: Implementar un sistema de feature flags (banderas de características) para alternar elementos de la UI según el nivel de suscripción del usuario.
**Criterios de Aceptación**:
- Función de utilidad o React Hook (ej. `getFeaturesForTier`) creada para abstraer la disponibilidad de características.
- La UI renderiza condicionalmente características premium (como Analíticas Avanzadas o Plantillas) basándose en estas banderas.

**Archivos a Crear/Editar**:
- `src/lib/features.js` o `src/hooks/useFeatures.js`
- Varios componentes de UI que necesiten renderizado condicional

**Referencia**: Sección 4 de la especificación de arquitectura

### [ ] Tarea 7: Panel de Control SuperAdmin (Override Manual)
**Descripción**: Construir un panel de administración privado para la gestión manual de suscripciones.
**Criterios de Aceptación**:
- La política de RLS restringe el acceso al correo del SuperAdmin.
- La ruta `/admin` lista todos los psicólogos registrados.
- Un interruptor (toggle) permite al Administrador cambiar el estado de un usuario y establece `is_manual_override` en `true`.

**Archivos a Crear/Editar**:
- `src/app/admin/page.jsx`
- Rutas/acciones API para el administrador

**Referencia**: Sección 3 de la especificación

### [ ] Tarea 8: Sistema de Notificaciones y Recordatorios de Citas
**Descripción**: Implementar notificaciones automatizadas (vía Email y/o WhatsApp) para recordar a los pacientes sus próximas citas.
**Criterios de Aceptación**:
- Configuración de un cron job o integración de un servicio en segundo plano (ej. Inngest / Upstash QStash / pg_cron en Supabase) para activar notificaciones.
- Envío de correos (ej. vía Resend) o mensajes (ej. Twilio) 24 o 48 horas antes de la cita programada.
- Interfaz en el dashboard para que el psicólogo active/desactive o personalice los recordatorios para sus pacientes.
- Las notificaciones de WhatsApp/Email son características exclusivas de los planes Premium o Enterprise (gestionadas vía Feature Flags de la Tarea 6).

**Archivos a Crear/Editar**:
- `src/app/api/cron/reminders/route.js` (o función equivalente de Supabase)
- Integración de API de mensajería (Resend/Twilio)
- Componentes de UI de configuración en el dashboard del psicólogo

**Referencia**: Planificación adicional de características de SaaS

## Requisitos de Calidad
- [ ] Sin comandos de inicio del servidor - asuma que el servidor de desarrollo está en ejecución
- [ ] Diseño responsivo para móviles obligatorio
- [ ] Deben usarse los Server Actions de Next.js para mutaciones en el backend donde aplique
- [ ] Nunca confiar en el Frontend para la validación de límites o estado de suscripción
- [ ] Asegurar que las políticas de RLS en Supabase no se rompan con estos cambios

## Notas Técnicas
**Stack de Desarrollo**: Next.js, Supabase, Stripe, Proveedor de Correos/Notificaciones (Resend/Twilio)
**Instrucciones Especiales**: Mantener la arquitectura actual sin Multi-tenancy para evitar refactorización profunda. Stripe gestiona la lógica de la prueba de 7 días.
**Expectativas de Plazo**: A definir según la capacidad del equipo de desarrollo, estimado 1-2 semanas para implementación completa y pruebas.
