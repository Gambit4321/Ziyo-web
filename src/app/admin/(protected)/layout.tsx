import AdminSidebar from '@/components/admin/AdminSidebar';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { GlobalSaveProvider } from '@/contexts/GlobalSaveContext';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            redirect('/admin/login');
        }
    } catch (error) {
        if ((error as any)?.message === 'NEXT_REDIRECT') {
            throw error;
        }

        const { logError } = await import('@/lib/logger');
        logError("ADMIN LAYOUT ERROR", error);
        throw error;
    }

    return (
        <div className="admin-theme" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--text-white)' }}>
            <GlobalSaveProvider>
                <AdminSidebar />
                <main style={{ flex: 1, marginLeft: '250px', padding: '2rem', position: 'relative' }}>
                    <AdminHeader />
                    {children}
                </main>
            </GlobalSaveProvider>
        </div>
    );
}


