const Discord = require('discord.js');
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');

const tokenFile = require('./token.json');
const configFile = require('./config.json')
const ping = require('./commands/ping.js');
const whyBlacklist = require('./commands/whyBlacklist.js');
const help = require('./commands/help.js');
const configs = require('./configs.js')

const changelog = fs.readFileSync('changelog.txt')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const serverBlacklist = fs.readFileSync('./config/blacklist/server.txt', 'utf8');
const userBlacklist = fs.readFileSync('./config/blacklist/server.txt', 'utf8');

client.on('ready', () => {
    console.log('Bot ready!')
    client.user.setStatus('available')
    if (tokenFile.mode === 'production')
        client.user.setActivity(
            'r.help | https://discord.gg/9MHJppvmma',
            { type: ActivityType.Playing }
        );
    else if (tokenFile.mode === 'test')
        client.user.setActivity(
            'this instance of RustyBot in Test Mode. Please report any bugs you find!',
            { type: ActivityType.Watching }
        );
});

client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (serverBlacklist.includes(message.guildId + '\n') | 
        userBlacklist.includes(message.author.id + '\n')) {
        return;
    }
    if (message.content === `<@${client.user.id}>`) {
        var emBuilder = new EmbedBuilder()
        .setTitle('Hi, welcome to RustyBot!')
        .setDescription('Type r.help to get started!')
    message.channel.send({
            'content': `If you can\'t see anything below this message, you need to turn go to \`Settings\` -> \`Text & Images\` and enable \`Embeds and Link Previews\`.`,
            'embeds': [emBuilder]});
        return;
    }

    const prefix = configFile.prefix;
    if (message.content.startsWith(prefix)) {
        const command = message.content.slice(prefix.length);
        const splits = command.split(' ');
        const base = splits[0];
        const argv = splits.slice(1);
        const argc = argv.length;
        if (base === 'ping') {
            ping.command(message, client.ws.ping);
        } else if (base === 'status') {
            const embuilder = new EmbedBuilder()
            .setTitle('RustyBot Status')
            .setDescription(`
            Current bot version: ${configFile.version}

            **[Support Server](https://discord.gg/9MHJppvmma)**
            `);

            message.channel.send({ embeds: [ embuilder ] });
        } else if (base === 'help') {
            if (argc > 0) {
                help.docs(message, argv[0]);
            } else {
                help.command(message);
            }
        } else if (base === 'invite') {
            const embuilder = new EmbedBuilder()
            .setTitle('Invites:')
            .setDescription(`
            **Invite RustyBot**: [here](https://discord.com/api/oauth2/authorize?client_id=1058133233763627159&permissions=8&scope=bot)
            **Join our support server**: [here](https://discord.gg/9MHJppvmma)
            `);
            message.channel.send({ embeds: [ embuilder ] });
        } else if (base === 'config') {
            if (argc == 0)
                message.channel.send('Please provide a key to get/set.\nThe syntax is as follows: \`r.config <key> (get|set) [value to set]\`')
            else if (argc == 1) {
                let embuilder;
                try{
                embuilder = new EmbedBuilder()
                .setTitle(`Value of key \`${argv[0]}\``)
                .setDescription(`
                STILL IN BETA! REPORT ANY BUGS IMMEDIATELY!
                \`${argv[0]}\` is set to \`${configs.getServerConfigProperty(argv[0])}\`.
                `);
                } catch (TypeError) {
                    embuilder = new EmbedBuilder().setTitle('an error occurred. we are working on fixing this')
                }
                message.channel.send({ embeds: [ embuilder ] });
            }
        } else if (base === 'whyBlacklist') {
            whyBlacklist.info(message);
        } else if (base === 'changelog') {
            const embuilder = new EmbedBuilder()
            .setDescription(changelog);
            message.channel.send({ embeds: [ embuilder ] });
        }
    }
});

if (tokenFile.mode === 'test') {
    console.log('Logging in using test mode...');
    client.login(tokenFile.test_token);
} else if (tokenFile.mode === 'production') {
    console.log('');
    client.login(tokenFile.production_token);
} else {
    throw new Error('invalid mode specified in config.json');
}
