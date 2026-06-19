import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageLayout({ title, dynamicTitle, children }) {
    const navigate = useNavigate();

    return (
        <>
            <header className="page-header">
                <button
                    type="button"
                    className="page-header-back"
                    onClick={() => navigate('/')}
                >
                    ← Home
                </button>
                <h1 className="page-header-title">{dynamicTitle ? '' : title}</h1>
            </header>
            <div className="container">{children}</div>
        </>
    );
}

export function setPageTitle(title) {
    const el = document.querySelector('.page-header-title');
    if (el) {
        el.textContent = title;
    }
}
