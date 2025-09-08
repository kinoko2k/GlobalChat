const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { globalChatIdentifier } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('現在のチャンネルをグローバルチャットに設定します'),

    async execute(interaction) {
        try {
            const requiredPermissions = [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory
            ];

            const missingPermissions = [];
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);

            for (const permission of requiredPermissions) {
                if (!botMember.permissions.has(permission)) {
                    missingPermissions.push(permission);
                }
            }

            const channelPermissions = interaction.channel.permissionsFor(botMember);
            const channelRequiredPermissions = [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages
            ];

            const missingChannelPermissions = [];
            for (const permission of channelRequiredPermissions) {
                if (!channelPermissions.has(permission)) {
                    missingChannelPermissions.push(permission);
                }
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ 権限エラー')
                    .setDescription('このコマンドを実行するには**チャンネルの管理**権限が必要です。')
                    .setColor(0xFF0000)
                    .setTimestamp();

                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (missingPermissions.length > 0 || missingChannelPermissions.length > 0) {
                const permissionNames = {
                    [PermissionFlagsBits.ManageChannels]: 'チャンネルの管理',
                    [PermissionFlagsBits.SendMessages]: 'メッセージの送信',
                    [PermissionFlagsBits.EmbedLinks]: '埋め込みリンク',
                    [PermissionFlagsBits.AttachFiles]: 'ファイルを添付',
                    [PermissionFlagsBits.ReadMessageHistory]: 'メッセージ履歴を読む',
                    [PermissionFlagsBits.ViewChannel]: 'チャンネルを見る',
                    [PermissionFlagsBits.ManageMessages]: 'メッセージの管理'
                };

                const allMissingPermissions = [...new Set([...missingPermissions, ...missingChannelPermissions])];
                const missingPermissionsList = allMissingPermissions.map(permission =>
                    `• ${permissionNames[permission] || permission}`
                ).join('\n');

                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ ボット権限エラー')
                    .setDescription('ボットに以下の権限が不足しています:')
                    .addFields({
                        name: '不足している権限',
                        value: missingPermissionsList,
                        inline: false
                    })
                    .addFields({
                        name: '解決方法',
                        value: '1. サーバー設定 → ロール → ボットのロールを選択\n2. 上記の権限を有効にしてください\n3. このチャンネルの権限設定も確認してください',
                        inline: false
                    })
                    .setColor(0xFF0000)
                    .setTimestamp();

                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const currentTopic = interaction.channel.topic || '';

            if (currentTopic.includes(globalChatIdentifier)) {
                const alreadySetupEmbed = new EmbedBuilder()
                    .setTitle('ℹ️ 既に設定済み')
                    .setDescription(`このチャンネルは既にグローバルチャットとして設定されています。`)
                    .addFields({
                        name: '現在のチャンネル概要',
                        value: currentTopic || '(空)',
                        inline: false
                    })
                    .setColor(0xFFAA00)
                    .setTimestamp();

                return await interaction.reply({ embeds: [alreadySetupEmbed], ephemeral: true });
            }

            const newTopic = currentTopic ?
                `${currentTopic} | ${globalChatIdentifier}` :
                globalChatIdentifier;

            await interaction.channel.setTopic(newTopic);

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ グローバルチャット設定完了')
                .setDescription('このチャンネルがグローバルチャットとして設定されました！')
                .addFields({
                    name: '更新されたチャンネル概要',
                    value: newTopic,
                    inline: false
                })
                .addFields({
                    name: '使用方法',
                    value: 'このチャンネルでメッセージを送信すると、同じ識別子を持つ他のサーバーのチャンネルにも転送されます。',
                    inline: false
                })
                .addFields({
                    name: '注意事項',
                    value: '• メッセージは自動的にEmbed形式に変換されます\n• 元のメッセージは削除されます\n• 画像やスタンプも転送されます',
                    inline: false
                })
                .setColor(0x00FF00)
                .setFooter({
                    text: `わーお`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('setupコマンド実行エラー:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ エラーが発生しました')
                .setDescription('セットアップ中にエラーが発生しました。')
                .addFields({
                    name: 'エラー詳細',
                    value: error.message || '不明なエラー',
                    inline: false
                })
                .addFields({
                    name: '考えられる原因',
                    value: '• ボットの権限が不足している\n• チャンネル概要が文字数制限を超えた\n• サーバーの設定により変更が制限されている',
                    inline: false
                })
                .setColor(0xFF0000)
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};