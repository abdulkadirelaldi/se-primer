import { useEffect, useRef, useState } from 'react';

interface Props {
  seconds: number;
  onExpire: () => void;
}

/** Saniyede bir azalan sayaç; 0'a ulaşınca onExpire bir kez çağrılır. */
export default function Countdown({ seconds, onExpire }: Props) {
  const [left, setLeft] = useState(seconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left === 0) expireRef.current();
  }, [left]);

  const urgent = left <= 10;
  return (
    <div className={`timer ${urgent ? 'is-urgent' : ''}`} role="timer" aria-live={urgent ? 'assertive' : 'off'} data-cy="timer">
      <span className="timer__label">Kalan süre</span>
      <span className="timer__value" data-cy="timer-value">
        {left} sn
      </span>
      <span className="timer__bar" style={{ width: `${(left / seconds) * 100}%` }} />
    </div>
  );
}
