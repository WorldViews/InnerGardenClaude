// Daily Log Page functionality
const DailyLogPage = {
    currentDate: new Date().toISOString().split('T')[0],

    init() {
        this.render();
        this.setupEventListeners();
        this.fixExistingTimestamps();
        this.loadTodaysLog();
    },

    fixExistingTimestamps() {
        // One-time fix for existing data with incorrect timestamps
        if (!window.gardenStorage) return;

        const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
        let fixedAny = false;

        Object.entries(dailyLogs).forEach(([date, log]) => {
            const correctTimestamp = new Date(date + 'T12:00:00').toISOString();
            let needsUpdate = false;

            // Fix main log timestamp if it doesn't match the date
            if (!log.timestamp || !this.isTimestampCorrectForDate(log.timestamp, date)) {
                log.timestamp = correctTimestamp;
                needsUpdate = true;
            }

            // Fix seeds timestamps
            if (log.seeds) {
                log.seeds.forEach(seed => {
                    if (!seed.timestamp || !this.isTimestampCorrectForDate(seed.timestamp, date)) {
                        seed.timestamp = correctTimestamp;
                        needsUpdate = true;
                    }
                });
            }

            // Fix gratitude timestamps
            if (log.gratitude) {
                log.gratitude.forEach(gratitude => {
                    if (!gratitude.timestamp || !this.isTimestampCorrectForDate(gratitude.timestamp, date)) {
                        gratitude.timestamp = correctTimestamp;
                        needsUpdate = true;
                    }
                });
            }

            if (needsUpdate) {
                window.gardenStorage.saveDailyLog(date, log);
                fixedAny = true;
            }
        });

        if (fixedAny) {
            window.showNotification('🔧 Fixed timestamps for existing journal entries to ensure proper chronological order!');
        }
    },

    isTimestampCorrectForDate(timestamp, date) {
        // Check if timestamp is from the same date (allowing for any time on that date)
        const timestampDate = new Date(timestamp).toISOString().split('T')[0];
        return timestampDate === date;
    },

    render() {
        const container = document.getElementById('daily-log-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-calendar-day"></i> Daily Garden Log</h1>
                <p>Record your daily tending activities and observations</p>
            </div>

            <div class="log-container">
                <div class="date-navigator">
                    <button onclick="DailyLogPage.changeDate(-1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div style="text-align: center;">
                        <input type="date" id="log-date" value="${this.currentDate}">
                        <div id="day-of-week" style="font-size: 0.9rem; color: #7f8c8d; margin-top: 5px;">
                            ${this.getDayOfWeek(this.currentDate)}
                        </div>
                    </div>
                    <button onclick="DailyLogPage.changeDate(1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div class="log-sections">
                    <div class="log-section">
                        <h3><i class="fas fa-sun"></i> Today's Inner Weather</h3>
                        <div class="mood-rating">
                            <label>How are you feeling today?</label>
                            <div class="mood-scale">
                                ${Array.from({ length: 10 }, (_, i) => `
                                    <button class="mood-btn" data-mood="${i + 1}" title="${this.getMoodLabel(i + 1)}">
                                        ${i + 1}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="weather-tags">
                            <label>Inner weather patterns:</label>
                            <div class="tag-group">
                                <span class="weather-tag" data-weather="sunny">☀️ Sunny</span>
                                <span class="weather-tag" data-weather="cloudy">☁️ Cloudy</span>
                                <span class="weather-tag" data-weather="stormy">⛈️ Stormy</span>
                                <span class="weather-tag" data-weather="foggy">🌫️ Foggy</span>
                                <span class="weather-tag" data-weather="windy">💨 Windy</span>
                                <span class="weather-tag" data-weather="calm">🌅 Calm</span>
                            </div>
                        </div>
                    </div>

                    <div class="log-section">
                        <h3><i class="fas fa-seedling"></i> Seeds Planted Today</h3>
                        <div class="seeds-container">
                            <div class="seed-input-group">
                                <input type="text" id="new-seed" placeholder="What intention or goal are you planting today?" class="quick-entry-input">
                                <button onclick="DailyLogPage.addSeed()">
                                    <i class="fas fa-plus"></i> Plant Seed
                                </button>
                            </div>
                            <div id="seeds-list" class="seeds-list"></div>
                        </div>
                    </div>

                    <div class="log-section">
                        <h3><i class="fas fa-tint"></i> Watering Activities</h3>
                        <div class="activities-grid">
                            <div class="activity-item">
                                <input type="checkbox" id="meditation" data-activity="meditation">
                                <label for="meditation">🧘 Meditation/Mindfulness</label>
                                <input type="number" id="meditation-duration" placeholder="min" min="0" max="1440">
                            </div>
                            <div class="activity-item">
                                <input type="checkbox" id="exercise" data-activity="exercise">
                                <label for="exercise">🏃 Physical Exercise</label>
                                <input type="number" id="exercise-duration" placeholder="min" min="0" max="1440">
                            </div>
                            <div class="activity-item">
                                <input type="checkbox" id="journaling" data-activity="journaling">
                                <label for="journaling">📝 Journaling</label>
                                <input type="number" id="journaling-duration" placeholder="min" min="0" max="1440">
                            </div>
                            <div class="activity-item">
                                <input type="checkbox" id="reading" data-activity="reading">
                                <label for="reading">📚 Learning/Reading</label>
                                <input type="number" id="reading-duration" placeholder="min" min="0" max="1440">
                            </div>
                            <div class="activity-item">
                                <input type="checkbox" id="creativity" data-activity="creativity">
                                <label for="creativity">🎨 Creative Expression</label>
                                <input type="number" id="creativity-duration" placeholder="min" min="0" max="1440">
                            </div>
                            <div class="activity-item">
                                <input type="checkbox" id="social" data-activity="social">
                                <label for="social">👥 Social Connection</label>
                                <input type="number" id="social-duration" placeholder="min" min="0" max="1440">
                            </div>
                        </div>
                    </div>

                    <div class="log-section">
                        <h3><i class="fas fa-eye"></i> Growth Observations</h3>
                        <textarea id="observations" placeholder="What did you notice about your growth today? Any insights, challenges, or moments of awareness?"></textarea>
                    </div>

                    <div class="log-section">
                        <h3><i class="fas fa-heart"></i> Gratitude Flowers</h3>
                        <div class="gratitude-container">
                            <div class="gratitude-input-group">
                                <input type="text" id="new-gratitude" placeholder="What are you grateful for today?">
                                <button onclick="DailyLogPage.addGratitude()">
                                    <i class="fas fa-plus"></i> Add Flower
                                </button>
                            </div>
                            <div id="gratitude-list" class="gratitude-list"></div>
                        </div>
                    </div>
                </div>

                <div class="log-actions">
                    <button class="save-btn" onclick="DailyLogPage.saveLog()">
                        <i class="fas fa-save"></i> Save Log for <span id="save-date-display">${this.getFormattedDateForSave(this.currentDate)}</span>
                    </button>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        document.getElementById('log-date').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.clearFormFields();
            this.updateDateDisplay();
            this.loadTodaysLog();
        });

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        document.querySelectorAll('.weather-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.target.classList.toggle('selected');
            });
        });

        document.getElementById('new-seed').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSeed();
        });

        document.getElementById('new-gratitude').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addGratitude();
        });
    },

    getMoodLabel(mood) {
        const labels = {
            1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Poor', 5: 'Okay',
            6: 'Fair', 7: 'Good', 8: 'Very Good', 9: 'Great', 10: 'Excellent'
        };
        return labels[mood] || 'Unknown';
    },

    getDayOfWeek(dateString) {
        // Create date object in local timezone to avoid UTC conversion issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long' };
        return date.toLocaleDateString('en-US', options);
    },

    getFormattedDateForSave(dateString) {
        // Create date objects in local timezone to avoid UTC conversion issues
        const [year, month, day] = dateString.split('-').map(Number);
        const inputDate = new Date(year, month - 1, day);

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const tomorrow = new Date(todayDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);

        if (inputDate.getTime() === todayDate.getTime()) {
            return 'Today';
        } else if (inputDate.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else if (inputDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return this.getDayOfWeek(dateString);
        }
    },

    clearFormFields() {
        // Clear mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));

        // Clear weather tags
        document.querySelectorAll('.weather-tag').forEach(tag => tag.classList.remove('selected'));

        // Clear activities
        document.querySelectorAll('.activity-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('.activity-item input[type="number"]').forEach(input => {
            input.value = '';
        });

        // Clear observations
        document.getElementById('observations').value = '';

        // Clear seeds list
        document.getElementById('seeds-list').innerHTML = '';

        // Clear gratitude list
        document.getElementById('gratitude-list').innerHTML = '';

        // Clear input fields
        document.getElementById('new-seed').value = '';
        document.getElementById('new-gratitude').value = '';
    },

    updateDateDisplay() {
        document.getElementById('day-of-week').textContent = this.getDayOfWeek(this.currentDate);
        document.getElementById('save-date-display').textContent = this.getFormattedDateForSave(this.currentDate);
    },

    changeDate(direction) {
        const currentDate = new Date(this.currentDate);
        currentDate.setDate(currentDate.getDate() + direction);
        this.currentDate = currentDate.toISOString().split('T')[0];
        document.getElementById('log-date').value = this.currentDate;
        this.clearFormFields();
        this.updateDateDisplay();
        this.loadTodaysLog();
    },

    addSeed() {
        const input = document.getElementById('new-seed');
        const seedText = input.value.trim();
        if (!seedText) return;

        const seedsList = document.getElementById('seeds-list');
        const seedId = Date.now();

        const seedElement = document.createElement('div');
        seedElement.className = 'seed-item';
        seedElement.innerHTML = `
            <span>🌱 ${seedText}</span>
            <button class="remove-btn" onclick="DailyLogPage.removeSeed(${seedId})">
                <i class="fas fa-times"></i>
            </button>
        `;
        seedElement.dataset.seedId = seedId;

        seedsList.appendChild(seedElement);
        input.value = '';
    },

    removeSeed(seedId) {
        const seedElement = document.querySelector(`[data-seed-id="${seedId}"]`);
        if (seedElement) {
            seedElement.remove();
        }
    },

    addGratitude() {
        const input = document.getElementById('new-gratitude');
        const gratitudeText = input.value.trim();
        if (!gratitudeText) return;

        const gratitudeList = document.getElementById('gratitude-list');
        const gratitudeId = Date.now();

        const gratitudeElement = document.createElement('div');
        gratitudeElement.className = 'gratitude-item';
        gratitudeElement.innerHTML = `
            <span>🌸 ${gratitudeText}</span>
            <button class="remove-btn" onclick="DailyLogPage.removeGratitude(${gratitudeId})">
                <i class="fas fa-times"></i>
            </button>
        `;
        gratitudeElement.dataset.gratitudeId = gratitudeId;

        gratitudeList.appendChild(gratitudeElement);
        input.value = '';
    },

    removeGratitude(gratitudeId) {
        const gratitudeElement = document.querySelector(`[data-gratitude-id="${gratitudeId}"]`);
        if (gratitudeElement) {
            gratitudeElement.remove();
        }
    },

    loadTodaysLog() {
        const logData = window.gardenStorage.getDailyLog(this.currentDate);
        if (!logData) return;

        if (logData.moodRating) {
            const moodBtn = document.querySelector(`[data-mood="${logData.moodRating}"]`);
            if (moodBtn) {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                moodBtn.classList.add('selected');
            }
        }

        if (logData.weatherTags) {
            logData.weatherTags.forEach(weather => {
                const tag = document.querySelector(`[data-weather="${weather}"]`);
                if (tag) tag.classList.add('selected');
            });
        }

        if (logData.activities) {
            Object.entries(logData.activities).forEach(([activity, data]) => {
                const checkbox = document.getElementById(activity);
                const duration = document.getElementById(`${activity}-duration`);
                if (checkbox) checkbox.checked = data.completed;
                if (duration) duration.value = data.duration || '';
            });
        }

        if (logData.observations) {
            document.getElementById('observations').value = logData.observations;
        }

        if (logData.seeds) {
            const seedsList = document.getElementById('seeds-list');
            seedsList.innerHTML = '';
            logData.seeds.forEach(seed => {
                const seedElement = document.createElement('div');
                seedElement.className = 'seed-item';
                seedElement.innerHTML = `
                    <span>🌱 ${seed.text}</span>
                    <button class="remove-btn" onclick="DailyLogPage.removeSeed(${seed.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                seedElement.dataset.seedId = seed.id;
                seedsList.appendChild(seedElement);
            });
        }

        if (logData.gratitude) {
            const gratitudeList = document.getElementById('gratitude-list');
            gratitudeList.innerHTML = '';
            logData.gratitude.forEach(gratitude => {
                const gratitudeElement = document.createElement('div');
                gratitudeElement.className = 'gratitude-item';
                gratitudeElement.innerHTML = `
                    <span>🌸 ${gratitude.text}</span>
                    <button class="remove-btn" onclick="DailyLogPage.removeGratitude(${gratitude.id})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                gratitudeElement.dataset.gratitudeId = gratitude.id;
                gratitudeList.appendChild(gratitudeElement);
            });
        }
    },

    saveLog() {
        // Create timestamp for the date being edited, not current time
        const logDateTime = new Date(this.currentDate + 'T12:00:00');
        const logTimestamp = logDateTime.toISOString();

        const logData = {
            date: this.currentDate,
            timestamp: logTimestamp,
            moodRating: document.querySelector('.mood-btn.selected')?.dataset.mood || null,
            weatherTags: Array.from(document.querySelectorAll('.weather-tag.selected')).map(tag => tag.dataset.weather),
            activities: {},
            observations: document.getElementById('observations').value.trim(),
            seeds: Array.from(document.querySelectorAll('.seed-item')).map(item => ({
                id: parseInt(item.dataset.seedId),
                text: item.querySelector('span').textContent.replace('🌱 ', ''),
                timestamp: logTimestamp
            })),
            gratitude: Array.from(document.querySelectorAll('.gratitude-item')).map(item => ({
                id: parseInt(item.dataset.gratitudeId),
                text: item.querySelector('span').textContent.replace('🌸 ', ''),
                timestamp: logTimestamp
            }))
        };

        document.querySelectorAll('.activity-item input[type="checkbox"]').forEach(checkbox => {
            const activity = checkbox.dataset.activity;
            const duration = document.getElementById(`${activity}-duration`).value;
            logData.activities[activity] = {
                completed: checkbox.checked,
                duration: duration ? parseInt(duration) : 0
            };
        });

        if (window.gardenStorage.saveDailyLog(this.currentDate, logData)) {
            window.showNotification('🌱 Daily log saved successfully!');
            if (window.gardenApp && window.gardenApp.currentPage === 'home') {
                window.gardenApp.updateGrowthStats();
            }
        } else {
            window.showNotification('❌ Error saving log. Please try again.', 'error');
        }
    }
};

// Make DailyLogPage available globally
window.DailyLogPage = DailyLogPage;