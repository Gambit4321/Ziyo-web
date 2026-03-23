import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Fayl tanlanmagan' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Faqat rasm, video va audio (MP3, WAV, OGG, AAC) fayllari qabul qilinadi' },
                { status: 400 }
            );
        }

        // Validate file size (max 50MB for videos, 5MB for images)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: `Fayl hajmi ${file.type.startsWith('video/') ? '50MB' : '5MB'} dan oshmasligi kerak` },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Save file
        await writeFile(filepath, buffer);

        // Return URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ success: true, url, filename });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Fayl yuklashda xatolik' }, { status: 500 });
    }
}
