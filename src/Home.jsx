import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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
import { Menu, Plus, RefreshCw } from 'lucide-react';

import { coinDataBackend } from './coinDataBackend.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';
import Spinner from './Spinner.jsx';

const WEB_PULL_THRESHOLD = 72;

function SortableHolding({ holding, onPress }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: holding.symbol });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="holding-list-item">
            <button
                type="button"
                className={`holding-link${isDragging ? ' holding-link--dragging' : ''}`}
                onClick={onPress}
                {...attributes}
                {...listeners}
            >
                <AssetRow asset={holding} dragging={isDragging} />
            </button>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [multiple, setMultiple] = useState(1);
    const [webPullDistance, setWebPullDistance] = useState(0);
    const webPullDistanceRef = useRef(0);
    const scrollOffsetY = useRef(0);
    const refreshIdRef = useRef(0);
    const scrollRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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

    async function refresh({ showSpinner = false, fetchPrices = true } = {}) {
        const refreshId = ++refreshIdRef.current;
        if (showSpinner) {
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
                return;
            }

            setHoldings(applyDreamPrices(assets, theMultiple));
            setLoading(false);

            const needsPrices =
                fetchPrices || assets.some((asset) => !asset.lastBasePrice);
            if (!needsPrices) {
                return;
            }

            const prices = await coinDataBackend.getAssetsPrices(assets);
            if (refreshId !== refreshIdRef.current) {
                return;
            }

            const latestAssets = await getAssets();
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            latestAssets.forEach((asset) => {
                const fetchedPrice = prices[asset.symbol];
                if (fetchedPrice != null) {
                    asset.lastBasePrice = fetchedPrice;
                }
            });
            await saveAssets(latestAssets);
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            setHoldings(applyDreamPrices(latestAssets, theMultiple));
        } catch {
            // Keep showing cached portfolio if price refresh fails.
        } finally {
            if (refreshId === refreshIdRef.current) {
                setRefreshing(false);
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
        refresh({ fetchPrices: true });
    }, []);

    useEffect(() => {
        if (location.pathname === '/') {
            refresh({ fetchPrices: false });
        }
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
                    {(refreshing || webPullDistance > 12) && (
                        <div
                            className="pull-indicator"
                            style={{
                                opacity: refreshing
                                    ? 1
                                    : Math.min(webPullDistance / WEB_PULL_THRESHOLD, 1),
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
                        <div className="icon-button-group">
                            <button
                                type="button"
                                className="icon-button"
                                onClick={pullRefresh}
                                disabled={refreshing}
                                aria-label="Refresh prices"
                            >
                                <RefreshCw
                                    size={22}
                                    color={refreshing ? '#555' : '#ddd'}
                                />
                            </button>
                            <button
                                type="button"
                                className="icon-button"
                                onClick={() => navigate('/add')}
                                aria-label="Add asset"
                            >
                                <Plus size={26} color="#ddd" />
                            </button>
                        </div>
                    </div>

                    {multiple !== 1 && (
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

                {hasHoldings && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={holdings.map((h) => h.symbol)}
                            strategy={verticalListSortingStrategy}
                        >
                            {holdings.map((holding) => (
                                <SortableHolding
                                    key={holding.symbol}
                                    holding={holding}
                                    onPress={() =>
                                        navigate(`/asset/${holding.symbol}`, {
                                            state: { price: holding.price },
                                        })
                                    }
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}

                <div style={{ height: 100 }} />
            </div>
        </div>
    );
}
