// Garden Insights Page functionality
const GardenInsightsPage = {
    init() {
        this.render();
        this.renderMoodGraph();
        this.updateInsights();
    },

    render() {
        const container = document.getElementById('garden-insights-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-chart-pie"></i> Garden Insights</h1>
                <p>Discover patterns and insights from your personal growth journey</p>
            </div>

            <div class="insights-container">
                <!-- Growth Insights Section -->
                <div class="insights-section" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-lightbulb"></i> Growth Insights</h3>
                    <div id="growth-insights-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <!-- Insights will be populated here -->
                    </div>
                </div>

                <!-- Mood Trends Section -->
                <div class="mood-insights-section" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-chart-line"></i> Mood Trends (Last 30 Days)</h3>
                    <div id="mood-graph-container" style="position: relative; height: 300px; width: 100%; background: #f8f9fa; border-radius: 8px;">
                        <canvas id="mood-graph-canvas" style="width: 100%; height: 100%; border-radius: 8px;"></canvas>
                    </div>
                    <div id="mood-graph-legend" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
                        <!-- Legend will be populated by JavaScript -->
                    </div>
                </div>

                <!-- Activity Patterns Section -->
                <div class="activity-insights-section" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-chart-bar"></i> Activity Patterns</h3>
                    <div id="activity-insights-content">
                        <!-- Activity insights will be populated here -->
                    </div>
                </div>

                <!-- Growth Journey Section -->
                <div class="journey-insights-section" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-route"></i> Your Growth Journey</h3>
                    <div id="journey-insights-content">
                        <!-- Journey insights will be populated here -->
                    </div>
                </div>
            </div>
        `;
    },

    updateInsights() {
        this.updateGrowthInsights();
        this.updateActivityInsights();
        this.updateJourneyInsights();
    },

    updateGrowthInsights() {
        const stats = window.gardenStorage.calculateGrowthStats();
        const data = window.gardenStorage.getData();
        const dailyLogs = data.dailyLogs || {};

        const insights = [];

        // Streak insight
        if (stats.streak > 7) {
            insights.push({
                icon: '🔥',
                title: 'Amazing Consistency!',
                description: `You've maintained a ${stats.streak}-day growth streak. Consistency is the key to lasting change!`,
                color: '#e74c3c'
            });
        } else if (stats.streak > 0) {
            insights.push({
                icon: '🌱',
                title: 'Building Momentum',
                description: `${stats.streak} days of consistent growth. Keep going to build a stronger habit!`,
                color: '#f39c12'
            });
        }

        // Active seeds insight
        if (stats.activeSeeds > 10) {
            insights.push({
                icon: '🌻',
                title: 'Abundant Growth',
                description: `You have ${stats.activeSeeds} intentions growing in your garden. Your commitment to growth is inspiring!`,
                color: '#27ae60'
            });
        } else if (stats.activeSeeds > 0) {
            insights.push({
                icon: '🌿',
                title: 'Seeds Taking Root',
                description: `${stats.activeSeeds} intentions are actively growing. Watch them bloom with continued care!`,
                color: '#2ecc71'
            });
        }

        // Wellness trend
        if (stats.wellnessScore !== '--' && stats.wellnessScore >= 7) {
            insights.push({
                icon: '☀️',
                title: 'Thriving Wellness',
                description: `Your wellness score of ${stats.wellnessScore}/10 shows you're in a great space for growth!`,
                color: '#f1c40f'
            });
        }

        // Days since start
        if (stats.daysSinceStart > 30) {
            insights.push({
                icon: '🎯',
                title: 'Dedicated Journey',
                description: `${stats.daysSinceStart} days of personal growth. You're building something beautiful!`,
                color: '#9b59b6'
            });
        }

        this.renderInsightCards('growth-insights-content', insights);
    },

    updateActivityInsights() {
        const data = window.gardenStorage.getData();
        const dailyLogs = data.dailyLogs || {};

        // Calculate activity patterns
        const activityStats = {
            meditation: { count: 0, totalDuration: 0 },
            exercise: { count: 0, totalDuration: 0 },
            journaling: { count: 0, totalDuration: 0 },
            reading: { count: 0, totalDuration: 0 },
            creativity: { count: 0, totalDuration: 0 },
            social: { count: 0, totalDuration: 0 }
        };

        Object.values(dailyLogs).forEach(log => {
            if (log.activities) {
                Object.entries(log.activities).forEach(([activity, data]) => {
                    if (data.completed && activityStats[activity]) {
                        activityStats[activity].count++;
                        activityStats[activity].totalDuration += data.duration || 0;
                    }
                });
            }
        });

        const activityNames = {
            meditation: '🧘 Meditation',
            exercise: '🏃 Exercise',
            journaling: '📝 Journaling',
            reading: '📚 Reading',
            creativity: '🎨 Creativity',
            social: '👥 Social'
        };

        let activityHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">';

        Object.entries(activityStats).forEach(([activity, stats]) => {
            const avgDuration = stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0;
            activityHtml += `
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 5px;">${activityNames[activity]}</div>
                    <div style="font-weight: bold; color: #2c3e50;">${stats.count} times</div>
                    ${avgDuration > 0 ? `<div style="font-size: 0.9rem; color: #666;">Avg: ${avgDuration} min</div>` : ''}
                </div>
            `;
        });

        activityHtml += '</div>';

        document.getElementById('activity-insights-content').innerHTML = activityHtml;
    },

    updateJourneyInsights() {
        const data = window.gardenStorage.getData();
        const dailyLogs = data.dailyLogs || {};
        const weeds = data.weeds || {};

        const totalEntries = Object.keys(dailyLogs).length;
        const totalWeeds = Object.keys(weeds).length;
        const transformedWeeds = Object.values(weeds).filter(w => w.improvement && w.improvement > 50).length;

        const journeyHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: bold;">${totalEntries}</div>
                    <div>Journal Entries</div>
                </div>
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: bold;">${totalWeeds}</div>
                    <div>Challenges Faced</div>
                </div>
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 12px;">
                    <div style="font-size: 2rem; font-weight: bold;">${transformedWeeds}</div>
                    <div>Transformed into Wisdom</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">🌟 Your Growth Story</h4>
                <p style="color: #666; line-height: 1.6;">
                    ${this.generateGrowthStory(totalEntries, totalWeeds, transformedWeeds)}
                </p>
            </div>
        `;

        document.getElementById('journey-insights-content').innerHTML = journeyHtml;
    },

    generateGrowthStory(entries, weeds, transformed) {
        if (entries === 0) {
            return "Your growth journey is just beginning! Start by adding daily entries to plant your first seeds of intention.";
        }

        let story = `You've been on your growth journey for ${entries} day${entries > 1 ? 's' : ''}, consistently nurturing your inner garden. `;

        if (weeds > 0) {
            story += `You've courageously faced ${weeds} challenge${weeds > 1 ? 's' : ''}, `;
            if (transformed > 0) {
                const transformationRate = Math.round((transformed / weeds) * 100);
                story += `and remarkably transformed ${transformationRate}% of them into wisdom! `;
            } else {
                story += `showing tremendous self-awareness. `;
            }
        }

        story += "Every entry, every reflection, every moment of awareness is contributing to the beautiful garden of your personal growth.";

        return story;
    },

    renderInsightCards(containerId, insights) {
        const container = document.getElementById(containerId);
        if (!container || insights.length === 0) {
            container.innerHTML = '<p style="color: #999; font-style: italic; text-align: center;">Start logging your daily activities to see personalized insights!</p>';
            return;
        }

        const cardsHtml = insights.map(insight => `
            <div style="padding: 20px; background: linear-gradient(135deg, ${insight.color}15, ${insight.color}05); border-left: 4px solid ${insight.color}; border-radius: 8px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">${insight.icon}</div>
                <h4 style="color: #2c3e50; margin-bottom: 8px;">${insight.title}</h4>
                <p style="color: #666; margin: 0; line-height: 1.5;">${insight.description}</p>
            </div>
        `).join('');

        container.innerHTML = cardsHtml;
    },

    renderMoodGraph() {
        const canvas = document.getElementById('mood-graph-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = document.getElementById('mood-graph-container');

        // Set canvas size to match container
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Get mood data for the last 30 days
        const moodData = this.getMoodDataForLast30Days();

        if (moodData.length === 0 || moodData.every(d => d.averageMood === null)) {
            this.renderNoMoodDataMessage(ctx, rect.width, rect.height);
            return;
        }

        this.drawMoodChart(ctx, moodData, rect.width, rect.height);
        this.updateMoodGraphLegend(moodData);
    },

    getMoodDataForLast30Days() {
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const checkins = window.gardenStorage.getCheckins(dateString);
            const moodRatings = checkins
                .filter(c => c.moodRating)
                .map(c => ({ rating: c.moodRating, timestamp: c.timestamp }));

            data.push({
                date: dateString,
                dateObj: new Date(date),
                ratings: moodRatings,
                averageMood: moodRatings.length > 0 ?
                    moodRatings.reduce((sum, m) => sum + m.rating, 0) / moodRatings.length : null
            });
        }

        return data;
    },

    drawMoodChart(ctx, moodData, width, height) {
        const padding = 50;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(padding, padding, chartWidth, chartHeight);

        // Draw grid lines and labels
        this.drawMoodChartGrid(ctx, padding, chartWidth, chartHeight, width, height);

        // Draw mood line
        this.drawMoodLine(ctx, moodData, padding, chartWidth, chartHeight);

        // Draw mood points
        this.drawMoodPoints(ctx, moodData, padding, chartWidth, chartHeight);
    },

    drawMoodChartGrid(ctx, padding, chartWidth, chartHeight, width, height) {
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6c757d';

        // Horizontal grid lines (mood levels 1-10)
        for (let i = 1; i <= 10; i++) {
            const y = padding + chartHeight - (i * chartHeight / 10);

            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();

            // Y-axis labels
            ctx.textAlign = 'right';
            ctx.fillText(i.toString(), padding - 10, y + 4);
        }

        // Vertical grid lines (weeks)
        const daysToShow = [0, 7, 14, 21, 28]; // Every week
        daysToShow.forEach(dayIndex => {
            const x = padding + (dayIndex * chartWidth / 29);

            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();

            // X-axis labels (dates)
            if (dayIndex < 29) {
                const date = new Date();
                date.setDate(date.getDate() - (29 - dayIndex));
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                ctx.save();
                ctx.translate(x, height - 15);
                ctx.rotate(-Math.PI / 6); // Rotate labels slightly
                ctx.textAlign = 'right';
                ctx.fillText(label, 0, 0);
                ctx.restore();
            }
        });

        // Chart border
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, padding, chartWidth, chartHeight);
    },

    drawMoodLine(ctx, moodData, padding, chartWidth, chartHeight) {
        const validPoints = moodData.filter(d => d.averageMood !== null);
        if (validPoints.length < 2) return;

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();

        let firstPoint = true;
        moodData.forEach((dayData, index) => {
            if (dayData.averageMood !== null) {
                const x = padding + (index * chartWidth / 29);
                const y = padding + chartHeight - (dayData.averageMood * chartHeight / 10);

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
        });

        ctx.stroke();

        // Add shadow/glow effect
        ctx.shadowColor = '#3498db';
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
    },

    drawMoodPoints(ctx, moodData, padding, chartWidth, chartHeight) {
        moodData.forEach((dayData, index) => {
            if (dayData.averageMood !== null) {
                const x = padding + (index * chartWidth / 29);
                const y = padding + chartHeight - (dayData.averageMood * chartHeight / 10);

                // Point background
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fill();

                // Point border
                ctx.strokeStyle = this.getMoodColor(dayData.averageMood);
                ctx.lineWidth = 3;
                ctx.stroke();

                // Point center
                ctx.fillStyle = this.getMoodColor(dayData.averageMood);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    },

    getMoodColor(mood) {
        // Color gradient from red (low) to green (high)
        if (mood <= 3) return '#e74c3c'; // Red
        if (mood <= 5) return '#f39c12'; // Orange
        if (mood <= 7) return '#f1c40f'; // Yellow
        return '#27ae60'; // Green
    },

    renderNoMoodDataMessage(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);

        // Message
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data available', width / 2, height / 2 - 10);

        ctx.font = '14px Arial';
        ctx.fillText('Start logging your daily check-ins to see mood trends!', width / 2, height / 2 + 15);
    },

    updateMoodGraphLegend(moodData) {
        const legendElement = document.getElementById('mood-graph-legend');
        if (!legendElement) return;

        const validDays = moodData.filter(d => d.averageMood !== null);
        if (validDays.length === 0) {
            legendElement.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <i class="fas fa-info-circle"></i> Add daily check-ins with mood ratings to see your trends
                </div>
            `;
            return;
        }

        const averageOverall = validDays.reduce((sum, d) => sum + d.averageMood, 0) / validDays.length;
        const highestMood = Math.max(...validDays.map(d => d.averageMood));
        const lowestMood = Math.min(...validDays.map(d => d.averageMood));

        legendElement.innerHTML = `
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
                <span style="padding: 8px 12px; background: white; border-radius: 20px; border: 2px solid #3498db;">
                    📊 30-day average: <strong>${averageOverall.toFixed(1)}/10</strong>
                </span>
                <span style="padding: 8px 12px; background: white; border-radius: 20px; border: 2px solid #27ae60;">
                    📈 Highest: <strong>${highestMood}/10</strong>
                </span>
                <span style="padding: 8px 12px; background: white; border-radius: 20px; border: 2px solid #e74c3c;">
                    📉 Lowest: <strong>${lowestMood}/10</strong>
                </span>
            </div>
        `;
    }
};

// Make GardenInsightsPage available globally
window.GardenInsightsPage = GardenInsightsPage;