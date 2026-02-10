// Page Manager - Handles multi-page document structure
export class PageManager {
    constructor(canvasManager, stateManager) {
        this.canvasManager = canvasManager;
        this.stateManager = stateManager;
        this.pages = [];
        this.currentPageIndex = -1;

        // Master pages support
        this.masters = [];
        this.currentMasterId = null;
        this.isEditingMaster = false;

        // Spread view support
        this.isSpreadView = false;

        // Default page sizes (width x height in pixels at 72 DPI)
        this.pageSizes = {
            letter: { width: 612, height: 792, name: 'Letter (8.5" × 11")' },
            letterHalf: { width: 396, height: 612, name: 'Half Letter (5.5" × 8.5")' },
            letterQuarter: { width: 306, height: 396, name: 'Quarter Letter (4.25" × 5.5")' },
            a4: { width: 595, height: 842, name: 'A4 (210mm × 297mm)' },
            square: { width: 612, height: 612, name: 'Square (8.5" × 8.5")' },
        };

        this.defaultSize = 'letter';
    }

    async addPage(size = this.defaultSize) {
        const pageSize = this.pageSizes[size];

        // Save current page state before switching
        if (this.currentPageIndex >= 0) {
            await this.saveCurrentPage();
        }

        // Create new page
        const newPage = {
            id: Date.now() + Math.random(),
            size: size,
            width: pageSize.width,
            height: pageSize.height,
            canvasData: null,
            thumbnail: null,
            masterId: null  // Link to master page template
        };

        this.pages.push(newPage);
        this.currentPageIndex = this.pages.length - 1;

        // Update canvas dimensions
        this.canvasManager.setDimensions(pageSize.width, pageSize.height);
        this.canvasManager.clear();

        // Update UI
        this.updatePagesUI();

        console.log(`📄 Added page ${this.pages.length}`);

        return newPage;
    }

    async deletePage(index) {
        if (this.pages.length <= 1) {
            alert('Cannot delete the last page');
            return;
        }

        this.pages.splice(index, 1);

        // Adjust current page index
        if (this.currentPageIndex >= this.pages.length) {
            this.currentPageIndex = this.pages.length - 1;
        }

        // Load the current page
        await this.switchToPage(this.currentPageIndex);

        this.updatePagesUI();
        console.log(`🗑️ Deleted page ${index + 1}`);
    }

    async switchToPage(index) {
        if (index < 0 || index >= this.pages.length || index === this.currentPageIndex) {
            return;
        }

        // Save current state
        if (this.isEditingMaster && this.currentMasterId) {
            await this.saveCurrentMaster();
        } else if (this.currentPageIndex >= 0) {
            await this.saveCurrentPage();
        }

        // Exit master mode if active
        if (this.isEditingMaster) {
            this.isEditingMaster = false;
            this.currentMasterId = null;
            this.updateModeUI();
        }

        // Switch to new page
        this.currentPageIndex = index;

        // Render with current view mode (single or spread)
        await this.renderCurrentView();

        this.updatePagesUI();
        console.log(`📖 Switched to page ${index + 1}`);
    }

    async saveCurrentPage() {
        if (this.currentPageIndex < 0) return;

        const page = this.pages[this.currentPageIndex];

        // In spread view, we need to filter objects by their position
        // to avoid saving objects from the other page in the spread
        if (this.isSpreadView) {
            const allObjects = this.canvasManager.canvas.getObjects();
            const pageWidth = page.width;

            // Determine which half of the canvas this page occupies
            const leftIndex = this.currentPageIndex % 2 === 0 ? this.currentPageIndex : this.currentPageIndex - 1;
            const isLeftPage = this.currentPageIndex === leftIndex;

            // Filter objects based on their X position
            // Left page: objects with left < pageWidth
            // Right page: objects with left >= pageWidth
            const pageObjects = allObjects.filter(obj => {
                // Exclude master objects and guides from saving
                if (obj.isMasterObject || obj.isSpineGuide) return false;

                if (isLeftPage) {
                    return obj.left < pageWidth;
                } else {
                    return obj.left >= pageWidth;
                }
            }).map(obj => {
                // For right page, adjust the position back to page-relative coordinates
                const objData = obj.toObject();
                if (!isLeftPage) {
                    objData.left = objData.left - pageWidth;
                }
                return objData;
            });

            page.canvasData = {
                objects: pageObjects,
                background: page.canvasData?.background || '#ffffff'
            };
        } else {
            // Single page mode: save all non-master objects
            const allObjects = this.canvasManager.canvas.getObjects();
            const pageObjects = allObjects
                .filter(obj => !obj.isMasterObject)
                .map(obj => obj.toObject());

            page.canvasData = {
                objects: pageObjects,
                background: this.canvasManager.canvas.backgroundColor || '#ffffff'
            };
        }

        // Generate thumbnail
        page.thumbnail = this.generateThumbnail();
    }

