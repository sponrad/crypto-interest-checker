import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { setPageTitle } from './PageLayout.jsx';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

function FormSection({ label, children }) {
    return (
        <div className="card">
            <p className="field-label">{label}</p>
            {children}
        </div>
    );
}

export default function AssetScreen() {
    const navigate = useNavigate();
    const { symbol } = useParams();
    const location = useLocation();
    const priceFromNav = location.state?.price;
    const [asset, setAsset] = useState(null);
    const [editQuantity, setEditQuantity] = useState(false);
    const [quantity, setQuantity] = useState(null);
    const [editInterest, setEditInterest] = useState(false);
    const [interestRate, setInterestRate] = useState('0');

    async function load() {
        const assets = await getAssets();
        const theAsset = assets.find((a) => a.symbol === symbol);
        if (!theAsset) {
            navigate('/');
            return;
        }
        setPageTitle(theAsset.symbol);
        const multiple = (await getDreamMultiple()) || 1;
        theAsset.price = priceFromNav ?? (theAsset.lastBasePrice || 0) * multiple;
        setAsset(theAsset);
        setQuantity(theAsset.quantity.toString());
        setInterestRate(theAsset.globalInterest().toString());
    }

    useEffect(() => {
        load();
    }, [symbol]);

    if (!asset) {
        return null;
    }

    async function onSaveQuantity() {
        const assets = await getAssets();
        const index = assets.findIndex((a) => a.symbol === symbol);
        assets[index].quantity = Number(quantity);
        assets[index].price = asset.price;
        assets[index].setInterestRate(
            Number(interestRate) || assets[index].globalInterest(),
        );
        await saveAssets(assets);
        setAsset(assets[index]);
        setEditQuantity(false);
    }

    async function onRemove() {
        const assets = await getAssets();
        await saveAssets(assets.filter((a) => a.symbol !== symbol));
        navigate('/');
    }

    async function onSaveInterestRate() {
        const assets = await getAssets();
        const index = assets.findIndex((a) => a.symbol === symbol);
        assets[index].setInterestRate(Number(interestRate));
        await saveAssets(assets);
        setAsset((prevAsset) => {
            const assetCopy = prevAsset;
            assetCopy.setInterestRate(Number(interestRate));
            return assetCopy;
        });
        setEditInterest(false);
    }

    function cancelQuantityEdit() {
        setQuantity(asset.quantity.toString());
        setEditQuantity(false);
    }

    function cancelInterestEdit() {
        setInterestRate(asset.globalInterest().toString());
        setEditInterest(false);
    }

    const interestDisplay = asset.globalInterest();

    return (
        <div className="scroll-area">
            <div className="screen-padding">
                <div className="card mb-20" style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <AssetRow asset={asset} embedded />
                </div>

                <FormSection label="Holdings">
                    {!editQuantity ? (
                        <>
                            <p className="value-large">{asset.quantity}</p>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => setEditQuantity(true)}
                            >
                                <span className="button-text-secondary">Edit quantity</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                className="modern-input"
                                onChange={(e) => setQuantity(e.target.value)}
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
                                    onClick={onSaveQuantity}
                                >
                                    <span className="button-text-primary">Save</span>
                                </button>
                                <button
                                    type="button"
                                    className="button-ghost"
                                    onClick={cancelQuantityEdit}
                                >
                                    <span className="button-text-ghost">Cancel</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                className="button-destructive"
                                onClick={onRemove}
                            >
                                <span className="button-text-destructive">
                                    Remove {asset.name}
                                </span>
                            </button>
                        </>
                    )}
                </FormSection>

                <FormSection label="Interest rate">
                    {!editInterest ? (
                        <>
                            <p className="value-large">
                                {interestDisplay}
                                <span className="text-muted">%</span>
                            </p>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={() => {
                                    setInterestRate(interestDisplay.toString());
                                    setEditInterest(true);
                                }}
                            >
                                <span className="button-text-secondary">
                                    Edit interest rate
                                </span>
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                className="modern-input"
                                onChange={(e) => setInterestRate(e.target.value)}
                                value={interestRate}
                                placeholder="e.g. 5.25"
                                inputMode="decimal"
                                autoFocus
                            />
                            <p className="text-dim mt-8" style={{ marginBottom: 4 }}>
                                Annual percentage yield
                            </p>
                            <div className="button-row mt-12">
                                <button
                                    type="button"
                                    className="button-primary button-primary--in-row"
                                    disabled={!interestRate}
                                    onClick={onSaveInterestRate}
                                >
                                    <span className="button-text-primary">Save</span>
                                </button>
                                <button
                                    type="button"
                                    className="button-ghost"
                                    onClick={cancelInterestEdit}
                                >
                                    <span className="button-text-ghost">Cancel</span>
                                </button>
                            </div>
                        </>
                    )}
                </FormSection>
            </div>
        </div>
    );
}
