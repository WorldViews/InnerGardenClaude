// Storage utility for Garden Tracker
class GardenStorage {
    constructor() {
        this.storageKey = 'inner-garden-data';
        this.currentSchemaVersion = 2; // Updated for check-ins feature
        this.initializeStorage();
        this.migrateSchema();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                schemaVersion: this.currentSchemaVersion,
                profile: {
                    gardenStartDate: new Date().toISOString().split('T')[0],
                    name: '',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                dailyLogs: {},
                seasonalPlans: {},
                weedTracker: {},
                valuesGarden: {
                    coreValues: [],
                    gardenAreas: {}
                },
                harvestJournal: {},
                insights: {
                    streaks: {},
                    patterns: {},
                    milestones: []
                }
            };
            this.saveData(initialData);
        }
    }

    migrateSchema() {
        const data = this.getData();
        if (!data) return;

        const currentVersion = data.schemaVersion || 1;

        if (currentVersion < this.currentSchemaVersion) {
            console.log(`🔄 Migrating garden data from schema v${currentVersion} to v${this.currentSchemaVersion}`);

            if (currentVersion === 1) {
                this.migrateToV2(data);
            }

            // Future migrations would go here
            // if (currentVersion < 3) { this.migrateToV3(data); }

            data.schemaVersion = this.currentSchemaVersion;
            this.saveData(data);
            console.log('✅ Schema migration completed successfully!');
        }
    }

    migrateToV2(data) {
        // Convert single mood/weather per day to check-ins array
        console.log('📝 Converting daily logs to support multiple check-ins...');

        Object.entries(data.dailyLogs || {}).forEach(([date, log]) => {
            if (log.moodRating || log.weatherTags) {
                // Create check-in from existing mood/weather data
                const checkin = {
                    id: Date.now() + Math.random() * 1000, // Unique ID
                    timestamp: log.timestamp || new Date(date + 'T12:00:00').toISOString(),
                    moodRating: log.moodRating || null,
                    weatherTags: log.weatherTags || [],
                    comment: log.observations ? `Migrated note: ${log.observations.substring(0, 100)}...` : ''
                };

                // Initialize checkins array and add the migrated check-in
                log.checkins = [checkin];

                // Remove old single mood/weather fields
                delete log.moodRating;
                delete log.weatherTags;
            } else {
                // Ensure checkins array exists even if no mood/weather data
                log.checkins = log.checkins || [];
            }
        });

        console.log('✅ Daily logs migration completed');
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading garden data:', error);
            return null;
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            // Update sync button if available
            if (window.googleDriveSync && window.googleDriveSync.updateSyncButton) {
                window.googleDriveSync.updateSyncButton();
            }
            return true;
        } catch (error) {
            console.error('Error saving garden data:', error);
            return false;
        }
    }

    getSection(sectionName) {
        const data = this.getData();
        return data ? data[sectionName] : null;
    }

    saveSection(sectionName, sectionData) {
        const data = this.getData();
        if (data) {
            data[sectionName] = sectionData;
            data.lastModified = new Date().toISOString();
            return this.saveData(data);
        }
        return false;
    }

    saveDailyLog(date, logData) {
        const dailyLogs = this.getSection('dailyLogs') || {};
        dailyLogs[date] = {
            timestamp: new Date().toISOString(), // Default timestamp
            ...logData // Spread logData after, so it can override timestamp if present
        };
        return this.saveSection('dailyLogs', dailyLogs);
    }

    getDailyLog(date) {
        const dailyLogs = this.getSection('dailyLogs') || {};
        return dailyLogs[date] || null;
    }

    saveWeedEntry(id, weedData) {
        const weedTracker = this.getSection('weedTracker') || {};
        weedTracker[id] = {
            ...weedData,
            timestamp: new Date().toISOString()
        };
        return this.saveSection('weedTracker', weedTracker);
    }

    getAllWeeds() {
        return this.getSection('weedTracker') || {};
    }

    // Check-in Management Methods
    addCheckin(date, checkinData) {
        const dailyLogs = this.getSection('dailyLogs') || {};

        if (!dailyLogs[date]) {
            dailyLogs[date] = {
                date: date,
                timestamp: new Date().toISOString(),
                checkins: [],
                activities: {},
                seeds: [],
                gratitude: [],
                observations: ''
            };
        }

        if (!dailyLogs[date].checkins) {
            dailyLogs[date].checkins = [];
        }

        const checkin = {
            id: Date.now() + Math.random() * 1000,
            timestamp: new Date().toISOString(),
            moodRating: checkinData.moodRating || null,
            weatherTags: checkinData.weatherTags || [],
            comment: checkinData.comment || ''
        };

        dailyLogs[date].checkins.push(checkin);

        // Trigger PeaceTree lighting for new check-in
        if (checkin.moodRating && window.PeaceTreeMQTT) {
            window.PeaceTreeMQTT.setMoodLighting(checkin.moodRating);
        }

        return this.saveSection('dailyLogs', dailyLogs) ? checkin : null;
    }

    updateCheckin(date, checkinId, updates) {
        const dailyLogs = this.getSection('dailyLogs') || {};

        if (!dailyLogs[date] || !dailyLogs[date].checkins) {
            return false;
        }

        const checkinIndex = dailyLogs[date].checkins.findIndex(c => c.id === checkinId);
        if (checkinIndex === -1) {
            return false;
        }

        // Update the check-in
        Object.assign(dailyLogs[date].checkins[checkinIndex], updates);
        dailyLogs[date].checkins[checkinIndex].lastModified = new Date().toISOString();

        // Trigger PeaceTree lighting if mood was updated
        if (updates.moodRating && window.PeaceTreeMQTT) {
            window.PeaceTreeMQTT.setMoodLighting(updates.moodRating);
        }

        return this.saveSection('dailyLogs', dailyLogs);
    }

    deleteCheckin(date, checkinId) {
        const dailyLogs = this.getSection('dailyLogs') || {};

        if (!dailyLogs[date] || !dailyLogs[date].checkins) {
            return false;
        }

        const initialLength = dailyLogs[date].checkins.length;
        dailyLogs[date].checkins = dailyLogs[date].checkins.filter(c => c.id !== checkinId);

        const wasDeleted = dailyLogs[date].checkins.length < initialLength;

        if (wasDeleted) {
            return this.saveSection('dailyLogs', dailyLogs);
        }

        return false;
    }

    getCheckins(date) {
        const dailyLog = this.getDailyLog(date);
        return dailyLog?.checkins || [];
    }

    getLatestMoodForLighting(date) {
        const checkins = this.getCheckins(date);
        if (checkins.length === 0) return null;

        // Find the most recent check-in with a mood rating
        const checkinsWithMood = checkins.filter(c => c.moodRating).sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        return checkinsWithMood.length > 0 ? checkinsWithMood[0].moodRating : null;
    }

    calculateGrowthStats() {
        const data = this.getData();
        const dailyLogs = data?.dailyLogs || {};
        const harvestJournal = data?.harvestJournal || {};

        const logDates = Object.keys(dailyLogs).sort();
        const startDate = data?.profile?.gardenStartDate || logDates[0];
        const daysSinceStart = startDate ? this.daysBetween(startDate, new Date().toISOString().split('T')[0]) + 1 : 1;

        const streak = this.calculateCurrentStreak(dailyLogs);

        const activeSeeds = Object.values(dailyLogs).reduce((count, log) => {
            return count + (log.seeds || []).length;
        }, 0);

        const harvestedGoals = Object.keys(harvestJournal).length;
        const wellnessScore = this.calculateWellnessScore(dailyLogs);

        return {
            daysSinceStart,
            streak,
            activeSeeds: Math.max(activeSeeds, 0),
            harvestedGoals,
            wellnessScore
        };
    }

    calculateCurrentStreak(dailyLogs) {
        const today = new Date().toISOString().split('T')[0];
        const sortedDates = Object.keys(dailyLogs).sort().reverse();

        if (sortedDates.length === 0) return 0;

        let streak = 0;
        let checkDate = today;

        // Check if there's a log for today
        if (dailyLogs[today]) {
            streak = 1;
            checkDate = this.getPreviousDate(today);
        } else {
            // If no log for today, start checking from yesterday
            checkDate = this.getPreviousDate(today);
            // If there's a log for yesterday, start the streak from there
            if (dailyLogs[checkDate]) {
                streak = 1;
                checkDate = this.getPreviousDate(checkDate);
            } else {
                return 0; // No recent activity
            }
        }

        // Continue checking previous days
        for (let date of sortedDates) {
            if (date === checkDate) {
                streak++;
                checkDate = this.getPreviousDate(checkDate);
            } else if (date < checkDate) {
                // We've found a gap in the logs
                break;
            }
        }

        return streak;
    }

    getPreviousDate(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }

    calculateWellnessScore(dailyLogs) {
        const recent = Object.entries(dailyLogs)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 7);

        if (recent.length === 0) return '--';

        let totalMood = 0;
        let moodCount = 0;

        recent.forEach(([, log]) => {
            // Handle both old format (direct moodRating) and new format (checkins)
            if (log.checkins && log.checkins.length > 0) {
                // New format: get average mood from check-ins for this day
                const dayMoods = log.checkins
                    .filter(checkin => checkin.moodRating)
                    .map(checkin => parseInt(checkin.moodRating));

                if (dayMoods.length > 0) {
                    const dayAverage = dayMoods.reduce((sum, mood) => sum + mood, 0) / dayMoods.length;
                    totalMood += dayAverage;
                    moodCount++;
                }
            } else if (log.moodRating) {
                // Old format: direct mood rating
                totalMood += parseInt(log.moodRating);
                moodCount++;
            }
        });

        if (moodCount === 0) return '--';

        return Math.round((totalMood / moodCount) * 10) / 10;
    }

    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    }

    // Values Garden specific methods
    getValuesGarden() {
        return this.getSection('valuesGarden') || {
            coreValues: [],
            gardenAreas: {},
            selectedValues: [],
            currentStep: 1
        };
    }

    saveValuesGarden(valuesData) {
        return this.saveSection('valuesGarden', valuesData);
    }

    getCoreValues() {
        const valuesGarden = this.getValuesGarden();
        return Object.keys(valuesGarden.gardenAreas || {});
    }

    getGardenArea(value) {
        const valuesGarden = this.getValuesGarden();
        return valuesGarden.gardenAreas[value] || null;
    }

    updateGardenArea(value, areaData) {
        const valuesGarden = this.getValuesGarden();
        if (!valuesGarden.gardenAreas) {
            valuesGarden.gardenAreas = {};
        }
        valuesGarden.gardenAreas[value] = { ...valuesGarden.gardenAreas[value], ...areaData };
        return this.saveValuesGarden(valuesGarden);
    }

    isValuesGardenComplete() {
        const valuesGarden = this.getValuesGarden();
        return valuesGarden._completion?.completed || false;
    }

    getValuesGardenCompletionDate() {
        const valuesGarden = this.getValuesGarden();
        return valuesGarden._completion?.timestamp || null;
    }

    // Harvest Journal specific methods
    harvestGoal(harvestEntry) {
        const data = this.getData();
        if (!data.harvestJournal) {
            data.harvestJournal = {};
        }
        data.harvestJournal[harvestEntry.harvestId] = harvestEntry;
        return this.saveData(data);
    }

    removeHarvest(harvestId) {
        const data = this.getData();
        if (!data.harvestJournal || !data.harvestJournal[harvestId]) {
            return false;
        }
        delete data.harvestJournal[harvestId];
        return this.saveData(data);
    }

    getHarvestJournal() {
        return this.getSection('harvestJournal') || {};
    }
}

// Make GardenStorage available globally
window.GardenStorage = GardenStorage;