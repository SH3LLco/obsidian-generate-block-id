const { Plugin, MarkdownView, setIcon } = require('obsidian');

class HumanReadableBlockIDPlugin extends Plugin {
    onload() {

        this.addRibbonIcon('box', 'Generate Block ID', () => {
            this.generateBlockIdForActiveView();
        });

        this.addCommand({
            id: 'generate-block-id',
            name: 'Create Block ID',
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
            let lastHeaderLevel = 0;
    
            // Traverse backwards to find the closest relevant headers up to the current point
            for (let i = cursorPos.line; i >= 0; i--) {
                if (this.isHeader(lines[i])) {
                    const level = this.headerLevel(lines[i]);
                    if (level < lastHeaderLevel || lastHeaderLevel === 0) {
                        const header = this.sanitizeString(this.formatHeader(lines[i]));
                        headerStack.unshift(header);
                        lastHeaderLevel = level;
                    }

                }
            }

        // Formulate the header ID based on the stack
        const headerId = headerStack.join('--');
        const foundBlocks = this.countBlocksUnderCurrentHeader(lines, cursorPos.line, headerId);

        // Generate the block ID including all relevant headers
        const blockId = `${headerId}-${foundBlocks + 1}`;
        const blockReference = `^${blockId}`;

        // Insert the block ID on a new line at the cursor position
        editor.replaceRange(`${blockReference}\n`, { line: cursorPos.line + 1, ch: 0 });
    }

    isHeader(line) {
        return /^(#+)\s/.test(line);
    }

    formatHeader(line) {
        return line.replace(/^#+\s/, '').toLowerCase();
    }

    sanitizeString(input) {
        return input.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    }

    countBlocksUnderCurrentHeader(lines, currentLine, headerId) {
        const blockIdPrefix = `^${headerId}-`;
        let count = 0;
        for (let i = 0; i <= currentLine; i++) {
            if (lines[i].includes(blockIdPrefix)) {
                count++;
            }
        }
        return count;
    }

    headerLevel(line) {
        const match = line.match(/^(\#+)\s/);
        return match ? match[1].length : 0;
    }
}

module.exports = HumanReadableBlockIDPlugin;
