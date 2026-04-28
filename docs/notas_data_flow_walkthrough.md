# Flujo de Datos: Módulo de Notas de Sesión 🧠

Este documento explica de forma sencilla y estructurada cómo viaja la información dentro del módulo de Notas Clínicas, desde la base de datos hasta lo que ve el profesional en pantalla.

## 1. El Origen de los Datos: Supabase (Backend)

Todo el módulo de notas depende de dos tablas interconectadas en nuestra base de datos de Supabase:
- **`Patient`**: Almacena los perfiles de los pacientes.
- **`TherapySession`**: Almacena las sesiones individuales. Cada sesión pertenece a un paciente (`patient_id`) y tiene tres columnas de texto fundamentales que acabamos de integrar: `notas`, `tareas_pendientes` y `observaciones`.

Las **Políticas de Seguridad (RLS)** configuran la protección: el doctor que inicia sesión solo puede solicitar información de las tablas que están vinculadas a su `doctor_id`.

## 2. Carga Inicial de Datos (Lectura)

Cuando el psicólogo navega a `/dashboard/notas`, ocurre lo siguiente:

1. **Montaje de la Página (`notas/page.jsx`)**: El componente `NotasPage` se renderiza por primera vez.
2. **Ejecución del Efecto (`useEffect`)**: Automáticamente, se ejecuta una consulta a Supabase utilizando nuestro cliente `createClient()`.
3. **Consulta Cruzada (Join)**: Pedimos a Supabase: *"Tráeme todas las sesiones de este psicólogo ordenadas por fecha, y para cada sesión, inclúyeme el ID y el Nombre de su Paciente"*.
   ```javascript
   .from("TherapySession")
   .select(`id, fecha_sesion, notas, tareas_pendientes, observaciones, updatedAt, Patient!inner (id, nombre)`)
   ```
4. **Almacenamiento Local**: Esta lista masiva se guarda en la variable de estado `sessions`.

## 3. Navegación en la Interfaz (El Estado de React)

La interfaz se divide en dos grandes áreas que reaccionan a nuestras interacciones:

- **Panel Izquierdo (Sidebar)**: Mapea la variable `sessions` para mostrar los botones de cada sesión. Al usar la barra de búsqueda, la lista se filtra localmente (sin volver a llamar a la base de datos) comparando el término de búsqueda con `session.Patient.nombre`.
- **Selección de Paciente**: Al hacer clic en un paciente de la barra lateral, se actualiza el estado `selectedSession` y se resetea la pestaña a `"notas"`.

## 4. El Sistema de Pestañas y el Editor (Flujo Bidireccional)

Cuando una sesión está seleccionada, se muestra el editor. Aquí es donde ocurre la magia del autoguardado y las pestañas:

1. **Las Pestañas (`activeTab`)**: Tenemos tres botones que cambian una variable llamada `activeTab` ("notas", "tareas_pendientes" u "observaciones"). 
2. **Montaje Dinámico del Editor**: En lugar de renderizar un editor gigante, pasamos un "identificador único" (`key`) al componente `RichTextEditor`:
   ```javascript
   <RichTextEditor 
     key={`${selectedSession.id}-${activeTab}`}
     initialContent={selectedSession[activeTab]} 
   />
   ```
   **Concepto Clave**: Si cambias de pestaña, el `key` cambia. Cuando el `key` cambia en React, este **destruye el editor anterior y crea uno totalmente nuevo**, inyectándole la información exacta de esa columna (`initialContent`).

## 5. El Autoguardado (Escritura hacia Supabase)

Cuando el psicólogo empieza a teclear en el editor (`textarea`), este es el flujo:

1. **Captura de Texto**: El texto viaja a una función interna (`handleChange`) que actualiza visualmente la pantalla.
2. **El "Debounce" (Temporizador)**: En lugar de enviar un PING a la base de datos por cada letra que tecleas (lo cual saturaría el servidor), se activa un temporizador oculto (`setTimeout`). Si escribes "Hola", empieza a contar 1 segundo. Si antes del segundo escribes " Mundo", el temporizador se reinicia.
3. **El Disparo Final**: Si pasa 1 segundo sin que el psicólogo toque el teclado, el editor ejecuta la orden de guardado.
4. **La Promesa (`handleSaveField`)**: El componente padre (`NotasPage`) toma el texto y envía una actualización silenciosa a Supabase: *"Busca la sesión con este ID, y actualiza específicamente esta columna (ej. 'tareas_pendientes') con este nuevo texto"*.
5. **Sincronización Local**: Si Supabase dice "OK", el frontend actualiza silenciosamente su memoria local (la variable `sessions`) para que, si cambias de pestaña y vuelves, el texto más reciente siga ahí sin necesidad de recargar la página entera.

---
En resumen: **Supabase** -> **`sessions` (Estado)** -> **Sidebar** -> **`selectedSession`** -> **`activeTab`** -> **Editor** -> **Temporizador** -> **Supabase**. Un ciclo continuo, silencioso e invisible para el usuario final.

## 6. Conexión y Utilidad en el Ecosistema Cognify

El módulo de notas no es una isla; es el corazón del registro clínico y está entrelazado con las demás funciones del SaaS para crear un flujo de trabajo integral:

1. **Conexión con "Pacientes" (`/dashboard/pacientes`)**:
   - Cuando das de alta a un paciente en el sistema, automáticamente se vuelve elegible para tener notas.
   - Las notas le dan profundidad al perfil del paciente. En el futuro, desde la ficha del paciente, se podrá visualizar un resumen histórico de todas sus sesiones y su evolución clínica, extraído directamente de estas notas.

2. **Conexión con "Calendario / Citas" (`/dashboard/calendario`)**:
   - El ciclo de vida natural es: El psicólogo agenda una cita en el **Calendario**.
   - Cuando la cita ocurre (o termina), esa cita se convierte (o está vinculada) a un registro en `TherapySession`.
   - La fecha que aparece en la barra lateral de las notas (`fecha_sesion`) proviene exactamente del momento en que se agendó o llevó a cabo esa sesión.
   - *Utilidad*: Permite al profesional revisar rápidamente qué se habló en la sesión anterior justo antes de que el paciente entre al consultorio, todo ordenado cronológicamente por las citas del calendario.

3. **Separación de Responsabilidades (Las 3 Pestañas)**:
   - **Notas Clínicas**: El "grueso" de la sesión (ej. modelo SOAP, catarsis del paciente, intervenciones).
   - **Observaciones**: Anotaciones privadas del terapeuta, lenguaje corporal, alertas de riesgo (ej. ideación suicida), impresiones subjetivas.
   - **Tareas Pendientes**: Lo que el terapeuta le deja de "tarea" al paciente para la semana (ej. "Llenar registro de pensamientos automáticos").
   - *Utilidad*: Al separar estos datos, en futuras versiones de Cognify podrías (por ejemplo) enviar automáticamente un correo al paciente con sus "Tareas Pendientes", manteniendo privadas las "Observaciones" y las "Notas Clínicas".

Este ecosistema asegura que el psicólogo tenga una herramienta "todo en uno" donde la logística (calendario) alimenta directamente a la clínica (notas), reduciendo la fricción administrativa al mínimo.
