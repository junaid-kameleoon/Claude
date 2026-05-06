import { Zap, Settings } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
      <button
        onClick={() => setCurrentView('workflows')}
        className={`p-3 rounded-lg transition-colors ${
          currentView === 'workflows'
            ? 'bg-primary text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Zap size={24} />
      </button>
      <button className="p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
        <Settings size={24} />
      </button>
    </div>
  );
}
