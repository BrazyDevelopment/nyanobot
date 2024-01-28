const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const emoji = require('../config/emojis.json')
const { downloadAndSaveImage, readCSV, setClient, getEmojiForTrait } = require('../utils.js')
const { fetchAssetData, fetchUserProfileInfo, client } = require('../nft_bot.js')
const { consoleError, consoleLog } = require('../debug.js');
const fetch = require('isomorphic-fetch'); // Require the 'node-fetch' library
const prefix = config.prefix;
// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//         GatewayIntentBits.GuildMessageReactions
//     ],
// });              

async function shortenURL(fullURL) {
    try {
        // Fetch the TinyURL shortening API
        const response = await fetch(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(fullURL)}`);
        if (response.ok) {
            const shortURL = await response.text();
            return shortURL;
        } else {
            throw new Error(`Failed to shorten URL: ${response.statusText}`);
        }
    } catch (error) {
        consoleError('Error shortening URL:', error);
        return fullURL; // Return the full URL in case of an error
    }
}

const fileData = {};
const imageData = {};

// Export the module
module.exports = {
    name: 'attr',
    description: 'Retrieve the attribute count for a user.',
    setClient,     
    // Execute function to handle 'link' command
    async execute(message) {
        // Ignore messages from bots
        if (message.author.bot) return;
        // Check if the message starts with the 'link' command
        if (message.content.startsWith(prefix + 'attr')) {
            // Read CSV files into memory
            await readCSV(fileData, imageData);
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            // Check if the command is 'link'
            if (command === 'attr') {
                const argument = args[0];
                if (isNaN(argument)) {
                    // Check if the argument is a number (fileNumber) or a username
                    const username = argument;
                    try {
                        const userData = await fetchUserProfileInfo(username);
                        const fields = [];
                        for (const category in userData.attributes) {
                            consoleLog(category);
                            const subAttributes = userData.attributes[category];
                            const emojiForTrait = getEmojiForTrait(category);
                            consoleLog(emojiForTrait);
                        
                            const categoryLink = encodeURIComponent(category);
                        
                            const categoryField = {
                                name: `\`${emojiForTrait}\` __**${category}:**__`,
                                value: (await Promise.all(
                                    Object.entries(subAttributes)
                                        .filter(([subAttr, count]) => count > 0)
                                        .map(async ([subAttr, count]) => {
                                            try {
                                                const encodedSubAttr = encodeURIComponent(subAttr);
                                                const encodedCategorySubAttr = encodeURIComponent(`${category}:${subAttr}`);
                                                const fullURL = `https://nanswap.com/art/collection/Nyano-Cats?attributesFilter=%5B%7B"label"%3A"${encodedSubAttr}"%2C"value"%3A"${encodedCategorySubAttr}"%7D%5D`;
                            
                                                // Shorten the URL asynchronously
                                                const shortURL = await shortenURL(fullURL);
                                                consoleLog(shortURL)
                                                consoleLog(subAttr)
                                                consoleLog(count)
                                            
                            
                                                return `**[${subAttr}](${shortURL}):** \`${count}\``;
                                            } catch (error) {
                                                consoleError(`Error encoding/shortening attribute (${category}:${subAttr}):`, error);
                                                return `- Error encoding/shortening attribute: ${subAttr}`;
                                            }
                                        })
                                )).join(' | ') || 'None',
                                inline: false,
                            };
                        
                            fields.push(categoryField);
                        }
                        

                        
                        const userLink = `https://nanswap.com/art/${username}${config.referral}`;
                        const imageUrl = userData.avatar || 'https://toolset.com/wp-content/uploads/2018/06/909657-profile_pic.png';
                        const imageName = `${userData.id.replace(' ', '').replace('#', '-')}.png`;
                        await downloadAndSaveImage(imageUrl, imageName);
                        const embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${emoji.Lock} Attribute List Request for ${username}!`)
                            .setDescription(`**Here is a list of ${username}'s owned attributes!**`)
                            .addFields(fields)
                            .setURL(userLink)
                            .setThumbnail(`attachment://${userData.id}.png`)
                            .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: config.embedFooterImage })
                            .setTimestamp();
                        message.reply({
                            content: `${message.author}, here is the requested Attribute Count for ${username}.`,
                            embeds: [embed],
                            files: [{ attachment: imageName, name: `${userData.id}.png` }],
                        });
                    } catch (error) {
                        consoleError('Error processing username request:', error);
                        message.reply(`${message.author}, an error occurred while processing the request. Please check if the username is correct and try again.`);
                    }
                } else {
                    consoleLog("wrong args")
                }
            } else {
                consoleLog("not in dm");
            }
        } else {
            consoleLog("no perms or invalid command");
        }
    }
};


// Login to the Discord client using the provided token
// client.login(config.token);