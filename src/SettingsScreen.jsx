import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    getDreamMultiple,
    setDreamMultiple,
    exportPortfolioJson,
    importPortfolioJson,
} from './localStorage.js';

const PRESETS = ['0.5', '2', '4', '8', '10', '15', '20'];

function isStandaloneWebApp() {
    if (typeof window === 'undefined') {
        return false;
    }
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

export default function SettingsScreen() {
    const navigate = useNavigate();
    const [multiple, setMultiple] = useState('1');
    const [backupMessage, setBackupMessage] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);

    useEffect(() => {
        getDreamMultiple().then((value) => {
            setMultiple(value.toString());
        });
    }, []);

    const multipleNum = Number(multiple) || 1;
    const isDreamMode = multipleNum >= 1;
    const isActive = (value) => multipleNum === Number(value);

    function updateDreamMultiple(val) {
        setMultiple(val);
    }

    async function applyDreamMultiple(val) {
        updateDreamMultiple(val);
        await setDreamMultiple(val);
    }

    async function dreamAndLeave(val) {
        await applyDreamMultiple(val);
        navigate('/');
    }

    async function copyBackup() {
        try {
            const json = await exportPortfolioJson();
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(json);
                setBackupMessage('Portfolio copied to clipboard.');
            } else {
                setImportText(json);
                setShowImport(true);
                setBackupMessage('Copy the backup text below.');
            }
        } catch {
            setBackupMessage('Could not export portfolio.');
        }
    }

    async function pasteFromClipboard() {
        if (!navigator.clipboard?.readText) {
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            setImportText(text);
            setShowImport(true);
            setBackupMessage('Pasted from clipboard.');
        } catch {
            setBackupMessage('Could not read clipboard.');
        }
    }

    async function restoreBackup() {
        try {
            const count = await importPortfolioJson(importText);
            setBackupMessage(`Restored ${count} assets.`);
            setImportText('');
            setShowImport(false);
        } catch {
            setBackupMessage('Invalid backup — check the JSON and try again.');
        }
    }

    return (
        <div className="scroll-area">
            <div className="screen-padding">
                <div className="card">
                    <h2 className="section-title">
                        {isDreamMode ? 'Dream' : 'Nightmare'} mode
                    </h2>
                    <p className="section-description">
                        Multiply asset prices to see how your portfolio performs as the
                        market changes. Only affects the main screen.
                    </p>

                    {multipleNum !== 1 && (
                        <p className="value-large mt-16" style={{ marginBottom: 0 }}>
                            {multipleNum}
                            <span className="text-muted">x</span>
                        </p>
                    )}

                    <div className="chip-grid">
                        {PRESETS.map((dream) => {
                            const active = isActive(dream);
                            return (
                                <button
                                    key={dream}
                                    type="button"
                                    onClick={() => dreamAndLeave(dream)}
                                    className={`chip${active ? ' chip--active' : ''}`}
                                >
                                    <span
                                        className={`chip-text${active ? ' chip-text--active' : ''}`}
                                    >
                                        {dream}x
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {multipleNum !== 1 && (
                        <button
                            type="button"
                            className="button-secondary mt-16"
                            onClick={() => dreamAndLeave('1')}
                        >
                            <span className="button-text-secondary">Reset to 1x</span>
                        </button>
                    )}

                    <p className="field-label mt-24">Custom multiplier</p>
                    <input
                        className="modern-input"
                        value={multiple}
                        onChange={(e) => updateDreamMultiple(e.target.value)}
                        placeholder="e.g. 1, 10, 0.5"
                        inputMode="decimal"
                    />
                    <button
                        type="button"
                        className="button-primary mt-12"
                        onClick={() =>
                            applyDreamMultiple(multiple).then(() => navigate('/'))
                        }
                    >
                        <span className="button-text-primary" style={{ textAlign: 'center' }}>
                            Apply & return home
                        </span>
                    </button>
                </div>

                <div className="card">
                    <h2 className="section-title">Backup & sync</h2>
                    <p className="section-description">
                        Export from one device and import into another to copy your
                        portfolio.
                    </p>
                    {isStandaloneWebApp() && (
                        <p className="body-text mt-8">
                            You are using the Home Screen app.
                        </p>
                    )}
                    <button type="button" className="button-secondary mt-16" onClick={copyBackup}>
                        <span className="button-text-secondary">Export portfolio</span>
                    </button>
                    {navigator.clipboard?.readText && (
                        <button
                            type="button"
                            className="button-secondary mt-12"
                            onClick={pasteFromClipboard}
                        >
                            <span className="button-text-secondary">Paste from clipboard</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="button-ghost mt-12"
                        onClick={() => setShowImport((value) => !value)}
                    >
                        <span className="button-text-ghost">
                            {showImport ? 'Hide import' : 'Import portfolio'}
                        </span>
                    </button>
                    {showImport && (
                        <>
                            <textarea
                                className="modern-input modern-input--multiline mt-12"
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="Paste backup JSON here"
                                autoCapitalize="off"
                                autoCorrect="off"
                            />
                            <button
                                type="button"
                                className="button-primary mt-12"
                                onClick={restoreBackup}
                            >
                                <span
                                    className="button-text-primary"
                                    style={{ textAlign: 'center' }}
                                >
                                    Restore backup
                                </span>
                            </button>
                        </>
                    )}
                    {backupMessage ? (
                        <p className="body-text mt-12">{backupMessage}</p>
                    ) : null}
                </div>

                <div className="card">
                    <h2 className="section-title">About</h2>
                    <p className="body-text">Crypto Checker with Interest by Conrad Frame.</p>
                    <p className="body-text">
                        Email{' '}
                        <span className="link-text" style={{ userSelect: 'all' }}>
                            conrad@devlabtech.com
                        </span>{' '}
                        for support.
                    </p>
                </div>
            </div>
        </div>
    );
}
