# ConectaCRM — Sistema de diseño y prompts de UI para Antigravity

Pensándolo con cabeza de dirección de diseño y no de "hacerlo bonito": ConectaCRM no dice nada de sí mismo si el look termina siendo el típico de SaaS armado con IA — fondo crema con acento terracota, o negro con un verde ácido único, o todo blanco con líneas finas tipo diario. Ninguno de los tres está mal en sí, pero no son una decisión, son un default, y no dicen nada de ESTE producto.

Lo que sí es específico de ConectaCRM: agarra el caos de tres canales distintos (WhatsApp, Instagram, Telegram, cada uno con su propio color y ritmo) y lo convierte en una sola bandeja tranquila. Esa tensión — caos que entra, orden que sale — es la tesis real, y de ahí sale todo lo demás: paleta, tipografía, el elemento de firma del hero, hasta cómo se sienten las alertas de SLA.

**Cómo encaja esto en el plan ya armado:** guardá este documento también como `DESIGN_SYSTEM.md` en la raíz del repo, junto a `AGENT.md`. Corré el Prompt A de la sección 8 como una **Fase 1.5**, entre la Fase 1 (auth/planes) y la Fase 2 (dashboard/clientes/pipelines) del plan de implementación — así cuando llegues a construir pantallas de negocio, ya existen los componentes y no cada fase inventa su propio estilo.

---

## 1. Tesis de diseño

**"Del caos al control."** El producto no es una bandeja más: es la prueba visual de que tres conversaciones que llegaban por caminos distintos ahora viven en un solo lugar, tranquilas. Esa idea se repite en tres niveles:
- **Marketing (landing):** un momento orquestado que muestra la convergencia (sección 3).
- **La app en uso diario:** un "panel de instrumentos" calmo y preciso — denso en información pero que respira, no un panel de control gritón.
- **Las alertas de tiempo (SLA, leads sin contacto):** urgencia real pero medida, nunca ansiedad.

**Qué evitamos a propósito:** gradientes decorativos genéricos, glassmorphism sin motivo, ilustraciones de stock con gente sonriendo, ✨emojis✨ en la interfaz, ficha "todo con el mismo peso tipográfico", y los logos reales de WhatsApp/Instagram/Telegram usados como decoración (sí se usan sus marcas oficiales donde corresponde funcionalmente, ver sección 3).

---

## 2. Tokens de diseño

### Color (nombrados, no "usa azules y grises")
**Modo claro**
- `--ink` `#12181F` — texto principal
- `--ink-muted` `#4B5563` — texto secundario
- `--surface` `#F6F7F9` — fondo de app
- `--surface-raised` `#FFFFFF` — cards, modales
- `--border` `#E2E5EA`

**Modo oscuro**
- `--ink` `#E7EAEE`
- `--ink-muted` `#9BA3AF`
- `--surface` `#14181D`
- `--surface-raised` `#1B2027`
- `--border` `#262C34`

**Marca**
- `--accent` `#0E5B63` — petróleo profundo. Deliberadamente no es el índigo/violeta que usa medio SaaS de IA, ni compite con el verde de WhatsApp ni con los semánticos de abajo.
- `--accent-hover` `#0B474D`
- `--accent-soft` `#E3EEEE` (claro) / `#17302F` (oscuro) — fondos tenues para badges de plan activo

**Semánticos** (deben distinguirse del acento a simple vista, y siempre van con ícono o texto, nunca solo color)
- `--success` `#1B8A5A`
- `--warning` `#B45309`
- `--danger` `#C0362C`
- `--info` `#2563A6`

**Indicador de canal** (solo como punto/chip pequeño de 8-10px, jamás como fondo grande de sección — es identificación, no decoración)
- WhatsApp: `#4FAE79` (verde desaturado, no el verde saturado de marca)
- Instagram: `#C1366B` (un tono representativo único, no el gradiente real de marca)
- Telegram: `#3B9BD9`

