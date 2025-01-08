// src\components\ProductForm.tsx
import { Package2, Barcode } from 'lucide-react';

type Step = 'add' | 'barcode';

interface AppBarProps {
  currentStep: Step;
  onStepChange: (step: Step) => void;
}

export function AppBar({ currentStep, onStepChange }: AppBarProps) {
  return (
    <header className="bg-indigo-600 text-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold">Inventory Manager</span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => onStepChange('add')}
              className={`flex items-center px-4 py-2 rounded-md transition ${
                currentStep === 'add'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-500'
              }`}
            >
              <Package2 className="w-5 h-5 mr-2" />
              Add Product
            </button>
            <button
              onClick={() => onStepChange('barcode')}
              className={`flex items-center px-4 py-2 rounded-md transition ${
                currentStep === 'barcode'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-500'
              }`}
            >
              <Barcode className="w-5 h-5 mr-2" />
              Generate Barcode
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}