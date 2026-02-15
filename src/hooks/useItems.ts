import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Category } from '../components/CategorySelector';

export function useRecentItems(category: Category) {
    return useLiveQuery(async () => {
        const all = await db.items.toArray();
        const sorted = all.sort((a, b) => (b.id || 0) - (a.id || 0));
        
        // Filter out archived items
        const available = sorted.filter(item => (item as any).isArchived !== true && (item as any).isArchived !== 1);

        if (category === 'all') {
            return available.slice(0, 20);
        }
        return available.filter(item => item.type === category);
    }, [category]);
}

export function useLibrarySearch(query: string, category: Category) {
    return useLiveQuery(async () => {
        const trimmedQuery = query.trim().toLowerCase();
        const all = await db.items.toArray();

        return all.filter(item => {
            const matchesQuery = !trimmedQuery || item.title.toLowerCase().includes(trimmedQuery);
            const matchesCategory = category === 'all' || item.type === category;
            const isUnarchived = (item as any).isArchived !== true && (item as any).isArchived !== 1;
            
            return matchesQuery && matchesCategory && isUnarchived;
        }).map(i => ({ ...i, isOwned: true }));
    }, [query, category]);
}
