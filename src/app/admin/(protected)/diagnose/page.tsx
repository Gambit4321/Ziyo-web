import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export default async function DiagnosePage() {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');

    let files: any[] = [];
    let error = null;
    let dirInfo = null;

    try {
        const stats = await stat(uploadsDir);
        dirInfo = {
            path: uploadsDir,
            uid: stats.uid,
            gid: stats.gid,
            mode: stats.mode.toString(8),
            isDirectory: stats.isDirectory()
        };

        const fileNames = await readdir(uploadsDir);
        files = await Promise.all(fileNames.map(async (name) => {
            try {
                const fStat = await stat(join(uploadsDir, name));
                return {
                    name,
                    size: fStat.size,
                    mode: fStat.mode.toString(8),
                    uid: fStat.uid,
                    gid: fStat.gid,
                    created: fStat.birthtime.toISOString(),
                    url: `/uploads/${name}`
                };
            } catch (e: any) {
                return { name, error: e.message };
            }
        }));
    } catch (e: any) {
        error = e.message;
    }

    return (
        <div style={{ padding: '2rem', color: 'white' }}>
            <h1>System Diagnosis</h1>

            <div style={{ marginBottom: '2rem', background: '#333', padding: '1rem' }}>
                <h2>Directory Info</h2>
                {error ? (
                    <p style={{ color: 'red' }}>Error: {error}</p>
                ) : (
                    <pre>{JSON.stringify(dirInfo, null, 2)}</pre>
                )}
            </div>

            <h2>Files in {uploadsDir}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #555' }}>
                        <th>Preview</th>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Mode</th>
                        <th>UID:GID</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((f) => (
                        <tr key={f.name} style={{ borderBottom: '1px solid #444' }}>
                            <td style={{ padding: '0.5rem' }}>
                                {f.url && (
                                    <a href={f.url} target="_blank" rel="noreferrer">
                                        <img src={f.url} alt="preview" style={{ height: '50px', objectFit: 'contain' }} />
                                    </a>
                                )}
                            </td>
                            <td>{f.name}</td>
                            <td>{f.size}</td>
                            <td>{f.mode}</td>
                            <td>{f.uid}:{f.gid}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
