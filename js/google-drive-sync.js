// Google Drive Sync functionality for Inner Garden Tracker

const GOOGLE_CLIENT_ID = '141603479965-u4eap36jnsouqttrr9ah8ermmms9tmm3.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_NAME = 'inner-garden-data.json';
const DRIVE_FOLDER_NAME = 'InnerGarden';
const BACKUP_FOLDER_NAME = 'backups';
const MAX_BACKUPS = 20;
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SYNC_DEBOUNCE_DELAY = 30 * 1000; // 30 seconds after last change

class GoogleDriveSync {
    constructor() {
        this.accessToken = null;
        this.tokenClient = null;
        this.driveFileId = null; // ID of the backup file in Drive
        this.driveFolderId = null; // ID of the InnerGarden folder
        this.backupFolderId = null; // ID of the backups folder
        this.isInitialized = false;

        // Auto-sync state
        this.autoSyncEnabled = false;
        this.autoBackupEnabled = true; // Default: enabled
        this.autoSyncTimer = null;
        this.syncDebounceTimer = null;
        this.lastSyncTime = null;
        this.lastSyncedDataHash = null; // Track last synced data to avoid redundant syncs
        this.isSyncing = false;
        this.isOnline = navigator.onLine;
        this.syncRetryCount = 0;
        this.maxRetries = 3;
        this.backupCount = 0;

        // Load preferences
        this.loadAutoSyncPreference();
        this.loadAutoBackupPreference();

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
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

    // Request access token (triggers Google OAuth popup)
    async requestAccessToken() {
        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            // Override callback for this specific request
            const originalCallback = this.tokenClient.callback;
            this.tokenClient.callback = (response) => {
                // Restore original callback
                this.tokenClient.callback = originalCallback;

                if (response.error) {
                    console.error('OAuth error details:', response);
                    let errorMessage = response.error;

                    // Provide helpful error messages
                    if (response.error === 'access_denied') {
                        errorMessage = 'Access denied. Please add your email as a test user in Google Cloud Console (APIs & Services → OAuth consent screen → Test users)';
                    } else if (response.error === 'popup_closed_by_user') {
                        errorMessage = 'Login popup was closed. Please try again.';
                    }

                    reject(new Error(errorMessage));
                    return;
                }

                this.accessToken = response.access_token;
                resolve(this.accessToken);
            };

            // Trigger OAuth popup
            this.tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    // Find or create the InnerGarden folder
    async ensureFolder() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        // Check if folder already exists
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Drive API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        if (searchData.files && searchData.files.length > 0) {
            // Folder exists
            this.driveFolderId = searchData.files[0].id;
            console.log('Found existing InnerGarden folder:', this.driveFolderId);
            return this.driveFolderId;
        }

        // Create new folder
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
        console.log('Created InnerGarden folder:', this.driveFolderId);
        return this.driveFolderId;
    }

    // Find or create the backups subfolder
    async ensureBackupFolder() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        // Ensure main folder exists first
        await this.ensureFolder();

        // Check if backups folder already exists
        const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and '${this.driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Drive API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        if (searchData.files && searchData.files.length > 0) {
            // Folder exists
            this.backupFolderId = searchData.files[0].id;
            console.log('Found existing backups folder:', this.backupFolderId);
            return this.backupFolderId;
        }

