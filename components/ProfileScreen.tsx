import type { Profile, ProfileKey } from '../types';
import { PROFILE_QUESTIONS } from '../game/story';

interface Props {
  step: number;
  profile: Partial<Profile>;
  onAnswer: (key: ProfileKey, value: string) => void;
  onBack: () => void;
}

export default function ProfileScreen({ step, profile, onAnswer, onBack }: Props) {
  const q = PROFILE_QUESTIONS[step];
  const selected = profile[q.key];

  return (
    <main className="screen profile" data-cy="screen-profile">
      <header className="topbar">
        {step > 0 ? (
          <button className="link-btn" data-cy="profile-back" onClick={onBack} aria-label="Önceki soru">
            ← Geri
          </button>
        ) : (
          <span />
        )}
        <span className="topbar__step" data-cy="profile-step">
          {step + 1} / {PROFILE_QUESTIONS.length}
        </span>
      </header>

      <div className="progress" aria-hidden="true">
        {PROFILE_QUESTIONS.map((_, i) => (
          <span key={i} className={`progress__dot ${i <= step ? 'is-on' : ''}`} />
        ))}
      </div>

      <p className="eyebrow">Seni tanıyalım</p>
      <h2 className="h2" data-cy="profile-question">
        {q.title}
      </h2>
      <p className="muted">{q.subtitle}</p>

      <div className="options" role="radiogroup" aria-label={q.title}>
        {q.options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={selected === o.value}
            className={`option ${selected === o.value ? 'is-selected' : ''}`}
            data-cy={`opt-${q.key}-${o.value}`}
            onClick={() => onAnswer(q.key, o.value)}
          >
            <span className="option__label">{o.label}</span>
            <span className="option__desc">{o.desc}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
