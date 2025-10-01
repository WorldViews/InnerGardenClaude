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

        window.showNotification(`🌱 Garden data exported! ${dailyLogCount} logs, ${weedEntryCount} wisdom entries`);

    } catch (error) {
        console.error('Error exporting garden data:', error);
        window.showNotification('❌ Error exporting garden data. Please try again.', 'error');
    }
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