    generateThumbnail() {
        // Create a smaller version of the canvas for thumbnail
        const scale = 0.1; // 10% of original size
        return this.canvasManager.canvas.toDataURL({
            format: 'png',
            multiplier: scale
        });
    }

    updatePagesUI() {
        const pagesList = document.getElementById('pages-list');

        let html = '';
        this.pages.forEach((page, index) => {
            const isActive = index === this.currentPageIndex;
            const pageSize = this.pageSizes[page.size];

            html += `
                <div class="page-item ${isActive ? 'active' : ''}" 
                    draggable="true"
                    data-index="${index}"
                    onclick="window.zineEditor?.pageManager.switchToPage(${index})"
                    ondragstart="window.zineEditor?.pageManager.handlePageDragStart(event, ${index})"
                    ondragover="window.zineEditor?.pageManager.handlePageDragOver(event)"
                    ondrop="window.zineEditor?.pageManager.handlePageDrop(event, ${index})"
                    ondragend="window.zineEditor?.pageManager.handlePageDragEnd(event)">
                    <div class="page-drag-handle" style="pointer-events: none;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5">
                            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                    </div>
                    <div class="page-thumbnail" style="pointer-events: none;">
                        ${page.thumbnail ? `<img src="${page.thumbnail}" alt="Page ${index + 1}">` : ''}
                    </div>
                    <div class="page-info" style="pointer-events: none;">
                        <div class="page-name">Page ${index + 1}</div>
                        <div class="page-size">${pageSize.name}</div>
                    </div>
                    <button class="page-delete" onclick="event.stopPropagation(); window.zineEditor?.pageManager.deletePage(${index})" 
                        title="Delete page">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        });

        pagesList.innerHTML = html;
    }

    // State management
    getState() {
        // Make sure current state is saved
        if (this.isEditingMaster && this.currentMasterId) {
            const master = this.masters.find(m => m.id === this.currentMasterId);
            if (master) {
                master.canvasData = this.canvasManager.getJSON();
            }
        } else if (this.currentPageIndex >= 0) {
            const page = this.pages[this.currentPageIndex];
            page.canvasData = this.canvasManager.getJSON();
        }

        return {
            pages: this.pages,
            masters: this.masters
        };
    }

    async loadState(state) {
        // Support both old format (array) and new format (object with pages/masters)
        if (Array.isArray(state)) {
            // Old format: just pages array
            this.pages = state;
            this.masters = [];
        } else if (state.pages) {
            // New format: object with pages and masters
            this.pages = state.pages || [];
            this.masters = state.masters || [];
        } else {
            return;
        }

        if (this.pages.length === 0) return;

        this.currentPageIndex = state.currentPage || 0;

        // Load current page
        await this.renderCurrentView();
        this.updatePagesUI();
        this.updateMastersUI();
    }

    // Get all pages for export
    getAllPages() {
        // Save current page first
        if (this.currentPageIndex >= 0) {
            const page = this.pages[this.currentPageIndex];
            page.canvasData = this.canvasManager.getJSON();
        }

        return this.pages;
    }

    // Page reordering methods
    async movePage(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= this.pages.length) return;
        if (toIndex < 0 || toIndex >= this.pages.length) return;

        // Save current page before reordering
        await this.saveCurrentPage();

        // Remove page from old position and insert at new position
        const [page] = this.pages.splice(fromIndex, 1);
        this.pages.splice(toIndex, 0, page);

        // Update current page index if affected
        if (this.currentPageIndex === fromIndex) {
            this.currentPageIndex = toIndex;
        } else if (fromIndex < this.currentPageIndex && toIndex >= this.currentPageIndex) {
            this.currentPageIndex--;
        } else if (fromIndex > this.currentPageIndex && toIndex <= this.currentPageIndex) {
            this.currentPageIndex++;
        }

        this.updatePagesUI();
        console.log(`📄 Moved page from position ${fromIndex + 1} to ${toIndex + 1}`);
    }

    handlePageDragStart(e, index) {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    handlePageDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Add visual feedback
        const target = e.target.closest('.page-item');
        if (target && !target.classList.contains('dragging')) {
            // Remove drag-over class from all items first
            document.querySelectorAll('.page-item.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            target.classList.add('drag-over');
        }
    }

    handlePageDrop(e, targetIndex) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

        // Remove visual feedback
        document.querySelectorAll('.page-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (fromIndex !== targetIndex) {
            this.movePage(fromIndex, targetIndex);
        }
    }

    handlePageDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.page-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    // ========================================
    // MASTER PAGES METHODS
    // ========================================

    async addMaster(name, size = this.defaultSize) {
        const pageSize = this.pageSizes[size];

        const newMaster = {
            id: 'master_' + Date.now() + Math.random(),
            name: name || `Master ${this.masters.length + 1}`,
            size: size,
            width: pageSize.width,
            height: pageSize.height,
            canvasData: null,
            thumbnail: null
        };

        this.masters.push(newMaster);
        console.log(`📋 Created master: ${newMaster.name}`);

        // Switch to editing this master
        await this.switchToMaster(newMaster.id);

        return newMaster;
    }

    async deleteMaster(masterId) {
        const index = this.masters.findIndex(m => m.id === masterId);
        if (index === -1) return;

        // Remove master reference from all pages that use it
        this.pages.forEach(page => {
            if (page.masterId === masterId) {
                page.masterId = null;
            }
        });

        this.masters.splice(index, 1);

        // If currently editing this master, exit master mode
        if (this.currentMasterId === masterId) {
            await this.exitMasterMode();
        }

        this.updateMastersUI();
        console.log(`🗑️ Deleted master`);
    }

    async switchToMaster(masterId) {
        const master = this.masters.find(m => m.id === masterId);
        if (!master) return;

        // Save current state
        if (this.isEditingMaster && this.currentMasterId) {
            await this.saveCurrentMaster();
        } else if (this.currentPageIndex >= 0) {
            await this.saveCurrentPage();
        }

        // Enter master editing mode
        this.isEditingMaster = true;
        this.currentMasterId = masterId;

        // Update canvas
        this.canvasManager.setDimensions(master.width, master.height);

        if (master.canvasData) {
            await this.canvasManager.loadJSON(master.canvasData);
        } else {
            this.canvasManager.clear();
        }

        this.updateMastersUI();
        this.updateModeUI();
        console.log(`📋 Editing master: ${master.name}`);
    }

    async saveCurrentMaster() {
        if (!this.isEditingMaster || !this.currentMasterId) return;

        const master = this.masters.find(m => m.id === this.currentMasterId);
        if (!master) return;

        master.canvasData = this.canvasManager.getJSON();
        master.thumbnail = this.generateThumbnail();
    }

    async exitMasterMode() {
        if (!this.isEditingMaster) return;

        // Save current master
        await this.saveCurrentMaster();

        // Reset state
        this.isEditingMaster = false;
        this.currentMasterId = null;

        // Return to normal page editing
        if (this.currentPageIndex >= 0) {
            await this.switchToPage(this.currentPageIndex);
        } else if (this.pages.length > 0) {
            await this.switchToPage(0);
        }

        this.updateModeUI();
        console.log(`📄 Exited master editing mode`);
    }

    async toggleMasterMode() {
        if (this.isEditingMaster) {
            await this.exitMasterMode();
        } else {
            // Show masters list in UI
            this.updateModeUI();
        }
    }

    assignMasterToPage(pageIndex, masterId) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        const page = this.pages[pageIndex];
        page.masterId = masterId;

        // Refresh the current page if we're viewing it
        if (pageIndex === this.currentPageIndex) {
            this.switchToPage(pageIndex);
        }

        this.updatePagesUI();
        console.log(`🔗 Assigned master to page ${pageIndex + 1}`);
    }

    getMasterForPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return null;

        const page = this.pages[pageIndex];
        if (!page.masterId) return null;

        return this.masters.find(m => m.id === page.masterId);
    }

    updateMastersUI() {
        const mastersList = document.getElementById('masters-list');
        if (!mastersList) return;

        if (!this.isEditingMaster && this.masters.length === 0) {
            mastersList.style.display = 'none';
            return;
        }

        let html = '';
        this.masters.forEach((master) => {
            const isActive = master.id === this.currentMasterId;

            html += `
                <div class="page-item master-item ${isActive ? 'active' : ''}" 
                    onclick="window.zineEditor?.pageManager.switchToMaster('${master.id}')">
                    <div class="page-thumbnail">
                        ${master.thumbnail ? `<img src="${master.thumbnail}" alt="${master.name}">` : ''}
                    </div>
                    <div class="page-info">
                        <div class="page-name">📋 ${master.name}</div>
                        <div class="page-size">${this.pageSizes[master.size].name}</div>
                    </div>
                    <button class="page-delete" onclick="event.stopPropagation(); window.zineEditor?.pageManager.deleteMaster('${master.id}')" 
                        title="Delete master">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        });

        mastersList.innerHTML = html;
        mastersList.style.display = this.isEditingMaster || this.masters.length > 0 ? 'block' : 'none';
    }

