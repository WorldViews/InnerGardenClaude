// Application initialization
document.addEventListener('DOMContentLoaded', function () {
    try {
        window.gardenStorage = new GardenStorage();
        window.gardenApp = new GardenApp();
        console.log('🌱 Inner Garden Tracker initialized successfully!');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});