const {
    readChannelFile,
    writeChannelFile,
    getChannelToUpdate,
    downloadAndSaveImage,
    getRoleId
} = require('./utils.js');
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

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
console.log('Before setInterval. Config:', config);
setInterval(async () => {
    // check new sales every config.updateInterval
    console.log('Periodic update triggered.');
    await postNewEvents();
}, config.updateInterval);
//PERIODIC CHECKS END

console.log('After setInterval.');
// Fetch api data by url in config
const fetchDataByApiUrl = async (apiUrl) => {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching API data:', error);
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
async function postNewEvents() {
    await postNewSales();
    await postNewTransfers();
    await postNewListings();
    await postNewOffers();
}

client.on("ready", async () => {
    console.log("bot ready")
    // await postNewEvents(); -- uncomment for testing
    console.log(`Logged in as ${client.user.tag}`);
    //     // Set status after the bot is ready
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
        console.error('Invalid configuration. Please check your config.json file.');
        return;
    }

    client.on('messageCreate', async (message) => {
        try {
            // console.log('Received message:', message.content);
            // Check if the message starts with the bot's prefix and is not sent by another bot
            if (!message.content.startsWith(config.prefix) || message.author.bot) return;
            // Extract command name and arguments from the message
            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            // console.log('Command name:', commandName);
            // Check if the command exists in the commands Map
            if (!client.commands.has(commandName)) return;
            // Execute the command
            const command = client.commands.get(commandName);
            // console.log('Executing command:', command.name);
            command.execute(message, args, client, config);
        } catch (error) {
            console.error(error);
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
                console.log(`Removed sales channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from listingschannelId.txt
            let listingchannels = readChannelFile(listingchannelIdPath);
            const listingchannelIndex = listingchannels.findIndex(entry => entry.guildId === guild.id);
            if (listingchannelIndex !== -1) {
                listingchannels.splice(listingchannelIndex, 1);
                writeChannelFile(listingchannelIdPath, listingchannels);
                console.log(`Removed listing channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from transferschannelId.txt
            let transferchannels = readChannelFile(transferchannelIdPath);
            const transferchannelIndex = transferchannels.findIndex(entry => entry.guildId === guild.id);
            if (transferchannelIndex !== -1) {
                transferchannels.splice(transferchannelIndex, 1);
                writeChannelFile(transferchannelIdPath, transferchannels);
                console.log(`Removed transfer channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from offerschannelId.txt
            let offerchannels = readChannelFile(offerchannelIdPath);
            const offerchannelIndex = offerchannels.findIndex(entry => entry.guildId === guild.id);
            if (offerchannelIndex !== -1) {
                offerchannels.splice(offerchannelIndex, 1);
                writeChannelFile(offerchannelIdPath, offerchannels);
                console.log(`Removed offer channel data for guild: ${guild.name} (ID: ${guild.id})`);
            }

            // REMOVE GUILDS AND ROLES FROM DATA STORAGE

            // Remove data from salesroleIds.txt
            let salesroles = readChannelFile(salesroleIdsPath);
            const salesroleIndex = salesroles.findIndex(entry => entry.guildId === guild.id);
            if (salesroleIndex !== -1) {
                salesroles.splice(salesroleIndex, 1);
                writeChannelFile(salesroleIdsPath, salesroles);
                console.log(`Removed sales role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from listingsroleIds.txt
            let listingroles = readChannelFile(listingsroleIdsPath);
            const listingroleIndex = listingroles.findIndex(entry => entry.guildId === guild.id);
            if (listingroleIndex !== -1) {
                listingroles.splice(listingroleIndex, 1);
                writeChannelFile(listingsroleIdsPath, listingroles);
                console.log(`Removed listings role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from transfersroleIds.txt
            let transferroles = readChannelFile(transfersroleIdsPath);
            const transferroleIndex = transferroles.findIndex(entry => entry.guildId === guild.id);
            if (transferroleIndex !== -1) {
                transferroles.splice(transferroleIndex, 1);
                writeChannelFile(transfersroleIdsPath, transferroles);
                console.log(`Removed transfers role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
            // Remove data from offersroleIds.txt
            let offerroles = readChannelFile(offersroleIdsPath);
            const offerroleIndex = offerroles.findIndex(entry => entry.guildId === guild.id);
            if (offerroleIndex !== -1) {
                offerroles.splice(offerroleIndex, 1);
                writeChannelFile(offersroleIdsPath, offerroles);
                console.log(`Removed offers role data for guild: ${guild.name} (ID: ${guild.id})`);
            }
        } catch (error) {
            console.error('Error handling guildDelete event:', error);
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

async function sendPriceChangeAlert(listingElement, previousPrice) {
    let channelsToUpdates = getChannelToUpdate(listingchannelIdPath);

    // Construct the message using Discord.js EmbedBuilder
    const Embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red color for price changes
        .setTitle(`NYANO PRICE CHANGE ALERT!`)
        .setDescription(`**[${listingElement.assetId.name}](${listingElement.assetId.id}) price has been updated!**`)
        .addFields(
            { name: '__Previous Price:__', value: `**${previousPrice} ${listingElement.priceTicker}**`, inline: true },
            { name: '__New Price:__', value: `**${listingElement.price} ${listingElement.priceTicker}**`, inline: true },
        )
        .setTimestamp();

    // Send the message to designated channels
    for (let i = 0; i < channelsToUpdates.length; i++) {
        const channelIdToUpdate = channelsToUpdates[i].channelId;
        let channel = await client.channels.cache.get(channelIdToUpdate);
        await channel.send({ embeds: [Embed] });
    }
}

async function postNewTransfers() {
    let channelsToUpdates = getChannelToUpdate(transferchannelIdPath);
    console.log({ channelsToUpdates });
    try {
        const transfersData = await fetchTransferData();

        for (let i = 0; i < transfersData.length; i++) {
            const transferElement = transfersData[i];
            if (!lastProcessedTransfers.includes(transferElement._id)) {
                const imageUrl = transferElement.assetId.location;
                const imageName = transferElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + transferElement.assetId.id + config.referral;

                // console.log(`NEW SALES: ${saleElement.assetId.name} ${saleElement.type} ${+saleElement.price} ${saleElement.assetId.location}`)
                const fromUsername = transferElement.fromUserId.username === undefined ? 'Unnamed' : transferElement.fromUserId.username;
                const toUsername = transferElement.toUserId.username === undefined ? 'Unnamed' : transferElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + transferElement.fromUserId.username + config.referral
                let touserLink = 'https://nanswap.com/art/' + transferElement.toUserId.username + config.referral

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`Nyano Transfer Alert!`)
                    .setDescription(`**[${transferElement.assetId.name}](${link}) has been transferred to [${toUsername}](${touserLink})!\n\nSee the full details [here](${link})!**`)
                    .setURL(link)
                    .setThumbnail('https://media.discordapp.net/attachments/1189817279421108315/1192253985407639703/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a8680d&is=6595f30d&hm=737bd43b21535ab466ebad68bfb27031243fdbb73885fa98f5b599a9f9bd4bb5&=&format=webp&quality=lossless')
                    .setImage('attachment://' + imageName)
                    .addFields(
                        // Fields specific to transfer
                        { name: '__From User:__', value: `**[${fromUsername}](${fromuserLink})**`, inline: true },
                        { name: '__To User:__', value: `**[${toUsername}](${touserLink})**`, inline: true },
                        { name: '__File:__', value: `**[${transferElement.assetId.name}](${link})**`, inline: false },
                    )
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId
                    const guildid = channelsToUpdates[i].guildId
                    const transferRoleId = getRoleId(transfersroleIdsPath, guildid);

                    console.log('Channel to update:', channelsToUpdates[i]);
                    console.log('Fetching channel ID from file:', transferchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate)
                    let mention = transferRoleId !== null ? `<@&${transferRoleId}>` : ''
                    // Send embed
                    await channel.send({ content: `**[${transferElement.assetId.name}](${link})** has been transferred to **[${toUsername}](${touserLink})**.\n||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedTransfers.push(transferElement._id)
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or posting transfers:', error);
    }
}

async function postNewSales() {
    // Fetch the channel ID from the file
    let channelsToUpdates = getChannelToUpdate(saleschannelIdPath);
    console.log({ channelsToUpdates });

    try {
        // Fetch API data
        const apiData = await fetchSalesData();

        // Extract unique asset IDs from the API data
        for (let i = 0; i < apiData.length; i++) {
            // for (let i = 0; i < 2; i++) {
            const saleElement = apiData[i];
            if (!lastProcessedSales.includes(saleElement._id)) {
                const imageUrl = saleElement.assetId.location;
                const imageName = saleElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + saleElement.assetId.id + config.referral
                // console.log(`NEW SALES: ${saleElement.assetId.name} ${saleElement.type} ${+saleElement.price} ${saleElement.assetId.location}`)
                const fromUsername = saleElement.fromUserId.username === undefined ? 'Unnamed' : saleElement.fromUserId.username;
                const toUsername = saleElement.toUserId.username === undefined ? 'Unnamed' : saleElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;
                let touserLink = 'https://nanswap.com/art/' + toUsername + config.referral;

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`Nyano Sale Alert!`)
                    .setDescription(`**[${saleElement.assetId.name}](${link}) has been sold for ${+saleElement.price} ${saleElement.priceTicker}!\n\nSee the full details [here](${link})!**`)
                    .setURL(link)
                    .setThumbnail('https://media.discordapp.net/attachments/1189817279421108315/1192253985407639703/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a8680d&is=6595f30d&hm=737bd43b21535ab466ebad68bfb27031243fdbb73885fa98f5b599a9f9bd4bb5&=&format=webp&quality=lossless')
                    .setImage('attachment://' + imageName)
                    .addFields(
                        { name: '__Seller:__', value: `**[${fromUsername}](${fromuserLink})**`, inline: true },
                        { name: '__Buyer:__', value: `**[${toUsername}](${touserLink})**`, inline: true },
                        { name: '__File:__', value: `**[${saleElement.assetId.name}](${link})**`, inline: false },
                        { name: '__Price:__', value: `**${+saleElement.price} ${saleElement.priceTicker}**`, inline: false },


                    )
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId
                    const guildid = channelsToUpdates[i].guildId
                    const salesRoleId = getRoleId(salesroleIdsPath, guildid);

                    console.log('Channel to update:', channelsToUpdates[i]);
                    console.log('Fetching channel ID from file:', saleschannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate)
                    let mention = salesRoleId !== null ? `<@&${salesRoleId}>` : ''
                    // Send embed
                    await channel.send({ content: `**[${saleElement.assetId.name}](${link})** has been sold to **[${toUsername}](${touserLink})** for **${+saleElement.price} ${saleElement.priceTicker}**.\n||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedSales.push(saleElement._id)
                }
            }
        }
    } catch (error) {
        console.error('Error fetching guild or channel:', error);
    }
}

let currentListingsPrices = {};
async function postNewListings() {
    let channelsToUpdates = getChannelToUpdate(listingchannelIdPath);
    console.log({ channelsToUpdates });
    try {
        const listingsData = await fetchListingData();

        for (let i = 0; i < listingsData.length; i++) {
            const listingElement = listingsData[i];
            const listingId = listingElement._id;

            // Check if the listing exists in the stored prices
            if (!currentListingsPrices[listingId]) {
                currentListingsPrices[listingId] = listingElement.price;
            }

            // Check for price changes
            if (currentListingsPrices[listingId] !== listingElement.price) {
                // Price has changed, trigger alert
                await sendPriceChangeAlert(listingElement, currentListingsPrices[listingId]);
                // Update the stored price
                currentListingsPrices[listingId] = listingElement.price;
                // break;
                // return;
            }

            if (!lastProcessedListings.includes(listingId)) {
                const imageUrl = listingElement.assetId.location;
                const imageName = listingElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + listingElement.assetId.id + config.referral;
                const fromUsername = listingElement.fromUserId.username === undefined ? 'Unnamed' : listingElement.fromUserId.username;
                // const toUsername = listingElement.toUserId.username === undefined ? 'Unnamed' : listingElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;
                // let touserLink = 'https://nanswap.com/art/' + toUsername;

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`Nyano Listing Alert!`)
                    .setDescription(`**[${listingElement.assetId.name}](${link}) has been listed for ${+listingElement.price} ${listingElement.priceTicker}!\n\nSee the full details [here](${link})!**`)
                    .setURL(link)
                    .setThumbnail('https://media.discordapp.net/attachments/1189817279421108315/1192253985407639703/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a8680d&is=6595f30d&hm=737bd43b21535ab466ebad68bfb27031243fdbb73885fa98f5b599a9f9bd4bb5&=&format=webp&quality=lossless') // Replace with the actual thumbnail URL
                    .setImage('attachment://' + imageName)
                    .addFields(
                        // Fields specific to listing
                        { name: '__Seller:__', value: `**[${listingElement.fromUserId.username}](${fromuserLink})**`, inline: true },
                        { name: '__Price:__', value: `**${+listingElement.price} ${listingElement.priceTicker}**`, inline: true },
                        { name: '__File:__', value: `**[${listingElement.assetId.name}](${link})**`, inline: false },
                        { name: '__Status:__', value: `**${listingElement.state}**`, inline: false },
                    )
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId;
                    const guildId = channelsToUpdates[i].guildId;
                    const listingroleId = getRoleId(listingsroleIdsPath, guildId);

                    console.log('Channel to update:', channelsToUpdates[i]);
                    console.log('Fetching channel ID from file:', listingchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate);
                    let mention = listingroleId !== null ? `<@&${listingroleId}>` : '';

                    await channel.send({ content: `**[${listingElement.fromUserId.username}](${fromuserLink})** has just listed **[${listingElement.assetId.name}](${link})** for **${+listingElement.price} ${listingElement.priceTicker}**.\n||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedListings.push(listingElement._id);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or posting listings:', error);
    }
}

async function postNewOffers() {
    let channelsToUpdates = getChannelToUpdate(offerchannelIdPath);
    console.log({ channelsToUpdates });
    try {
        const offersData = await fetchOfferData();

        for (let i = 0; i < offersData.length; i++) {
            const offerElement = offersData[i];
            if (!lastProcessedOffers.includes(offerElement._id)) {
                const imageUrl = offerElement.assetId.location;
                const imageName = offerElement.assetId.id.replace(' ', '').replace('#', '-') + '.png';

                await downloadAndSaveImage(imageUrl, imageName);

                let link = 'https://nanswap.com/art/assets/' + offerElement.assetId.id + config.referral;
                const fromUsername = offerElement.fromUserId.username === undefined ? 'Unnamed' : offerElement.fromUserId.username;
                // const toUsername = offerElement.toUserId.username === undefined ? 'Unnamed' : offerElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + fromUsername + config.referral;
                // let touserLink = 'https://nanswap.com/art/' + toUsername;

                const Embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`Nyano Offer Alert!`)
                    .setDescription(`**[${fromUsername}](${fromuserLink}) has placed an offer on [${offerElement.assetId.name}](${link}) for ${+offerElement.price} ${offerElement.priceTicker}!\n\nSee the full details [here](${link})!**`)
                    .setURL(link)
                    .setThumbnail('https://media.discordapp.net/attachments/1189817279421108315/1192253985407639703/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a8680d&is=6595f30d&hm=737bd43b21535ab466ebad68bfb27031243fdbb73885fa98f5b599a9f9bd4bb5&=&format=webp&quality=lossless') // Replace with the actual thumbnail URL
                    .setImage('attachment://' + imageName)
                    .addFields(
                        // Fields specific to offer
                        { name: '__Bidder:__', value: `**[${fromUsername}](${fromuserLink})**`, inline: true },
                        { name: '__Price:__', value: `**${+offerElement.price} ${offerElement.priceTicker}**`, inline: true },
                        { name: '__File:__', value: `**[${offerElement.assetId.name}](${link})**`, inline: false },
                        { name: '__Status:__', value: `**${offerElement.state}**`, inline: false },
                    )
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp();

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId;
                    const guildId = channelsToUpdates[i].guildId;
                    const offerroleId = getRoleId(offersroleIdsPath, guildId);

                    console.log('Channel to update:', channelsToUpdates[i]);
                    console.log('Fetching channel ID from file:', offerchannelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate);
                    let mention = offerroleId !== null ? `<@&${offerroleId}>` : '';

                    await channel.send({ content: `**[${fromUsername}](${fromuserLink})** has offered **${+offerElement.price} ${offerElement.priceTicker}** for **[${offerElement.assetId.name}](${link})**.\n||${mention}||`, embeds: [Embed], files: [{ attachment: imageName }] });

                    lastProcessedOffers.push(offerElement._id);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or posting offers:', error);
    }
}

client.login(config.token);