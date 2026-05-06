import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function LogicNode({ data, selected }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-primary bg-amber-50 shadow-lg'
          : 'border-transparent bg-amber-50 shadow-sm hover:shadow-md'
      }`}
      style={{
        backgroundColor: '#FFFAF0',
        borderColor: selected ? '#3838E7' : 'transparent',
      }}
    >
      <GitBranch size={18} className="text-amber-600 flex-shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-sm text-gray-900">{data.label}</div>
        {data.config?.condition && (
          <div className="text-xs text-gray-600">{data.config.condition}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} id="pass" />
      <Handle type="source" position={Position.Right} id="fail" />
    </div>
  );
}
