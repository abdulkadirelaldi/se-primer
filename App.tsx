import { useEffect, useReducer, useRef, useState } from 'react';
import type { Choice, Profile } from './types';
import { initialState, transition } from './game/machine';
import { sceneFeatures, oturumSatirlari, type SceneLog } from './game/telemetry';
import { oyunSayisi, oyunTamamlandi, rastgeleKimlik, depo, satirEkle, veriModuAcik } from './game/veri';
import { kanaryadaMi, loadRiskModel } from './services/riskModel';
import IntroScreen from './components/IntroScreen';
import ProfileScreen from './components/ProfileScreen';
import SceneScreen from './components/SceneScreen';
import EndingScreen from './components/EndingScreen';
import ModelLab from './components/ModelLab';

export interface RiskState {
  step: number;
  p: number;
  esik: number;
  surum: string;
  /** Eval kapısının gerçek veri koşulunu (E4) henüz geçmemiş model: üretimde yalnız gölgede çalışır. */
  taslak: boolean;
}

export default function App() {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('lab') === '1') {
    return <ModelLab />;
  }
  return <Game />;
}

function Game() {
  const [state, dispatch] = useReducer(transition, initialState);
  const veriModu = veriModuAcik();
  const logs = useRef<SceneLog[]>([]);
  const oturum = useRef({ id: '', oyunSayisi: 0, kaydedildi: false });
  const [risk, setRisk] = useState<RiskState | null>(null);
  const [kayit, setKayit] = useState<{ katilimci: string; oturumNo: number } | null>(null);

  // Sahne açıldığında zaman damgası; Karar 2–3'te modelden risk tahmini.
  useEffect(() => {
    if (state.phase !== 'decision') return;
    const step = state.step;
    logs.current[step] ??= { startedAt: Date.now(), tutorCount: 0 };
    let iptal = false;
    void loadRiskModel().then(async (model) => {
      if (!model || iptal || !model.config.model_sahneleri.includes(step + 1)) return;
      const f = sceneFeatures(step, logs.current, (state.profile as Profile).level, oturum.current.oyunSayisi);
      try {
        const p = await model.predict(f);
        if (iptal) return;
        logs.current[step].p = p;
        setRisk({ step, p, esik: model.config.karar_esigi, surum: model.config.version, taslak: model.config.surum_turu !== 'yayin' });
      } catch (err) {
        console.warn('[risk] Tahmin yapılamadı:', err);
      }
    });
    return () => {
      iptal = true;
    };
  }, [state.phase, state.step, state.profile]);

  useEffect(() => {
    if (state.phase === 'feedback') logs.current[state.step].feedbackAt ??= Date.now();
    if (state.phase !== 'ending' || oturum.current.kaydedildi) return;
    oturum.current.kaydedildi = true;
    if (veriModu) {
      const katilimci = depo().katilimci;
      void loadRiskModel().then((model) => {
        satirEkle(
          oturumSatirlari(logs.current, state.profile as Profile, { oturum: oturum.current.id, katilimci }, oturum.current.oyunSayisi, model?.config.version ?? ''),
        );
        setKayit({ katilimci, oturumNo: oturum.current.oyunSayisi + 1 });
      });
    } else {
      oyunTamamlandi();
    }
  }, [state.phase, state.step, state.profile, veriModu]);

  const start = () => {
    logs.current = [];
    oturum.current = { id: rastgeleKimlik('o-', 8), oyunSayisi: oyunSayisi(), kaydedildi: false };
    setRisk(null);
    setKayit(null);
    dispatch({ type: 'START' });
  };

  const choose = (choice: Choice, timedOut?: boolean) => {
    const log = logs.current[state.step];
    if (log && !log.chosenAt) Object.assign(log, { chosenAt: Date.now(), choice, timedOut: Boolean(timedOut) });
    dispatch({ type: 'CHOOSE', choice, timedOut });
  };

  const next = () => {
    const log = logs.current[state.step];
    if (log) log.nextAt ??= Date.now();
    dispatch({ type: 'NEXT' });
  };

  const tutorMessage = () => {
    const log = logs.current[state.step];
    if (log) log.tutorCount += 1;
  };

  // Gölge mod: model tahmin eder ve kaydeder ama oyunu değiştirmez.
  //  - Veri toplanırken (veri, modelin etkisinden temiz kalsın)
  //  - Üretimde taslak modelle (spec.md §10: taslak model yayınlanmaz)
  //  - Aşamalı geçişte kovası dışında kalan cihazlarda (RELEASE.md › kanarya)
  //  Önizleme (?onizleme=1): test kullanıcıları (ör. değerlendirici) aday modeli aktif görür — iç kanarya.
  const onizleme = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('onizleme') === '1';
  const golge = veriModu || (import.meta.env.PROD && risk?.taslak && !onizleme) || (!kanaryadaMi() && !onizleme);
  const aktifRisk = !golge && risk && risk.step === state.step && risk.p >= risk.esik ? risk : null;

  return (
    <div className="app">
      {state.phase === 'intro' && <IntroScreen onStart={start} veriModu={veriModu} />}

      {state.phase === 'profile' && (
        <ProfileScreen
          step={state.profileStep}
          profile={state.profile}
          onAnswer={(key, value) => dispatch({ type: 'ANSWER', key, value })}
          onBack={() => dispatch({ type: 'BACK' })}
        />
      )}

      {(state.phase === 'decision' || state.phase === 'feedback') && (
        <SceneScreen
          key={state.step}
          step={state.step}
          profile={state.profile as Profile}
          choices={state.choices}
          timedOut={state.timedOut}
          showFeedback={state.phase === 'feedback'}
          risk={aktifRisk}
          riskP={risk && risk.step === state.step ? risk.p : undefined}
          onChoose={choose}
          onNext={next}
          onTutorMessage={tutorMessage}
        />
      )}

      {state.phase === 'ending' && (
        <EndingScreen
          profile={state.profile as Profile}
          choices={state.choices}
          timedOut={state.timedOut}
          kayit={kayit}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      )}
    </div>
  );
}
