// Harvest & Celebration Page functionality
const HarvestJournalPage = {
    init() {
        this.render();
        this.loadSeeds();
    },

    render() {
        const container = document.getElementById('harvest-journal-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-trophy"></i> Harvest & Celebration</h1>
                <p>Celebrate your achievements and acknowledge your growth journey</p>
            </div>

            <div class="harvest-container">
                <!-- Harvest Summary Stats -->
                <div class="harvest-stats">
                    <div class="harvest-stat-card">
                        <i class="fas fa-seedling" style="color: #f39c12;"></i>
                        <div class="stat-value" id="growing-seeds-count">0</div>
                        <div class="stat-label">Seeds Growing</div>
                    </div>
                    <div class="harvest-stat-card">
                        <i class="fas fa-award" style="color: #27ae60;"></i>
                        <div class="stat-value" id="harvested-count">0</div>
                        <div class="stat-label">Goals Harvested</div>
                    </div>
                    <div class="harvest-stat-card">
                        <i class="fas fa-percentage" style="color: #9b59b6;"></i>
                        <div class="stat-value" id="completion-rate">0%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="harvest-tabs">
                    <button class="harvest-tab active" onclick="HarvestJournalPage.showTab('growing')">
                        <i class="fas fa-seedling"></i> Growing Seeds
                    </button>
                    <button class="harvest-tab" onclick="HarvestJournalPage.showTab('harvested')">
                        <i class="fas fa-trophy"></i> Harvested Goals
                    </button>
                </div>

                <!-- Growing Seeds Section -->
                <div id="growing-seeds-section" class="harvest-section active">
                    <div class="section-header">
                        <h3><i class="fas fa-seedling"></i> Seeds Currently Growing</h3>
                        <p>Mark goals as complete when you've achieved them!</p>
                    </div>
                    <div id="growing-seeds-list" class="seeds-list">
                        <!-- Growing seeds will be loaded here -->
                    </div>
                </div>

                <!-- Harvested Goals Section -->
                <div id="harvested-goals-section" class="harvest-section">
                    <div class="section-header">
                        <h3><i class="fas fa-trophy"></i> Harvested Goals</h3>
                        <p>Celebrate your achievements and acknowledge your growth!</p>
                    </div>
                    <div id="harvested-goals-list" class="seeds-list">
                        <!-- Harvested goals will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Edit Modal -->
            <div id="edit-seed-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit Goal</h3>
                        <button class="modal-close" onclick="HarvestJournalPage.closeEditModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <label>Goal Description:</label>
                        <textarea id="edit-seed-text" rows="3"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="HarvestJournalPage.closeEditModal()">
                            Cancel
                        </button>
                        <button class="btn-primary" onclick="HarvestJournalPage.saveEdit()">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>

            <!-- Progress Update Modal -->
            <div id="progress-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-seedling"></i> Add Progress Update</h3>
                        <button class="modal-close" onclick="HarvestJournalPage.closeProgressModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="progress-seed-name" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-weight: 500;"></div>
                        <label>Progress Note:</label>
                        <textarea id="progress-note" rows="4" placeholder="What progress did you make? Any insights or challenges?"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="HarvestJournalPage.closeProgressModal()">
                            Cancel
                        </button>
                        <button class="btn-primary" onclick="HarvestJournalPage.saveProgress()">
                            <i class="fas fa-plus"></i> Add Update
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.harvest-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.closest('.harvest-tab').classList.add('active');

        // Update sections
        document.querySelectorAll('.harvest-section').forEach(section => {
            section.classList.remove('active');
        });

        if (tabName === 'growing') {
            document.getElementById('growing-seeds-section').classList.add('active');
        } else {
            document.getElementById('harvested-goals-section').classList.add('active');
        }
    },

    loadSeeds() {
        const data = window.gardenStorage.getData();
        const dailyLogs = data?.dailyLogs || {};
        const harvestJournal = data?.harvestJournal || {};

        const growingSeeds = [];
        const harvestedGoals = Object.values(harvestJournal);

        // Collect all seeds from daily logs
        Object.entries(dailyLogs).forEach(([date, log]) => {
            if (log.seeds && log.seeds.length > 0) {
                log.seeds.forEach(seed => {
                    // Check if this seed has been harvested
                    const isHarvested = Object.values(harvestJournal).some(
                        harvest => harvest.seedId === seed.id && harvest.originalDate === date
                    );

                    if (!isHarvested) {
                        growingSeeds.push({
                            ...seed,
                            originalDate: date,
                            daysGrowing: this.calculateDaysGrowing(date)
                        });
                    }
                });
            }
        });

        // Sort by date (newest first)
        growingSeeds.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
        harvestedGoals.sort((a, b) => new Date(b.harvestDate) - new Date(a.harvestDate));

        this.renderGrowingSeeds(growingSeeds);
        this.renderHarvestedGoals(harvestedGoals);
        this.updateStats(growingSeeds.length, harvestedGoals.length);
    },

    calculateDaysGrowing(plantedDate) {
        const today = new Date();
        const planted = new Date(plantedDate + 'T12:00:00');
        const diffTime = Math.abs(today - planted);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    renderGrowingSeeds(seeds) {
        const container = document.getElementById('growing-seeds-list');

        if (seeds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-seedling" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>No seeds currently growing</p>
                    <p style="font-size: 0.9rem; color: #7f8c8d;">Plant some seeds in your Daily Garden Log!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = seeds.map(seed => {
            const updatesHtml = seed.updates && seed.updates.length > 0 ? `
                <div class="seed-updates">
                    <div class="updates-header">
                        <i class="fas fa-chart-line"></i> Progress Updates (${seed.updates.length})
                    </div>
                    ${seed.updates.slice().reverse().map(update => `
                        <div class="update-item">
                            <div class="update-date">${this.formatDate(update.date)}</div>
                            <div class="update-note">${this.escapeHTML(update.note)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="seed-card growing" data-seed-id="${seed.id}" data-date="${seed.originalDate}">
                    <div class="seed-card-header">
                        <div class="seed-info">
                            <div class="seed-text">${this.escapeHTML(seed.text)}</div>
                            <div class="seed-meta">
                                <span class="seed-date">
                                    <i class="fas fa-calendar"></i> 
                                    Planted ${this.formatDate(seed.originalDate)}
                                </span>
                                <span class="seed-age">
                                    <i class="fas fa-clock"></i> 
                                    ${seed.daysGrowing} ${seed.daysGrowing === 1 ? 'day' : 'days'} growing
                                </span>
                            </div>
                            ${updatesHtml}
                        </div>
                        <div class="seed-actions">
                            <button class="btn-progress" onclick="HarvestJournalPage.addProgress(${seed.id}, '${seed.originalDate}')" title="Add progress update">
                                <i class="fas fa-plus-circle"></i> Progress
                            </button>
                            <button class="btn-harvest" onclick="HarvestJournalPage.harvestSeed(${seed.id}, '${seed.originalDate}')" title="Mark as completed">
                                <i class="fas fa-check-circle"></i> Harvest
                            </button>
                            <button class="btn-icon" onclick="HarvestJournalPage.editSeed(${seed.id}, '${seed.originalDate}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="HarvestJournalPage.deleteSeed(${seed.id}, '${seed.originalDate}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderHarvestedGoals(goals) {
        const container = document.getElementById('harvested-goals-list');

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 15px;"></i>
                    <p>No goals harvested yet</p>
                    <p style="font-size: 0.9rem; color: #7f8c8d;">Mark your growing seeds as complete to celebrate your achievements!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => `
            <div class="seed-card harvested">
                <div class="seed-card-header">
                    <div class="seed-info">
                        <div class="harvest-badge">
                            <i class="fas fa-trophy"></i> Achieved!
                        </div>
                        <div class="seed-text">${this.escapeHTML(goal.text)}</div>
                        <div class="seed-meta">
                            <span class="seed-date">
                                <i class="fas fa-seedling"></i> 
                                Planted ${this.formatDate(goal.originalDate)}
                            </span>
                            <span class="seed-date">
                                <i class="fas fa-award"></i> 
                                Harvested ${this.formatDate(goal.harvestDate)}
                            </span>
                            <span class="seed-age">
                                <i class="fas fa-hourglass-half"></i> 
                                ${goal.daysToHarvest} ${goal.daysToHarvest === 1 ? 'day' : 'days'} to achieve
                            </span>
                        </div>
                        ${goal.notes ? `
                            <div class="harvest-notes">
                                <i class="fas fa-comment"></i> ${this.escapeHTML(goal.notes)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="seed-actions">
                        <button class="btn-icon btn-delete" onclick="HarvestJournalPage.deleteHarvest('${goal.harvestId}')" title="Remove from harvest">
                            <i class="fas fa-undo"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    updateStats(growingCount, harvestedCount) {
        document.getElementById('growing-seeds-count').textContent = growingCount;
        document.getElementById('harvested-count').textContent = harvestedCount;

        const total = growingCount + harvestedCount;
        const completionRate = total > 0 ? Math.round((harvestedCount / total) * 100) : 0;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
    },

    formatDate(dateString) {
        const date = new Date(dateString + 'T12:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        if (dateOnly.getTime() === todayOnly.getTime()) {
            return 'today';
        } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
            return 'yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    },

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    harvestSeed(seedId, originalDate) {
        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seed = dailyLog.seeds.find(s => s.id === seedId);
        if (!seed) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Prompt for optional celebration notes
        const notes = prompt('🎉 Congratulations on achieving your goal!\n\nAdd a note about how you feel or what you learned (optional):');

        // Calculate days to harvest
        const plantedDate = new Date(originalDate + 'T12:00:00');
        const harvestDate = new Date();
        const daysToHarvest = Math.ceil((harvestDate - plantedDate) / (1000 * 60 * 60 * 24));

        // Create harvest entry
        const harvestId = `harvest-${Date.now()}`;
        const harvestEntry = {
            harvestId: harvestId,
            seedId: seedId,
            text: seed.text,
            originalDate: originalDate,
            harvestDate: new Date().toISOString().split('T')[0],
            daysToHarvest: daysToHarvest,
            notes: notes || '',
            timestamp: new Date().toISOString()
        };

        // Save to harvest journal
        if (window.gardenStorage.harvestGoal(harvestEntry)) {
            window.showNotification('🎉 Goal harvested! Well done!', 'success');
            this.loadSeeds();

            // Update home page stats
            if (window.gardenApp) {
                window.gardenApp.updateGrowthStats();
            }
        } else {
            window.showNotification('Error saving harvest', 'error');
        }
    },

    editSeed(seedId, originalDate) {
        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seed = dailyLog.seeds.find(s => s.id === seedId);
        if (!seed) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Store edit context
        this.editContext = {
            seedId: seedId,
            originalDate: originalDate
        };

        // Populate modal
        document.getElementById('edit-seed-text').value = seed.text;

        // Show modal
        document.getElementById('edit-seed-modal').style.display = 'flex';
    },

    closeEditModal() {
        document.getElementById('edit-seed-modal').style.display = 'none';
        this.editContext = null;
    },

    saveEdit() {
        if (!this.editContext) return;

        const newText = document.getElementById('edit-seed-text').value.trim();
        if (!newText) {
            window.showNotification('Goal description cannot be empty', 'warning');
            return;
        }

        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[this.editContext.originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seedIndex = dailyLog.seeds.findIndex(s => s.id === this.editContext.seedId);
        if (seedIndex === -1) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Update seed text
        dailyLog.seeds[seedIndex].text = newText;

        // Save updated log
        if (window.gardenStorage.saveDailyLog(this.editContext.originalDate, dailyLog)) {
            window.showNotification('Goal updated successfully!', 'success');
            this.closeEditModal();
            this.loadSeeds();
        } else {
            window.showNotification('Error saving changes', 'error');
        }
    },

    deleteSeed(seedId, originalDate) {
        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seed = dailyLog.seeds.find(s => s.id === seedId);
        if (!seed) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Build detailed confirmation message
        const daysGrowing = this.calculateDaysGrowing(originalDate);
        const hasUpdates = seed.updates && seed.updates.length > 0;

        let confirmMsg = `⚠️ DELETE GOAL?\n\n`;
        confirmMsg += `"${seed.text}"\n\n`;
        confirmMsg += `📅 Growing for ${daysGrowing} ${daysGrowing === 1 ? 'day' : 'days'}\n`;

        if (hasUpdates) {
            confirmMsg += `📝 Has ${seed.updates.length} progress ${seed.updates.length === 1 ? 'update' : 'updates'}\n`;
        }

        confirmMsg += `\n❌ This action CANNOT be undone.\n`;
        confirmMsg += `All progress updates will be permanently lost.\n\n`;
        confirmMsg += `Are you sure you want to delete this goal?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        // Remove seed from array
        dailyLog.seeds = dailyLog.seeds.filter(s => s.id !== seedId);

        // Save updated log
        if (window.gardenStorage.saveDailyLog(originalDate, dailyLog)) {
            window.showNotification('Goal deleted', 'info');
            this.loadSeeds();

            // Update home page stats
            if (window.gardenApp) {
                window.gardenApp.updateGrowthStats();
            }
        } else {
            window.showNotification('Error deleting goal', 'error');
        }
    },

    deleteHarvest(harvestId) {
        if (!confirm('Remove this goal from your harvest? It will return to your growing seeds.')) {
            return;
        }

        if (window.gardenStorage.removeHarvest(harvestId)) {
            window.showNotification('Removed from harvest', 'info');
            this.loadSeeds();

            // Update home page stats
            if (window.gardenApp) {
                window.gardenApp.updateGrowthStats();
            }
        } else {
            window.showNotification('Error removing harvest', 'error');
        }
    },

    // Progress Update Methods
    addProgress(seedId, originalDate) {
        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seed = dailyLog.seeds.find(s => s.id === seedId);
        if (!seed) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Store context for saving
        this.progressContext = {
            seedId: seedId,
            originalDate: originalDate
        };

        // Show seed name in modal
        document.getElementById('progress-seed-name').textContent = `📌 ${seed.text}`;
        document.getElementById('progress-note').value = '';

        // Show modal
        document.getElementById('progress-modal').style.display = 'flex';
        document.getElementById('progress-note').focus();
    },

    closeProgressModal() {
        document.getElementById('progress-modal').style.display = 'none';
        this.progressContext = null;
    },

    saveProgress() {
        const note = document.getElementById('progress-note').value.trim();

        if (!note) {
            window.showNotification('Please enter a progress note', 'error');
            return;
        }

        if (!this.progressContext) {
            window.showNotification('Error: Invalid context', 'error');
            return;
        }

        const data = window.gardenStorage.getData();
        const dailyLog = data.dailyLogs[this.progressContext.originalDate];

        if (!dailyLog || !dailyLog.seeds) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        const seedIndex = dailyLog.seeds.findIndex(s => s.id === this.progressContext.seedId);
        if (seedIndex === -1) {
            window.showNotification('Error: Could not find seed', 'error');
            return;
        }

        // Initialize updates array if it doesn't exist
        if (!dailyLog.seeds[seedIndex].updates) {
            dailyLog.seeds[seedIndex].updates = [];
        }

        // Add new progress update
        dailyLog.seeds[seedIndex].updates.push({
            date: new Date().toLocaleDateString('en-CA'),
            note: note,
            timestamp: new Date().toISOString()
        });

        // Save updated log
        if (window.gardenStorage.saveDailyLog(this.progressContext.originalDate, dailyLog)) {
            window.showNotification('✅ Progress update added!', 'success');
            this.closeProgressModal();
            this.loadSeeds();
        } else {
            window.showNotification('Error saving progress', 'error');
        }
    }
};

// Make HarvestJournalPage available globally
window.HarvestJournalPage = HarvestJournalPage;
