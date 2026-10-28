import type { Choice, Decision, Profile } from '../types';

interface Props {
  decision: Decision;
  profile: Profile;
  choice: Choice;
  timedOut: boolean;
  isGoalDecision: boolean;
  isLast: boolean;
  onNext: () => void;
}

export default function FeedbackCard({ decision, profile, choice, timedOut, isGoalDecision, isLast, onNext }: Props) {
  const outcome = decision.outcomes[choice];

  return (
    <section className="feedback" data-cy="feedback" aria-live="polite">
      {timedOut && (
        <p className="badge badge--warn" data-cy="feedback-timeout">
          ⏱ Süre doldu. Karar vermemek de bir karardır: ekip varsayılan seçeneği uyguladı.
        </p>
      )}

      <p className="feedback__choice" data-cy="feedback-choice">
        Seçimin: <strong>{choice}) {decision.options[choice].label}</strong>
      </p>

      <div className="card">
        <h3 className="h3">Ne oldu?</h3>
        <p data-cy="feedback-what">{outcome.what}</p>
      </div>

      <div className="card">
        <h3 className="h3">Neden oldu?</h3>
        <p data-cy="feedback-why">{outcome.why}</p>
        <p className="feedback__role" data-cy="feedback-role">
          {decision.roleLens[profile.role]}
        </p>
      </div>

      {isGoalDecision && (
        <div className="card card--goal" data-cy="feedback-goal">
          <h3 className="h3">🎯 Hedefin için derinleş</h3>
          <p>{decision.goalDeepDive}</p>
        </div>
      )}

      <ul className="chips" aria-label="Teknik kavramlar" data-cy="feedback-concepts">
        {outcome.concepts.map((c) => (
          <li key={c} className="chip">
            {c}
          </li>
        ))}
      </ul>

      <button className="btn btn--primary btn--block" data-cy="next-btn" onClick={onNext}>
        {isLast ? 'Sonucu gör' : 'Sonraki karar →'}
      </button>
    </section>
  );
}
