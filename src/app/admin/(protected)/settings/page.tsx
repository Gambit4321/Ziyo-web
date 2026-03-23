export default function SettingsPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>Sozlamalar</h1>

            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', color: 'var(--text-gray)' }}>
                <p>Hozircha sozlamalar mavjud emas.</p>
                <p style={{ marginTop: '1rem' }}>Keyingi bosqichlarda bu yerga sayt sozlamalari (meta ma'lumotlar, aloqa ma'lumotlari, ijtimoiy tarmoqlar) qo'shilishi mumkin.</p>
            </div>
        </div>
    );
}
