//src\components\Footer.tsx
export function Footer() {
  return (
    <footer className="bg-teal-900 text-white py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <p className="text-sm">© {new Date().getFullYear()} Netxel. All rights reserved.</p>
        <img src="/images/NetxelGreen.svg" alt="Netxel" className="h-8" title="Netxel" />
      </div>
    </footer>
  );
}