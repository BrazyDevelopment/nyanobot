// setrole.js
const { Permissions, PermissionsBitField  } = require('discord.js');
const fs = require('fs');
const { setRoleId, getRoleId, resolveRoleMention } = require('../utils.js'); // Import the necessary functions from utils.js

module.exports = {
    name: 'setrole',
    description: 'Set the role for Nyano updates',
    async execute(message, args, client, config) {
        console.log(`Received message: ${message.content}`);

        if (message.author.bot) return;

        if (message.content.startsWith(config.prefix + 'setrole')) {
            if (message.member.permissions.has('MANAGE_ROLES')) {
                const split = message.content.split(' ');

                if (split[1] === undefined) {
                    await message.channel.send(`Please provide a role id or mention`);
                    return;
                }

                const roleId = resolveRoleMention(split[1], message.guild);

                if (!roleId) {
                    await message.channel.send(`Invalid role id or mention`);
                    return;
                }

                // Update the role ID in the file
                setRoleId('src/data/roleIds.txt', message.guild.id, roleId);

                // Inform the user
                await message.channel.send(`Nyano updates will be sent to the role with ID ${roleId}`);
            } else {
                message.channel.send('You do not have the required permissions.');
            }
        }
    },
};
