const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json')
const { downloadAndSaveImage, readCSV, setClient } = require('../utils.js')
const { fetchAssetData, fetchUserProfileInfo, client } = require('../nft_bot.js')
const { consoleError, consoleLog } = require('../debug.js');
const prefix = config.prefix;
// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//         GatewayIntentBits.GuildMessageReactions
//     ],
// });

const fileData = {};
const imageData = {};

// Export the module
module.exports = {
    name: 'link',
    description: 'Retrieve the URL for an asset.',
    setClient,

    // Execute function to handle 'link' command
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) return;
        // Check if the message starts with the 'link' command
        if (message.content.startsWith(prefix + 'link')) {
            // Read CSV files into memory
            await readCSV(fileData, imageData);
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            // Check if the command is 'link'
            if (command === 'link') {
                // Check if the argument is a number (fileNumber) or a username
                const argument = args[0];
                if (!isNaN(argument)) {
                    // It's a fileNumber
                    const fileNumber = parseInt(argument);
                    // Check if the file number is valid and exists in the data
                    if (fileNumber in fileData && fileNumber in imageData) {
                        try {
                            // Fetch asset data using the asset ID
                            const assetData = await fetchAssetData(imageData[fileNumber].id);
                            consoleLog(`fetching api data for asset id: ${imageData[fileNumber].id}`)
                            consoleLog('Asset Data:', assetData.asset);
                            const imageUrl = assetData.asset.location;
                            const imageName = `${assetData.asset.id.replace(' ', '').replace('#', '-')}.png`;
                            await downloadAndSaveImage(imageUrl, imageName);

                            const link = `https://nanswap.com/art/assets/${assetData.asset.id}${config.referral}`;
                            const fromUsername = assetData.asset.ownerId.username || 'Unnamed';
                            // const fromUserLink = `https://nanswap.com/art/${fromUsername}${config.referral}`;
                            // const bestBid = assetData.asset.bestBid;
                            // const bestAsk = assetData.asset.bestAsk;
                            // const rarityRank = assetData.asset.rarityRank;
                            
                            // const baseField = {
                            //     name: `__**General Information:**__`,
                            //     value: `${emoji.Owner} **Owner:** **[${fromUsername}](${fromUserLink})**\n${emoji.Rank} **Rank:** \`${rarityRank}\`\n${emoji.Views} **Views:** \`${assetData.asset.views}\`\n`,
                            //     inline: true,
                            // };
                            
                            // if (!bestBid && bestAsk) {
                            //     baseField.value += `${emoji.Currency} **Price:** \`Ӿ${bestAsk}\`\n${emoji.Bidder} **Best Bid:** \`N/A\``;
                            // } else if (!bestBid && !bestAsk) {
                            //     baseField.value += `${emoji.Currency} **Price:** \`N/A\`\n${emoji.Bidder} **Best Bid:** \`N/A\``;
                            // } else if (bestBid && bestAsk) {
                            //     baseField.value += `${emoji.Currency} **Price:** \`Ӿ${bestAsk}\`\n${emoji.Bidder} **Best Bid:** \`${bestBid}\``;
                            // } else if (bestBid && !bestAsk) {
                            //     baseField.value += `${emoji.Currency} **Price:** \`${bestAsk}\`\n${emoji.Bidder} **Best Bid:** \`N/A\``;
                            // } else {
                            //     consoleLog('Unknown State:', assetData.asset);
                            // }

                            const Embed = new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle(`${emoji.Lock} Secure URL for ${imageData[fileNumber].name}!`)
                                .setImage(`attachment://${imageData[fileNumber].id}.png`)
                                .setURL(link)
                                // .addFields(baseField)
                                .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                                .setTimestamp();

                                // Send the message with the Embed and attached image
                                message.reply({
                                    content: `${message.author}, here is the requested URL for ${imageData[fileNumber].name}.`,
                                    embeds: [Embed],
                                    files: [{ attachment: imageName, name: `${imageData[fileNumber].id}.png` }],
                                });
                        } catch (error) {
                            consoleError('Error fetching or processing asset data:', error);
                            message.reply(`${message.author}, an error occurred while processing the request.`);
                        }
                    } else {
                        message.reply(`${message.author}, file not found. Please provide a valid file number.`);
                    }
                } else {
                    // It's a username
                    const username = argument;
                    try {
                        // Generate link for the user's profile on Nanswap
                        const userLink = `https://nanswap.com/art/${username}${config.referral}`;
                        const userData = await fetchUserProfileInfo(username);
                        const imageUrl = userData.avatar || 'https://toolset.com/wp-content/uploads/2018/06/909657-profile_pic.png';
                        const imageName = `${userData.id.replace(' ', '').replace('#', '-')}.png`;
                        await downloadAndSaveImage(imageUrl, imageName);

                        // Create an Embed for the username request
                        const embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${emoji.Lock} Secure URL Request for ${username}!`)
                            .setDescription(`**Click [here](${userLink}) to view ${username}'s Nanswap Art profile!**`)
                            .setURL(userLink)
                            .setThumbnail(`attachment://${userData.id}.png`)
                            .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                            .setTimestamp();

                        // Send the message with the Embed
                        message.reply({
                            content: `${message.author}, here is the requested URL for ${username}.`,
                            embeds: [embed],
                            files: [{ attachment: imageName, name: `${userData.id}.png` }],
                        });
                    } catch (error) {
                        consoleError('Error processing username request:', error);
                        message.reply(`${message.author}, an error occurred while processing the request. Please check if the username is correct and try again.`);
                    }
                }
            }
        }
    }
};


// Login to the Discord client using the provided token
// client.login(config.token);
