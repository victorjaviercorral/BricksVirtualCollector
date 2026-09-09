# Política de Privacidad

**Última actualización:** 9 de septiembre de 2026

> **Aviso de prototipo.** Este sitio es un prototipo de demostración técnica con fines de
> portfolio, sin actividad económica asociada. Ofrece tres formas de acceso:
> **(1) visitante** sin sesión, que solo navega contenido público; **(2) modo invitado**, una
> sesión anónima sin registro ni email (ver la sección "Modo invitado" más abajo); y
> **(3) cuenta registrada** con correo electrónico. Solo la tercera implica el tratamiento de un
> dato personal identificable (el email); el resto se limita a datos técnicos inherentes a
> servir una página web.

En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y de la Ley Orgánica 3/2018 (LOPDGDD), se
informa de lo siguiente.

## 1. Responsable del Tratamiento

- **Titular:** Víctor Javier Corral (persona física, sin actividad económica asociada al sitio).
- **Canal de contacto y ejercicio de derechos:** a través del repositorio del proyecto en GitHub
  ([abrir una incidencia](https://github.com/victorjaviercorral/BricksVirtualCollector/issues)) o del
  perfil profesional de LinkedIn del titular.

No se publican NIF ni domicilio particular: véase la justificación en el
[Aviso Legal](aviso-legal.md) §1.

## 2. Datos que se tratan, finalidad y legitimación (Art. 6 RGPD)

| Finalidad | Datos tratados | Base jurídica | Conservación |
| :--- | :--- | :--- | :--- |
| **Servir la página y mantener la seguridad** | Dirección IP, User-Agent y metadatos de la petición, registrados automáticamente por los proveedores de infraestructura. | **Interés legítimo** (art. 6.1.f): funcionamiento y seguridad de la red. | Según la política de retención de cada proveedor. |
| **Diagnóstico de errores** | Mensajes de error, ruta afectada y marca temporal, en la tabla propia `system_logs`. | **Interés legítimo**: detectar y corregir fallos. | 30 días. |
| **Mantener la sesión (invitado o cuenta)** | Cookie técnica de sesión emitida por Supabase Auth. | **Necesaria para prestar el servicio solicitado** (art. 22.2 LSSI: exenta de consentimiento). | Hasta cierre de sesión o caducidad del token. |
| **Modo invitado: recorrer la plataforma** | Un identificador de sesión anónimo (sin email) y el contenido que crees durante la sesión (vitrinas, sets, imágenes, votos). Nunca es público. | **Ejecución de la interacción solicitada** por ti al entrar (art. 6.1.b analógico). | **48 horas** desde el último acceso; después se borra por completo de forma automática. |
| **Cuenta registrada: gestión de la cuenta y del contenido** | Correo electrónico, contraseña cifrada, alias, contenido publicado. | **Ejecución de contrato** (Términos) y, para publicar contenido, **consentimiento**. | Hasta que elimines la cuenta. |

**No se realiza** ninguna de las siguientes actividades: formularios de contacto, newsletter,
publicidad, analítica web, elaboración de perfiles, decisiones automatizadas ni venta o cesión de
datos a terceros.

### 2.1 Modo invitado

El modo invitado permite recorrer toda la plataforma **sin registrarte y sin dar tu correo**.

- **No se te pide ningún dato personal.** La sesión se identifica con un identificador anónimo
  generado por Supabase. No hay email, nombre ni contraseña.
- **Qué se guarda:** únicamente el contenido que tú crees durante la sesión (vitrinas, sets,
  imágenes que subas, votos, retos reclamados). Las imágenes se limpian de metadatos EXIF
  (incluida la geolocalización) antes de almacenarse.
- **Nunca es público:** el contenido creado en modo invitado no aparece en la galería, los
  perfiles públicos ni ninguna otra superficie visible para terceros.
- **Cuánto dura:** la sesión de invitado y todo su contenido se **eliminan automáticamente y por
  completo a las 48 horas** del último acceso. No conservamos ninguna copia.
- **No hay tratamiento de datos personales de terceros:** al no ser público el contenido, un
  invitado no puede exponer datos de otras personas.
- **Si quieres conservar lo que has creado**, puedes crear una cuenta con tu correo; en ese
  momento —y solo entonces— empieza el tratamiento descrito para las cuentas registradas, y se
  te solicitará el consentimiento correspondiente.

Al entrar en modo invitado aceptas los [Términos y Condiciones](terminos-condiciones.md); no se
solicita consentimiento de privacidad porque no hay tratamiento de datos personales que lo
requiera.

## 3. Destinatarios y Proveedores (Encargados del Tratamiento, Art. 28 RGPD)

- **Base de datos y autenticación:** Supabase. Proyecto alojado en **Frankfurt (Alemania, Unión
  Europea)**.
- **Alojamiento web:** Vercel. Servidores en la Unión Europea.

**No se realizan transferencias internacionales de datos fuera del Espacio Económico Europeo.**

Las tipografías del sitio se sirven desde el propio dominio: se descargan e incorporan en el
proceso de compilación, por lo que **no se envía tu dirección IP a Google Fonts** ni a ningún otro
servicio externo durante la navegación.

## 4. Menores de edad

El sitio está dirigido a un público adulto. Para crear una cuenta declaras ser mayor de 14 años
(art. 7 LOPDGDD). El modo invitado no recoge ningún dato personal, de una persona menor o adulta.

## 5. Tus derechos

Puedes ejercer en cualquier momento tus derechos de **acceso, rectificación, supresión,
limitación, oposición y portabilidad**, a través de cualquiera de los canales indicados en la
sección 1.

> **Nota sobre el canal de contacto.** El canal principal es público (incidencias de GitHub). Si
> tu solicitud incluyera información que no deseas hacer pública, utiliza el canal privado de
> LinkedIn. Para el modo invitado y la navegación como visitante, más allá de los logs técnicos
> de los proveedores no hay datos propios sobre los que ejercer estos derechos; para una cuenta
> registrada, puedes ejercerlos sobre tu email y tu contenido, o eliminar la cuenta desde tus
> ajustes (borrado inmediato y en cascada de todo tu contenido).

Asimismo, tienes derecho a presentar una reclamación ante la **Agencia Española de Protección de
Datos (AEPD)**, [www.aepd.es](https://www.aepd.es), si consideras que el tratamiento no se ajusta
a la normativa vigente.

## 6. Cambios en esta política

Si el proyecto incorporara analítica, publicidad, verificación de edad u otras funcionalidades
que impliquen un tratamiento de datos personales distinto del descrito aquí, esta política se
actualizará **antes** de dicho cambio y, cuando proceda, se solicitará el consentimiento
correspondiente. La versión de los términos aceptada por cada cuenta registrada se conserva junto
con la fecha (`usuarios_perfil.consentimiento_version`).
