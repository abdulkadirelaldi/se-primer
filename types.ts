export type Level = 'beginner' | 'intermediate' | 'experienced';
export type Role = 'backend' | 'qa' | 'devops';
export type Goal = 'architecture' | 'testing' | 'security';
export type Choice = 'A' | 'B';

/** Kararların kimliği; hedef (Goal) ile birebir eşleşir. */
export type DecisionId = 'architecture' | 'testing' | 'kvkk';

export interface Profile {
  level: Level;
  role: Role;
  goal: Goal;
}

export type ProfileKey = keyof Profile;

export interface Outcome {
  /** Bu seçimin olay süresine eklediği dakika. */
  minutes: number;
  /** Ne oldu? */
  what: string;
  /** Neden oldu? */
  why: string;
  /** Öğretilen teknik kavramlar. */
  concepts: string[];
}

export interface OptionDef {
  label: string;
  detail: string;
}

export interface Decision {
  id: DecisionId;
  index: number;
  tag: string;
  title: string;
  /** Sahne metni; önceki seçimlere göre değişebilir. */
  prompt: (choices: Choice[]) => string;
  options: Record<Choice, OptionDef>;
  outcomes: Record<Choice, Outcome>;
  /** Sokratik ipuçları: cevabı söylemez, soru sorar. */
  hints: string[];
  /** Tutor'un, oyuncunun yöneldiği seçeneği sınamak için sorduğu karşı sorular. */
  probes: Record<Choice, string>;
  /** Oyuncunun rolüne göre ek bakış açısı. */
  roleLens: Record<Role, string>;
  /** Oyuncunun hedefi bu kararla eşleşiyorsa gösterilen derinleşme notu. */
  goalDeepDive: string;
}

export type EndingId = 'A' | 'B';

export interface GameResult {
  ending: EndingId;
  finishTime: string;
  incidentMinutes: number;
  dataSafe: boolean;
  timedOutCount: number;
}

export interface ChatMessage {
  role: 'student' | 'tutor';
  text: string;
}
