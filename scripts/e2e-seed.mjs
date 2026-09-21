// Siembra el proyecto de Supabase de PRUEBAS del E2E de invitado (Fase 9, ADR-011).
// Idempotente: borra la semilla previa del usuario museo y la recrea.
// NUNCA contra producción: exige E2E_SUPABASE_URL y se niega si coincide con la de .env.local.
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.E2E_SUPABASE_URL;
const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan E2E_SUPABASE_URL y/o E2E_SUPABASE_SERVICE_ROLE_KEY. Ver docs/testing/e2e-invitado.md');
  process.exit(1);
}
if (existsSync('.env.local')) {
  const prod = readFileSync('.env.local', 'utf8').match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  if (prod && prod === url) {
    console.error('E2E_SUPABASE_URL coincide con la URL de producción de .env.local. Abortado.');
    process.exit(1);
  }
}

const seed = JSON.parse(readFileSync(new URL('../e2e/seed-data.json', import.meta.url), 'utf8'));
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const ok = (res, what) => { if (res.error) { console.error(`✖ ${what}:`, res.error.message); process.exit(1); } return res.data; };

// 1. Usuario museo (se recrea para partir siempre del mismo estado)
const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
const previo = lista.users.find((u) => u.email === seed.museo.email);
if (previo) ok(await admin.auth.admin.deleteUser(previo.id), 'borrar museo previo');
const museo = ok(await admin.auth.admin.createUser({ email: seed.museo.email, password: seed.museo.password, email_confirm: true }), 'crear museo').user;
ok(await admin.from('usuarios_perfil').update({ alias: seed.museo.alias }).eq('id', museo.id), 'alias museo');

// 2. Vitrinas públicas con sets y foto
const setIds = {};
for (const v of seed.vitrinas) {
  const vit = ok(await admin.from('vitrinas').insert({ usuario_id: museo.id, nombre: v.nombre, estado: 'publicada', visibilidad: 'pública' }).select().single(), `vitrina ${v.nombre}`);
  for (const nombre of v.sets) {
    const s = ok(await admin.from('sets').insert({ vitrina_id: vit.id, usuario_id: museo.id, nombre, tematica: v.tematica, num_piezas: 500 }).select().single(), `set ${nombre}`);
    ok(await admin.from('fotos').insert({ set_id: s.id, url: '/hero-vitrina.svg', orden: 0 }), `foto ${nombre}`);
    setIds[nombre] = s.id;
  }
}

// 3. Bounty pendiente (se limpian los E2E previos)
await admin.from('bounties').delete().eq('nombre_set', seed.bounty.nombre_set);
ok(await admin.from('bounties').insert({ ...seed.bounty, estado: 'pendiente' }), 'bounty');

// 4. Exposición activa continua con un set aprobado
await admin.from('exposiciones_temporales').delete().eq('titulo', seed.exposicion.titulo);
const expo = ok(await admin.from('exposiciones_temporales').insert({ titulo: seed.exposicion.titulo, descripcion: seed.exposicion.descripcion, estado: 'activa', es_continua: true }).select().single(), 'exposición');
ok(await admin.from('exposicion_sets').insert({ exposicion_id: expo.id, set_id: setIds[seed.exposicion.setAprobado], estado: 'aprobado' }), 'set aprobado');

console.log(`✔ Semilla E2E lista: ${seed.vitrinas.length} vitrinas, 1 bounty, 1 exposición activa (museo ${museo.id}).`);
