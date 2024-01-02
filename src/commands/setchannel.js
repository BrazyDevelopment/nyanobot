const {setChannelToUpdate}  = require('../utils.js'); // ignore 
const { Permissions, PermissionsBitField  } = require('discord.js');

// Define the setchannel command
module.exports = {
    name: 'setchannel',
    description: 'Set the channel for Nyano updates',
    // Include the config object as a parameter ?
    async execute(message, args, client, config) {
        console.log(`Received message: ${message.content}`);
        // Check if the message is sent by a bot
        if (message.author.bot) return;

        // Check if the message starts with the correct command
        if (message.content.startsWith(config.prefix + 'setchannel')) {

            
            console.log(`${__dirname}`)
            // Check if the user has the required permissions
            if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
                // if (true){
                    // Prompt the user for a channel ID
                    const split = message.content.split(' ')
                    if (split[1] === undefined){
                    await message.channel.send('Please follow the instructions carefully.\n\nFirst perform the command **`!setchannel <ChannelID>`** - remove the **`< >`** and input your Channel ID.\n\nYou can retrieve this by turning Discord Developer Mode on and right-clicking your chosen channel and selecting **"Copy Channel ID"**.')
                    return
                }
                const channelId = split[1];

                const mentionedChannel = message.guild.channels.cache.get(channelId);

                if (mentionedChannel) {
                    // Get the guild ID along with the channel ID
                    const guildId = message.guild.id;
                    const channelToUpdate = channelId;

                    
                    // Update the channel info in the file
                    setChannelToUpdate('src/data/channelId.txt', guildId, channelToUpdate)
                    fs.writeFileSync('src/data/channelId.txt', JSON.stringify(channelToUpdate));
             
                    // Inform the user
                    await message.channel.send(`Nyano updates will be sent to ${mentionedChannel}`);
                    await message.channel.send('Next you need to perform the `!setrole <roleID>` command. You can just mention the role instead if you like.');
                } else {
                    await message.channel.send('Invalid channel ID. Please provide a valid channel ID.');
                }

                // collector.stop();
                
            } else {
                message.channel.send('You do not have the required permissions.');
                // Inform the user about insufficient permissions
            }
        }
    },
};
