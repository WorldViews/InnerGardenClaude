// Garden Visualization functionality
const GardenVisualization = {
    canvas: null,
    ctx: null,
    animationId: null,
    flowers: [],

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return false;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.offsetWidth || 800;
        this.canvas.height = 400;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '400px';
        this.canvas.style.borderRadius = '15px';
        this.canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 50%, #228B22 100%)';

        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Handle canvas resizing
        window.addEventListener('resize', () => this.handleResize(container));

        this.loadGardenData();
        this.startAnimation();

        return true;
    },

    handleResize(container) {
        this.canvas.width = container.offsetWidth || 800;
        this.canvas.height = 400;
        this.loadGardenData(); // Recalculate positions
    },

    loadGardenData() {
        if (!window.gardenStorage) return;

        const dailyLogs = window.gardenStorage.getSection('dailyLogs') || {};
        const weedTracker = window.gardenStorage.getSection('weedTracker') || {};

        this.flowers = [];

        // Create flowers from seeds (daily log entries)
        Object.entries(dailyLogs).forEach(([date, log]) => {
            if (log.seeds && log.seeds.length > 0) {
                log.seeds.forEach((seed, index) => {
                    const daysOld = this.getDaysSince(date);
                    const flower = this.createFlowerFromSeed(seed, date, daysOld, index);
                    this.flowers.push(flower);
                });
            }

            // Add gratitude flowers
            if (log.gratitude && log.gratitude.length > 0) {
                log.gratitude.forEach((gratitude, index) => {
                    const daysOld = this.getDaysSince(date);
                    const flower = this.createGratitudeFlower(gratitude, date, daysOld, index + 100);
                    this.flowers.push(flower);
                });
            }
        });

        // Create wisdom flowers from weed transformations
        Object.values(weedTracker).forEach((weed, index) => {
            const daysOld = this.getDaysSince(weed.date);
            const improvement = (weed.beliefIntensity - weed.newBeliefIntensity) +
                (weed.emotionIntensity - weed.newEmotionIntensity);
            const wisdomFlower = this.createWisdomFlower(weed, daysOld, improvement, index);
            this.flowers.push(wisdomFlower);
        });

        // Sort flowers by age for layered rendering
        this.flowers.sort((a, b) => b.age - a.age);
    },

    createFlowerFromSeed(seed, date, age, index) {
        return {
            id: `seed-${date}-${index}`,
            type: 'seed',
            text: seed.text,
            date: date,
            age: age,
            x: this.getFlowerPosition(seed.text + date + index).x,
            y: this.getFlowerPosition(seed.text + date + index).y,
            growth: Math.min(age / 7, 1), // Full growth in 7 days
            color: this.getFlowerColor('seed', age),
            size: Math.min(20 + age * 3, 50),
            swayOffset: Math.random() * Math.PI * 2,
            originalY: 0
        };
    },

    createGratitudeFlower(gratitude, date, age, index) {
        return {
            id: `gratitude-${date}-${index}`,
            type: 'gratitude',
            text: gratitude.text,
            date: date,
            age: age,
            x: this.getFlowerPosition(gratitude.text + date + index).x,
            y: this.getFlowerPosition(gratitude.text + date + index).y,
            growth: Math.min(age / 5, 1), // Gratitude flowers grow faster
            color: this.getFlowerColor('gratitude', age),
            size: Math.min(15 + age * 2, 40),
            swayOffset: Math.random() * Math.PI * 2,
            originalY: 0
        };
    },

    createWisdomFlower(weed, age, improvement, index) {
        return {
            id: `wisdom-${weed.date}-${index}`,
            type: 'wisdom',
            text: weed.balancedThought,
            date: weed.date,
            age: age,
            improvement: improvement,
            x: this.getFlowerPosition(weed.balancedThought + weed.date + index).x,
            y: this.getFlowerPosition(weed.balancedThought + weed.date + index).y,
            growth: Math.min(age / 10 + improvement / 100, 1),
            color: this.getFlowerColor('wisdom', improvement),
            size: Math.min(25 + improvement * 2, 60),
            swayOffset: Math.random() * Math.PI * 2,
            originalY: 0
        };
    },

    getFlowerPosition(seedText) {
        // Use hash of text to get consistent but distributed positions
        let hash = 0;
        for (let i = 0; i < seedText.length; i++) {
            const char = seedText.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        const x = Math.abs(hash % (this.canvas.width - 100)) + 50;
        const groundLevel = this.canvas.height - 50;
        const y = groundLevel - Math.abs(hash % 100);

        return { x, y };
    },

    getDaysSince(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getFlowerColor(type, ageOrImprovement) {
        switch (type) {
            case 'seed':
                if (ageOrImprovement < 3) return '#90EE90'; // Light green for sprouts
                if (ageOrImprovement < 7) return '#FFB6C1'; // Pink for growing
                return '#FF69B4'; // Hot pink for mature
            case 'gratitude':
                if (ageOrImprovement < 2) return '#FFE4B5'; // Moccasin for young
                if (ageOrImprovement < 5) return '#FFA500'; // Orange for growing
                return '#FF4500'; // Red-orange for mature
            case 'wisdom':
                if (ageOrImprovement < 20) return '#DDA0DD'; // Plum for small improvement
                if (ageOrImprovement < 50) return '#9370DB'; // Medium orchid
                return '#6A5ACD'; // Slate blue for high improvement
            default:
                return '#98FB98';
        }
    },

    startAnimation() {
        const animate = (timestamp) => {
            this.draw(timestamp);
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    },

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    draw(timestamp) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient (sky to grass)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.7, '#98FB98'); // Pale green
        gradient.addColorStop(1, '#228B22'); // Forest green

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun
        this.drawSun();

        // Draw ground
        this.drawGround();

        // Draw flowers with gentle swaying
        this.flowers.forEach(flower => {
            this.drawFlower(flower, timestamp);
        });

        // Draw butterflies at a pleasant frequency
        if (Math.random() < 0.008) { // Reduced from 0.1 (10%) to 0.008 (0.8%)
            this.drawButterfly(timestamp);
        }

        // Add floating sparkles for more life
        if (Math.random() < 0.02) {
            this.drawSparkle(timestamp);
        }
    },

    drawSun() {
        const sunX = this.canvas.width - 80;
        const sunY = 60;
        const sunRadius = 30;

        // Sun rays
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startX = sunX + Math.cos(angle) * (sunRadius + 10);
            const startY = sunY + Math.sin(angle) * (sunRadius + 10);
            const endX = sunX + Math.cos(angle) * (sunRadius + 20);
            const endY = sunY + Math.sin(angle) * (sunRadius + 20);

            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }

        // Sun body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawGround() {
        const groundY = this.canvas.height - 30;

        // Grass texture
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, groundY, this.canvas.width, 30);

        // Add grass blades
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 2;
        for (let x = 0; x < this.canvas.width; x += 10) {
            const bladeHeight = 5 + Math.random() * 10;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.canvas.height);
            this.ctx.lineTo(x + Math.random() * 4 - 2, this.canvas.height - bladeHeight);
            this.ctx.stroke();
        }
    },

    drawFlower(flower, timestamp) {
        if (flower.growth <= 0) return;

        // Make swaying slower - reduced speed by factor of 3 (0.002 → 0.0007)
        const swayAmount = Math.sin((timestamp * 0.0007) + flower.swayOffset) * 8;
        const x = flower.x + swayAmount;
        const y = flower.y;

        // Draw stem with more pronounced curve
        const stemHeight = flower.size * flower.growth;
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, this.canvas.height - 30);
        this.ctx.quadraticCurveTo(x + swayAmount * 3, y + stemHeight / 2, x, y);
        this.ctx.stroke();

        // Draw leaves
        if (flower.growth > 0.3) {
            this.drawLeaves(x, y + stemHeight * 0.7, swayAmount);
        }

        // Draw flower head based on type
        if (flower.growth > 0.5) {
            switch (flower.type) {
                case 'seed':
                    this.drawSeedFlower(x, y, flower);
                    break;
                case 'gratitude':
                    this.drawGratitudeFlower(x, y, flower);
                    break;
                case 'wisdom':
                    this.drawWisdomFlower(x, y, flower);
                    break;
            }
        } else {
            // Draw bud
            this.drawBud(x, y, flower);
        }
    },

    drawLeaves(x, y, swayAmount) {
        this.ctx.fillStyle = '#32CD32';

        // Left leaf - ensure positive radii
        this.ctx.beginPath();
        this.ctx.ellipse(x - 8 + swayAmount, y, Math.abs(6), Math.abs(12), -0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Right leaf - ensure positive radii
        this.ctx.beginPath();
        this.ctx.ellipse(x + 8 + swayAmount, y, Math.abs(6), Math.abs(12), 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawSeedFlower(x, y, flower) {
        const petalCount = 5;
        const petalSize = Math.max(0, flower.size * 0.3 * flower.growth);

        // Draw petals
        this.ctx.fillStyle = flower.color;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * petalSize * 0.7;
            const petalY = y + Math.sin(angle) * petalSize * 0.7;

            this.ctx.beginPath();
            this.ctx.ellipse(petalX, petalY, Math.abs(petalSize), Math.abs(petalSize * 1.5), angle, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw center
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.abs(petalSize * 0.4), 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawGratitudeFlower(x, y, flower) {
        const petalCount = 8;
        const petalSize = Math.max(0, flower.size * 0.25 * flower.growth);

        // Draw petals in a daisy pattern
        this.ctx.fillStyle = flower.color;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * petalSize;
            const petalY = y + Math.sin(angle) * petalSize;

            this.ctx.beginPath();
            this.ctx.ellipse(petalX, petalY, Math.abs(petalSize * 0.3), Math.abs(petalSize), angle, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw center
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.abs(petalSize * 0.5), 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawWisdomFlower(x, y, flower) {
        const layers = 3;
        const baseSize = Math.max(0, flower.size * 0.2 * flower.growth);

        // Draw multiple layers for complexity
        for (let layer = 0; layer < layers; layer++) {
            const layerSize = Math.max(0, baseSize * (1 - layer * 0.3));
            const petalCount = 6 + layer * 2;
            const opacity = 1 - layer * 0.3;

            // Adjust color opacity
            const color = flower.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            this.ctx.fillStyle = color;

            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2 + layer * 0.2;
                const petalX = x + Math.cos(angle) * layerSize * (0.8 + layer * 0.2);
                const petalY = y + Math.sin(angle) * layerSize * (0.8 + layer * 0.2);

                this.ctx.beginPath();
                this.ctx.ellipse(petalX, petalY, Math.abs(layerSize * 0.4), Math.abs(layerSize * 1.2), angle, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Draw wisdom center
        this.ctx.fillStyle = '#4B0082';
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.abs(baseSize * 0.3), 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawBud(x, y, flower) {
        const budSize = Math.max(0, flower.size * 0.2 * flower.growth);

        this.ctx.fillStyle = '#90EE90';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, Math.abs(budSize), Math.abs(budSize * 1.5), 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Add some detail lines
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x - budSize * 0.5, y - budSize);
        this.ctx.lineTo(x + budSize * 0.5, y + budSize);
        this.ctx.moveTo(x + budSize * 0.5, y - budSize);
        this.ctx.lineTo(x - budSize * 0.5, y + budSize);
        this.ctx.stroke();
    },

    drawButterfly(timestamp) {
        const butterflyX = 50 + Math.sin(timestamp * 0.00015) * (this.canvas.width - 100); // Slowed down by factor of 5 (0.0007 → 0.00015)
        const butterflyY = 100 + Math.cos(timestamp * 0.0002) * 50; // Slowed down by factor of 5 (0.001 → 0.0002)
        const wingFlap = Math.sin(timestamp * 0.0008) * 0.3; // Slowed down by factor of 4 (0.003 → 0.0008)

        // Butterfly body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(butterflyX - 1, butterflyY - 8, 2, 16);

        // Wings
        this.ctx.fillStyle = '#FF69B4';

        // Upper wings - ensure positive radii
        this.ctx.beginPath();
        this.ctx.ellipse(butterflyX - 4, butterflyY - 4 + wingFlap, Math.abs(6), Math.abs(8), -0.3 + wingFlap, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(butterflyX + 4, butterflyY - 4 + wingFlap, Math.abs(6), Math.abs(8), 0.3 - wingFlap, 0, Math.PI * 2);
        this.ctx.fill();

        // Lower wings - ensure positive radii
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.ellipse(butterflyX - 3, butterflyY + 4 - wingFlap, Math.abs(4), Math.abs(6), -0.2 - wingFlap, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.ellipse(butterflyX + 3, butterflyY + 4 - wingFlap, Math.abs(4), Math.abs(6), 0.2 + wingFlap, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawSparkle(timestamp) {
        const sparkleX = Math.random() * this.canvas.width;
        const sparkleY = 50 + Math.random() * (this.canvas.height - 100);
        const sparkleSize = 2 + Math.random() * 3;
        const opacity = 0.3 + Math.sin(timestamp * 0.003) * 0.3; // Slowed down by factor of 3

        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Add cross sparkle effect
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(sparkleX - sparkleSize * 2, sparkleY);
        this.ctx.lineTo(sparkleX + sparkleSize * 2, sparkleY);
        this.ctx.moveTo(sparkleX, sparkleY - sparkleSize * 2);
        this.ctx.lineTo(sparkleX, sparkleY + sparkleSize * 2);
        this.ctx.stroke();
    },

    showFlowerTooltip(event) {
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Check if mouse is over a flower
        const flower = this.flowers.find(f => {
            const distance = Math.sqrt((mouseX - f.x) ** 2 + (mouseY - f.y) ** 2);
            return distance < f.size * 0.5;
        });

        if (flower) {
            const tooltip = `${flower.type.charAt(0).toUpperCase() + flower.type.slice(1)}: ${flower.text.substring(0, 50)}${flower.text.length > 50 ? '...' : ''}\nPlanted: ${flower.date}\nAge: ${flower.age} days`;

            // You could show a custom tooltip here
            this.canvas.title = tooltip;
        } else {
            this.canvas.title = '';
        }
    },

    destroy() {
        this.stopAnimation();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        window.removeEventListener('resize', this.handleResize);
    }
};

// Make GardenVisualization available globally
window.GardenVisualization = GardenVisualization;