// Import configuration settings
const config = require('./config/config.json');

// Function to log messages to the console if debug mode is enabled
function consoleLog(message) {
    // Check if debug mode is enabled in the configuration
    if (config.debug) {
        console.log(message);
    } else {
        // If debug mode is disabled, do nothing
        return;
    }
}

// Function to log errors to the console if debug mode is enabled
function consoleError(error) {
    // Check if debug mode is enabled in the configuration
    if (config.debug) {
        console.error(error);
    } else {
        // If debug mode is disabled, do nothing
        return;
    }
}

// Export log functions as a module
module.exports = {
    consoleLog: consoleLog,
    consoleError: consoleError,
};
