# Cognify

![Cognify Logo](https://img.shields.io/badge/Cognify-SaaS-6366f1?style=for-the-badge)

## 🧠 ¿Qué es Cognify?
**Cognify** es una plataforma SaaS (Software as a Service) de gestión clínica y expediente electrónico de próxima generación. Está diseñada para centralizar, simplificar y asegurar la práctica profesional de especialistas en salud mental, ofreciendo un entorno digital fluido, estético y altamente seguro.

## 🎯 ¿Para qué es?
El propósito de Cognify es eliminar la fricción administrativa y de gestión en la consulta clínica. Permite a los profesionales:
- Mantener un registro ordenado y seguro de los expedientes de sus pacientes.
- Agendar y gestionar citas médicas en un calendario interactivo.
- Redactar notas clínicas, de evolución y observaciones de manera estructurada mediante un editor de texto enriquecido.
- Visualizar métricas en tiempo real sobre la salud de su práctica profesional (retención de pacientes, citas próximas, sesiones completadas).

## 👥 ¿Para quiénes es?
Cognify está diseñado específicamente para profesionales de la salud mental y áreas afines:
- Psicólogos clínicos.
- Psiquiatras.
- Terapeutas y psicoterapeutas.
- Clínicas de salud mental de tamaño pequeño a mediano que requieran una herramienta moderna para la gestión de sus consultas.

---

## ✨ Funcionalidades Principales

1. **Dashboard y Analíticas en Tiempo Real**: Un panel de control que ofrece KPIs como número total de pacientes, citas del día, pacientes agendados y sesiones finalizadas, acompañados de gráficos visuales.
2. **Gestión de Pacientes**: Directorio digital (CRUD) para mantener la información de contacto, antecedentes y datos demográficos de los pacientes.
3. **Calendario Interactivo**: Sistema de agendamiento de citas vinculado directamente a los pacientes registrados.
4. **Notas Clínicas (Expediente Electrónico)**: Módulo de redacción de notas de sesión (Therapy Sessions) con soporte para texto enriquecido (integración planeada/activa con Tiptap), permitiendo separar observaciones, tareas y progreso.
5. **Autenticación y Seguridad Avanzada**: Inicio de sesión seguro con protección de rutas y manejo de sesiones.

---

## 🔗 ¿Cómo están conectadas las funcionalidades?

El sistema funciona como un ecosistema integrado:
- Al **crear un paciente** en el directorio, este se vuelve una entidad disponible en todo el sistema.
- En el **Calendario**, al crear una cita, se vincula obligatoriamente (o de forma opcional) a un paciente existente. 
- Al finalizar una cita, el profesional accede al módulo de **Notas de sesión**, donde redacta el progreso clínico. Estas notas quedan atadas al ID del paciente.
- El **Dashboard** lee todas estas interacciones en tiempo real: cuenta los pacientes creados, busca en el calendario las citas del día para calcular las "Citas Hoy", y cruza datos para mostrar cuántos pacientes activos tienen una cita próxima.

---

## 💼 Lógica de Negocio

El modelo de negocio y operativo de Cognify se basa en el esquema SaaS multitenant (multi-inquilino). 
- **Privacidad estricta**: Un profesional solo debe tener acceso a sus propios pacientes, citas y notas. La confidencialidad médico-paciente es el pilar del sistema.
- **Flujo de trabajo clínico**: El sistema imita el flujo real de un terapeuta: 1) Admisión (Registro de paciente) -> 2) Programación (Calendario) -> 3) Consulta y Evolución (Notas clínicas) -> 4) Revisión de métricas de práctica (Dashboard).
- **Escalabilidad para Suscripciones**: La arquitectura de base de datos y autenticación está preparada para introducir tiers de suscripción (ej. límite de pacientes en plan gratuito vs. ilimitado en plan premium).

---

## 💻 Lógica de Programación

Cognify está construido utilizando una arquitectura **Full-Stack serverless** moderna y orientada al rendimiento:

*   **Framework Principal**: Next.js (App Router, React 19). Maneja tanto el frontend (UI) como el backend (API Routes).
*   **Renderizado**: Utiliza un enfoque híbrido, con componentes del lado del servidor (SSR) para SEO y carga inicial rápida, y componentes del lado del cliente (`"use client"`) para interactividad (ej. gráficos, calendario).
*   **Estilos y UI**: Tailwind CSS (PostCSS) para un diseño de "Atomic Design" con estética premium (modo oscuro, gradientes, glassmorphism). Iconografía proporcionada por `lucide-react`.
*   **Gráficos y Visualización de Datos**: `recharts` para mostrar estadísticas de actividad semanal y distribución de estados de pacientes en el Dashboard.
*   **Editor de Texto (Notas Clínicas)**: Tiptap para ofrecer un editor de texto enriquecido moderno, limpio y sin distracciones.
*   **Manejo de Fechas**: `date-fns` para un formateo y cálculo de fechas eficiente y localizado (español).

---

## 🗄️ Lógica de Datos

La capa de datos está gestionada por **Supabase** (PostgreSQL) y es el núcleo de la seguridad del sistema, utilizando una arquitectura que relega la seguridad directamente a la base de datos mediante **Row Level Security (RLS)**.

### Entidades Principales:
- `User` / Auth: Entidad administrada por Supabase Auth. Representa al profesional de la salud.
- `Patient`: Contiene la información del paciente. Tiene una llave foránea `doctor_id` que apunta al profesional.
- `Appointment`: Representa los eventos en el calendario. Vinculada a un `doctor_id` y opcionalmente a un `patient_id`.
- `TherapySession`: Representa las notas clínicas. Está vinculada a un `patient_id`.

### Seguridad y RLS (Row Level Security):
La lógica de datos asume que el backend podría ser vulnerable, por lo que la verdadera barrera de seguridad está en la base de datos (Zero Trust):
1. **Políticas de Doctores**: Un usuario autenticado (`auth.uid()`) solo puede hacer `SELECT`, `INSERT`, `UPDATE` o `DELETE` en la tabla `Patient` o `Appointment` si el `doctor_id` de esa fila coincide con su UID.
2. **Políticas Indirectas (Cascada)**: Para que un doctor vea las notas (`TherapySession`), la política verifica que la nota pertenezca a un `patient_id` que a su vez pertenezca a ese doctor. 
3. **Optimización**: Se han creado índices (`idx_patient_doctor_id`, `idx_therapy_session_patient_id`, etc.) en las columnas utilizadas por las políticas RLS para garantizar que las consultas masivas se ejecuten en milisegundos sin sobrecargar la base de datos.
