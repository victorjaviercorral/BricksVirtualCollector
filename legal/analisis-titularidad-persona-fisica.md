---
proyecto: lego-virtual-museum
tipo: analisis-legal
estado: propuesta
version: 1
fecha: 2026-08-10
contexto: prototipo demostrativo, sin actividad comercial, sin usuarios reales
relacionada_con: [ADR-009-entorno-demo-publico, auditoria-arquitectura, auditoria_legal]
tags: [legal, lssi, rgpd, marca]
---

# Análisis de titularidad como persona física y encuadre de prototipo

> **No soy abogado y esto no es asesoramiento jurídico.** Es un análisis de las obligaciones
> aplicables y de cómo completar los documentos con la información que hoy falta. Si el proyecto
> pasa a tener usuarios reales, ingresos o publicidad, el análisis cambia y conviene revisión
> profesional.

## 1. La pregunta

El titular es una **persona física residente en España, sin empresa y sin actividad económica
asociada al proyecto**. Los documentos legales generados asumen un titular empresarial y piden
NIF, domicilio y datos registrales. La pregunta es si puede figurar a título individual y qué
debe rellenar para que los documentos queden completos y coherentes con un prototipo
demostrativo.

**Respuesta corta:** sí, una persona física puede ser titular de un sitio web. No hace falta ser
autónomo ni tener sociedad mientras no haya actividad económica. Y en ese supuesto **no está
obligado a publicar NIF ni domicilio**.

## 2. LSSI-CE: probablemente no aplica, y aun así conviene identificarse

El artículo 10 de la Ley 34/2002 obliga a publicar datos identificativos, pero solo a los
**prestadores de servicios de la sociedad de la información**. El Anexo de la propia ley define
esos servicios como los prestados normalmente **a título oneroso**, y aclara que incluye los no
remunerados por el destinatario **cuando constituyen una actividad económica para el prestador**
(el caso típico es un sitio financiado con publicidad).

Un prototipo de portfolio **sin publicidad, sin venta, sin patrocinio, sin donaciones y sin
monetización de datos** no es actividad económica. Bajo esa lectura, el artículo 10 no le aplica.

**Matiz honesto:** un portfolio profesional sirve indirectamente para atraer oportunidades
laborales, y hay quien sostiene que eso lo acerca a la actividad económica. Es un debate que no
merece la pena tener: identificarse voluntariamente cuesta cero y lo cierra.

**Postura recomendada:** identificarse como persona física con **nombre y correo de contacto, y
nada más**.

| Dato | Qué hacer | Por qué |
|---|---|---|
| Nombre y apellidos | **Incluir** | Ya figura públicamente en el footer y en el repositorio de GitHub. Genera confianza y es el dato que hace de contacto. |
| Correo electrónico | **Incluir** | Único canal necesario para contacto y para ejercicio de derechos. Conviene una dirección dedicada, no la personal principal. |
| NIF | **Omitir** | Dato personal identificativo cuya publicación no es exigible a un particular sin actividad económica. Publicarlo es un riesgo innecesario de suplantación. |
| Domicilio | **Omitir** | Es el domicilio particular. Desproporcionado y desaconsejable. Si en el futuro hubiera obligación, se sustituye por un domicilio a efectos de notificaciones. |
| Datos registrales / colegio profesional | **Eliminar el apartado** | No aplica: no hay sociedad ni colegiación. |
| Ciudad para jurisdicción | **Incluir** (Málaga, según el footer — **confirmar**) | Cierra la cláusula de `terminos-condiciones.md:34`. |

## 3. El encuadre de prototipo: qué hay que decir y dónde

La forma de que "quede completo pero se entienda que es demostrativo" no es dejar huecos, sino
**declararlo explícitamente**. Propuesta de texto, a insertar como primer bloque de los cinco
documentos servidos en `/legal/*` y también como aviso visible en la aplicación:

> **Aviso de prototipo.** Este sitio es un prototipo de demostración técnica con fines de
> portfolio. No es un producto comercial: no ofrece servicios de pago, no muestra publicidad y no
> admite el registro de nuevos usuarios. Las vitrinas, colecciones y perfiles que se muestran son
> ficticios y han sido creados para la demostración. La plataforma está preparada para operar con
> usuarios reales, pero ese paso no se ha dado.

Ese párrafo hace cuatro cosas a la vez: sostiene el argumento de no-actividad-económica del punto
2, explica la ausencia de NIF sin que parezca un olvido, gestiona la expectativa del visitante que
llega desde una red profesional, y es cierto.

## 4. RGPD con el registro cerrado (ADR-009)

Sin registro no hay cuentas, y sin cuentas no hay datos personales de terceros. Pero **la
exención doméstica del art. 2.2.c RGPD no cubre un sitio web público**, así que no se puede
invocar. Lo que sí queda es un tratamiento mínimo y perfectamente declarable:

| Qué se trata | Quién | Base jurídica | Estado |
|---|---|---|---|
| IPs y logs de acceso | Vercel (hosting) como encargado | Interés legítimo (seguridad y funcionamiento) | Declarar proveedor y retención |
| IPs y logs de base de datos | Supabase como encargado | Interés legítimo | Declarar proveedor y **ubicación** |
| Tabla `system_logs` propia | Titular | Interés legítimo | Declarar retención (el runbook interno ya habla de purga a 30 días) |
| Cookie de sesión de la cuenta demo | Titular | Técnica, exenta de consentimiento | Ya documentado correctamente |

