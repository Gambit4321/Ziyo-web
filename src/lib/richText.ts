function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeHref(value: string) {
    const normalized = value.trim();

    if (!normalized) {
        return '';
    }

    if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(normalized)) {
        return normalized;
    }

    return `https://${normalized}`;
}

function normalizeSrc(value: string) {
    const normalized = value.trim();

    if (!normalized) {
        return '';
    }

    if (/^(https?:\/\/|\/)/i.test(normalized)) {
        return normalized;
    }

    return `https://${normalized}`;
}

export function convertPlainTextToRichHtml(value: string) {
    return value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
        .join('');
}

export function normalizeRichTextContent(value: string | null | undefined) {
    const input = (value || '').trim();

    if (!input) {
        return '';
    }

    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(input);

    if (!hasHtml) {
        return convertPlainTextToRichHtml(input);
    }

    let sanitized = input
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<\s*\/?\s*(html|head|body)[^>]*>/gi, '')
        .replace(/<\s*b(\s|>)/gi, '<strong$1')
        .replace(/<\s*\/\s*b\s*>/gi, '</strong>')
        .replace(/<\s*i(\s|>)/gi, '<em$1')
        .replace(/<\s*\/\s*i\s*>/gi, '</em>')
        .replace(/<\s*div(\s[^>]*)?>/gi, '<p>')
        .replace(/<\s*\/\s*div\s*>/gi, '</p>');

    sanitized = sanitized.replace(/<([^>]+)>/g, (fullMatch, tagContent) => {
        const normalizedTag = String(tagContent).trim();
        const isClosingTag = normalizedTag.startsWith('/');
        const tagName = normalizedTag.replace(/^\//, '').split(/\s+/)[0].toLowerCase();

        if (!['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a', 'img'].includes(tagName)) {
            return '';
        }

        if (isClosingTag) {
            return tagName === 'br' ? '' : `</${tagName}>`;
        }

        if (tagName === 'a') {
            const hrefMatch = normalizedTag.match(/\bhref\s*=\s*(['"])(.*?)\1/i) || normalizedTag.match(/\bhref\s*=\s*([^\s>]+)/i);
            const hrefValue = hrefMatch ? hrefMatch[hrefMatch.length - 1] : '';
            const safeHref = normalizeHref(hrefValue);

            return safeHref
                ? `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer nofollow">`
                : '';
        }

        if (tagName === 'img') {
            const srcMatch = normalizedTag.match(/\bsrc\s*=\s*(['"])(.*?)\1/i) || normalizedTag.match(/\bsrc\s*=\s*([^\s>]+)/i);
            const altMatch = normalizedTag.match(/\balt\s*=\s*(['"])(.*?)\1/i) || normalizedTag.match(/\balt\s*=\s*([^\s>]+)/i);
            const srcValue = srcMatch ? srcMatch[srcMatch.length - 1] : '';
            const altValue = altMatch ? altMatch[altMatch.length - 1] : '';
            const safeSrc = normalizeSrc(srcValue);

            return safeSrc ? `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(altValue)}" />` : '';
        }

        return tagName === 'br' ? '<br />' : `<${tagName}>`;
    });

    sanitized = sanitized
        .replace(/(?:<br \/>[\s\r\n]*){3,}/gi, '<br /><br />')
        .replace(/<p>\s*(<br \/>|\u00a0|\s)*<\/p>/gi, '')
        .trim();

    if (!/<(p|ul|ol|li|br|h2|h3|blockquote)\b/i.test(sanitized)) {
        sanitized = `<p>${sanitized}</p>`;
    }

    return sanitized;
}
