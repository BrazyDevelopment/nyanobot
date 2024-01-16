// setalerts.js

// Import necessary modules and functions
const { setChannelToUpdate, setRoleId, resolveRoleMention } = require('../utils.js');
const { PermissionsBitField } = require('discord.js');
const { consoleLog, consoleError } = require('../debug.js');

// Define allowed alert types
const allowedAlertTypes = ['sales', 'listings', 'transfers', 'offers'];

// Export the module
module.exports = {
    name: 'setalerts',
    description: 'Set channels and roles for Nyano updates',

    // Execute function to handle 'setalerts' command
    async execute(message, args, client, config) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if the message starts with the 'setalerts' command
        if (message.content.startsWith(config.prefix + 'setalerts'))  {

            // Check if the user has the 'Manage Channels' permission
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
                return message.channel.send('You do not have the required permissions.');
            }

            // Continue only if the user has the 'Manage Channels' permission
            if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){

                // Check if there are enough arguments provided
                if (args.length < 2) {
                    return message.channel.send('Please provide valid arguments.');
                }

                // Extract alert type, target type, and target ID from arguments
                const alertType = args[0].toLowerCase();
                
                // Check if the provided alert type is valid
                if (!allowedAlertTypes.includes(alertType)) {
                    return message.channel.send('Invalid alert type. Please use "sales", "listings", "transfers", or "offers".');
                }
                const targetType = args[1].toLowerCase();

                const targetId = args[2];

                // Check if a target ID is provided
                if (!targetId) {
                    return message.channel.send(`Please provide a valid ${targetType} ID.`);
                }

                // Get the guild ID from the message
                const guildId = message.guild.id;

                // Process based on target type (channel or role)
                if (targetType === 'channel') {
                    // Get the mentioned channel from the guild's cache
                    const mentionedChannel = message.guild.channels.cache.get(targetId);

                    // Check if the mentioned channel is valid
                    if (!mentionedChannel) {
                        return message.channel.send('Invalid channel ID. Please provide a valid channel ID.');
                    }

                    // Update the channel for Nyano updates
                    setChannelToUpdate(`src/data/channels/${alertType}channelId.txt`, guildId, targetId);

                    return message.channel.send(`Nyano ${alertType} updates will be sent to ${mentionedChannel}`);
                } else if (targetType === 'role') {
                    // Resolve the role mention to get the role ID
                    const roleId = resolveRoleMention(targetId, message.guild);

                    // Update the role for Nyano updates
                    setRoleId(`src/data/roles/${alertType}roleIds.txt`, guildId, roleId);

                    return message.channel.send(`Nyano ${alertType} updates will be sent to the role with ID ${roleId}`);
                } else {
                    return message.channel.send('Invalid target type. Please use "channel" or "role".');
                }
            }
        }
    },
};
