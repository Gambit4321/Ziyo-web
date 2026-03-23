'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Eye, EyeOff, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { getHomeSections, seedHomeSections, createHomeSection, updateHomeSection, deleteHomeSection, updateSectionsOrder, toggleSectionVisibility } from '@/actions/home';
import { getAllCategories } from '@/actions/category';
import { getAllBanners } from '@/actions/banner';
import styles from './home-settings.module.css';
import { useGlobalSave } from '@/contexts/GlobalSaveContext';

interface HomeSection {
    id: string;
    title: string | null;
    type: string;
    isVisible: boolean;
    order: number;
    sourceType: string;
    sourceId: string | null;
    displayStyle: string;
    sortType: string;
    autoplaySeconds: number;
    rowCount: number;
    // Helper for tracking changes
    isNew?: boolean;
    isDeleted?: boolean;
    isModified?: boolean;
}

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    isBanner?: boolean;
    title?: string;
}

export default function HomeSettingsPage() {
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const { setIsDirty, registerSaveAction } = useGlobalSave();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'CAROUSEL', // Default
        sourceId: '',
        displayStyle: 'CAROUSEL',
        sortType: 'LATEST',
        autoplaySeconds: 0,
        rowCount: 1
    });

    async function loadData() {
        setLoading(true);
        const [secs, cats, bans] = await Promise.all([
            getHomeSections(),
            getAllCategories(),
            getAllBanners()
        ]);

        const bannersAsCategories: Category[] = bans.map(b => ({
            id: b.id,
            name: b.title,
            parentId: null,
            isBanner: true,
            title: b.title
        }));

        setSections(secs as HomeSection[]);
        setCategories([...cats, ...bannersAsCategories]);
        setDeletedIds([]);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    // Register the Save Logic whenever state changes
    useEffect(() => {
        registerSaveAction(async () => {
            console.log("Saving Global State...");

            // 1. Handle Deletions First
            if (deletedIds.length > 0) {
                await Promise.all(deletedIds.map(id => deleteHomeSection(id)));
            }

            // 2. Update Order (Batch)
            // Filter out deleted items just in case they are still in 'sections' (UI)
            // But UI should have removed them already. 
            // Also filter temp items (handled in step 3)
            const activeSections = sections.filter(s => !s.id.startsWith('temp-'));

            const orderPayload = activeSections.map((item, index) => ({
                id: item.id,
                order: index
            }));

            if (orderPayload.length > 0) {
                await updateSectionsOrder(orderPayload);
            }

            // 3. Handle Creation & Modifications
            for (const section of sections) {
                if (section.id.startsWith('temp-')) {
                    // Create New
                    await createHomeSection({
                        title: section.title,
                        type: section.type,
                        sourceType: section.sourceType,
                        sourceId: section.sourceId,
                        displayStyle: section.displayStyle,
                        sortType: section.sortType,
                        autoplaySeconds: section.autoplaySeconds,
                        rowCount: section.rowCount,
                        order: section.order
                    });
                } else if (section.isModified) {
                    // Update Existing
                    await updateHomeSection(section.id, {
                        title: section.title,
                        isVisible: section.isVisible,
                        type: section.type,
                        sourceType: section.sourceType,
                        sourceId: section.sourceId,
                        displayStyle: section.displayStyle,
                        sortType: section.sortType,
                        autoplaySeconds: section.autoplaySeconds,
                        rowCount: section.rowCount
                    });
                }
            }

            // Reset states
            setDeletedIds([]);
            loadData(); // Refresh from DB
        });
    }, [sections, deletedIds, registerSaveAction]);

    const handleToggle = (id: string, current: boolean) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, isVisible: !current, isModified: true } : s));
        setIsDirty(true);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order property locally
        const updatedItems = items.map((item, index) => ({ ...item, order: index, isModified: true }));

        setSections(updatedItems);
        setIsDirty(true);
    };

    const openModal = (section?: HomeSection) => {
        if (section) {
            setEditingId(section.id);
            setFormData({
                title: section.title || '',
                type: section.type,
                sourceId: section.sourceId || '',
                displayStyle: section.displayStyle || 'CAROUSEL',
                sortType: section.sortType || 'LATEST',
                autoplaySeconds: section.autoplaySeconds || 0,
                rowCount: section.rowCount || 1
            });
        } else {
            setEditingId(null);
            setFormData({
                title: '',
                type: 'CAROUSEL',
                sourceId: '',
                displayStyle: 'CAROUSEL',
                sortType: 'LATEST',
                autoplaySeconds: 0,
                rowCount: 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveModal = () => {
        // Determine Source Type based on Source ID
        let sourceType = 'MANUAL';
        if (formData.sourceId) {
            const cat = categories.find(c => c.id === formData.sourceId);
            if (cat) {
                sourceType = cat.parentId ? 'CATEGORY' : 'SECTION';
            }
        } else if (formData.type === 'HERO' || formData.type === 'AUDIO') {
            sourceType = 'SPECIAL';
        }

        if (editingId) {
            // Update Existing Locale State
            setSections(prev => prev.map(s => s.id === editingId ? { ...s, ...formData, sourceType, isModified: true } : s));
        } else {
            // Create New Local State (Temp ID)
            const newSection: HomeSection = {
                id: `temp-${Date.now()}`,
                ...formData,
                sourceType,
                isVisible: true,
                order: sections.length,
                type: formData.type,
                isNew: true
            };
            setSections(prev => [...prev, newSection]);
        }

        setIsDirty(true);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Bu bo'limni ro'yxatdan olib tashlashni xohlaysizmi? (Eslatma: 'Saqlash' tugmasi bosilmaguncha o'chirilmaydi)")) {
            // Remove from UI
            setSections(prev => prev.filter(s => s.id !== id));

            // Add to Deleted List (unless it was a new temp item)
            if (!id.startsWith('temp-')) {
                setDeletedIds(prev => [...prev, id]);
            }

            setIsDirty(true);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className={styles.container} style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className={styles.title}>Bosh Ekran Sozlamalari</h1>
                    <p className={styles.subtitle}>Bosh sahifadagi bloklarni boshqarish</p>
                </div>
                <button
                    onClick={() => openModal()}
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#c6a866', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    <Plus size={20} /> Bo'lim Qo'shish
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className={styles.list}>
                            {sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`${styles.item} ${!section.isVisible ? styles.hiddenItem : ''}`}
                                            style={{
                                                ...provided.draggableProps.style,
                                                borderColor: section.id.startsWith('temp-') ? '#c6a866' : (section.isModified ? '#3b82f6' : 'transparent'),
                                                borderWidth: (section.id.startsWith('temp-') || section.isModified) ? '1px' : '0'
                                            }}
                                        >
                                            <div className={styles.dragHandle} {...provided.dragHandleProps}>
                                                <GripVertical size={20} />
                                            </div>
                                            <div className={styles.info}>
                                                <span className={styles.sectionType}>{section.type} | {section.sourceType} {section.displayStyle !== 'CAROUSEL' && `| ${section.displayStyle}`} {section.id.startsWith('temp-') && '(Yangi)'}</span>
                                                <span className={styles.sectionTitle}>{section.title || '(Nomsiz)'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openModal(section)} className={styles.toggleBtn} title="Tahrirlash">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleToggle(section.id, section.isVisible)} className={styles.toggleBtn}>
                                                    {section.isVisible ? <Eye size={18} className="text-emerald-500" /> : <EyeOff size={18} className="text-gray-400" />}
                                                </button>
                                                <button onClick={() => handleDelete(section.id)} className={styles.toggleBtn} style={{ color: '#ef4444' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid #374151', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: '#c6a866' }}>{editingId ? "Tahrirlash" : "Yangi Bo'lim"}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Inputs ... (simplified for brevity as they are same) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Sarlavha (Ixtiyoriy)</label>
                                <input
                                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
                                    style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Bo'lim Turi</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value, displayStyle: e.target.value === 'GRID' ? 'GRID' : 'CAROUSEL' })}
                                >
                                    <option value="HERO">Hero Slider (Slayder)</option>
                                    <option value="CAROUSEL">Carousel (Maqolalar)</option>
                                    <option value="GRID">Grid (Setka)</option>
                                    <option value="TABS">Tabs (Eng Yangi)</option>
                                    <option value="BANNER">Single Banner (Reklama)</option>
                                    <option value="AUDIO">Audio Player</option>
                                </select>
                            </div>

                            {/* ... Other inputs reused ... */}
                            {/* I need to make sure I include all inputs from previous file or it breaks. I will paste them. */}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                                    {formData.type === 'BANNER' ? 'Banner Tanlash' : "Manba (Kategoriya/Bo'lim)"}
                                </label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                    value={formData.sourceId}
                                    onChange={e => setFormData({ ...formData, sourceId: e.target.value })}
                                >
                                    <option value="">
                                        {formData.type === 'BANNER' ? 'Banner tanlanmagan' : 'Manba tanlanmagan (Maxsus)'}
                                    </option>
                                    {formData.type === 'BANNER' ? (
                                        <optgroup label="Barcha Bannerlar">
                                            {(categories as any[]).filter(c => c.isBanner).map(b => (
                                                <option key={b.id} value={b.id}>{b.title}</option>
                                            ))}
                                        </optgroup>
                                    ) : (
                                        <>
                                            <option value="GLOBAL">Barcha Kategoriyalar (Global)</option>
                                            <optgroup label="Bo'limlar (Asosiy)">
                                                {categories.filter(c => !c.parentId && !c.isBanner).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Kategoriyalar (Ichki)">
                                                {categories.filter(c => c.parentId && !c.isBanner).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                            </div>

                            {(formData.sourceId === 'GLOBAL') && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Saralash Turi</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                        value={formData.sortType}
                                        onChange={e => setFormData({ ...formData, sortType: e.target.value })}
                                    >
                                        <option value="LATEST">Eng Yangi (Latest)</option>
                                        <option value="MOST_VIEWED">Eng Ko'p Ko'rilgan (Most Viewed)</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Ko'rinish Turi</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                    value={formData.displayStyle}
                                    onChange={e => setFormData({ ...formData, displayStyle: e.target.value })}
                                >
                                    <option value="CAROUSEL">Karusel (Carousel)</option>
                                    <option value="LIST">Ro'yxat (List)</option>
                                    <option value="GRID">Setka (Grid) - 2 qator</option>
                                </select>
                            </div>

                            {formData.displayStyle === 'CAROUSEL' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Avto-aylanish (Sekund)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        style={{ width: '100%', padding: '0.75rem', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                                        value={formData.autoplaySeconds}
                                        onChange={e => setFormData({ ...formData, autoplaySeconds: parseInt(e.target.value) || 0 })}
                                        placeholder="0 = O'chiq"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSaveModal} // Changed to handleSaveModal
                                style={{ marginTop: '1rem', width: '100%', padding: '1rem', background: '#c6a866', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                <Edit2 size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                Vaqtincha Saqlash
                            </button>
                            <p style={{ fontSize: '0.8rem', color: '#fca5a5', textAlign: 'center' }}>
                                O'zgarishlar saytda ko'rinishi uchun yuqoridagi <b>SAQLASH</b> tugmasini bosishni unutmang!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
