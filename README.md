# Cognify

![Cognify Logo](https://img.shields.io/badge/Cognify-SaaS-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel)

## 🧠 ¿Qué es Cognify?

**Cognify** es una plataforma SaaS (Software as a Service) de gestión clínica y expediente electrónico diseñada para profesionales de la salud mental. Centraliza, simplifica y asegura la práctica profesional ofreciendo un entorno digital fluido, estético y altamente seguro.

## 🎯 Propósito

Eliminar la fricción administrativa en la consulta clínica, permitiendo a los profesionales:

- Mantener un registro ordenado y seguro de los expedientes de sus pacientes.
- Agendar y gestionar citas médicas en un calendario interactivo.
- Redactar notas clínicas y de evolución mediante un editor de texto enriquecido.
- Recibir y gestionar reservas de pacientes a través de un sistema de booking público.
- Enviar notificaciones automáticas por correo electrónico.
- Visualizar métricas en tiempo real sobre la salud de su práctica profesional.

## 👥 ¿Para quiénes es?

- Psicólogos clínicos
- Psiquiatras
- Terapeutas y psicoterapeutas
- Clínicas de salud mental de tamaño pequeño a mediano

---

## ✨ Funcionalidades Principales

| Módulo                        | Descripción                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**                 | Panel con KPIs en tiempo real: pacientes totales, citas del día, sesiones finalizadas y gráficos de actividad semanal. |
| **Gestión de Pacientes**      | Directorio digital (CRUD) con información de contacto, antecedentes y datos demográficos.                              |
| **Calendario Interactivo**    | Sistema de agendamiento vinculado a los pacientes registrados.                                                         |
| **Notas Clínicas**            | Editor de texto enriquecido para redactar notas de sesión, observaciones y progreso.                                   |
| **Sistema de Booking**        | Página pública con URL personalizada (`/book/slug`) para que los pacientes reserven citas directamente.                |
| **Notificaciones por Email**  | Correos automáticos al doctor (nueva reserva) y al paciente (aprobación/rechazo de cita).                              |
| **Recordatorios Automáticos** | Cron Job diario que envía recordatorios 24 horas antes de cada cita confirmada.                                        |
| **Panel de Administración**   | Gestión de usuarios, roles y configuración global del sistema.                                                         |

---

## 🏗️ Stack Tecnológico

| Capa              | Tecnología                                        |
| ----------------- | ------------------------------------------------- |
| **Framework**     | Next.js 16 (App Router, React 19)                 |
| **Estilos**       | Tailwind CSS 4 (PostCSS)                          |
| **Base de Datos** | Supabase (PostgreSQL + Row Level Security)        |
| **Autenticación** | Supabase Auth (OAuth, Magic Link, Email/Password) |
| **Email**         | Nodemailer (Gmail SMTP)                           |
| **Gráficos**      | Recharts                                          |
| **Iconografía**   | Lucide React                                      |
| **Fechas**        | date-fns + date-fns-tz                            |
| **Validación**    | Zod                                               |
| **Hosting**       | Vercel (Serverless)                               |
| **Cron Jobs**     | Vercel Cron                                       |

---

## 🚀 Instalación Local

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)
- Cuenta de Gmail con [Contraseña de Aplicación](https://myaccount.google.com/apppasswords)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/NotoriousRed19/cognify.git
cd cognify

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 📁 Estructura del Proyecto

```
cognify/
├── public/                  # Archivos estáticos (imágenes, favicon)
├── src/
│   ├── app/                 # Rutas de Next.js (App Router)
│   │   ├── api/             # API Routes (backend serverless)
│   │   │   ├── appointments/    # CRUD de citas
│   │   │   ├── auth/            # Callbacks de autenticación
│   │   │   ├── booking/         # Sistema de reservas públicas
│   │   │   ├── cron/            # Tareas programadas (recordatorios)
│   │   │   ├── dashboard/       # Métricas y analíticas
│   │   │   ├── doctors/         # Datos del profesional
│   │   │   ├── notifications/   # Gestión de notificaciones
│   │   │   ├── patients/        # CRUD de pacientes
│   │   │   └── sessions/        # Notas clínicas
│   │   ├── admin/           # Panel de administración
│   │   ├── book/            # Página pública de booking
│   │   ├── dashboard/       # Dashboard del profesional
│   │   ├── login/           # Inicio de sesión
│   │   └── register/        # Registro de usuarios
│   ├── Components/          # Componentes reutilizables de React
│   ├── lib/                 # Lógica de negocio y servicios
│   │   ├── notification-service.js   # Motor de correos (Nodemailer)
│   │   ├── email-templates.js        # Plantillas HTML de correos
│   │   ├── auth-guard.js             # Protección de rutas
│   │   └── env.js                    # Validación de variables de entorno
│   └── utils/               # Utilidades auxiliares
├── supabase/                # Migraciones y configuración de Supabase
├── vercel.json              # Configuración de Cron Jobs
├── package.json             # Dependencias y scripts
└── .env.example             # Plantilla de variables de entorno
```

---

## 🔐 Seguridad

Cognify implementa un modelo de seguridad **Zero Trust** con múltiples capas:

1. **Row Level Security (RLS):** Cada tabla en Supabase tiene políticas que aseguran que un profesional solo acceda a sus propios datos.
2. **Service Role Key:** Solo utilizada en el servidor (API Routes), nunca expuesta al cliente.
3. **Protección de Rutas:** Middleware de autenticación que redirige usuarios no autenticados.
4. **Cron Secret:** Endpoint de recordatorios protegido por un Bearer Token secreto.

---

## 📧 Sistema de Notificaciones

| Evento           | Destinatario | Descripción                                               |
| ---------------- | ------------ | --------------------------------------------------------- |
| Nueva reserva    | Doctor       | Correo inmediato cuando un paciente agenda una cita.      |
| Cita aprobada    | Paciente     | Confirmación cuando el doctor acepta la reserva.          |
| Cita rechazada   | Paciente     | Notificación cuando el doctor rechaza la reserva.         |
| Recordatorio 24h | Paciente     | Correo automático diario (Cron Job) para citas de mañana. |

---

## 📄 Licencia

Este proyecto está protegido bajo la Licencia GPL-3.0. Consulta el archivo [LICENSE.md](LICENSE.md) para más detalles.

---

## 👤 Autor

**Mauricio Lopez** — [@NotoriousRed19](https://github.com/NotoriousRed19)

---

> Construido con ❤️ para profesionales de la salud mental.
