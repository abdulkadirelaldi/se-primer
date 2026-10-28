import { useReducer } from 'react';
import type { Profile } from './types';
import { initialState, transition } from './game/machine';
import IntroScreen from './components/IntroScreen';
import ProfileScreen from './components/ProfileScreen';
import SceneScreen from './components/SceneScreen';
import EndingScreen from './components/EndingScreen';

export default function App() {
  const [state, dispatch] = useReducer(transition, initialState);

  return (
    <div className="app">
      {state.phase === 'intro' && <IntroScreen onStart={() => dispatch({ type: 'START' })} />}

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
          onChoose={(choice, timedOut) => dispatch({ type: 'CHOOSE', choice, timedOut })}
          onNext={() => dispatch({ type: 'NEXT' })}
        />
      )}

      {state.phase === 'ending' && (
        <EndingScreen
          profile={state.profile as Profile}
          choices={state.choices}
          timedOut={state.timedOut}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      )}
    </div>
  );
}
