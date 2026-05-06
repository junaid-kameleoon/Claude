import { X } from 'lucide-react';
import { NODE_TYPES } from '../data/workflow';
import ConfigForm from './ConfigForm';

export default function ConfigPanel({ node, onUpdate, onClose }) {
  if (!node) return null;

  const nodeType = NODE_TYPES[node.type];

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: nodeType?.color }}
          />
          <h2 className="font-semibold text-gray-900">{node.data.label}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Type
          </label>
          <p className="text-sm text-gray-900 mt-1">{nodeType?.label}</p>
        </div>

        <ConfigForm
          nodeType={node.type}
          config={node.data.config || {}}
          onUpdate={onUpdate}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
          Save
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
