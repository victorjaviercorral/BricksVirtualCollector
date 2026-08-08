# Plan de Implementación Legal (Fases 2 y 3)

Este plan detalla las tareas técnicas y de gobierno necesarias para llevar el proyecto al pleno cumplimiento normativo antes y después de su publicación.

## Fase 2 — Implementación Técnica

Esta fase traduce los requisitos legales a código y configuración en el repositorio.

| Tarea | Descripción | Norma / Artículo | Bloqueante para Publicar | Esfuerzo | Criterio de "Hecho" | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P2.1. Consentimiento de Registro** | Añadir checkbox explícito, **no premarcado**, en el formulario de registro: "He leído y acepto la Política de Privacidad y los Términos". Guardar versión y fecha en DB. | Art. 7 RGPD (Consentimiento) | 🔴 SÍ | Medio | La tabla `usuarios_perfil` guarda `consentimiento_version` y `fecha` al registrar. | Ninguna |
| **P2.2. Enlaces Legales en Footer** | Crear un footer global que enlace a: Política de Privacidad, Política de Cookies, Aviso Legal, Términos y Condiciones, Política de PI. | Art. 10 LSSI-CE, Art. 13 RGPD | 🔴 SÍ | Bajo | Todas las páginas tienen enlaces funcionales y visibles a los documentos legales. | Fase 1 completada |
| **P2.3. Ejercicio de Derechos** | Implementar un botón o proceso claro en "Perfil" para **eliminar cuenta** permanentemente. Debe borrar al usuario en Auth y hacer borrado en cascada (cascade delete) de vitrinas y fotos (Right to be Forgotten). | Art. 17 RGPD (Supresión) | 🔴 SÍ | Medio | Un clic en "Eliminar Cuenta" borra filas de DB y el usuario en Auth. | Ninguna |
| **P2.4. Banner de Cookies** | Si decides añadir analítica (Google Analytics, PostHog), crear un banner de consentimiento con botón "Rechazar Todas" tan visible como "Aceptar Todas". (Si mantienes solo cookies técnicas, NO ES NECESARIO banner). | AEPD Guía Cookies | 🟡 NO (Si no hay analítica) | Medio | Bloqueo efectivo de scripts no esenciales antes del clic. | Decisión de incluir analítica |
| **P2.5. Cabeceras de Seguridad** | Configurar `next.config.ts` para enviar cabeceras HTTP de seguridad (CSP, X-Frame-Options, HSTS). | Art. 32 RGPD (Seguridad) | 🟢 Recomendable | Bajo | Análisis de seguridad HTTP sin warnings graves. | Ninguna |

---

## Fase 3 — Gobierno y Mantenimiento

Esta fase comprende los procesos internos del titular para mantener la legalidad en el tiempo.

| Tarea | Descripción | Norma / Artículo | Bloqueante para Publicar | Esfuerzo | Criterio de "Hecho" | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P3.1. DPA con Proveedores** | Asegurar que se firman o aceptan electrónicamente los Acuerdos de Encargado de Tratamiento (Data Processing Addendum - DPA) con Supabase y el Hosting (Netlify/Vercel). | Art. 28 RGPD | 🔴 SÍ | Bajo | Copia o registro de aceptación del DPA en la consola de Supabase/Hosting. | Elección de Hosting |
| **P3.2. Registro de Actividades** | Mantener el *Data Map* (Fase 0) como documento vivo actualizado cada vez que se añada una funcionalidad nueva que trate datos. | Art. 30 RGPD | 🔴 SÍ | Continuo | Documento en el repo alineado con el código. | Ninguna |
| **P3.3. Protocolo Brechas Seguridad** | Redactar un pequeño procedimiento interno en caso de hackeo o fuga de datos (notificar a AEPD en <72h y a los usuarios). | Art. 33 y 34 RGPD | 🔴 SÍ | Bajo | Documento de 1 página con pasos a seguir y link a sede AEPD. | Ninguna |
| **P3.4. Versionado Legal** | Mantener los archivos `.md` de la carpeta `legal/` en control de versiones (Git) para poder demostrar qué texto exacto estaba publicado en una fecha concreta. | Principio de Proactividad RGPD | 🟢 Recomendable | Bajo | Historial de git refleja los cambios en textos legales. | Ninguna |

---

## [REQUIERE VALIDACIÓN JURÍDICA] - Evaluaciones Adicionales

- **Art. 35 RGPD (Evaluación de Impacto):** *NO REQUERIDA.* No se tratan datos sensibles a gran escala, ni se elaboran perfiles automatizados que produzcan efectos jurídicos.
- **Art. 37 RGPD (Delegado de Protección de Datos - DPD):** *NO REQUERIDO.* El responsable no es una autoridad pública, ni el tratamiento principal consiste en seguimiento sistemático de interesados a gran escala, ni se tratan datos especiales (salud, penales).
- **Accesibilidad:** Como iniciativa privada (asumiendo que no tiene gran volumen de facturación aún), no se aplican los requisitos más estrictos del sector público, pero se recomienda seguir WCAG 2.1 AA por buenas prácticas.
- **Comercio / Consumidores:** Como no hay ventas ni suscripciones, no aplican obligaciones de la Ley General de Defensa de los Consumidores y Usuarios relativas al comercio electrónico (desistimiento, envíos).
