const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json')
const { downloadAndSaveImage, readCSV } = require('../utils.js')
const { fetchDataByApiUrl } = require('../nft_bot.js')
const { consoleError } = require('../debug.js');
const prefix = config.prefix;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
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
                const fileNumber = parseInt(args[0]);

                // Check if the file number is valid and exists in the data
                if (fileNumber in fileData && fileNumber in imageData) {
                    try {
                        // Fetch asset data using the asset ID
                        const assetData = await fetchAssetData(imageData[fileNumber].id);
                        const assetURL = `https://nanswap.com/art/assets/${assetData.asset.id}${config.referral}`;
                
                        const imageUrl = assetData.asset.location;
                        const imageName = `${assetData.asset.id.replace(' ', '').replace('#', '-')}.png`;
                        await downloadAndSaveImage(imageUrl, imageName);
                
                        const link = `https://nanswap.com/art/assets/${assetData.asset.id}${config.referral}`;
                        const fromUsername = assetData.asset.ownerId.username || 'Unnamed';
                        const fromUserLink = `https://nanswap.com/art/${fromUsername}${config.referral}`;
                
                        // Create an Embed for the URL request
                        const Embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${emoji.Lock} Secure URL Request for ${imageData[fileNumber].name}!`)
                            .setDescription(`**${message.author}, thanks for requesting information on [${imageData[fileNumber].name}](${link})!**`)
                            .setThumbnail(`attachment://${imageData[fileNumber].id}.png`)
                            .setURL(link)
                            .addFields(
                                { 
                                    name: 'Owner:', 
                                    value: `**[${fromUsername}](${fromUserLink})**`, 
                                    inline: true 
                                },
                                {
                                    name: `**Total Views:** `,
                                    value: `\`\`\`${assetData.asset.views}\`\`\``,
                                    inline: false
                                },
                                { 
                                    name: `__**Disclaimer:**__ ${emoji.Disclaimer}`, 
                                    value: `Protect yourself from any potential phishing links!\nUse <@1190753163318407289> to stay protected. ${emoji.NyanoBot}`, 
                                    inline: false 
                                },
                                {
                                    name: `\u200b`, 
                                    value: `${emoji.ViewLink} **Secure URL: [${imageData[fileNumber].name}](${assetURL})**\n${emoji.Discord} **Discord: [.gg/Nyano](${config.serverurl})**\n${emoji.Reddit} **Reddit: [reddit.com/r/Nyano](${config.redditurl})**\n${emoji.X} **X: [x.com/NyanoCatsNFT](${config.xurl})**\n${emoji.Invite} **Invite:** **[nyanobot.armour.dev/invite](https://nyanobot.armour.dev/invite)**`, 
                                    inline: false 
                                },
                            )
                            .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                            .setTimestamp();
                
                        // Send the message with the Embed and attached image
                        message.channel.send({
                            content: `${message.author}, here is the requested URL for ${imageData[fileNumber].name}.`,
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

// Login to the Discord client using the provided token
client.login(config.token);
