import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

import PrivacySplash from './PrivacySplash.jsx';

const OVERLAY_ID = 'web-privacy-overlay';
const IDLE_LOCK_MS_TOUCH = 3000;
const IDLE_LOCK_MS_DESKTOP = 12000;
const UNLOCK_GRACE_MS = 500;

function getIdleLockMs() {
    if (typeof window === 'undefined') {
        return IDLE_LOCK_MS_DESKTOP;
    }
    if (window.__webPrivacyIsTouch) {
        return IDLE_LOCK_MS_TOUCH;
    }
    const isTouch =
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    return isTouch ? IDLE_LOCK_MS_TOUCH : IDLE_LOCK_MS_DESKTOP;
}

function isInUnlockGrace() {
    return typeof window !== 'undefined' && window.__webPrivacyUnlockGraceUntil > Date.now();
}

function lockOverlayDom() {
    if (isInUnlockGrace()) {
        return;
    }
    if (typeof window !== 'undefined' && window.__webPrivacyLock) {
        window.__webPrivacyLock();
        return;
    }
    const el = document.getElementById(OVERLAY_ID);
    if (!el) {
        return;
    }
    window.__webPrivacyIsLocked = true;
    document.documentElement.classList.add('privacy-locked');
    el.style.display = 'flex';
    el.style.pointerEvents = 'auto';
    const root = document.getElementById('root');
    if (root) {
        root.setAttribute('aria-hidden', 'true');
    }
}

function unlockOverlayDom() {
    if (typeof window !== 'undefined') {
        window.__webPrivacyUnlockGraceUntil = Date.now() + UNLOCK_GRACE_MS;
    }
    if (typeof window !== 'undefined' && window.__webPrivacyUnlock) {
        window.__webPrivacyUnlock();
        return;
    }
    const el = document.getElementById(OVERLAY_ID);
    if (!el) {
        return;
    }
    window.__webPrivacyIsLocked = false;
    document.documentElement.classList.remove('privacy-locked');
    el.style.display = 'none';
    el.style.pointerEvents = 'none';
    const root = document.getElementById('root');
    if (root) {
        root.removeAttribute('aria-hidden');
    }
}

function ensureOverlayElement() {
    let el = document.getElementById(OVERLAY_ID);
    if (el) {
        return el;
    }

    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.style.cssText = [
        'display:none',
        'position:fixed',
        'top:0',
        'right:0',
        'bottom:0',
        'left:0',
        'z-index:999999',
        'background:#000',
        'align-items:center',
        'justify-content:center',
        'flex-direction:column',
    ].join(';');
    document.body.appendChild(el);
    return el;
}

export default function WebTabPrivacyGuard({ children }) {
    const [overlayContainer, setOverlayContainer] = useState(null);
    const isLockedRef = useRef(false);
    const idleTimerRef = useRef(null);

    const lockNow = useCallback(() => {
        if (isInUnlockGrace()) {
            return;
        }
        lockOverlayDom();
        isLockedRef.current = true;
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    }, []);

    const unlock = useCallback(() => {
        unlockOverlayDom();
        isLockedRef.current = false;
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(lockNow, getIdleLockMs());
    }, [lockNow]);

    const handleUnlock = useCallback(() => {
        unlock();
        resetIdleTimer();
    }, [unlock, resetIdleTimer]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }

        const el = ensureOverlayElement();
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        setOverlayContainer(el);
        isLockedRef.current = Boolean(window.__webPrivacyIsLocked);

        const onVisibilityChange = () => {
            if (document.hidden || document.visibilityState === 'hidden') {
                lockNow();
            }
        };

        const onActivity = () => {
            if (!document.hidden && !isLockedRef.current) {
                resetIdleTimer();
            }
        };

        const onViewportChange = () => {
            const viewport = window.visualViewport;
            if (!viewport || isLockedRef.current || document.hidden) {
                return;
            }
            if (viewport.height < window.innerHeight * 0.85) {
                lockNow();
            }
        };

        const onGlobalLock = () => {
            isLockedRef.current = true;
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
                idleTimerRef.current = null;
            }
        };

        const onGlobalUnlock = () => {
            isLockedRef.current = false;
            resetIdleTimer();
        };

        document.addEventListener('visibilitychange', onVisibilityChange, true);
        window.addEventListener('pagehide', lockNow, true);
        document.addEventListener('freeze', lockNow, true);
        document.addEventListener('touchcancel', lockNow, true);
        document.addEventListener('touchstart', onActivity, { passive: true });
        document.addEventListener('mousemove', onActivity, { passive: true });
        document.addEventListener('keydown', onActivity);
        window.visualViewport?.addEventListener('resize', onViewportChange);
        window.visualViewport?.addEventListener('scroll', onViewportChange);
        window.addEventListener('webprivacy-lock', onGlobalLock);
        window.addEventListener('webprivacy-unlock', onGlobalUnlock);

        if (!isLockedRef.current) {
            resetIdleTimer();
        }

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange, true);
            window.removeEventListener('pagehide', lockNow, true);
            document.removeEventListener('freeze', lockNow, true);
            document.removeEventListener('touchcancel', lockNow, true);
            document.removeEventListener('touchstart', onActivity);
            document.removeEventListener('mousemove', onActivity);
            document.removeEventListener('keydown', onActivity);
            window.visualViewport?.removeEventListener('resize', onViewportChange);
            window.visualViewport?.removeEventListener('scroll', onViewportChange);
            window.removeEventListener('webprivacy-lock', onGlobalLock);
            window.removeEventListener('webprivacy-unlock', onGlobalUnlock);
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [lockNow, resetIdleTimer]);

    return (
        <>
            {children}
            {overlayContainer
                ? createPortal(<PrivacySplash onUnlock={handleUnlock} />, overlayContainer)
                : null}
        </>
    );
}
