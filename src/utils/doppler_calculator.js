/**
 * Satellite Orbital Doppler Shift & Downlink Frequency Calculator.
 * Calculates frequency offsets (Hz) based on line-of-sight range-rate velocity (km/s).
 */
export class OrbitalDopplerCalculator {
  static SPEED_OF_LIGHT_KM_S = 299792.458;

  constructor(nominalFrequencyHz = 437_500_000) { // e.g. 437.5 MHz UHF downlink
    this.nominalFrequencyHz = nominalFrequencyHz;
  }

  calculateDopplerShiftHz(rangeRateKmS) {
    // Negative rangeRate means satellite is approaching (blueshift)
    // Positive rangeRate means satellite is receding (redshift)
    const deltaF = -this.nominalFrequencyHz * (rangeRateKmS / OrbitalDopplerCalculator.SPEED_OF_LIGHT_KM_S);
    return Math.round(deltaF) === 0 ? 0 : Math.round(deltaF);
  }

  calculateReceivedFrequencyHz(rangeRateKmS) {
    const shift = this.calculateDopplerShiftHz(rangeRateKmS);
    return this.nominalFrequencyHz + shift;
  }
}
