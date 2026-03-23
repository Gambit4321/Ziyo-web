'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Edit, CheckSquare, Square, Image as ImageIcon, Loader2 } from 'lucide-react';
import { deleteCategory, updateCategoriesOrder, toggleCategoryVisibility, updateCategoryImage } from '@/actions/category';
import styles from '@/app/admin/(protected)/categories/categories.module.css';
import { useGlobalSave } from '@/contexts/GlobalSaveContext';

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    order: number;
    showInMenu: boolean;
    image: string | null;
    _count: { posts: number };
}

interface Props {
    categories: Category[]; // Flat list
}

export default function CategoryDragList({ categories: initialCategories }: Props) {
    const { setIsDirty, registerSaveAction } = useGlobalSave();

    const [parents, setParents] = useState<Category[]>([]);
    const [childrenMap, setChildrenMap] = useState<Record<string, Category[]>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        const _parents = initialCategories.filter(c => !c.parentId).sort((a, b) => a.order - b.order);
        setParents(_parents);

        const _childrenMap: Record<string, Category[]> = {};
        _parents.forEach(p => {
            _childrenMap[p.id] = initialCategories
                .filter(c => c.parentId === p.id)
                .sort((a, b) => a.order - b.order);
        });
        setChildrenMap(_childrenMap);
    }, [initialCategories]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);

    // Determine if we need to track modified items for updates (Rename, Visibility, Image)
    // We can just iterate through all or track IDs. 
    // Since we have local state 'parents' and 'childrenMap', we can add a 'needsUpdate' flag or just diff?
    // Let's add 'isModified' to the local state management implied logic.
    // Actually, simply tracking 'modifiedIds' set is cleaner.
    const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());

    // Register Save Action
    useEffect(() => {
        registerSaveAction(async () => {
            console.log("Saving Categories...");

            // 1. Deletions
            if (deletedIds.length > 0) {
                await Promise.all(deletedIds.map(id => deleteCategory(id)));
            }

            // 2. Updates (Rename, Image, Visibility)
            // We iterate over all categories in state to find modified ones? 
            // Or use modifiedIds.
            // Note: `parents` and `childrenMap` contain the latest state.
            const allCategories = [
                ...parents,
                ...Object.values(childrenMap).flat()
            ];

            const updates = allCategories.filter(c => modifiedIds.has(c.id) && !deletedIds.includes(c.id));

            // We need a way to update everything about a category. 
            // The existing actions are granular (rename, image, trigger). 
            // We might need to call them individually or create a bulk update.
            // For now, let's call them individually based on what might have changed, 
            // OR just call all update functions for modified items if we don't know exactly what changed.
            // But wait, the local state has the NEW values.

            for (const cat of updates) {
                // We don't have a single "updateCategory" that does everything in the actions file provided in import?
                // Imports: deleteCategory, updateCategoriesOrder, toggleCategoryVisibility, updateCategoryImage, renameCategory (dynamic import)

                // We'll just force update all properties that could change: Name, Visibility, Image.
                // This is a bit inefficient but safe. 
                // A better backend action `updateCategory(id, data)` would be ideal.
                // Assuming we can import renameCategory here directly too.

                // Visibility
                await toggleCategoryVisibility(cat.id, cat.showInMenu);

                // Image - only if it is in the unsaved map? 
                // Actually saveImage was updating unsavedImages state.
                // If we deferred image saving, the URL is in `cat.image` (updated in local state?)
                // My local state update logic for image below needs to ensure `cat.image` is set to the new Blob/URL?
                // Wait, image upload returns a URL immediately in `handleFileChange`? 
                // Yes: `setUnsavedImages` -> then `saveImage` committed it.
                // Now `saveImage` just updates local state `image` field.
                if (cat.image) await updateCategoryImage(cat.id, cat.image);

                // Name
                const { renameCategory } = await import('@/actions/category');
                await renameCategory(cat.id, cat.name);
            }

            // 3. Order
            // Re-calculate all orders.
            const parentUpdates = parents.map((p, i) => ({ id: p.id, order: i }));
            let childUpdates: { id: string, order: number }[] = [];
            Object.values(childrenMap).forEach(list => {
                const updates = list.map((c, i) => ({ id: c.id, order: i }));
                childUpdates = [...childUpdates, ...updates];
            });

            if (parentUpdates.length > 0 || childUpdates.length > 0) {
                await updateCategoriesOrder([...parentUpdates, ...childUpdates]);
            }

            // Reset
            setDeletedIds([]);
            setModifiedIds(new Set());
            // We should ideally reload data here, but `useGlobalSave` usually reloads page or we trigger router refresh?
            // The context doesn't auto-reload. 
            // We can assume state is consistent or trigger a router.refresh() if needed.
        });
    }, [parents, childrenMap, deletedIds, modifiedIds, registerSaveAction]);


    const markModified = (id: string) => {
        setModifiedIds(prev => new Set(prev).add(id));
        setIsDirty(true);
    };

    const startEditing = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const saveEdit = () => {
        if (!editingId || !editName.trim()) return;

        // Optimistic update
        setParents(prev => prev.map(p => p.id === editingId ? { ...p, name: editName } : p));

        const newChildrenMap = { ...childrenMap };
        Object.keys(newChildrenMap).forEach(key => {
            newChildrenMap[key] = newChildrenMap[key].map(c => c.id === editingId ? { ...c, name: editName } : c);
        });
        setChildrenMap(newChildrenMap);

        markModified(editingId);
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    // Image Upload State
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [unsavedImages, setUnsavedImages] = useState<Record<string, string>>({}); // id -> url (Uploaded but not "Saved" to category struct yet)

    const handleImageClick = (id: string) => {
        setUploadingId(id);
        const input = document.getElementById('category-image-upload') as HTMLInputElement;
        if (input) input.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingId) return;

        try {
            // We still upload immediately to get the URL, but we don't attach it to the category DB entry yet.
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();

            // Store in unsaved images map (Waiting for user to click the mini checkmark)
            setUnsavedImages(prev => ({ ...prev, [uploadingId]: data.url }));

        } catch (error) {
            console.error(error);
            alert("Rasm yuklashda xatolik bo'ldi.");
        } finally {
            setUploadingId(null);
            if (e.target) e.target.value = '';
        }
    };

    const saveImage = (id: string) => {
        const url = unsavedImages[id];
        if (!url) return;

        // Update local state to reflect saved (in memory)
        const updateImageInList = (list: Category[]) => list.map(c => c.id === id ? { ...c, image: url } : c);
        setParents(prev => updateImageInList(prev));

        const newChildrenMap = { ...childrenMap };
        Object.keys(newChildrenMap).forEach(key => {
            newChildrenMap[key] = updateImageInList(newChildrenMap[key]);
        });
        setChildrenMap(newChildrenMap);

        // Clear unsaved temp map
        const newUnsaved = { ...unsavedImages };
        delete newUnsaved[id];
        setUnsavedImages(newUnsaved);

        markModified(id);
    };

    const cancelImage = (id: string) => {
        const newUnsaved = { ...unsavedImages };
        delete newUnsaved[id];
        setUnsavedImages(newUnsaved);
    };


    // Toggle Visibility
    const toggleVisibility = (cat: Category) => {
        const newValue = !cat.showInMenu;

        // Optimistic update
        if (!cat.parentId) {
            setParents(prev => prev.map(p => p.id === cat.id ? { ...p, showInMenu: newValue } : p));
        } else {
            setChildrenMap(prev => {
                const siblings = prev[cat.parentId!] || [];
                const newSiblings = siblings.map(c => c.id === cat.id ? { ...c, showInMenu: newValue } : c);
                return { ...prev, [cat.parentId!]: newSiblings };
            });
        }

        markModified(cat.id);
    }

    const deleteCat = (id: string) => {
        if (confirm("Bu kategoriyani o'chirishni xohlaysizmi? ('Saqlash' tugmasi bosilganda butunlay o'chiriladi)")) {
            // Remove from UI
            setParents(prev => prev.filter(p => p.id !== id));

            const newChildrenMap = { ...childrenMap };
            // Remove as child
            Object.keys(newChildrenMap).forEach(key => {
                newChildrenMap[key] = newChildrenMap[key].filter(c => c.id !== id);
            });
            // Remove if it was a parent (keys)
            delete newChildrenMap[id];

            setChildrenMap(newChildrenMap);

            setDeletedIds(prev => [...prev, id]);
            setIsDirty(true);
        }
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination) return;

        if (type === 'PARENT') {
            const reorderedParents = Array.from(parents);
            const [removed] = reorderedParents.splice(source.index, 1);
            reorderedParents.splice(destination.index, 0, removed);
            setParents(reorderedParents);

            // Mark all reordered as modified? Or just trigger order update on save.
            // Save action re-reads the whole 'parents' array order, so simply flagging dirty is enough.
            setIsDirty(true);

        } else if (type === 'CHILD') {
            const sourceParentId = source.droppableId.split('children-')[1];
            const destParentId = destination.droppableId.split('children-')[1];
            if (!sourceParentId || !destParentId) return;

            if (sourceParentId === destParentId) {
                const currentChildren = childrenMap[sourceParentId] || [];
                const reorderedChildren = Array.from(currentChildren);
                const [removed] = reorderedChildren.splice(source.index, 1);
                reorderedChildren.splice(destination.index, 0, removed);

                setChildrenMap({ ...childrenMap, [sourceParentId]: reorderedChildren });
                setIsDirty(true);
            } else {
                const sourceChildren = Array.from(childrenMap[sourceParentId] || []);
                const destChildren = Array.from(childrenMap[destParentId] || []);
                const [movedCategory] = sourceChildren.splice(source.index, 1);
                const updatedCategory = { ...movedCategory, parentId: destParentId };
                destChildren.splice(destination.index, 0, updatedCategory);

                setChildrenMap({
                    ...childrenMap,
                    [sourceParentId]: sourceChildren,
                    [destParentId]: destChildren
                });

                // If moving between parents, we need to mark it as modified effectively (order changes implicit).
                // Just marking dirty triggers the order sync.
                setIsDirty(true);
            }
        }
    };

    const renderNameCell = (cat: Category) => {
        if (editingId === cat.id) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                    />
                    <button onClick={saveEdit} className={styles.saveBtn}>ok</button>
                    <button onClick={cancelEdit} className={styles.cancelBtn}>x</button>
                </div>
            );
        }
        return (
            <>
                <span style={{ fontWeight: cat.parentId ? 'normal' : 'bold', color: cat.parentId ? 'white' : '#c6a866' }}>
                    {cat.name}
                </span>
                <button
                    onClick={() => startEditing(cat)}
                    className={styles.editBtn}
                    style={{ marginLeft: '10px', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: '#888' }}
                >
                    <Edit size={14} />
                </button>
            </>
        );
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <input
                type="file"
                id="category-image-upload"
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />
            <div className={styles.listContainer}>
                <div className={styles.listHeader}>
                    <div style={{ width: '40%' }}>Nomi</div>
                    <div style={{ width: '10%', textAlign: 'center' }}>Rasm</div>
                    <div style={{ width: '10%', textAlign: 'center' }}>Menyuda</div>
                    <div style={{ width: '20%' }}>Slug</div>
                    <div style={{ width: '10%' }}>Maqolalar</div>
                    <div style={{ width: '10%' }}>Amallar</div>
                </div>

                <Droppable droppableId="parents" type="PARENT">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {parents.map((parent, index) => (
                                <Draggable key={parent.id} draggableId={parent.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className={styles.dragParentWrapper}>
                                            <div className={styles.dragRowParent}>
                                                <div className={styles.cellName} style={{ width: '40%' }}>
                                                    <span {...provided.dragHandleProps} className={styles.dragHandle}><GripVertical size={16} /></span>
                                                    {renderNameCell(parent)}
                                                </div>
                                                <div style={{ width: '10%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    {unsavedImages[parent.id] ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <img src={unsavedImages[parent.id]} alt="new" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #eab308' }} />
                                                            <button onClick={() => saveImage(parent.id)} className={styles.saveBtn} title="Saqlash"><CheckSquare size={16} /></button>
                                                            <button onClick={() => cancelImage(parent.id)} className={styles.cancelBtn} title="Bekor qilish"><Trash2 size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleImageClick(parent.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                                            {parent.image ? (
                                                                <img src={parent.image} alt="img" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                                            ) : (
                                                                <ImageIcon size={18} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <div style={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
                                                    <button onClick={() => toggleVisibility(parent)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: parent.showInMenu ? '#10b981' : '#6b7280' }}>
                                                        {parent.showInMenu ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                </div>
                                                <div className={styles.cellSlug} style={{ width: '20%' }}>{parent.slug}</div>
                                                <div className={styles.cellCount} style={{ width: '10%' }}>{parent._count.posts}</div>
                                                <div className={styles.cellActions} style={{ width: '10%' }}>
                                                    <button onClick={() => deleteCat(parent.id)} className={styles.deleteBtn}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <Droppable droppableId={`children-${parent.id}`} type="CHILD">
                                                {(provided) => (
                                                    <div {...provided.droppableProps} ref={provided.innerRef} className={styles.childrenContainer}>
                                                        {(childrenMap[parent.id] || []).map((child, childIndex) => (
                                                            <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                                                                {(provided) => (
                                                                    <div ref={provided.innerRef} {...provided.draggableProps} className={styles.dragRowChild}>
                                                                        <div className={styles.cellName} style={{ paddingLeft: '2.5rem', width: '40%' }}>
                                                                            <span className={styles.childIndicator}></span>
                                                                            <span {...provided.dragHandleProps} className={styles.dragHandle}><GripVertical size={16} /></span>
                                                                            {renderNameCell(child)}
                                                                        </div>
                                                                        <div style={{ width: '10%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                            {unsavedImages[child.id] ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                                    <img src={unsavedImages[child.id]} alt="new" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #eab308' }} />
                                                                                    <button onClick={() => saveImage(child.id)} className={styles.saveBtn} title="Saqlash"><CheckSquare size={16} /></button>
                                                                                    <button onClick={() => cancelImage(child.id)} className={styles.cancelBtn} title="Bekor qilish"><Trash2 size={16} /></button>
                                                                                </div>
                                                                            ) : (
                                                                                <button onClick={() => handleImageClick(child.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                                                                    {child.image ? (
                                                                                        <img src={child.image} alt="img" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                                                                    ) : (
                                                                                        <ImageIcon size={18} />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
                                                                            <button onClick={() => toggleVisibility(child)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: child.showInMenu ? '#10b981' : '#6b7280' }}>
                                                                                {child.showInMenu ? <CheckSquare size={18} /> : <Square size={18} />}
                                                                            </button>
                                                                        </div>
                                                                        <div className={styles.cellSlug} style={{ width: '20%' }}>{child.slug}</div>
                                                                        <div className={styles.cellCount} style={{ width: '10%' }}>{child._count.posts}</div>
                                                                        <div className={styles.cellActions} style={{ width: '10%' }}>
                                                                            <button onClick={() => deleteCat(child.id)} className={styles.deleteBtn}>
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
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </DragDropContext>
    );
}


