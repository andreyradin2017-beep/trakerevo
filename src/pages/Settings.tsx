import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db/db';
import { PageHeader } from '../components/PageHeader';
import { Save, Trash2, Database, Key, Info, Download, Upload, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
    const [tmdbKey, setTmdbKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [stats, setStats] = useState({ items: 0, lists: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        db.settings.get('tmdb_key').then(s => {
            if (s) setTmdbKey(s.value);
        });
        refreshStats();
    }, []);

    const refreshStats = async () => {
        const [items, lists] = await Promise.all([
            db.items.count(),
            db.lists.count()
        ]);
        setStats({ items, lists });
    };

    const handleSaveKey = async () => {
        setSaving(true);
        await db.settings.put({ key: 'tmdb_key', value: tmdbKey });
        setTimeout(() => setSaving(false), 500);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = {
                items: await db.items.toArray(),
                lists: await db.lists.toArray(),
                settings: await db.settings.toArray(),
                exportDate: new Date().toISOString(),
                version: 6
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trakerevo_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Ошибка при экспорте данных');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.items || !data.lists) {
                throw new Error('Неверный формат файла бэкапа');
            }

            if (window.confirm(`Вы уверены? Это действие перезапишет текущие данные (${data.items.length} элементов и ${data.lists.length} списков).`)) {
                await Promise.all([
                    db.items.clear(),
                    db.lists.clear(),
                    db.settings.clear()
                ]);

                if (data.items.length > 0) await db.items.bulkAdd(data.items);
                if (data.lists.length > 0) await db.lists.bulkAdd(data.lists);
                if (data.settings && data.settings.length > 0) await db.settings.bulkAdd(data.settings);

                alert('Данные успешно импортированы!');
                window.location.reload();
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Ошибка при импорте: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearDatabase = async () => {
        if (window.confirm('ВНИМАНИЕ: Это удалит ВСЕ элементы и списки. Это действие необратимо! Вы уверены?')) {
            await Promise.all([
                db.items.clear(),
                db.lists.clear(),
                db.settings.clear(),
                db.cache.clear(),
                db.search_history.clear()
            ]);
            window.location.reload();
        }
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <PageHeader title="Настройки" showBack />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>

                {/* TMDB API Key */}
                <div style={{
                    padding: '1.25rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: 'var(--border-glass)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
                            <Key size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>TMDB API Ключ</h3>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                        Используется для поиска фильмов и получения метаданных (трейлеры, провайдеры).
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="password"
                            value={tmdbKey}
                            onChange={(e) => setTmdbKey(e.target.value)}
                            placeholder="Введите ваш API Key"
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-lg)',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveKey}
                            style={{
                                padding: '0 1rem',
                                background: 'var(--primary-gradient)',
                                border: 'none',
                                borderRadius: 'var(--radius-lg)',
                                color: 'white',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                        </motion.button>
                    </div>
                </div>

                {/* Database Info */}
                <div style={{
                    padding: '1.25rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: 'var(--border-glass)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
                            <Database size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>База данных</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.items}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Элементов</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.lists}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Списков</div>
                        </div>
                    </div>

                    {/* Backup Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExport}
                            disabled={exporting}
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {exporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />} Экспорт
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {importing ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />} Импорт
                        </motion.button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".json"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <button
                        onClick={clearDatabase}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--error)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={18} /> Очистить все данные
                    </button>
                </div>

                {/* App Info */}
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Info size={14} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TrakerEvo v1.2.0</span>
                    </div>
                    <p style={{ fontSize: '0.65rem', margin: 0 }}>Built with React & Dexie DB</p>
                </div>

            </div>
        </div>
    );
};
