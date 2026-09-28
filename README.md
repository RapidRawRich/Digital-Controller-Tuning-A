# Digital Controller Tuning Simulator (Part A)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=flat-square&logo=github)](https://rapidrawrich.github.io/Digital-Controller-Tuning-A/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![KaTeX](https://img.shields.io/badge/Math-KaTeX-3178c6.svg?style=flat-square)](https://katex.org/)

An interactive, high-fidelity web learning simulator designed for **Instrument Technicians** covering **Alberta Apprenticeship and Industry Training ILM Module 310305dA (Third Period Process Control: Digital Controller Tuning — Part A)**.

Hosted live on GitHub Pages: **[https://rapidrawrich.github.io/Digital-Controller-Tuning-A/](https://rapidrawrich.github.io/Digital-Controller-Tuning-A/)**

---

## 🎯 Educational Objectives & Topics Covered

Based directly on **Alberta ILM 310305dA**:

1. **Objective One: Feedback Control & Controller Architecture**
   - Definition of feedback control under ANSI/ISA S51.1-1979 (R1993).
   - Comparison of Stand-Alone Controllers (SAC) vs Distributed Control Systems (DCS).
   - Pneumatic analog mechanical design vs microprocessor-based software algorithms.

2. **The Three Digital PID Algorithms**
   - **Interactive (Series / Pneumatic)**:
     $$CO(s) = K_c \left(\frac{T_i s + 1}{T_i s}\right) \left(\frac{T_d s + 1}{\alpha T_d s + 1}\right) E(s)$$
     - Proportional affects derivative; both proportional and derivative affect integral action.
     - Dynamic calculation of effective gains:
       $$K_c' = K_c \left(1 + \frac{T_d}{T_i}\right), \quad T_i' = T_i + T_d, \quad T_d' = \frac{T_i T_d}{T_i + T_d}$$
   - **Standard (ISA / Non-Interactive)**:
     $$CO(s) = K_c \left(1 + \frac{1}{T_i s} + T_d s\right) E(s)$$
     - $K_c$ multiplies both integral and derivative, but integral does not affect derivative. Basis for most tuning rules (Ziegler-Nichols, Cohen-Coon).
   - **Parallel (Independent)**:
     $$CO(s) = \left(K_p + \frac{K_i}{s} + K_d s\right) E(s)$$
     - Uncoupled architecture; translation requires $K_p = K_c$, $K_i = \frac{K_c}{T_i}$, $K_d = K_c T_d$.

3. **Tuning Units & Reciprocal Conversions**
   - Proportional Gain vs Proportional Band:
     $$K_c = \frac{100\%}{PB\%} \iff PB\% = \frac{100\%}{K_c}$$
   - Integral Units: $\text{Time per Repeat} \iff \text{Repeats per Time}$ (reciprocals):
     $$\text{Reset Rate} = \frac{1}{T_i}$$

4. **Digital Implementation Considerations**
   - Scan rate delays and added effective loop dead time: $\theta_{\text{added}} \approx 0.5 \times \Delta t_{\text{scan}}$.
   - Transmitter PV dampening filter rule of thumb: $\tau_{\text{filter}} = 0.5 \times \Delta t_{\text{scan}}$.
   - Destabilization caused by setting filter time greater than scan rate.

5. **Bumpless Transfer (Manual $\leftrightarrow$ Auto)**
   - Preventing catastrophic process upsets and plant shutdowns during transfer.
   - The Three Digital Programming Rules (ILM Figures 4A & 4B):
     1. $SP$ tracks $PV$ in manual ($SP = PV \implies e = 0$).
     2. PID algorithm internal output tracks $CO$ in manual.
     3. Controller manual output setting tracks $CO$ in automatic.

6. **Setpoint Changes & Kick Mitigations**
   - **Derivative Kick**: $\frac{de}{dt} \to \infty$ on instant SP step, causing $CO$ to slam into physical limits (0% or 100%).
   - **Proportional Kick**: Step jump $\Delta CO_P = K_c \cdot \Delta SP$.
   - **Setpoint Softening**:
     - *SP Filtering*: First-order lag filter $SP_f(s) = \frac{1}{\tau_f s + 1} SP(s)$ (Figure 6).
     - *SP Ramping*: Constant slew rate limit $\left|\frac{d(SP)}{dt}\right| \le R_{\text{ramp}}$ (Figure 7).
   - **Equation Structure Options**:
     - *PID on Error* (Figure 8): Both kicks present.
     - *PI on Error, D on PV* (Figure 9): Derivative kick eliminated!
     - *I on Error, PD on PV* (Figure 10): Both kicks eliminated; smooth setpoint tracking with no overshoot and 100% load disturbance rejection.

7. **Derivative Gain & Filter (D-Filter)**
   - Mitigating high-frequency measurement noise (turbulent flow, liquid sloshing).
   - Divisor format ($N$) vs Multiplier format ($\alpha$):
     $$\tau_D = \frac{T_d}{N} = \alpha \times T_d$$
   - Comparison of open-loop ramp softening (Figure 11A) and closed-loop valve chatter suppression (Figure 11B).

8. **Reset Windup & Anti-Windup Protection (Heat Exchanger Case Study)**
   - Steam heat exchanger simulation (TIC-101 / TT-101 / FCV, Figure 12).
   - The 5 chronological windup phases ($t_0$ through $t_4$) during boiler steam cut-off.
   - Anti-windup solutions:
     - High/Low Clamping limits (Figure 13).
     - Rapid Unwind (8x to 32x speed acceleration).
     - **Reset Feedback** (Figure 14): feeding output-limited $CO$ back through $\frac{1}{T_i s + 1}$.

9. **Interactive Alberta Self-Test Examination**
   - Complete 5-question test with instant scoring, feedback, ILM page references, and celebratory confetti upon completion!

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens & Glassmorphism
- **Math Rendering**: KaTeX (Fast LaTeX math markup)
- **Visualization**: High-performance HTML5 Canvas multi-channel oscilloscope + animated SVG process schematics
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/RapidRawRich/Digital-Controller-Tuning-A.git
cd Digital-Controller-Tuning-A

# Install dependencies
npm install

# Start local development server
npm run dev

# Open http://localhost:5173 in your browser
```

---

## 📦 Deployment to GitHub Pages

To build and deploy to GitHub Pages:

```bash
npm run deploy
```

Or commit and push to `main` — the bundled GitHub Actions workflow (`.github/workflows/deploy.yml`) will build and publish automatically.

---

## 📖 Citation

- **Alberta Apprenticeship and Industry Training** — *Instrument Technician: Third Period Process Control — Digital Controller Tuning - Part A (ILM 310305dA)*.
- **ANSI/ISA S51.1-1979 (R1993)** — *Process Instrumentation Terminology*.
