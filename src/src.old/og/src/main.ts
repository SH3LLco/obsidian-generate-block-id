const { Plugin, MarkdownView } = require('obsidian');

class HumanReadableBlockIDPlugin extends Plugin {
    onload() {
        // Add a ribbon icon for the block ID generation
        this.addRibbonIcon('dice', 'Generate Block ID', () => {
            this.generateBlockIdForActiveView();
        });

        // Add a command to the command palette for block ID generation
        this.addCommand({
            id: 'generate-block-id',
            name: 'Command',
            callback: () => {
                this.generateBlockIdForActiveView();
            },
            hotkeys: []
        });
    }

    generateBlockIdForActiveView() {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
            const editor = activeLeaf.view.editor;
            this.generateBlockId(editor, activeLeaf);
        }
    }

    generateBlockId(editor, activeLeaf) {
        const cursorPos = editor.getCursor();
        const lines = editor.getValue().split('\n');
        let headerStack = [];
        const fileName = this.sanitizeString(activeLeaf.view.file.basename);

        // Traverse backwards to find all headers up to the top
        for (let i = cursorPos.line; i >= 0; i--) {
            if (this.isHeader(lines[i])) {
                headerStack.unshift(this.sanitizeString(this.formatHeader(lines[i])));
            }
        }

        // If no headers are found, use the file name as the base for the block ID
        if (headerStack.length === 0) {
            headerStack.push(fileName);
        }

        const headerId = headerStack.join('--');
        // Count existing blocks under the current header section
        const foundBlocks = this.countBlocksUnderHeader(lines, headerId);

        // Generate the block ID including all headers in the stack or file name
        const blockId = `${headerId}-${foundBlocks + 1}`;
        const blockReference = `^${blockId}`;

        // Insert the block ID on a new line at the cursor position
        editor.replaceRange(`\n${blockReference}\n`, { line: cursorPos.line + 1, ch: 0 });
    }

    isHeader(line) {
        // Ensures that headers are at the beginning of the line and followed by a space
        return /^(#+)\s/.test(line);
    }

    formatHeader(line) {
        return line.replace(/^#+\s/, '').toLowerCase();
    }

    sanitizeString(input) {
        // Replace spaces with hyphens, then remove all characters that are not alphanumeric or hyphens
        let sanitized = input.replace(/\s+/g, '-');
        sanitized = sanitized.replace(/[^a-z0-9-]/gi, '');
        sanitized = sanitized.replace(/-+/g, '-');
        sanitized = sanitized.replace(/^-+|-+$/g, '');
        return sanitized.toLowerCase();
    }

    countBlocksUnderHeader(lines, headerId) {
        const blockIdPrefix = `^${headerId}-`;
        let count = 0;
        for (let line of lines) {
            if (line.trim().startsWith(blockIdPrefix)) {
                count++;
            }
        }
        return count;
    }
}

module.exports = HumanReadableBlockIDPlugin;
