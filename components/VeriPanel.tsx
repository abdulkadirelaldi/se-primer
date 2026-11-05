import { useState } from 'react';
import { depo, veriyiTemizle, yeniKatilimci } from '../game/veri';
import { toCsv } from '../game/telemetry';

/** Veri Toplama Modu (?veri=1): yalnızca bu cihazda biriken anonim oturumları yönetir. */
export default function VeriPanel() {
  const [d, setD] = useState(depo);
  const [silOnay, setSilOnay] = useState(false);
  const oturumlar = new Set(d.satirlar.map((s) => s.oturum_id)).size;
  const kisiler = new Set(d.satirlar.map((s) => s.katilimci_id)).size;
  const bu = new Set(d.satirlar.filter((s) => s.katilimci_id === d.katilimci).map((s) => s.oturum_id)).size;

  const indir = () => {
    const url = URL.createObjectURL(new Blob([toCsv(d.satirlar)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `gercek_${d.katilimci}_${oturumlar}oturum.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="veri" data-cy="veri-panel">
      <strong>● Veri Toplama Modu</strong>
      <span>
        Katılımcı <b data-cy="veri-katilimci">{d.katilimci}</b> · bu kişinin {bu}. oturumu tamamlandı · toplam{' '}
        <b data-cy="veri-oturum">{oturumlar}</b> oturum, {kisiler} kişi, {d.satirlar.length} satır
      </span>
      <span>Ad, e-posta, cihaz ya da zaman bilgisi toplanmaz. Veriler yalnızca bu cihazda durur.</span>
      <div className="veri__row">
        <button className="btn btn--light" data-cy="veri-yeni" onClick={() => { yeniKatilimci(); setD(depo()); }}>
          Yeni katılımcı
        </button>
        <button className="btn btn--light" data-cy="veri-indir" onClick={indir} disabled={!d.satirlar.length}>
          CSV indir
        </button>
        <button
          className="btn btn--ghost"
          style={{ color: '#fff', borderColor: '#fff' }}
          data-cy="veri-sil"
          onClick={() => {
            if (!silOnay) return setSilOnay(true);
            veriyiTemizle();
            setSilOnay(false);
            setD(depo());
          }}
        >
          {silOnay ? 'Emin misin? Tekrar bas' : 'Verileri sil'}
        </button>
      </div>
    </section>
  );
}
