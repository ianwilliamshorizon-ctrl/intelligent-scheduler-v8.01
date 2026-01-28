import React from 'react';

interface CheckboxCellProps {
    id: string;
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
}

export const CheckboxCell: React.FC<CheckboxCellProps> = ({ id, selectedIds, onToggle }) => {
    return (
        <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={selectedIds.has(id)}
            onChange={() => onToggle(id)}
            onClick={(e) => e.stopPropagation()} // Prevents row click events
        />
    );
};