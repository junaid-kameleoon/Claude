import { ArrowRight } from 'lucide-react';

export default function WorkflowsList({ workflows, onSelect }) {
  return (
    <div className="w-full h-full bg-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="space-y-3">
          {workflows.map(workflow => (
            <button
              key={workflow.id}
              onClick={() => onSelect(workflow)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-all group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-primary transition-colors ml-4 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