### Tipografía (3 roles, pareja deliberada — no la default Inter+Inter de cualquier proyecto)
- **Display** (H1/H2 de landing, números grandes de dashboard): **Instrument Sans** — geométrica, con carácter técnico, y el nombre le queda literal al concepto de "panel de instrumentos". Se usa con moderación: titulares y cifras destacadas, nunca párrafos.
- **UI / cuerpo** (todo el resto de la app): **IBM Plex Sans** — muy legible en tamaños chicos, soporte completo de tildes/ñ, con calidez sin perder precisión.
- **Datos / utilitaria** (IDs de ticket, timestamps, tokens, cualquier cosa "de máquina"): **IBM Plex Mono**.
- Todas las cifras que se alinean en columna (KPIs del dashboard, montos de deals, contador de SLA, tabla de precios) van con `font-variant-numeric: tabular-nums`.
- Auto-hospedá las tres tipografías (no las cargues desde Google Fonts en cada visita) para performance y para no depender de un tercero.

### Espaciado, radios, sombras, iconografía
- Escala de espaciado en base 4px (4/8/12/16/24/32/48/64).
- Radios: 6px en inputs/botones, 12px en cards, 16px en modales — una escala consistente, no radios al azar por componente.
- Sombras: máximo 2 niveles de elevación (una sutil para cards en reposo, una un poco más marcada para modales/dropdowns/tarjeta del Kanban en drag). Nada de sombras difusas de 40px "flotando".
- Un solo set de íconos: **Lucide** (stroke consistente, cubre todo lo necesario, encaja nativo con shadcn/ui).

---

## 3. El elemento de firma: la "convergencia"

Es el único lugar donde el diseño se permite ser audaz — todo lo demás alrededor queda quieto y disciplinado.

**Concepto:** en el hero de la landing, tres chips pequeños (ícono de mensaje genérico, no logos reales) en los tonos de canal de la sección 2 entran desde tres puntos distintos de la pantalla y confluyen, animados, en una sola tarjeta de conversación con el acento de marca — esa tarjeta única es la que sostiene el titular. Es la idea de "todas tus conversaciones en un solo lugar" mostrada, no contada. Con `prefers-reduced-motion` activado, se reemplaza por la composición ya convergida, estática.

Este mismo motivo se repite, mucho más discreto, como animación de carga de la bandeja de entrada en la app (los tres puntitos de color convergiendo brevemente mientras cargan las conversaciones) — así marketing y producto quedan conectados sin repetir el mismo despliegue dos veces.

**Sobre las marcas reales:** no reproduzcas los logos de Meta/WhatsApp/Instagram/Telegram como elemento decorativo del hero. Sí es correcto usar sus logos oficiales (siguiendo sus guías de marca) en contextos funcionales de identificación, como el botón "Conectar WhatsApp" en Configuración — igual que cualquier app usa el logo real de Google en un botón "Iniciar sesión con Google".

---

## 4. Sistema de componentes

Base técnica: **shadcn/ui sobre Radix** (accesibilidad — foco, teclado, ARIA — resuelta de fábrica) estilizado con los tokens de la sección 2. No construyas un sistema de componentes desde cero.

| Componente | Variantes/estados que necesita |
|---|---|
| Botón | primary / secondary / ghost / destructive / link × sm/md/lg × default/hover/active/disabled/loading (con spinner, no solo texto "Cargando...") |
| Input / select / textarea | label siempre visible (nunca solo placeholder), helper text, estado error con mensaje específico |
| Checkbox / toggle / radio | estados checked/unchecked/disabled con foco visible |
| Badge | variante de plan (Emprende/Crece/Escala) y variante de estado/SLA (con ícono + texto, nunca solo color) |
| Card | reposo y hover (para las de pipeline/Kanban) |
| Modal / dialog | overlay, cierre con Esc, foco atrapado dentro |
| Tabla | cabecera fija, cifras con tabular-nums, fila con hover |
| Tabs, tooltip, dropdown, avatar | consistentes con el resto, sin estilos propios sueltos |
| Toast | éxito/error/info, con el mismo verbo que la acción que lo generó |
| Skeleton de carga | para dashboard, bandeja y tablas — nunca un spinner de página completa para cargas parciales |
| Estado vacío | siempre con una acción concreta, nunca solo una ilustración |

---

## 5. Guía por pantalla

