import React from 'react';

export default function PrivacySplash({ onUnlock }) {
    const content = (
        <>
            <img className="privacy-splash-icon" src="/icon.png" alt="" />
            <p className="privacy-splash-title">👁 Privacy 👁</p>
            {onUnlock ? (
                <p className="privacy-splash-hint">Tap to view portfolio</p>
            ) : null}
        </>
    );

    if (onUnlock) {
        return (
            <button type="button" className="privacy-splash" onClick={onUnlock}>
                {content}
            </button>
        );
    }

    return <div className="privacy-splash">{content}</div>;
}
