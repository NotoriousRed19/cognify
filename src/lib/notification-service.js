import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { 
  newBookingForDoctorTemplate, 
  bookingApprovedTemplate, 
  bookingRejectedTemplate, 
  appointmentReminderTemplate 
} from './email-templates';

// Instanciar Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'notificaciones@cognify.app';

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
      const { data, error } = await resend.emails.send({
        from: `Cognify <${fromEmail}>`,
        to: [doctorEmail],
        subject: `🟢 Nueva reserva: ${patientName}`,
        html: htmlContent,
      });

      if (error) {
        console.error('[NotificationService] Error de Resend:', error);
        errorDetails = typeof error === 'string' ? error : JSON.stringify(error);
      } else {
        sendStatus = 'SENT';
      }

      return { success: !error, data, error };
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
      const { data, error } = await resend.emails.send({
        from: `Cognify <${fromEmail}>`,
        to: [patientEmail],
        subject: subject,
        html: htmlContent,
      });

      if (error) {
        errorDetails = typeof error === 'string' ? error : JSON.stringify(error);
      } else {
        sendStatus = 'SENT';
      }

      return { success: !error, data, error };
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
      const { data, error } = await resend.emails.send({
        from: `Cognify <${fromEmail}>`,
        to: [patientEmail],
        subject: `Recordatorio de tu cita mañana ⏰`,
        html: htmlContent,
      });

      if (error) {
        errorDetails = typeof error === 'string' ? error : JSON.stringify(error);
      } else {
        sendStatus = 'SENT';
      }

      return { success: !error, data, error };
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
