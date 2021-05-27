require('dotenv').config();
const Discord = require('discord.js');
const db = require('./floppabase.js');
const channelDb = require('./jsondb');
const https = require('https');

const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const CHANNEL = process.env.CHANNEL;
const OWNER = process.env.OWNER_ACCOUNT;
const TENOR_KEY = process.env.TENOR_API_KEY;
const EMBED_COLOR = 16741893;  // #ff7605

function matchDomain(str, domain) {
    const match = RegExp(`^(https?:\\/\\/(.+?\\.)?${domain}(\\/[A-Za-z0-9\\-\\._~:\\/\\?#\\[\\]@!$&'\\(\\)\\*\\+,;\\=]*)?)`, 'g');
    var a = str.match(match);
    return a;
}

function gifTenor(url) {
    // the id will always be the last tag in the URL
    const original = url;
    const result = url[0].split("-");
    const ids = result[result.length - 1];
    console.info(`Tenor id: ${ids}`);

    https.get(`https://g.tenor.com/v1/gifs?ids=${ids}&key=${TENOR_KEY}`, (res) => {
        res.on('data', (data) => {
            try {
                var parsed = JSON.parse(data.toString());
                console.info(parsed);
            } catch (e) {
                console.info(e);
            } finally {
                console.info(`gifTenor() ${parsed.results[0].media[0].gif.url}`);

                const obj = { image: parsed.results[0].media[0].gif.url, desc: '', date: new Date().toJSON() };

                db.pushFloppa(obj);
                distributeFloppa(obj, 'gifv');
            }
        });
    }).on('error', (e) => console.info(e));
}

function updateArchive(msg) {
    if (msg.author.id != OWNER) {
        console.info('message is not owner message');
    }

    const domains = ['discordapp\\.com', 'discordapp\\.net', 'imgur\\.com', 'tenor\\.com'];

    if (msg.attachments.size > 0) {
        console.info(`There are ${msg.attachments.size} attachments`);
        msg.attachments.forEach(function (val, key) {
            const image = val.attachment;
            const desc = msg.content;
            console.info("Matching attachment");
            console.info(`attachment ${key} ${image}`);

            const obj = { image: image, desc: desc, date: new Date().toJSON() };

            db.pushFloppa(obj);
            distributeFloppa(obj);
        });
    } else if (msg.embeds.length > 0) {
        msg.embeds.forEach(function (val) {
            if (val.type == 'image') {
                console.info("Matching embed");
                const obj = { image: val.url, desc: '', date: new Date().toJSON() };

                db.pushFloppa(obj);
                distributeFloppa(obj);
            } else if (val.type == 'gifv') {
                // assuming that this is a tenor link, since it is the most common gif provider on discord
                const match = matchDomain(val.url, domains[3]);
                if (match == null) {
                    console.info("no embeds matched with tenor");
                    return;
                }
                console.info(match);
                gifTenor(match);
            }
        });
    } else {
        var image = null;
        for (var i = 0; i < domains.length; i++) {
            const domain = domains[i];
            console.info("Matching regex with " + domain);
            const match = matchDomain(msg.content, domain);
            if (match != null && match.length > 0) {
                console.info(match);
                image = match[0];
                break;
            }
        }
        if (image != null) {
            const obj = { image: image, desc: '', date: new Date().toJSON() };

            db.pushFloppa(obj);
            distributeFloppa(obj);
        }
    }
}

function distributeFloppa(obj, type='image') {
    const channels = channelDb.pullArray('channels.json');
    if(channels == null || channels.entries == null) {
        console.info("Not sending messages, channels were null");
        return;
    }
    var embed = new Discord.MessageEmbed();
    embed.color = EMBED_COLOR;

    embed.type = type;
    embed.setImage(obj.image);
    embed.setTitle("Floppa Recieved");
    embed.setDescription(obj.desc);
    channels.entries.forEach((entry) => {
        if(entry.owner == false) {
            bot.channels.cache.get(entry.id).send(embed);
        }
    });
}

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    
    // prune the floppabase on startup
    var array = db.pullFloppa();
    if(array != null || array.entries != null) {
        let pruned = [];
        array.entries.forEach((element) => {
            if(pruned.findIndex((e) => e.image == element.image) < 0) {
                pruned.push(element);
            }
        });
        channelDb.pushArray('flop.json', {entries: pruned});
        console.info('removed duplicates from array');
    }
});

bot.on('message', msg => {
    //console.info(msg);

    if (msg.author.tag == bot.user.tag) {
        return;
    }

    const message = msg.content;
    const discriminator = message.split("*");
    if (message[0] == "*") { // our prefix
        console.info("Command prefix triggered");
        console.info(discriminator.toString());
        switch (discriminator[1]) {
            case "help":
                msg.reply(new Discord.MessageEmbed({
                    title: "Commands",
                    type: "rich",
                    fields: [
                        { name: "`*help`", value: "Prints available commands", inline: false },
                        { name: "`*setlistener`", value: "Sets current channel to recieve Flopparchive updates", inline: false },
                        { name: "`*removelistener`", value: "Removes channel from recieving Flopparchive updates", inline: false }
                    ],
                    color: EMBED_COLOR
                }));
                break;
            case "setlistener":
                const set = {
                    id: msg.channel.id,
                    owner: false
                };
                if (!channelDb.elementExists('channels.json', set)) {
                    channelDb.pushElement('channels.json', set)
                    msg.reply(new Discord.MessageEmbed({
                        title: "Channel is now recieving flopparchive updates.",
                        type: "rich",
                        color: EMBED_COLOR
                    }));
                } else {
                    msg.reply(new Discord.MessageEmbed({
                        title: "Channel is already recieving flopparchive updates.",
                        type: "rich",
                        color: EMBED_COLOR
                    }));
                }
                break;
            case "removelistener":
                const rem = {
                    id: msg.channel.id,
                    owner: false
                };
                var channels = channelDb.pullArray('channels.json').entries;
                if (!channelDb.elementExists('channels.json', rem) || channels == null) {
                    msg.reply(new Discord.MessageEmbed({
                        title: "Not found. Channel was never recieving flopparchive updates.",
                        type: "rich",
                        color: EMBED_COLOR
                    }));
                    break;
                }
                var newChannels = channels.filter((element) => element.id != rem.id);
                console.info(newChannels);
                channelDb.pushArray('channels.json', { entries: newChannels });
                msg.reply(new Discord.MessageEmbed({
                    title: "Channel is no longer recieving flopparchive updates.",
                    type: "rich",
                    color: EMBED_COLOR
                }));
                break;
            default: 
                break;
        }
    } else {
        console.info("updating archive");
        // if the message is not a command, it is an update
        updateArchive(msg);
    }
});

function run() {
    try {
        bot.login(TOKEN);
    } catch (e) {
        console.error(e);
    }
}

module.exports.run = run;