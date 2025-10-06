// Daily Log Page functionality
const DailyLogPage = {
    currentDate: new Date().toLocaleDateString('en-CA'), // Use local date in YYYY-MM-DD format

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
                        <h3><i class="fas fa-heart-pulse"></i> Daily Check-ins</h3>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">Track your mood and inner weather throughout the day</p>
                        
                        <div class="checkin-form">
                            <div class="mood-rating">
                                <label>How are you feeling right now?</label>
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

                            <div class="checkin-comment">
                                <label>Optional note:</label>
                                <textarea id="checkin-comment" placeholder="What's happening in your inner world right now? Any thoughts or insights?"></textarea>
                            </div>

                            <button class="checkin-btn" onclick="DailyLogPage.addCheckin()">
                                <i class="fas fa-plus"></i> Add Check-in
                            </button>
                        </div>

                        <div class="checkins-history">
                            <h4><i class="fas fa-clock"></i> Today's Check-ins</h4>
                            <div id="checkins-list" class="checkins-list">
                                <!-- Check-ins will be loaded here -->
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
                // Note: PeaceTree lighting will be triggered when check-in is saved
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

        // Auto-save for observations
        document.getElementById('observations').addEventListener('input', () => {
            this.autoSaveLog();
        });

        // Auto-save for activities (after a short delay to avoid excessive saves)
        document.querySelectorAll('.activity-item input').forEach(input => {
            input.addEventListener('change', () => {
                clearTimeout(this.autoSaveTimeout);
                this.autoSaveTimeout = setTimeout(() => this.autoSaveLog(), 1000);
            });
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
        // Clear check-in form
        this.clearCheckinForm();

        // Clear check-ins list display
        const checkinsContainer = document.getElementById('checkins-list');
        if (checkinsContainer) {
            checkinsContainer.innerHTML = '';
        }

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

        // Reset add button in case it was in edit mode
        this.resetAddButton();
    },

    updateDateDisplay() {
        document.getElementById('day-of-week').textContent = this.getDayOfWeek(this.currentDate);
        // Note: save-date-display element no longer exists since we removed the save button
    },

    addCheckin() {
        const selectedMood = document.querySelector('.mood-btn.selected');
        const selectedWeather = Array.from(document.querySelectorAll('.weather-tag.selected'));
        const comment = document.getElementById('checkin-comment').value.trim();

        if (!selectedMood && selectedWeather.length === 0 && !comment) {
            window.showNotification('Please select a mood, weather, or add a comment for your check-in', 'warning');
            return;
        }

        const checkinData = {
            moodRating: selectedMood ? parseInt(selectedMood.dataset.mood) : null,
            weatherTags: selectedWeather.map(tag => tag.dataset.weather),
            comment: comment
        };

        const newCheckin = window.gardenStorage.addCheckin(this.currentDate, checkinData);

        if (newCheckin) {
            this.clearCheckinForm();
            this.loadTodaysCheckins();
            window.showNotification('Check-in saved! 📝', 'success');

            // Trigger PeaceTree lighting if mood was selected
            if (checkinData.moodRating && window.PeaceTreeMQTT) {
                window.PeaceTreeMQTT.setMoodLighting(checkinData.moodRating);
            }
        } else {
            window.showNotification('Error saving check-in. Please try again.', 'error');
        }
    },

    editCheckin(checkinId) {
        const checkin = window.gardenStorage.getCheckins(this.currentDate).find(c => c.id === checkinId);
        if (!checkin) return;

        // Populate form with existing data
        this.clearCheckinForm();

        if (checkin.moodRating) {
            const moodBtn = document.querySelector(`[data-mood="${checkin.moodRating}"]`);
            if (moodBtn) moodBtn.classList.add('selected');
        }

        checkin.weatherTags.forEach(weather => {
            const tag = document.querySelector(`[data-weather="${weather}"]`);
            if (tag) tag.classList.add('selected');
        });

        document.getElementById('checkin-comment').value = checkin.comment || '';

        // Update the add button to become an update button
        const addBtn = document.querySelector('.checkin-btn');
        addBtn.innerHTML = '<i class="fas fa-save"></i> Update Check-in';
        addBtn.onclick = () => this.updateCheckin(checkinId);
    },

    updateCheckin(checkinId) {
        const selectedMood = document.querySelector('.mood-btn.selected');
        const selectedWeather = Array.from(document.querySelectorAll('.weather-tag.selected'));
        const comment = document.getElementById('checkin-comment').value.trim();

        const updates = {
            moodRating: selectedMood ? parseInt(selectedMood.dataset.mood) : null,
            weatherTags: selectedWeather.map(tag => tag.dataset.weather),
            comment: comment
        };

        if (window.gardenStorage.updateCheckin(this.currentDate, checkinId, updates)) {
            this.clearCheckinForm();
            this.loadTodaysCheckins();
            this.resetAddButton();
            window.showNotification('Check-in updated! ✨', 'success');

            // Trigger PeaceTree lighting if mood was updated
            if (updates.moodRating && window.PeaceTreeMQTT) {
                window.PeaceTreeMQTT.setMoodLighting(updates.moodRating);
            }
        } else {
            window.showNotification('Error updating check-in. Please try again.', 'error');
        }
    },

    deleteCheckin(checkinId) {
        if (!confirm('Are you sure you want to delete this check-in?')) return;

        if (window.gardenStorage.deleteCheckin(this.currentDate, checkinId)) {
            this.loadTodaysCheckins();
            window.showNotification('Check-in deleted', 'info');
        } else {
            window.showNotification('Error deleting check-in. Please try again.', 'error');
        }
    },

    clearCheckinForm() {
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.weather-tag').forEach(tag => tag.classList.remove('selected'));
        document.getElementById('checkin-comment').value = '';
    },

    resetAddButton() {
        const addBtn = document.querySelector('.checkin-btn');
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Check-in';
        addBtn.onclick = () => this.addCheckin();
    },

    renderCheckin(checkin) {
        const time = new Date(checkin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const moodDisplay = checkin.moodRating ? `${checkin.moodRating}/10` : '';
        const weatherDisplay = checkin.weatherTags.length > 0 ?
            checkin.weatherTags.map(w => this.getWeatherEmoji(w)).join(' ') : '';
        const comment = checkin.comment || '';

        return `
            <div class="checkin-item" data-checkin-id="${checkin.id}">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="width: 90px; font-weight: bold; padding: 5px 10px 5px 0;">${time}</td>
                        <td style="width: 50px; text-align: center; padding: 5px;">${moodDisplay}</td>
                        <td style="width: 60px; text-align: center; padding: 5px;">${weatherDisplay}</td>
                        <td style="padding: 5px; flex: 1;">${comment}</td>
                        <td style="width: 60px; text-align: right; padding: 5px;">
                            <div class="checkin-actions">
                                <button onclick="DailyLogPage.editCheckin(${checkin.id})" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="DailyLogPage.deleteCheckin(${checkin.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        `;
    },

    getWeatherEmoji(weather) {
        const emojis = {
            sunny: '☀️', cloudy: '☁️', stormy: '⛈️',
            foggy: '🌫️', windy: '💨', calm: '🌅'
        };
        return emojis[weather] || '🌤️';
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

        // Auto-save after adding seed
        this.autoSaveLog();
    },

    removeSeed(seedId) {
        const seedElement = document.querySelector(`[data-seed-id="${seedId}"]`);
        if (seedElement) {
            seedElement.remove();
            // Auto-save after removing seed
            this.autoSaveLog();
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

        // Auto-save after adding gratitude
        this.autoSaveLog();
    },

    removeGratitude(gratitudeId) {
        const gratitudeElement = document.querySelector(`[data-gratitude-id="${gratitudeId}"]`);
        if (gratitudeElement) {
            gratitudeElement.remove();
            // Auto-save after removing gratitude
            this.autoSaveLog();
        }
    },

    loadTodaysCheckins() {
        const checkinsContainer = document.getElementById('checkins-list');
        if (!checkinsContainer) return;

        // Always clear the container first
        checkinsContainer.innerHTML = '';

        const checkins = window.gardenStorage.getCheckins(this.currentDate);

        if (checkins.length === 0) {
            checkinsContainer.innerHTML = '<p style="color: #999; font-style: italic;">No check-ins yet today</p>';
            return;
        }

        // Add table header
        const headerHtml = `
            <div class="checkins-header" style="border-bottom: 1px solid #ddd; margin-bottom: 5px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="color: #666; font-size: 0.85rem; font-weight: bold;">
                        <td style="width: 90px; padding: 5px 10px 5px 0;">Time</td>
                        <td style="width: 50px; text-align: center; padding: 5px;">Mood</td>
                        <td style="width: 60px; text-align: center; padding: 5px;">Weather</td>
                        <td style="padding: 5px; flex: 1;">Comment</td>
                        <td style="width: 60px; text-align: right; padding: 5px;">Actions</td>
                    </tr>
                </table>
            </div>
        `;

        const checkinsHtml = checkins
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(checkin => this.renderCheckin(checkin))
            .join('');

        checkinsContainer.innerHTML = headerHtml + checkinsHtml;
    }, loadTodaysLog() {
        // Always load check-ins first (this will clear the display even if no data)
        this.loadTodaysCheckins();

        const logData = window.gardenStorage.getDailyLog(this.currentDate);
        if (!logData) return;

        // Legacy mood/weather loading for older data
        if (logData.moodRating && !logData.checkins) {
            const moodBtn = document.querySelector(`[data-mood="${logData.moodRating}"]`);
            if (moodBtn) {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                moodBtn.classList.add('selected');

                // Update PeaceTree lighting for loaded mood
                if (window.PeaceTreeMQTT) {
                    window.PeaceTreeMQTT.setMoodLighting(parseInt(logData.moodRating));
                }
            }
        }

        if (logData.weatherTags && !logData.checkins) {
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

    autoSaveLog() {
        // Auto-save only activities and observations (check-ins are saved separately)
        this.saveLog(true); // Pass true to indicate this is an auto-save
    },

    saveLog(isAutoSave = false) {
        // Get existing log data to preserve check-ins
        const existingLog = window.gardenStorage.getDailyLog(this.currentDate) || {};

        // Create timestamp for the date being edited, not current time
        const logDateTime = new Date(this.currentDate + 'T12:00:00');
        const logTimestamp = logDateTime.toISOString();

        const logData = {
            date: this.currentDate,
            timestamp: existingLog.timestamp || logTimestamp,
            // Preserve existing check-ins
            checkins: existingLog.checkins || [],
            // Update activities
            activities: {},
            // Update observations
            observations: document.getElementById('observations').value.trim(),
            // Update seeds and gratitude from DOM
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
            const durationInput = document.getElementById(`${activity}-duration`);
            const duration = durationInput ? durationInput.value : '';
            logData.activities[activity] = {
                completed: checkbox.checked,
                duration: duration ? parseInt(duration) : 0
            };
        });

        if (window.gardenStorage.saveDailyLog(this.currentDate, logData)) {
            if (!isAutoSave) {
                window.showNotification('🌱 Daily log saved successfully!');
            }
            if (window.gardenApp && window.gardenApp.currentPage === 'home') {
                window.gardenApp.updateGrowthStats();
            }
        } else if (!isAutoSave) {
            window.showNotification('❌ Error saving log. Please try again.', 'error');
        }
    }
};

// Make DailyLogPage available globally
window.DailyLogPage = DailyLogPage;