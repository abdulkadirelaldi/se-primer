import type { Choice, Profile } from '../types';
import { DECISIONS, ENDINGS, GOAL_LABELS, LEVEL_LABELS, ROLE_LABELS, decisionFor } from '../game/story';
import { computeResult } from '../game/machine';

interface Props {
  profile: Profile;
  choices: Choice[];
  timedOut: boolean[];
  onRestart: () => void;
}

export default function EndingScreen({ profile, choices, timedOut, onRestart }: Props) {
  const result = computeResult(choices, timedOut);
  const ending = ENDINGS[result.ending];
  const goalIndex = decisionFor(profile.goal);

  return (
    <main className="screen ending" data-cy="screen-ending" data-ending={result.ending}>
      <section className={`ending__hero ending__hero--${result.ending === 'A' ? 'good' : 'bad'}`}>
        <p className="eyebrow" data-cy="ending-tag">
          {ending.tag}
        </p>
        <h1 className="h1" data-cy="ending-headline">
          {ending.headline(result.finishTime)}
        </h1>
        <p>{ending.body}</p>
      </section>

      <dl className="stats" data-cy="ending-stats">
        <div>
          <dt>Bitiş</dt>
          <dd data-cy="stat-finish">{result.finishTime}</dd>
        </div>
        <div>
          <dt>Olay süresi</dt>
          <dd data-cy="stat-minutes">{result.incidentMinutes} dk</dd>
        </div>
        <div>
          <dt>Hasta verisi</dt>
          <dd data-cy="stat-data">{result.dataSafe ? 'Güvende' : 'İhlal'}</dd>
        </div>
      </dl>

      <section className="card" data-cy="ending-summary">
        <h2 className="h3">Kararların</h2>
        <ol className="summary">
          {DECISIONS.map((d, i) => (
            <li key={d.id} data-cy={`ending-row-${i}`} className={i === goalIndex ? 'is-goal' : ''}>
              <span className="summary__tag">
                {d.tag}
                {i === goalIndex && ' · 🎯'}
              </span>
              <span className="summary__choice">
                {choices[i]}) {d.options[choices[i]].label}
                {timedOut[i] && <em className="summary__timeout"> (süre doldu)</em>}
              </span>
              <span className="summary__concepts">{d.outcomes[choices[i]].concepts.join(' · ')}</span>
            </li>
          ))}
        </ol>
        <p className="muted small" data-cy="ending-profile">
          {LEVEL_LABELS[profile.level]} · {ROLE_LABELS[profile.role]} · Hedef: {GOAL_LABELS[profile.goal]}
        </p>
      </section>

      <section className="card card--tutor" data-cy="ending-reflection">
        <p className="eyebrow eyebrow--light">AI tutor son soruyu soruyor</p>
        <p>“{ending.reflection}”</p>
      </section>

      <button className="btn btn--primary btn--block" data-cy="restart-btn" onClick={onRestart}>
        Tekrar oyna
      </button>
    </main>
  );
}