**El único punto que no puedo resolver desde el repositorio y que sí importa:** dónde está alojado
el proyecto de Supabase. Si está en la UE, basta con nombrarlo. Si está en EE.UU., hay
transferencia internacional y hay que mencionar el marco de adecuación aplicable. Es el
`⚠️ PENDIENTE` de `data-map.md:49` y es el que tiene consecuencias reales. **Requiere que lo
compruebes en el panel de Supabase.**

Con eso, `politica-privacidad.md` se puede reescribir en una versión corta y verdadera: no se
recogen datos personales de visitantes más allá de los logs técnicos de los proveedores, no hay
formularios, no hay newsletter, no hay analítica.

## 5. Cookies: nada que cambiar de fondo

`politica-cookies.md` es el único documento que resiste la revisión. Declara solo cookies técnicas
(sesión de Supabase y preferencia de tema) y concluye correctamente que están **exentas de
consentimiento** por el art. 22.2 LSSI, por lo que **no hace falta banner**.

Verificado además un punto que parecía un error y no lo es: el documento afirma que las
tipografías se alojan en servidor propio y que no se usa Google Fonts. `src/app/layout.tsx:2` sí
importa de `next/font/google`, pero esa API **descarga las fuentes en tiempo de build y las sirve
desde el propio dominio**, sin ninguna petición a Google desde el navegador del visitante. La
afirmación es correcta y no debe "corregirse".

Solo falta la fecha. Si en algún momento se añade analítica (Vercel Analytics incluida), hay que
volver aquí y añadir banner de consentimiento.

## 6. Marca LEGO: el riesgo real, y una decisión que conviene tomar ahora

Es el punto que escalaría por encima del resto, porque es el único con un tercero con capacidad e
histórico de hacer valer sus derechos.

**Situación actual:**

- El proyecto se **llama** "Lego Virtual Museum": la marca está en el nombre del producto, no solo
  en la descripción. Es la posición más débil posible.
- Conviven **tres nombres distintos** en la misma pantalla (hallazgo C4): "Lego Virtual Museum" en
  el `<title>`, "Lego Virtual / Collector Community" en el Navbar y "VirtualCollector" en el
  Footer.
- El disclaimer existe en `politica-propiedad-intelectual.md:6` pero **no aparece de forma
  visible** en la interfaz, pese a que `auditoria_legal.md:11` lo exige expresamente (hallazgo D3).

**Las directrices de uso justo del titular de la marca** piden, en esencia: usar el término como
adjetivo y nunca como sustantivo ni en plural ("piezas LEGO®", no "unos legos"), acompañarlo del
símbolo ®, y no sugerir afiliación, patrocinio ni aval. Un uso descriptivo de ese tipo es defendible.
Usar la marca **en el nombre del proyecto** lo es bastante menos.

**Recomendación: renombrar ahora.** "VirtualCollector" ya está en el footer, no toca ninguna marca
ajena, y el cambio resuelve tres cosas de una vez: la exposición de marca, la triple identidad
(C4) y la ausencia de disclaimer (D3). El coste hoy es bajo — 13 commits, cero usuarios, sin
dominio comprometido — y crece con cada semana de vida pública. La marca LEGO® pasa a la línea
descriptiva:

> VirtualCollector — Museo virtual para coleccionistas de LEGO®
> Proyecto independiente sin ánimo de lucro. No afiliado, patrocinado ni avalado por The LEGO
> Group. LEGO® es una marca registrada de The LEGO Group.

Esa línea, en el footer y visible en todas las páginas, cierra D3.

**Si se decide mantener el nombre actual**, la mitigación mínima es el mismo disclaimer visible,
asumiendo que el nombre sigue siendo el punto débil y que habrá que revisarlo antes de cualquier
uso comercial.

> Esta decisión es un requisito previo de las tareas de textos legales, README y disclaimer: el
> nombre aparece en los cinco documentos y en la interfaz. Decidirlo después obliga a rehacer el
> trabajo.

## 7. Resumen de acciones

| # | Acción | Bloqueada por |
|---|---|---|
| L1 | **Decidir el nombre del proyecto** (renombrar a VirtualCollector o mantener) | Decisión del titular |
| L2 | Confirmar ciudad para la cláusula de jurisdicción | Decisión del titular |
| L3 | Comprobar la región del proyecto de Supabase (UE / EE.UU.) | Acceso al panel de Supabase |
| L4 | Crear correo de contacto dedicado | Decisión del titular |
| L5 | Insertar el aviso de prototipo en los 5 documentos servidos y en la interfaz | L1 |
| L6 | Reescribir `aviso-legal.md`: nombre + email, eliminar NIF, domicilio y apartado registral | L1, L4 |
| L7 | Reescribir `politica-privacidad.md` en versión "sin registro": encargados, base jurídica, retención, canal de derechos | L1, L3, L4 |
| L8 | Completar fechas en los 5 documentos y cerrar la jurisdicción | L1, L2 |
| L9 | Añadir el disclaimer de marca visible en el Footer | L1 |
| L10 | Actualizar `data-map.md` con proveedores, ubicación y retenciones reales | L3 |

Tras L5–L10, `grep -c "PENDIENTE\|REQUIERE VALIDACIÓN" legal/*.md` debe devolver 0 en los cinco
documentos servidos por `/legal/[slug]`.
