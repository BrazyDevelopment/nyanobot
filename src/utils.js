const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const fs = require('fs');


function getRoleId(filePath, guildId) {
    try {
        const fileContent = readChannelFile(filePath);
        const roleData = fileContent.find(entry => entry.guildId === guildId);
        return roleData ? roleData.roleId : null;
    } catch (error) {
        console.error('Error reading role ID file:', error);
        return null;
    }
}

function setRoleId(filePath, guildId, roleId) {
    try {
        let channels = readChannelFile(filePath);
        if (!Array.isArray(channels)) {
            channels = [];
        }

        const existingGuildIndex = channels.findIndex(entry => entry.guildId === guildId);

        if (existingGuildIndex !== -1) {
            channels[existingGuildIndex].roleId = roleId;
        } else {
            channels.push({ guildId, roleId });
        }

        writeChannelFile(filePath, channels);
        console.log('Role ID Updated!');
    } catch (error) {
        console.error('Error writing role ID file: ', error);
    }
}



function getChannelToUpdate(filePath) {
    // I think there is an issue =- I will check 
    // channelToUpdate seem not defined anywhere
    try {
        const fileContent = readChannelFile(filePath);
        console.log('File content:', fileContent);

        // const channelToUpdate = fileContent[0];
        const channelsToUpdate = fileContent;
        
        // if (!channelToUpdate.guildId || !channelToUpdate.channelId) {
        //     throw new Error("Guild ID or Channel ID not found in the channelToUpdate object.");
        // }

        // console.log(`Updating channel for ${channelToUpdate.guildId}`);
        // console.log('Read channel ID:', channelToUpdate.channelId);

        return channelsToUpdate;
    } catch (error) {
        console.error('Error reading channel ID:', error);
        return { error: 'Failed to read channel ID file.' };
    }
}

function setChannelToUpdate(filePath, guildId, channelId) {
    try {
        let channels = readChannelFile(filePath)
        if (!Array.isArray(channels)){
            channels = [];
        }
        console.log({guildId})
        const existingChannelIndex = channels.findIndex(entry => entry.guildId === guildId);
        console.log({channels})
        console.log({existingChannelIndex})



        
      
        if (existingChannelIndex !== -1) {
            channels[existingChannelIndex].channelId = channelId;
        } else {
            channels.push({ guildId, channelId });
        }

        writeChannelFile(filePath, channels);
        console.log('Channel ID Updated!')
        
        // if (channels.find((e) => e.channelId === channelId)){
        //     console.log('Channel ID already exists')
        // }
        // else{
        //     channels.push({ guildId, channelId});
        //     writeChannelFile(filePath, channels)
        //     console.log('Channel ID updated successfully!')
        // }
    } catch (error) {
            console.error('Error writing channel ID file: ', error);
    }
}

function getLastProcessedIds(filePath) {
    try {
        const fileContent = readChannelFile(filePath);
        return JSON.parse(fileContent) || [];
    } catch (error) {
        console.error('Error reading last processed IDs:', error.message);
        return [];
    }
}

function setLastProcessedIds(filePath, lastProcessedIds) {
    try {
        writeChannelFile(filePath, JSON.stringify(lastProcessedIds));
        console.log('Last processed IDs updated successfully.');
    } catch (error) {
        console.error('Error updating last processed IDs:', error);
    }
}

function setLastProcessedIds(filePath, lastProcessedIds) {
    try {
        writeChannelFile(filePath, JSON.stringify(lastProcessedIds));
        console.log('Last processed IDs updated successfully.');
    } catch (error) {
        console.error('Error updating last processed IDs:', error);
    }
}

