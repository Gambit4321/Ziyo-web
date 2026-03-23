export default function DebugPage() {
    return (
        <div style={{ color: 'white', padding: '2rem' }}>
            <h1>Debug Page Works!</h1>
            <p>If you see this, the Next.js server is running correctly.</p>
            <p>Time: {new Date().toISOString()}</p>
        </div>
    );
}
