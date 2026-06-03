# Templates de Email para Supabase — Cognify

## Cómo Configurarlos

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** → **Email Templates**
3. Para cada template, copia el HTML correspondiente y pégalo en el campo **Body**
4. Cambia el **Subject** al asunto indicado
5. Click en **Save**

---

## 1. Confirm Signup (Confirmación de Registro)

**Subject:** `Confirma tu cuenta en Cognify 🧠`

```html
<div style="background-color: #f8f7fc; padding: 40px 16px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(123, 97, 174, 0.08);">
    
    <!-- Header con gradiente y tabla para máxima compatibilidad -->
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
      <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.3px;">
        ¡Bienvenido a Cognify!
      </h2>
      <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Estás a un paso de gestionar tus consultas con claridad y calma. Confirma tu correo electrónico para activar tu cuenta.
      </p>

      <!-- Botón CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 14px 40px; background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(123, 97, 174, 0.3);">
          Confirmar mi cuenta
        </a>
      </div>

      <!-- Divider -->
      <div style="border-top: 1px solid #eee; margin: 28px 0;"></div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
        Si no creaste una cuenta en Cognify, puedes ignorar este mensaje de forma segura.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
      <p style="color: #b0aec0; font-size: 11px; margin: 0;">
        © 2025 Cognify — Gestión para profesionales de la salud mental
      </p>
    </div>
  </div>
</div>
```

---

## 2. Reset Password (Recuperación de Contraseña)

**Subject:** `Restablece tu contraseña — Cognify 🔐`

```html
<div style="background-color: #f8f7fc; padding: 40px 16px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(123, 97, 174, 0.08);">
    
    <!-- Header -->
    <div style="background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); padding: 40px 32px 32px; text-align: center;">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
            <span style="font-size: 24px; line-height: 44px; display: block;">🔐</span>
          </td>
          <td style="padding-left: 14px; vertical-align: middle;">
            <span style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; mso-line-height-rule: exactly;">Cognify</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Contenido -->
    <div style="padding: 40px 32px;">
      <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.3px;">
        Restablecer contraseña
      </h2>
      <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva contraseña.
      </p>

      <!-- Botón CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 14px 40px; background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(123, 97, 174, 0.3);">
          Crear nueva contraseña
        </a>
      </div>

      <!-- Alerta -->
      <div style="background: #fef3f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; margin: 24px 0;">
        <p style="color: #991b1b; font-size: 13px; margin: 0; line-height: 1.5;">
          ⚠️ Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá siendo la misma.
        </p>
      </div>

      <!-- Divider -->
      <div style="border-top: 1px solid #eee; margin: 28px 0;"></div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
        Este enlace expirará en 24 horas por seguridad.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
      <p style="color: #b0aec0; font-size: 11px; margin: 0;">
        © 2025 Cognify — Gestión para profesionales de la salud mental
      </p>
    </div>
  </div>
</div>
```

---

## 3. Magic Link (Enlace Mágico)

**Subject:** `Tu acceso directo a Cognify ✨`

```html
<div style="background-color: #f8f7fc; padding: 40px 16px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(123, 97, 174, 0.08);">
    
    <!-- Header -->
    <div style="background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); padding: 40px 32px 32px; text-align: center;">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
            <span style="font-size: 24px; line-height: 44px; display: block;">✨</span>
          </td>
          <td style="padding-left: 14px; vertical-align: middle;">
            <span style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; mso-line-height-rule: exactly;">Cognify</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Contenido -->
    <div style="padding: 40px 32px;">
      <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">
        Acceso directo
      </h2>
      <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Haz clic en el siguiente botón para iniciar sesión en tu cuenta de Cognify sin necesidad de contraseña.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 14px 40px; background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(123, 97, 174, 0.3);">
          Iniciar sesión
        </a>
      </div>

      <div style="border-top: 1px solid #eee; margin: 28px 0;"></div>
      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
        Este enlace es de uso único y expirará en 1 hora.
      </p>
    </div>

    <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
      <p style="color: #b0aec0; font-size: 11px; margin: 0;">
        © 2025 Cognify — Gestión para profesionales de la salud mental
      </p>
    </div>
  </div>
</div>
```

---

## 4. Change Email (Cambio de Correo)

**Subject:** `Confirma tu nuevo correo — Cognify 📧`

```html
<div style="background-color: #f8f7fc; padding: 40px 16px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(123, 97, 174, 0.08);">
    
    <!-- Header -->
    <div style="background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); padding: 40px 32px 32px; text-align: center;">
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
            <span style="font-size: 24px; line-height: 44px; display: block;">📧</span>
          </td>
          <td style="padding-left: 14px; vertical-align: middle;">
            <span style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; mso-line-height-rule: exactly;">Cognify</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 40px 32px;">
      <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">
        Confirma tu nuevo correo
      </h2>
      <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Solicitaste cambiar tu correo electrónico. Haz clic en el botón para confirmar tu nueva dirección.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 14px 40px; background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(123, 97, 174, 0.3);">
          Confirmar nuevo correo
        </a>
      </div>

      <div style="border-top: 1px solid #eee; margin: 28px 0;"></div>
      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
        Si no solicitaste este cambio, contacta a soporte inmediatamente.
      </p>
    </div>

    <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
      <p style="color: #b0aec0; font-size: 11px; margin: 0;">
        © 2025 Cognify — Gestión para profesionales de la salud mental
      </p>
    </div>
  </div>
</div>
```

---

## 5. Invite User (Invitación)

**Subject:** `Te han invitado a Cognify 🧠`

```html
<div style="background-color: #f8f7fc; padding: 40px 16px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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

    <div style="padding: 40px 32px;">
      <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin: 0 0 12px;">
        ¡Estás invitado!
      </h2>
      <p style="color: #64647a; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
        Has recibido una invitación para unirte a Cognify, la plataforma de gestión para profesionales de la salud mental. Haz clic para aceptar y crear tu cuenta.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="{{ .ConfirmationURL }}" 
           style="display: inline-block; padding: 14px 40px; background: #7b61ae; background: linear-gradient(135deg, #7b61ae 0%, #5f74c7 100%); color: #ffffff; border-radius: 16px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(123, 97, 174, 0.3);">
          Aceptar invitación
        </a>
      </div>

      <div style="border-top: 1px solid #eee; margin: 28px 0;"></div>
      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0;">
        Si no esperabas esta invitación, puedes ignorar este mensaje.
      </p>
    </div>

    <div style="background: #fafafd; padding: 20px 32px; text-align: center; border-top: 1px solid #f0eef5;">
      <p style="color: #b0aec0; font-size: 11px; margin: 0;">
        © 2025 Cognify — Gestión para profesionales de la salud mental
      </p>
    </div>
  </div>
</div>
```
