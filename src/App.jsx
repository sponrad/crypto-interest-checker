import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PageLayout from './PageLayout.jsx';
import Home from './Home.jsx';
import AddScreen from './AddScreen.jsx';
import AssetScreen from './AssetScreen.jsx';
import SettingsScreen from './SettingsScreen.jsx';

export function App() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/add"
                        element={
                            <PageLayout title="Add Asset">
                                <AddScreen />
                            </PageLayout>
                        }
                    />
                    <Route
                        path="/asset/:symbol"
                        element={
                            <PageLayout title="Configure Asset" dynamicTitle>
                                <AssetScreen />
                            </PageLayout>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PageLayout title="Settings">
                                <SettingsScreen />
                            </PageLayout>
                        }
                    />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
