const {
    readChannelFile,
    writeChannelFile,
    getChannelToUpdate,
    downloadAndSaveImage,
    getRoleId
} = require('./utils.js');
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { consoleLog, consoleError } = require('./debug.js');
const config = require('./config/config.json');
const fetch = require('isomorphic-fetch');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});
const emoji = require('./config/emojis.json')

// Load the channel ID from the file if it exists
const listingchannelIdPath = 'src/data/channels/listingschannelId.txt';
const transferchannelIdPath = 'src/data/channels/transferschannelId.txt';
const saleschannelIdPath = 'src/data/channels/saleschannelId.txt';
const offerchannelIdPath = 'src/data/channels/offerschannelId.txt';
// Load the role ID from the file if it exists
const salesroleIdsPath = 'src/data/roles/salesroleIds.txt';
const listingsroleIdsPath = 'src/data/roles/listingsroleIds.txt';
const transfersroleIdsPath = 'src/data/roles/transfersroleIds.txt';
const offersroleIdsPath = 'src/data/roles/offersroleIds.txt';

// PERIODIC CHECKS START
consoleLog('Before setInterval. Config:', config);
setInterval(async () => {
    // check new sales every config.updateInterval
    consoleLog('Periodic update triggered.');
    await postNewEvents();
}, config.updateInterval);
consoleLog('After setInterval.');
//PERIODIC CHECKS END

// Fetch api data by url in config
const fetchDataByApiUrl = async (apiUrl) => {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        consoleError('Error fetching or processing API data:', error);
        throw error;
    }
};
const fetchSalesData = async () => {
    return await fetchDataByApiUrl(config.salesApiUrl);
};
const fetchTransferData = async () => {
    return await fetchDataByApiUrl(config.transfersApiUrl);
};
const fetchListingData = async () => {
    return await fetchDataByApiUrl(config.listingsApiUrl);
};
const fetchOfferData = async () => {
    return await fetchDataByApiUrl(config.offersApiUrl);
};
// Function to fetch listed Nyano cats data by username
const fetchUserListedData = async (username, sorting) => {
    const userUrl = `https://art.nanswap.com/public/collected?username=${username}&status=listed&sort=${sorting}`;
    try {
        return await fetchDataByApiUrl(userUrl);
    } catch (error) {
        consoleError('Error fetching or processing userUrl data:', error);
        throw error;
    }
};
const fetchUserAllData = async (username, sorting) => {
    const userUrl = `https://art.nanswap.com/public/collected?username=${username}&sort=${sorting}`;
    try {
        return await fetchDataByApiUrl(userUrl);
    } catch (error) {
        consoleError('Error fetching or processing userUrl data:', error);
        throw error;
    }
};
const fetchUserProfileInfo = async (username) => {
    const userUrl = `https://art.nanswap.com/public/username-info?username=${username}`;
    try {
        return await fetchDataByApiUrl(userUrl);
    } catch (error) {
        consoleError('Error fetching or processing userUrl data:', error);
        throw error;
    }
};
// Function to fetch asset data by asset ID
const fetchAssetData = async (assetId) => {
    const assetUrl = `https://art.nanswap.com/asset/${assetId}`;
    try {
        return await fetchDataByApiUrl(assetUrl);
    } catch (error) {
        consoleError('Error fetching or processing asset data:', error);
        throw error;
    }
};
async function postNewEvents() {
    await postNewSales();
    await postNewTransfers();
    await postNewListings();
    await postNewOffers();
};
// End of api stuff

