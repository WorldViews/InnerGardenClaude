// Google Drive Sync functionality for Inner Garden Tracker

const GOOGLE_CLIENT_ID = '141603479965-u4eap36jnsouqttrr9ah8ermmms9tmm3.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_NAME = 'inner-garden-data.json';
const DRIVE_FOLDER_NAME = 'InnerGarden';

class GoogleDriveSync {
    constructor() {
        this.accessToken = null;
        this.tokenClient = null;
        this.driveFileId = null; // ID of the backup file in Drive
        this.driveFolderId = null; // ID of the InnerGarden folder
        this.isInitialized = false;
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
}

// Create global instance
window.googleDriveSync = new GoogleDriveSync();

// Initialize when Google API loads
window.addEventListener('load', () => {
    // Wait a bit for Google's script to load
    setTimeout(() => {
        if (window.google && window.google.accounts) {
            window.googleDriveSync.init();
        } else {
            console.warn('Google Identity Services not loaded');
        }
    }, 1000);
});
