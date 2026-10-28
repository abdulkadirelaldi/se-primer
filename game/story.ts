import type { Choice, Decision, EndingId, Goal, Level, Profile, ProfileKey, Role } from '../types';

export const START_TIME_MIN = 8 * 60; // 08:00
export const DECISION_SECONDS = 60;
/** Süre dolduğunda ekip varsayılan (hızlı ama riskli) seçeneği uygular. */
export const TIMEOUT_CHOICE: Choice = 'B';

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Yeni başladım',
  intermediate: 'Biraz deneyimim var',
  experienced: 'Deneyimliyim',
};

export const ROLE_LABELS: Record<Role, string> = {
  backend: 'Backend geliştirici',
  qa: 'Test (QA) mühendisi',
  devops: 'DevOps / SRE',
};

export const GOAL_LABELS: Record<Goal, string> = {
  architecture: 'Mimari kararlar',
  testing: 'Test ve kalite',
  security: 'Veri güvenliği (KVKK)',
};

export interface ProfileQuestion {
  key: ProfileKey;
  title: string;
  subtitle: string;
  options: { value: string; label: string; desc: string }[];
}

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    key: 'level',
    title: 'Seviyen ne?',
    subtitle: 'Anlatı ve zorluk buna göre ayarlanır.',
    options: [
      { value: 'beginner', label: LEVEL_LABELS.beginner, desc: 'Her kararda ipucu kartı görürsün.' },
      { value: 'intermediate', label: LEVEL_LABELS.intermediate, desc: 'İpucunu sen istersin, süre baskısı yok.' },
      { value: 'experienced', label: LEVEL_LABELS.experienced, desc: 'Her karar için 60 saniyen var.' },
    ],
  },
  {
    key: 'role',
    title: 'Ekipteki rolün ne?',
    subtitle: 'Hikâye senin sorumluluk alanından anlatılır.',
    options: [
      { value: 'backend', label: ROLE_LABELS.backend, desc: 'Randevu servisinin kodunu sen yazdın.' },
      { value: 'qa', label: ROLE_LABELS.qa, desc: 'Dünkü sürümün test raporunu sen imzaladın.' },
      { value: 'devops', label: ROLE_LABELS.devops, desc: 'Yayın hattı ve sunucular sende.' },
    ],
  },
  {
    key: 'goal',
    title: 'Bu nöbetten ne öğrenmek istiyorsun?',
    subtitle: 'Hedefinle ilgili kararda derinleşme notu açılır.',
    options: [
      { value: 'architecture', label: GOAL_LABELS.architecture, desc: 'Geri alma, dağıtım stratejisi.' },
      { value: 'testing', label: GOAL_LABELS.testing, desc: 'Ne zaman, ne kadar test.' },
      { value: 'security', label: GOAL_LABELS.security, desc: 'Kişisel veri ve KVKK.' },
    ],
  },
];

export const SCENARIO_TITLE = '08:00, randevu sistemi çöktü. Nöbetçi sensin.';

const ROLE_INTRO: Record<Role, string> = {
  backend: 'Bu sürümdeki randevu servisinin kodunu sen yazdın; hata büyük ihtimalle bildiğin bir yerde.',
  qa: 'Dünkü sürümün test raporunu sen imzaladın; neyin gözden kaçtığını bulmak sana düşüyor.',
  devops: 'Yayın hattı (CI/CD) ve sunucular senin sorumluluğunda; alarm ilk sana düştü.',
};

const LEVEL_INTRO: Record<Level, string> = {
  beginner: 'Endişelenme: her kararda bir ipucu kartı göreceksin, AI tutor da yanında.',
  intermediate: 'Takılırsan AI tutor’a danışabilirsin; cevabı söylemez ama doğru soruyu sorar.',
  experienced: 'Her karar için 60 saniyen var. Süre dolarsa ekip varsayılan (hızlı ama riskli) seçeneği uygular.',
};

const GOAL_INTRO: Record<Goal, string> = {
  architecture: 'Hedefin mimari kararlar: 1. karara özellikle dikkat et.',
  testing: 'Hedefin test ve kalite: 2. karara özellikle dikkat et.',
  security: 'Hedefin veri güvenliği: 3. karara özellikle dikkat et.',
};

