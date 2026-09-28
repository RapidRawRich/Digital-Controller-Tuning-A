import { PIDParameters, SimulationDataPoint, PIDAlgorithmType, EquationStructureType, AntiWindupType } from '../types/pid';

export interface ProcessModelConfig {
  type: 'heat_exchanger' | 'fopdt' | 'noisy_flow';
  gain: number;          // Process gain Kp
  tau: number;           // Time constant tau (seconds)
  deadTime: number;      // Dead time theta (seconds)
  noiseLevel: number;    // Amplitude of sensor noise
  ambientTemp: number;   // Base ambient value (e.g., 20%)
  steamAvailable: boolean; // For heat exchanger: whether steam supply is active
}

export class PIDSimulationEngine {
  private params: PIDParameters;
  private processConfig: ProcessModelConfig;
  
  // State variables
  private t: number = 0;
  private pv: number = 20;
  private sp: number = 50;
  private targetSp: number = 50;
  private spFiltered: number = 50;
  private co: number = 0;
  private rawCo: number = 0;
  private integralAccum: number = 0;
  private lastPv: number = 20;
  private lastError: number = 0;
  private dFiltered: number = 0;
  private resetFeedbackState: number = 0;
  private isManual: boolean = false;
  private manualCo: number = 50;
  private bumplessEnabled: boolean = true;
  
  // Dead time queue
  private deadTimeQueue: Array<{ t: number; val: number }> = [];

  constructor(params: PIDParameters, processConfig: ProcessModelConfig) {
    this.params = { ...params };
    this.processConfig = { ...processConfig };
    this.reset(processConfig.ambientTemp, 50);
  }

  public updateParams(newParams: Partial<PIDParameters>) {
    this.params = { ...this.params, ...newParams };
  }

  public updateProcess(newConfig: Partial<ProcessModelConfig>) {
    this.processConfig = { ...this.processConfig, ...newConfig };
  }

  public setManual(manual: boolean) {
    if (this.isManual === manual) return;

    if (manual) {
      // Switching from AUTO to MANUAL
      this.isManual = true;
      if (this.bumplessEnabled) {
        // Rule 3: Controller manual output tracks CO in automatic
        this.manualCo = this.co;
      }
    } else {
      // Switching from MANUAL to AUTO
      this.isManual = false;
      if (this.bumplessEnabled) {
        // Rule 1: SP tracks PV in manual
        this.sp = this.pv;
        this.targetSp = this.pv;
        this.spFiltered = this.pv;
        // Rule 2: PID algorithm output tracks CO in manual
        this.integralAccum = this.manualCo;
        this.resetFeedbackState = this.manualCo;
        this.rawCo = this.manualCo;
        this.co = this.manualCo;
        this.lastError = 0;
        this.dFiltered = 0;
      }
    }
  }

  public getIsManual(): boolean {
    return this.isManual;
  }

  public getManualCo(): number {
    return this.manualCo;
  }

  public getBumplessEnabled(): boolean {
    return this.bumplessEnabled;
  }

  public setManualCo(val: number) {
    this.manualCo = Math.max(0, Math.min(100, val));
  }

  public setBumplessEnabled(enabled: boolean) {
    this.bumplessEnabled = enabled;
  }

  public setTargetSp(sp: number) {
    this.targetSp = Math.max(0, Math.min(100, sp));
    if (this.params.spSoftening === 'step') {
      this.sp = this.targetSp;
      this.spFiltered = this.targetSp;
    }
  }

  public reset(initialPv = 20, initialSp = 50) {
    this.t = 0;
    this.pv = initialPv;
    this.sp = initialSp;
    this.targetSp = initialSp;
    this.spFiltered = initialSp;
    this.co = 0;
    this.rawCo = 0;
    this.integralAccum = 0;
    this.lastPv = initialPv;
    this.lastError = initialSp - initialPv;
    this.dFiltered = 0;
    this.resetFeedbackState = 0;
    this.isManual = false;
    this.manualCo = 50;
    this.deadTimeQueue = [];
  }

