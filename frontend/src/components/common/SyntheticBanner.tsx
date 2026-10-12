import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SyntheticBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs font-medium text-amber-900 flex items-center justify-between">
      <div className="flex items-center space-x-2 mx-auto">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span>
          <strong className="font-semibold">[HACKATHON EVALUATION ENVIRONMENT]</strong> Demonstrating with verified synthetic departmental cases & public references. AI recommendations are strictly advisory and do not replace official officer sanction.
        </span>
      </div>
    </div>
  );
};
