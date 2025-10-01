// Daily Log Page functionality
const DailyLogPage = {
    currentDate: new Date().toISOString().split('T')[0],

    init() {
        this.render();
        this.setupEventListeners();
        this.loadTodaysLog();
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
                    <input type="date" id="log-date" value="${this.currentDate}">
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
                        <i class="fas fa-save"></i> Save Today's Log
                    </button>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        document.getElementById('log-date').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
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

    changeDate(direction) {
        const currentDate = new Date(this.currentDate);
        currentDate.setDate(currentDate.getDate() + direction);
        this.currentDate = currentDate.toISOString().split('T')[0];
        document.getElementById('log-date').value = this.currentDate;
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
        const logData = {
            date: this.currentDate,
            moodRating: document.querySelector('.mood-btn.selected')?.dataset.mood || null,
            weatherTags: Array.from(document.querySelectorAll('.weather-tag.selected')).map(tag => tag.dataset.weather),
            activities: {},
            observations: document.getElementById('observations').value.trim(),
            seeds: Array.from(document.querySelectorAll('.seed-item')).map(item => ({
                id: parseInt(item.dataset.seedId),
                text: item.querySelector('span').textContent.replace('🌱 ', ''),
                timestamp: new Date().toISOString()
            })),
            gratitude: Array.from(document.querySelectorAll('.gratitude-item')).map(item => ({
                id: parseInt(item.dataset.gratitudeId),
                text: item.querySelector('span').textContent.replace('🌸 ', ''),
                timestamp: new Date().toISOString()
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