- **Landing:** hero de convergencia (sección 3), "cómo funciona" en pasos solo porque el proceso real es secuencial (conectar canal → llega a la bandeja → la IA sugiere o responde → vos decidís), características por módulo con capturas reales, precios leídos del backend, footer simple.
- **Login / Registro / Recuperar contraseña / 2FA:** un solo movimiento de foco por pantalla, Turnstile integrado sin romper el layout, errores específicos.
- **Shell de la app:** sidebar ícono + etiqueta (Dashboard, Bandeja, Pipelines, Clientes, Tickets, Facturación, Configuración), topbar con buscador, campana de notificaciones con contador, menú de usuario, toggle de modo oscuro.
- **Dashboard:** KPIs con cifras grandes en Instrument Sans + tabular-nums, gráficos discretos (sin gradientes de relleno llamativos), densidad alta pero con aire entre secciones.
- **Bandeja omnicanal:** burbuja de cliente, burbuja de agente humano y burbuja de IA con tratamientos visuales distintos — la de IA lleva badge "IA" visible, no solo un color de fondo (esto refleja el campo `es_generado_por_ia` del backend). El chip de canal (sección 2) identifica de un vistazo de dónde llegó cada conversación.
- **Pipelines (Kanban):** tarjeta con nombre, valor (tabular-nums), avatar del agente; el badge de "sin contacto hace 24h/48h" (de la Fase 2/4 del plan de implementación) usa warning/danger con ícono, nunca solo color.
- **Clientes:** ficha unificada con tabs (conversaciones / deals / tickets / notas) en vez de scroll infinito.
- **Tickets:** contador de SLA verde/ámbar/rojo con ícono de reloj, texto del tiempo restante en tabular-nums.
- **Facturación / Configuración:** tabla de uso vs. cuota del plan con barra de progreso, botones de conectar canal con el logo oficial de cada plataforma.

---

## 6. Accesibilidad, responsive y movimiento

- Contraste mínimo AA (4.5:1 en texto de cuerpo) en ambos modos.
- Foco de teclado siempre visible (anillo de 2px en el acento con offset) — nunca `outline: none` sin reemplazo.
- El color nunca es el único mensaje: todo badge de estado/SLA lleva también ícono o texto, para que funcione en escala de grises.
- El Kanban tiene una alternativa accesible por teclado para mover tarjetas entre etapas (no solo arrastrar con mouse).
- `prefers-reduced-motion` respetado: la convergencia del hero y cualquier pulso de SLA tienen versión estática/sin pulso.
- Responsive desde tablet hacia arriba (uso principal es escritorio, según ya definido en el plan de implementación); landing sí responsive completo a mobile.
- Un solo movimiento orquestado por pantalla (la convergencia en el hero); en el resto de la app, movimiento mínimo y funcional — nada de animaciones sueltas decorativas, que es justamente lo que delata a un SaaS armado con IA sin dirección.

---

## 7. Voz y copy

- Verbo activo y específico en cada botón: "Guardar cambios", no "Enviar"; "Conectar WhatsApp", no "Vincular canal".
- El toast de confirmación repite el mismo verbo: acción "Publicar" → toast "Publicado."
- Los nombres se dan desde el lado de quien usa el producto, no desde cómo está construido por dentro: "Notificaciones", no "Webhooks"; "Equipo", no "Usuarios del tenant".
- Estados vacíos como invitación con acción concreta: "Todavía no llegó ningún mensaje. Conectá tu primer canal para empezar" + botón ahí mismo.
- Errores sin disculpas y sin vaguedad: "No pudimos conectar tu cuenta de Instagram. Verificá que sea una cuenta profesional e intentá de nuevo" — nunca "¡Ups, algo salió mal!".

---

## 8. Prompts listos para pegar en Antigravity

