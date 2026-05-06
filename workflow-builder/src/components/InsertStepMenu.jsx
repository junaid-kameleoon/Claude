import { Plus } from 'lucide-react';
import { NODE_TYPES } from '../data/workflow';
import { useState } from 'react';

export default function InsertStepMenu({ onInsert }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (nodeType) => {
    onInsert(nodeType);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
        title="Insert new step"
      >
        <Plus size={20} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {Object.entries(NODE_TYPES).map(([type, config]) => (
            <button
              key={type}
              onClick={() => handleInsert(type)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full inline-block mr-2"
                style={{ backgroundColor: config.color }}
              />
              <span className="font-medium text-gray-900">{config.label}</span>
              <div className="text-xs text-gray-500 mt-1">
                {config.variants[0]}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
