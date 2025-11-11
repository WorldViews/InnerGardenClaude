// Utility functions for the Garden Tracker

// Global functions for HTML onclick handlers
window.showPage = function (pageId) {
    if (window.gardenApp) {
        window.gardenApp.showPage(pageId);
    }
};

window.goHome = function () {
    if (window.gardenApp) {
        window.gardenApp.showHome();
    }
};

window.quickLog = function () {
    window.showPage('daily-log');
    setTimeout(() => {
        const quickEntry = document.querySelector('.quick-entry-input');
        if (quickEntry) quickEntry.focus();
    }, 100);
};

window.quickReflect = function () {
    const reflection = prompt('Quick reflection - what are you grateful for right now?');
    if (reflection && reflection.trim()) {
        const today = new Date().toISOString().split('T')[0];
        const existingLog = window.gardenStorage.getDailyLog(today) || {};
        existingLog.gratitude = existingLog.gratitude || [];
        existingLog.gratitude.push({
            id: Date.now(),
            text: reflection.trim(),
            timestamp: new Date().toISOString()
        });
        window.gardenStorage.saveDailyLog(today, existingLog);

        showNotification('🌱 Gratitude planted in your garden!');
    }
};

window.showNotification = function (message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

window.downloadGardenData = function () {
    try {
        // Get all garden data from storage
        const gardenData = window.gardenStorage.getData();

        if (!gardenData) {
            window.showNotification('❌ No garden data found to export.', 'error');
            return;
        }

        // Calculate some summary stats for the export
        const stats = window.gardenStorage.calculateGrowthStats();
        const dailyLogCount = Object.keys(gardenData.dailyLogs || {}).length;
        const weedEntryCount = Object.keys(gardenData.weedTracker || {}).length;

        // Add export metadata
        const exportData = {
            ...gardenData,
            exportInfo: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                appName: 'Inner Garden Tracker',
                summary: {
                    totalDailyLogs: dailyLogCount,
                    totalWeedEntries: weedEntryCount,
                    currentStreak: stats.streak,
                    daysSinceStart: stats.daysSinceStart,
                    wellnessScore: stats.wellnessScore
                }
            }
        };

        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `inner-garden-backup-${timestamp}.json`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        URL.revokeObjectURL(url);

        window.showNotification(`🌱 Garden data exported as JSON! ${dailyLogCount} logs, ${weedEntryCount} wisdom entries`);

    } catch (error) {
        console.error('Error exporting garden data:', error);
        window.showNotification('❌ Error exporting garden data. Please try again.', 'error');
    }
};

window.downloadGardenDataYAML = function () {
    try {
        // Get all garden data from storage
        const gardenData = window.gardenStorage.getData();

        if (!gardenData) {
            window.showNotification('❌ No garden data found to export.', 'error');
            return;
        }

        // Calculate some summary stats for the export
        const stats = window.gardenStorage.calculateGrowthStats();
        const dailyLogCount = Object.keys(gardenData.dailyLogs || {}).length;
        const weedEntryCount = Object.keys(gardenData.weedTracker || {}).length;

        // Add export metadata
        const exportData = {
            ...gardenData,
            exportInfo: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                appName: 'Inner Garden Tracker',
                summary: {
                    totalDailyLogs: dailyLogCount,
                    totalWeedEntries: weedEntryCount,
                    currentStreak: stats.streak,
                    daysSinceStart: stats.daysSinceStart,
                    wellnessScore: stats.wellnessScore
                }
            }
        };

        // Convert to YAML string
        const yamlString = window.convertToYAML(exportData);

        // Create blob and download
        const blob = new Blob([yamlString], { type: 'application/x-yaml' });
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `inner-garden-backup-${timestamp}.yaml`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Clean up
        URL.revokeObjectURL(url);

        window.showNotification(`🌱 Garden data exported as YAML! ${dailyLogCount} logs, ${weedEntryCount} wisdom entries`);

    } catch (error) {
        console.error('Error exporting garden data as YAML:', error);
        window.showNotification('❌ Error exporting garden data. Please try again.', 'error');
    }
};

// Simple YAML converter function
window.convertToYAML = function (obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (obj === null) {
        return 'null';
    } else if (typeof obj === 'boolean') {
        return obj.toString();
    } else if (typeof obj === 'number') {
        return obj.toString();
    } else if (typeof obj === 'string') {
        // Escape strings that need quotes
        if (obj.includes('\n') || obj.includes(':') || obj.includes('[') || obj.includes(']') || obj.includes('{') || obj.includes('}')) {
            return `"${obj.replace(/"/g, '\\"')}"`;
        }
        return obj;
    } else if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return '[]';
        }
        yaml += '\n';
        obj.forEach(item => {
            yaml += `${spaces}- ${window.convertToYAML(item, indent + 1).replace(/^\s+/, '')}`;
            if (typeof item === 'object' && !Array.isArray(item) && item !== null) {
                yaml += '\n';
            } else {
                yaml += '\n';
            }
        });
        return yaml.slice(0, -1); // Remove last newline
    } else if (typeof obj === 'object') {
        if (Object.keys(obj).length === 0) {
            return '{}';
        }
        yaml += '\n';
        Object.entries(obj).forEach(([key, value]) => {
            const convertedValue = window.convertToYAML(value, indent + 1);
            if (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length > 0) {
                yaml += `${spaces}${key}:${convertedValue}\n`;
            } else if (Array.isArray(value) && value.length > 0) {
                yaml += `${spaces}${key}:${convertedValue}\n`;
            } else {
                yaml += `${spaces}${key}: ${convertedValue}\n`;
            }
        });
        return yaml.slice(0, -1); // Remove last newline
    }
    return obj.toString();
};

