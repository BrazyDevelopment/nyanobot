const { getChannelToUpdate, getRoleId} = require('./utils.js');
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType  } = require('discord.js');
const axios = require('axios')
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

// Read last processed ID from file
const processedIdsFilePath = 'src/data/lastProcessedIds.txt'
// Load the channel ID from the file if it exists
const channelIdPath = 'src/data/channelId.txt';

// PERIODIC CHECKS
console.log('Before setInterval. Config:', config);

if (!config || !config.apiUrl || !config.token) {
    console.error('Invalid configuration. Please check your config.json file.');
    return;
}
lastProcessedIds = []; // global variable
// Fetch api data
const fetchApiData = async () => {
    try {
        const response = await fetch(config.apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching API data:', error);
        throw error;
    }
};

async function downloadAndSaveImage(url, filename) {
    if (fs.existsSync(filename)){
        console.log("cache hit for " + filename)
        return
    }
    console.log("cache miss for " + filename)
    const response = await axios.get(url, { responseType: 'arraybuffer'});
    fs.writeFileSync(filename, Buffer.from(response.data, 'binary'));
}

async function postNewSales(){ 
// Fetch the channel ID from the file
    let channelsToUpdates = getChannelToUpdate(channelIdPath);
    console.log({ channelsToUpdates });
    try {
        // Ensure that config object is defined
        if (!config || !config.apiUrl) {
            console.error('Missing or invalid configuration. Please check your config.json file.');
            return;
        }

        // Fetch API data
        const apiData = await fetchApiData();

        // Fetches last processed _id from lastProcessedIds.txt
        // console.log(lastProcessedIds);

        // Extract unique asset IDs from the API data
        for (let i = 0; i < apiData.length; i++) {
        // for (let i = 0; i < 2; i++) {
            const saleElement = apiData[i];
            if (!lastProcessedIds.includes(saleElement._id)){ // we check if new _id is not included in lastProcessedIds
                const imageUrl = saleElement.assetId.location;
                const imageName = saleElement.assetId.name.replace(' ', '').replace('#', '-') + '.png'; // using the asset name to not confound the same image
                
                await downloadAndSaveImage(imageUrl, imageName);


                let link = 'https://nanswap.com/art/assets/' + saleElement.assetId.id
                // console.log(`NEW SALES: ${saleElement.assetId.name} ${saleElement.type} ${+saleElement.price} ${saleElement.assetId.location}`)
                const fromUsername = saleElement.fromUserId.username === undefined ? 'Unnamed' : saleElement.fromUserId.username;
                const toUsername = saleElement.toUserId.username === undefined ? 'Unnamed' : saleElement.toUserId.username;
                let fromuserLink = 'https://nanswap.com/art/' + saleElement.fromUserId.username
                let touserLink = 'https://nanswap.com/art/' + saleElement.toUserId.username

                const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`NYANO TRADE ALERT!`)
                .setDescription(`**${saleElement.assetId.name} has been sold!**`)
                .setURL(link)
                .setThumbnail('https://media.discordapp.net/attachments/1189715753038000218/1191601666194161684/favicon.png?ex=65a60888&is=65939388&hm=9cd9d83645cae6172c44071d27ae56bedc0cdb20a562f9508206106f4a8a737b&=&format=webp&quality=lossless')
                .setImage('attachment://' + imageName)
                // .setDescription('**A New Nyano Cat has been sold!**') // too much info i think, we could even just remove the "type" fiel, like in any case, it is always a "sale"
                .addFields(
                    { name: '__Seller:__', value: `**[${fromUsername}](${fromuserLink})**`, inline: true },
                    { name: '__Buyer:__', value: `**[${toUsername}](${touserLink})**`, inline: true },
                    // { name: 'Type', value: saleElement.type, inline: true},
                    // { name: '**Sold At:**', value: new Date(saleElement.createdAt).toLocaleString(), inline: true},
                    { name: '__Link:__', value: `**[Click To View](${link})**`, inline: true}, // I'm just being picky lol
                    { name: '__Price:__', value: `**${+saleElement.price} ${saleElement.priceTicker}**`, inline: true}, 

                    
                    )
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL:  'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setColor(0x0099FF)
                    .setTitle(`**A Nyano Cat has been sold!**`)
                    .setDescription(`See the full Nyano Collection [here](https://nanswap.com/art)!`)
                    .setURL(link)
                    .setThumbnail('https://media.discordapp.net/attachments/1189715753038000218/1191601666194161684/favicon.png?ex=65a60888&is=65939388&hm=9cd9d83645cae6172c44071d27ae56bedc0cdb20a562f9508206106f4a8a737b&=&format=webp&quality=lossless')
                    .setImage('attachment://' + imageName)
                    .addFields(
                        { name: '**Name: **', value: `${saleElement.assetId.name}`, inline: true}, 
                        { name: '**Price:**', value: `${+saleElement.price} ${saleElement.priceTicker}`, inline: false}, 
                        { name: '**From:**', value: `[${fromUsername}](https://nanswap.com/art/` + `${fromUsername})`, inline: true },
                        { name: '**To:**', value: `[${toUsername}](https://nanswap.com/art/` + `${toUsername})`, inline: true },
                        // { name: 'Type', value: saleElement.type, inline: true},
                        // { name: '**Sold At:**', value: new Date(saleElement.createdAt).toLocaleString(), inline: true},
                        { name: '**Link:**', value: `[View Here](${link})`, inline: true})
                        
                    .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL:  'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676', url: 'https://discord.js.org' })
                    .setTimestamp()

                for (let i = 0; i < channelsToUpdates.length; i++) {
                    const channelIdToUpdate = channelsToUpdates[i].channelId
                    const guildid = channelsToUpdates[i].guildId
                    const roleId = getRoleId('src/data/roleIds.txt', guildid); 

                    console.log('Channel to update:', channelsToUpdates[i]);
                    console.log('Fetching channel ID from file:', channelIdPath);
                    let channel = await client.channels.cache.get(channelIdToUpdate)
                    let mention = roleId !== null ? `<@&${roleId}>` : ''


                    // await channel.send( `${mention}`)
                    await channel.send({ content: `${mention}`, embeds: [exampleEmbed], files: [{attachment: imageName }]});

                lastProcessedIds.push(saleElement._id)

                    await channel.send( `${mention}`)
                    await channel.send({ embeds: [exampleEmbed], files: [{attachment: imageName }]});
                    lastProcessedIds.push(saleElement._id)
                }
            }
        }
    } catch (error) {
        console.error('Error fetching guild or channel:', error);
    }
}

client.on("ready", async () => {
    console.log("bot ready")
    // await postNewSales();
    console.log(`Logged in as ${client.user.tag}`);
    //     // Set status after the bot is ready
    //     client.user.setActivity({
    //         activities: ['!setchannel & !setrole', { type: ActivityType.Watching }],
    //         status: 'dnd',
    //     });
});
(async () => {
    let initialData = await fetchApiData();
     initialIds = initialData.map((elmt) => elmt._id);
    // initialIds = [] //for testing
    // console.log(initialIds);
    // initialIds = [] // uncomment for testing
    // console.log(initialIds);
    lastProcessedIds = initialIds;

})();
setInterval(async () => {
    // check new sales every config.updateInterval
    console.log('Periodic update triggered.');
    await postNewSales();
    
}, config.updateInterval);

console.log('After setInterval.');

client.commands = new Map();

// Import all commands dynamically
const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`${__dirname}/commands/${file}`);
    client.commands.set(command.name, command);
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

client.login(config.token);