// Main Update Function
async function updateNFTs(config, channelToUpdate, nfts, lastProcessedIds, setLastProcessedIds) {
    console.log(`Updating NFTs for guild ${config.guildId}`);
    try {
        console.log('Updating NFTs with guildId:', config.guildId);
        console.log('Received config:', config);

        // Ensure that config object is defined
        if (!config || !config.apiUrl) {
            console.error('Missing or invalid configuration. Please check your config.json file.');
            return;
        }

        // Ensure that roleId is defined
        const roleId = config.roleId;
        if (!roleId) {
            console.error('Missing roleId in the configuration. Please check your config.json file.');
            return;
        }

        const newSales = nfts.filter((sale) => !lastProcessedIds.includes(sale._id) && (sale.type === 'BUY' || sale.type === 'SELL'));
        
        if (channelToUpdate && newSales.length > 0) {
            newSales.forEach((sale) => {
                const assetURL = `https://nanswap.com/art/assets/${sale.assetId.id}`
                const assetName = sale.assetId.name
                const imageURL = sale.assetId.placeholderLocation
                const ticker = sale.priceTicker

                const embed = new EmbedBuilder()
                    embed.setColor(0x0099FF)
                    embed.setTitle(`**New NFT Sale: ${assetName}**`)
                    embed.setURL(assetURL)
                    embed.setAuthor({ name: 'Nyano Bot', iconURL: imageURL, url: assetURL })
                    embed.setDescription(`A new NFT sale has occurred!`)
                    embed.setThumbnail(imageURL)
                    embed.addFields(
                        { name: 'Price', value: `${sale.price} ${ticker}`, inline: true },
                        // { name: 'Seller', value: sale.fromUserId.username, inline: true },
                        { name: 'NFT Link', value: assetURL },
                        { name: 'Bold Text', value: '**Test Bold Text and Fields**' } 
                    )
                    embed.setImage(imageURL)
                    embed.setTimestamp()
                    embed.setFooter({text: `ID: ${sale._id} - Powered by .gg/Armour`, iconURL: sale.assetId.location});

                // You can add a thumbnail for the NFT image
                if (sale.assetId.thumbnail) {
                    embed.setThumbnail(sale.assetId.thumbnail);
                }
                // You can add a footer image
                if (sale.assetId.location) {
                    embed.setFooter({text: `ID: ${sale._id} - Powered by .gg/Armour`, iconURL: sale.assetId.location, url: assetURL});
                }


                console.log('ChannelToUpdate:', channelToUpdate);
                if (channelToUpdate) { // I don't this this check is very usefull
                    channelToUpdate.send(`<@&${roleId}> New NFT Sale!`)
                    // channelToUpdate.send(`<@&${roleId}> New NFT Sale!`, embed)
                    // .then((message) => {
                    //     message.react('👍');
                    //     message.react('👎');
                    // });
                } else {
                    console.error('Channel to update is null or undefined. Check your logic.');
                }
            });
            
            // Update last processed IDs outside the loop
            const newSaleIds = newSales
            .filter((sale) => sale._id && !lastProcessedIds.includes(sale._id))
            .map((sale) => sale._id);

            if (newSaleIds.length > 0) {
                lastProcessedIds = lastProcessedIds.concat(newSaleIds);
                setLastProcessedIds('src/data/lastProcessedIds.txt', lastProcessedIds);
            } 
        } else {
            console.log('No new sales to process.');
            console.log('channelToUpdate:', channelToUpdate);
            console.log('newSales.length:', newSales.length);
        }
    } catch (error) {
        console.error('Error updating NFTs:', error);
    }
}

function readChannelFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent) || {};
    } catch (error) {
        // Handle the case when the file does not exist or is not valid JSON
        return {};
    }
}

function writeChannelFile(filePath, channels) {
    fs.writeFileSync(filePath, JSON.stringify(channels), null, 2);
}

function resolveRoleMention(mention, guild) {
    const matches = mention.match(/^<@&(\d+)>$/);
    if (!matches) return null;

    const roleId = matches[1];
    const role = guild.roles.cache.get(roleId);
    return role ? role.id : null;
}

// exports
module.exports = {
    getChannelToUpdate: getChannelToUpdate,
    setChannelToUpdate: setChannelToUpdate,
    getLastProcessedIds: getLastProcessedIds,
    setLastProcessedIds: setLastProcessedIds,
    updateNFTs: updateNFTs,
    writeChannelFile: writeChannelFile, // never mind i just realised its in it ok let s try now
    readChannelFile: readChannelFile,
    getRoleId: getRoleId,
    setRoleId: setRoleId,
    resolveRoleMention: resolveRoleMention,
}
// module.exports = getChannelToUpdate;
// module.exports = setChannelToUpdate;
// module.exports = getLastProcessedIds;
// module.exports = setLastProcessedIds;
// module.exports = updateNFTs;
// module.exports = writeChannelFile;
// module.exports = readChannelFile;