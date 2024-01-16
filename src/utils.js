// Import necessary modules
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const { consoleLog, consoleError } = require('./debug.js');

// Function to get role ID from a file based on guild ID
function getRoleId(filePath, guildId) {
    try {
        const fileContent = readChannelFile(filePath);
        const roleData = fileContent.find(entry => entry.guildId === guildId);
        return roleData ? roleData.roleId : null;
    } catch (error) {
        consoleError('Error reading role ID file:', error);
        return null;
    }
}

// Function to set role ID in a file based on guild ID
function setRoleId(filePath, guildId, roleId) {
    try {
        let channels = readChannelFile(filePath);
        if (!Array.isArray(channels)) {
            channels = [];
        }

        const existingGuildIndex = channels.findIndex(entry => entry.guildId === guildId);

        if (existingGuildIndex !== -1) {
            channels[existingGuildIndex].roleId = roleId;
        } else {
            channels.push({ guildId, roleId });
        }

        writeChannelFile(filePath, channels);
        consoleLog('Role ID Updated!');
    } catch (error) {
        consoleError('Error writing role ID file: ', error);
    }
}

// Function to resolve a role mention to a role ID
function resolveRoleMention(mention, guild) {
    const matches = mention.match(/^<@&(\d+)>$/);
    if (!matches) return null;

    const roleId = matches[1];
    const role = guild.roles.cache.get(roleId);

    return role ? role.id : null;
}

// Function to download and save an image
async function downloadAndSaveImage(url, filename) {
    // Check if image already exists in cache
    if (fs.existsSync(filename)) {
        consoleLog("cache hit for " + filename);
        return;
    }

    consoleLog("cache miss for " + filename);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(filename, Buffer.from(response.data, 'binary'));
}

// Function to read CSV files and populate data structures
function readCSV(fileData, imageData) {
    return new Promise((resolve, reject) => {
        fs.createReadStream('src/data/attributes/rarity.csv')
            .pipe(csv())
            .on('data', (row) => {
                const fileNumber = parseInt(row['File Number']);
                if (!isNaN(fileNumber)) {
                    fileData[fileNumber] = {
                        rarity: parseFloat(row['Rarity Score']),
                        position: parseInt(row['Position']),
                    };
                }
            })
            .on('end', () => {
                fs.createReadStream('src/data/attributes/assets-id-name.csv')
                    .pipe(csv())
                    .on('data', (row) => {
                        const fileNumber = parseInt(row['name'].split('#')[1]);
                        imageData[fileNumber] = {
                            id: row['id'],
                            location: row['location'],
                            name: row['name'],
                        };
                    })
                    .on('end', () => {
                        consoleLog('CSV files successfully processed.');
                        resolve();
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Function to get channels to update based on file data
function getChannelToUpdate(filePath) {
    try {
        const fileContent = readChannelFile(filePath);

        const channelsToUpdate = fileContent;

        return channelsToUpdate;
    } catch (error) {
        consoleError('Error reading channel ID:', error);
        return { error: 'Failed to read channel ID file.' };
    }
}

// Function to set channels to update based on guild and channel IDs
function setChannelToUpdate(filePath, guildId, channelId) {
    try {
        let channels = readChannelFile(filePath)
        if (!Array.isArray(channels)) {
            channels = [];
        }
        const existingChannelIndex = channels.findIndex(entry => entry.guildId === guildId && entry.channelId);

        if (existingChannelIndex !== -1) {
            channels[existingChannelIndex].channelId = channelId;
        } else {
            channels.push({ guildId, channelId });
        }
        writeChannelFile(filePath, channels);

    } catch (error) {
        consoleError('Error writing channel ID file: ', error);
    }
}

// Function to read data from a channel file
function readChannelFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent) || {};
    } catch (error) {
        return {};
    }
}

// Function to write data to a channel file
function writeChannelFile(filePath, channels) {
    fs.writeFileSync(filePath, JSON.stringify(channels), null, 2);
}

// Export all functions as a module
module.exports = {
    getChannelToUpdate: getChannelToUpdate,
    setChannelToUpdate: setChannelToUpdate,
    writeChannelFile: writeChannelFile,
    readChannelFile: readChannelFile,
    getRoleId: getRoleId,
    setRoleId: setRoleId,
    resolveRoleMention: resolveRoleMention,
    downloadAndSaveImage: downloadAndSaveImage,
    readCSV: readCSV,
};
