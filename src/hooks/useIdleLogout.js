import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectSessionTimeout } from '../store/authSlice';

const ACTIVITY_KEY = 'pgsl.lastActivity';
const CHECK_EVERY_MS = 20_000;
const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

const stamp = () => {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    // private mode: the timer then only sees this tab's own activity
  }
};
const lastSeen = () => {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();
  } catch {
    return Date.now();
  }
};

/**
 * Signs the user out after `sessionTimeoutMinutes` (company setting, delivered with `/auth/me`) without any
 * activity in any open tab. Activity is shared between tabs through localStorage.
 */
export function useIdleLogout() {
  const dispatch = useDispatch();
  const minutes = useSelector(selectSessionTimeout);

  useEffect(() => {
    if (!minutes) return undefined;
    stamp();
    let lastWrite = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5_000) {
        lastWrite = now;
        stamp();
      }
    };
    EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));

    const timer = setInterval(() => {
      if (Date.now() - lastSeen() > minutes * 60_000) {
        dispatch(logoutUser(`You were signed out after ${minutes} minutes of inactivity.`));
      }
    }, CHECK_EVERY_MS);

    return () => {
      EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      clearInterval(timer);
    };
  }, [minutes, dispatch]);
}
