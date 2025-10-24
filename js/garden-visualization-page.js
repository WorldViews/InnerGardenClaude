// Garden Visualization Page functionality
const GardenVisualizationPage = {
    visualization: null,

    init() {
        this.render();
        this.startVisualization();
    },

    render() {
        const container = document.getElementById('garden-visualization-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-seedling"></i> Your Living Garden</h1>
                <p>Watch your personal growth bloom into beautiful flowers</p>
            </div>

            <div class="garden-visualization-container">
                <div class="garden-info" style="background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                        <div class="flower-legend">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;"><i class="fas fa-seedling"></i> Intention Flowers</h4>
                            <p style="color: #7f8c8d; font-size: 0.9rem;">Pink flowers that grow from your daily seeds and intentions. They mature over 7 days.</p>
                        </div>
                        <div class="flower-legend">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;"><i class="fas fa-heart"></i> Gratitude Blooms</h4>
                            <p style="color: #7f8c8d; font-size: 0.9rem;">Orange flowers from your gratitude entries. They grow quickly and spread joy.</p>
                        </div>
                        <div class="flower-legend">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;"><i class="fas fa-brain"></i> Wisdom Flowers</h4>
                            <p style="color: #7f8c8d; font-size: 0.9rem;">Purple flowers from transformed negative thoughts. Size reflects your growth.</p>
                        </div>
                        <div class="flower-legend">
                            <h4 style="color: #2c3e50; margin-bottom: 10px;"><i class="fas fa-compass"></i> Values Flowers</h4>
                            <p style="color: #7f8c8d; font-size: 0.9rem;">Majestic flowers representing your core values. They bloom when you complete your Values Garden Design.</p>
                        </div>
                    </div>
                    
                    <div class="garden-controls" style="text-align: center; margin-top: 15px;">
                        <button onclick="GardenVisualizationPage.refreshGarden()" 
                                style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-sync"></i> Refresh Garden
                        </button>
                        <button onclick="GardenVisualizationPage.downloadGardenImage()" 
                                style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-camera"></i> Save Garden Photo
                        </button>
                    </div>
                </div>

                <div class="garden-canvas-container" 
                     id="garden-canvas-container" 
                     style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); position: relative; min-height: 450px;">
                    <div class="garden-stats" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; font-size: 0.8rem; z-index: 10;">
                        <div id="garden-flower-count" style="margin-bottom: 5px;"></div>
                        <div id="garden-age-info"></div>
                    </div>
                </div>

                <div class="garden-insights" style="background: white; padding: 20px; border-radius: 15px; margin-top: 20px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-lightbulb"></i> Garden Insights</h4>
                    <div id="garden-insights-content"></div>
                    
                    <!-- Mood Levels Graph -->
                    <div class="mood-graph-section" style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 20px;">
                        <h4 style="color: #2c3e50; margin-bottom: 15px;"><i class="fas fa-chart-line"></i> Mood Trends (Last 30 Days)</h4>
                        <div id="mood-graph-container" style="position: relative; height: 300px; width: 100%;">
                            <canvas id="mood-graph-canvas" style="width: 100%; height: 100%; border-radius: 8px;"></canvas>
                        </div>
                        <div id="mood-graph-legend" style="margin-top: 10px; font-size: 0.85rem; color: #666; text-align: center;">
                            <!-- Legend will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    startVisualization() {
        if (window.GardenVisualization) {
            this.visualization = Object.create(window.GardenVisualization);
            const success = this.visualization.init('garden-canvas-container');

            if (success) {
                this.updateGardenStats();
                this.updateGardenInsights();
                this.renderMoodGraph();

                // Add mouse interaction for flower tooltips
                if (this.visualization.canvas) {
                    this.visualization.canvas.addEventListener('mousemove', (e) => {
                        this.visualization.showFlowerTooltip(e);
                    });
                }
            } else {
                document.getElementById('garden-canvas-container').innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                        <h3>Unable to Load Garden</h3>
                        <p>There was an issue displaying your garden visualization.</p>
                    </div>
                `;
            }
        }
    },

    updateGardenStats() {
        if (!this.visualization || !this.visualization.flowers) return;

        const flowers = this.visualization.flowers;
        const seedCount = flowers.filter(f => f.type === 'seed').length;
        const gratitudeCount = flowers.filter(f => f.type === 'gratitude').length;
        const wisdomCount = flowers.filter(f => f.type === 'wisdom').length;
        const valuesCount = flowers.filter(f => f.type === 'values').length;
        const totalFlowers = flowers.length;

        const oldestFlower = flowers.reduce((oldest, flower) =>
            flower.age > oldest.age ? flower : oldest, { age: 0 });

        let statsText = `<strong>${totalFlowers} Flowers</strong><br>`;
        if (seedCount > 0) statsText += `${seedCount} Seeds • `;
        if (gratitudeCount > 0) statsText += `${gratitudeCount} Gratitude • `;
        if (wisdomCount > 0) statsText += `${wisdomCount} Wisdom • `;
        if (valuesCount > 0) statsText += `${valuesCount} Values • `;

        // Remove trailing • 
        statsText = statsText.replace(/ • $/, '');

        document.getElementById('garden-flower-count').innerHTML = statsText;

        document.getElementById('garden-age-info').innerHTML = `
            Oldest: ${oldestFlower.age} days
        `;
    },

    updateGardenInsights() {
        if (!this.visualization || !this.visualization.flowers) return;

        const flowers = this.visualization.flowers;
        const insights = [];

        // Growth insights
        const matureFlowers = flowers.filter(f => f.growth >= 0.8).length;
        const growingFlowers = flowers.filter(f => f.growth < 0.8 && f.growth > 0.3).length;
        const youngFlowers = flowers.filter(f => f.growth <= 0.3).length;

        if (matureFlowers > 0) {
            insights.push(`🌸 You have ${matureFlowers} mature flower${matureFlowers > 1 ? 's' : ''} - beautiful progress!`);
        }

        if (growingFlowers > 0) {
            insights.push(`🌱 ${growingFlowers} flower${growingFlowers > 1 ? 's are' : ' is'} currently growing - keep nurturing them!`);
        }

        if (youngFlowers > 0) {
            insights.push(`🌿 ${youngFlowers} young sprout${youngFlowers > 1 ? 's' : ''} - fresh beginnings are sprouting!`);
        }

        // Wisdom insights
        const wisdomFlowers = flowers.filter(f => f.type === 'wisdom');
        const highWisdom = wisdomFlowers.filter(f => f.improvement > 50).length;

        if (highWisdom > 0) {
            insights.push(`🧠 ${highWisdom} wisdom flower${highWisdom > 1 ? 's show' : ' shows'} significant mental growth!`);
        }

        // Recent activity
        const recentFlowers = flowers.filter(f => f.age <= 3).length;
        if (recentFlowers > 0) {
            insights.push(`✨ ${recentFlowers} flower${recentFlowers > 1 ? 's' : ''} planted in the last 3 days - you're actively growing!`);
        }

        // Diversity insight
        const types = new Set(flowers.map(f => f.type));
        if (types.size >= 3) {
            insights.push(`🌈 Your garden shows beautiful diversity with all three types of growth!`);
        }

        // Default message if no flowers
        if (flowers.length === 0) {
            insights.push(`🌱 Your garden is ready to grow! Start by adding daily log entries or working through some thought patterns.`);
        }

        const insightsHtml = insights.map(insight =>
            `<div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">${insight}</div>`
        ).join('');

        document.getElementById('garden-insights-content').innerHTML = insightsHtml;
    },

    refreshGarden() {
        if (this.visualization) {
            this.visualization.loadGardenData();
            this.updateGardenStats();
            this.updateGardenInsights();
            this.renderMoodGraph();
            window.showNotification('🌱 Garden refreshed!');
        }
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

        if (moodData.length === 0) {
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
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#ffffff');
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
            legendElement.innerHTML = 'Add daily check-ins with mood ratings to see your trends';
            return;
        }

        const averageOverall = validDays.reduce((sum, d) => sum + d.averageMood, 0) / validDays.length;
        const highestMood = Math.max(...validDays.map(d => d.averageMood));
        const lowestMood = Math.min(...validDays.map(d => d.averageMood));

        legendElement.innerHTML = `
            <span style="margin-right: 20px;">📊 30-day average: <strong>${averageOverall.toFixed(1)}/10</strong></span>
            <span style="margin-right: 20px;">📈 Highest: <strong>${highestMood}/10</strong></span>
            <span>📉 Lowest: <strong>${lowestMood}/10</strong></span>
        `;
    },

    downloadGardenImage() {
        if (!this.visualization || !this.visualization.canvas) {
            window.showNotification('❌ Unable to capture garden image', 'error');
            return;
        }

        try {
            // Create a higher resolution canvas for the image
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = this.visualization.canvas.width * 2;
            exportCanvas.height = this.visualization.canvas.height * 2;
            const exportCtx = exportCanvas.getContext('2d');

            // Scale up the context for higher quality
            exportCtx.scale(2, 2);
            exportCtx.drawImage(this.visualization.canvas, 0, 0);

            // Add timestamp
            exportCtx.font = '16px Arial';
            exportCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            exportCtx.fillRect(10, 10, 200, 30);
            exportCtx.fillStyle = '#333';
            exportCtx.fillText(`Garden snapshot: ${new Date().toLocaleDateString()}`, 15, 30);

            // Download the image
            exportCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `my-inner-garden-${new Date().toISOString().split('T')[0]}.png`;
                link.click();
                URL.revokeObjectURL(url);

                window.showNotification('🌸 Garden photo saved!');
            }, 'image/png');

        } catch (error) {
            console.error('Error saving garden image:', error);
            window.showNotification('❌ Error saving garden photo', 'error');
        }
    },

    destroy() {
        if (this.visualization) {
            this.visualization.destroy();
            this.visualization = null;
        }
    }
};

// Make GardenVisualizationPage available globally
window.GardenVisualizationPage = GardenVisualizationPage;