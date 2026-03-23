import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs'; // Added for synchronous file operations
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const relativePath = searchParams.get('path') || '';

        // Base directory: public/uploads
        const baseDir = path.join(process.cwd(), 'public/uploads');
        // Resolve target path and ensure it's within baseDir
        const targetPath = path.resolve(baseDir, relativePath);

        // Security: ensure the path doesn't escape the base directory
        if (!targetPath.startsWith(baseDir)) {
            return NextResponse.json({ error: 'Ruxsat etilmagan yo`l' }, { status: 403 });
        }

        // Check if the target path exists
        if (!fs.existsSync(targetPath)) {
            return NextResponse.json({ error: 'Papka topilmadi' }, { status: 404 });
        }

        let items = [];
        try {
            items = fs.readdirSync(targetPath, { withFileTypes: true });
        } catch (e) {
            console.error(`Permission denied or error reading: ${targetPath}`);
            return NextResponse.json({
                currentPath: relativePath,
                parentPath: relativePath ? path.dirname(relativePath).replace(/\\/g, '/').replace(/^\.$/, '') : null,
                items: [],
                error: 'Ruxsat etilmagan papka'
            });
        }

        const skipFolders = ['#recycle', '@eaDir', '#snapshot'];

        const result = items
            .filter(item => !item.name.startsWith('.') && !skipFolders.includes(item.name)) // Hide hidden and Synology folders
            .map(item => {
                const itemPath = path.join(targetPath, item.name);
                const relPath = path.relative(baseDir, itemPath).replace(/\\/g, '/');

                let isDir = item.isDirectory();
                let size = 0;

                try {
                    const stats = fs.statSync(itemPath);
                    isDir = stats.isDirectory();
                    size = stats.isFile() ? stats.size : 0;
                } catch (e) {
                    // Ignore broken links or permission errors
                    console.log('Error stating file:', item.name);
                }

                return {
                    name: item.name,
                    path: relPath,
                    type: isDir ? 'dir' : 'file',
                    size: size
                };
            })
            .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));

        return NextResponse.json({
            currentPath: relativePath,
            parentPath: relativePath ? path.dirname(relativePath).replace(/\\/g, '/').replace(/^\.$/, '') : null,
            items: result
        });
    } catch (error: any) {
        console.error('Browse error:', error);
        return NextResponse.json({ error: 'Ichki xatolik yuz berdi' }, { status: 500 });
    }
}
