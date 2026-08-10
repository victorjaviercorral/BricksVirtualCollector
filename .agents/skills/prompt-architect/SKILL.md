---
name: prompt-architect
description: >-
  Mejora y diseña prompts para Gemini y Antigravity aplicando las técnicas oficiales de prompt engineering.
  Úsala SIEMPRE que el usuario pegue un prompt-borrador y pida mejorarlo, revisarlo, darle feedback u optimizarlo;
  cuando pida ayuda para escribir un prompt desde cero; cuando pregunte "cómo le pido esto a Gemini/Antigravity", 
  "cómo estructuro este prompt", "revisa este prompt" o quiera crear un system prompt / plantilla reutilizable. 
  Actívala también si menciona "prompt engineering", "ingeniería de prompts" o el coste en tokens de un prompt.
  NO la uses para crear o revisar skills completas (para eso están las guías de Antigravity).
---

# Prompt Architect

## Qué hace esta skill

Diagnostica un prompt-borrador (o una petición de "ayúdame a escribir un prompt para...") y lo reescribe aplicando
solo las técnicas de prompt engineering que la tarea realmente necesita — ni más (gasta tokens y a veces empeora
el resultado) ni menos (deja el prompt ambiguo).

## Principio rector

La pregunta no es "¿qué técnicas aplico?" sino "¿qué necesita ESTA tarea?". Un prompt de una línea para pedir un
resumen no necesita rol, ni XML, ni ejemplos — añadirlos es ruido y coste sin beneficio. Un prompt para preparar
una entrevista, una auditoría o un framework estratégico sí se beneficia de contexto, criterios concretos y, a
veces, razonamiento explícito.

Importante: Las etiquetas XML y el role-prompting extenso se recomiendan usar con criterio. Usarlos por defecto para todo es una práctica innecesaria, reserva el XML para estructurar entradas complejas, varios documentos o tipos de contenido mezclados.

## Flujo de trabajo

### Paso 1 — Diagnóstico rápido

Antes de tocar nada, comprueba:

- ¿El objetivo y el resultado esperado quedan claros para alguien sin contexto previo? Regla de oro: si un colega
  sin contexto se confundiría siguiendo esas instrucciones, el agente también.
- ¿Hay superlativos vagos sin criterios objetivos? ("que impresione", "un game changer", "muy riguroso") —
  tradúcelos a criterios verificables.
- ¿Se mezclan varias tareas o niveles en el mismo mensaje? (p. ej. una instrucción de rol permanente junto con
  una petición puntual)
- ¿Falta el formato de salida, la superficie destino (Antigravity IDE / Gemini Web / API) o el "para qué" de la tarea?

### Paso 2 — Clasifica el nivel

| Nivel | Cuándo | Qué aplicar |
|---|---|---|
| **A — Directo** | Un solo paso, resultado objetivamente verificable (resumir, traducir, formatear, pregunta puntual) | Claridad + especificidad. Nada más. |
| **B — Estándar** | Varios requisitos (audiencia, restricciones, formato) pero sin ambigüedad estructural | Claridad + contexto/motivo ("por qué importa") + formato de salida exacto. Un ejemplo solo si el formato es difícil de describir en palabras. |
| **C — Alto valor / reutilizable** | Entregables con impacto real, tareas que se repetirán, análisis estratégicos complejos | Todo lo de B + criterios medibles en vez de superlativos + razonamiento explícito o fases si hay decisiones encadenadas + permiso para pedir aclaración si el coste de error es alto + XML **solo** si hay varios documentos o tipos de contenido mezclados. |

Técnicas transversales por nivel:

| Técnica | A | B | C |
|---|---|---|---|
| Claridad y especificidad | Sí | Sí | Sí |
| Contexto / motivo | No | Sí | Sí |
| Ejemplos (empezar con uno) | No | Solo si el formato lo exige | Sí, si hay patrón que fijar |
| Etiquetas XML | No | No | Solo multi-documento/estructurado |
| Rol (una frase máx.) | No | Opcional | Opcional — nunca personas elaboradas |
| Razonamiento explícito / fases | No | No | Sí, si hay decisiones encadenadas |
| Permiso para pedir aclaración | No | Opcional | Sí, si un error es costoso |
| Encadenar prompts | No | No | Sí, si hay fases separables con validación |

