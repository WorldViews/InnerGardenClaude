// Complete Garden Journal View functionality
const CompleteJournalPage = {
    allEntries: [],
    filteredEntries: [],
    currentFilter: 'all',
    currentSort: 'date-desc',

    init() {
        this.render();
        this.loadAllEntries();
        this.setupEventListeners();
    },

    render() {
        const container = document.getElementById('complete-journal-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-book-open"></i> Complete Garden Journal</h1>
                <p>Your complete personal growth journey in one organized view</p>
            </div>

            <div class="journal-container">
                <!-- Export Section -->
                <div class="export-section" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-file-export"></i> Export Your Journal</h3>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 15px;">
                        <button onclick="CompleteJournalPage.exportToHTML()" 
                                style="background: #27ae60; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-code"></i> Export to HTML
                        </button>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="include-insights" checked>
                            Include insights & analysis
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="include-stats" checked>
                            Include statistics
                        </label>
                    </div>
                </div>

                <!-- Filters and Controls -->
                <div class="journal-controls" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Filter by Type:</label>
                            <select id="entry-filter" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                                <option value="complete-journal">Complete Journal</option>
                                <option value="all">All Entries</option>
                                <option value="daily-logs">Daily Logs</option>
                                <option value="goals">Goals & Seeds</option>
                                <option value="gratitude">Gratitude</option>
                                <option value="wisdom">Wisdom Entries</option>
                                <option value="observations">Observations</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Sort by:</label>
                            <select id="entry-sort" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="type">By Type</option>
                                <option value="content">By Content Length</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Date Range:</label>
                            <input type="date" id="date-from" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">To:</label>
                            <input type="date" id="date-to" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 8px;">
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <button onclick="CompleteJournalPage.applyFilters()" 
                                style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-filter"></i> Apply Filters
                        </button>
                        <button onclick="CompleteJournalPage.clearFilters()" 
                                style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-times"></i> Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div id="journal-summary" class="journal-summary"></div>

                <!-- Entries List -->
                <div id="journal-entries" class="journal-entries"></div>
            </div>
        `;
    },

    setupEventListeners() {
        document.getElementById('entry-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('entry-sort').addEventListener('change', () => this.applyFilters());
    },

    loadAllEntries() {
        if (!window.gardenStorage) return;

        this.allEntries = [];

        // Load daily logs
        const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
        Object.entries(dailyLogs).forEach(([date, log]) => {
            // Create proper fallback timestamp to avoid timezone issues
            const fallbackTimestamp = new Date(date + 'T12:00:00').toISOString();

            // Main daily log entry
            this.allEntries.push({
                id: `daily-${date}`,
                type: 'daily-logs',
                date: date,
                timestamp: log.timestamp || fallbackTimestamp,
                title: `Daily Log - ${new Date(date + 'T12:00:00').toLocaleDateString()}`,
                content: this.formatDailyLogContent(log),
                rawData: log,
                mood: log.moodRating,
                weather: log.weatherTags || []
            });

            // Individual seeds/goals
            if (log.seeds && log.seeds.length > 0) {
                log.seeds.forEach((seed, index) => {
                    this.allEntries.push({
                        id: `seed-${date}-${index}`,
                        type: 'goals',
                        date: date,
                        timestamp: seed.timestamp || log.timestamp || fallbackTimestamp,
                        title: `Goal/Intention`,
                        content: seed.text,
                        rawData: seed,
                        parentLog: date
                    });
                });
            }

            // Individual gratitude entries
            if (log.gratitude && log.gratitude.length > 0) {
                log.gratitude.forEach((gratitude, index) => {
                    this.allEntries.push({
                        id: `gratitude-${date}-${index}`,
                        type: 'gratitude',
                        date: date,
                        timestamp: gratitude.timestamp || log.timestamp || fallbackTimestamp,
                        title: `Gratitude`,
                        content: gratitude.text,
                        rawData: gratitude,
                        parentLog: date
                    });
                });
            }

            // Observations
            if (log.observations && log.observations.trim()) {
                this.allEntries.push({
                    id: `observation-${date}`,
                    type: 'observations',
                    date: date,
                    timestamp: log.timestamp || fallbackTimestamp,
                    title: `Growth Observations`,
                    content: log.observations,
                    rawData: { observations: log.observations },
                    parentLog: date
                });
            }
        });

        // Load wisdom entries
        const weedTracker = window.gardenStorage.getSection('weedTracker') || {};
        Object.values(weedTracker).forEach((weed) => {
            this.allEntries.push({
                id: `wisdom-${weed.id}`,
                type: 'wisdom',
                date: weed.date,
                timestamp: weed.timestamp,
                title: `Wisdom Transformation`,
                content: this.formatWisdomContent(weed),
                rawData: weed,
                improvement: (weed.beliefIntensity - weed.newBeliefIntensity) + (weed.emotionIntensity - weed.newEmotionIntensity)
            });
        });

        this.filteredEntries = [...this.allEntries];

        // Set default filter to "complete-journal"
        document.getElementById('entry-filter').value = 'complete-journal';
        this.currentFilter = 'complete-journal';

        this.applyFilters();
    },

    formatDailyLogContent(log) {
        let content = [];

        // Check-ins (new format)
        if (log.checkins && log.checkins.length > 0) {
            content.push(`Check-ins (${log.checkins.length}):`);
            log.checkins.forEach((checkin, index) => {
                const time = new Date(checkin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let checkinLine = `  ${time}:`;

                if (checkin.moodRating) {
                    checkinLine += ` Mood ${checkin.moodRating}/10`;
                }

                if (checkin.weatherTags && checkin.weatherTags.length > 0) {
                    const weatherEmojis = checkin.weatherTags.map(w => this.getWeatherEmoji(w));
                    checkinLine += ` ${weatherEmojis.join(' ')}`;
                }

                if (checkin.comment) {
                    checkinLine += ` - "${checkin.comment}"`;
                }

                content.push(checkinLine);
            });
        }
        // Legacy single mood/weather (old format)
        else {
            if (log.moodRating) {
                content.push(`Mood: ${log.moodRating}/10`);
            }

            if (log.weatherTags && log.weatherTags.length > 0) {
                content.push(`Inner Weather: ${log.weatherTags.join(', ')}`);
            }
        }

        if (log.activities) {
            const completedActivities = Object.entries(log.activities)
                .filter(([, data]) => data.completed)
                .map(([activity, data]) => `${activity}${data.duration ? ` (${data.duration}min)` : ''}`);
            if (completedActivities.length > 0) {
                content.push(`Activities: ${completedActivities.join(', ')}`);
            }
        }

        if (log.seeds && log.seeds.length > 0) {
            content.push(`Seeds planted: ${log.seeds.length}`);
        }

        if (log.gratitude && log.gratitude.length > 0) {
            content.push(`Gratitude entries: ${log.gratitude.length}`);
        }

        if (log.observations) {
            content.push(`Observations: ${log.observations}`);
        }

        return content.join('\n');
    },

    getWeatherEmoji(weather) {
        const emojis = {
            sunny: '☀️', cloudy: '☁️', stormy: '⛈️',
            foggy: '🌫️', windy: '💨', calm: '🌅'
        };
        return emojis[weather] || '🌤️';
    },

    formatWisdomContent(weed) {
        if (!weed) return 'Invalid wisdom entry';

        return `Situation: ${weed.situation || 'Not specified'}

Original Thought: "${weed.originalThought || 'Not recorded'}"
Belief Intensity: ${weed.beliefIntensity || 0}%

Balanced Thought: "${weed.balancedThought || 'Not recorded'}"
New Belief Intensity: ${weed.newBeliefIntensity || 0}%

Emotions: ${(weed.emotions && weed.emotions.length > 0) ? weed.emotions.join(', ') : 'Not specified'}
Emotional Intensity: ${weed.emotionIntensity || 0} → ${weed.newEmotionIntensity || 0}

${weed.actionPlan ? `Action Plan: ${weed.actionPlan}` : ''}`;
    },

    applyFilters() {
        const filter = document.getElementById('entry-filter').value;
        const sort = document.getElementById('entry-sort').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        this.currentFilter = filter;
        this.currentSort = sort;

        // Filter by type
        this.filteredEntries = this.allEntries.filter(entry => {
            if (filter !== 'all' && filter !== 'complete-journal' && entry.type !== filter) return false;

            // Date range filter
            if (dateFrom && entry.date < dateFrom) return false;
            if (dateTo && entry.date > dateTo) return false;

            return true;
        });

        // Sort entries
        this.filteredEntries.sort((a, b) => {
            switch (sort) {
                case 'date-desc':
                    return new Date(b.timestamp) - new Date(a.timestamp);
                case 'date-asc':
                    return new Date(a.timestamp) - new Date(b.timestamp);
                case 'type':
                    return a.type.localeCompare(b.type) || new Date(b.timestamp) - new Date(a.timestamp);
                case 'content':
                    return b.content.length - a.content.length;
                default:
                    return 0;
            }
        });

        this.renderSummary();

        // Use special rendering for complete journal view
        if (filter === 'complete-journal') {
            this.renderCompleteJournal();
        } else {
            this.renderEntries();
        }
    },

    clearFilters() {
        document.getElementById('entry-filter').value = 'complete-journal';
        document.getElementById('entry-sort').value = 'date-desc';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        this.applyFilters();
    },

    renderSummary() {
        const total = this.filteredEntries.length;
        const byType = {};
        let totalWords = 0;

        this.filteredEntries.forEach(entry => {
            byType[entry.type] = (byType[entry.type] || 0) + 1;
            totalWords += entry.content.split(/\s+/).length;
        });

        const typeLabels = {
            'daily-logs': 'Daily Logs',
            'goals': 'Goals & Seeds',
            'gratitude': 'Gratitude',
            'wisdom': 'Wisdom Entries',
            'observations': 'Observations'
        };

        const summaryHtml = `
            <div class="journal-summary" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-chart-bar"></i> Journal Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${total}</div>
                        <div style="color: #7f8c8d;">Total Entries</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${totalWords.toLocaleString()}</div>
                        <div style="color: #7f8c8d;">Total Words</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #e74c3c;">${Object.keys(byType).length}</div>
                        <div style="color: #7f8c8d;">Entry Types</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                    ${Object.entries(byType).map(([type, count]) => `
                        <div style="text-align: center; padding: 10px; background: #ecf0f1; border-radius: 8px;">
                            <div style="font-weight: bold; color: #2c3e50;">${count}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d;">${typeLabels[type] || type}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('journal-summary').innerHTML = summaryHtml;
    },

    renderCompleteJournal() {
        // Group entries by date and get only days that have daily log entries
        const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
        const sort = document.getElementById('entry-sort').value;

        // Sort dates based on user selection
        let datesWithLogs = Object.keys(dailyLogs);
        if (sort === 'date-asc') {
            datesWithLogs.sort((a, b) => a.localeCompare(b)); // Ascending order (oldest first)
        } else {
            datesWithLogs.sort((a, b) => b.localeCompare(a)); // Descending order (newest first) - default
        }

        // Apply date range filter to the dates
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        const filteredDates = datesWithLogs.filter(date => {
            if (dateFrom && date < dateFrom) return false;
            if (dateTo && date > dateTo) return false;
            return true;
        }); let journalHtml = '';

        if (filteredDates.length === 0) {
            journalHtml = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No daily log entries found in the selected date range.</p>';
        } else {
            filteredDates.forEach(date => {
                const dayEntries = this.getEntriesForDate(date);
                if (dayEntries.length > 0) {
                    journalHtml += this.renderDaySection(date, dayEntries);
                }
            });
        }

        document.getElementById('journal-entries').innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #2c3e50; margin-bottom: 20px;">
                    <i class="fas fa-calendar-alt"></i> Complete Journal by Day
                    <span style="font-size: 0.8rem; color: #7f8c8d;">(${filteredDates.length} days)</span>
                </h3>
                ${journalHtml}
            </div>
        `;
    },

    getEntriesForDate(date) {
        // Get all entries for a specific date and sort by timestamp
        const dayEntries = this.allEntries.filter(entry => entry.date === date);

        // Sort by timestamp within the day
        dayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return dayEntries;
    },

    renderDaySection(date, dayEntries) {
        const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Group entries by type
        const entriesByType = {
            'checkins': [],
            'goals': [],
            'gratitude': [],
            'observations': [],
            'wisdom': [],
            'activities': []
        };

        // Get the daily log for this date to extract check-ins and activities
        const dailyLog = window.gardenStorage.getDailyLog(date);

        dayEntries.forEach(entry => {
            switch (entry.type) {
                case 'goals':
                    entriesByType.goals.push(entry);
                    break;
                case 'gratitude':
                    entriesByType.gratitude.push(entry);
                    break;
                case 'observations':
                    entriesByType.observations.push(entry);
                    break;
                case 'wisdom':
                    entriesByType.wisdom.push(entry);
                    break;
            }
        });

        // Extract check-ins from daily log
        if (dailyLog && dailyLog.checkins && dailyLog.checkins.length > 0) {
            entriesByType.checkins = dailyLog.checkins.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
        }

        // Extract activities from daily log
        // Show activities where either completed checkbox is checked OR minutes are entered
        if (dailyLog && dailyLog.activities) {
            const completedActivities = Object.entries(dailyLog.activities)
                .filter(([, data]) => data && (data.completed || (data.duration && data.duration > 0)))
                .map(([activity, data]) => ({
                    name: activity,
                    duration: data.duration || 0,
                    timestamp: dailyLog.timestamp
                }));
            if (completedActivities.length > 0) {
                entriesByType.activities = completedActivities;
            }
        }

        let dayHtml = `
            <div style="margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px;">
                    <h4 style="margin: 0; font-size: 1.2rem;">📅 ${formattedDate}</h4>
                </div>
                <div style="padding: 20px;">
        `;

        // Render each type section only if there are entries
        dayHtml += this.renderTypeSection('Check-ins', '💭', entriesByType.checkins, 'checkin');
        dayHtml += this.renderTypeSection('Goals & Seeds', '🌱', entriesByType.goals, 'goal');
        dayHtml += this.renderTypeSection('Activities', '💪', entriesByType.activities, 'activity');
        dayHtml += this.renderTypeSection('Gratitude', '🌸', entriesByType.gratitude, 'gratitude');
        dayHtml += this.renderTypeSection('Observations', '👁️', entriesByType.observations, 'observation');
        dayHtml += this.renderTypeSection('Wisdom Entries', '🧠', entriesByType.wisdom, 'wisdom');

        dayHtml += '</div></div>';

        return dayHtml;
    },

    renderTypeSection(title, icon, entries, type) {
        if (!entries || entries.length === 0) {
            return ''; // Don't show section if no entries
        }

        let sectionHtml = `
            <div style="margin-bottom: 20px;">
                <h5 style="color: #2c3e50; margin-bottom: 10px; font-size: 1rem; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px;">
                    ${icon} ${title} (${entries.length})
                </h5>
                <div style="margin-left: 15px;">
        `;

        entries.forEach(entry => {
            sectionHtml += this.renderTypeEntry(entry, type);
        });

        sectionHtml += '</div></div>';
        return sectionHtml;
    },

    renderTypeEntry(entry, type) {
        const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        switch (type) {
            case 'checkin':
                let checkinText = '';
                if (entry.moodRating) {
                    checkinText += `Mood: ${entry.moodRating}/10`;
                }
                if (entry.weatherTags && entry.weatherTags.length > 0) {
                    const weatherEmojis = entry.weatherTags.map(w => this.getWeatherEmoji(w));
                    checkinText += `${checkinText ? ' | ' : ''}Weather: ${weatherEmojis.join(' ')}`;
                }
                if (entry.comment) {
                    checkinText += `${checkinText ? ' | ' : ''}Note: "${entry.comment}"`;
                }
                return `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db;">
                        <span style="font-weight: bold; color: #666;">${time}</span> - ${checkinText}
                    </div>
                `;

            case 'goal':
                return `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #27ae60;">
                        <span style="font-weight: bold; color: #666;">${time}</span> - ${entry.content}
                    </div>
                `;

            case 'activity':
                const durationText = entry.duration ? ` (${entry.duration} min)` : '';
                return `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #f39c12;">
                        ${this.getActivityEmoji(entry.name)} ${this.formatActivityName(entry.name)}${durationText}
                    </div>
                `;

            case 'gratitude':
                return `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #e74c3c;">
                        <span style="font-weight: bold; color: #666;">${time}</span> - ${entry.content}
                    </div>
                `;

            case 'observation':
                return `
                    <div style="margin-bottom: 8px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #f39c12;">
                        <div style="white-space: pre-wrap; line-height: 1.5;">${entry.content}</div>
                    </div>
                `;

            case 'wisdom':
                return `
                    <div style="margin-bottom: 8px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #9b59b6;">
                        <div style="font-weight: bold; color: #9b59b6; margin-bottom: 5px;">Wisdom Transformation</div>
                        <div style="white-space: pre-wrap; line-height: 1.5; font-size: 0.9rem;">${entry.content}</div>
                    </div>
                `;

            default:
                return '';
        }
    },

    getActivityEmoji(activity) {
        const emojis = {
            meditation: '🧘',
            exercise: '🏃',
            journaling: '📝',
            reading: '📚',
            creativity: '🎨',
            social: '👥'
        };
        return emojis[activity] || '✓';
    },

    formatActivityName(activity) {
        const names = {
            meditation: 'Meditation/Mindfulness',
            exercise: 'Physical Exercise',
            journaling: 'Journaling',
            reading: 'Learning/Reading',
            creativity: 'Creative Expression',
            social: 'Social Connection'
        };
        return names[activity] || activity.charAt(0).toUpperCase() + activity.slice(1);
    },

    renderEntries() {
        const entriesHtml = this.filteredEntries.map(entry => this.renderEntry(entry)).join('');

        document.getElementById('journal-entries').innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                <h3 style="color: #2c3e50; margin-bottom: 20px;">
                    <i class="fas fa-list"></i> Journal Entries 
                    <span style="font-size: 0.8rem; color: #7f8c8d;">(${this.filteredEntries.length} entries)</span>
                </h3>
                ${entriesHtml || '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No entries found matching your filters.</p>'}
            </div>
        `;
    },

    renderEntry(entry) {
        const typeIcons = {
            'daily-logs': 'calendar-day',
            'goals': 'seedling',
            'gratitude': 'heart',
            'wisdom': 'brain',
            'observations': 'eye'
        };

        const typeColors = {
            'daily-logs': '#3498db',
            'goals': '#27ae60',
            'gratitude': '#e74c3c',
            'wisdom': '#9b59b6',
            'observations': '#f39c12'
        };

        const date = new Date(entry.timestamp).toLocaleDateString();
        const time = new Date(entry.timestamp).toLocaleTimeString();

        return `
            <div style="border-left: 4px solid ${typeColors[entry.type]}; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 0 8px 8px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-${typeIcons[entry.type]}" style="color: ${typeColors[entry.type]};"></i>
                        <h4 style="margin: 0; color: #2c3e50;">${entry.title}</h4>
                    </div>
                    <div style="text-align: right; font-size: 0.8rem; color: #7f8c8d;">
                        <div>${date}</div>
                        <div>${time}</div>
                    </div>
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                    ${entry.content}
                </div>
                ${entry.mood ? `<div style="margin-top: 10px; font-size: 0.9rem; color: #7f8c8d;">Mood: ${entry.mood}/10</div>` : ''}
                ${entry.improvement ? `<div style="margin-top: 5px; font-size: 0.9rem; color: #7f8c8d;">Growth Score: ${entry.improvement.toFixed(1)}</div>` : ''}
            </div>
        `;
    },

    exportToHTML() {
        const htmlContent = this.generateHTMLContent();
        this.downloadFile(htmlContent, `inner-garden-journal-${new Date().toISOString().split('T')[0]}.html`, 'text/html');
        window.showNotification('🌐 HTML journal exported successfully!');
    },

    generateHTMLContent() {
        const includeStats = document.getElementById('include-stats').checked;
        const filter = document.getElementById('entry-filter').value;

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inner Garden Journal</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
            background: #f8f9fa;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .stats { 
            background: white; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 15px; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .day-section { 
            margin-bottom: 30px; 
            border: 1px solid #e0e0e0; 
            border-radius: 12px; 
            overflow: hidden;
            background: white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .day-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px; 
            font-size: 1.2rem; 
            font-weight: bold;
        }
        .day-content { 
            padding: 20px; 
        }
        .type-section { 
            margin-bottom: 20px; 
        }
        .type-title { 
            color: #2c3e50; 
            margin-bottom: 10px; 
            font-size: 1rem; 
            border-bottom: 2px solid #ecf0f1; 
            padding-bottom: 5px; 
            font-weight: bold;
        }
        .type-entries { 
            margin-left: 15px; 
        }
        .type-entry { 
            margin-bottom: 8px; 
            padding: 8px; 
            background: #f8f9fa; 
            border-radius: 6px; 
        }
        .checkin-entry { border-left: 3px solid #3498db; }
        .goal-entry { border-left: 3px solid #27ae60; }
        .activity-entry { border-left: 3px solid #f39c12; }
        .gratitude-entry { border-left: 3px solid #e74c3c; }
        .observation-entry { border-left: 3px solid #f39c12; padding: 12px; }
        .wisdom-entry { border-left: 3px solid #9b59b6; padding: 12px; }
        .entry-time { font-weight: bold; color: #666; }
        .observation-content, .wisdom-content { white-space: pre-wrap; line-height: 1.5; }
        .wisdom-title { font-weight: bold; color: #9b59b6; margin-bottom: 5px; }
    </style>
</head>
<body>`;

        html += `<div class="header">
            <h1>🌱 Inner Garden Journal</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p><em>${filter === 'complete-journal' ? 'Complete Journal by Day' : 'Filtered Entries'}</em></p>
        </div>`;

        if (includeStats) {
            let totalWords = 0;
            if (filter === 'complete-journal') {
                // Calculate words from complete journal format
                const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
                Object.values(dailyLogs).forEach(log => {
                    if (log.observations) totalWords += log.observations.split(/\s+/).length;
                    if (log.checkins) {
                        log.checkins.forEach(checkin => {
                            if (checkin.comment) totalWords += checkin.comment.split(/\s+/).length;
                        });
                    }
                    if (log.seeds) {
                        log.seeds.forEach(seed => totalWords += seed.text.split(/\s+/).length);
                    }
                    if (log.gratitude) {
                        log.gratitude.forEach(g => totalWords += g.text.split(/\s+/).length);
                    }
                });

                // Add wisdom entries word count
                const weedTracker = window.gardenStorage.getSection('weedTracker') || {};
                Object.values(weedTracker).forEach(weed => {
                    const wisdomContent = this.formatWisdomContent(weed);
                    totalWords += wisdomContent.split(/\s+/).length;
                });
            } else {
                totalWords = this.filteredEntries.reduce((sum, entry) => sum + entry.content.split(/\s+/).length, 0);
            }

            html += `<div class="stats">
                <h3>Summary Statistics</h3>`;

            if (filter === 'complete-journal') {
                const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
                const datesWithLogs = Object.keys(dailyLogs).length;
                html += `<p><strong>Days with Entries:</strong> ${datesWithLogs}</p>`;
            } else {
                html += `<p><strong>Total Entries:</strong> ${this.filteredEntries.length}</p>`;
            }

            html += `<p><strong>Total Words:</strong> ${totalWords.toLocaleString()}</p>
            </div>`;
        }

        // Generate content based on filter type
        if (filter === 'complete-journal') {
            html += this.generateCompleteJournalHTML();
        } else {
            html += this.generateFilteredEntriesHTML();
        }

        html += '</body></html>';
        return html;
    },

    generateCompleteJournalHTML() {
        const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
        const sort = document.getElementById('entry-sort').value;

        let datesWithLogs = Object.keys(dailyLogs);
        if (sort === 'date-asc') {
            datesWithLogs.sort((a, b) => a.localeCompare(b));
        } else {
            datesWithLogs.sort((a, b) => b.localeCompare(a));
        }

        // Apply date range filter
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const filteredDates = datesWithLogs.filter(date => {
            if (dateFrom && date < dateFrom) return false;
            if (dateTo && date > dateTo) return false;
            return true;
        });

        let html = '';

        filteredDates.forEach(date => {
            const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            html += `<div class="day-section">
                <div class="day-header">📅 ${formattedDate}</div>
                <div class="day-content">`;

            const dailyLog = window.gardenStorage.getDailyLog(date);

            // Check-ins
            if (dailyLog && dailyLog.checkins && dailyLog.checkins.length > 0) {
                html += `<div class="type-section">
                    <div class="type-title">💭 Check-ins (${dailyLog.checkins.length})</div>
                    <div class="type-entries">`;

                dailyLog.checkins.forEach(checkin => {
                    const time = new Date(checkin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    let checkinText = '';
                    if (checkin.moodRating) checkinText += `Mood: ${checkin.moodRating}/10`;
                    if (checkin.weatherTags && checkin.weatherTags.length > 0) {
                        const weatherEmojis = checkin.weatherTags.map(w => this.getWeatherEmoji(w));
                        checkinText += `${checkinText ? ' | ' : ''}Weather: ${weatherEmojis.join(' ')}`;
                    }
                    if (checkin.comment) checkinText += `${checkinText ? ' | ' : ''}Note: "${this.escapeHTML(checkin.comment)}"`;

                    html += `<div class="type-entry checkin-entry">
                        <span class="entry-time">${time}</span> - ${checkinText}
                    </div>`;
                });

                html += '</div></div>';
            }

            // Goals & Seeds
            if (dailyLog && dailyLog.seeds && dailyLog.seeds.length > 0) {
                html += `<div class="type-section">
                    <div class="type-title">🌱 Goals & Seeds (${dailyLog.seeds.length})</div>
                    <div class="type-entries">`;

                dailyLog.seeds.forEach(seed => {
                    const time = new Date(seed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    html += `<div class="type-entry goal-entry">
                        <span class="entry-time">${time}</span> - ${this.escapeHTML(seed.text)}
                    </div>`;
                });

                html += '</div></div>';
            }

            // Activities
            // Show activities where either completed checkbox is checked OR minutes are entered
            if (dailyLog && dailyLog.activities) {
                const completedActivities = Object.entries(dailyLog.activities)
                    .filter(([, data]) => data && (data.completed || (data.duration && data.duration > 0)));

                if (completedActivities.length > 0) {
                    html += `<div class="type-section">
                        <div class="type-title">💪 Activities (${completedActivities.length})</div>
                        <div class="type-entries">`;

                    completedActivities.forEach(([activity, data]) => {
                        const emoji = this.getActivityEmoji(activity);
                        const name = this.formatActivityName(activity);
                        const durationText = data.duration ? ` (${data.duration} min)` : '';

                        html += `<div class="type-entry activity-entry">
                            ${emoji} ${name}${durationText}
                        </div>`;
                    });

                    html += '</div></div>';
                }
            }

            // Gratitude
            if (dailyLog && dailyLog.gratitude && dailyLog.gratitude.length > 0) {
                html += `<div class="type-section">
                    <div class="type-title">🌸 Gratitude (${dailyLog.gratitude.length})</div>
                    <div class="type-entries">`;

                dailyLog.gratitude.forEach(gratitude => {
                    const time = new Date(gratitude.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    html += `<div class="type-entry gratitude-entry">
                        <span class="entry-time">${time}</span> - ${this.escapeHTML(gratitude.text)}
                    </div>`;
                });

                html += '</div></div>';
            }

            // Observations
            if (dailyLog && dailyLog.observations && dailyLog.observations.trim()) {
                html += `<div class="type-section">
                    <div class="type-title">👁️ Observations</div>
                    <div class="type-entries">
                        <div class="type-entry observation-entry">
                            <div class="observation-content">${this.escapeHTML(dailyLog.observations)}</div>
                        </div>
                    </div>
                </div>`;
            }

            // Wisdom entries for this date
            const wisdomEntries = this.getWisdomEntriesForDate(date);
            if (wisdomEntries.length > 0) {
                html += `<div class="type-section">
                    <div class="type-title">🧠 Wisdom Entries (${wisdomEntries.length})</div>
                    <div class="type-entries">`;

                wisdomEntries.forEach(wisdom => {
                    const time = new Date(wisdom.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const wisdomContent = this.formatWisdomContent(wisdom);
                    html += `<div class="type-entry wisdom-entry">
                        <div class="wisdom-title">${time} - Wisdom Transformation</div>
                        <div class="wisdom-content">${this.escapeHTML(wisdomContent)}</div>
                    </div>`;
                });

                html += '</div></div>';
            }

            html += '</div></div>';
        });

        return html;
    },

    getWisdomEntriesForDate(date) {
        const weedTracker = window.gardenStorage.getSection('weedTracker') || {};
        return Object.values(weedTracker)
            .filter(weed => weed && weed.date === date)
            .map(weed => ({
                ...weed,
                timestamp: weed.timestamp || new Date(date + 'T12:00:00').toISOString()
            }));
    },

    generateFilteredEntriesHTML() {
        let html = '';

        this.filteredEntries.forEach(entry => {
            const typeColors = {
                'daily-logs': '#3498db',
                'goals': '#27ae60',
                'gratitude': '#e74c3c',
                'wisdom': '#9b59b6',
                'observations': '#f39c12'
            };

            html += `<div class="day-section">
                <div class="day-content">
                    <div style="border-left: 4px solid ${typeColors[entry.type]}; padding: 15px; background: #f8f9fa; border-radius: 0 8px 8px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: #2c3e50;">${this.escapeHTML(entry.title)}</h4>
                            <div style="text-align: right; font-size: 0.8rem; color: #7f8c8d;">
                                <div>${new Date(entry.timestamp).toLocaleDateString()}</div>
                                <div>${new Date(entry.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                            ${this.escapeHTML(entry.content)}
                        </div>
                        ${entry.mood ? `<div style="margin-top: 10px; font-size: 0.9rem; color: #7f8c8d;">Mood: ${entry.mood}/10</div>` : ''}
                        ${entry.improvement ? `<div style="margin-top: 5px; font-size: 0.9rem; color: #7f8c8d;">Growth Score: ${entry.improvement.toFixed(1)}</div>` : ''}
                    </div>
                </div>
            </div>`;
        });

        return html;
    },

    getWeatherEmoji(weather) {
        const emojis = {
            sunny: '☀️', cloudy: '☁️', stormy: '⛈️',
            foggy: '🌫️', windy: '💨', calm: '🌅'
        };
        return emojis[weather] || '🌤️';
    },

    getActivityEmoji(activity) {
        const emojis = {
            meditation: '🧘',
            exercise: '🏃',
            journaling: '📝',
            reading: '📚',
            creativity: '🎨',
            social: '👥'
        };
        return emojis[activity] || '✓';
    },

    formatActivityName(activity) {
        const names = {
            meditation: 'Meditation/Mindfulness',
            exercise: 'Physical Exercise',
            journaling: 'Journaling',
            reading: 'Learning/Reading',
            creativity: 'Creative Expression',
            social: 'Social Connection'
        };
        return names[activity] || activity.charAt(0).toUpperCase() + activity.slice(1);
    },

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};

// Make CompleteJournalPage available globally
window.CompleteJournalPage = CompleteJournalPage;