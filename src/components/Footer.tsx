export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-4 px-6 text-sm text-gray-300" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-center sm:text-left">
          © {currentYear} - Badan Meteorologi, Klimatologi, dan Geofisika
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> - </span>
          Stasiun Klimatologi D.I. Yogyakarta
        </p>
        <p className="text-center sm:text-right">
          Developed by{' '}
          <a 
            href="https://pradanayahya.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            Pradana Yahya
          </a>
        </p>
      </div>
    </footer>
  );
}
