import { SCENARIO_TITLE } from '../game/story';

interface Props {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: Props) {
  return (
    <main className="screen screen--dark intro" data-cy="screen-intro">
      <p className="eyebrow eyebrow--light">YZM301 · Oynanan bir kitap</p>
      <h1 className="intro__title">SE Primer</h1>
      <p className="intro__lead">
        Kişiye uyum sağlayan kitap, bu kez yazılım mühendisi için: sen karar verirsin, uygulama o kararın{' '}
        <span className="accent">teknik sonucunu</span> gösterir.
      </p>
      <div className="intro__card">
        <p className="eyebrow eyebrow--light">Bölüm 1 · Sağlık</p>
        <p className="intro__quote">“{SCENARIO_TITLE}”</p>
        <ul className="intro__facts">
          <li>3 soru: seviye, rol, hedef</li>
          <li>3 karar, 2 farklı son</li>
          <li>Cevabı söylemeyen, soru soran AI tutor</li>
        </ul>
      </div>
      <button className="btn btn--primary btn--block" data-cy="start-btn" onClick={onStart}>
        Nöbeti devral
      </button>
      <p className="intro__note">Senaryodaki tüm hasta bilgileri kurgudur.</p>
    </main>
  );
}
