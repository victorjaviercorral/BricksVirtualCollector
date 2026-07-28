# Contexto de este repositorio

## Qué es este repo

Este es el repo del proyecto **LegoVirtualMuseum** (remoto: `victorjaviercorral/LegoVirtualMuseum`). Contiene la documentación del piloto en `docs/` y, más adelante, su código.

**A pesar del nombre de la carpeta contenedora ("Spec VJC framework"), aquí NO vive el framework.** El nombre es histórico y engañoso.

## Frontera con el Spec VJC Framework

El framework es un repo **separado e independiente**:

| | |
|---|---|
| Repo | `victorjaviercorral/spec-vjc-framework` |
| Clon de trabajo | `C:\Users\victo\OneDrive\Documentos\GitHub\spec-vjc-framework` |
| Instalado como plugin | `.claude/plugins/` (gestionado por Claude Code, no editar a mano) |

**Reglas de sesión, no negociables:**

1. **Desde este repo NO se modifica el framework.** Ni sus comandos, ni su constitution, ni sus plantillas. Si el trabajo en el piloto revela una mejora del framework, se anota como propuesta en `docs/08-retros/` y se ejecuta en **otra sesión abierta sobre el clon del framework**.
2. **Desde el repo del framework NO se modifica el piloto.** Misma regla en espejo.
3. **Prohibido crear copias del framework dentro de este repo.** Si necesitas leer los comandos o la constitution, léelos desde el clon de `Documentos\GitHub\spec-vjc-framework` o desde el plugin instalado. Nunca copies el árbol aquí dentro.

## Antes de citar cualquier archivo del framework

La versión viva del framework es la del **remoto**, no la de ninguna copia local. Antes de diagnosticar, citar líneas o proponer cambios sobre archivos del framework:

```bash
git -C "C:/Users/victo/OneDrive/Documentos/GitHub/spec-vjc-framework" fetch origin
git -C "C:/Users/victo/OneDrive/Documentos/GitHub/spec-vjc-framework" status -sb
```

Si aparece `behind`, haz `pull` **antes** de leer nada. Señal de contraste rápida: las descripciones de las skills `spec-vjc-framework:*` cargadas en la sesión reflejan el remoto — si mencionan comandos que no encuentras en los archivos que estás leyendo (`go-live`, `preflight`, `sync-check`, `amend`), estás leyendo una copia obsoleta y debes parar.

**Por qué existe esta sección:** el 28-jul-2026 se hizo un diagnóstico completo y un rediseño de la fase de definición contra una copia local del framework congelada dos días atrás. El trabajo entero quedó apoyado en citas de línea y numeración de constitution ya inexistentes, y hubo que descartarlo. El coste fue una sesión completa.

## Estado del piloto

Ver `docs/00-proyecto/project.md` para tier, stack, appetite y criterios de parada. Etapa actual y siguiente paso se declaran ahí, no aquí.
