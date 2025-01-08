// src/components/BarcodeGenerator.tsx
import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Copy, Download } from 'lucide-react';

interface BarcodeGeneratorProps {
  code: string;
  onBack: () => void;
  onFinish: () => void;
}

export function BarcodeGenerator({ code, onBack }: BarcodeGeneratorProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10
      });
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    if (barcodeRef.current) {
      const svg = barcodeRef.current;
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svg);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `codigo-barras-${code}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-6">
        <svg ref={barcodeRef} className="max-w-full"></svg>
        
        <div className="flex space-x-4">
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-5 h-5 mr-2" />
            Copiar codigo
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar SVG
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}