export function introParagraphs(profile: Profile): string[] {
  return [
    'Dün gece 02:00’de randevu sisteminin v2.4 sürümü yayına alındı. Sabah 08:00 itibarıyla hastanenin online randevu sistemi hata veriyor; 300 hasta bekliyor.',
    ROLE_INTRO[profile.role],
    LEVEL_INTRO[profile.level],
    GOAL_INTRO[profile.goal],
  ];
}

export const DECISIONS: Decision[] = [
  {
    id: 'architecture',
    index: 0,
    tag: 'KARAR 1 · MİMARİ',
    title: 'İlk hamle',
    prompt: () =>
      'Loglar, hatanın gece çıkan v2.4 ile başladığını gösteriyor. Hastalar şu an randevu alamıyor. İlk hamlen ne?',
    options: {
      A: { label: 'Eski sürüme geri dön', detail: 'Rollback: bilinen sağlam sürüm v2.3’ü geri yükle, kök nedeni sonra ara.' },
      B: { label: 'Canlıda yama yap', detail: 'Hotfix: hatayı canlı sistemde bulup doğrudan düzelt.' },
    },
    outcomes: {
      A: {
        minutes: 15,
        what:
          'Önce v2.4’ün veritabanı migration’ına baktın: yalnızca boş bırakılabilir (nullable) bir sütun eklenmiş, v2.3 bu şemayla uyumlu. v2.3’ü geri yükledin; randevular yeniden alınıyor.',
        why:
          'Geri alma, bilinen sağlam bir duruma en kısa yoldan döner: kesinti süresini (MTTR) kısaltır ve kök neden analizini baskı altından çıkarır. Bu yalnızca şema geriye dönük uyumlu olduğu için güvenliydi; şema değişmiş olsaydı eski kod yeni tabloyu okuyamayabilirdi.',
        concepts: ['Rollback', 'MTTR', 'Geriye uyumlu migration'],
      },
      B: {
        minutes: 30,
        what:
          'Canlı sunucuda logları izleyerek hatayı aradın. Sorun, yeni eklenen “randevu_notu” alanı boş geldiğinde servisin çökmesiymiş. Yamayı yazana kadar 30 dakika geçti; bu sürede hastalar randevu alamadı.',
        why:
          'Canlıda hata ayıklamak, kesintiyi kök neden bulunana kadar uzatır ve baskı altında yazılan kod yeni hata riski taşır. Önce hizmeti geri getirmek (mitigation), sonra kalıcı düzeltmeyi yapmak (fix) genellikle daha güvenlidir.',
        concepts: ['Hotfix', 'Önce mitigation, sonra fix'],
      },
    },
    hints: [
      'Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?',
      'Hastalar beklerken hangi seçenek hizmeti daha kısa sürede geri getirir; kök nedeni bulmak için şu an acele etmen gerekiyor mu?',
      'Eski kod, yeni sürümün veritabanında bıraktığı değişikliklerle çalışabilir mi? Bunu hangi dosyaya bakarak anlarsın?',
    ],
    probes: {
      A: 'Geri döndüğünde, gece çalışan migration’ın veritabanında bıraktığı değişikliklere ne olacak?',
      B: 'Hatayı canlıda ararken geçen her dakika randevu bekleyen hastalara nasıl yansıyor?',
    },
    roleLens: {
      backend: 'Backend geliştirici olarak: migration’larını her zaman geri alınabilir (down migration) yaz.',
      qa: 'Test mühendisi olarak: sürüm kontrol listesine “geri alma test edildi mi?” maddesini ekle.',
      devops: 'DevOps olarak: geri alma tek komutluk, provası yapılmış bir işlem olmalı.',
    },
    goalDeepDive:
      'Mavi-yeşil (blue-green) dağıtım ya da özellik bayrağı (feature flag) olsaydı geri dönüş tek bir anahtar kadar hızlı olurdu. Geri alınabilirliği, sonradan değil tasarım aşamasında bir mimari özellik olarak düşün.',
  },
  {
    id: 'testing',
    index: 1,
    tag: 'KARAR 2 · TEST',
    title: 'Yayına almadan önce',
    prompt: (choices) =>
      choices[0] === 'A'
        ? 'Sistem v2.3 ile ayakta. Ekip v2.4’teki hatayı buldu: boş “randevu_notu” alanı servisi çökertiyor. Düzeltilmiş v2.4.1 hazır. Yayına almadan önce ne yaparsın?'
        : 'Canlı yaman hazır ama henüz hiçbir testten geçmedi. Hastalar hâlâ bekliyor. Yayına almadan önce ne yaparsın?',
    options: {
      A: { label: 'Önce kısa test koş', detail: 'Duman testi (smoke test) ve ilgili birim testleri, yaklaşık 8 dakika.' },
      B: { label: 'Hemen yayına al', detail: 'Test yok; her dakika önemli.' },
    },
    outcomes: {
      A: {
        minutes: 8,
        what:
          'Duman testi, düzeltmenin randevu iptal ekranını bozduğunu yakaladı. Tek satırlık bir düzeltmeyle testler yeşile döndü ve sürüm sorunsuz yayına çıktı.',
        why:
          'Kısa bir otomatik test, üretimde saatlerce sürecek bir hatayı dakikalar içinde ve hastalara yansımadan yakalar. Test hızın düşmanı değil sigortasıdır: 8 dakika harcadın, ikinci bir kesintiyi önledin.',
        concepts: ['Smoke test', 'Regresyon', 'Test piramidi'],
      },
      B: {
        minutes: 20,
        what:
          'Düzeltme doğrudan yayına çıktı ve randevu iptal ekranını bozdu. Şikâyetler gelmeye başladı; değişikliği geri alıp düzeltmek toplam 20 dakika sürdü.',
        why:
          'Test edilmemiş değişiklik, çözdüğü hatanın yerine yeni bir hata (regresyon) getirebilir. Kazandığını sandığın 8 dakika, ikinci bir kesinti olarak geri döndü.',
        concepts: ['Regresyon', 'Yayın riski'],
      },
    },
    hints: [
      'Bu düzeltmenin yalnızca çözdüğü hatayı değil, başka bir şeyi bozmadığını nereden bileceksin?',
      'Birkaç dakikalık bir testin maliyetiyle, yayında ortaya çıkabilecek ikinci bir kesintinin maliyetini nasıl karşılaştırırsın?',
      'Kriz anında bile koşabileceğin en küçük test seti hangi akışları kapsamalı?',
    ],
    probes: {
      A: 'Test koşarken geçen dakikalarda hastalar ne yaşıyor ve bu bekleme neye karşılık değer?',
      B: 'Yayına aldığın değişiklik randevu akışındaki başka bir ekranı etkilerse bunu ilk kim fark eder?',
    },
    roleLens: {
      backend: 'Backend geliştirici olarak: düzeltmeyle birlikte hatayı yeniden üreten bir birim testi yaz.',
      qa: 'Test mühendisi olarak: duman testi setin 5–10 dakikayı geçmemeli ki kriz anında atlanmasın.',
      devops: 'DevOps olarak: CI hattında testi atlamayı zorlaştıran bir kural (zorunlu kontrol) koy.',
    },
    goalDeepDive:
      'Bu hatayı gece yakalayacak test, “randevu_notu boş olduğunda” durumunu deneyen tek bir sınır değer (boundary) testiydi. Testleri mutlu yoldan değil kenar durumlardan yazmaya başla.',
  },
  {
    id: 'kvkk',
    index: 2,
    tag: 'KARAR 3 · KVKK',
    title: 'Logları paylaşmak',
    prompt: () =>
      'Kök neden analizi için ekip, olay anındaki hata loglarını 40 kişilik Slack kanalında istiyor. Logda hastaların adı-soyadı, TC kimlik numarası ve randevu aldıkları bölüm (ör. Onkoloji) açık metin olarak duruyor.',
    options: {
      A: { label: 'Maskele, sonra paylaş', detail: 'Ad, TC no ve bölümü maskeleyen betiği çalıştır, yaklaşık 2 dakika.' },
      B: { label: 'Ekibe olduğu gibi at', detail: 'Zaman kaybetme, ham logu kanala yapıştır.' },
    },
    outcomes: {
      A: {
        minutes: 2,
        what:
          'Kişisel verileri maskeleyen betiği çalıştırdın: “Ayşe Yılmaz, 12345678901” → “A*** Y***, 123******01”. Ekip analizi aynı loglarla, kimsenin kimliğini görmeden yaptı.',
        why:
          'Hata analizi için hastanın kim olduğunu bilmek gerekmez. Sağlık verisi KVKK’da özel nitelikli kişisel veridir (md. 6) ve veri sorumlusu bu veriyi yetkisiz erişime karşı korumakla yükümlüdür (md. 12). Veri minimizasyonu: işin için gereken en az veriyi paylaş.',
        concepts: ['Veri maskeleme', 'Veri minimizasyonu', 'KVKK md. 6 ve 12'],
      },
      B: {
        minutes: 0,
        what:
          'Ham log 40 kişilik kanala düştü. Hastaların adları, TC numaraları ve hangi bölüme randevu aldıkları artık bu veriyi görmeye yetkisi olmayan kişilerin ekranında. Bilgi güvenliği ekibi olayı veri ihlali olarak kaydetti.',
        why:
          'Sağlık verisi özel nitelikli kişisel veridir; gerekli önlemi almadan yetkisiz kişilere açmak KVKK md. 12 kapsamında bir veri güvenliği ihlalidir ve Kurul’a en geç 72 saat içinde bildirilmesi gerekir. Sistem ayağa kalksa da hastaların güveni zedelendi.',
        concepts: ['Özel nitelikli kişisel veri', 'Veri ihlali bildirimi', 'KVKK md. 12'],
      },
    },
    hints: [
      'Kök nedeni bulmak için hastanın adını bilmen gerçekten gerekiyor mu?',
      'Bu log kanalı kimlerin ekranına düşüyor ve hepsi bu veriyi görmeye yetkili mi?',
      'Sağlık verisi KVKK’da hangi veri kategorisine giriyor ve bu kategori için ne tür önlem bekleniyor?',
    ],
    probes: {
      A: 'Maskeleme sonrası log, kök nedeni bulmak için hâlâ yeterli bilgiyi taşıyor mu? Hangi alanlara gerçekten ihtiyacın var?',
      B: 'Kanaldaki 40 kişinin her biri bu hastaların hangi bölüme randevu aldığını bilmeye yetkili mi?',
    },
    roleLens: {
      backend: 'Backend geliştirici olarak: loglara kişisel veriyi yazan satırı bul ve kaynağında maskele.',
      qa: 'Test mühendisi olarak: test ortamında gerçek hasta verisi değil sentetik veri kullan.',
      devops: 'DevOps olarak: log toplama sistemine erişimi rol bazlı sınırla ve saklama süresini belirle.',
    },
    goalDeepDive:
      'En iyi maskeleme, hiç loglanmayan veridir. Loglayıcıya kişisel veri alanlarını otomatik maskeleyen bir filtre eklemek (privacy by design: gizliliği sonradan değil, tasarım aşamasında kurgulamak) bu kararı her seferinde vermene gerek bırakmaz.',
  },
];

