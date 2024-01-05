// setalerts.js
const { setChannelToUpdate, setRoleId, resolveRoleMention } = require('../utils.js');
const { PermissionsBitField } = require('discord.js');
const allowedAlertTypes = ['sales', 'listings', 'transfers', 'offers'];

module.exports = {
    name: 'setalerts',
    description: 'Set channels and roles for Nyano updates',
    async execute(message, args, client, config) {
        if (message.author.bot) return;

        if (message.content.startsWith(config.prefix + 'setalerts'))  {

            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
                return message.channel.send('You do not have the required permissions.');
            }

            if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){

                if (args.length < 2) {
                    return message.channel.send('Please provide valid arguments.');
                }

                const alertType = args[0].toLowerCase(); // sales, listings, transfers
                // Check if the provided alert type is allowed
                if (!allowedAlertTypes.includes(alertType)) {
                    return message.channel.send('Invalid alert type. Please use "sales", "listings", "transfers", or "offers".');
                }
                const targetType = args[1].toLowerCase(); // channel, role

                // const split = message.content.split(' ');
                const targetId = args[2];

                if (!targetId) {
                    return message.channel.send(`Please provide a valid ${targetType} ID.`);
                }

                const guildId = message.guild.id;

                if (targetType === 'channel') {
                    const mentionedChannel = message.guild.channels.cache.get(targetId);
                    console.log('Channel ID:', targetId);
                    console.log('Mentioned Channel:', mentionedChannel);
                    // console.log('Bot Permissions:', mentionedChannel.permissionsFor(client.user));
                    if (!mentionedChannel) {
                        return message.channel.send('Invalid channel ID. Please provide a valid channel ID.');
                    }

                    setChannelToUpdate(`src/data/channels/${alertType}channelId.txt`, guildId, targetId);
                    return message.channel.send(`Nyano ${alertType} updates will be sent to ${mentionedChannel}`);
                } else if (targetType === 'role') {
                    const roleId = resolveRoleMention(targetId, message.guild);

                    setRoleId(`src/data/roles/${alertType}roleIds.txt`, guildId, roleId);

                    return message.channel.send(`Nyano ${alertType} updates will be sent to the role with ID ${roleId}`);
                } else {
                    return message.channel.send('Invalid target type. Please use "channel" or "role".');
                }
            }
        }
    },
};
