export type PIDAlgorithmType = 'interactive' | 'standard' | 'parallel';

export type EquationStructureType = 
  | 'pid_on_error'          // Standard: P, I, D on error e = SP - PV
  | 'pi_error_d_pv'         // Popular: PI on error, D on PV (eliminates D kick)
  | 'i_error_pd_pv';        // Soft: I on error, P & D on PV (eliminates P & D kick)

export type AntiWindupType = 
  | 'none'                  // Raw accumulator (winds up infinitely)
  | 'clamping'              // Output limits (High/Low limits -5% to 105%)
  | 'rapid_unwind'          // 8x to 32x speed unwind when error reverses
  | 'reset_feedback';       // Reset feedback loop (feeds saturated CO back through I filter)

export type SpSofteningType = 
  | 'step'                  // Pure step change (maximum kick)
  | 'filter'                // First order lag filter
  | 'ramp';                 // Constant rate ramping

export interface SimulationDataPoint {
  t: number;            // seconds
  sp: number;           // setpoint % (0-100)
  pv: number;           // process variable % (0-100)
  co: number;           // controller output % (0-100)
  pTerm: number;        // proportional contribution
  iTerm: number;        // integral contribution
  dTerm: number;        // derivative contribution
  isSaturated?: boolean;// true if CO hits high/low limit
  rawCo?: number;       // unsaturated CO before limits
}

export interface PIDParameters {
  // Proportional
  kc: number;           // Proportional gain (e.g. 1.0 to 10.0)
  usePb: boolean;       // whether to display/adjust as Proportional Band (PB% = 100/Kc)
  
  // Integral
  ti: number;           // Integral time in minutes (or seconds)
  tiUnit: 'minutes' | 'seconds';
  useResetRate: boolean;// repeats/min or repeats/sec (1/Ti)
  
  // Derivative
  td: number;           // Derivative time in minutes (or seconds)
  tdUnit: 'minutes' | 'seconds';
  
  // Derivative Filter / Gain
  derivativeFilterGain: number; // N (e.g., 5 to 20, divisor: tau_d = Td / N)
  useDFilter: boolean;
  
  // Equation & Algorithm
  algorithm: PIDAlgorithmType;
  structure: EquationStructureType;
  
  // Setpoint Softening
  spSoftening: SpSofteningType;
  spFilterTime: number; // seconds
  spRampRate: number;   // % / second
  
  // Anti-Reset Windup
  antiWindup: AntiWindupType;
  coMin: number;        // e.g. 0% (or -5%)
  coMax: number;        // e.g. 100% (or 105%)
  rapidUnwindFactor: number; // e.g. 8x to 32x
  
  // Digital Implementation
  scanTime: number;     // seconds (e.g., 0.05 to 1.0)
  pvFilterTime: number; // seconds (dampening filter on transmitter/input)
}
