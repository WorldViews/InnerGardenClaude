// Google Drive Sync - Clean Implementation
// Simplified, reliable sync with no auto-sync complexity

const GOOGLE_CLIENT_ID = '141603479965-u4eap36jnsouqttrr9ah8ermmms9tmm3.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_NAME = 'inner-garden-data.json';
const DRIVE_FOLDER_NAME = 'InnerGarden';

class GoogleDriveSync {
    constructor() {
        this.accessToken = null;
        this.tokenClient = null;
        this.driveFolderId = null;
        this.driveFileId = null;
        this.isInitialized = false;
        this.lastSyncTime = null;
        this.lastLocalModified = null;
    }

    // Initialize Google Identity Services
    init() {
        if (this.isInitialized) return;

        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: DRIVE_SCOPE,
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response);
                        window.showNotification('❌ Authentication failed: ' + response.error, 'error');
                        return;
                    }
                    this.accessToken = response.access_token;
                    console.log('Successfully authenticated with Google Drive');
                }
            });
            this.isInitialized = true;
            console.log('Google Drive Sync initialized');
        } catch (error) {
            console.error('Failed to initialize Google Drive Sync:', error);
        }
    }

    // Request access token (triggers OAuth popup)
    async requestAccessToken() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            const originalCallback = this.tokenClient.callback;
            this.tokenClient.callback = (response) => {
                this.tokenClient.callback = originalCallback;

                if (response.error) {
                    let errorMessage = response.error;
                    if (response.error === 'access_denied') {
                        errorMessage = 'Access denied. Please add your email as a test user in Google Cloud Console';
                    } else if (response.error === 'popup_closed_by_user') {
                        errorMessage = 'Login popup was closed. Please try again.';
                    }
                    reject(new Error(errorMessage));
                    return;
                }

                this.accessToken = response.access_token;
                resolve(this.accessToken);
            };

            this.tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    // Ensure the InnerGarden folder exists
    async ensureFolder() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        // Check if folder exists
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Drive API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
            this.driveFolderId = searchData.files[0].id;
            return this.driveFolderId;
        }

        // Create folder
        const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: DRIVE_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                    description: 'Inner Garden Tracker backups'
                })
            }
        );

        if (!createResponse.ok) {
            throw new Error(`Failed to create folder: ${createResponse.status}`);
        }

        const folderData = await createResponse.json();
        this.driveFolderId = folderData.id;
        return this.driveFolderId;
    }

    // Find the data file in Drive
    async findDataFile() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        await this.ensureFolder();

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and '${this.driveFolderId}' in parents and trashed=false`,
            {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );

        if (!response.ok) {
            throw new Error(`Drive API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.files && data.files.length > 0) {
            this.driveFileId = data.files[0].id;
            return this.driveFileId;
        }

        return null;
    }

    // Download data from Drive
    async downloadFromDrive(fileId) {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
        }

        return await response.json();
    }

    // Upload data to Drive (create new file)
    async uploadToDrive(data) {
        await this.ensureFolder();

        const metadata = {
            name: DRIVE_FILE_NAME,
            mimeType: 'application/json',
            parents: [this.driveFolderId]
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        this.driveFileId = result.id;
        return result;
    }

    // Update existing file in Drive
    async updateFileInDrive(fileId, data) {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data, null, 2)
            }
        );

        if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
        }

        return await response.json();
    }

    // Add lastModified timestamp to data
    addTimestamp(data) {
        return {
            ...data,
            lastModified: new Date().toISOString()
        };
    }

    // Calculate hash of data (for detecting changes)
    calculateHash(data) {
        const content = JSON.stringify({
            profile: data.profile,
            dailyLogs: data.dailyLogs,
            weedTracker: data.weedTracker,
            harvestJournal: data.harvestJournal,
            valuesGarden: data.valuesGarden
        });

        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Count entries in data (for conflict resolution)
    countEntries(data) {
        const dailyLogs = Object.keys(data.dailyLogs || {}).length;
        const weeds = Object.keys(data.weedTracker || {}).length;
        const harvests = Object.keys(data.harvestJournal || {}).length;

        return {
            dailyLogs,
            weeds,
            harvests,
            total: dailyLogs + weeds + harvests
        };
    }

    // Main sync method
    async sync() {
        try {
            window.showNotification('🔄 Syncing with Google Drive...', 'info');

            // Authenticate
            await this.requestAccessToken();

            // Get local data
            const localData = window.gardenStorage.getData();
            if (!localData) {
                window.showNotification('❌ No local data found', 'error');
                return;
            }

            // Check if file exists on Drive
            const fileId = await this.findDataFile();

            if (!fileId) {
                // No Drive file - upload local data
                console.log('No Drive file found - uploading local data');
                const dataToUpload = this.addTimestamp(localData);
                await this.uploadToDrive(dataToUpload);
                this.markAsSynced();
                window.showNotification('✅ Uploaded to Google Drive', 'success');
                return;
            }

            // Download Drive data
            const driveData = await this.downloadFromDrive(fileId);

            // Get timestamps
            const localTimestamp = localData.lastModified ? new Date(localData.lastModified) : null;
            const driveTimestamp = driveData.lastModified ? new Date(driveData.lastModified) : null;

            // Calculate hashes to detect if data actually differs
            const localHash = this.calculateHash(localData);
            const driveHash = this.calculateHash(driveData);

            if (localHash === driveHash) {
                // Data is identical
                console.log('Data is identical - no sync needed');
                this.markAsSynced();
                window.showNotification('✅ Already in sync', 'success');
                return;
            }

            // Data differs - determine direction
            if (!localTimestamp && !driveTimestamp) {
                // Neither has timestamp - ask user
                const choice = confirm(
                    'Both local and Drive data exist but have no sync history.\n\n' +
                    'Click OK to download from Drive (overwrite local)\n' +
                    'Click Cancel to upload to Drive (overwrite Drive)'
                );

                if (choice) {
                    // Download from Drive
                    await this.downloadAndApply(driveData);
                    this.markAsSynced();
                } else {
                    // Upload to Drive
                    const dataToUpload = this.addTimestamp(localData);
                    await this.updateFileInDrive(fileId, dataToUpload);
                    this.markAsSynced();
                    window.showNotification('✅ Uploaded to Google Drive', 'success');
                }
            } else if (!driveTimestamp || (localTimestamp && localTimestamp > driveTimestamp)) {
                // Local is newer - upload
                console.log('Local data is newer - uploading');
                const dataToUpload = this.addTimestamp(localData);
                await this.updateFileInDrive(fileId, dataToUpload);
                this.markAsSynced();
                window.showNotification('✅ Uploaded newer data to Drive', 'success');
            } else if (!localTimestamp || driveTimestamp > localTimestamp) {
                // Drive is newer - download
                console.log('Drive data is newer - downloading');
                await this.downloadAndApply(driveData);
                this.markAsSynced();
            } else {
                // Timestamps equal but data differs - conflict
                // Try to determine which has more data
                const localCount = this.countEntries(localData);
                const driveCount = this.countEntries(driveData);

                let message = 'Conflict detected: timestamps match but data differs.\n\n';
                message += `Local: ${localCount.dailyLogs} daily logs, ${localCount.weeds} weeds, ${localCount.harvests} harvests\n`;
                message += `Drive: ${driveCount.dailyLogs} daily logs, ${driveCount.weeds} weeds, ${driveCount.harvests} harvests\n\n`;

                if (localCount.total > driveCount.total) {
                    message += '💡 Local has MORE data - recommend uploading (Cancel)\n\n';
                } else if (driveCount.total > localCount.total) {
                    message += '💡 Drive has MORE data - recommend downloading (OK)\n\n';
                } else {
                    message += '💡 Same amount of data but different content\n\n';
                }

                message += 'Click OK to download from Drive (overwrite local)\n';
                message += 'Click Cancel to upload to Drive (overwrite Drive)';

                const choice = confirm(message);

                if (choice) {
                    await this.downloadAndApply(driveData);
                    this.markAsSynced();
                } else {
                    const dataToUpload = this.addTimestamp(localData);
                    await this.updateFileInDrive(fileId, dataToUpload);
                    this.markAsSynced();
                    window.showNotification('✅ Uploaded to Google Drive', 'success');
                }
            }

        } catch (error) {
            console.error('Sync error:', error);
            if (error.message.includes('popup')) {
                window.showNotification('❌ Please allow popups to connect to Google Drive', 'error');
            } else {
                window.showNotification('❌ Sync failed: ' + error.message, 'error');
            }
        }
    }

    // Download and apply Drive data to local storage
    async downloadAndApply(driveData) {
        // Remove any metadata before saving
        const { exportInfo, ...cleanData } = driveData;

        if (window.gardenStorage.saveData(cleanData)) {
            window.showNotification('✅ Downloaded from Drive - Refreshing...', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            throw new Error('Failed to save downloaded data');
        }
    }

    // Legacy method for "Save to Drive" button (simple upload)
    async saveToGoogleDrive() {
        try {
            window.showNotification('🔄 Connecting to Google Drive...', 'info');
            await this.requestAccessToken();

            const localData = window.gardenStorage.getData();
            if (!localData) {
                window.showNotification('❌ No data to save', 'error');
                return;
            }

            const dataToUpload = this.addTimestamp(localData);
            const fileId = await this.findDataFile();

            if (fileId) {
                await this.updateFileInDrive(fileId, dataToUpload);
                window.showNotification('✅ Updated in Google Drive', 'success');
            } else {
                await this.uploadToDrive(dataToUpload);
                window.showNotification('✅ Saved to Google Drive', 'success');
            }

        } catch (error) {
            console.error('Save error:', error);
            window.showNotification('❌ Save failed: ' + error.message, 'error');
        }
    }

    // Legacy method for "Load from Drive" button (simple download)
    async loadFromGoogleDrive() {
        try {
            window.showNotification('🔄 Connecting to Google Drive...', 'info');
            await this.requestAccessToken();

            const fileId = await this.findDataFile();
            if (!fileId) {
                window.showNotification('❌ No backup found in Google Drive', 'warning');
                return;
            }

            const driveData = await this.downloadFromDrive(fileId);

            if (!driveData.profile || !driveData.dailyLogs) {
                window.showNotification('❌ Invalid data format', 'error');
                return;
            }

            const confirmImport = confirm(
                'This will replace all your current data with the Drive backup. Continue?'
            );

            if (!confirmImport) {
                window.showNotification('Import cancelled', 'info');
                return;
            }

            await this.downloadAndApply(driveData);

        } catch (error) {
            console.error('Load error:', error);
            window.showNotification('❌ Load failed: ' + error.message, 'error');
        }
    }

    // Check if there are unsaved changes
    hasUnsavedChanges() {
        const localData = window.gardenStorage.getData();
        if (!localData) return false;

        const currentModified = localData.lastModified;
        
        // If no sync has happened yet, consider it as having unsaved changes
        if (!this.lastSyncTime) return true;
        
        // If no lastModified timestamp, no changes
        if (!currentModified) return false;
        
        // Compare current lastModified with what we had at last sync
        return currentModified !== this.lastLocalModified;
    }

    // Update sync button appearance
    updateSyncButton() {
        const syncBtn = document.getElementById('quick-sync-btn');
        if (!syncBtn) return;

        if (this.hasUnsavedChanges()) {
            syncBtn.classList.add('unsaved-changes');
            syncBtn.title = 'Sync with Google Drive (unsaved changes)';
        } else {
            syncBtn.classList.remove('unsaved-changes');
            syncBtn.title = 'Sync with Google Drive';
        }
    }

    // Mark data as synced (call after successful sync)
    markAsSynced() {
        const localData = window.gardenStorage.getData();
        if (localData) {
            this.lastLocalModified = localData.lastModified;
            this.lastSyncTime = new Date().toISOString();
        }
        this.updateSyncButton();
    }
}

// Create global instance
window.googleDriveSync = new GoogleDriveSync();

// Initialize when Google API loads
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.google && window.google.accounts) {
            window.googleDriveSync.init();
            console.log('Google Drive Sync ready');
        } else {
            console.warn('Google API not loaded - Drive sync unavailable');
        }
        // Update button state on load
        if (window.googleDriveSync) {
            window.googleDriveSync.updateSyncButton();
        }
    }, 1000);

});
