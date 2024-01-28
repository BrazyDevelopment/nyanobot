// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json');
const { downloadAndSaveImage, readCSV, setClient, convertToPercentage, getEmojiForTrait } = require('../utils.js');
const { consoleLog, consoleError } = require('../debug.js');
const { fetchAssetData, client } = require('../nft_bot.js');

// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//         GatewayIntentBits.GuildMessageReactions,
//     ],
// });

// Extract configuration values
const prefix = config.prefix;
const fileData = {};
const imageData = {};

// Export the command module
module.exports = {
    name: 'info',
    description: 'Retrieve rarity score, overall position, and image of a file number',
    setClient,

    // Execute function for handling the 'info' command
    async execute(message) {
        if (message.author.bot) return;

        if (message.content.startsWith(prefix + 'info')) {
            // Read CSV files into fileData and imageData objects
            await readCSV(fileData, imageData);

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (command === 'info') {
                const fileNumber = parseInt(args[0]);

                if (fileNumber in fileData && fileNumber in imageData) {
                    try {
                        // Fetch asset data using the asset ID from imageData
                        const assetData = await fetchAssetData(imageData[fileNumber].id);

                        const fileInfo = fileData[fileNumber];
                        const imageUrl = assetData.asset.location;
                        const imageName = `${assetData.asset.id.replace(' ', '').replace('#', '-')}.png`;
                        const bestBid = assetData.asset.bestBid;
                        const bestAsk = assetData.asset.bestAsk;
                        const rarityRank = assetData.asset.rarityRank;

                        // Download and save the image locally
                        await downloadAndSaveImage(imageUrl, imageName);

                        const assetURL = `https://nanswap.com/art/assets/${assetData.asset.id}${config.referral}`;
                        
                        const fields = [ 
                            {
                                name: `${emoji.Lock} __Secure URL:__`,
                                value: `- **[Click To View](${assetURL})**\n`,
                                inline: false
                            },
                            {
                                name: `\n${emoji.GeneralInfo} __**General Information:**__`,
                                value: `
                                - ${emoji.Owner} **Owner: [${assetData.asset.ownerId.username || 'UNKNOWN'}](https://nanswap.com/art/${assetData.asset.ownerId.username})**\n- ${emoji.Rank} **Rank: \`${rarityRank}\`**\n- ${emoji.Views} **Views: \`${assetData.asset.views}\`**`,
                                inline: false
                            },
                        ];

                        consoleLog(fields[1].value)
                        
                        if (!bestBid && bestAsk) {
                            fields[1].value += `\n- ${emoji.Currency} **Price:** \`Ӿ${bestAsk}\`\n- ${emoji.Bidder} **Best Bid:** \`N/A\``;
                        } else if (!bestBid && !bestAsk) {
                            fields[1].value += `\n- ${emoji.Currency} **Price:** \`N/A\`\n- ${emoji.Bidder} **Best Bid:** \`N/A\``;
                        } else if (bestBid && bestAsk) {
                            fields[1].value += `\n- ${emoji.Currency} **Price:** \`Ӿ${bestAsk}\`\n- ${emoji.Bidder} **Best Bid:** \`${bestBid}\``;
                        } else if (bestBid && !bestAsk) {
                            fields[1].value += `\n- ${emoji.Currency} **Price:** \`${bestAsk}\`\n- ${emoji.Bidder} **Best Bid:** \`N/A\``;
                        } else {
                            consoleLog('Unknown State:', assetData.asset);
                        }

                        fields.push(
                            {
                                name: `\n\u200b`,
                                value: `${emoji.Attributes} __**Attributes:**__`,
                                inline: false
                            },
                        );

                         // Iterate through metadata attributes and add them to the fields array
                         for (const trait of assetData.asset.metadata.attributes) {
                            const traitType = trait.trait_type;
                            const traitValue = trait.value;

                            if (assetData.asset.collectionId.attributes.hasOwnProperty(traitType)) {
                                const subAttributes = assetData.asset.collectionId.attributes[traitType];

                                if (subAttributes.hasOwnProperty(traitValue)) {
                                    const subAttributeValue = subAttributes[traitValue];
                                    const percentageValue = convertToPercentage(subAttributeValue);

                                    const emojiForTrait = getEmojiForTrait(traitType);
                                    fields.push({
                                        name: `\`${emojiForTrait}\` **${traitType}:**`,
                                        value: `\`\`\`${convertToPercentage(traitValue)} ${percentageValue}\`\`\``,
                                        inline: true,
                                    });
                                } else {
                                    const emojiForTrait = getEmojiForTrait(traitType);
                                    fields.push({
                                        name: `\`${emojiForTrait}\` **${traitType}:**`,
                                        value: `\`\`\`${convertToPercentage(traitValue)}\`\`\``,
                                        inline: true,
                                    });
                                }
                            } else {
                                const emojiForTrait = getEmojiForTrait(traitType);
                                fields.push({
                                    name: `\`${emojiForTrait}\` **${traitType}:**`,
                                    value: `\`\`\`${convertToPercentage(traitValue)}\`\`\``,
                                    inline: true,
                                });
                            }
                        }

                        // Create an Embed object with the specified details
                        const Embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${emoji.Project} ${imageData[fileNumber].name}`)
                            .setThumbnail(`attachment://${imageData[fileNumber].id}.png`)
                            .addFields(fields)
                            .setURL(assetURL)
                            .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                            .setTimestamp();

                        // Send a message with the Embed and attached image
                        message.reply({
                            content: `${message.author} has requested information on ${imageData[fileNumber].name}.`,
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
            }
        }
    },
};

// Log in to Discord using the bot token from the configuration
client.login(config.token);