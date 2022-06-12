const Color = require('./Color');
const Rank = require('./Rank');

class Command {
    static commands = {};

    constructor(id, desc, usage, minargs, func, minrank, visible) {
        this.cmds = typeof id == 'object' ? id : [id];
        this.desc = desc;
        this.usage = usage;
        this.minargs = minargs;
        this.func = func;
        this.minrank = minrank;
        this.visible = visible | true;

        Command.commands[this.cmds[0]] = this;
    }
}

new Command(['help', 'cmds'], 'Displays a list of commands', 'help [command]', 0, (msg, channel) => {
    if (!msg.args[1]) {
        let commands = [];
        for (let cmd of Object.values(Command.commands)) {
            if (cmd.minrank <= msg.rank.id) {
                if (cmd.visible) {
                    commands.push(`${msg.prefix}${cmd.cmds[0]}`);
                }
            }
        }
        return `Commands: ${commands.join(' | ')}`;
    } else {
        let cmd = Command.commands[msg.args[1]];
        if (!cmd) {
            return `Command not found.`;
        }
        return `${cmd.desc} | Usage: ${msg.prefix}${cmd.usage} | Minimum rank: ${Rank.getRankByID(cmd.minrank).name}`;
    }
}, 0, true);

new Command('color', 'Get the name of your own/another color', 'color [hex_color]', 0, (msg, channel, sendChat) => {
    let color;
    if (msg.args[1]) {
        color = new Color(msg.argcat);
        return `${msg.p.name}, that color looks like ${color.getName().replace('A', 'a')}.`;
    }
    color = new Color(msg.p.color);
    return `${msg.p.name}'s color: ${color.getName()} [${color.toHexa()}]`;
}, 0, true);

new Command('rank', 'Get your rank', 'rank', 0, (msg, channel, sendChat) => {
    return `Your rank: ${msg.rank.name} [${msg.rank.id}]`;
}, 0, true);

module.exports = Command;
