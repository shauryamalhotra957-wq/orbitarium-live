import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OrbitalDopplerCalculator } from '../src/utils/doppler_calculator.js';

describe('OrbitalDopplerCalculator Test Suite', () => {
  const calc = new OrbitalDopplerCalculator(100_000_000); // 100 MHz for clean round testing

  test('zero relative velocity produces zero shift', () => {
    assert.strictEqual(calc.calculateDopplerShiftHz(0.0), 0);
    assert.strictEqual(calc.calculateReceivedFrequencyHz(0.0), 100_000_000);
  });

  test('approaching satellite produces blueshift (positive delta)', () => {
    // range rate -7.5 km/s (approaching)
    const shift = calc.calculateDopplerShiftHz(-7.5);
    assert.ok(shift > 0);
    assert.ok(calc.calculateReceivedFrequencyHz(-7.5) > 100_000_000);
  });

  test('receding satellite produces redshift (negative delta)', () => {
    // range rate +7.5 km/s (receding)
    const shift = calc.calculateDopplerShiftHz(7.5);
    assert.ok(shift < 0);
    assert.ok(calc.calculateReceivedFrequencyHz(7.5) < 100_000_000);
  });
});
