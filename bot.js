const {
    Client,
    Events,
    GatewayIntentBits,
    SimpleShardingStrategy,
    EmbedBuilder,
    Partials,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Collection,
    ModalSubmitInteraction,
    TextInputComponent,
} = require("discord.js");
const { token } = require("./config.json");
const fs = require("fs");
const path = require("path");

const commands = [
    require('./commands/setup'),
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once(Events.ClientReady, async (c) => {
    console.log(`準備OKです! ${c.user.tag}がログインします。`);

    client.user.setPresence({
        activities: [{ name: "GlobalChat System", type: 3 }],
        status: "online",
    });
});

const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

client.commands = new Collection();
client.contextMenus = [];

const appPath = path.join(__dirname, 'applications');
if (fs.existsSync(appPath)) {
    fs.readdirSync(appPath).forEach(file => {
        const app = require(`./applications/${file}`);
        if ('data' in app && 'execute' in app) {
            client.contextMenus.push(app.data);
            client.commands.set(app.data.name, app);
        }
    });
}

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand() || interaction.isUserContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('コマンド実行エラー:', error);
            const errorMessage = { content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

// 汎用コマンド処理（既存のcommandsテーブル用）
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) return;

    const command = commands
        .filter(cmd => cmd && cmd.data)
        .find(cmd => cmd.data.name === interaction.commandName);

    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('汎用コマンド実行エラー:', error);
            const errorMessage = { content: "コマンド実行時にエラーになりました。", ephemeral: true };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

// エラーハンドリング
process.on('unhandledRejection', error => {
});

process.on('uncaughtException', error => {
    process.exit(1);
});

client.login(token);