    updateModeUI() {
        const toggleBtn = document.getElementById('toggle-master-mode-btn');
        const createBtn = document.getElementById('create-master-btn');
        const pagesList = document.getElementById('pages-list');
        const mastersList = document.getElementById('masters-list');

        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.isEditingMaster);
        }

        if (createBtn) {
            createBtn.style.display = this.isEditingMaster ? 'block' : 'none';
        }

        if (pagesList) {
            pagesList.style.display = this.isEditingMaster ? 'none' : 'block';
        }

        if (mastersList) {
            this.updateMastersUI();
        }
    }

    // ========================================
    // SPREAD VIEW METHODS
    // ========================================

    async toggleSpreadView() {
        // Save current state
        if (this.isEditingMaster && this.currentMasterId) {
            await this.saveCurrentMaster();
        } else if (this.currentPageIndex >= 0) {
            await this.saveCurrentPage();
        }

        this.isSpreadView = !this.isSpreadView;

        // Update UI
        const toggleBtn = document.getElementById('toggle-spread-view-btn');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.isSpreadView);
        }

        // Refresh current view
        if (this.currentPageIndex >= 0) {
            await this.renderCurrentView();
        }

        console.log(`📖 Spread view: ${this.isSpreadView ? 'ON' : 'OFF'}`);
    }

    async renderCurrentView() {
        if (this.isEditingMaster) {
            // Master mode doesn't use spread view
            await this.switchToMaster(this.currentMasterId);
            return;
        }

        if (this.isSpreadView) {
            await this.renderSpread(this.currentPageIndex);
        } else {
            await this.renderSinglePage(this.currentPageIndex);
        }
    }

    async renderSinglePage(index) {
        if (index < 0 || index >= this.pages.length) return;

        const page = this.pages[index];
        const master = this.getMasterForPage(index);

        // Update canvas dimensions to single page
        this.canvasManager.setDimensions(page.width, page.height);

        // Render with master if assigned
        if (master) {
            await this.canvasManager.renderPageWithMaster(page.canvasData, master.canvasData);
        } else {
            if (page.canvasData) {
                await this.canvasManager.loadJSON(page.canvasData);
            } else {
                this.canvasManager.clear();
            }
        }
    }

    async renderSpread(leftIndex) {
        // Ensure we start on an even index (left page)
        if (leftIndex % 2 !== 0) {
            leftIndex = leftIndex - 1;
        }

        const leftPage = this.pages[leftIndex];
        const rightPage = this.pages[leftIndex + 1];

        if (!leftPage) return;

        const pageWidth = leftPage.width;
        const pageHeight = leftPage.height;

        // Update canvas to double width for spread
        this.canvasManager.setDimensions(pageWidth * 2, pageHeight);

        // Get masters for both pages
        const leftMaster = this.getMasterForPage(leftIndex);
        const rightMaster = rightPage ? this.getMasterForPage(leftIndex + 1) : null;

        // Render spread
        await this.canvasManager.renderSpread(
            leftPage.canvasData,
            rightPage ? rightPage.canvasData : null,
            leftMaster ? leftMaster.canvasData : null,
            rightMaster ? rightMaster.canvasData : null,
            pageWidth
        );

        console.log(`📖 Rendered spread: pages ${leftIndex + 1}-${leftIndex + 2}`);
    }

    async navigateSpread(direction) {
        if (!this.isSpreadView) return;

        let newIndex = this.currentPageIndex;

        if (direction === 'next') {
            newIndex += 2;
        } else if (direction === 'prev') {
            newIndex -= 2;
        }

        // Ensure index is within bounds and even
        newIndex = Math.max(0, Math.min(this.pages.length - 1, newIndex));
        if (newIndex % 2 !== 0) {
            newIndex = newIndex - 1;
        }

        if (newIndex !== this.currentPageIndex) {
            await this.saveCurrentPage();
            this.currentPageIndex = newIndex;
            await this.renderSpread(newIndex);
            this.updatePagesUI();
        }
    }
}

