// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json');
const { consoleLog } = require('../debug.js');
const { downloadAndSaveImage } = require('../utils.js');
const fetch = require('isomorphic-fetch');
const fs = require('fs').promises;

// Set up Discord client with specified intents
const prefix = config.prefix;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

// Variable to hold the Discord client instance
let clientInstance;

// Function to set the Discord client instance
function setClient(client) {
    clientInstance = client;
}

// Function to fetch data from the specified API endpoint
async function fetchData(username) {
    const assets = [];
    let page = 0;
    let hasMoreData = true;

    // Fetch data in paginated manner until there is no more data
    while (hasMoreData) {
        const apiUrl = `https://art.nanswap.com/public/collected?username=${username}&page=${page}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        // If data is available, add to assets and increment page
        if (data.length > 0) {
            assets.push(...data);
            page++;
        } else {
            hasMoreData = false;
        }
    }

    return assets;
}

// Function to read and parse CSV file format
async function readCSV2(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsedData = content
        .trim()
        .split('\n')
        .map((line) => line.split(','))
        .map(([id, location, name]) => ({ id, location, name }));
    return parsedData;
}

// Function to read and parse rarity CSV file format
async function readRarityCSV(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsedData = content
        .trim()
        .split('\n')
        .map((line) => line.split(','))
        .map(([fileNumber, rarityScore, position]) => ({
            fileNumber: parseInt(fileNumber),
            rarityScore: parseFloat(rarityScore),
            position: parseInt(position),
        }));
    return parsedData;
}

// Exported module containing the 'top' command
module.exports = {
    name: 'top',
    description: 'Display the top Nyano cats for a specific user.',
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
                    return message.channel.send('Please provide a username.');
                }

                // Limit the amount to 20
                if (amount > 20) {
                    return message.channel.send(`${message.author}, you have attempted to request more than 20 fields. Please use 20 or less.`);
                }

                // Fetch and process data from external APIs and CSV files
                const parsedDataa = await fetchData(username);
                const assetsData = await readCSV2('src/data/attributes/assets-id-name.csv');
                const rarityData = await readRarityCSV('src/data/attributes/rarity.csv');

                // Process and filter data based on certain conditions
                const processedData = parsedDataa.map((cat) => {
                    // Process each cat and match with assets and rarity data
                    const matchedAsset = assetsData.find((asset) => asset.id === cat.id);

                    if (matchedAsset) {
                        const fileNumberMatch = matchedAsset.name.match(/#(\d+)/);

                        if (fileNumberMatch) {
                            const fileNumber = parseInt(fileNumberMatch[1]);
                            const matchedRarity = rarityData.find((rarity) => rarity.fileNumber === fileNumber);

                            if (matchedRarity) {
                                return {
                                    id: cat.id,
                                    name: cat.name,
                                    bestAsk: cat.bestAsk,
                                    bestBid: cat.bestBid,
                                    assetLocation: cat.location,
                                    rarityPosition: matchedRarity.position,
                                };
                            } else {
                                consoleLog(`No rarity match for asset ${cat.id}, fileNumber ${fileNumber}`);
                            }
                        } else {
                            consoleLog(`Could not extract file number from asset name ${matchedAsset.name}`);
                        }
                    } else {
                        consoleLog(`No asset match for asset ${cat.id}`);
                    }

                    return null;
                }).filter((cat) => cat !== null);

                // Sort and select the top cats based on rarity position
                const sortedData = processedData.sort((a, b) => a.rarityPosition - b.rarityPosition).slice(0, amount);

                // Prepare fields for embedding
                const fields = sortedData.map((cat, index) => {
                    // Construct individual field data
                    const Link = `https://nanswap.com/art/assets/${cat.id}${config.referral}`
                    const baseField = {
                        name: `${index + 1}. **\`${cat.name}\`**`,
                        value: `${emoji.Rank} **Rank:** \`${cat.rarityPosition}\``,
                        inline: true,
                    };

                    // Add information based on bid and ask availability
                    if (!cat.bestBid && cat.bestAsk) {
                        baseField.value += `\n${emoji.Currency} **Price:** \`Ӿ${cat.bestAsk}\`\n${emoji.Bidder} **Best Bid:** \`N/A\``;
                    } else if (!cat.bestBid && !cat.bestAsk) {
                        baseField.value += `\n${emoji.Currency} **Price:** \`N/A\`\n${emoji.Bidder} **Best Bid:** \`N/A\``;
                    } else if (cat.bestBid && cat.bestAsk) {
                        baseField.value += `\n${emoji.Currency} **Price:** \`Ӿ${cat.bestAsk}\`\n${emoji.Bidder} **Best Bid:** \`Ӿ${cat.bestBid}\``;
                    } else if (cat.bestBid && !cat.bestAsk) {
                        baseField.value += `\n${emoji.Currency} **Price:** \`N/A\`\n${emoji.Bidder} **Best Bid:** \`Ӿ${cat.bestBid}\``;
                    } else {
                        consoleLog('Unknown State:', cat);
                    };

                    // Add cat link to the field
                    baseField.value += `\n${emoji.Lock} **Link:** [View](${Link})`;
                    return baseField;
                });

                // Add disclaimer field
                fields.push({
                    name: `__**Disclaimer:**__ ${emoji.Disclaimer}`,
                    value: `Protect yourself from any potential phishing links!\nUse <@1190753163318407289> to stay protected. ${emoji.NyanoBot}`,
                    inline: false,
                });

                // Check if there is data to display
                if (sortedData.length > 0) {
                    // Generate image name and download image
                    const imageName = `${processedData[0].id.replace(' ', '').replace('#', '-')}.png`;
                    const assetLocation = processedData[0].assetLocation;
                    await downloadAndSaveImage(assetLocation, imageName);
                    consoleLog(imageName)

                    // Create and send Discord Embed
                    const Embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${emoji.Project} Top ${amount} Cats for ${username} on Nanswap Art!`)
                        .setDescription(`${emoji.GeneralInfo} Here are ${username}'s Top ${amount} collected cats:`)
                        .addFields(fields)
                        .setURL(`https://nanswap.com/art/${username}${config.referral}`)
                        .setThumbnail(`attachment://${imageName}`)
                        .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676' })
                        .setTimestamp();

                    message.channel.send({
                        content: `${message.author}, here are the Top ${amount} Nyano Cats in ${username}'s collection.`,
                        embeds: [Embed],
                        files: [{ attachment: imageName, name: imageName }],
                    });
                } else {
                    // Inform user if no data found
                    message.channel.send(`${message.author}, There was no data found for the username: ${username}`);
                }
            }
        }
    },
};

// Log in with the provided Discord token
client.login(config.token);
