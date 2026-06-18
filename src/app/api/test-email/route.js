import nodemailer from 'nodemailer';

export async function GET() {
  const diagnostics = {
    variables: {
      SMTP_HOST: process.env.SMTP_HOST ? '✅ Configurada' : '❌ FALTA',
      SMTP_PORT: process.env.SMTP_PORT ? '✅ Configurada' : '❌ FALTA',
      SMTP_USER: process.env.SMTP_USER ? `✅ ${process.env.SMTP_USER}` : '❌ FALTA',
      SMTP_PASS: process.env.SMTP_PASS ? `✅ (${process.env.SMTP_PASS.length} caracteres)` : '❌ FALTA',
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL ? `✅ ${process.env.SMTP_FROM_EMAIL}` : '❌ FALTA',
    },
    smtpTest: null,
    sendTest: null,
  };

  // Test 1: Verificar conexión SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    diagnostics.smtpTest = '✅ Conexión SMTP exitosa';

    // Test 2: Enviar un correo de prueba
    const info = await transporter.sendMail({
      from: `Cognify Test <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Se envía a sí mismo
      subject: '🧪 Test de Cognify - Nodemailer funciona',
      html: '<h1>¡Funciona!</h1><p>Si ves este correo, Nodemailer está correctamente configurado en Vercel.</p>',
    });

    diagnostics.sendTest = `✅ Correo enviado: ${info.messageId}`;
  } catch (err) {
    diagnostics.smtpTest = diagnostics.smtpTest || `❌ Error SMTP: ${err.message}`;
    diagnostics.sendTest = diagnostics.sendTest || `❌ Error enviando: ${err.message}`;
  }

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
