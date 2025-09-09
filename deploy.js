const { REST, Routes } = require('discord.js');
const { applicationId, token, guildIds } = require('./config.json');
const fs = require('fs');
const path = require('path');

// ギルド専用コマンド
const guildCommands = [
    require('./commands/setup').data.toJSON(),
];

// グローバルコマンド（applicationsフォルダから読み込み）
const globalCommands = [];
const applicationsPath = path.join(__dirname, 'applications');

if (fs.existsSync(applicationsPath)) {
    const commandFiles = fs.readdirSync(applicationsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(applicationsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            globalCommands.push(command.data.toJSON());
            console.log(`グローバルコマンド ${command.data.name} を読み込みました`);
        } else {
            console.log(`[警告] ${filePath} のコマンドに必要な "data" または "execute" プロパティがありません。`);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        // グローバルコマンドの登録
        if (globalCommands.length > 0) {
            console.log(`${globalCommands.length} 個のグローバルコマンドを登録中...`);
            await rest.put(
                Routes.applicationCommands(applicationId),
                { body: globalCommands },
            );
            console.log(`${globalCommands.length} 個のグローバルコマンドが登録されました！`);
        } else {
            console.log('グローバルコマンドが見つかりませんでした。');
        }

        // ギルド専用コマンドの登録
        if (guildCommands.length > 0) {
            for (const guildId of guildIds) {
                console.log(`${guildCommands.length} 個のギルドコマンドを登録中（Guild ID: ${guildId}）...`);
                await rest.put(
                    Routes.applicationGuildCommands(applicationId, guildId),
                    { body: guildCommands },
                );
                console.log(`ギルドコマンドが登録されました！（Guild ID: ${guildId}）`);
            }
        } else {
            console.log('ギルドコマンドが見つかりませんでした。');
        }

        console.log('すべてのコマンドの登録が完了しました！');
        
    } catch (error) {
        console.error('コマンドの登録中にエラーが発生しました:', error);
    }
})();