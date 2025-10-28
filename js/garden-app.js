// Main application logic
class GardenApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.updateDateTime();
        this.updateGrowthStats();
        this.setupEventListeners();
        setInterval(() => this.updateDateTime(), 60000);
        this.handleDeepLink();
    }

    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        document.getElementById('current-date').textContent =
            now.toLocaleDateString('en-US', options);
    }

    updateGrowthStats() {
        const stats = window.gardenStorage.calculateGrowthStats();

        document.getElementById('garden-day').textContent = stats.daysSinceStart;
        document.getElementById('active-seeds').textContent = stats.activeSeeds;
        document.getElementById('growth-streak').textContent = stats.streak;
        document.getElementById('harvested-goals').textContent = stats.harvestedGoals;
        document.getElementById('wellness-score').textContent = stats.wellnessScore;

        this.updateMoodIndicator(stats.wellnessScore);

        // Update data statistics if the panel exists
        if (window.updateDataStatistics) {
            window.updateDataStatistics();
        }
    }

    updateMoodIndicator(wellnessScore) {
        const moodIndicator = document.querySelector('.mood-indicator i');
        const moodText = document.querySelector('.mood-indicator div');

        if (wellnessScore === '--') {
            moodIndicator.className = 'fas fa-sun';
            moodIndicator.style.color = '#f1c40f';
            moodText.innerHTML = '<div><strong>Today\'s Weather:</strong> Clear Skies</div><small>Perfect day to start growing</small>';
            return;
        }

        if (wellnessScore >= 8) {
            moodIndicator.className = 'fas fa-sun';
            moodIndicator.style.color = '#f1c40f';
            moodText.innerHTML = '<div><strong>Today\'s Weather:</strong> Sunny & Bright</div><small>Excellent growing conditions</small>';
        } else if (wellnessScore >= 6) {
            moodIndicator.className = 'fas fa-cloud-sun';
            moodIndicator.style.color = '#3498db';
            moodText.innerHTML = '<div><strong>Today\'s Weather:</strong> Partly Cloudy</div><small>Good conditions for steady growth</small>';
        } else if (wellnessScore >= 4) {
            moodIndicator.className = 'fas fa-cloud';
            moodIndicator.style.color = '#95a5a6';
            moodText.innerHTML = '<div><strong>Today\'s Weather:</strong> Overcast</div><small>Time for gentle nurturing</small>';
        } else {
            moodIndicator.className = 'fas fa-cloud-rain';
            moodIndicator.style.color = '#7f8c8d';
            moodText.innerHTML = '<div><strong>Today\'s Weather:</strong> Rainy</div><small>Every garden needs some rain</small>';
        }
    }

    setupEventListeners() {
        // Removed popstate listener to avoid security issues
        // Navigation will work through direct function calls
    }

    handleDeepLink() {
        // Simplified - no hash handling to avoid issues
        this.showHome();
    }

    showPage(pageId) {
        try {
            const homeElements = document.querySelectorAll('.header, .garden-overview, .navigation-grid, .data-management-panel');
            homeElements.forEach(el => el.style.display = 'none');

            const pageContainers = document.querySelectorAll('.current-page');
            pageContainers.forEach(el => el.style.display = 'none');

            const targetPage = document.getElementById(`${pageId}-page`);
            if (targetPage) {
                targetPage.style.display = 'block';
                this.currentPage = pageId;
                this.initializePage(pageId);
                // Removed history.pushState to avoid security errors
            }
        } catch (error) {
            console.error('Error showing page:', error);
            this.showHome();
        }
    }

    showHome() {
        try {
            const homeElements = document.querySelectorAll('.header, .garden-overview, .navigation-grid, .data-management-panel');
            homeElements.forEach(el => el.style.display = 'block');

            const pageContainers = document.querySelectorAll('.current-page');
            pageContainers.forEach(el => el.style.display = 'none');

            this.currentPage = 'home';
            this.updateGrowthStats();
            // Removed history.pushState to avoid security errors
        } catch (error) {
            console.error('Error showing home:', error);
        }
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'daily-log':
                if (window.DailyLogPage) {
                    window.DailyLogPage.init();
                }
                break;
            case 'weed-tracker':
                if (window.WeedTrackerPage) {
                    window.WeedTrackerPage.init();
                }
                break;
            case 'values-garden':
                if (window.ValuesGardenPage) {
                    window.ValuesGardenPage.init();
                } else {
                    this.renderPlaceholderPage(pageId);
                }
                break;
            case 'harvest-journal':
                if (window.HarvestJournalPage) {
                    window.HarvestJournalPage.init();
                } else {
                    this.renderPlaceholderPage(pageId);
                }
                break;
            case 'garden-visualization':
                if (window.GardenVisualizationPage) {
                    window.GardenVisualizationPage.init();
                }
                break;
            case 'complete-journal':
                if (window.CompleteJournalPage) {
                    window.CompleteJournalPage.init();
                }
                break;
            case 'garden-insights':
                if (window.GardenInsightsPage) {
                    window.GardenInsightsPage.init();
                } else {
                    this.renderPlaceholderPage(pageId);
                }
                break;
            default:
                this.renderPlaceholderPage(pageId);
                break;
        }
    }

    renderPlaceholderPage(pageId) {
        const pageNames = {
            'seasonal-planner': 'Seasonal Growth Planner',
            'values-garden': 'Values Garden Design',
            'harvest-journal': 'Harvest & Celebration',
            'garden-insights': 'Garden Insights'
        };

        const icons = {
            'seasonal-planner': 'calendar-alt',
            'values-garden': 'compass',
            'harvest-journal': 'trophy',
            'garden-insights': 'chart-pie'
        };

        const container = document.getElementById(`${pageId}-page`);
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-${icons[pageId]}"></i> ${pageNames[pageId]}</h1>
                <p>This module is coming soon!</p>
            </div>
            <div style="text-align: center; padding: 40px; color: #7f8c8d; background: white; border-radius: 15px; margin: 0 auto; max-width: 600px;">
                <i class="fas fa-seedling" style="font-size: 3rem; margin-bottom: 15px; display: block; color: #27ae60;"></i>
                <h3>Growing Soon!</h3>
                <p>This module is under development and will be ready in a future update.</p>
                <p style="margin-top: 20px;">In the meantime, you can use the <strong>Daily Garden Log</strong> and <strong>Weed & Wisdom Tracker</strong> to start your growth journey!</p>
            </div>
        `;
    }
}

// Make GardenApp available globally
window.GardenApp = GardenApp;