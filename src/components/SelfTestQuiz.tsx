import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award, RotateCcw, HelpCircle, BookOpen } from 'lucide-react';
import { MathFormula } from './MathFormula';

interface QuizQuestion {
  id: number;
  question: string;
  ilmReference: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "List the three (3) common digital PID algorithms and state which one most closely describes the operation of a pneumatic controller:",
    ilmReference: "ILM Page 4 & 5 (Self-Test Q1)",
    options: [
      {
        text: "Interactive, Standard, and Parallel — where the Interactive algorithm describes the operation of a pneumatic controller.",
        isCorrect: true,
        explanation: "Correct! Pneumatic controllers use interacting mechanical bellows where proportional affects derivative, and both affect integral action (Series form).",
      },
      {
        text: "Parallel, Cascade, and Ratio — where the Parallel algorithm describes a pneumatic controller.",
        isCorrect: false,
        explanation: "Incorrect. The three algorithms are Interactive, Standard, and Parallel. Parallel removes interaction, which physical pneumatic bellows cannot do.",
      },
      {
        text: "Interactive, Standard, and Dead-Time — where Standard describes a pneumatic controller.",
        isCorrect: false,
        explanation: "Incorrect. Standard is the ISA non-interactive algorithm, which was created later for electronic/digital systems.",
      },
      {
        text: "Feedforward, Feedback, and Fuzzy Logic.",
        isCorrect: false,
        explanation: "Incorrect. These are overall control strategies, not the three basic PID algorithm equations.",
      },
    ],
  },
  {
    id: 2,
    question: "What three (3) programming requirements must be configured when using a digital controller to achieve bumpless transfer?",
    ilmReference: "ILM Page 7 (Self-Test Q2)",
    options: [
      {
        text: "1) SP tracks PV in manual, 2) PID algorithm output tracks CO in manual, 3) Controller manual output tracks CO in automatic.",
        isCorrect: true,
        explanation: "Correct! When SP tracks PV, error e=0 so there is no proportional jump. When internal bias and manual output match CO at the transition instant, delta CO = 0.",
      },
      {
        text: "1) SP is locked at 50%, 2) Valve is ramped at 1%/sec, 3) Derivative action is turned off during manual.",
        isCorrect: false,
        explanation: "Incorrect. SP tracking of PV and mutual tracking between automatic and manual outputs are the three mandatory requirements.",
      },
      {
        text: "1) Setpoint ramps to zero, 2) Controller goes into failsafe, 3) Operator confirms with a password.",
        isCorrect: false,
        explanation: "Incorrect. Bumpless transfer is an automatic software tracking feature to prevent process upsets.",
      },
    ],
  },
  {
    id: 3,
    question: "Which two (2) setpoint softening options can be configured to mitigate derivative kick and proportional kick from setpoint changes?",
    ilmReference: "ILM Pages 9-10 (Self-Test Q3)",
    options: [
      {
        text: "Filter setpoint changes (SP Filter) and Setpoint ramping (SP Ramp).",
        isCorrect: true,
        explanation: "Correct! SP filtering applies a first-order lag filter to the entered SP, while SP ramping changes the SP at a constant fixed rate (%/min or %/sec).",
      },
      {
        text: "Increasing proportional gain and turning off integral action.",
        isCorrect: false,
        explanation: "Incorrect. Increasing gain would make the proportional kick even worse!",
      },
      {
        text: "Decreasing valve dead-time and adding derivative gain.",
        isCorrect: false,
        explanation: "Incorrect. SP softening specifically modifies how the setpoint trajectory is presented to the PID algorithm.",
      },
    ],
  },
  {
    id: 4,
    question: "What is derivative gain (or derivative filter) and what is its primary industrial purpose?",
    ilmReference: "ILM Page 13 (Self-Test Q4)",
    options: [
      {
        text: "It provides a first-order response to the derivative action to minimize unwanted derivative action to noisy signals and soften response to other changes.",
        isCorrect: true,
        explanation: "Correct! High-frequency measurement noise (e.g. turbulent flow) causes wild derivative spikes. A D-filter softens this response and protects actuators.",
      },
      {
        text: "It multiplies the derivative time by 10 to make derivative action 10 times more aggressive.",
        isCorrect: false,
        explanation: "Incorrect. Derivative gain/filter attenuates high frequencies; it does not amplify noise.",
      },
      {
        text: "It is an anti-windup limiter that clamps the derivative output to 100%.",
        isCorrect: false,
        explanation: "Incorrect. That is an output limit or anti-windup function, not a derivative filter.",
      },
    ],
  },
  {
    id: 5,
    question: "How does Reset Feedback limit integral reset windup?",
    ilmReference: "ILM Pages 14-16 (Self-Test Q5)",
    options: [
      {
        text: "It feeds the limited controller output (CO after OUT LIM) back into the controller to perform integral action, physically capping the accumulation to the output limits.",
        isCorrect: true,
        explanation: "Correct! Because the input to the integrator is bounded by the OUT LIM function, the integral term can never contribute more than the maximum output limit.",
      },
      {
        text: "It shuts down the integrator whenever the transmitter signal drops below 4 mA.",
        isCorrect: false,
        explanation: "Incorrect. Reset feedback continuously feeds back the actual limited CO through a lag filter (1 / (Ti s + 1)).",
      },
      {
        text: "It discharges the pneumatic bellows to atmosphere through a rapid exhaust valve.",
        isCorrect: false,
        explanation: "Incorrect. That is a mechanical relief, whereas Reset Feedback is a feedback topology shown in Figure 14.",
      },
    ],
  },
];

