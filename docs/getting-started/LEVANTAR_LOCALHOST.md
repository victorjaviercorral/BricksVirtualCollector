# Levantar el proyecto en local

Guía rápida para arrancar BricksVirtualCollector en tu máquina sin depender de un agente.

## 1. Requisitos previos (una sola vez)

- **Node.js** instalado. Comprueba la versión:
  ```bash
  node -v
  npm -v
  ```
  Este proyecto se ha probado con Node 24.x. Cualquier versión reciente (≥ 18) debería funcionar.

- **Dependencias instaladas.** Desde la raíz del repo:
  ```bash
  npm install
  ```
  Solo hace falta repetirlo cuando cambie `package.json` / `package-lock.json`.

- **Variables de entorno.** El proyecto necesita un fichero `.env.local` en la raíz con las
  credenciales de Supabase. Si no lo tienes, cópialo desde la plantilla y rellénalo:
  ```bash
  cp .env.example .env.local
  ```
  Como mínimo necesita:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
  (Y `SUPABASE_SERVICE_ROLE_KEY` si vas a probar flujos que la usan: subida de fotos, borrado de
  cuenta, recompensas de bounties — ver `.env.example` para la lista completa.)

## 2. Arrancar el servidor de desarrollo

Desde la raíz del repo:

```bash
npm run dev
```

Verás algo como:

```
▲ Next.js 16.x (Turbopack)
- Local:         http://localhost:3000
✓ Ready in 630ms
```

Abre **http://localhost:3000** en el navegador. Los cambios en el código se recargan solos
(Hot Reload) — no hace falta reiniciar el servidor salvo que cambies `next.config.ts`,
`vitest.config.ts` o instales una dependencia nueva.

Para parar el servidor: `Ctrl+C` en la terminal donde está corriendo.

## 3. Comandos habituales mientras trabajas

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción (lo que se despliega) |
| `npm run start` | Sirve el build de producción ya generado (`npm run build` antes) |
| `npx tsc --noEmit` | Comprueba tipos sin generar ficheros |
| `npm test` | Ejecuta la suite de tests una vez |
| `npm run test:watch` | Tests en modo watch (se re-ejecutan al guardar) |
| `npm run test:coverage` | Tests + informe de cobertura (`coverage/coverage-summary.json`) |
| `npm run lint:ci` | Lint contra el baseline de errores permitidos |

## 4. Problemas típicos

- **Puerto 3000 ocupado** (otro `npm run dev` sigue corriendo, o una sesión de agente lo dejó
  abierto): Next arranca automáticamente en el 3001 y te lo dice en la salida. Si prefieres
  liberar el 3000, busca y mata el proceso:
  ```bash
  # Windows (PowerShell)
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

  # Git Bash / WSL
  lsof -i :3000
  kill <PID>
  ```

- **Pantalla en blanco o error de Supabase al cargar** — casi siempre falta `.env.local` o tiene
  credenciales incorrectas. Confirma que las dos variables `NEXT_PUBLIC_SUPABASE_*` están
  rellenas y son las del proyecto correcto.

- **`npm install` falla o hay errores raros tras un `git pull`** — borra `node_modules` y
  `.next` y reinstala:
  ```bash
  rm -rf node_modules .next
  npm install
  ```

## 5. Nota sobre este documento

Este proyecto ya tiene un `.claude/launch.json` que permite a un agente de Claude Code levantar
el servidor con la herramienta de preview integrada (mismo comando: `npm run dev`, puerto 3000).
Esta guía es el equivalente para hacerlo tú mismo desde la terminal, sin pasar por un agente.
