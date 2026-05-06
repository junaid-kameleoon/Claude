import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export default function WaitNode({ data, selected }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-gray-50 shadow-lg'
          : 'border-transparent bg-gray-50 shadow-sm hover:shadow-md'
      }`}
      style={{
        backgroundColor: '#F8F8FA',
        borderColor: selected ? '#3838E7' : 'transparent',
      }}
    >
      <Clock size={18} className="text-gray-600 flex-shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-sm text-gray-900">{data.label}</div>
        {data.config?.duration && (
          <div className="text-xs text-gray-600">{data.config.duration}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
