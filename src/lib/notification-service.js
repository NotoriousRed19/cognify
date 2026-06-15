import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { createClient } from '@supabase/supabase-js';
import { 
  newBookingForDoctorTemplate, 
  bookingApprovedTemplate, 
  bookingRejectedTemplate, 
  appointmentReminderTemplate 
} from './email-templates';

// Instanciar MailerSend
const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || 'dummy_key_for_build',
});
const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'notificaciones@cognify.app';
const senderObj = new Sender(fromEmail, "Cognify");

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
  async notifyDoctorNewBooking({ doctorId, doctorEmail, doctorName, patientName, patientContact, patientEmail, appointmentDate, appointmentId, selectedService }) {
    if (!doctorEmail) return;

    const htmlContent = newBookingForDoctorTemplate({
      doctorName,
      patientName,
      patientContact,
      patientEmail,
      appointmentDate,
      selectedService,
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    });

    let sendStatus = 'FAILED';
    let errorDetails = null;

    try {
      const emailParams = new EmailParams()
        .setFrom(senderObj)
        .setTo([new Recipient(doctorEmail, doctorName || "Doctor")])
        .setSubject(`🟢 Nueva reserva: ${patientName}`)
        .setHtml(htmlContent);

      const data = await mailersend.email.send(emailParams);
      sendStatus = 'SENT';

      return { success: true, data, error: null };
    } catch (err) {
      console.error('[NotificationService] Excepción enviando email al doctor:', err);
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
      console.log(`[NotificationService] El paciente ${patientName} no proporcionó email. No se enviará notificación de ${status}.`);
      
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
      const emailParams = new EmailParams()
        .setFrom(senderObj)
        .setTo([new Recipient(patientEmail, patientName || "Paciente")])
        .setSubject(subject)
        .setHtml(htmlContent);

      const data = await mailersend.email.send(emailParams);
      sendStatus = 'SENT';

      return { success: true, data, error: null };
    } catch (err) {
      console.error('[NotificationService] Excepción enviando email al paciente:', err);
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
      const emailParams = new EmailParams()
        .setFrom(senderObj)
        .setTo([new Recipient(patientEmail, patientName || "Paciente")])
        .setSubject(`Recordatorio de tu cita mañana ⏰`)
        .setHtml(htmlContent);

      const data = await mailersend.email.send(emailParams);
      sendStatus = 'SENT';

      return { success: true, data, error: null };
    } catch (err) {
      console.error('[NotificationService] Excepción en recordatorio:', err);
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

export const notificationService = new NotificationService();
