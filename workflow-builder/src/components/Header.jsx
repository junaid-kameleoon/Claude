import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Header({ currentView, selectedWorkflow, onBack }) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6 gap-2">
      {currentView === 'workflow-detail' && selectedWorkflow && onBack ? (
        <>
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">Workflows</span>
          <ChevronRight size={16} className="text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-900">{selectedWorkflow.name}</h1>
        </>
      ) : (
        <h1 className="text-lg font-semibold text-gray-900">Workflows</h1>
      )}
    </div>
  );
}
