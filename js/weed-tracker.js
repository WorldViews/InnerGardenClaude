// Weed Tracker Page functionality
const WeedTrackerPage = {
    currentWeedId: null,

    init() {
        this.render();
        this.setupEventListeners();
        this.loadWeedHistory();
    },

    render() {
        const container = document.getElementById('weed-tracker-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-bug"></i> Weed & Wisdom Tracker</h1>
                <p>Transform unhelpful thoughts into fertile soil for growth</p>
            </div>

            <div class="weed-container">
                <div class="info-section">
                    <h3><i class="fas fa-book"></i> Common Garden Weeds (Thought Patterns)</h3>
                    <div class="weed-guide">
                        <div class="weed-type" data-type="catastrophizing">
                            <span class="weed-icon">🌪️</span>
                            <div>
                                <strong>Storm Clouds</strong>
                                <small>Catastrophizing - Assuming the worst will happen</small>
                            </div>
                        </div>
                        <div class="weed-type" data-type="all-or-nothing">
                            <span class="weed-icon">⚫</span>
                            <div>
                                <strong>Black & White Flowers</strong>
                                <small>All-or-nothing thinking - Seeing only extremes</small>
                            </div>
                        </div>
                        <div class="weed-type" data-type="mind-reading">
                            <span class="weed-icon">🔮</span>
                            <div>
                                <strong>Crystal Ball Vine</strong>
                                <small>Mind reading - Assuming you know what others think</small>
                            </div>
                        </div>
                        <div class="weed-type" data-type="fortune-telling">
                            <span class="weed-icon">🎭</span>
                            <div>
                                <strong>Fortune Teller Moss</strong>
                                <small>Fortune telling - Predicting negative outcomes</small>
                            </div>
                        </div>
                        <div class="weed-type" data-type="personalization">
                            <span class="weed-icon">🎯</span>
                            <div>
                                <strong>Blame Brambles</strong>
                                <small>Personalization - Taking responsibility for everything</small>
                            </div>
                        </div>
                        <div class="weed-type" data-type="should-statements">
                            <span class="weed-icon">📏</span>
                            <div>
                                <strong>Should Shrubs</strong>
                                <small>"Should" statements - Harsh self-criticism</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="weed-entry-section">
                    <h3><i class="fas fa-search"></i> Spot a Weed in Your Garden</h3>
                    <button class="add-weed-btn" onclick="WeedTrackerPage.startNewWeedEntry()">
                        <i class="fas fa-plus"></i> Identify New Weed
                    </button>
                </div>

                <div id="weed-form" class="weed-form" style="display: none;">
                    <div class="form-section">
                        <h4>🔍 What happened? (The situation)</h4>
                        <textarea id="situation" placeholder="Describe the situation that triggered the unhelpful thought..."></textarea>
                    </div>

                    <div class="form-section">
                        <h4>🌿 What weed sprouted? (The thought)</h4>
                        <textarea id="thought" placeholder="What specific thought went through your mind?"></textarea>
                        
                        <div class="thought-intensity">
                            <label>How strongly do you believe this thought? (0-100%)</label>
                            <div class="intensity-slider">
                                <input type="range" id="belief-intensity" min="0" max="100" value="50">
                                <span id="belief-value">50%</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🌪️ What type of weed is this?</h4>
                        <div class="weed-types-selection">
                            <div class="weed-option" data-type="catastrophizing">
                                🌪️ Storm Clouds (Catastrophizing)
                            </div>
                            <div class="weed-option" data-type="all-or-nothing">
                                ⚫ Black & White Flowers (All-or-nothing)
                            </div>
                            <div class="weed-option" data-type="mind-reading">
                                🔮 Crystal Ball Vine (Mind reading)
                            </div>
                            <div class="weed-option" data-type="fortune-telling">
                                🎭 Fortune Teller Moss (Fortune telling)
                            </div>
                            <div class="weed-option" data-type="personalization">
                                🎯 Blame Brambles (Personalization)
                            </div>
                            <div class="weed-option" data-type="should-statements">
                                📏 Should Shrubs ("Should" statements)
                            </div>
                            <div class="weed-option" data-type="other">
                                🌱 Other type of weed
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>💚 How did this make you feel?</h4>
                        <div class="emotion-tags">
                            <span class="emotion-tag" data-emotion="anxious">😰 Anxious</span>
                            <span class="emotion-tag" data-emotion="sad">😢 Sad</span>
                            <span class="emotion-tag" data-emotion="angry">😠 Angry</span>
                            <span class="emotion-tag" data-emotion="ashamed">😳 Ashamed</span>
                            <span class="emotion-tag" data-emotion="guilty">😔 Guilty</span>
                            <span class="emotion-tag" data-emotion="frustrated">😤 Frustrated</span>
                            <span class="emotion-tag" data-emotion="overwhelmed">😵 Overwhelmed</span>
                            <span class="emotion-tag" data-emotion="lonely">😞 Lonely</span>
                        </div>
                        
                        <div class="emotion-intensity">
                            <label>How intense were these feelings? (0-100)</label>
                            <div class="intensity-slider">
                                <input type="range" id="emotion-intensity" min="0" max="100" value="50">
                                <span id="emotion-value">50</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🌱 What evidence supports this thought?</h4>
                        <textarea id="supporting-evidence" placeholder="What facts or evidence make this thought seem true?"></textarea>
                    </div>

                    <div class="form-section">
                        <h4>🌸 What evidence challenges this thought?</h4>
                        <textarea id="challenging-evidence" placeholder="What facts or evidence suggest this thought might not be completely accurate?"></textarea>
                    </div>

                    <div class="form-section">
                        <h4>🌿 Plant a balanced thought (Alternative perspective)</h4>
                        <textarea id="balanced-thought" placeholder="What would you tell a good friend in this situation? What's a more balanced way to think about this?"></textarea>
                        
                        <div class="thought-intensity">
                            <label>How much do you believe this new thought? (0-100%)</label>
                            <div class="intensity-slider">
                                <input type="range" id="new-belief-intensity" min="0" max="100" value="50">
                                <span id="new-belief-value">50%</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🌻 How do you feel now?</h4>
                        <div class="emotion-intensity">
                            <label>Emotion intensity after reframing (0-100)</label>
                            <div class="intensity-slider">
                                <input type="range" id="new-emotion-intensity" min="0" max="100" value="50">
                                <span id="new-emotion-value">50</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4>🌱 Action plan (How to tend your garden)</h4>
                        <textarea id="action-plan" placeholder="What can you do differently next time? How will you nurture more helpful thoughts?"></textarea>
                    </div>

                    <div class="form-actions">
                        <button class="cancel-btn" onclick="WeedTrackerPage.cancelWeedEntry()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="save-weed-btn" onclick="WeedTrackerPage.saveWeedEntry()">
                            <i class="fas fa-seedling"></i> Transform Weed to Wisdom
                        </button>
                    </div>
                </div>

                <div class="weed-history-section">
                    <h3><i class="fas fa-history"></i> Your Wisdom Garden</h3>
                    <div id="weed-history" class="weed-history"></div>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        const sliders = ['belief-intensity', 'emotion-intensity', 'new-belief-intensity', 'new-emotion-intensity'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId.replace('intensity', 'value'));
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (sliderId.includes('belief')) {
                        value += '%';
                    }
                    valueSpan.textContent = value;
                });
            }
        });

        document.querySelectorAll('.weed-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.weed-option').forEach(o => o.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        document.querySelectorAll('.emotion-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.target.classList.toggle('selected');
            });
        });
    },

    startNewWeedEntry() {
        document.getElementById('weed-form').style.display = 'block';
        document.querySelector('.add-weed-btn').style.display = 'none';
        this.currentWeedId = Date.now();

        document.getElementById('weed-form').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    },

    cancelWeedEntry() {
        document.getElementById('weed-form').style.display = 'none';
        document.querySelector('.add-weed-btn').style.display = 'block';
        this.clearForm();
    },

    clearForm() {
        document.querySelectorAll('#weed-form textarea').forEach(textarea => {
            textarea.value = '';
        });

        document.querySelectorAll('#weed-form input[type="range"]').forEach(slider => {
            slider.value = 50;
            const valueSpan = document.getElementById(slider.id.replace('intensity', 'value'));
            if (valueSpan) {
                let value = '50';
                if (slider.id.includes('belief')) {
                    value += '%';
                }
                valueSpan.textContent = value;
            }
        });

        document.querySelectorAll('.weed-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelectorAll('.emotion-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
    },

    saveWeedEntry() {
        const weedData = {
            id: this.currentWeedId,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            situation: document.getElementById('situation').value.trim(),
            originalThought: document.getElementById('thought').value.trim(),
            beliefIntensity: parseInt(document.getElementById('belief-intensity').value),
            weedType: document.querySelector('.weed-option.selected')?.dataset.type || 'other',
            emotions: Array.from(document.querySelectorAll('.emotion-tag.selected')).map(tag => tag.dataset.emotion),
            emotionIntensity: parseInt(document.getElementById('emotion-intensity').value),
            supportingEvidence: document.getElementById('supporting-evidence').value.trim(),
            challengingEvidence: document.getElementById('challenging-evidence').value.trim(),
            balancedThought: document.getElementById('balanced-thought').value.trim(),
            newBeliefIntensity: parseInt(document.getElementById('new-belief-intensity').value),
            newEmotionIntensity: parseInt(document.getElementById('new-emotion-intensity').value),
            actionPlan: document.getElementById('action-plan').value.trim()
        };

        if (!weedData.situation || !weedData.originalThought || !weedData.balancedThought) {
            window.showNotification('Please fill in the situation, original thought, and balanced thought fields.', 'error');
            return;
        }

        if (window.gardenStorage.saveWeedEntry(this.currentWeedId, weedData)) {
            window.showNotification('🌱 Weed successfully transformed into wisdom!');
            this.cancelWeedEntry();
            this.loadWeedHistory();
        } else {
            window.showNotification('❌ Error saving weed entry. Please try again.', 'error');
        }
    },

    loadWeedHistory() {
        const weedHistory = window.gardenStorage.getAllWeeds();
        const historyContainer = document.getElementById('weed-history');

        if (Object.keys(weedHistory).length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-seedling" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    <p>Your wisdom garden is ready to grow!</p>
                    <small>Track unhelpful thoughts to transform them into insights.</small>
                </div>
            `;
            return;
        }

        const sortedWeeds = Object.values(weedHistory).sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        historyContainer.innerHTML = sortedWeeds.map(weed => this.renderWeedItem(weed)).join('');
    },

    renderWeedItem(weed) {
        const weedTypeInfo = this.getWeedTypeInfo(weed.weedType);
        const date = new Date(weed.timestamp).toLocaleDateString();
        const emotions = weed.emotions.length > 0 ? weed.emotions.join(', ') : 'Not specified';

        return `
            <div class="weed-item">
                <div class="weed-item-header">
                    <span class="weed-item-date">${date}</span>
                    <span class="weed-item-type">${weedTypeInfo.icon} ${weedTypeInfo.name}</span>
                </div>
                
                <div class="weed-item-content">
                    <div class="before-after before">
                        <h5>🌿 Original Weed</h5>
                        <p><strong>Situation:</strong> ${weed.situation}</p>
                        <p><strong>Thought:</strong> "${weed.originalThought}"</p>
                        <p><strong>Belief:</strong> ${weed.beliefIntensity}% | <strong>Emotions:</strong> ${emotions} (${weed.emotionIntensity}/100)</p>
                    </div>
                    
                    <div class="before-after after">
                        <h5>🌸 Wisdom Flower</h5>
                        <p><strong>Balanced thought:</strong> "${weed.balancedThought}"</p>
                        <p><strong>New belief:</strong> ${weed.newBeliefIntensity}% | <strong>Emotion intensity:</strong> ${weed.newEmotionIntensity}/100</p>
                        ${weed.actionPlan ? `<p><strong>Action plan:</strong> ${weed.actionPlan}</p>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                    <details>
                        <summary style="cursor: pointer; font-weight: bold; color: #3498db;">
                            <i class="fas fa-search"></i> View Evidence Analysis
                        </summary>
                        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <p><strong>Supporting evidence:</strong> ${weed.supportingEvidence || 'None listed'}</p>
                            <p><strong>Challenging evidence:</strong> ${weed.challengingEvidence || 'None listed'}</p>
                        </div>
                    </details>
                </div>
                
                <div class="improvement-indicator">
                    ${this.renderImprovementIndicator(weed)}
                </div>
            </div>
        `;
    },

    getWeedTypeInfo(type) {
        const types = {
            'catastrophizing': { icon: '🌪️', name: 'Storm Clouds' },
            'all-or-nothing': { icon: '⚫', name: 'Black & White' },
            'mind-reading': { icon: '🔮', name: 'Crystal Ball' },
            'fortune-telling': { icon: '🎭', name: 'Fortune Teller' },
            'personalization': { icon: '🎯', name: 'Blame Brambles' },
            'should-statements': { icon: '📏', name: 'Should Shrubs' },
            'other': { icon: '🌱', name: 'Other Weed' }
        };
        return types[type] || types.other;
    },

    renderImprovementIndicator(weed) {
        const beliefImprovement = weed.beliefIntensity - weed.newBeliefIntensity;
        const emotionImprovement = weed.emotionIntensity - weed.newEmotionIntensity;

        let indicator = '';
        let color = '#95a5a6';

        if (beliefImprovement > 20 || emotionImprovement > 20) {
            indicator = '🌻 Significant growth';
            color = '#27ae60';
        } else if (beliefImprovement > 10 || emotionImprovement > 10) {
            indicator = '🌱 Good progress';
            color = '#f39c12';
        } else if (beliefImprovement > 0 || emotionImprovement > 0) {
            indicator = '🌿 Small step forward';
            color = '#3498db';
        } else {
            indicator = '🌰 Planted for future growth';
            color = '#95a5a6';
        }

        return `
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: ${color}20; border-radius: 8px; color: ${color}; font-weight: bold;">
                ${indicator}
            </div>
        `;
    }
};

// Make WeedTrackerPage available globally
window.WeedTrackerPage = WeedTrackerPage;