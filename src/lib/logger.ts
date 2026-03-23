import fs from 'fs';
import path from 'path';

export function logError(message: string, error: any) {
    const logPath = path.join(process.cwd(), 'public', 'uploads', 'debug.log');
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message + '\n' + error.stack : String(error);
    const logEntry = `[${timestamp}] ${message}: ${errorMessage}\n-------------------\n`;

    try {
        fs.appendFileSync(logPath, logEntry);
        console.error(logEntry); // Also log to stdout
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
}
