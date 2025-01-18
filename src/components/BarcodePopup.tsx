//src\components\BarcodePopup.tsx
import React from 'react';
import { Copy, Download } from 'lucide-react';

interface BarcodePopupProps {
  code: string;
  barcodeRef: React.RefObject<SVGSVGElement>;
}

export function BarcodePopup({ code, barcodeRef }: BarcodePopupProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('¡Código copiado e el portapapeles!');
    } catch (err) {
      console.error('Error al copiar código:', err);
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
    <div className="flex flex-col items-center space-y-6">
      <svg ref={barcodeRef} className="max-w-full"></svg>
      
      <div className="flex space-x-4">
        <button
          onClick={handleCopy}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          <Copy className="w-5 h-5 mr-2" />
          Copiar código
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Descargar SVG
        </button>
      </div>
    </div>
  );
}