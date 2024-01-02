const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const fs = require('fs');

function getRoleId(filePath, guildId) {
    try {
        const fileContent = readChannelFile(filePath);
        const roleData = fileContent.find(entry => entry.guildId === guildId);
        return roleData ? roleData.roleId : null;
    } catch (error) {
        console.error('Error reading role ID file:', error);
        return null;
    }
}

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
        console.log('Role ID Updated!');
    } catch (error) {
        console.error('Error writing role ID file: ', error);
    }
}

function resolveRoleMention(mention, guild) {
    const matches = mention.match(/^<@&(\d+)>$/);
    if (!matches) return null;

    const roleId = matches[1];
    const role = guild.roles.cache.get(roleId);
    return role ? role.id : null;
}

function getChannelToUpdate(filePath) {
    try {
        const fileContent = readChannelFile(filePath);
        // console.log('File content:', fileContent);
        const channelsToUpdate = fileContent;

        // console.log(`Updating channel for ${channelsToUpdate.guildId}`);
        // console.log('Read channel ID:', channelToUpdate.channelId);

        return channelsToUpdate;
    } catch (error) {
        console.error('Error reading channel ID:', error);
        return { error: 'Failed to read channel ID file.' };
    }
}

function setChannelToUpdate(filePath, guildId, channelId) {
    try {
        let channels = readChannelFile(filePath)
        if (!Array.isArray(channels)){
            channels = [];
        }
        const existingChannelIndex = channels.findIndex(entry => entry.guildId === guildId && entry.channelId);
        // console.log({guildId})
        // console.log({channels})
        console.log({existingChannelIndex})

        if (existingChannelIndex !== -1) {
            channels[existingChannelIndex].channelId = channelId;
        } else {
            channels.push({ guildId, channelId });
        }

        writeChannelFile(filePath, channels);
        console.log('Channel ID Updated!')
    } catch (error) {
            console.error('Error writing channel ID file: ', error);
    }
}

function getLastProcessedIds(filePath) {
    try {
        const fileContent = readChannelFile(filePath);
        return JSON.parse(fileContent) || [];
    } catch (error) {
        console.error('Error reading last processed IDs:', error.message);
        return [];
    }
}

function setLastProcessedIds(filePath, lastProcessedIds) {
    try {
        writeChannelFile(filePath, JSON.stringify(lastProcessedIds));
        console.log('Last processed IDs updated successfully.');
    } catch (error) {
        console.error('Error updating last processed IDs:', error);
    }
}

function setLastProcessedIds(filePath, lastProcessedIds) {
    try {
        writeChannelFile(filePath, JSON.stringify(lastProcessedIds));
        console.log('Last processed IDs updated successfully.');
    } catch (error) {
        console.error('Error updating last processed IDs:', error);
    }
}

function readChannelFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent) || {};
    } catch (error) {
        // Handle the case when the file does not exist or is not valid JSON
        return {};
    }
}

function writeChannelFile(filePath, channels) {
    fs.writeFileSync(filePath, JSON.stringify(channels), null, 2);
}

// exports
module.exports = {
    getChannelToUpdate: getChannelToUpdate,
    setChannelToUpdate: setChannelToUpdate,
    getLastProcessedIds: getLastProcessedIds,
    setLastProcessedIds: setLastProcessedIds,
    writeChannelFile: writeChannelFile,
    readChannelFile: readChannelFile,
    getRoleId: getRoleId,
    setRoleId: setRoleId,
    resolveRoleMention: resolveRoleMention,
}