# Arquitectura y Flujo de Datos: Sistema de Reservas (Booking) Cognify

Este documento detalla el diseño técnico y el flujo de datos del nuevo sistema de reservas para pacientes basado en el esquema de **bloqueo temporal y validación de comprobantes de pago**.

---

## 1. Visión General del Flujo de Usuario (Paciente)

1. **Acceso Público**: El paciente ingresa a `cognify.app/book/[slug-del-doctor]`.
2. **Selección de Fecha y Hora**: 
   - El sistema calcula los "slots" libres basados en el horario de trabajo del profesional.
   - **Regla estricta:** Solo se muestran horas que tengan al menos **2 horas de antelación** desde el momento actual.
3. **Instrucciones de Pago**: El sistema le muestra al paciente los datos bancarios o métodos de pago configurados por el profesional.
4. **Reserva y Comprobante**: El paciente llena sus datos (Nombre, Motivo, Teléfono) y **carga una imagen del comprobante de pago**.
5. **Espera de Confirmación**: El paciente recibe un mensaje indicando que su cita está sujeta a revisión.

## 2. Visión General del Flujo del Profesional (Dashboard)

1. **Recepción de Solicitud**: En el módulo `/dashboard/booking-requests`, el profesional ve las nuevas solicitudes entrantes con estado `PENDING_APPROVAL`.
2. **Contador de Tiempo (2 Horas)**: Cada solicitud muestra un temporizador. El profesional tiene un máximo de 2 horas desde el momento en que se creó la cita para validarla.
3. **Revisión del Comprobante**: El profesional hace clic en la solicitud y visualiza la imagen del comprobante de pago.
4. **Decisión**:
   - **Aprobar**: La cita cambia a `CONFIRMED` y queda agendada permanentemente.
   - **Rechazar**: La cita cambia a `REJECTED`, notificando (opcionalmente) al paciente.
   - **Expiración**: Si pasan las 2 horas sin acción, la cita cambia a `EXPIRED` y el espacio de tiempo vuelve a estar disponible para otros pacientes.

---

## 3. Modelo de Datos (Base de Datos)

### Tabla `User` (Modificaciones)
Para soportar URLs públicas y pagos:
- `slug` (Text, Unique): Ej. `dr-perez`.
- `booking_enabled` (Boolean): Switch general para apagar el sistema público.
- `payment_instructions` (Text): Instrucciones bancarias.

### Tabla `Availability` (Nueva)
Para definir cuándo trabaja el doctor:
- `id` (UUID)
- `doctor_id` (UUID, Foreign Key a User)
- `day_of_week` (Integer, 0=Domingo, 1=Lunes, etc.)
- `start_time` (Time, ej. "09:00")
- `end_time` (Time, ej. "17:00")

### Tabla `Appointment` (Modificaciones)
Se extiende la tabla actual de citas para soportar solicitudes:
- `status` (Enum): `PENDING_APPROVAL`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `COMPLETADA`.
- `guest_name` (Text): Nombre del paciente si no está registrado.
- `guest_contact` (Text): Email o Teléfono.
- `payment_receipt_url` (Text): Ruta de la imagen en Supabase Storage.
- `expires_at` (Timestamp): Fecha límite para aprobar (Creada en + 2 horas).

### Supabase Storage (Nuevo Bucket)
- **Bucket**: `payment_receipts`
- **Permisos**: 
  - `INSERT`: Público (anon) para que los pacientes puedan subir la imagen.
  - `SELECT`: Solo autenticados (`doctor_id` igual al dueño de la cita).

---

## 4. Lógica Backend (Motor de Disponibilidad)

El cálculo de slots libres ocurre en la ruta API `/api/booking/[slug]/slots`. El flujo algorítmico es:

1. Obtener la `Availability` del doctor para el día seleccionado.
2. Crear bloques de tiempo (ej. cada 60 min) desde el `start_time` hasta el `end_time`.
3. Filtrar bloques donde: `Hora Bloque < (Hora Actual + 2 horas)`. *(Descartar citas de último minuto)*.
4. Consultar la tabla `Appointment` buscando colisiones en ese día.
5. Filtrar bloques que colisionen con citas donde:
   - `status == CONFIRMED` (Ocupado permanentemente)
   - `status == PENDING_APPROVAL` AND `expires_at > NOW()` (Ocupado temporalmente en espera de validación).
6. Devolver al frontend únicamente los slots sobrevivientes.

### Ventaja de la "Liberación Pasiva"
Con la regla algorítmica anterior, **no es necesario crear un CRON job o tarea en segundo plano** que vigile y cancele citas a las 2 horas. 
Si una cita no se aprueba, su `expires_at` queda en el pasado. Cuando el motor de disponibilidad lee la base de datos, simplemente ignorará esa cita porque su tiempo de bloqueo expiró, devolviendo el hueco al público de forma automática.

---

## 5. Integración con el Agendamiento Manual Actual

Es normal preocuparse por un "choque" entre el paciente agendando desde su casa y el doctor agendando manualmente desde su dashboard. **Para evitar colisiones, ambos sistemas se integran bajo la misma tabla (`Appointment`) pero con distintos estados.**

### A. La misma tabla como Fuente Única de Verdad
Cualquier cita, sin importar de dónde venga, se guarda en `Appointment`. 
- **Cita Manual (Actual):** Cuando el doctor agenda en su calendario, el sistema inserta la cita con `status = CONFIRMED` y `source = MANUAL`.
- **Cita Pública (Booking):** Cuando un paciente agenda por la web, el sistema inserta la cita con `status = PENDING_APPROVAL` y `source = PUBLIC`.

### B. Prevención de "Doble Booking" (Double Booking)
- **Paciente intentando agendar:** El motor público (`/api/booking/[slug]/slots`) lee **toda** la tabla `Appointment`. Si el doctor agendó a alguien manualmente a las 10:00 AM, el motor verá la cita `CONFIRMED` y no le mostrará las 10:00 AM al paciente.
- **Doctor intentando agendar:** En el calendario del dashboard (`/dashboard/calendario`), el doctor verá las citas `PENDING_APPROVAL` bloqueando visualmente el espacio (ej. pintadas de naranja con textura a rayas). Si el doctor intenta agendar manualmente a esa misma hora, el sistema le lanzará un aviso: *"Hay una solicitud de reserva esperando validación de pago en este horario. ¿Deseas sobreescribirla o rechazarla primero?"*

### C. Visualización en el Calendario
El calendario actual (`/dashboard/calendario/page.jsx`) se modificará para mostrar 3 tipos de eventos:
1. 🟢 **Citas Confirmadas / Manuales:** Las que ya existen hoy. Bloquean el horario.
2. 🟠 **Solicitudes Pendientes:** Reservas públicas esperando que se valide el pago en las próximas 2 horas. El doctor puede hacer clic en ellas directamente en el calendario para ver la foto del recibo y aprobar/rechazar.
3. 🔴 **Completadas:** Citas que ya ocurrieron y fueron marcadas como listas.
