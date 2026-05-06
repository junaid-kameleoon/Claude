import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ data, selected }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-blue-50 shadow-lg'
          : 'border-transparent bg-blue-50 shadow-sm hover:shadow-md'
      }`}
      style={{
        backgroundColor: '#F0F5FF',
        borderColor: selected ? '#3838E7' : 'transparent',
      }}
    >
      <Zap size={18} className="text-blue-600 flex-shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-sm text-gray-900">{data.label}</div>
        {data.config?.source && (
          <div className="text-xs text-gray-600">{data.config.source}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
