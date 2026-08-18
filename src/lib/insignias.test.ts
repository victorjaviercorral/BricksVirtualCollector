import { describe, it, expect } from 'vitest';
import { calcularRankingInsignias, tituloParaRango } from './insignias';

describe('tituloParaRango', () => {
  it('otorga títulos de podio para las 3 primeras posiciones', () => {
    expect(tituloParaRango(1)).toBe('🥇 1er Puesto');
    expect(tituloParaRango(2)).toBe('🥈 2º Puesto');
    expect(tituloParaRango(3)).toBe('🥉 3er Puesto');
  });

  it('el resto de posiciones son "Participante"', () => {
    expect(tituloParaRango(4)).toBe('Participante');
    expect(tituloParaRango(50)).toBe('Participante');
  });
});

describe('calcularRankingInsignias', () => {
  it('ordena de más a menos bricks', () => {
    const result = calcularRankingInsignias(
      ['s1', 's2', 's3'],
      { s1: 5, s2: 20, s3: 10 }
    );

    expect(result.map(r => r.set_id)).toEqual(['s2', 's3', 's1']);
    expect(result.map(r => r.rango)).toEqual([1, 2, 3]);
    expect(result.map(r => r.titulo_insignia)).toEqual(['🥇 1er Puesto', '🥈 2º Puesto', '🥉 3er Puesto']);
  });

  it('un set sin bricks recibidos cuenta como 0, no rompe el cálculo', () => {
    const result = calcularRankingInsignias(['s1', 's2'], { s1: 3 });

    expect(result.find(r => r.set_id === 's2')?.rango).toBe(2);
  });

  it('en empate, gana quien participó antes (orden de entrada), no aleatorio', () => {
    const result = calcularRankingInsignias(
      ['primero', 'segundo', 'tercero'],
      { primero: 10, segundo: 10, tercero: 10 }
    );

    // Mismos bricks los 3: el orden debe conservarse exactamente como llegó.
    expect(result.map(r => r.set_id)).toEqual(['primero', 'segundo', 'tercero']);
  });

  it('más allá del podio, todos reciben "Participante" con su rango numérico real', () => {
    const setIds = ['s1', 's2', 's3', 's4', 's5'];
    const bricks = { s1: 50, s2: 40, s3: 30, s4: 20, s5: 10 };

    const result = calcularRankingInsignias(setIds, bricks);

    expect(result[3].titulo_insignia).toBe('Participante');
    expect(result[3].rango).toBe(4);
    expect(result[4].titulo_insignia).toBe('Participante');
    expect(result[4].rango).toBe(5);
  });

  it('con un único participante, se lleva el 1er puesto', () => {
    const result = calcularRankingInsignias(['solo'], { solo: 1 });
    expect(result).toEqual([{ set_id: 'solo', rango: 1, titulo_insignia: '🥇 1er Puesto' }]);
  });

  it('lista vacía de participantes devuelve ranking vacío', () => {
    expect(calcularRankingInsignias([], {})).toEqual([]);
  });

  it('no muta el array de entrada', () => {
    const setIds = ['s1', 's2'];
    const original = [...setIds];
    calcularRankingInsignias(setIds, { s1: 1, s2: 2 });
    expect(setIds).toEqual(original);
  });
});
