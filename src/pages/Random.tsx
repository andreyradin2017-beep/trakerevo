import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import type { Item } from '../types';
import { CategorySelector, type Category } from '../components/CategorySelector';
import { PageHeader } from '../components/PageHeader';

export const Random: React.FC = () => {
    const navigate = useNavigate();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<Item | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('all');

    const plannedItems = useLiveQuery(() => db.items.where({ status: 'planned' }).toArray());

    const filteredItems = useMemo(() => {
        if (!plannedItems) return [];
        if (activeCategory === 'all') return plannedItems;
        return plannedItems.filter(item => item.type === activeCategory);
    }, [plannedItems, activeCategory]);

    const handleSpin = () => {
        if (filteredItems.length === 0) return;

        setIsSpinning(true);
        setResult(null);

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * filteredItems.length);
            setResult(filteredItems[randomIndex]);
            setIsSpinning(false);
        }, 1200);
    };

    if (!plannedItems) return <div style={{ textAlign: 'center', padding: '4rem' }}>Загрузка...</div>;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <PageHeader title="Мне повезёт!" showBack />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>

                <CategorySelector
                    activeCategory={activeCategory}
                    onCategoryChange={(cat) => { setActiveCategory(cat); setResult(null); }}
                    style={{ marginBottom: '2.5rem' }}
                />

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
                    Доступно вариантов: <b style={{ color: 'var(--text-primary)' }}>{filteredItems.length}</b>
                </p>

                {/* Result Display Workspace */}
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '3rem'
                }}>
                    {isSpinning && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(255,255,255,0.1)',
                                borderTopColor: 'var(--primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginBottom: '1.5rem'
                            }} />
                            <p style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>Выбираю лучшее...</p>
                        </div>
                    )}

                    {result && !isSpinning && (
                        <div
                            onClick={() => navigate(`/item/${result.id}`)}
                            style={{
                                width: '100%',
                                background: 'var(--bg-surface-hover)',
                                borderRadius: 'var(--radius-xl)',
                                padding: '1.5rem',
                                border: '1px solid rgba(var(--primary-rgb), 0.3)',
                                boxShadow: 'var(--shadow-glow)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                animation: 'springIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            {result.image ? (
                                <img
                                    src={result.image}
                                    alt={result.title}
                                    style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '240px',
                                    background: 'var(--bg-surface-hover)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Shuffle size={48} color="var(--text-tertiary)" />
                                </div>
                            )}
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{result.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Кликни, чтобы открыть</p>
                        </div>
                    )}

                    {!result && !isSpinning && (
                        <div style={{
                            width: '240px',
                            height: '320px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-tertiary)',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            Нажми кнопку ниже, чтобы выбрать случайный вариант
                        </div>
                    )}
                </div>

                <button
                    disabled={filteredItems.length === 0 || isSpinning}
                    onClick={handleSpin}
                    style={{
                        background: 'var(--primary-gradient)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        padding: '1rem 2.5rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: filteredItems.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: filteredItems.length === 0 ? 0.5 : 1,
                        boxShadow: 'var(--shadow-glow)',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                >
                    <Shuffle size={24} />
                    {result ? 'Еще раз!' : 'Крутить!'}
                </button>

                {filteredItems.length === 0 && (
                    <p style={{ marginTop: '1.5rem', color: 'var(--error)', fontSize: '0.9rem' }}>
                        В этой категории пока пусто.
                    </p>
                )}
            </div>

            <style>{`
                @keyframes springIn {
                    0% { transform: scale(0.5) translateY(40px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0% { opacity: 0.6; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0.6; transform: scale(0.98); }
                }
            `}</style>
        </div>
    );
};
