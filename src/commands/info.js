// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json');
const { downloadAndSaveImage, readCSV } = require('../utils.js');
const { consoleLog, consoleError } = require('../debug.js');
const { fetchDataByApiUrl } = require('../nft_bot.js');

// Extract configuration values
const prefix = config.prefix;

// Create a Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

let clientInstance;
const fileData = {};
const imageData = {};

// Function to set the client instance
function setClient(client) {
    clientInstance = client;
}

// Function to fetch asset data by asset ID
async function fetchAssetData(assetId) {
    try {
        const apiUrl = `https://art.nanswap.com/asset/${assetId}`;
        return await fetchDataByApiUrl(apiUrl);
    } catch (error) {
        consoleError('Error fetching or processing asset data:', error);
        throw error;
    }
}

// Function to convert a numerical value to a percentage
function convertToPercentage(value) {
    if (typeof value !== 'number') {
        return value;
    }
    return `${(value / 10).toFixed(1)}%`;
}

// Function to get emoji based on trait type
function getEmojiForTrait(traitType) {
    switch (traitType) {
        case "Background":
            return emoji.Background;
        case "Body":
            return emoji.Body;
        case "Collar":
            return emoji.Collar;
        case "Costume":
            return emoji.Costume;
        case "Exterior":
            return emoji.Exterior;
        case "Eyes":
            return emoji.Eyes;
        case "Face":
            return emoji.Face;
        case "Glasses":
            return emoji.Glasses;
        case "Hat":
            return emoji.Hat;
        case "Mouth":
            return emoji.Mouth;
        case "Stache":
            return emoji.Stache;
        // Add more cases for other trait types
        default:
            return emoji.Attributes;
    }
}

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

                        // Download and save the image locally
                        await downloadAndSaveImage(imageUrl, imageName);

                        const assetURL = `https://nanswap.com/art/assets/${assetData.asset.id}${config.referral}`;
                        const fields = [
                            {
                                name: `__Secure URL:__ ${emoji.Lock}`,
                                value: `**${imageData[fileNumber].name}:** **[Click To View](${assetURL})**`,
                                inline: false
                            },
                            {
                                name: '\u200b',
                                value: `__**General Information:**__ ${emoji.GeneralInfo}`,
                                inline: false
                            },
                            // { 
                            //     name: '**Asset:**', 
                            //     value: `**[${imageData[fileNumber].name}](${assetURL})**`, 
                            //     inline: false 
                            // },
                            {
                                name: `**Owner:** ${emoji.Owner}`,
                                value: `**[${assetData.asset.ownerId.username || 'UNKNOWN'}](https://nanswap.com/art/${assetData.asset.ownerId.username})**`,
                                inline: true
                            },
                            {
                                name: `**Rank:** ${emoji.Rank}`,
                                value: `**${fileInfo.position}**`,
                                inline: true
                            },
                            {
                                name: `**Listed Price:** ${emoji.Currency}`,
                                value: `**${assetData.asset.bestAsk ? typeof assetData.asks.priceTicker === 'string' ? assetData.asks.priceTicker : 'Ӿ' : ''}${typeof assetData.asset.bestAsk === 'number' ? assetData.asset.bestAsk : 'Not Listed'}**`,
                                inline: true
                            },
                            {
                                name: `**Total Views:** ${emoji.Views}`,
                                value: `**${assetData.asset.views}**`,
                                inline: true,
                            },
                            {
                                name: `\u200b`,
                                value: `__**Attributes:**__ ${emoji.Attributes}`,
                                inline: false
                            },
                        ];

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
                                        name: `**${traitType}:** ${emojiForTrait}`,
                                        value: `\`\`\`${convertToPercentage(traitValue)} ${percentageValue}\`\`\``,
                                        inline: true,
                                    });
                                } else {
                                    const emojiForTrait = getEmojiForTrait(traitType);
                                    fields.push({
                                        name: `**${traitType}:** ${emojiForTrait}`,
                                        value: `\`\`\`${convertToPercentage(traitValue)}\`\`\``,
                                        inline: true,
                                    });
                                }
                            } else {
                                const emojiForTrait = getEmojiForTrait(traitType);
                                fields.push({
                                    name: `**${traitType}:** ${emojiForTrait}`,
                                    value: `\`\`\`${convertToPercentage(traitValue)}\`\`\``,
                                    inline: true,
                                });
                            }
                        }

                        // Add a disclaimer field
                        fields.push({
                            name: `__**Disclaimer:**__`,
                            value: `Protect yourself from any potential phishing links!\nUse <@1190753163318407289> to stay protected. ${emoji.NyanoBot}`,
                            inline: false
                        });

                        // Create an Embed object with the specified details
                        const Embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${emoji.Project} Nyano Cat Information Request`)
                            .setDescription(`\n\n🙏 Thanks for your request, ${message.author}.\n\n**${emoji.Thumbnail} Click the image thumbnail to see a bigger preview!**\n\n${emoji.Offer} Place a bid using the __**Secure URL**__ ${emoji.Lock} below.\n\u200b`)
                            .setThumbnail(`attachment://${imageData[fileNumber].id}.png`)
                            .addFields(fields)
                            .setURL(assetURL)
                            .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                            .setTimestamp();

                        // Send a message with the Embed and attached image
                        message.channel.send({
                            content: `${message.author} has requested information on ${imageData[fileNumber].name}.`,
                            embeds: [Embed],
                            files: [{ attachment: imageName, name: `${imageData[fileNumber].id}.png` }],
                        });
                    } catch (error) {
                        consoleError('Error fetching or processing asset data:', error);
                        message.channel.send(`${message.author}, an error occurred while processing the request.`);
                    }
                } else {
                    message.channel.send(`${message.author}, file not found. Please provide a valid file number.`);
                }
            }
        }
    },
};

// Log in to Discord using the bot token from the configuration
client.login(config.token);