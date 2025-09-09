const { Events, EmbedBuilder } = require('discord.js');
const { globalChatIdentifier } = require('../config.json');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.channel.topic || !message.channel.topic.includes(globalChatIdentifier)) {
            return;
        }

        try {
            const targetChannels = [];

            for (const guild of client.guilds.cache.values()) {
                for (const channel of guild.channels.cache.values()) {
                    if (channel.type === 0 &&
                        channel.topic &&
                        channel.topic.includes(globalChatIdentifier) &&
                        channel.id !== message.channel.id) {
                        targetChannels.push(channel);
                    }
                }
            }

            if (!message.content && message.attachments.size === 0 && message.stickers.size === 0) return;

            if (message.attachments.size > 0) {
                console.log('添付ファイル数:', message.attachments.size);
                message.attachments.forEach((attachment, index) => {
                    console.log(`添付ファイル ${index + 1}:`, {
                        name: attachment.name,
                        url: attachment.url,
                        contentType: attachment.contentType,
                        size: attachment.size
                    });
                });
            }

            if (message.stickers.size > 0) {
                console.log('スタンプ数:', message.stickers.size);
                message.stickers.forEach((sticker, index) => {
                    console.log(`スタンプ ${index + 1}:`, {
                        name: sticker.name,
                        url: sticker.url,
                        format: sticker.format,
                        id: sticker.id
                    });
                });
            }

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${message.author.username} (${message.author.id})`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setColor(0x00AE86)
                .setFooter({
                    text: `KGlobalChat - ${message.guild.name}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            if (message.content) {
                embed.setDescription(message.content);
            }

            let hasSetMainImage = false;

            if (message.stickers.size > 0) {
                const sticker = message.stickers.first();
                console.log('Embedにスタンプ画像を設定:', sticker.url);
                embed.setImage(sticker.url);
                hasSetMainImage = true;

                if (message.stickers.size > 1) {
                    const additionalStickers = Array.from(message.stickers.values()).slice(1).map(sticker => 
                        `[${sticker.name}](${sticker.url})`
                    ).join('\n');
                    embed.addFields({
                        name: '🏷️ 追加スタンプ',
                        value: additionalStickers,
                        inline: false
                    });
                }
            }

            if (message.attachments.size > 0) {
                const attachments = Array.from(message.attachments.values());
                
                const imageAttachments = attachments.filter(att => {
                    const isImage = (att.contentType && att.contentType.startsWith('image/')) ||
                                   att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/);
                    console.log(`ファイル ${att.name} は画像: ${isImage}`);
                    return isImage;
                });
                
                const otherAttachments = attachments.filter(att => {
                    const isImage = (att.contentType && att.contentType.startsWith('image/')) ||
                                   att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/);
                    return !isImage;
                });

                if (imageAttachments.length > 0 && !hasSetMainImage) {
                    console.log('Embedに添付画像を設定:', imageAttachments[0].url);
                    embed.setImage(imageAttachments[0].url);
                    hasSetMainImage = true;
                    
                    if (imageAttachments.length > 1) {
                        const additionalImages = imageAttachments.slice(1).map(att => 
                            `[${att.name}](${att.url})`
                        ).join('\n');
                        embed.addFields({
                            name: '🖼️ 追加画像',
                            value: additionalImages,
                            inline: false
                        });
                    }
                } else if (imageAttachments.length > 0 && hasSetMainImage) {
                    const allImages = imageAttachments.map(att => 
                        `[${att.name}](${att.url})`
                    ).join('\n');
                    embed.addFields({
                        name: '🖼️ 画像',
                        value: allImages,
                        inline: false
                    });
                }

                if (otherAttachments.length > 0) {
                    const fileList = otherAttachments.map(att => 
                        `[${att.name}](${att.url})`
                    ).join('\n');
                    embed.addFields({
                        name: '📎 添付ファイル',
                        value: fileList,
                        inline: false
                    });
                }
            }

            const allTargetChannels = [...targetChannels, message.channel];
            let successCount = 0;
            
            for (const targetChannel of allTargetChannels) {
                try {
                    await targetChannel.send({ embeds: [embed] });
                    successCount++;
                    console.log(`${targetChannel.name}にEmbed送信完了`);
                } catch (error) {
                    console.error(`チャンネル ${targetChannel.name} (${targetChannel.guild.name}) への送信に失敗:`, error.message);
                }
            }

            try {
                await message.delete();
                console.log('送信元メッセージを削除完了');
            } catch (error) {
                console.error('送信元メッセージの削除に失敗:', error.message);
            }

            console.log(`グローバルメッセージを ${successCount}/${allTargetChannels.length} 個のチャンネルに転送しました`);

        } catch (error) {
            console.error('グローバルチャットメッセージ処理中にエラーが発生しました:', error);
        }
    },
};
