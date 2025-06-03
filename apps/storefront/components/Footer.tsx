export default function Footer() {
  return (
    <footer style={{ 
      width: '100%', 
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--background-color)',
      marginTop: 'var(--spacing-8)'
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: 'var(--spacing-6) var(--spacing-4)',
        fontSize: '0.875rem',
        color: 'var(--text-color)',
        opacity: 0.7,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>© {new Date().getFullYear()} MyStore. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/privacy-policy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</a>
          <a href="/terms-of-service" style={{ textDecoration: 'none', color: 'inherit' }}>Terms</a>
          <a href="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</a>
        </div>
      </div>
    </footer>
  );
} 