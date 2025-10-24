// Values Garden Design Page functionality
const ValuesGardenPage = {
    currentStep: 1,
    selectedValues: [],
    gardenAreas: {},

    init() {
        this.render();
        this.loadSavedData();
        this.setupEventListeners();
        // Update UI after loading saved data
        this.updateUIAfterLoad();
    },

    render() {
        const container = document.getElementById('values-garden-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-compass"></i> Values Garden Design</h1>
                <p>Design your personal growth garden around what matters most to you</p>
            </div>

            <div class="values-container">
                <!-- Progress Indicator -->
                <div class="progress-indicator">
                    <div class="progress-step ${this.currentStep >= 1 ? 'active' : ''}" data-step="1">
                        <i class="fas fa-heart"></i>
                        <span>Discover Values</span>
                    </div>
                    <div class="progress-step ${this.currentStep >= 2 ? 'active' : ''}" data-step="2">
                        <i class="fas fa-star"></i>
                        <span>Select Core Values</span>
                    </div>
                    <div class="progress-step ${this.currentStep >= 3 ? 'active' : ''}" data-step="3">
                        <i class="fas fa-seedling"></i>
                        <span>Design Garden</span>
                    </div>
                    <div class="progress-step ${this.currentStep >= 4 ? 'active' : ''}" data-step="4">
                        <i class="fas fa-compass"></i>
                        <span>Set Intentions</span>
                    </div>
                </div>

                <!-- Step Content -->
                <div class="step-content">
                    ${this.renderCurrentStep()}
                </div>

                <!-- Navigation Buttons -->
                <div class="step-navigation">
                    ${this.currentStep > 1 ? `
                        <button class="nav-btn prev-btn" onclick="ValuesGardenPage.previousStep()">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                    ` : ''}
                    
                    <div class="nav-center">
                        <span class="step-counter">Step ${this.currentStep} of 4</span>
                    </div>
                    
                    ${this.currentStep < 4 ? `
                        <button class="nav-btn next-btn" onclick="ValuesGardenPage.nextStep()">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    ` : `
                        <button class="nav-btn complete-btn" onclick="ValuesGardenPage.completeDesign()">
                            <i class="fas fa-check"></i> Complete Garden Design
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    renderCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.renderValuesDiscovery();
            case 2:
                return this.renderValueSelection();
            case 3:
                return this.renderGardenDesign();
            case 4:
                return this.renderIntentionSetting();
            default:
                return this.renderValuesDiscovery();
        }
    },

    renderValuesDiscovery() {
        return `
            <div class="values-discovery">
                <div class="discovery-header">
                    <h3><i class="fas fa-heart"></i> Discover Your Values</h3>
                    <p>Values are the fundamental beliefs and principles that guide your decisions and actions. Take time to reflect on what truly matters to you.</p>
                </div>

                <div class="values-categories">
                    <div class="category-section">
                        <h4><i class="fas fa-users"></i> Relationships & Connection</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Family', 'Friendship', 'Love', 'Community', 'Compassion', 'Empathy',
            'Trust', 'Loyalty', 'Communication', 'Intimacy', 'Support', 'Collaboration'
        ])}
                        </div>
                    </div>

                    <div class="category-section">
                        <h4><i class="fas fa-trophy"></i> Achievement & Growth</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Success', 'Excellence', 'Achievement', 'Learning', 'Growth', 'Mastery',
            'Innovation', 'Creativity', 'Progress', 'Challenge', 'Ambition', 'Recognition'
        ])}
                        </div>
                    </div>

                    <div class="category-section">
                        <h4><i class="fas fa-leaf"></i> Personal Well-being</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Health', 'Balance', 'Peace', 'Joy', 'Mindfulness', 'Self-care',
            'Wellness', 'Tranquility', 'Relaxation', 'Energy', 'Vitality', 'Harmony'
        ])}
                        </div>
                    </div>

                    <div class="category-section">
                        <h4><i class="fas fa-compass"></i> Character & Ethics</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Integrity', 'Honesty', 'Authenticity', 'Justice', 'Fairness', 'Respect',
            'Responsibility', 'Courage', 'Wisdom', 'Humility', 'Gratitude', 'Kindness'
        ])}
                        </div>
                    </div>

                    <div class="category-section">
                        <h4><i class="fas fa-globe"></i> Purpose & Contribution</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Purpose', 'Service', 'Contribution', 'Legacy', 'Impact', 'Meaning',
            'Spirituality', 'Faith', 'Hope', 'Generosity', 'Activism', 'Leadership'
        ])}
                        </div>
                    </div>

                    <div class="category-section">
                        <h4><i class="fas fa-rocket"></i> Freedom & Adventure</h4>
                        <div class="values-grid">
                            ${this.renderValueOptions([
            'Freedom', 'Independence', 'Adventure', 'Exploration', 'Spontaneity', 'Flexibility',
            'Variety', 'Travel', 'Discovery', 'Curiosity', 'Fun', 'Playfulness'
        ])}
                        </div>
                    </div>
                </div>

                <div class="custom-value-section">
                    <h4><i class="fas fa-plus"></i> Add Your Own Value</h4>
                    <div class="custom-value-input">
                        <input type="text" id="custom-value" placeholder="Enter a value that's important to you" maxlength="20">
                        <button onclick="ValuesGardenPage.addCustomValue()">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>

                <div class="discovery-summary">
                    <div class="selected-count">
                        <span id="selected-values-count">0</span> values selected
                    </div>
                    <div class="discovery-tip">
                        💡 <strong>Tip:</strong> Select any values that resonate with you. In the next step, you'll narrow down to your top 5 core values.
                    </div>
                </div>
            </div>
        `;
    },

    renderValueOptions(values) {
        return values.map(value => `
            <div class="value-option ${this.selectedValues.includes(value) ? 'selected' : ''}" 
                 data-value="${value}">
                ${value}
            </div>
        `).join('');
    },

    renderValueSelection() {
        const selectedInDiscovery = this.selectedValues.slice();

        return `
            <div class="value-selection">
                <div class="selection-header">
                    <h3><i class="fas fa-star"></i> Select Your Core Values</h3>
                    <p>From the ${selectedInDiscovery.length} values you selected, choose your top 5 core values. These will form the foundation of your garden design.</p>
                </div>

                <div class="core-values-selection">
                    <div class="available-values">
                        <h4>Available Values (${selectedInDiscovery.length})</h4>
                        <div class="values-list" id="available-values">
                            ${selectedInDiscovery.map(value => `
                                <div class="value-item" data-value="${value}">
                                    <span>${value}</span>
                                    <i class="fas fa-plus"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="core-values-selected">
                        <h4>Your Core Values (<span id="core-values-count">0</span>/5)</h4>
                        <div class="core-values-list" id="core-values-list">
                            <div class="empty-state">
                                Select up to 5 core values from the left
                            </div>
                        </div>
                    </div>
                </div>

                <div class="values-reflection">
                    <h4><i class="fas fa-lightbulb"></i> Reflection Questions</h4>
                    <div class="reflection-questions">
                        <div class="question">
                            <strong>Which values guide your most important decisions?</strong>
                        </div>
                        <div class="question">
                            <strong>What values do you want to be remembered for?</strong>
                        </div>
                        <div class="question">
                            <strong>Which values, when honored, make you feel most authentic?</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderGardenDesign() {
        const coreValues = this.getCoreValues();

        return `
            <div class="garden-design">
                <div class="design-header">
                    <h3><i class="fas fa-seedling"></i> Design Your Values Garden</h3>
                    <p>Create dedicated garden areas for each of your core values. Each area will help you focus your growth activities around what matters most.</p>
                </div>

                <div class="garden-areas-design">
                    ${coreValues.map((value, index) => `
                        <div class="garden-area-card" data-value="${value}">
                            <div class="area-header">
                                <div class="area-icon">
                                    ${this.getValueIcon(value)}
                                </div>
                                <h4>${value} Garden Area</h4>
                            </div>

                            <div class="area-design-fields">
                                <div class="field-group">
                                    <label>Garden Area Name</label>
                                    <input type="text" 
                                           class="area-name-input" 
                                           data-value="${value}"
                                           placeholder="e.g., Family Harmony Garden, Creative Expression Grove"
                                           value="${this.gardenAreas[value]?.name || ''}"
                                           onchange="ValuesGardenPage.updateAreaName('${value}', this.value)">
                                </div>

                                <div class="field-group">
                                    <label>Purpose & Vision</label>
                                    <textarea class="area-purpose-input" 
                                              data-value="${value}"
                                              placeholder="What does this garden area represent? What will you cultivate here?"
                                              onchange="ValuesGardenPage.updateAreaPurpose('${value}', this.value)">${this.gardenAreas[value]?.purpose || ''}</textarea>
                                </div>

                                <div class="field-group">
                                    <label>Growth Activities</label>
                                    <div class="activities-grid">
                                        ${this.renderActivitySuggestions(value)}
                                    </div>
                                    <div class="custom-activity">
                                        <input type="text" 
                                               class="custom-activity-input" 
                                               placeholder="Add your own activity"
                                               onkeypress="if(event.key==='Enter') ValuesGardenPage.addCustomActivity('${value}', this.value, this)">
                                        <button onclick="ValuesGardenPage.addCustomActivity('${value}', this.previousElementSibling.value, this.previousElementSibling)">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="garden-preview">
                    <h4><i class="fas fa-eye"></i> Garden Overview</h4>
                    <div class="garden-layout-preview">
                        ${coreValues.map(value => `
                            <div class="preview-area" data-value="${value}">
                                <div class="preview-icon">${this.getValueIcon(value)}</div>
                                <div class="preview-name">${this.gardenAreas[value]?.name || `${value} Garden`}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderActivitySuggestions(value) {
        const suggestions = this.getActivitySuggestions(value);
        const selectedActivities = this.gardenAreas[value]?.activities || [];

        return suggestions.map(activity => `
            <div class="activity-suggestion ${selectedActivities.includes(activity) ? 'selected' : ''}" 
                 data-value="${value}" 
                 data-activity="${activity}"
                 onclick="ValuesGardenPage.toggleActivity('${value}', '${activity}')">
                ${activity}
            </div>
        `).join('');
    },

    renderIntentionSetting() {
        const coreValues = this.getCoreValues();

        return `
            <div class="intention-setting">
                <div class="intention-header">
                    <h3><i class="fas fa-compass"></i> Set Your Growth Intentions</h3>
                    <p>For each garden area, set specific intentions and goals that align with your values. These will guide your daily growth activities.</p>
                </div>

                <div class="intentions-grid">
                    ${coreValues.map(value => `
                        <div class="intention-card" data-value="${value}">
                            <div class="intention-card-header">
                                <div class="intention-icon">${this.getValueIcon(value)}</div>
                                <h4>${this.gardenAreas[value]?.name || `${value} Garden`}</h4>
                            </div>

                            <div class="intention-fields">
                                <div class="field-group">
                                    <label>Current State</label>
                                    <textarea placeholder="How are you currently living this value? What's working well?"
                                              onchange="ValuesGardenPage.updateIntention('${value}', 'currentState', this.value)">${this.gardenAreas[value]?.currentState || ''}</textarea>
                                </div>

                                <div class="field-group">
                                    <label>Desired Growth</label>
                                    <textarea placeholder="How would you like to grow in this area? What would ideal look like?"
                                              onchange="ValuesGardenPage.updateIntention('${value}', 'desiredGrowth', this.value)">${this.gardenAreas[value]?.desiredGrowth || ''}</textarea>
                                </div>

                                <div class="field-group">
                                    <label>Specific Intentions (3-month goals)</label>
                                    <div class="intentions-list" id="intentions-${value}">
                                        ${(this.gardenAreas[value]?.intentions || []).map((intention, index) => `
                                            <div class="intention-item">
                                                <input type="text" value="${intention}" 
                                                       onchange="ValuesGardenPage.updateIntentionItem('${value}', ${index}, this.value)">
                                                <button onclick="ValuesGardenPage.removeIntention('${value}', ${index})">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                        <div class="add-intention">
                                            <input type="text" placeholder="Add a specific intention or goal"
                                                   onkeypress="if(event.key==='Enter') ValuesGardenPage.addIntention('${value}', this.value, this)">
                                            <button onclick="ValuesGardenPage.addIntention('${value}', this.previousElementSibling.value, this.previousElementSibling)">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="garden-commitment">
                    <h4><i class="fas fa-heart"></i> Your Garden Commitment</h4>
                    <div class="commitment-text">
                        <textarea id="garden-commitment" 
                                  placeholder="Write a personal commitment to yourself about how you'll tend to your values garden..."
                                  onchange="ValuesGardenPage.updateCommitment(this.value)">${this.getCommitment()}</textarea>
                    </div>
                </div>
            </div>
        `;
    },

    getActivitySuggestions(value) {
        const suggestions = {
            'Family': ['Family dinner', 'Game night', 'Family walks', 'Calls with relatives', 'Family traditions'],
            'Health': ['Exercise', 'Meditation', 'Healthy cooking', 'Sleep routine', 'Doctor visits'],
            'Learning': ['Read books', 'Take courses', 'Podcasts', 'Documentaries', 'Skill practice'],
            'Creativity': ['Art projects', 'Writing', 'Music', 'Crafts', 'Photography'],
            'Nature': ['Hiking', 'Gardening', 'Beach walks', 'Camping', 'Birdwatching'],
            'Friendship': ['Coffee dates', 'Group activities', 'Check-in calls', 'Shared hobbies', 'Support friends'],
            'Service': ['Volunteer work', 'Help neighbors', 'Mentoring', 'Donations', 'Community projects'],
            'Spirituality': ['Prayer', 'Meditation', 'Study texts', 'Spiritual community', 'Reflection'],
            'Adventure': ['Travel planning', 'Try new activities', 'Explore areas', 'New experiences', 'Adventure sports'],
            'Achievement': ['Goal setting', 'Skill building', 'Project work', 'Milestone tracking', 'Recognition'],
            'Peace': ['Quiet time', 'Mindfulness', 'Breathing exercises', 'Calm spaces', 'Stress management'],
            'Growth': ['Self-reflection', 'Feedback seeking', 'Challenge acceptance', 'Comfort zone expansion', 'Learning']
        };

        return suggestions[value] || ['Daily practice', 'Weekly review', 'Monthly planning', 'Quarterly assessment', 'Annual reflection'];
    },

    getValueIcon(value) {
        const icons = {
            'Family': '👨‍👩‍👧‍👦', 'Love': '💕', 'Friendship': '🤝', 'Community': '🏘️',
            'Health': '🌿', 'Wellness': '💪', 'Balance': '⚖️', 'Peace': '☮️',
            'Learning': '📚', 'Growth': '🌱', 'Wisdom': '🦉', 'Knowledge': '🧠',
            'Creativity': '🎨', 'Art': '🖼️', 'Music': '🎵', 'Innovation': '💡',
            'Nature': '🌳', 'Environment': '🌍', 'Animals': '🐾', 'Conservation': '♻️',
            'Service': '🤲', 'Helping': '🫱‍🫲', 'Charity': '❤️', 'Volunteering': '🙋‍♀️',
            'Spirituality': '🙏', 'Faith': '✨', 'Purpose': '🎯', 'Meaning': '🌟',
            'Adventure': '🗺️', 'Travel': '✈️', 'Exploration': '🧭', 'Discovery': '🔍',
            'Achievement': '🏆', 'Success': '📈', 'Excellence': '⭐', 'Mastery': '🥇',
            'Freedom': '🕊️', 'Independence': '🗽', 'Autonomy': '🚀', 'Choice': '🔄',
            'Integrity': '💎', 'Honesty': '🔍', 'Authenticity': '🎭', 'Truth': '📖',
            'Joy': '😊', 'Happiness': '☀️', 'Fun': '🎉', 'Laughter': '😄',
            'Courage': '🦁', 'Strength': '💪', 'Resilience': '🌊', 'Bravery': '⚔️',
            'Compassion': '🤗', 'Kindness': '💝', 'Empathy': '💞', 'Understanding': '🫂'
        };

        return icons[value] || '🌸';
    },

    setupEventListeners() {
        // Custom value input enter key
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'custom-value' && e.key === 'Enter') {
                this.addCustomValue();
            }
        });

        // Event delegation for value selection
        document.addEventListener('click', (e) => {
            // Handle value options in discovery step
            if (e.target.classList.contains('value-option') && e.target.dataset.value) {
                e.preventDefault();
                this.toggleValue(e.target.dataset.value);
                return;
            }

            // Handle core value selection in step 2
            if (e.target.classList.contains('value-item') && e.target.dataset.value) {
                e.preventDefault();
                this.selectCoreValue(e.target.dataset.value);
                return;
            }

            // Handle activity selection in garden design
            if (e.target.classList.contains('activity-suggestion') && e.target.dataset.activity && e.target.closest('[data-value]')) {
                e.preventDefault();
                const value = e.target.closest('[data-value]').dataset.value;
                const activity = e.target.dataset.activity;
                this.toggleActivity(value, activity);
                return;
            }
        });
    },

    loadSavedData() {
        if (!window.gardenStorage) return;

        const valuesData = window.gardenStorage.getSection('valuesGarden') || {};

        if (valuesData.selectedValues) {
            this.selectedValues = valuesData.selectedValues;
        }

        if (valuesData.gardenAreas) {
            this.gardenAreas = valuesData.gardenAreas;
        }

        if (valuesData.currentStep) {
            this.currentStep = valuesData.currentStep;
        }
    },

    updateUIAfterLoad() {
        // Update the UI to show previously selected values
        setTimeout(() => {
            // Update selected values display
            this.selectedValues.forEach(value => {
                this.updateValueDisplay(value);
            });

            // Update selected count if on discovery step
            if (this.currentStep === 1) {
                this.updateSelectedCount();
            }

            // Update core values display if on step 2
            if (this.currentStep === 2) {
                this.updateCoreValuesDisplay();
            }

            // Re-render if we're not on step 1 to ensure proper content
            if (this.currentStep > 1) {
                this.render();
            }
        }, 100); // Small delay to ensure DOM is ready
    },

    saveData() {
        if (!window.gardenStorage) return;

        const valuesData = {
            selectedValues: this.selectedValues,
            coreValues: this.getCoreValues(),
            gardenAreas: this.gardenAreas,
            currentStep: this.currentStep,
            lastUpdated: new Date().toISOString()
        };

        window.gardenStorage.saveSection('valuesGarden', valuesData);
    },

    toggleValue(value) {
        if (this.selectedValues.includes(value)) {
            this.selectedValues = this.selectedValues.filter(v => v !== value);
        } else {
            this.selectedValues.push(value);
        }

        this.updateValueDisplay(value);
        this.updateSelectedCount();
        this.saveData();
    },

    updateValueDisplay(value) {
        const element = document.querySelector(`[data-value="${value}"]`);
        if (element) {
            element.classList.toggle('selected', this.selectedValues.includes(value));
        }
    },

    updateSelectedCount() {
        const countElement = document.getElementById('selected-values-count');
        if (countElement) {
            countElement.textContent = this.selectedValues.length;
        }
    },

    addCustomValue() {
        const input = document.getElementById('custom-value');
        const value = input.value.trim();

        if (value && !this.selectedValues.includes(value)) {
            this.selectedValues.push(value);

            // Add to the last category
            const lastCategory = document.querySelector('.category-section:last-of-type .values-grid');
            if (lastCategory) {
                const valueElement = document.createElement('div');
                valueElement.className = 'value-option selected';
                valueElement.dataset.value = value;
                valueElement.textContent = value;
                valueElement.onclick = () => this.toggleValue(value);
                lastCategory.appendChild(valueElement);
            }

            input.value = '';
            this.updateSelectedCount();
            this.saveData();

            window.showNotification(`✨ Added "${value}" to your values!`);
        }
    },

    selectCoreValue(value) {
        const coreValues = this.getCoreValues();

        if (coreValues.length >= 5) {
            window.showNotification('You can only select 5 core values. Remove one first if you want to add another.', 'warning');
            return;
        }

        if (!coreValues.includes(value)) {
            // Initialize garden area for this value
            if (!this.gardenAreas[value]) {
                this.gardenAreas[value] = {
                    name: `${value} Garden`,
                    purpose: '',
                    activities: [],
                    currentState: '',
                    desiredGrowth: '',
                    intentions: []
                };
            }

            this.updateCoreValuesDisplay();
            this.saveData();
        }
    },

    removeCoreValue(value) {
        delete this.gardenAreas[value];
        this.updateCoreValuesDisplay();
        this.saveData();
    },

    getCoreValues() {
        return Object.keys(this.gardenAreas);
    },

    updateCoreValuesDisplay() {
        const coreValues = this.getCoreValues();
        const availableElement = document.getElementById('available-values');
        const coreElement = document.getElementById('core-values-list');
        const countElement = document.getElementById('core-values-count');

        if (availableElement) {
            const availableValues = this.selectedValues.filter(v => !coreValues.includes(v));
            availableElement.innerHTML = availableValues.map(value => `
                <div class="value-item" data-value="${value}">
                    <span>${value}</span>
                    <i class="fas fa-plus"></i>
                </div>
            `).join('');
        }

        if (coreElement) {
            if (coreValues.length === 0) {
                coreElement.innerHTML = '<div class="empty-state">Select up to 5 core values from the left</div>';
            } else {
                coreElement.innerHTML = coreValues.map(value => `
                    <div class="core-value-item" data-value="${value}">
                        <span>${this.getValueIcon(value)} ${value}</span>
                        <button onclick="ValuesGardenPage.removeCoreValue('${value}')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        if (countElement) {
            countElement.textContent = coreValues.length;
        }
    },

    toggleActivity(value, activity) {
        if (!this.gardenAreas[value]) {
            this.gardenAreas[value] = { activities: [] };
        }

        const activities = this.gardenAreas[value].activities || [];
        const index = activities.indexOf(activity);

        if (index > -1) {
            activities.splice(index, 1);
        } else {
            activities.push(activity);
        }

        this.gardenAreas[value].activities = activities;

        const element = document.querySelector(`[data-value="${value}"][data-activity="${activity}"]`);
        if (element) {
            element.classList.toggle('selected', activities.includes(activity));
        }

        this.saveData();
    },

    addCustomActivity(value, activity, inputElement) {
        if (!activity.trim()) return;

        if (!this.gardenAreas[value]) {
            this.gardenAreas[value] = { activities: [] };
        }

        if (!this.gardenAreas[value].activities.includes(activity)) {
            this.gardenAreas[value].activities.push(activity);

            // Add to the activities grid
            const activitiesGrid = inputElement.parentElement.previousElementSibling;
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-suggestion selected';
            activityElement.dataset.value = value;
            activityElement.dataset.activity = activity;
            activityElement.textContent = activity;
            activityElement.onclick = () => this.toggleActivity(value, activity);
            activitiesGrid.appendChild(activityElement);

            inputElement.value = '';
            this.saveData();

            window.showNotification(`✅ Added "${activity}" to ${value} garden!`);
        }
    },

    updateAreaName(value, name) {
        if (!this.gardenAreas[value]) this.gardenAreas[value] = {};
        this.gardenAreas[value].name = name;
        this.saveData();
    },

    updateAreaPurpose(value, purpose) {
        if (!this.gardenAreas[value]) this.gardenAreas[value] = {};
        this.gardenAreas[value].purpose = purpose;
        this.saveData();
    },

    updateIntention(value, field, content) {
        if (!this.gardenAreas[value]) this.gardenAreas[value] = {};
        this.gardenAreas[value][field] = content;
        this.saveData();
    },

    addIntention(value, intention, inputElement) {
        if (!intention.trim()) return;

        if (!this.gardenAreas[value]) this.gardenAreas[value] = {};
        if (!this.gardenAreas[value].intentions) this.gardenAreas[value].intentions = [];

        this.gardenAreas[value].intentions.push(intention);

        // Re-render the intentions list
        const intentionsList = document.getElementById(`intentions-${value}`);
        const addIntentionElement = intentionsList.querySelector('.add-intention');

        const intentionItem = document.createElement('div');
        intentionItem.className = 'intention-item';
        intentionItem.innerHTML = `
            <input type="text" value="${intention}" 
                   onchange="ValuesGardenPage.updateIntentionItem('${value}', ${this.gardenAreas[value].intentions.length - 1}, this.value)">
            <button onclick="ValuesGardenPage.removeIntention('${value}', ${this.gardenAreas[value].intentions.length - 1})">
                <i class="fas fa-times"></i>
            </button>
        `;

        intentionsList.insertBefore(intentionItem, addIntentionElement);
        inputElement.value = '';
        this.saveData();
    },

    updateIntentionItem(value, index, newIntention) {
        if (this.gardenAreas[value] && this.gardenAreas[value].intentions) {
            this.gardenAreas[value].intentions[index] = newIntention;
            this.saveData();
        }
    },

    removeIntention(value, index) {
        if (this.gardenAreas[value] && this.gardenAreas[value].intentions) {
            this.gardenAreas[value].intentions.splice(index, 1);
            // Re-render this step to update indices
            if (this.currentStep === 4) {
                this.render();
            }
            this.saveData();
        }
    },

    updateCommitment(commitment) {
        if (!this.gardenAreas._commitment) {
            this.gardenAreas._commitment = {};
        }
        this.gardenAreas._commitment.text = commitment;
        this.saveData();
    },

    getCommitment() {
        return this.gardenAreas._commitment?.text || '';
    },

    nextStep() {
        console.log(`NextStep called - Current step: ${this.currentStep}, Selected values: ${this.selectedValues.length}, Core values: ${this.getCoreValues().length}`);

        if (this.currentStep === 1 && this.selectedValues.length === 0) {
            window.showNotification('Please select at least one value before proceeding.', 'warning');
            return;
        }

        if (this.currentStep === 2 && this.getCoreValues().length === 0) {
            window.showNotification('Please select at least one core value before proceeding.', 'warning');
            return;
        }

        if (this.currentStep < 4) {
            this.currentStep++;
            this.render();
            this.saveData();

            // Scroll to top
            window.scrollTo(0, 0);

            console.log(`Advanced to step: ${this.currentStep}`);
        }
    },

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.render();
            this.saveData();

            // Scroll to top
            window.scrollTo(0, 0);
        }
    },

    completeDesign() {
        const coreValues = this.getCoreValues();

        if (coreValues.length === 0) {
            window.showNotification('Please select at least one core value to complete your garden design.', 'warning');
            return;
        }

        // Save completion timestamp
        this.gardenAreas._completion = {
            completed: true,
            timestamp: new Date().toISOString(),
            valuesCount: coreValues.length
        };

        this.saveData();

        // Show completion message
        const container = document.getElementById('values-garden-page');
        container.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="goHome()">
                    <i class="fas fa-arrow-left"></i> Back to Garden
                </button>
                <h1><i class="fas fa-check-circle"></i> Garden Design Complete!</h1>
                <p>Your values garden is ready to guide your growth journey</p>
            </div>

            <div class="completion-celebration">
                <div class="celebration-icon">🌈</div>
                <h2>Congratulations!</h2>
                <p>You've successfully designed your personal Values Garden with ${coreValues.length} core values as your foundation.</p>
                
                <div class="garden-summary">
                    <h3>Your Garden Areas</h3>
                    <div class="summary-areas">
                        ${coreValues.map(value => `
                            <div class="summary-area">
                                <div class="summary-icon">${this.getValueIcon(value)}</div>
                                <div class="summary-content">
                                    <h4>${this.gardenAreas[value]?.name || `${value} Garden`}</h4>
                                    <p>${this.gardenAreas[value]?.purpose || 'Your dedicated space for growing in this value.'}</p>
                                    <div class="activity-count">
                                        ${(this.gardenAreas[value]?.activities || []).length} growth activities
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="next-steps">
                    <h3>What's Next?</h3>
                    <div class="next-steps-grid">
                        <div class="next-step" onclick="showPage('daily-log')">
                            <i class="fas fa-calendar-day"></i>
                            <h4>Start Daily Logging</h4>
                            <p>Begin tracking your daily growth activities aligned with your values</p>
                        </div>
                        <div class="next-step" onclick="showPage('garden-visualization')">
                            <i class="fas fa-seedling"></i>
                            <h4>Watch Your Garden Grow</h4>
                            <p>See your values come to life as flowers in your living garden</p>
                        </div>
                        <div class="next-step" onclick="ValuesGardenPage.currentStep = 1; ValuesGardenPage.render();">
                            <i class="fas fa-edit"></i>
                            <h4>Edit Your Garden</h4>
                            <p>Revisit and refine your values and garden design anytime</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        window.showNotification('🎉 Your Values Garden design is complete! Your garden will now reflect your core values.', 'success');
    }
};

// Make ValuesGardenPage available globally
window.ValuesGardenPage = ValuesGardenPage;