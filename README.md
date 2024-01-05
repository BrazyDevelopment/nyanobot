# Nyano Bot

# About
Simply use `!setalerts` and follow the instructions on screen!
A simple public Discord bot to be notified when a new Nyano Cat (Nano 'NFT') is traded, bid on, listed or transferred on Nanswap!

You can also use it in your own server and keep track of all Nyano alerts by following the **EASY INSTALLATION** below.


**EASY INSTALLATION:**
1. Invite the bot to your server using https://nyanobot.armour.dev/invite
2. Perform the `!setalerts` command and follow the instructions it gives you.
3. Perform the commands listed below under "Command Usage".
    **(Role setting is optional, it will send without mentions.)**
    **(You must set at least ONE alert type's channel for the bot to work (obviously))**
    **(This now supports multiple channels and multiple roles!)**
    **(Role commands support role ID & mentions)**
4. Wait for alerts in your chosen channels!
5. Use the `!info <FileNumber>` command to see information about individual assets!


**SELF INSTALLATION:**
1. Download the zip files using the green "Code" button above.
2. Ensure you have installed all of the required dependencies listed in **`package.json`**. This bot runs on Node JS.
3. You do not need to build the project, this has already been done.
4. Open the **`config.template.json`** and rename it to **`config.json`** and configure it to your needs.
5. Rename the **`data.template`** folder to **`data`** and leave it alone.
6. Create a bot token on Discord Developer Portal, give it the necessary permissions and invite it, make sure to put your token in **`config.json`**.
7. Open Terminal as Administrator in your directory and run **`npm install`** then **`node .`** to start the bot.
8. Follow the steps from Easy Installation, except Step 1.


# Command Usage:

## **Sales:**

    `!setalerts sales channel <channelID>`

    `!setalerts sales role <roleID>`


## **Listings:**

    `!setalerts listings channel <channelID>`

    `!setalerts listings role <roleID>`


## **Transfers:**

    `!setalerts transfers channel <channelID>`

    `!setalerts transfers role <roleID>`


## **Offers:**

    `!setalerts offers channel <channelID>`

    `!setalerts offers role <roleID>`


## **Info:**

    `!info <FileNumber>`



# See It In Action:
You can see the bot in action in the Nyano Cats Discord server here: https://discord.gg/nyano


# IMPORTANT:
If you're downloading and using the open source version, then you need to configure the `config.template.json` and rename is to `config.json` for production. Do the same with the `data.template` directory.


# Preview:
![Preview](https://media.discordapp.net/attachments/904261276899880970/1191681100297273455/image.png?ex=65a65282&is=6593dd82&hm=dd42f4b592aba676347115183c98f1fd97a39fd6056f2d9d62e372d01731abaa&=&format=webp&quality=lossless)


# Cool Dude:
![Logo](https://media.discordapp.net/attachments/904261276899880970/1191611383624777750/91594f45-a8bf-4a25-b4fc-ce6e8e3f4034-min-removebg-preview.png?ex=65a61194&is=65939c94&hm=9ec3b2e0b6da147c1bcbc7e74e5c07ebbd82a845bafd4f1c8ea0bde6b4541138&=&format=webp&quality=lossless)
