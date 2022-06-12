require('dotenv').config();
const tmi = require('tmi.js');
const Command = require('./Command');
const Db = require('./db');
const Rank = require('./Rank');

const client = new tmi.Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: 'hri7566',
        password: process.env.TWITCH_TOKEN
    },
    channels: [
        'hri7566',
        'blakebalance'
    ]
});

let my_username = 'hri7566';

client.connect();

client.on('connected', () => {
    my_username = client.getUsername();
});

let prefix = '*';

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    let msg = {
        a: message,
        p: {
            name: tags.username,
            _id: tags.id,
            color: tags.color
        }
    };

    runCommand(msg, channel);
});

let gCurrentChannel = '#hri7566';

function sendChat(message) {
    if (gCurrentChannel === '#' + my_username) {
        client.say(gCurrentChannel, message);
    } else {
        setTimeout(() => {
            client.say(gCurrentChannel, message);
        }, 1000);
    }
}

async function runCommand(msg, channel) {
    msg.args = msg.a.split(' ');
    msg.cmd = msg.args[0].substring(prefix.length).trim();
    msg.argcat = msg.a.substring(msg.args[0].length).trim();

    
    if (!msg.a.startsWith(prefix)) return;
    msg.prefix = prefix;

    gCurrentChannel = channel;

    let rank;

    try {
        rank = await Rank.getRank(msg.p.name);
    } catch (err) {
        rank = Rank.getRankByID(0);
    }
    
    msg.rank = rank;

    for (let cmd of Object.values(Command.commands)) {
        // if (msg.cmd !== cmd.id) continue;
        let pass = false;

        accessLoop:
        for (let cmd_id of cmd.cmds) {
            console.log(msg.cmd, cmd_id);
            if (msg.cmd == cmd_id) {
                pass = true;
                break accessLoop;
            }
        }

        if (!pass) continue;
        
        if (rank.id < cmd.minrank) {
            sendChat(`${msg.p.name}, you do not have permission to use this command.`);
            return;
        }

        if (msg.args.length < cmd.minargs) {
            sendChat(`Not enough arguments. Usage: ${prefix}${cmd.usage}`);
            return;
        }

        try {
            let out = await cmd.func(msg, channel, sendChat);
            if (out) {
                sendChat(out);
            }
            return;
        } catch (err) {
            console.error(err);
            sendChat(`An error has occurred.`);
            return;
        }
    }
}

const console_prefix = '/';
let console_currentChannel = my_username;

process.stdin.on('data', data => {
    try {
        let str = data.toString().trim();
        if (str.startsWith(console_prefix)) {
            let msg = {
                a: str,
                p: {
                    name: 'console',
                    _id: 'console',
                    color: '#ffffff'
                }
            };
            runConsoleCommand(msg);
        } else {
            client.say(console_currentChannel, str);
        }
    } catch (err) {
        console.error(err);
    }
});

async function runConsoleCommand(msg) {
    msg.args = msg.a.split(' ');
    msg.cmd = msg.args[0].substring(console_prefix.length).trim();
    msg.argcat = msg.a.substring(msg.args[0].length).trim();

    switch (msg.cmd) {
        case 'channel':
        case 'ch':
        case 'switch':
        case 'sw':
            if (msg.argcat.length > 0) {
                let sw = false;
                if (msg.argcat == 'home') {
                    msg.argcat = my_username;
                }
                client.getChannels().forEach(channel => {
                    if (channel.toLowerCase() === "#" + msg.argcat.toLowerCase()) {
                        console_currentChannel = channel;
                        console.log(`Switched to channel ${channel}`);
                        sw = true;
                    }
                });

                if (!sw) {
                    client.join(msg.argcat);
                    console_currentChannel = msg.argcat;
                }
            }
            break;
        case 'current_channel':
        case 'current':
        case 'cc':
            console.log(`Current channel: ${console_currentChannel}`);
            break;
        case 'exec':
        case 'e':
        case 'run':
            let m = {
                a: msg.argcat,
                p: {
                    name: 'console',
                    _id: 'console',
                    color: '#ffffff'
                }
            };
            runCommand('console', m);
            break;
        case 'setrank':
            if (msg.args.length < 3) {
                console.log(`Usage: ${console_prefix}${msg.cmd} <username> <rank_id>`);
                break;
            }
            let username = msg.args[1].toLowerCase();
            let rank = msg.args[2].toLowerCase();
            let r = Rank.getRankByID(rank);
            if (!r) {
                r = Rank.getRankByID(0);
            }
            try {
                let out = await Rank.setRank(username, r.id);
                console.log(`Set rank of ${username} to ${r.name}`);
            } catch (err) {
                console.error(err);
                console.log(`Failed to set rank of ${username} to ${r.name}`);
            }
            break;
        case 'get':
            if (msg.args.length < 2) {
                console.log(`Usage: ${console_prefix}${msg.cmd} <key>`);
                break;
            }
            let key = msg.args[1].toLowerCase();
            try {
                Db.get(key, (err, out) => {
                    console.log(`${key} = ${out}`);
                });
            } catch (err) {
                console.error(err);
                console.log(`Failed to get ${key}`);
            }
            break;
        case 'put':
            if (msg.args.length < 3) {
                console.log(`Usage: ${console_prefix}${msg.cmd} <key> <value>`);
                break;
            }
            let k = msg.args[1].toLowerCase();
            let value = msg.args[2].toLowerCase();
            try {
                Db.put(k, value, out => {
                    console.log(`${k} = ${value}`);
                });
            } catch (err) {
                console.error(err);
                console.log(`Failed to put ${k}`);
            }
            break;
    }
}
