/**
 * Bonus · Üçüncü tüketici: kendi sunucumuz (Express + onnxruntime-node, POST /api/risk).
 * Aynı referans girdilerde Python test kahiniyle |fark| < 1e-4. Hedef sunucu: Cypress baseUrl.
 */
interface Parite {
  tolerans: number;
  model_surumu: string;
  girdiler: (Record<string, number | string> & { ad: string; p_beklenen: number })[];
}

describe('Sunucu tüketicisi (POST /api/risk) = Python test kahini', () => {
  it('5 referans girdide |p_sunucu − p_python| < 1e-4', () => {
    cy.readFile<Parite>('tests/parite.json').then((parite) => {
      parite.girdiler.forEach(({ ad, p_beklenen, ...inputs }) => {
        cy.request('POST', '/api/risk', { inputs }).then(({ body }) => {
          expect(body.version).to.eq(parite.model_surumu);
          expect(Math.abs(body.p - p_beklenen), `${ad}: sunucu ${body.p}, python ${p_beklenen}`).to.be.lessThan(parite.tolerans);
        });
      });
    });
  });

  it('sözleşme dışı girdiyi 400 ile reddeder', () => {
    cy.request({ method: 'POST', url: '/api/risk', body: { inputs: { sahne_no: 2 } }, failOnStatusCode: false })
      .its('status')
      .should('eq', 400);
    cy.request({
      method: 'POST',
      url: '/api/risk',
      body: { inputs: { sahne_no: 9, seviye: 0, onceki_oyun_sayisi: 0, onceki_riskli_sayisi: 0, onceki_karar_suresi_sn: 1, onceki_okuma_suresi_sn: 1, tutor_mesaj_sayisi: 0 } },
      failOnStatusCode: false,
    }).then((r) => {
      expect(r.status).to.eq(400);
      expect(r.body.error).to.contain('sahne_no');
    });
  });
});

describe('Sunucu · 300 girdilik diferansiyel test', () => {
  it('POST /api/risk/toplu: 300 girdide |fark| < 1e-4, karar uyuşması 300/300', () => {
    cy.readFile('tests/parite300.json').then((d: { girdiler: number[][]; p_beklenen: number[]; tolerans: number }) => {
      cy.readFile('model/config.json').then((config: { karar_esigi: number }) => {
        cy.request('POST', '/api/risk/toplu', { rows: d.girdiler }).then(({ body }) => {
          expect(body.p).to.have.length(300);
          const farklar = body.p.map((p: number, i: number) => Math.abs(p - d.p_beklenen[i]));
          expect(Math.max(...farklar)).to.be.lessThan(d.tolerans);
          const esik = config.karar_esigi;
          const uyusan = body.p.filter((p: number, i: number) => p >= esik === d.p_beklenen[i] >= esik).length;
          expect(uyusan).to.eq(300);
        });
      });
    });
  });
});