export const SelfTestQuiz: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      const selectedIndex = selectedAnswers[q.id];
      if (selectedIndex !== undefined && q.options[selectedIndex].isCorrect) {
        score++;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setShowResults(true);
    const score = calculateScore();
    if (score >= 4) {
      // Trigger confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const total = quizQuestions.length;
  const score = calculateScore();
  const allAnswered = Object.keys(selectedAnswers).length === total;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Top Quiz Header */}
      <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-800/40 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Alberta Apprenticeship Knowledge Check
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            ILM 310305dA Self-Test Examination
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Test your mastery of the 5 core objective questions directly from page 15 of your Alberta Instrument Technician module.
          </p>
        </div>

        {showResults ? (
          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 shrink-0">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Score</span>
              <span className={`text-2xl font-black ${score >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {score} / {total}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer ${
              allAnswered
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit Answers ({Object.keys(selectedAnswers).length}/{total})
          </button>
        )}
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-5">
        {quizQuestions.map((q, qIndex) => {
          const selectedOptionIndex = selectedAnswers[q.id];
          const isAnswered = selectedOptionIndex !== undefined;

          return (
            <div
              key={q.id}
              className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3 transition"
            >
              {/* Question Title & ILM Citation */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-bold text-xs shrink-0 border border-slate-700">
                    {qIndex + 1}
                  </span>
                  <h3 className="font-semibold text-slate-100 text-sm leading-relaxed">
                    {q.question}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  {q.ilmReference}
                </span>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2 pt-1">
                {q.options.map((option, optIdx) => {
                  const isSelected = selectedOptionIndex === optIdx;
                  let optionStyle = 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300';

                  if (showResults) {
                    if (option.isCorrect) {
                      optionStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                    } else if (isSelected && !option.isCorrect) {
                      optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-sky-950/80 border-sky-500 text-sky-200';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      disabled={showResults}
                      className={`p-3 rounded-lg border text-left text-xs transition flex items-start gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {showResults ? (
                          option.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-600 block" />
                          )
                        ) : (
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-sky-400 bg-sky-500' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                        )}
                      </span>
                      <span className="flex-1">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation after submit */}
              {showResults && (
                <div
                  className={`mt-2 p-3 rounded-lg border text-xs leading-relaxed ${
                    q.options[selectedOptionIndex ?? 0]?.isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <strong className="block mb-1">
                    {q.options[selectedOptionIndex ?? 0]?.isCorrect ? 'Alberta ILM Solution:' : 'Review Guidance:'}
                  </strong>
                  {q.options.find((o) => o.isCorrect)?.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
