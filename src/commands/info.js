const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const csv = require('csv-parser');
const config = require('../config.json');
const { downloadAndSaveImage } = require('../utils.js')
const prefix = config.prefix;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
});

let clientInstance; // Declare a variable to hold the client instance
const fileData = {};
const imageData = {};
function setClient(client) {
  clientInstance = client;
}

function readCSV() {
  return new Promise((resolve, reject) => {
    fs.createReadStream('src/data/attributes/rarity.csv')
      .pipe(csv())
      .on('data', (row) => {
        const fileNumber = parseInt(row['File Number']);
        if (!isNaN(fileNumber)) {
          fileData[fileNumber] = {
            rarity: parseFloat(row['Rarity Score']),
            position: parseInt(row['Position']),
          };
        }
      })
      .on('end', () => {
        // Reading the second CSV file (asset-id-name.csv)
        fs.createReadStream('src/data/attributes/assets-id-name.csv')
          .pipe(csv())
          .on('data', (row) => {
            const fileNumber = parseInt(row['name'].split('#')[1]);
            imageData[fileNumber] = {
              id: row['id'],
              location: row['location'],
              name: row['name'],
            };
          })
          .on('end', () => {
            console.log('CSV files successfully processed.');
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
    name: 'info',
    description: 'Retrieve rarity score, overall position, and image of a file number',
    setClient, 

    async execute(message) {
      if (message.author.bot) return;

        if (message.content.startsWith(prefix + 'info')) {
            await readCSV(); // Wait for CSV processing to complete
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (command === 'info') {
            const fileNumber = parseInt(args[0]);
    
              if (fileNumber in fileData && fileNumber in imageData) {
                  const fileInfo = fileData[fileNumber];
                  const imageInfo = imageData[fileNumber];

                  console.log('Rarity:', fileInfo.rarity);
                  console.log('Position:', fileInfo.position);
                  console.log('ID:', imageInfo.id);
                  console.log('Location:', imageInfo.location);
                

                  const imagePath = `${imageInfo.id}.png`;
                  await downloadAndSaveImage(imageInfo.location, imagePath);

                  const assetURL = `https://nanswap.com/art/assets/${imageInfo.id}`

      
                  const Embed = new EmbedBuilder()
                      .setColor(0x0099FF)
                      .setTitle(`Info on ${imageInfo.name}!`)
                      .setDescription(`\n**## Rarity Score: ${fileInfo.rarity}** *(Higher = Rarer)*\n**## Position: ${fileInfo.position}** *(out of 10K)*\n\n**See the full details [here](${assetURL})!**`)
                      .setThumbnail('https://media.discordapp.net/attachments/1189817279421108315/1192253985407639703/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a8680d&is=6595f30d&hm=737bd43b21535ab466ebad68bfb27031243fdbb73885fa98f5b599a9f9bd4bb5&=&format=webp&quality=lossless')
                      .setImage(`attachment://${imageInfo.id}.png`)
                      // .addFields(
                      //     { name: 'Rarity Score', value: fileInfo.rarity, inline: true },
                      //     { name: 'Position', value: fileInfo.position, inline: true },
                      // )
                      .setURL(assetURL)
                      .setFooter({ text: 'Nyano Bot | Powered by Armour', iconURL: 'https://media.discordapp.net/attachments/1083342379513290843/1126321603224014908/discordsmall.png?ex=659f423c&is=658ccd3c&hm=1c648f3554786855f83494c2f162f3acc4003ce6083995b301c83d1e2402c10a&=&format=webp&quality=lossless&width=676&height=676' })
                      .setTimestamp();
                      message.channel.send({
                        content: `${message.author} has requested information on ${imageInfo.name}.`,
                        embeds: [Embed],
                        files: [{ attachment: imagePath, name: `${imageInfo.id}.png` }],
                      });
              } else {
                  message.channel.send(`${message.author}, file not found. Please provide a valid file number.`);
              }
            }
        }
    },
};

client.login(config.token);