/**
 * Oyunun durum makinesi (Sommerville, Bölüm 5: durum makinesi modeli).
 * Her kullanıcı eylemi bir olaydır; geçerli olmayan olay durumu değiştirmez.
 *
 *   intro --START--> profile(0) --ANSWER--> profile(1) --ANSWER--> profile(2) --ANSWER--> decision(0)
 *   decision(n) --CHOOSE--> feedback(n)
 *   feedback(n<2) --NEXT--> decision(n+1)
 *   feedback(2) --NEXT--> ending
 *   ending --RESTART--> intro
 */
import type { Choice, GameResult, Profile, ProfileKey } from '../types';
import { DECISIONS, START_TIME_MIN } from './story';

export type Phase = 'intro' | 'profile' | 'decision' | 'feedback' | 'ending';

export interface GameState {
  phase: Phase;
  profileStep: number;
  profile: Partial<Profile>;
  step: number;
  choices: Choice[];
  timedOut: boolean[];
}

export type GameEvent =
  | { type: 'START' }
  | { type: 'ANSWER'; key: ProfileKey; value: string }
  | { type: 'BACK' }
  | { type: 'CHOOSE'; choice: Choice; timedOut?: boolean }
  | { type: 'NEXT' }
  | { type: 'RESTART' };

export const initialState: GameState = {
  phase: 'intro',
  profileStep: 0,
  profile: {},
  step: 0,
  choices: [],
  timedOut: [],
};

const PROFILE_ORDER: ProfileKey[] = ['level', 'role', 'goal'];

export function transition(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'intro':
      return event.type === 'START' ? { ...initialState, phase: 'profile' } : state;

    case 'profile':
      if (event.type === 'BACK' && state.profileStep > 0) {
        return { ...state, profileStep: state.profileStep - 1 };
      }
      if (event.type === 'ANSWER' && event.key === PROFILE_ORDER[state.profileStep]) {
        const profile = { ...state.profile, [event.key]: event.value };
        return state.profileStep < PROFILE_ORDER.length - 1
          ? { ...state, profile, profileStep: state.profileStep + 1 }
          : { ...state, profile, phase: 'decision', step: 0 };
      }
      return state;

    case 'decision':
      if (event.type === 'CHOOSE') {
        return {
          ...state,
          phase: 'feedback',
          choices: [...state.choices, event.choice],
          timedOut: [...state.timedOut, Boolean(event.timedOut)],
        };
      }
      return state;

    case 'feedback':
      if (event.type === 'NEXT') {
        return state.step < DECISIONS.length - 1
          ? { ...state, phase: 'decision', step: state.step + 1 }
          : { ...state, phase: 'ending' };
      }
      return state;

    case 'ending':
      return event.type === 'RESTART' ? initialState : state;
  }
}

export function formatClock(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function elapsedMinutes(choices: Choice[]): number {
  return choices.reduce((sum, c, i) => sum + DECISIONS[i].outcomes[c].minutes, 0);
}

export function clockAfter(choices: Choice[]): string {
  return formatClock(START_TIME_MIN + elapsedMinutes(choices));
}

/** Son, KVKK kararıyla belirlenir; ilk iki karar bitiş saatini belirler. */
export function computeResult(choices: Choice[], timedOut: boolean[]): GameResult {
  const dataSafe = choices[2] === 'A';
  return {
    ending: dataSafe ? 'A' : 'B',
    finishTime: clockAfter(choices),
    incidentMinutes: elapsedMinutes(choices),
    dataSafe,
    timedOutCount: timedOut.filter(Boolean).length,
  };
}
