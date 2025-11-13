// PeaceTree MQTT Integration
// Connects to WLED devices via MQTT to set mood-based lighting presets

const PeaceTreeMQTT = {
    client: null,
    isConnected: false,
    connectionAttempted: false,

    // MQTT Configuration
    config: {
        host: 'takeoneworld.com',
        port: 9001,
        topic: 'peacetreedev/dondev/api',
        clientId: 'innergarden_' + Math.random().toString(16).substr(2, 8),
        username: 'dkimber1179',
        password: 'd0cz3n0!2025',
        useSSL: false,
        timeout: 10,
        keepAliveInterval: 60,
        cleanSession: true
    },

    init() {
        // Only attempt connection once per session
        if (this.connectionAttempted) return;
        this.connectionAttempted = true;

        try {
            // Skip connection if page is loaded over HTTPS and we're using insecure WebSocket
            if (window.location.protocol === 'https:' && !this.config.useSSL) {
                console.log('PeaceTree: Skipping MQTT connection - HTTPS page cannot connect to insecure WebSocket (ws://)');
                console.log('PeaceTree: Mood lighting disabled for this session');
                return;
            }

            // Debug: Check what's available
            console.log('PeaceTree: Checking for Paho MQTT library...');
            console.log('PeaceTree: typeof Paho:', typeof Paho);
            console.log('PeaceTree: typeof Messaging:', typeof Messaging);
            console.log('PeaceTree: window.Paho:', window.Paho);
            console.log('PeaceTree: window.Messaging:', window.Messaging);

            // Check if Paho MQTT is available (try different possible names)
            let mqttLib = null;
            if (typeof Paho !== 'undefined' && Paho && Paho.MQTT) {
                mqttLib = Paho.MQTT;
                console.log('PeaceTree: Using Paho.MQTT');
            } else if (typeof Messaging !== 'undefined' && Messaging && Messaging.Client) {
                mqttLib = Messaging;
                console.log('PeaceTree: Using Messaging (Paho alternative)');
            }

            if (!mqttLib) {
                console.log('PeaceTree: Paho MQTT library not loaded, mood lighting disabled');
                console.log('PeaceTree: Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('paho') || k.toLowerCase().includes('mqtt')));
                return;
            }

            console.log('PeaceTree: MQTT library found, attempting connection...');
            this.mqttLib = mqttLib; // Store reference for use in connect()
            this.connect();
        } catch (error) {
            console.log('PeaceTree: Failed to initialize MQTT connection:', error.message);
        }
    },

    connect() {
        try {
            console.log('PeaceTree: Attempting to connect to MQTT broker...');

            // Create Paho MQTT client using detected library
            if (this.mqttLib && this.mqttLib.Client) {
                // Use Paho.MQTT.Client
                this.client = new this.mqttLib.Client(
                    this.config.host,
                    this.config.port,
                    this.config.clientId
                );
            } else if (typeof Messaging !== 'undefined' && Messaging.Client) {
                // Use direct Messaging.Client (alternative Paho format)
                this.client = new Messaging.Client(
                    this.config.host,
                    this.config.port,
                    this.config.clientId
                );
            } else {
                throw new Error('No valid MQTT client constructor found');
            }

            // Set up callbacks
            this.client.onConnectionLost = (responseObject) => {
                this.isConnected = false;
                if (responseObject.errorCode !== 0) {
                    console.log('PeaceTree: Connection lost:', responseObject.errorMessage);
                }
            };

            this.client.onMessageArrived = (message) => {
                console.log('PeaceTree: Message received:', message.payloadString);
            };

            // Connection options
            const connectOptions = {
                timeout: this.config.timeout,
                keepAliveInterval: this.config.keepAliveInterval,
                cleanSession: this.config.cleanSession,
                useSSL: this.config.useSSL,
                userName: this.config.username,
                password: this.config.password,
                onSuccess: () => {
                    this.isConnected = true;
                    console.log('PeaceTree: ✅ Connected to MQTT broker successfully!');
                    console.log(`PeaceTree: Connection details:`);
                    console.log(`  - Host: ${this.config.host}:${this.config.port}`);
                    console.log(`  - Topic: ${this.config.topic}`);
                    console.log(`  - Username: ${this.config.username}`);
                    console.log(`  - SSL: ${this.config.useSSL}`);
                    console.log(`  - Client ID: ${this.config.clientId}`);
                    this.showConnectionStatus('Connected to PeaceTree lighting 🌳✨');
                },
                onFailure: (error) => {
                    this.isConnected = false;
                    console.log('PeaceTree: Connection failed:', error.errorMessage);
                    this.showConnectionStatus('PeaceTree lighting offline', 'warning');
                }
            };

            // Connect to MQTT broker
            this.client.connect(connectOptions);

        } catch (error) {
            console.log('PeaceTree: Error creating MQTT connection:', error.message);
            this.isConnected = false;
        }
    },

    disconnect() {
        if (this.client && this.isConnected) {
            try {
                this.client.disconnect();
                console.log('PeaceTree: Disconnected from MQTT broker');
            } catch (error) {
                console.log('PeaceTree: Error disconnecting:', error.message);
            }
        }
        this.isConnected = false;
        this.client = null;
    },

    /**
     * Sets mood-based lighting preset based on mood score (1-10)
     * @param {number} moodScore - User's mood rating from 1-10
     */
    setMoodLighting(moodScore) {
        console.log(`PeaceTree: 🎯 setMoodLighting() called with moodScore: ${moodScore}`);
        console.log(`PeaceTree: 🔗 Connection status: ${this.isConnected}`);
        console.log(`PeaceTree: 📡 Client exists: ${!!this.client}`);

        if (!this.isConnected || !this.client) {
            console.log('PeaceTree: ❌ Not connected - skipping mood lighting update');
            console.log(`PeaceTree: - isConnected: ${this.isConnected}`);
            console.log(`PeaceTree: - client: ${this.client}`);
            return false;
        }

        try {
            // Validate mood score
            const mood = parseInt(moodScore);
            if (isNaN(mood) || mood < 1 || mood > 10) {
                console.log('PeaceTree: Invalid mood score:', moodScore);
                return false;
            }

            // Calculate preset: mood mod 6, then map to presets 21-26
            const presetIndex = mood % 6; // 0-5
            const preset = 21 + presetIndex; // 21-26

            console.log(`PeaceTree: Mood calculation - Input: ${mood}, Index: ${presetIndex}, Preset: ${preset}`);

            // Create MQTT message
            const message = {
                ps: preset
            };

            const messageStr = JSON.stringify(message);

            console.log(`PeaceTree: Sending MQTT message to topic "${this.config.topic}"`);
            console.log(`PeaceTree: Message payload:`, message);
            console.log(`PeaceTree: JSON string:`, messageStr);
            console.log(`PeaceTree: Message length: ${messageStr.length} bytes`);

            // Create Paho MQTT message
            let pahoMessage;
            if (this.mqttLib && this.mqttLib.Message) {
                pahoMessage = new this.mqttLib.Message(messageStr);
            } else if (typeof Messaging !== 'undefined' && Messaging.Message) {
                pahoMessage = new Messaging.Message(messageStr);
            } else {
                throw new Error('No valid MQTT Message constructor found');
            }

            pahoMessage.destinationName = this.config.topic;
            pahoMessage.qos = 0;
            pahoMessage.retained = false;

            console.log(`PeaceTree: MQTT Message object created:`, {
                topic: pahoMessage.destinationName,
                payload: pahoMessage.payloadString || messageStr,
                qos: pahoMessage.qos,
                retained: pahoMessage.retained
            });

            // Publish to MQTT
            console.log(`PeaceTree: Attempting to publish message via MQTT...`);
            console.log(`PeaceTree: Client connected status: ${this.isConnected}`);
            console.log(`PeaceTree: Client object:`, this.client);

            try {
                this.client.send(pahoMessage);
                console.log(`PeaceTree: ✅ MQTT message sent successfully!`);
                console.log(`PeaceTree: Message details: Topic="${this.config.topic}", Payload="${messageStr}"`);
            } catch (sendError) {
                console.log(`PeaceTree: ❌ Failed to send MQTT message:`, sendError);
                throw sendError;
            }

            console.log(`PeaceTree: Successfully set mood lighting - Mood: ${mood}, Preset: ${preset}`);
            this.showConnectionStatus(`PeaceTree lighting updated (Preset ${preset}) 🌈`, 'success');

            return true;

        } catch (error) {
            console.log('PeaceTree: Error setting mood lighting:', error.message);
            this.showConnectionStatus('Error updating PeaceTree lighting', 'error');
            return false;
        }
    },

    /**
     * Shows connection status notification to user
     * @param {string} message - Status message
     * @param {string} type - Message type: 'success', 'warning', 'error', or default
     */
    showConnectionStatus(message, type = 'info') {
        if (window.showNotification) {
            const icons = {
                success: '✅',
                warning: '⚠️',
                error: '❌',
                info: '💡'
            };

            const icon = icons[type] || icons.info;
            window.showNotification(`${icon} ${message}`, type);
        } else {
            console.log(`PeaceTree Status: ${message}`);
        }
    },

    /**
     * Test connection by sending a test preset
     */
    testConnection() {
        if (!this.isConnected) {
            this.showConnectionStatus('PeaceTree not connected - cannot test', 'warning');
            return false;
        }

        console.log('PeaceTree: Testing connection with preset 21...');
        return this.setMoodLighting(1); // Will send preset 21
    },

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            attempted: this.connectionAttempted,
            host: this.config.host,
            port: this.config.port,
            topic: this.config.topic,
            username: this.config.username
        };
    }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other scripts are loaded
    setTimeout(() => {
        PeaceTreeMQTT.init();
    }, 1000);
});

// Make PeaceTreeMQTT available globally
window.PeaceTreeMQTT = PeaceTreeMQTT;