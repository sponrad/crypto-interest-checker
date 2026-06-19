import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { coinDataBackend } from './coinDataBackend.js';
import AssetImage from './AssetImage.jsx';
import Spinner from './Spinner.jsx';
import { getAssets, saveAssets } from './localStorage.js';

function FormSection({ label, children }) {
    return (
        <div className="card">
            <p className="field-label">{label}</p>
            {children}
        </div>
    );
}

export default function AddScreen() {
    const navigate = useNavigate();
    const [text, onChangeText] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [quantity, onChangeQuantity] = useState('');
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [loadedAll, setLoadedAll] = useState(false);

    const loadMore = useCallback(() => {
        if (loading || loadedAll) {
            return;
        }
        setLoading(true);
        coinDataBackend
            .getTopAssets(page)
            .then((assets) => {
                setPage((p) => p + 1);
                setAvailableAssets((prev) => {
                    const currentSymbols = prev.map((asset) => asset.symbol);
                    const dedupedAssets = assets.filter(
                        (asset) => !currentSymbols.includes(asset.symbol),
                    );
                    return prev.concat(dedupedAssets);
                });
                if (assets.length === 0) {
                    setLoadedAll(true);
                }
            })
            .catch(() => setLoadedAll(true))
            .finally(() => setLoading(false));
    }, [loading, loadedAll, page]);

    useEffect(() => {
        loadMore();
    }, []);

    const filteredAssets = useMemo(
        () =>
            availableAssets.filter((asset) => {
                return (
                    asset.name.toLowerCase().includes(text.toLowerCase()) ||
                    asset.symbol.toLowerCase() === text.toLowerCase()
                );
            }),
        [text, availableAssets],
    );

    useEffect(() => {
        if (!loading && !loadedAll && text && filteredAssets.length < 10) {
            loadMore();
        }
    }, [text, filteredAssets.length, loading, loadedAll, loadMore]);

    function clearSelection() {
        setSelectedAsset(null);
        onChangeQuantity('');
    }

    async function onSave() {
        const assets = await getAssets();
        const currentSymbols = assets.map((asset) => asset.symbol);
        if (currentSymbols.includes(selectedAsset.symbol)) {
            const index = assets.findIndex(
                (asset) => asset.symbol === selectedAsset.symbol,
            );
            assets[index].quantity += Number(quantity);
            await saveAssets(assets);
        } else {
            selectedAsset.quantity = Number(quantity);
            await saveAssets(assets.concat([selectedAsset]));
        }
        navigate('/');
    }

    if (selectedAsset) {
        return (
            <div className="scroll-area">
                <div className="screen-padding">
                    <div className="card mb-20">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <AssetImage asset={selectedAsset} />
                            <div className="list-row-text">
                                <div className="list-row-name">{selectedAsset.name}</div>
                                <div className="list-row-symbol">{selectedAsset.symbol}</div>
                            </div>
                        </div>
                    </div>

                    <FormSection label="Holdings">
                        <input
                            className="modern-input"
                            onChange={(e) => onChangeQuantity(e.target.value)}
                            value={quantity}
                            placeholder="Quantity"
                            inputMode="decimal"
                            autoFocus
                        />
                        <div className="button-row mt-14">
                            <button
                                type="button"
                                className="button-primary button-primary--in-row"
                                disabled={!quantity}
                                onClick={onSave}
                            >
                                <span className="button-text-primary">Add to portfolio</span>
                            </button>
                            <button type="button" className="button-ghost" onClick={clearSelection}>
                                <span className="button-text-ghost">Back</span>
                            </button>
                        </div>
                    </FormSection>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="search-bar">
                <p className="field-label">Search assets</p>
                <input
                    className="modern-input"
                    onChange={(e) => onChangeText(e.target.value)}
                    placeholder="Name or symbol…"
                    value={text}
                    autoCapitalize="off"
                    autoCorrect="off"
                />
            </div>

            {loading && filteredAssets.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <Spinner />
                </div>
            )}

            {loadedAll && filteredAssets.length === 0 && (
                <p className="empty-text">
                    {text ? 'No assets match your search' : 'No assets loaded'}
                </p>
            )}

            <div className="asset-list screen-padding" style={{ paddingTop: 0 }}>
                {filteredAssets.map((asset) => (
                    <button
                        key={asset.symbol}
                        type="button"
                        className="list-row"
                        onClick={() => setSelectedAsset(asset)}
                    >
                        <AssetImage asset={asset} />
                        <div className="list-row-text">
                            <div className="list-row-name">{asset.name}</div>
                            <div className="list-row-symbol">{asset.symbol}</div>
                        </div>
                    </button>
                ))}
                {loading && filteredAssets.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                        <Spinner small />
                    </div>
                )}
            </div>
        </>
    );
}