### Prompt A — Fundación del sistema de diseño (correr como Fase 1.5, antes de la Fase 2)
```
Lee PROJECT_CONTEXT.md y DESIGN_SYSTEM.md antes de empezar. Antes de construir cualquier pantalla de negocio, arma la base visual de ConectaCRM:

1. Instala y configura shadcn/ui sobre el proyecto React + TypeScript + Tailwind ya existente, usando Radix como base de accesibilidad (foco, teclado, ARIA ya resueltos).
2. Configura el tema de Tailwind con los tokens de la sección "Tokens de diseño" de DESIGN_SYSTEM.md: colores de marca/semánticos/superficie en claro y oscuro, tipografía (Instrument Sans para títulos, IBM Plex Sans para UI/cuerpo, IBM Plex Mono para datos, tabular-nums en cifras alineadas), radios y sombras.
3. Auto-hospeda las tres tipografías vía @font-face, no las cargues desde un CDN externo en cada visita.
4. Construye el set de componentes de la sección "Sistema de componentes": botón, input/select/textarea/checkbox/toggle con estados de error, badge (variantes de plan y de SLA/estado, siempre con ícono o texto además del color), card, modal, tabla con tabular-nums, tabs, tooltip, dropdown, avatar, toast, skeleton de carga, estado vacío.
5. Implementa el modo oscuro como first-class citizen (toggle en el shell), no como un filtro invertido automático.
6. Antes de cerrar esta fase, toma capturas de cada componente en sus distintos estados y compáralas contra el look de "SaaS genérico armado con IA" descrito en la Tesis de diseño (fondo crema + acento terracota; negro + verde ácido único; diario con líneas finas) — si algo se parece demasiado, ajústalo.

No construyas todavía pantallas de negocio (dashboard, pipelines, tickets) — esta fase es solo la base visual reusable.
```
**Verifica antes de seguir:** cada componente tiene sus estados hover/active/disabled/loading visibles (ideal: una página `/design-system` de referencia, solo en desarrollo); el modo oscuro se ve intencional, no invertido.

### Prompt B — Landing page pública
```
Usando el sistema de diseño ya construido, arma la landing pública de ConectaCRM (rutas públicas de la Fase 7 del plan de implementación):

1. Hero: no uses la fórmula "titular + subtítulo + botón + gradiente decorativo de fondo". Construí el concepto de "convergencia" de DESIGN_SYSTEM.md: tres chips pequeños con ícono de mensaje genérico (NO los logos reales de WhatsApp/Instagram/Telegram) en los tonos de canal definidos, que animan entrando desde distintos puntos y confluyen en una sola tarjeta de conversación con el acento de marca, que sostiene el titular. Versión estática equivalente si prefers-reduced-motion está activo.
2. Sección "cómo funciona" en pasos (conectar canal → llega a la bandeja → la IA sugiere o responde → vos decidís).
3. Características por módulo con las capturas reales del producto ya construido (no inventes screenshots).
4. Tabla de precios leyendo el modelo `plans` del backend — una sola fuente de verdad, nunca precios hardcodeados en el frontend.
5. Copy en voz activa y específico, sin frases de relleno genéricas tipo "la mejor solución del mercado".
6. Un solo movimiento orquestado (la convergencia del hero); evitá animaciones sueltas en el resto de la página.
```
**Verifica antes de seguir:** la animación del hero respeta prefers-reduced-motion; los precios coinciden siempre con el backend; nadie confundiría esta landing con una plantilla genérica.

### Prompt C — Autenticación y shell de la app
```
Con el sistema de diseño ya construido, aplicá el diseño a:

1. Login, registro multi-paso, recuperación de contraseña y configuración de 2FA — labels siempre visibles (nunca solo placeholder), errores específicos sin tono de disculpa, Cloudflare Turnstile integrado sin romper el layout.
2. El shell autenticado: sidebar con ícono + etiqueta (Dashboard, Bandeja, Pipelines, Clientes, Tickets, Facturación, Configuración), topbar con buscador, campana de notificaciones con contador, menú de usuario, toggle de modo oscuro.
3. Bandeja omnicanal: diferenciá visualmente mensaje de cliente, de agente humano y de IA (badge "IA" visible en estos últimos, reflejando es_generado_por_ia del backend); el chip de canal identifica de dónde llegó cada conversación.
4. Kanban de pipelines: el badge de "sin contacto hace 24h/48h" usa warning/danger con ícono, nunca solo color.
5. Tickets: el contador de SLA usa los mismos semánticos verde/ámbar/rojo con ícono de reloj, legible incluso en escala de grises.
6. Configuración: los botones de "Conectar WhatsApp/Instagram/Telegram" sí usan el logo oficial de cada plataforma, siguiendo sus guías de marca — acá es identificación funcional, no decoración.
```
**Verifica antes de seguir:** un mensaje de IA se distingue de un vistazo del de un agente humano; el badge de SLA se lee bien desaturando la pantalla (prueba de daltonismo básica); el foco de teclado se ve claro al tabular por el login.

---

## Nota final

Esto es dirección, no un mockup cerrado — dejale a Antigravity margen para resolver el detalle de cada pantalla dentro de estas reglas, y pedile capturas/walkthrough al final de cada prompt para revisar antes de avanzar, igual que con las fases del plan de implementación.