export const ENDINGS: Record<EndingId, { tag: string; headline: (time: string) => string; body: string; reflection: string }> = {
  A: {
    tag: 'SON A · İYİ',
    headline: (time) => `${time} sistem ayakta, veri güvende`,
    body: 'Randevu sistemi çalışıyor ve hiçbir hastanın kişisel verisi yetkisiz kişilere açılmadı. Olay sonrası değerlendirme (postmortem) toplantısına suçlu aramadan, öğrenerek gireceksin.',
    reflection: 'Bu olayın bir daha yaşanmaması için yayın hattına hangi otomatik kontrolü eklerdin?',
  },
  B: {
    tag: 'SON B · KÖTÜ',
    headline: (time) => `${time} sistem ayakta ama KVKK ihlali`,
    body: 'Teknik sorun çözüldü, ancak hastaların sağlık verisi yetkisiz kişilere açıldı. Hastane, ihlali Kişisel Verileri Koruma Kurulu’na bildirmek ve etkilenen hastaları bilgilendirmek zorunda.',
    reflection: 'Logların baştan kişisel veri içermemesi için kod tarafında neyi değiştirebilirdin?',
  },
};

export function decisionFor(goal: Goal): number {
  return { architecture: 0, testing: 1, security: 2 }[goal];
}