  /**
   * Performs one simulation integration step of duration dt seconds
   */
  public step(dt: number): SimulationDataPoint {
    this.t += dt;

    // 1. Process Setpoint Softening (Filtering or Ramping)
    if (this.params.spSoftening === 'filter') {
      const tauF = Math.max(0.01, this.params.spFilterTime);
      const alphaF = dt / (tauF + dt);
      this.spFiltered += alphaF * (this.targetSp - this.spFiltered);
      this.sp = this.spFiltered;
    } else if (this.params.spSoftening === 'ramp') {
      const maxDelta = Math.max(0.1, this.params.spRampRate) * dt;
      if (Math.abs(this.targetSp - this.sp) <= maxDelta) {
        this.sp = this.targetSp;
      } else {
        this.sp += Math.sign(this.targetSp - this.sp) * maxDelta;
      }
    } else {
      this.sp = this.targetSp;
    }

    // In manual mode with Bumpless transfer enabled: SP tracks PV
    if (this.isManual && this.bumplessEnabled) {
      this.sp = this.pv;
      this.targetSp = this.pv;
      this.spFiltered = this.pv;
    }

    const error = this.sp - this.pv;
    const errorDelta = error - this.lastError;
    const pvDelta = this.pv - this.lastPv;

    // Convert tuning units to seconds
    const tiSec = this.params.tiUnit === 'minutes' ? this.params.ti * 60 : this.params.ti;
    const tdSec = this.params.tdUnit === 'minutes' ? this.params.td * 60 : this.params.td;
    const safeTi = Math.max(0.1, tiSec);
    const kc = this.params.kc;

    let pTerm = 0;
    let iTerm = 0;
    let dTerm = 0;

    if (this.isManual) {
      // Manual Control
      this.co = this.manualCo;
      this.rawCo = this.manualCo;
      if (this.bumplessEnabled) {
        // PID output tracks CO in manual (Rule 2)
        this.integralAccum = this.manualCo;
        this.resetFeedbackState = this.manualCo;
        this.dFiltered = 0;
        this.lastError = 0;
      }
    } else {
      // Automatic Mode: Calculate PID based on Algorithm and Structure
      // Derivative Filter Time Constant: tau_d = tdSec / N
      const dFilterN = this.params.useDFilter ? Math.max(1, this.params.derivativeFilterGain) : 1000;
      const tauD = Math.max(0.001, tdSec / dFilterN);
      const alphaD = dt / (tauD + dt);

      // Raw rate of change for derivative term
      let rawDerivativeInput = 0;
      if (this.params.structure === 'pid_on_error') {
        // Derivative acts on error e(t)
        rawDerivativeInput = errorDelta / dt;
      } else {
        // 'pi_error_d_pv' or 'i_error_pd_pv': Derivative acts on -PV(t)
        rawDerivativeInput = -pvDelta / dt;
      }

      // Filtered derivative calculation
      this.dFiltered += alphaD * (rawDerivativeInput - this.dFiltered);
      const effectiveDInput = this.params.useDFilter ? this.dFiltered : rawDerivativeInput;

      // Calculate according to selected Algorithm
      if (this.params.algorithm === 'standard') {
        // --- STANDARD (ISA / Non-Interactive) ---
        // P-term
        if (this.params.structure === 'i_error_pd_pv') {
          pTerm = -kc * (this.pv - this.processConfig.ambientTemp);
        } else {
          pTerm = kc * error;
        }

        // D-term
        dTerm = kc * tdSec * effectiveDInput;

        // Anti-Windup Integral Logic
        if (this.params.antiWindup === 'reset_feedback') {
          // Reset Feedback (ILM Figure 14): Output is fed back through 1 / (Ti s + 1)
          const alphaRf = dt / (safeTi + dt);
          this.resetFeedbackState += alphaRf * (this.co - this.resetFeedbackState);
          iTerm = this.resetFeedbackState;
          this.rawCo = pTerm + dTerm + iTerm;
        } else {
          // Standard Integral Accumulation
          let integralSpeed = (kc / safeTi) * dt;

          // Rapid Unwind check (ILM pg 13): if PV crossed SP and CO is outside limits, speed up by 8x-32x
          if (this.params.antiWindup === 'rapid_unwind') {
            const isOvershot = (this.rawCo > this.params.coMax && error < 0) || 
                              (this.rawCo < this.params.coMin && error > 0);
            if (isOvershot) {
              integralSpeed *= this.params.rapidUnwindFactor;
            }
          }

          // Anti-Windup Clamping check: stop integrating if saturated in direction of error
          const saturatedHigh = this.rawCo >= this.params.coMax && error > 0;
          const saturatedLow = this.rawCo <= this.params.coMin && error < 0;

          if (this.params.antiWindup !== 'clamping' || (!saturatedHigh && !saturatedLow)) {
            this.integralAccum += integralSpeed * error;
          }

          // In standard clamping, limit internal accumulator as well
          if (this.params.antiWindup === 'clamping') {
            this.integralAccum = Math.max(this.params.coMin - 5, Math.min(this.params.coMax + 5, this.integralAccum));
          }

          iTerm = this.integralAccum;
          this.rawCo = pTerm + iTerm + dTerm;
        }

      } else if (this.params.algorithm === 'interactive') {
        // --- INTERACTIVE (Series / Pneumatic) ---
        // Formula: CO = Kc * (1 + 1/(Ti s)) * (1 + Td s) * E(s)
        // Effective Gain Kc' = Kc * (1 + Td / Ti)
        // Effective Ti' = Ti + Td
        // Effective Td' = (Ti * Td) / (Ti + Td)
        const interactionRatio = 1 + tdSec / safeTi;
        const effectiveKc = kc * interactionRatio;
        const effectiveTi = safeTi + tdSec;
        const effectiveTd = (safeTi * tdSec) / effectiveTi;

        if (this.params.structure === 'i_error_pd_pv') {
          pTerm = -effectiveKc * (this.pv - this.processConfig.ambientTemp);
        } else {
          pTerm = effectiveKc * error;
        }

        dTerm = effectiveKc * effectiveTd * effectiveDInput;

        if (this.params.antiWindup === 'reset_feedback') {
          const alphaRf = dt / (effectiveTi + dt);
          this.resetFeedbackState += alphaRf * (this.co - this.resetFeedbackState);
          iTerm = this.resetFeedbackState;
          this.rawCo = pTerm + dTerm + iTerm;
        } else {
          let integralSpeed = (effectiveKc / effectiveTi) * dt;
          if (this.params.antiWindup === 'rapid_unwind') {
            const isOvershot = (this.rawCo > this.params.coMax && error < 0) || 
                              (this.rawCo < this.params.coMin && error > 0);
            if (isOvershot) integralSpeed *= this.params.rapidUnwindFactor;
          }

          const saturatedHigh = this.rawCo >= this.params.coMax && error > 0;
          const saturatedLow = this.rawCo <= this.params.coMin && error < 0;

          if (this.params.antiWindup !== 'clamping' || (!saturatedHigh && !saturatedLow)) {
            this.integralAccum += integralSpeed * error;
          }

          if (this.params.antiWindup === 'clamping') {
            this.integralAccum = Math.max(this.params.coMin - 5, Math.min(this.params.coMax + 5, this.integralAccum));
          }

          iTerm = this.integralAccum;
          this.rawCo = pTerm + iTerm + dTerm;
        }

      } else {
        // --- PARALLEL (Independent) ---
        // Formula: CO = Kp * E + Ki * integral(E) + Kd * dE/dt
        // Where Kp = Kc, Ki = Kc / Ti, Kd = Kc * Td
        const kp = kc;
        const ki = kc / safeTi;
        const kd = kc * tdSec;

        if (this.params.structure === 'i_error_pd_pv') {
          pTerm = -kp * (this.pv - this.processConfig.ambientTemp);
        } else {
          pTerm = kp * error;
        }

        dTerm = kd * effectiveDInput;

        let integralSpeed = ki * dt;
        if (this.params.antiWindup === 'rapid_unwind') {
          const isOvershot = (this.rawCo > this.params.coMax && error < 0) || 
                            (this.rawCo < this.params.coMin && error > 0);
          if (isOvershot) integralSpeed *= this.params.rapidUnwindFactor;
        }

        const saturatedHigh = this.rawCo >= this.params.coMax && error > 0;
        const saturatedLow = this.rawCo <= this.params.coMin && error < 0;

        if (this.params.antiWindup !== 'clamping' || (!saturatedHigh && !saturatedLow)) {
          this.integralAccum += integralSpeed * error;
        }

        if (this.params.antiWindup === 'clamping') {
          this.integralAccum = Math.max(this.params.coMin - 5, Math.min(this.params.coMax + 5, this.integralAccum));
        }

        iTerm = this.integralAccum;
        this.rawCo = pTerm + iTerm + dTerm;
      }

      // Output Limits: Clamping controller output to [coMin, coMax]
      this.co = Math.max(this.params.coMin, Math.min(this.params.coMax, this.rawCo));

      if (this.bumplessEnabled) {
        // Rule 3: Manual output setting tracks active CO in automatic
        this.manualCo = this.co;
      }
    }

    // 2. Physical Process Simulation (Heat Exchanger, FOPDT, Flow)
    // Add to dead-time buffer
    this.deadTimeQueue.push({ t: this.t, val: this.co });
    const targetDelayedTime = this.t - this.processConfig.deadTime;
    let delayedCo = this.co;
    while (this.deadTimeQueue.length > 0 && this.deadTimeQueue[0].t <= targetDelayedTime) {
      delayedCo = this.deadTimeQueue[0].val;
      if (this.deadTimeQueue.length > 1 && this.deadTimeQueue[1].t <= targetDelayedTime) {
        this.deadTimeQueue.shift();
      } else {
        break;
      }
    }

    // Calculate process dynamics
    let processInputCo = delayedCo;
    if (this.processConfig.type === 'heat_exchanger') {
      // Steam cut-off drops effective heating to zero
      if (!this.processConfig.steamAvailable) {
        processInputCo = 0;
      }
    }

    // First-order process differential equation:
    // dPV/dt = (Kp * processInputCo + ambientTemp - PV) / tau
    const targetPv = this.processConfig.ambientTemp + this.processConfig.gain * processInputCo;
    const tauP = Math.max(0.1, this.processConfig.tau);
    const alphaP = dt / (tauP + dt);
    
    // Smooth deterministic PV transition
    let newPv = this.pv + alphaP * (targetPv - this.pv);

    // Add sensor noise (e.g. turbulent flow measurement or sloshing)
    if (this.processConfig.noiseLevel > 0) {
      const whiteNoise = (Math.random() - 0.5) * 2 * this.processConfig.noiseLevel;
      // PV filter (dampening)
      if (this.params.pvFilterTime > 0) {
        const alphaPvFilter = dt / (this.params.pvFilterTime + dt);
        newPv += alphaPvFilter * (whiteNoise);
      } else {
        newPv += whiteNoise;
      }
    }

    this.lastPv = this.pv;
    this.pv = Math.max(0, Math.min(100, newPv));
    this.lastError = error;

    return {
      t: Number(this.t.toFixed(2)),
      sp: Number(this.sp.toFixed(2)),
      pv: Number(this.pv.toFixed(2)),
      co: Number(this.co.toFixed(2)),
      rawCo: Number(this.rawCo.toFixed(2)),
      pTerm: Number(pTerm.toFixed(2)),
      iTerm: Number(iTerm.toFixed(2)),
      dTerm: Number(dTerm.toFixed(2)),
      isSaturated: this.rawCo > this.params.coMax || this.rawCo < this.params.coMin,
    };
  }

  public getPv() { return this.pv; }
  public getSp() { return this.sp; }
  public getCo() { return this.co; }
  public getRawCo() { return this.rawCo; }
}