// Main Loop
client.on("ready", async () => {
    consoleLog("bot ready")
    // await postNewEvents(); -- uncomment for testing
    consoleLog(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: 'Nanswap Art', type: ActivityType.Watching }],
        status: 'dnd'
    });

    client.commands = new Map();
    const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`${__dirname}/commands/${file}`);
        client.commands.set(command.name, command);
    }

    if (!config || !config.salesApiUrl || !config.listingsApiUrl || !config.transfersApiUrl || !config.offersApiUrl || !config.token) {
        consoleError('Invalid configuration. Please check your config.json file.');
        return;
    }

    client.on('messageCreate', async (message) => {
        try {
            // Check if the message starts with the bot's prefix and is not sent by another bot
            if (!message.content.startsWith(config.prefix) || message.author.bot) return;

            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (!client.commands.has(commandName)) return;

            const command = client.commands.get(commandName);
            command.execute(message, args, client, config);

        } catch (error) {
            consoleError(error);
            message.reply('There was an error executing the command.');
        }
    });

    client.on('guildDelete', (guild) => {
        try {

            // REMOVE CHANNELS AND GUILDS FROM DATA STORAGE

            // Remove data from saleschannelId.txt
            let salechannels = readChannelFile(saleschannelIdPath);
            const salechannelIndex = salechannels.findIndex(entry => entry.guildId === guild.id);
            if (salechannelIndex !== -1) {
                salechannels.splice(salechannelIndex, 1);
                writeChannelFile(saleschannelIdPath, salechannels);
                consoleLog(`Removed sales channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from listingschannelId.txt
            let listingchannels = readChannelFile(listingchannelIdPath);
            const listingchannelIndex = listingchannels.findIndex(entry => entry.guildId === guild.id);
            if (listingchannelIndex !== -1) {
                listingchannels.splice(listingchannelIndex, 1);
                writeChannelFile(listingchannelIdPath, listingchannels);
                consoleLog(`Removed listing channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from transferschannelId.txt
            let transferchannels = readChannelFile(transferchannelIdPath);
            const transferchannelIndex = transferchannels.findIndex(entry => entry.guildId === guild.id);
            if (transferchannelIndex !== -1) {
                transferchannels.splice(transferchannelIndex, 1);
                writeChannelFile(transferchannelIdPath, transferchannels);
                consoleLog(`Removed transfer channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from offerschannelId.txt
            let offerchannels = readChannelFile(offerchannelIdPath);
            const offerchannelIndex = offerchannels.findIndex(entry => entry.guildId === guild.id);
            if (offerchannelIndex !== -1) {
                offerchannels.splice(offerchannelIndex, 1);
                writeChannelFile(offerchannelIdPath, offerchannels);
                consoleLog(`Removed offer channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }

            // REMOVE GUILDS AND ROLES FROM DATA STORAGE

            // Remove data from salesroleIds.txt
            let salesroles = readChannelFile(salesroleIdsPath);
            const salesroleIndex = salesroles.findIndex(entry => entry.guildId === guild.id);
            if (salesroleIndex !== -1) {
                salesroles.splice(salesroleIndex, 1);
                writeChannelFile(salesroleIdsPath, salesroles);
                consoleLog(`Removed sales role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from listingsroleIds.txt
            let listingroles = readChannelFile(listingsroleIdsPath);
            const listingroleIndex = listingroles.findIndex(entry => entry.guildId === guild.id);
            if (listingroleIndex !== -1) {
                listingroles.splice(listingroleIndex, 1);
                writeChannelFile(listingsroleIdsPath, listingroles);
                consoleLog(`Removed listings role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from transfersroleIds.txt
            let transferroles = readChannelFile(transfersroleIdsPath);
            const transferroleIndex = transferroles.findIndex(entry => entry.guildId === guild.id);
            if (transferroleIndex !== -1) {
                transferroles.splice(transferroleIndex, 1);
                writeChannelFile(transfersroleIdsPath, transferroles);
                consoleLog(`Removed transfers role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from offersroleIds.txt
            let offerroles = readChannelFile(offersroleIdsPath);
            const offerroleIndex = offerroles.findIndex(entry => entry.guildId === guild.id);
            if (offerroleIndex !== -1) {
                offerroles.splice(offerroleIndex, 1);
                writeChannelFile(offersroleIdsPath, offerroles);
                consoleLog(`Removed offers role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
        } catch (error) {
            consoleError('Error handling guildDelete event:', error);
        }
    });
    (async () => {
        // global variables
        lastProcessedListings = [];
        lastProcessedTransfers = [];
        lastProcessedSales = [];
        lastProcessedOffers = [];

        let initialSalesData = await fetchSalesData();
        let initialListingData = await fetchListingData();
        let initialTransferData = await fetchTransferData();
        let initialOfferData = await fetchOfferData();

        initialSalesIds = initialSalesData.map((elmt) => elmt._id),
        initialListingIds = initialListingData.map((elmt) => elmt._id),
        initialTransferIds = initialTransferData.map((elmt) => elmt._id),
        initialOfferIds = initialOfferData.map((elmt) => elmt._id),

        lastProcessedSales = initialSalesIds;
        lastProcessedListings = initialListingIds;
        lastProcessedTransfers = initialTransferIds;
        lastProcessedOffers = initialOfferIds;
    })();
});

client.on('disconnect', (event) => {
    console.log(`Disconnected with code ${event.code}, trying to reconnect...`);
    client.login('YOUR_BOT_TOKEN');
});

// Function to post new transfers
async function postNewTransfers() {
    let channelsToUpdates = getChannelToUpdate(transferchannelIdPath);
    consoleLog({ channelsToUpdates });
    try {
        const transfersData = await fetchTransferData();

        for (let i = 0; i < transfersData.length; i++) {
            const transferElement = transfersData[i];
            if (!lastProcessedTransfers.includes(transferElement._id)) {
                const imageUrl = transferElement.assetId.location;
                const imageName = transferElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + transferElement.assetId.id + config.referral;

                const fromUsername = transferElement.fromUserId.username === undefined ? 'Unnamed' : transferElement.fromUserId.username;
                const toUsername = transferElement.toUserId.username === undefined ? 'Unnamed' : transferElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + transferElement.fromUserId.username + config.referral
                let touserLink = 'https://nanswap.com/art/' + transferElement.toUserId.username + config.referral

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${emoji.Project} Nyano Cat Transfer Alert!`)
                    .setDescription(`**${emoji.Transfer} [${transferElement.assetId.name}](${link}) has recently been transferred!**\n\n**Click the image thumbnail to see a bigger preview!**\n\nPlace a bid using the __**Secure URL**__ ${emoji.Lock} below.\n\u200b`)
                    
                    .setDescription(
                        `**${emoji.Transfer} [${transferElement.assetId.name}](${link}) was recently transferred!**\n\n` +
                        `**${emoji.Seller} __From User:__ [${fromUsername}](${fromuserLink})**\n` + 
                        `**${emoji.Buyer} __To User:__ [${toUsername}](${touserLink})**\n` +
                        `**${emoji.Lock} __Secure URL:__ [View Asset](${link})**`
                    )   
                    .setURL(link)
                    .setThumbnail('attachment://' + imageName)
                    .setFooter({ text: 'Nyano Bot | Powered by Armour Hosting', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId
                    const guildid = channelsToUpdates[i].guildId
                    const transferRoleId = getRoleId(transfersroleIdsPath, guildid);

                    consoleLog('Channel to update:', channelsToUpdates[i]);
                    consoleLog('Fetching channel ID from file:', transferchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate)
                    let mention = transferRoleId !== null ? `<@&${transferRoleId}>` : ''

                    await channel.send({ content: `${fromUsername} has transferred an asset to ${toUsername}. ||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedTransfers.push(transferElement._id)
                }
            }
        }
    } catch (error) {
        consoleError('Error fetching or posting transfers:', error);
    }
}

// Function to post new sales
async function postNewSales() {
    // Fetch the channel ID from the file
    let channelsToUpdates = getChannelToUpdate(saleschannelIdPath);
    consoleLog({ channelsToUpdates });

    try {
        // Fetch API data
        const salesData = await fetchSalesData();

        // Extract unique asset IDs from the API data
        for (let i = 0; i < salesData.length; i++) {
            const saleElement = salesData[i];
            if (!lastProcessedSales.includes(saleElement._id)) {
                const imageUrl = saleElement.assetId.location;
                const imageName = saleElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + saleElement.assetId.id + config.referral
                const fromUsername = saleElement.fromUserId.username === undefined ? 'Unnamed' : saleElement.fromUserId.username;
                const toUsername = saleElement.toUserId.username === undefined ? 'Unnamed' : saleElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;
                let touserLink = 'https://nanswap.com/art/' + toUsername + config.referral;

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${emoji.Project} Nyano Cat Sale Alert!`)
                    .setDescription(
                        `**${emoji.Sale} [${saleElement.assetId.name}](${link}) was recently sold!**\n\n` +
                        `**${emoji.Seller} __Seller:__ [${saleElement.fromUserId.username}](${fromuserLink})**\n` + 
                        `**${emoji.Buyer} __Buyer:__ [${toUsername}](${touserLink})**\n` +
                        `**${emoji.Currency} __Price:__ \`Ӿ${+saleElement.price}\`**\n` +
                        `**${emoji.Lock} __Secure URL:__ [View Asset](${link})**`
                    )                  
                    .setURL(link)
                    .setThumbnail('attachment://' + imageName)
                    .setFooter({ text: 'Nyano Bot | Powered by Armour Hosting', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId
                    const guildid = channelsToUpdates[i].guildId
                    const salesRoleId = getRoleId(salesroleIdsPath, guildid);

                    consoleLog('Channel to update:', channelsToUpdates[i]);
                    consoleLog('Fetching channel ID from file:', saleschannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate)
                    let mention = salesRoleId !== null ? `<@&${salesRoleId}>` : ''
                    
                    await channel.send({ content: `${saleElement.fromUserId.username} has sold an asset to ${toUsername} for Ӿ${+saleElement.price}. ||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedSales.push(saleElement._id)
                }
            }
        }
    } catch (error) {
        consoleError('Error fetching guild or channel:', error);
    }
}

// Function to post new listings
async function postNewListings() {
    let channelsToUpdates = getChannelToUpdate(listingchannelIdPath);
    consoleLog({ channelsToUpdates });
    try {
        const listingsData = await fetchListingData();

        for (let i = 0; i < listingsData.length; i++) {
            const listingElement = listingsData[i];
            const listingId = listingElement._id;

            // Check if the listing is recently canceled
            if (listingElement.state === "CANCELED") {
                consoleLog(`Listing ${listingElement.assetId.name} was recently canceled. Skipping processing.`);
                continue;
            };

            if (!lastProcessedListings.includes(listingId)) {
                const imageUrl = listingElement.assetId.location;
                const imageName = listingElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + listingElement.assetId.id + config.referral;
                const fromUsername = listingElement.fromUserId.username === undefined ? 'Unnamed' : listingElement.fromUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${emoji.Project} Nyano Cat Listing Alert!`)
                    .setDescription(`**${emoji.Listing} [${listingElement.assetId.name}](${link}) was recently listed!\n\n${emoji.Seller} __Seller:__ [${listingElement.fromUserId.username}](${fromuserLink})\n${emoji.Currency} __Price:__ \`Ӿ${+listingElement.price}\`\n${emoji.Status} __Status:__  \`${listingElement.state}\`\n${emoji.Lock} __Secure URL:__ [View Asset](${link})**`)
                    .setURL(link)
                    .setThumbnail(`attachment://` + imageName)
                    .setFooter({ text: 'Nyano Bot | Powered by Armour Hosting', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId;
                    const guildId = channelsToUpdates[i].guildId;
                    const listingroleId = getRoleId(listingsroleIdsPath, guildId);
                    consoleLog('Channel to update:', channelsToUpdates[i]);
                    consoleLog('Fetching channel ID from file:', listingchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate);
                    let mention = listingroleId !== null ? `<@&${listingroleId}>` : '';
                    await channel.send({ content: `${listingElement.fromUserId.username} has just listed a new asset for Ӿ${+listingElement.price}. ||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });
                    lastProcessedListings.push(listingElement._id);
                }
            }
        }
    } catch (error) {
        consoleError('Error fetching or posting listings:', error);
    }
}

// Function to post new offers
async function postNewOffers() {
    let channelsToUpdates = getChannelToUpdate(offerchannelIdPath);
    consoleLog({ channelsToUpdates });
    try {
        const offersData = await fetchOfferData();

        for (let i = 0; i < offersData.length; i++) {
            const offerElement = offersData[i];
            const offerId = offerElement._id;
            if (offerElement.state === "CANCELED") {
                consoleLog(`Offer: ${offerId} on ${offerElement.assetId.name} was recently canceled. Skipping processing.`);
                continue;
            };
            if (!lastProcessedOffers.includes(offerId)) {
                const imageUrl = offerElement.assetId.location;
                const imageName = offerElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + offerElement.assetId.id + config.referral;
                const fromUsername = offerElement.fromUserId.username === undefined ? 'Unnamed' : offerElement.fromUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;
                const ownerUsername = offerElement.assetId.ownerId.username === undefined ? 'Unnamed' : offerElement.assetId.ownerId.username;
                let ownerLink = 'https://nanswap.com/art/' + ownerUsername + config.referral;
                
                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${emoji.Project} Nyano Cat Offer Alert!`)
                    .setDescription(
                        `**${emoji.Offer} [${offerElement.assetId.name}](${link}) has received an offer!\n\n${emoji.Owner} __Owner:__ [${ownerUsername}](${ownerLink})\n${emoji.Bidder} __Bidder:__ [${fromUsername}](${fromuserLink})\n${emoji.Currency} __Price:__ \`Ӿ${+offerElement.price}\`\n${emoji.Status} __Status:__ \`${offerElement.state}\`\n${emoji.Lock} __Secure URL:__ [View Asset](${link})**`
                    )   
                    .setURL(link)
                    .setThumbnail(`attachment://` + imageName)
                    .setFooter({ text: 'Nyano Bot | Powered by Armour Hosting', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId;
                    const guildId = channelsToUpdates[i].guildId;
                    const offerroleId = getRoleId(offersroleIdsPath, guildId);

                    consoleLog('Channel to update:', channelsToUpdates[i]);
                    consoleLog('Fetching channel ID from file:', offerchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate);
                    let mention = offerroleId !== null ? `<@&${offerroleId}>` : '';

                    await channel.send({ content: `${fromUsername} has offered Ӿ${+offerElement.price} for ${offerElement.assetId.name}. ||${mention}||\n`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedOffers.push(offerElement._id);
                }
            }
        }
    } catch (error) {
        consoleError('Error fetching or posting offers:', error.message);
    }
}

// Exports
module.exports = {
    fetchDataByApiUrl: fetchDataByApiUrl,
    fetchSalesData: async () => {
        return await fetchDataByApiUrl(config.salesApiUrl);
    },
    fetchTransferData: async () => {
        return await fetchDataByApiUrl(config.transfersApiUrl);
    },
    fetchListingData: async () => {
        return await fetchDataByApiUrl(config.listingsApiUrl);
    },
    fetchOfferData: async () => {
        return await fetchDataByApiUrl(config.offersApiUrl);
    },
    fetchAssetData: async (assetId) => {
        try {
            const apiUrl = `https://art.nanswap.com/asset/${assetId}`;
            return await fetchDataByApiUrl(apiUrl);
        } catch (error) {
            consoleError('Error fetching or processing asset data:', error);
            throw error;
        }
    },
    fetchUserListedData: async (username, sorting) => {
        try {
            const userUrl = `https://art.nanswap.com/public/collected?username=${username}&status=listed&sort=${sorting}`;
            return await fetchDataByApiUrl(userUrl);
        } catch (error) {
            consoleError('Error fetching or processing asset data:', error);
            throw error;
        }
    },
    fetchUserAllData: async (username, sorting) => {
        try {
            const userUrl = `https://art.nanswap.com/public/collected?username=${username}&sort=${sorting}`;
            return await fetchDataByApiUrl(userUrl);
        } catch (error) {
            consoleError('Error fetching or processing asset data:', error);
            throw error;
        }
    },
    fetchUserProfileInfo: async (username) => {
        const userUrl = `https://art.nanswap.com/public/username-info?username=${username}`;
        try {
            return await fetchDataByApiUrl(userUrl);
        } catch (error) {
            consoleError('Error fetching or processing userUrl data:', error);
            throw error;
        }
    },
    client: client,
};

// Login Client via Token
client.login(config.token);