// State Manager - Handles saving and loading application state
export class StateManager {
    constructor() {
        this.storageKey = 'zine-editor-state';
    }

    save(state) {
        try {
            const stateString = JSON.stringify(state);
            localStorage.setItem(this.storageKey, stateString);
            return true;
        } catch (error) {
            console.error('Failed to save state:', error);
            return false;
        }
    }

    load() {
        try {
            const stateString = localStorage.getItem(this.storageKey);
            if (stateString) {
                return JSON.parse(stateString);
            }
            return null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }

    // Export state as JSON file
    exportToFile(state) {
        const stateString = JSON.stringify(state, null, 2);
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `zine-project-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Import state from JSON file
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const state = JSON.parse(e.target.result);
                    resolve(state);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }
}
