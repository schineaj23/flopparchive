require('dotenv').config();
const Discord = require('discord.js');
const db = require('./floppabase.js');
const https = require('https');

const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const CHANNEL = process.env.CHANNEL;
const OWNER = process.env.OWNER_ACCOUNT;
const TENOR_KEY = process.env.TENOR_API_KEY;

function matchDomain(str, domain) {
    const match = RegExp(`^(https?:\\/\\/(.+?\\.)?${domain}(\\/[A-Za-z0-9\\-\\._~:\\/\\?#\\[\\]@!$&'\\(\\)\\*\\+,;\\=]*)?)`, 'g');
    var a = str.match(match);
    return a;
}

function gifTenor(url) {
    // the id will always be the last tag in the URL
    const result = url[0].split("-");
    const ids = result[result.length - 1];
    console.info(`Tenor id: ${ids}`);

    https.get(`https://g.tenor.com/v1/gifs?ids=${ids}&key=${TENOR_KEY}`, (res) => {
        res.on('data', (data) => {
            try {
                var parsed = JSON.parse(data.toString());
                console.log(parsed);
            } catch (e) {
                console.info(e);
            } finally {
                console.info(`gifTenor() ${parsed.results[0].media[0].gif.url}`);

                const obj = { image: parsed.results[0].media[0].gif.url, desc: '', date: new Date().toJSON() };

                db.pushFloppa(obj);
            }
        });
    }).on('error', (e) => console.info(e));
}

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    console.info(bot.channels);
});

bot.on('message', msg => {
    console.info(msg);
    if (msg.author.id != OWNER || msg.channel.id != CHANNEL) {
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
        });
    } else if (msg.embeds.length > 0) {
        msg.embeds.forEach(function (val) {
            if (val.type == 'image') {
                console.info("Matching embed");
                const obj = { image: val.url, desc: '', date: new Date().toJSON() };

                db.pushFloppa(obj);
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

            db.pullFloppa(obj);
        }
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