window.importGardenData = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate the imported data structure
            if (!importedData.profile || !importedData.dailyLogs) {
                window.showNotification('❌ Invalid garden data file format.', 'error');
                return;
            }

            // Confirm import with user
            const confirmImport = confirm(
                'This will replace all your current garden data. Are you sure you want to import this backup?\n\n' +
                'Tip: Export your current data first as a backup if needed.'
            );

            if (!confirmImport) {
                return;
            }

            // Remove export metadata before importing
            const { exportInfo, ...cleanData } = importedData;

            // Save the imported data
            if (window.gardenStorage.saveData(cleanData)) {
                window.showNotification('🌱 Garden data imported successfully! Refreshing page...');

                // Refresh the page to reflect imported data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                window.showNotification('❌ Error importing garden data.', 'error');
            }

        } catch (error) {
            console.error('Error importing garden data:', error);
            window.showNotification('❌ Invalid JSON file or corrupted data.', 'error');
        }
    };

    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
};

window.importFromURL = function () {
    const defaultURL = 'https://worldviews.org/InnerGarden/backups/inner-garden-backup.json';
    const url = prompt('Enter the URL of the JSON backup file to import:', defaultURL);

    if (!url || url.trim() === '') {
        return; // User cancelled
    }

    // Show loading notification
    window.showNotification('⏳ Downloading garden data from URL...', 'info');

    // Fetch the data from the URL
    fetch(url.trim())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(importedData => {
            // Validate the imported data structure
            if (!importedData.profile || !importedData.dailyLogs) {
                window.showNotification('❌ Invalid garden data format from URL.', 'error');
                return;
            }

            // Confirm import with user
            const confirmImport = confirm(
                'This will replace all your current garden data. Are you sure you want to import this backup?\n\n' +
                'Tip: Export your current data first as a backup if needed.'
            );

            if (!confirmImport) {
                window.showNotification('Import cancelled.', 'info');
                return;
            }

            // Remove export metadata before importing
            const { exportInfo, ...cleanData } = importedData;

            // Save the imported data
            if (window.gardenStorage.saveData(cleanData)) {
                window.showNotification('🌱 Garden data imported successfully! Refreshing page...');

                // Refresh the page to reflect imported data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                window.showNotification('❌ Error importing garden data.', 'error');
            }
        })
        .catch(error => {
            console.error('Error importing from URL:', error);
            window.showNotification(`❌ Failed to import from URL: ${error.message}`, 'error');
        });
};

// Update data statistics in the management panel
window.updateDataStatistics = function () {
    const statsContainer = document.getElementById('data-stats');
    if (!statsContainer) return;

    try {
        const gardenData = window.gardenStorage.getData();
        if (!gardenData) {
            statsContainer.innerHTML = '<p style="color: #7f8c8d;">No data available</p>';
            return;
        }

        const stats = window.gardenStorage.calculateGrowthStats();
        const dailyLogCount = Object.keys(gardenData.dailyLogs || {}).length;
        const weedEntryCount = Object.keys(gardenData.weedTracker || {}).length;

        // Calculate total seeds and gratitude entries
        let totalSeeds = 0;
        let totalGratitude = 0;
        Object.values(gardenData.dailyLogs || {}).forEach(log => {
            totalSeeds += (log.seeds || []).length;
            totalGratitude += (log.gratitude || []).length;
        });

        // Calculate data size
        const dataSize = (new Blob([JSON.stringify(gardenData)]).size / 1024).toFixed(1);

        statsContainer.innerHTML = `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${dailyLogCount}</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Daily Logs</div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${totalSeeds}</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Seeds Planted</div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #e74c3c;">${totalGratitude}</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Gratitude Entries</div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #9b59b6;">${weedEntryCount}</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Wisdom Entries</div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #f39c12;">${stats.daysSinceStart}</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Days Growing</div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #17a2b8;">${dataSize} KB</div>
                <div style="color: #7f8c8d; font-size: 0.9rem;">Data Size</div>
            </div>
        `;
    } catch (error) {
        console.error('Error updating data statistics:', error);
        statsContainer.innerHTML = '<p style="color: #e74c3c;">Error loading statistics</p>';
    }
};