import { useState, useEffect } from 'react';

const formFields = {
  trigger: [
    { name: 'source', label: 'Source', type: 'select', options: ['Chat Interface', 'Webhook', 'Email', 'API'] },
    { name: 'frequency', label: 'Frequency', type: 'select', options: ['Real-time', 'Scheduled', 'Manual'] },
  ],
  agent: [
    { name: 'service', label: 'Service', type: 'select', options: ['OpenAI', 'Claude', 'Custom API'] },
    { name: 'action', label: 'Action', type: 'text' },
    { name: 'temperature', label: 'Temperature', type: 'number', min: 0, max: 1, step: 0.1 },
  ],
  logic: [
    { name: 'condition', label: 'Condition', type: 'text' },
    { name: 'trueLabel', label: 'True Branch', type: 'text' },
    { name: 'falseLabel', label: 'False Branch', type: 'text' },
  ],
  action: [
    { name: 'schedule', label: 'Schedule', type: 'select', options: ['Immediately', 'Scheduled', 'On Approval'] },
    { name: 'platform', label: 'Platform', type: 'select', options: ['All Channels', 'Web Only', 'Mobile Only'] },
    { name: 'retries', label: 'Retries', type: 'number', min: 0, max: 5 },
  ],
  wait: [
    { name: 'duration', label: 'Duration', type: 'text', placeholder: '1 hour, 24 hours, etc.' },
    { name: 'type', label: 'Type', type: 'select', options: ['Time Delay', 'Until Date', 'Manual Approval'] },
  ],
};

export default function ConfigForm({ nodeType, config, onUpdate }) {
  const [values, setValues] = useState(config);
  const fields = formFields[nodeType] || [];

  useEffect(() => {
    setValues(config);
  }, [config]);

  const handleChange = (name, value) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    onUpdate(newValues);
  };

  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          {field.type === 'select' ? (
            <select
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'number' ? (
            <input
              type="number"
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          ) : (
            <input
              type="text"
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </div>
      ))}
    </div>
  );
}
