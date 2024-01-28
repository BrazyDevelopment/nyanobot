// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json');
const { consoleLog } = require('../debug.js');
const { fetchUserAllData, client } = require('../nft_bot.js');
const { downloadAndSaveImage, setClient } = require('../utils.js');
const fs = require('fs').promises;

// Set up Discord client with specified intents
const prefix = config.prefix;

// Exported module containing the 'top' command
module.exports = {
    name: 'top',
    description: 'Display the top Nyano parsedDatas for a specific user.',
    setClient,

    // Execute function to handle the 'top' command
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if the message starts with the specified prefix and 'top' command
        if (message.content.startsWith(prefix + 'top')) {
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            // Check if the command is 'top'
            if (command === 'top') {
                const amount = parseInt(args[0]) || 10;
                const username = args[1];

                // Validate username presence
                if (!username) {
                    return message.reply('Please provide a username.');
                }

                // Limit the amount to 20
                if (amount > 20) {
                    return message.reply(`${message.author}, you have attempted to request more than 20 fields. Please use 20 or less.`);
                }

               // Fetch and process data from external APIs and CSV files
                const parsedData = await fetchUserAllData(username, 'mostRare');

                // Sort parsedData by rarityScore in descending order
                const sortedData = parsedData.sort((b, a) => b.rarityRank - a.rarityRank);

                // Prepare fields for embeddin
                const fields = sortedData.slice(0, amount).map((data, index) => {
                    // Construct individual field data
                    const Link = `https://nanswap.com/art/assets/${data.id}${config.referral}`
                    const baseField = {
                        name: `${index + 1}. **\`${data.name}\`**`,
                        value: `- ${emoji.Rank} **Rank:** \`${data.rarityRank}\`\n`,
                        inline: true,
                    };

                    // Add information based on bid and ask availability
                    if (!data.bestBid && data.bestAsk) {
                        baseField.value += `- ${emoji.Currency} **Price:** \`Ӿ${data.bestAsk}\`\n- ${emoji.Bidder} **Best Bid:** \`N/A\``;
                    } else if (!data.bestBid && !data.bestAsk) {
                        baseField.value += `- ${emoji.Currency} **Price:** \`N/A\`\n- ${emoji.Bidder} **Best Bid:** \`N/A\``;
                    } else if (data.bestBid && data.bestAsk) {
                        baseField.value += `- ${emoji.Currency} **Price:** \`Ӿ${data.bestAsk}\`\n- ${emoji.Bidder} **Best Bid:** \`Ӿ${data.bestBid}\``;
                    } else if (data.bestBid && !data.bestAsk) {
                        baseField.value += `- ${emoji.Currency} **Price:** \`N/A\`\n- ${emoji.Bidder} **Best Bid:** \`Ӿ${data.bestBid}\``;
                    } else {
                        consoleLog('Unknown State:', data);
                    }

                    // Add parsedData link to the field
                    baseField.value += `\n- ${emoji.Lock} **Link:** [View](${Link})`;

                    return baseField;
                });

                // Check if there is data to display
                if (sortedData.length > 0) {
                    // Generate image name and download image
                    const imageName = `${sortedData[0].id.replace(' ', '').replace('#', '-')}.png`;
                    const assetLocation = sortedData[0].location;
                    await downloadAndSaveImage(assetLocation, imageName);
                    consoleLog(imageName)
                    const collectionName = sortedData[0].placeholderName;
                    // Create and send Discord Embed
                    const Embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${emoji.Project} Top ${amount} ${collectionName} for ${username} on Nanswap Art!`)
                        .setDescription(`${emoji.GeneralInfo} Here are ${username}'s Top ${amount} collected ${collectionName}:`)
                        .addFields(fields)
                        .setURL(`https://nanswap.com/art/${username}${config.referral}`)
                        .setThumbnail(`attachment://${imageName}`)
                        .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676' })
                        .setTimestamp();

                    message.reply({
                        content: `${message.author}, here are the Top ${amount} Nyano ${collectionName} in ${username}'s collection.`,
                        embeds: [Embed],
                        files: [{ attachment: imageName, name: imageName }],
                    });
                } else {
                    // Inform user if no data found
                    message.reply(`${message.author}, There was no data found for the username: ${username}`);
                }
            }
        }
    },
};

// Log in with the provided Discord token
// client.login(config.token);