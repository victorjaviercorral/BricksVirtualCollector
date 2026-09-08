import { describe, it, expect } from "vitest";
import {
  MAX_REWARD_BRICKS,
  RECOMPENSA_POR_DEFECTO,
  recompensaEfectiva,
  totalBricksGanados,
} from "./bounties";

describe("recompensaEfectiva", () => {
  it("devuelve la recompensa tal cual cuando está por debajo del tope", () => {
    expect(recompensaEfectiva(250)).toBe(250);
  });

  it("capa al tope: es el defecto que traía /admin/bounties (5.000) frente a lo que de verdad se concedía", () => {
    expect(recompensaEfectiva(5000)).toBe(MAX_REWARD_BRICKS);
  });

  it("el valor exacto del tope no se recorta", () => {
    expect(recompensaEfectiva(MAX_REWARD_BRICKS)).toBe(MAX_REWARD_BRICKS);
  });

  it("null o undefined caen al valor por defecto", () => {
    expect(recompensaEfectiva(null)).toBe(RECOMPENSA_POR_DEFECTO);
    expect(recompensaEfectiva(undefined)).toBe(RECOMPENSA_POR_DEFECTO);
  });

  it("cero y negativos no conceden nada", () => {
    expect(recompensaEfectiva(0)).toBe(0);
    expect(recompensaEfectiva(-50)).toBe(0);
  });

  it("trunca decimales: un brick es una fila, no puede ser fraccionario", () => {
    expect(recompensaEfectiva(10.9)).toBe(10);
  });

  it("un valor no finito no concede nada en vez de propagar NaN", () => {
    expect(recompensaEfectiva(Number.NaN)).toBe(0);
    expect(recompensaEfectiva(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("el defecto no supera el tope: la app nunca puede prometer más de lo que entrega", () => {
    expect(RECOMPENSA_POR_DEFECTO).toBeLessThanOrEqual(MAX_REWARD_BRICKS);
  });
});

describe("totalBricksGanados", () => {
  it("suma la recompensa de cada reclamo", () => {
    expect(totalBricksGanados([{ recompensa: 500 }, { recompensa: 1000 }])).toBe(1500);
  });

  it("un reclamo sin recompensa cuenta como 0, no rompe la suma", () => {
    expect(totalBricksGanados([{ recompensa: 300 }, { recompensa: null }, {}])).toBe(300);
  });

  it("sin reclamos el total es 0", () => {
    expect(totalBricksGanados([])).toBe(0);
    expect(totalBricksGanados(null)).toBe(0);
    expect(totalBricksGanados(undefined)).toBe(0);
  });
});
