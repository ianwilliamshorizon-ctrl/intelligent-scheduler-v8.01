import { useState, useMemo, useEffect } from 'react';
import { saveDocument, deleteDocument } from '../../../core/db';

interface UseManagementTableProps<T> {
    data: T[];
    searchFields: (keyof T)[];
    collectionName?: string;
    initialSortKey?: keyof T;
    initialSortOrder?: 'asc' | 'desc';
    pageSize?: number;
    externalSearchTerm?: string;
}

export function useManagementTable<T extends { id: string }>({
    data = [],
    searchFields,
    collectionName = '',
    initialSortKey,
    initialSortOrder = 'asc',
    pageSize = 50,
    externalSearchTerm = ''
}: UseManagementTableProps<T>) {
    const [filter, setFilter] = useState(externalSearchTerm);
    const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
    const [displayLimit, setDisplayLimit] = useState(pageSize);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => { setFilter(externalSearchTerm); }, [externalSearchTerm]);

    const filteredAndSortedData = useMemo(() => {
        const items = Array.isArray(data) ? data : [];
        
        let result = items.filter(item => {
            if (!filter) return true;
            return searchFields.some(field => 
                String(item[field] || '').toLowerCase().includes(filter.toLowerCase())
            );
        });

        if (sortKey) {
            result.sort((a, b) => {
                const aVal = String(a[sortKey] || '');
                const bVal = String(b[sortKey] || '');
                const comp = aVal.localeCompare(bVal, undefined, { numeric: true });
                return sortOrder === 'asc' ? comp : -comp;
            });
        }
        return result;
    }, [data, filter, searchFields, sortKey, sortOrder]);

    const displayedData = filteredAndSortedData.slice(0, displayLimit);

    return {
        filter,
        sortKey,
        sortOrder,
        selectedIds,
        displayedData,
        totalCount: filteredAndSortedData.length,
        hasMore: filteredAndSortedData.length > displayLimit,
        handleSort: (key: keyof T) => {
            if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            else { setSortKey(key); setSortOrder('asc'); }
        },
        handleLoadMore: () => setDisplayLimit(prev => prev + pageSize),
        toggleSelection: (id: string) => {
            const next = new Set(selectedIds);
            if (next.has(id)) next.delete(id); else next.add(id);
            setSelectedIds(next);
        },
        toggleSelectAll: () => {
            if (selectedIds.size === displayedData.length && displayedData.length > 0) setSelectedIds(new Set());
            else setSelectedIds(new Set(displayedData.map(d => d.id)));
        },
        updateItem: async (item: T) => collectionName && await saveDocument(collectionName, item as any),
        deleteItem: async (id: string) => collectionName && await deleteDocument(collectionName, id),
        bulkDelete: async () => {
            if (!collectionName || selectedIds.size === 0) return;
            await Promise.all(Array.from(selectedIds).map(id => deleteDocument(collectionName, id)));
            setSelectedIds(new Set());
        }
    };
}