Si dudas entre dos niveles, elige el más bajo y ofrece profundizar después — es más barato añadir una técnica que
quitarla de un prompt inflado.

### Paso 3 — Reescribe

- Cambia mandatos genéricos ("sé riguroso") por verificaciones accionables ("antes de entregar, comprueba que
  cada cifra tiene fuente citada").
- Da el motivo detrás de una restricción, no solo la restricción ("prefiero prosa porque..." en vez de "nunca
  uses bullets"). Formula en positivo (qué SÍ quieres) antes que en negativo.
- Preserva los patrones que el usuario ya usa bien: confirmación antes de cambios grandes, coste en tokens como
  restricción, permiso para preguntar antes de empezar.

### Paso 4 — Entrega

Por defecto (modo rápido):

1. **Prompt mejorado** en bloque de código, listo para copiar.
2. Una sola línea: nivel aplicado (A/B/C), superficie asumida, y resumen de cambios en máximo 15 palabras.

No preguntes si quiere explicación. Solo ofrece profundidad ("puedo detallarte qué cambié y por qué") cuando el
cambio fue estructural: nivel C, cambio de nivel respecto a lo que el usuario pedía, o reescritura de más del 50%
del prompt. Si el usuario pide profundidad, explica en 3-5 bullets qué técnica se aplicó y por qué, con
comparación aproximada de longitud antes/después.

**Usos sucesivos en la misma conversación:** entrega solo el prompt mejorado y la línea de resumen. Omite
cualquier repetición de nivel/superficie si no han cambiado.

### Ajustes por superficie

- **Gemini Web:** aclara si el resultado esperado es documento, tabla o respuesta conversacional.
- **Antigravity IDE / CLI:** pide acción explícita ("implementa X", "edita el archivo Y", no "¿podrías sugerir X?"). Si hay fases claras, divide
  en sub-prompts encadenados o solicita al agente que diseñe un plan de implementación.

## Ejemplo completo (nivel B)

**Usuario pega:** "Escribe un email para mi jefe pidiendo teletrabajo, que sea muy convincente y profesional,
no quiero que suene desesperado, hazlo perfecto."

**Diagnóstico:** superlativos vagos ("muy convincente", "perfecto"), falta contexto (motivo del teletrabajo,
relación con el jefe, cuántos días), falta formato (longitud, tono, canal).

**Entrega:**

```text
Escribe un email a mi jefe pidiendo teletrabajar 2 días por semana (martes y jueves).
 
Contexto: llevo 3 años en la empresa con buenas evaluaciones; el motivo es reducir 90 min diarios de
desplazamiento y ganar foco en tareas de concentración. Mi jefe valora datos y brevedad.
 
Requisitos:
- Máximo 150 palabras, tono profesional y directo.
- Incluye una propuesta de prueba de 1 mes con revisión posterior — eso reduce la sensación de riesgo.
- Cierra proponiendo una conversación breve, no exigiendo una respuesta.
```

Nivel B, Gemini Web. Cambios: superlativos → criterios verificables; añadido contexto, motivo y formato.

## Casos límite

- **Usuario pide mejorar un prompt pero no lo pega:** pídelo antes de hacer nada; no inventes un borrador.
- **Prompt en otro idioma:** mejóralo en su idioma original; responde tú en el idioma de la conversación.
- **El "prompt" es en realidad una skill (SKILL.md):** Redirige a las directrices de creación de skills de Antigravity si es necesario.
- **El usuario pregunta por una técnica que no está en esta skill:** Usa tus conocimientos sobre las mejores prácticas de prompt engineering para modelos actuales.

## Errores a evitar

- Mezclar instrucción de rol permanente y tarea puntual en el mismo mensaje — sepáralos.
- Énfasis emocional en mayúsculas ("es CRÍTICO") en vez de criterios de verificación accionables.
- Aplicar la misma checklist de técnicas sin mirar la complejidad real de la tarea.
