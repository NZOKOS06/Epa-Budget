import React from 'react';

/**
 * Composant Kanban Board pour la gestion des engagements
 */
export function KanbanBoard({ columns, onMove, className = '' }) {
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [draggedColumn, setDraggedColumn] = React.useState(null);

  const handleDragStart = (item, columnId) => {
    setDraggedItem(item);
    setDraggedColumn(columnId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId) => {
    if (draggedItem && draggedColumn !== targetColumnId && onMove) {
      onMove(draggedItem.id, draggedColumn, targetColumnId);
    }
    setDraggedItem(null);
    setDraggedColumn(null);
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  return (
    <div className={`flex space-x-4 overflow-x-auto pb-4 ${className}`}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-72 bg-gray-50 rounded-lg border border-gray-200"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                {column.items.length}
              </span>
            </div>
            {column.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{column.subtitle}</p>
            )}
          </div>

          {/* Column Items */}
          <div className="p-3 space-y-3 min-h-[400px]">
            {column.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item, column.id)}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-primary-600">{item.numero}</span>
                  {item.priorite === 'URGENT' && (
                    <span className="bg-danger-100 text-danger-800 text-xs font-medium px-2 py-0.5 rounded">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900 mb-2 line-clamp-2">{item.objet}</p>
                <p className="text-lg font-bold text-gray-900 mb-3">{formatMontant(item.montant)}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.programme}</span>
                  <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                </div>
                {item.pieces && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {item.pieces} pièce(s) jointe(s)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

