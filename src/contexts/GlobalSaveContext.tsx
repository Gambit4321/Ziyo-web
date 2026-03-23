'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface GlobalSaveContextType {
    isDirty: boolean;
    setIsDirty: (dirty: boolean) => void;
    registerSaveAction: (action: () => Promise<void>) => void;
    triggerSave: () => Promise<void>;
    discardChanges: () => void;
}

const GlobalSaveContext = createContext<GlobalSaveContextType | undefined>(undefined);

export function GlobalSaveProvider({ children }: { children: React.ReactNode }) {
    const [isDirty, setIsDirty] = useState(false);
    const [saveAction, setSaveAction] = useState<(() => Promise<void>) | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const registerSaveAction = useCallback((action: () => Promise<void>) => {
        setSaveAction(() => action);
    }, []);

    const triggerSave = async () => {
        if (saveAction) {
            await saveAction();
            setIsDirty(false); // Reset dirty state after save
            // Optional: trigger revalidation or "Site Update" logic here if strictly needed globally
        }
    };

    const discardChanges = () => {
        setIsDirty(false);
        // Reload page or just reset form? Reload is safest to "undo" everything.
        window.location.reload();
    };

    // Navigation Guard
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!isDirty) return;

            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/') && !href.startsWith('#') && href !== pathname) {
                    e.preventDefault();
                    if (confirm("O'zgarishlar saqlanmagan! \nSaqlaysizmi yoki bekor qilasizmi? \n\nOK = Saqlash va O'tish\nCancel = Bekor qilish va O'tish")) {
                        // User chose to SAVE
                        triggerSave().then(() => {
                            router.push(href);
                        });
                    } else {
                        // User chose to DISCARD (Cancel) - wait, confirm logic usually implies Cancel = Stay.
                        // User request: "Eslatma sifatida saqlaysizmi yoki bekor qilasizmi deb so'rash kerak"
                        // If they say "Bekor qilish" (Discard), we should go to the link without saving.

                        // Let's us a custom Confirm Dialog or standard logic for now.
                        // Standard confirm returns true/false. 
                        // If we want "Save vs Discard vs Cancel(Stay)", standard confirm is limited (OK/Cancel).

                        // Let's implement strict interpreting:
                        // "Saqlanmagan o'zgarishlar bor."
                        // We will just block and ask them to use the Top Button? 
                        // Or use a custom modal? User asked for a prompt.

                        if (confirm("DIQQAT: O'zgarishlar saqlanmagan.\n\nBekor qilib o'tib ketish uchun OK ni bosing.\nQolish va Saqlash uchun CANCEL ni bosing.")) {
                            setIsDirty(false);
                            router.push(href);
                        }
                    }
                }
            }
        };

        window.addEventListener('click', handleClick, true); // Capture phase
        return () => window.removeEventListener('click', handleClick, true);
    }, [isDirty, saveAction, router, pathname]);

    // Browser Refresh/Close Guard
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Reset dirty on path change (if navigation succeeded)
    useEffect(() => {
        setIsDirty(false);
        setSaveAction(null);
    }, [pathname]);

    return (
        <GlobalSaveContext.Provider value={{ isDirty, setIsDirty, registerSaveAction, triggerSave, discardChanges }}>
            {children}
        </GlobalSaveContext.Provider>
    );
}

export function useGlobalSave() {
    const context = useContext(GlobalSaveContext);
    if (!context) {
        throw new Error('useGlobalSave must be used within a GlobalSaveProvider');
    }
    return context;
}
