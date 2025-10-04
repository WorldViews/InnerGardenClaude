// Storage utility for Garden Tracker
class GardenStorage {
    constructor() {
        this.storageKey = 'inner-garden-data';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
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
            ...logData,
            timestamp: new Date().toISOString()
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

        let streak = 0;
        let currentDate = today;

        for (let date of sortedDates) {
            if (date === currentDate) {
                streak++;
                const prevDate = new Date(currentDate);
                prevDate.setDate(prevDate.getDate() - 1);
                currentDate = prevDate.toISOString().split('T')[0];
            } else {
                break;
            }
        }

        return streak;
    }

    calculateWellnessScore(dailyLogs) {
        const recent = Object.entries(dailyLogs)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 7);

        if (recent.length === 0) return '--';

        const totalMood = recent.reduce((sum, [, log]) => {
            const moodRating = parseInt(log.moodRating) || 5;
            return sum + moodRating;
        }, 0);

        return Math.round((totalMood / recent.length) * 10) / 10;
    }

    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    }
}

// Make GardenStorage available globally
window.GardenStorage = GardenStorage;