// src/lib/email-templates.js

import { escapeHtml } from './escape-html';

/**
 * Formatea una fecha ISO a formato legible para Venezuela.
 * Usa Intl.DateTimeFormat para consistencia entre servidores (Node, Edge, Vercel).
 */
function formatDate(isoDate) {
  try {
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Caracas'
    }).format(new Date(isoDate));
  } catch {
    return new Date(isoDate).toLocaleString('es-VE');
  }
}

const baseHtml = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7fc; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="background-color: #f8f7fc; padding: 40px 16px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(123, 97, 174, 0.08);">
      
      <!-- Header -->
      <div style="background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); padding: 40px 32px 32px; text-align: center;">
        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
              <span style="font-size: 24px; line-height: 44px; display: block;">🧠</span>
            </td>
            <td style="padding-left: 14px; vertical-align: middle;">
              <span style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; mso-line-height-rule: exactly;">Cognify</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Contenido -->
      <div style="padding: 40px 32px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
        <p style="color: #b0aec0; font-size: 11px; margin: 0;">
          © ${new Date().getFullYear()} Cognify — Gestión para profesionales de la salud mental
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const newBookingForDoctorTemplate = ({ doctorName, patientName, patientContact, patientEmail, appointmentDate, dashboardUrl }) => {
  // Escapar TODA entrada del usuario para prevenir XSS/inyección HTML
  const safeDoctorName = escapeHtml(doctorName);
  const safePatientName = escapeHtml(patientName);
  const safePatientContact = escapeHtml(patientContact);
  const safePatientEmail = escapeHtml(patientEmail);

  return baseHtml(`
    <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Nueva Solicitud de Cita</h2>
    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Hola Dr(a). ${safeDoctorName}, has recibido una nueva solicitud de cita.
    </p>
    
    <div style="background: #f8f7fc; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #1a1a2e;"><strong>Paciente:</strong> ${safePatientName}</p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #1a1a2e;"><strong>Fecha y Hora:</strong> ${formatDate(appointmentDate)}</p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #1a1a2e;"><strong>Teléfono:</strong> ${safePatientContact}</p>
      <p style="margin: 0; font-size: 14px; color: #1a1a2e;"><strong>Correo:</strong> ${safePatientEmail || 'No proporcionado'}</p>
    </div>

    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
      Por favor, ingresa a tu panel de control para aprobar o rechazar esta solicitud. Recuerda verificar cualquier pago pendiente.
    </p>

    <div style="text-align: center;">
      <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; padding: 14px 40px; background: #7b61ae; color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px;">Ir al Dashboard</a>
    </div>
  `);
};

export const bookingApprovedTemplate = ({ patientName, doctorName, appointmentDate }) => {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);

  return baseHtml(`
    <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">¡Tu cita ha sido confirmada! ✅</h2>
    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Hola ${safePatientName}, tu reserva con el(la) ${safeDoctorName} ha sido aprobada exitosamente.
    </p>
    
    <div style="background: #f8f7fc; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #1a1a2e;"><strong>Especialista:</strong> ${safeDoctorName}</p>
      <p style="margin: 0; font-size: 14px; color: #1a1a2e;"><strong>Fecha y Hora:</strong> ${formatDate(appointmentDate)}</p>
    </div>

    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0;">
      Te esperamos. Si necesitas reprogramar o cancelar, por favor contacta a tu especialista con anticipación.
    </p>
  `);
};

export const bookingRejectedTemplate = ({ patientName, doctorName, appointmentDate }) => {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);

  return baseHtml(`
    <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Actualización sobre tu reserva</h2>
    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Hola ${safePatientName}, lo sentimos pero tu solicitud de cita con el(la) ${safeDoctorName} no pudo ser confirmada.
    </p>
    
    <div style="background: #fef3f2; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #fecaca;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #991b1b;"><strong>Cita Cancelada:</strong> ${formatDate(appointmentDate)}</p>
    </div>

    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0;">
      Por favor, intenta agendar en otro horario disponible o contacta al especialista para mayor información.
    </p>
  `);
};

export const appointmentReminderTemplate = ({ patientName, doctorName, appointmentDate, customMessage }) => {
  const safePatientName = escapeHtml(patientName);
  const safeDoctorName = escapeHtml(doctorName);
  const safeCustomMessage = escapeHtml(customMessage);

  const extraNote = safeCustomMessage ? `
    <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bbf7d0;">
      <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Nota del Especialista:</p>
      <p style="color: #15803d; font-size: 14px; line-height: 1.6; margin: 0;">"${safeCustomMessage}"</p>
    </div>
  ` : '';

  return baseHtml(`
    <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Recordatorio de tu cita ⏰</h2>
    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Hola ${safePatientName}, este es un recordatorio amistoso de tu próxima sesión con el(la) ${safeDoctorName}.
    </p>
    
    <div style="background: #f8f7fc; border-radius: 12px; padding: 20px; border-left: 4px solid #7b61ae;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #1a1a2e;"><strong>Fecha y Hora:</strong> ${formatDate(appointmentDate)}</p>
    </div>

    ${extraNote}

    <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 24px 0 0;">
      ¡Nos vemos pronto!
    </p>
  `);
};
