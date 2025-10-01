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
        const totalFlowers = flowers.length;

        const oldestFlower = flowers.reduce((oldest, flower) =>
            flower.age > oldest.age ? flower : oldest, { age: 0 });

        document.getElementById('garden-flower-count').innerHTML = `
            <strong>${totalFlowers} Flowers</strong><br>
            ${seedCount} Seeds • ${gratitudeCount} Gratitude • ${wisdomCount} Wisdom
        `;

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
            window.showNotification('🌱 Garden refreshed!');
        }
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