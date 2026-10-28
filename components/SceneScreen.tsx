import { useEffect, useRef } from 'react';
import type { Choice, Profile } from '../types';
import { DECISIONS, DECISION_SECONDS, GOAL_LABELS, TIMEOUT_CHOICE, decisionFor, introParagraphs } from '../game/story';
import { clockAfter } from '../game/machine';
import Countdown from './Countdown';
import FeedbackCard from './FeedbackCard';
import TutorPanel from './TutorPanel';

interface Props {
  step: number;
  profile: Profile;
  choices: Choice[];
  timedOut: boolean[];
  showFeedback: boolean;
  onChoose: (choice: Choice, timedOut?: boolean) => void;
  onNext: () => void;
}

export default function SceneScreen({ step, profile, choices, timedOut, showFeedback, onChoose, onNext }: Props) {
  const decision = DECISIONS[step];
  const isGoalDecision = decisionFor(profile.goal) === step;
  const previous = choices.slice(0, step);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showFeedback) feedbackRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [showFeedback]);

  return (
    <main className="screen scene" data-cy="screen-scene">
      <header className="scene__header">
        <div>
          <p className="eyebrow eyebrow--light" data-cy="scene-tag">
            {decision.tag}
          </p>
          <h2 className="scene__title">{decision.title}</h2>
        </div>
        <div className="clock" data-cy="scene-clock" aria-label="Olay saati">
          {clockAfter(showFeedback ? choices : previous)}
        </div>
      </header>

      <div className="progress progress--dark" aria-label={`Karar ${step + 1} / ${DECISIONS.length}`}>
        {DECISIONS.map((d, i) => (
          <span key={d.id} className={`progress__dot ${i < step || (i === step && showFeedback) ? 'is-on' : ''} ${i === step ? 'is-current' : ''}`} />
        ))}
      </div>

      <div className="scene__body">
        {step === 0 && !showFeedback && (
          <section className="card card--brief" data-cy="briefing">
            <p className="eyebrow">Brifing</p>
            {introParagraphs(profile).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        )}

        {isGoalDecision && (
          <p className="badge badge--goal" data-cy="goal-badge">
            🎯 Hedefinle ilgili karar: {GOAL_LABELS[profile.goal]}
          </p>
        )}

        <p className="scene__prompt" data-cy="scene-prompt">
          {decision.prompt(choices)}
        </p>

        {!showFeedback && (
          <>
            {profile.level === 'experienced' && (
              <Countdown seconds={DECISION_SECONDS} onExpire={() => onChoose(TIMEOUT_CHOICE, true)} />
            )}

            {profile.level === 'beginner' && (
              <aside className="card card--hint" data-cy="hint-card">
                <p className="eyebrow">💡 İpucu</p>
                <p>{decision.hints[0]}</p>
              </aside>
            )}

            <div className="choices">
              {(['A', 'B'] as Choice[]).map((c) => (
                <button key={c} className="choice" data-cy={`choice-${c}`} onClick={() => onChoose(c)}>
                  <span className="choice__key">{c}</span>
                  <span>
                    <span className="choice__label">{decision.options[c].label}</span>
                    <span className="choice__detail">{decision.options[c].detail}</span>
                  </span>
                </button>
              ))}
            </div>

            <TutorPanel decision={decision} profile={profile} choices={previous} />
          </>
        )}

        {showFeedback && (
          <div ref={feedbackRef}>
            <FeedbackCard
              decision={decision}
              profile={profile}
              choice={choices[step]}
              timedOut={timedOut[step]}
              isGoalDecision={isGoalDecision}
              isLast={step === DECISIONS.length - 1}
              onNext={onNext}
            />
          </div>
        )}
      </div>
    </main>
  );
}
