import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu, RefreshCw, GripVertical, Eye } from 'lucide-react';

import { coinDataBackend } from './coinDataBackend.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';
import Spinner from './Spinner.jsx';

const WEB_PULL_THRESHOLD = 72;

function HoldingItem({ holding, onPress }) {
    return (
        <div className="holding-list-item">
            <button type="button" className="holding-link holding-link--full" onClick={onPress}>
                <AssetRow asset={holding} />
            </button>
        </div>
    );
}

function SortableHolding({ holding, onPress, suppressClickRef }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: holding.symbol });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    function handleClick() {
        if (suppressClickRef.current) {
            return;
        }
        onPress();
    }

    return (
        <div ref={setNodeRef} style={style} className="holding-list-item">
            <div
                className={`holding-row-shell${
                    isDragging ? ' holding-row-shell--dragging' : ''
                }`}
            >
                <button
                    type="button"
                    className="holding-drag-handle"
                    aria-label={`Reorder ${holding.name}`}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={20} strokeWidth={2} />
                </button>
                <button type="button" className="holding-link" onClick={handleClick}>
                    <AssetRow asset={holding} dragging={isDragging} />
                </button>
            </div>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const reorderMode = searchParams.get('reorder') === '1';
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [multiple, setMultiple] = useState(1);
    const [webPullDistance, setWebPullDistance] = useState(0);
    const webPullDistanceRef = useRef(0);
    const scrollOffsetY = useRef(0);
    const refreshIdRef = useRef(0);
    const pricesFetchIdRef = useRef(0);
    const skipPathRefreshRef = useRef(true);
    const scrollRef = useRef(null);
    const suppressClickRef = useRef(false);
    const successTimeoutRef = useRef(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function applyDreamPrices(assets, theMultiple) {
        return assets.map((asset) => {
            const copy = asset;
            const basePrice = copy.lastBasePrice || 0;
            copy.price = basePrice * theMultiple;
            return copy;
        });
    }

    function clearRefreshSuccessFlash() {
        if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
            successTimeoutRef.current = null;
        }
        setRefreshSuccess(false);
    }

    function flashRefreshSuccess() {
        clearRefreshSuccessFlash();
        setRefreshSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
            setRefreshSuccess(false);
            successTimeoutRef.current = null;
        }, 1000);
    }

    async function refresh({ showSpinner = false, fetchPrices = true } = {}) {
        const refreshId = ++refreshIdRef.current;
        // Soft reloads must not abort an in-flight price fetch (common race on
        // mount / navigate-back). Only a newer fetchPrices call can cancel one.
        const pricesFetchId = fetchPrices
            ? ++pricesFetchIdRef.current
            : pricesFetchIdRef.current;
        const spinStartedAt = showSpinner ? Date.now() : 0;
        let succeeded = false;
        if (showSpinner) {
            clearRefreshSuccessFlash();
            setRefreshing(true);
        }
        try {
            const theMultiple = (await getDreamMultiple()) || 1;
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            setMultiple(theMultiple);
            const assets = await getAssets();
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            if (assets.length === 0) {
                setHoldings([]);
                succeeded = true;
                return;
            }

            setHoldings(applyDreamPrices(assets, theMultiple));
            setLoading(false);

            const needsPrices =
                fetchPrices || assets.some((asset) => !asset.lastBasePrice);
            if (!needsPrices) {
                succeeded = true;
                return;
            }

            const prices = await coinDataBackend.getAssetsPrices(assets);
            if (pricesFetchId !== pricesFetchIdRef.current) {
                return;
            }

            const latestAssets = await getAssets();
            if (pricesFetchId !== pricesFetchIdRef.current) {
                return;
            }
            latestAssets.forEach((asset) => {
                const fetchedPrice = prices[asset.symbol];
                if (fetchedPrice != null) {
                    asset.lastBasePrice = fetchedPrice;
                }
            });
            await saveAssets(latestAssets);
            if (pricesFetchId !== pricesFetchIdRef.current) {
                return;
            }
            const currentMultiple = (await getDreamMultiple()) || 1;
            if (pricesFetchId !== pricesFetchIdRef.current) {
                return;
            }
            setMultiple(currentMultiple);
            setHoldings(applyDreamPrices(latestAssets, currentMultiple));
            succeeded = true;
        } catch {
            // Keep showing cached portfolio if price refresh fails.
        } finally {
            if (showSpinner && pricesFetchId === pricesFetchIdRef.current) {
                const remaining = Math.max(0, 1000 - (Date.now() - spinStartedAt));
                if (remaining > 0) {
                    await new Promise((resolve) => setTimeout(resolve, remaining));
                }
                if (pricesFetchId === pricesFetchIdRef.current) {
                    setRefreshing(false);
                    if (succeeded) {
                        flashRefreshSuccess();
                    }
                }
            }
            if (refreshId === refreshIdRef.current) {
                setLoading(false);
            }
        }
    }

    function pullRefresh() {
        refresh({ showSpinner: true, fetchPrices: true });
    }

    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) {
            return undefined;
        }

        let startY = 0;
        let tracking = false;

        const onTouchStart = (event) => {
            if (event.target.closest('.holding-drag-handle')) {
                tracking = false;
                return;
            }
            if (refreshing || scrollOffsetY.current > 5) {
                tracking = false;
                return;
            }
            startY = event.touches[0].clientY;
            tracking = true;
        };

        const onTouchMove = (event) => {
            if (!tracking) {
                return;
            }
            if (scrollOffsetY.current > 5) {
                tracking = false;
                webPullDistanceRef.current = 0;
                setWebPullDistance(0);
                return;
            }
            const delta = event.touches[0].clientY - startY;
            if (delta > 0) {
                const distance = Math.min(delta, 100);
                webPullDistanceRef.current = distance;
                setWebPullDistance(distance);
            } else {
                tracking = false;
                webPullDistanceRef.current = 0;
                setWebPullDistance(0);
            }
        };

        const onTouchEnd = () => {
            if (
                tracking &&
                webPullDistanceRef.current >= WEB_PULL_THRESHOLD &&
                !refreshing
            ) {
                pullRefresh();
            }
            tracking = false;
            webPullDistanceRef.current = 0;
            setWebPullDistance(0);
        };

        scrollEl.addEventListener('touchstart', onTouchStart, { passive: true });
        scrollEl.addEventListener('touchmove', onTouchMove, { passive: true });
        scrollEl.addEventListener('touchend', onTouchEnd, { passive: true });
        scrollEl.addEventListener('touchcancel', onTouchEnd, { passive: true });

        return () => {
            scrollEl.removeEventListener('touchstart', onTouchStart);
            scrollEl.removeEventListener('touchmove', onTouchMove);
            scrollEl.removeEventListener('touchend', onTouchEnd);
            scrollEl.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [refreshing]);

    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        refresh({ fetchPrices: true });
    }, []);

    useEffect(() => {
        if (location.pathname !== '/') {
            return;
        }
        // Initial mount already loads with prices — skip the duplicate soft reload
        // that used to cancel that fetch via refreshId.
        if (skipPathRefreshRef.current) {
            skipPathRefreshRef.current = false;
            return;
        }
        refresh({ fetchPrices: false });
    }, [location.pathname]);

    async function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = holdings.findIndex((h) => h.symbol === active.id);
        const newIndex = holdings.findIndex((h) => h.symbol === over.id);
        const reordered = arrayMove(holdings, oldIndex, newIndex);
        setHoldings(reordered);

        const assets = await getAssets();
        const bySymbol = Object.fromEntries(assets.map((asset) => [asset.symbol, asset]));
        const saved = reordered.map((holding) => bySymbol[holding.symbol]).filter(Boolean);
        if (saved.length === reordered.length) {
            await saveAssets(saved);
        }
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading-container">
                    <Spinner />
                    <p className="field-label mt-16">Loading portfolio</p>
                </div>
            </div>
        );
    }

    const totalBalance = holdings.reduce((prev, curr) => prev + curr.balance(), 0);
    const totalInterest = holdings.reduce((prev, curr) => prev + curr.yearly(), 0);
    const hasHoldings = holdings.length > 0;

    function openAsset(holding) {
        navigate(`/asset/${holding.symbol}`, {
            state: { price: holding.price },
        });
    }

    function exitReorderMode() {
        setSearchParams({});
    }

    function lockPrivacy() {
        window.__webPrivacyLock?.();
    }

    const holdingsList = holdings.map((holding) =>
        reorderMode ? (
            <SortableHolding
                key={holding.symbol}
                holding={holding}
                suppressClickRef={suppressClickRef}
                onPress={() => openAsset(holding)}
            />
        ) : (
            <HoldingItem
                key={holding.symbol}
                holding={holding}
                onPress={() => openAsset(holding)}
            />
        ),
    );

    return (
        <div className="container">
            <div
                ref={scrollRef}
                className="home-scroll"
                onScroll={(event) => {
                    scrollOffsetY.current = event.currentTarget.scrollTop;
                }}
            >
                <div className="home-screen-padding">
                    {webPullDistance > 12 && (
                        <div
                            className="pull-indicator"
                            style={{
                                opacity: Math.min(
                                    webPullDistance / WEB_PULL_THRESHOLD,
                                    1
                                ),
                            }}
                        >
                            <Spinner small />
                        </div>
                    )}

                    <div className="home-toolbar">
                        <button
                            type="button"
                            className="icon-button"
                            onClick={() => navigate('/settings')}
                            aria-label="Settings"
                        >
                            <Menu size={24} color="#ddd" />
                        </button>
                        <div className="home-toolbar-primary">
                            <button
                                type="button"
                                className={`icon-button icon-button--wide${
                                    refreshing ? ' icon-button--spinning' : ''
                                }`}
                                onClick={pullRefresh}
                                disabled={refreshing}
                                aria-label="Refresh prices"
                                aria-busy={refreshing}
                            >
                                <RefreshCw
                                    size={26}
                                    color={refreshSuccess ? '#22c55e' : '#ddd'}
                                    className={refreshing ? 'icon-spin' : undefined}
                                />
                            </button>
                            <button
                                type="button"
                                className="icon-button icon-button--wide"
                                onClick={lockPrivacy}
                                aria-label="Hide portfolio"
                            >
                                <Eye size={26} color="#ddd" />
                            </button>
                        </div>
                    </div>

                    {reorderMode && hasHoldings && (
                        <div className="reorder-banner">
                            <p className="reorder-banner-text">
                                Drag the handles to reorder your assets
                            </p>
                            <button
                                type="button"
                                className="button-secondary reorder-banner-button"
                                onClick={exitReorderMode}
                            >
                                <span className="button-text-secondary">Done reordering</span>
                            </button>
                        </div>
                    )}

                    {multiple !== 1 && !reorderMode && (
                        <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className={`dream-banner${multiple < 1 ? ' dream-banner--negative' : ''}`}
                        >
                            <span
                                className={`dream-banner-text${
                                    multiple >= 1
                                        ? ' dream-banner-text--positive'
                                        : ' dream-banner-text--negative'
                                }`}
                            >
                                Prices multiplied {multiple}x — tap to adjust
                            </span>
                        </button>
                    )}

                    {hasHoldings ? (
                        <div className="card mb-12">
                            <p className="field-label">Total balance</p>
                            <p className="portfolio-balance">
                                {formatCurrency(totalBalance, false)}
                            </p>
                            <p className="portfolio-interest">
                                {formatCurrency(totalInterest / 12, false)} / mo interest
                            </p>
                        </div>
                    ) : (
                        !refreshing && (
                            <div className="card card--centered">
                                <h2 className="section-title">No assets yet</h2>
                                <p className="section-description">
                                    Add holdings to track balances and interest.
                                </p>
                                <button
                                    type="button"
                                    className="button-secondary mt-16"
                                    onClick={() => navigate('/add')}
                                >
                                    <span className="button-text-secondary">Add assets</span>
                                </button>
                            </div>
                        )
                    )}
                </div>

                {hasHoldings &&
                    (reorderMode ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={() => {
                                suppressClickRef.current = true;
                            }}
                            onDragEnd={(event) => {
                                handleDragEnd(event);
                                setTimeout(() => {
                                    suppressClickRef.current = false;
                                }, 200);
                            }}
                            onDragCancel={() => {
                                setTimeout(() => {
                                    suppressClickRef.current = false;
                                }, 200);
                            }}
                        >
                            <SortableContext
                                items={holdings.map((h) => h.symbol)}
                                strategy={verticalListSortingStrategy}
                            >
                                {holdingsList}
                            </SortableContext>
                        </DndContext>
                    ) : (
                        holdingsList
                    ))}

                <div style={{ height: 100 }} />
            </div>
        </div>
    );
}
