'use client';

import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useRef, useState } from 'react';
import { convertPlainTextToRichHtml, normalizeRichTextContent } from '@/lib/richText';
import styles from './RichTextEditor.module.css';

interface Props {
    name: string;
    defaultValue?: string | null;
    placeholder?: string;
}

function hasVisibleContent(value: string) {
    return value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

export default function RichTextEditor({
    name,
    defaultValue,
    placeholder = "Matn kiriting. Enter yangi paragraf ochadi, B va I formatlashni saqlaydi.",
}: Props) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [html, setHtml] = useState(() => normalizeRichTextContent(defaultValue));

    function syncFromEditor() {
        setHtml(editorRef.current?.innerHTML || '');
    }

    function runCommand(command: 'bold' | 'italic' | 'insertParagraph') {
        editorRef.current?.focus();
        document.execCommand(command, false);
        syncFromEditor();
    }

    function insertHtml(htmlToInsert: string) {
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, htmlToInsert);
        syncFromEditor();
    }

    function toggleHeading() {
        editorRef.current?.focus();
        document.execCommand('formatBlock', false, 'h2');
        syncFromEditor();
    }

    function toggleList() {
        editorRef.current?.focus();
        document.execCommand('insertUnorderedList', false);
        syncFromEditor();
    }

    function createLink() {
        const rawHref = window.prompt('Havolani kiriting');
        if (!rawHref) {
            return;
        }

        editorRef.current?.focus();
        document.execCommand('createLink', false, rawHref.trim());
        syncFromEditor();
    }

    function insertImage() {
        const rawSrc = window.prompt('Rasm URL manzilini kiriting');
        if (!rawSrc) {
            return;
        }

        const rawAlt = window.prompt('Rasm uchun qisqa izoh kiriting') || '';
        insertHtml(`<p><img src="${rawSrc.trim()}" alt="${rawAlt.trim()}" /></p>`);
    }

    function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
        event.preventDefault();

        const htmlValue = event.clipboardData.getData('text/html');
        const textValue = event.clipboardData.getData('text/plain');
        const normalizedValue = htmlValue ? normalizeRichTextContent(htmlValue) : convertPlainTextToRichHtml(textValue);

        insertHtml(normalizedValue || convertPlainTextToRichHtml(textValue));
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
            event.preventDefault();
            runCommand('bold');
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
            event.preventDefault();
            runCommand('italic');
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <button type="button" className={styles.toolbarButton} onClick={() => runCommand('bold')} aria-label="Qalin matn">
                    B
                </button>
                <button type="button" className={styles.toolbarButton} onClick={() => runCommand('italic')} aria-label="Kursiv matn">
                    I
                </button>
                <button type="button" className={styles.toolbarButton} onClick={() => runCommand('insertParagraph')} aria-label="Yangi paragraf">
                    P
                </button>
                <button type="button" className={styles.toolbarButton} onClick={toggleHeading} aria-label="Oraliq sarlavha">
                    H2
                </button>
                <button type="button" className={styles.toolbarButton} onClick={toggleList} aria-label="Ro'yxat">
                    List
                </button>
                <button type="button" className={styles.toolbarButton} onClick={createLink} aria-label="Havola qo'shish">
                    Link
                </button>
                <button type="button" className={styles.toolbarButton} onClick={insertImage} aria-label="Rasm qo'shish">
                    Img
                </button>
                <span className={styles.toolbarHint}>Enter paragraf ochadi, `Ctrl/Cmd + B` va `Ctrl/Cmd + I` ishlaydi.</span>
            </div>

            <div
                ref={editorRef}
                className={styles.editor}
                contentEditable
                suppressContentEditableWarning
                data-empty={!hasVisibleContent(html)}
                data-placeholder={placeholder}
                onInput={syncFromEditor}
                onBlur={syncFromEditor}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                dangerouslySetInnerHTML={{ __html: html }}
            />

            <input type="hidden" name={name} value={html} />

            <div className={styles.preview}>
                <div className={styles.previewHeader}>Live Preview</div>
                <div className={styles.previewBody} dangerouslySetInnerHTML={{ __html: html || '<p>Preview bu yerda ko‘rinadi.</p>' }} />
            </div>
        </div>
    );
}