        // Create new backups folder inside InnerGarden
        const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: BACKUP_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [this.driveFolderId],
                    description: 'Automated backups of Inner Garden data'
                })
            }
        );

        if (!createResponse.ok) {
            throw new Error(`Failed to create backups folder: ${createResponse.status}`);
        }

        const folderData = await createResponse.json();
        this.backupFolderId = folderData.id;
        console.log('Created backups folder:', this.backupFolderId);
        return this.backupFolderId;
    }

    // Create a timestamped backup of the current file
    async createBackup() {
        if (!this.accessToken || !this.autoBackupEnabled) {
            return; // Skip if not enabled
        }

        try {
            // Ensure backup folder exists
            await this.ensureBackupFolder();

            // Get current file content
            if (!this.driveFileId) {
                await this.findBackupFile();
            }

            if (!this.driveFileId) {
                console.log('No existing file to backup');
                return;
            }

            // Download current file content
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${this.driveFileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!downloadResponse.ok) {
                throw new Error(`Failed to download file for backup: ${downloadResponse.status}`);
            }

            const fileContent = await downloadResponse.text();

            // Create timestamp for filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').split('.')[0];
            const backupFileName = `inner-garden-backup-${timestamp}.json`;

            // Upload backup to backups folder
            const metadata = {
                name: backupFileName,
                mimeType: 'application/json',
                parents: [this.backupFolderId],
                description: `Automatic backup created at ${new Date().toLocaleString()}`
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([fileContent], { type: 'application/json' }));

            const uploadResponse = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: form
                }
            );

            if (!uploadResponse.ok) {
                throw new Error(`Failed to create backup: ${uploadResponse.status}`);
            }

            console.log(`Backup created: ${backupFileName}`);

            // Clean up old backups
            await this.deleteOldBackups();

        } catch (error) {
            console.error('Error creating backup:', error);
            // Don't throw - backup failure shouldn't stop the sync
            window.showNotification('⚠️ Warning: Backup creation failed, but sync will continue', 'warning');
        }
    }

    // Delete old backups, keeping only the most recent MAX_BACKUPS
    async deleteOldBackups() {
        if (!this.accessToken || !this.backupFolderId) {
            return;
        }

        try {
            // List all backup files
            const listResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${this.backupFolderId}' in parents and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!listResponse.ok) {
                throw new Error(`Failed to list backups: ${listResponse.status}`);
            }

            const listData = await listResponse.json();
            const backups = listData.files || [];

            this.backupCount = backups.length;
            this.updateBackupCountDisplay();

            // Delete oldest backups if we have more than MAX_BACKUPS
            if (backups.length > MAX_BACKUPS) {
                const toDelete = backups.slice(MAX_BACKUPS);
                console.log(`Deleting ${toDelete.length} old backups`);

                for (const backup of toDelete) {
                    await fetch(
                        `https://www.googleapis.com/drive/v3/files/${backup.id}`,
                        {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${this.accessToken}`
                            }
                        }
                    );
                }

                this.backupCount = MAX_BACKUPS;
                this.updateBackupCountDisplay();
            }
        } catch (error) {
            console.error('Error deleting old backups:', error);
        }
    }

    // Clear all backups with user confirmation
    async clearAllBackups() {
        if (!confirm(`Are you sure you want to delete all ${this.backupCount} backups?\n\nThis cannot be undone!`)) {
            return;
        }

        if (!this.accessToken) {
            window.showNotification('❌ Not authenticated with Google Drive', 'error');
            return;
        }

        try {
            window.showNotification('🗑️ Deleting all backups...', 'info');

            // Ensure backup folder exists
            await this.ensureBackupFolder();

            // List all backup files
            const listResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${this.backupFolderId}' in parents and trashed=false&fields=files(id,name)`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!listResponse.ok) {
                throw new Error(`Failed to list backups: ${listResponse.status}`);
            }

            const listData = await listResponse.json();
            const backups = listData.files || [];

            if (backups.length === 0) {
                window.showNotification('No backups to delete', 'info');
                return;
            }

            // Delete all backups
            for (const backup of backups) {
                await fetch(
                    `https://www.googleapis.com/drive/v3/files/${backup.id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );
            }

            this.backupCount = 0;
            this.updateBackupCountDisplay();

            window.showNotification(`✅ Deleted ${backups.length} backups successfully!`, 'success');

        } catch (error) {
            console.error('Error clearing backups:', error);
            window.showNotification('❌ Failed to clear backups: ' + error.message, 'error');
        }
    }

    // Find existing backup file in InnerGarden folder
    async findBackupFile() {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        // Ensure folder exists first
        await this.ensureFolder();

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and '${this.driveFolderId}' in parents and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
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

    // Create new backup file in InnerGarden folder
    async createBackupFile(gardenData) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        // Ensure folder exists
        await this.ensureFolder();

        const metadata = {
            name: DRIVE_FILE_NAME,
            mimeType: 'application/json',
            description: 'Inner Garden Tracker backup data',
            parents: [this.driveFolderId]  // Put file in InnerGarden folder
        };

        const fileContent = JSON.stringify(gardenData, null, 2);

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to create file: ${response.status}`);
        }

        const data = await response.json();
        this.driveFileId = data.id;
        return data.id;
    }

    // Update existing backup file in Drive
    async updateBackupFile(gardenData) {
        if (!this.accessToken || !this.driveFileId) {
            throw new Error('Not authenticated or file not found');
        }

        // Create backup before updating (if enabled)
        if (this.autoBackupEnabled) {
            await this.createBackup();
        }

        const fileContent = JSON.stringify(gardenData, null, 2);

        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${this.driveFileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: fileContent
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update file: ${response.status}`);
        }

        return await response.json();
    }

    // Save current garden data to Google Drive
    async saveToGoogleDrive() {
        try {
            window.showNotification('🔄 Connecting to Google Drive...', 'info');

            // Request authentication
            await this.requestAccessToken();

            window.showNotification('📤 Uploading garden data...', 'info');

            // Get current garden data
            const gardenData = window.gardenStorage.getData();
            if (!gardenData) {
                window.showNotification('❌ No garden data to save', 'error');
                return;
            }

            // Add export metadata
            const stats = window.gardenStorage.calculateGrowthStats();
            const exportData = {
                ...gardenData,
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    appName: 'Inner Garden Tracker',
                    exportMethod: 'Google Drive Sync',
                    summary: {
                        totalDailyLogs: Object.keys(gardenData.dailyLogs || {}).length,
                        totalWeedEntries: Object.keys(gardenData.weedTracker || {}).length,
                        currentStreak: stats.streak,
                        daysSinceStart: stats.daysSinceStart,
                        wellnessScore: stats.wellnessScore
                    }
                }
            };

            // Check if backup file exists
            const existingFileId = await this.findBackupFile();

            if (existingFileId) {
                // Update existing file
                await this.updateBackupFile(exportData);
                window.showNotification('✅ Garden data updated in Google Drive!', 'success');
            } else {
                // Create new file
                await this.createBackupFile(exportData);
                window.showNotification('✅ Garden data saved to Google Drive!', 'success');
            }

        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            if (error.message.includes('popup')) {
                window.showNotification('❌ Please allow popups to connect to Google Drive', 'error');
            } else {
                window.showNotification('❌ Failed to save to Google Drive: ' + error.message, 'error');
            }
        }
    }

    // Load garden data from Google Drive
    async loadFromGoogleDrive() {
        try {
            window.showNotification('🔄 Connecting to Google Drive...', 'info');

            // Request authentication
            await this.requestAccessToken();

            window.showNotification('📥 Downloading garden data...', 'info');

            // Find backup file
            const fileId = await this.findBackupFile();

            if (!fileId) {
                window.showNotification('❌ No backup found in Google Drive. Save first!', 'warning');
                return;
            }

            // Download file content
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`);
            }

            const importedData = await response.json();

            // Validate the imported data structure
            if (!importedData.profile || !importedData.dailyLogs) {
                window.showNotification('❌ Invalid garden data format in Drive backup', 'error');
                return;
            }

            // Confirm import with user
            const confirmImport = confirm(
                'This will replace all your current garden data with the backup from Google Drive. Are you sure?\n\n' +
                'Tip: Export your current data first as a backup if needed.'
            );

            if (!confirmImport) {
                window.showNotification('Import cancelled', 'info');
                return;
            }

            // Remove export metadata before importing
            const { exportInfo, ...cleanData } = importedData;

            // Save the imported data
            if (window.gardenStorage.saveData(cleanData)) {
                window.showNotification('✅ Garden data loaded from Google Drive! Refreshing...', 'success');

                // Refresh the page to reflect imported data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                window.showNotification('❌ Error importing garden data', 'error');
            }

        } catch (error) {
            console.error('Error loading from Google Drive:', error);
            if (error.message.includes('popup')) {
                window.showNotification('❌ Please allow popups to connect to Google Drive', 'error');
            } else {
                window.showNotification('❌ Failed to load from Google Drive: ' + error.message, 'error');
            }
        }
    }

    // Check Drive connection status
    async checkConnection() {
        if (!this.accessToken) {
            return { connected: false, message: 'Not connected to Google Drive' };
        }

        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=user',
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    connected: true,
                    user: data.user,
                    message: `Connected as ${data.user.emailAddress}`
                };
            } else {
                return { connected: false, message: 'Token expired' };
            }
        } catch (error) {
            return { connected: false, message: 'Connection error' };
        }
    }

    // ===== AUTO-SYNC FUNCTIONALITY =====

    loadAutoSyncPreference() {
        const enabled = localStorage.getItem('autoSyncEnabled') === 'true';
        if (enabled) {
            // Will be enabled after init
            this.autoSyncEnabled = true;
        }
    }

    saveAutoSyncPreference(enabled) {
        localStorage.setItem('autoSyncEnabled', enabled.toString());
    }

    loadAutoBackupPreference() {
        const stored = localStorage.getItem('autoBackupEnabled');
        if (stored === null) {
            this.autoBackupEnabled = true; // Default: enabled
        } else {
            this.autoBackupEnabled = stored === 'true';
        }
    }

    saveAutoBackupPreference(enabled) {
        localStorage.setItem('autoBackupEnabled', enabled.toString());
    }

    toggleAutoBackup(enabled) {
        this.autoBackupEnabled = enabled;
        this.saveAutoBackupPreference(enabled);

        if (enabled) {
            window.showNotification('✅ Auto-backup enabled - backups will be created before each sync', 'success');
        } else {
            window.showNotification('Auto-backup disabled', 'info');
        }
    }

    updateBackupCountDisplay() {
        const countElement = document.getElementById('backup-count');
        if (countElement) {
            if (this.backupCount > 0) {
                countElement.textContent = `${this.backupCount} backup${this.backupCount !== 1 ? 's' : ''} stored`;
                countElement.style.display = 'inline';
            } else {
                countElement.textContent = 'No backups yet';
                countElement.style.display = 'inline';
            }
        }
    }

    toggleAutoSync(enabled) {
        if (enabled) {
            this.enableAutoSync();
        } else {
            this.disableAutoSync();
        }
    }

    async enableAutoSync() {
        this.autoSyncEnabled = true;
        this.saveAutoSyncPreference(true);

        // Update UI
        const checkbox = document.getElementById('auto-sync-checkbox');
        if (checkbox) checkbox.checked = true;

        this.updateSyncStatus('info', 'Auto-sync enabled. Authenticating...', 'fa-spinner fa-spin');

        try {
            // Authenticate if not already
            if (!this.accessToken) {
                await this.requestAccessToken();
            }

            // Start the auto-sync timer
            this.startAutoSyncTimer();

            // Do an initial sync
            await this.performAutoSync();

            window.showNotification('✅ Auto-sync enabled! Your garden will sync every 5 minutes.', 'success');
        } catch (error) {
            console.error('Error enabling auto-sync:', error);
            this.disableAutoSync();
            window.showNotification('❌ Could not enable auto-sync: ' + error.message, 'error');
        }
    }

    disableAutoSync() {
        this.autoSyncEnabled = false;
        this.saveAutoSyncPreference(false);

        // Clear timers
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
            this.syncDebounceTimer = null;
        }

        // Update UI
        const checkbox = document.getElementById('auto-sync-checkbox');
        if (checkbox) checkbox.checked = false;

        this.updateSyncStatus('secondary', 'Auto-sync disabled', 'fa-pause-circle');
        window.showNotification('Auto-sync disabled', 'info');
    }

    startAutoSyncTimer() {
        // Clear existing timer
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }

        // Sync every 5 minutes
        this.autoSyncTimer = setInterval(() => {
            if (this.autoSyncEnabled && this.isOnline) {
                this.performAutoSync();
            }
        }, AUTO_SYNC_INTERVAL);
    }

    // Called when data changes (debounced)
    scheduleSync() {
        if (!this.autoSyncEnabled || !this.isOnline) {
            return;
        }

        // Clear existing debounce timer
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }

        // Schedule sync for 30 seconds from now
        this.syncDebounceTimer = setTimeout(() => {
            this.performAutoSync();
        }, SYNC_DEBOUNCE_DELAY);
    }

    async performAutoSync() {
        if (this.isSyncing || !this.autoSyncEnabled || !this.isOnline) {
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus('info', 'Checking for changes...', 'fa-spinner fa-spin');

        try {
            // Check if we have a valid token
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }

            // Get current garden data
            const gardenData = window.gardenStorage.getData();
            if (!gardenData) {
                throw new Error('No data to sync');
            }

            // Calculate hash of current data (excluding timestamps that change)
            const dataToHash = {
                profile: gardenData.profile,
                dailyLogs: gardenData.dailyLogs,
                weedTracker: gardenData.weedTracker,
                harvestJournal: gardenData.harvestJournal
            };
            const currentDataHash = this.simpleHash(JSON.stringify(dataToHash));

            // Check if data has actually changed since last sync
            if (this.lastSyncedDataHash === currentDataHash) {
                console.log('No changes detected, skipping sync');
                this.updateSyncStatus('success', 'Up to date (no changes)', 'fa-check-circle');
                this.isSyncing = false;
                return;
            }

            this.updateSyncStatus('info', 'Syncing...', 'fa-spinner fa-spin');

            // Check for conflicts
            const hasConflict = await this.checkForConflicts();
            if (hasConflict) {
                this.isSyncing = false;
                return; // User was warned, sync aborted
            }

            // Add export metadata
            const stats = window.gardenStorage.calculateGrowthStats();
            const exportData = {
                ...gardenData,
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    appName: 'Inner Garden Tracker',
                    exportMethod: 'Google Drive Auto-Sync',
                    summary: {
                        totalDailyLogs: Object.keys(gardenData.dailyLogs || {}).length,
                        totalWeedEntries: Object.keys(gardenData.weedTracker || {}).length,
                        currentStreak: stats.streak,
                        daysSinceStart: stats.daysSinceStart,
                        wellnessScore: stats.wellnessScore
                    }
                }
            };

            // Check if backup file exists
            const existingFileId = await this.findBackupFile();

            if (existingFileId) {
                // Update existing file
                await this.updateBackupFile(exportData);
            } else {
                // Create new file
                await this.createBackupFile(exportData);
            }

            // Update hash after successful sync
            this.lastSyncedDataHash = currentDataHash;
            this.lastSyncTime = new Date();
            this.syncRetryCount = 0;

            const timeStr = this.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.updateSyncStatus('success', `Synced at ${timeStr}`, 'fa-check-circle');

        } catch (error) {
            console.error('Auto-sync error:', error);

            // Handle token expiration
            if (error.message.includes('401') || error.message.includes('Not authenticated')) {
                this.updateSyncStatus('warning', 'Authentication expired - Please re-enable auto-sync', 'fa-exclamation-triangle');
                this.disableAutoSync();
                window.showNotification('⚠️ Auto-sync disabled - Please re-enable to re-authenticate', 'warning');
            } else if (this.syncRetryCount < this.maxRetries) {
                // Retry with exponential backoff
                this.syncRetryCount++;
                const retryDelay = Math.pow(2, this.syncRetryCount) * 1000;
                this.updateSyncStatus('warning', `Sync failed, retrying in ${retryDelay / 1000}s...`, 'fa-exclamation-circle');

                setTimeout(() => {
                    this.performAutoSync();
                }, retryDelay);
            } else {
                this.updateSyncStatus('error', 'Sync failed - Check connection', 'fa-times-circle');
                this.syncRetryCount = 0;
            }
        } finally {
            this.isSyncing = false;
        }
    }

    // Simple hash function for detecting data changes
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    async checkForConflicts() {
        try {
            // Get file metadata including modified time
            if (!this.driveFileId) {
                await this.findBackupFile();
            }

            if (!this.driveFileId) {
                return false; // No existing file, no conflict
            }

            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${this.driveFileId}?fields=modifiedTime`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                return false; // Can't check, proceed with sync
            }

            const fileData = await response.json();
            const driveModifiedTime = new Date(fileData.modifiedTime);

            // If we have a last sync time and Drive file is newer, there's a conflict
            if (this.lastSyncTime && driveModifiedTime > this.lastSyncTime) {
                const timeDiff = Math.floor((driveModifiedTime - this.lastSyncTime) / 1000 / 60); // minutes

                const userChoice = confirm(
                    `⚠️ CONFLICT DETECTED\n\n` +
                    `The Google Drive backup was modified ${timeDiff} minute(s) ago, ` +
                    `which is AFTER your last sync.\n\n` +
                    `This might mean:\n` +
                    `• You made changes on another device\n` +
                    `• Someone else modified the file\n\n` +
                    `Click OK to LOAD the Drive version (recommended)\n` +
                    `Click Cancel to OVERWRITE Drive with your local data (may lose changes!)`
                );

                if (userChoice) {
                    // Load from Drive instead
                    this.updateSyncStatus('info', 'Loading newer data from Drive...', 'fa-cloud-download-alt');
                    await this.loadFromGoogleDrive();
                    return true; // Conflict handled by loading
                } else {
                    // User chose to overwrite - proceed with sync
                    this.updateSyncStatus('warning', 'Overwriting Drive data...', 'fa-exclamation-triangle');
                    return false;
                }
            }

            return false; // No conflict

        } catch (error) {
            console.error('Error checking for conflicts:', error);
            return false; // Can't check, proceed with sync
        }
    }

    async manualSync() {
        if (!this.autoSyncEnabled) {
            // Not auto-syncing, just do a one-time save
            await this.saveToGoogleDrive();
        } else {
            // Force an immediate sync
            await this.performAutoSync();
        }
    }

    handleOnline() {
        this.isOnline = true;
        console.log('Network connection restored');

        if (this.autoSyncEnabled) {
            this.updateSyncStatus('info', 'Back online - syncing...', 'fa-wifi');
            // Trigger a sync now that we're back online
            setTimeout(() => this.performAutoSync(), 2000);
        }
    }

    handleOffline() {
        this.isOnline = false;
        console.log('Network connection lost');

        if (this.autoSyncEnabled) {
            this.updateSyncStatus('warning', 'Offline - will sync when connection restored', 'fa-wifi');
        }
    }

    updateSyncStatus(type, message, icon) {
        const statusDiv = document.getElementById('sync-status');
        if (!statusDiv) return;

        const colors = {
            success: { bg: '#e8f5e9', text: '#27ae60' },
            info: { bg: '#e3f2fd', text: '#2196f3' },
            warning: { bg: '#fff3cd', text: '#ff9800' },
            error: { bg: '#ffeaea', text: '#e74c3c' },
            secondary: { bg: '#f8f9fa', text: '#6c757d' }
        };

        const color = colors[type] || colors.info;

        statusDiv.style.background = color.bg;
        statusDiv.style.color = color.text;
        statusDiv.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    }
}

// Create global instance
window.googleDriveSync = new GoogleDriveSync();

// Initialize when Google API loads
window.addEventListener('load', () => {
    // Wait a bit for Google's script to load
    setTimeout(() => {
        if (window.google && window.google.accounts) {
            window.googleDriveSync.init();

            // Restore auto-sync state from localStorage
            const checkbox = document.getElementById('auto-sync-checkbox');
            if (checkbox && window.googleDriveSync.autoSyncEnabled) {
                checkbox.checked = true;
                // Try to resume auto-sync (will ask for re-auth if needed)
                window.googleDriveSync.updateSyncStatus('info', 'Auto-sync enabled - click "Sync Now" to connect', 'fa-info-circle');
            }

            // Restore auto-backup checkbox state
            const backupCheckbox = document.getElementById('auto-backup-checkbox');
            if (backupCheckbox) {
                backupCheckbox.checked = window.googleDriveSync.autoBackupEnabled;
            }
        } else {
            console.warn('Google Identity Services not loaded');
        }
    }, 1000);
});
