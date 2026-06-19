import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { 
  newBookingForDoctorTemplate, 
  bookingApprovedTemplate, 
  bookingRejectedTemplate, 
  appointmentReminderTemplate 
} from './email-templates';

// Instanciar Nodemailer con Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromName = process.env.SMTP_FROM_NAME || 'Cognify';
const fromEmail = process.env.SMTP_FROM_EMAIL || 'cognify.reservas@gmail.com';

// Supabase con Service Role para saltar RLS cuando sea necesario registrar logs internamente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class NotificationService {
  
  /**
   * Registra la notificación en la base de datos (incluyendo detalles de error si los hay)
   */
  async logNotification(data) {
    try {
      const { error } = await supabaseAdmin
        .from('Notification')
        .insert([{
          doctor_id: data.doctorId,
          appointment_id: data.appointmentId,
          channel: 'EMAIL',
          recipient_type: data.recipientType,
          recipient_contact: data.recipientEmail,
          event_type: data.eventType,
          status: data.status,
          error_details: data.errorDetails || null,
        }]);
      
      if (error) console.error('[NotificationService] Error al guardar log:', error);
    } catch (err) {
      console.error('[NotificationService] Error en logNotification:', err);
    }
  }

  /**
   * Notifica al psicólogo cuando recibe una nueva reserva
   */
  async notifyDoctorNewBooking({ doctorId, doctorEmail, doctorName, patientName, patientContact, patientEmail, appointmentDate, appointmentId, selectedService, paymentInfo, paymentReceipt }) {
    if (!doctorEmail) return;

    const htmlContent = newBookingForDoctorTemplate({
      doctorName,
      patientName,
      patientContact,
      patientEmail,
      appointmentDate,
      selectedService,
      paymentInfo,
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    });

    let sendStatus = 'FAILED';
    let errorDetails = null;

    try {
      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: doctorEmail,
        subject: `🟢 Nueva reserva: ${patientName}`,
        html: htmlContent,
      };

      if (paymentReceipt) {
        // Extraer la porción base64 pura (después de "data:image/jpeg;base64,")
        const base64Data = paymentReceipt.split(';base64,').pop();
        mailOptions.attachments = [
          {
            filename: `comprobante_${paymentInfo?.referencia || 'pago'}.jpg`,
            content: base64Data,
            encoding: 'base64'
          }
        ];
      }

      const info = await transporter.sendMail(mailOptions);

      sendStatus = 'SENT';
      return { success: true, data: info, error: null };
    } catch (err) {
      errorDetails = err.message;
      return { success: false, error: err.message };
    } finally {
      // SIEMPRE registrar el log, haya éxito o fallo
      await this.logNotification({
        doctorId,
        appointmentId,
        recipientType: 'DOCTOR',
        recipientEmail: doctorEmail,
        eventType: 'NEW_BOOKING',
        status: sendStatus,
        errorDetails
      });
    }
  }

  /**
   * Notifica al paciente cuando su cita es aprobada o rechazada
   */
  async notifyPatientBookingStatus({ doctorId, appointmentId, patientEmail, patientName, doctorName, appointmentDate, status }) {
    if (!patientEmail) {
      
      await this.logNotification({
        doctorId,
        appointmentId,
        recipientType: 'PATIENT',
        recipientEmail: 'NO_EMAIL',
        eventType: status === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
        status: 'SKIPPED',
        errorDetails: 'Paciente sin email'
      });
      
      return;
    }

    const isApproved = status === 'APPROVED';
    const htmlContent = isApproved 
      ? bookingApprovedTemplate({ patientName, doctorName, appointmentDate })
      : bookingRejectedTemplate({ patientName, doctorName, appointmentDate });

    const subject = isApproved 
      ? `Tu cita ha sido confirmada ✅`
      : `Actualización sobre tu solicitud de cita`;

    let sendStatus = 'FAILED';
    let errorDetails = null;

    try {
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: patientEmail,
        subject: subject,
        html: htmlContent,
      });

      sendStatus = 'SENT';
      return { success: true, data: info, error: null };
    } catch (err) {
      errorDetails = err.message;
      return { success: false, error: err.message };
    } finally {
      await this.logNotification({
        doctorId,
        appointmentId,
        recipientType: 'PATIENT',
        recipientEmail: patientEmail,
        eventType: isApproved ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
        status: sendStatus,
        errorDetails
      });
    }
  }

  /**
   * Envía un recordatorio (automático o manual) al paciente
   */
  async sendReminder({ doctorId, appointmentId, patientEmail, patientName, doctorName, appointmentDate, customMessage = null }) {
    if (!patientEmail) return { success: false, error: 'Sin email' };

    const htmlContent = appointmentReminderTemplate({
      patientName,
      doctorName,
      appointmentDate,
      customMessage
    });

    let sendStatus = 'FAILED';
    let errorDetails = null;

    try {
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: patientEmail,
        subject: `Recordatorio de tu cita mañana ⏰`,
        html: htmlContent,
      });

      sendStatus = 'SENT';
      return { success: true, data: info, error: null };
    } catch (err) {
      errorDetails = err.message;
      return { success: false, error: err.message };
    } finally {
      await this.logNotification({
        doctorId,
        appointmentId,
        recipientType: 'PATIENT',
        recipientEmail: patientEmail,
        eventType: 'REMINDER_24H',
        status: sendStatus,
        errorDetails
      });
    }
  }
}

/**
 * Instancia global del servicio de notificaciones.
 * 
 * Centraliza el envío de correos electrónicos transaccionales y el registro (logging)
 * de todas las interacciones en la base de datos (tabla "Notification") utilizando
 * Service Role de Supabase.
 * 
 * Casos de uso principales:
 * - notifyDoctorNewBooking: Avisar al doctor sobre nuevas reservas.
 * - notifyPatientBookingStatus: Notificar al paciente la aprobación/rechazo de su cita.
 * - sendReminder: Enviar recordatorios a los pacientes.
 * 
 * @type {NotificationService}
 */
export const notificationService = new NotificationService();
