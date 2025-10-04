import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

// Sunucuya özel ayarlar (main dosyada kalıcı hale getirebilirsin)
const hgBbSettings = new Map(); // guildId => { aktif: bool, foto: string, mesaj: string, kanal: kanalId }

export default {
    name: 'hg-bb',
    description: 'Hoş Geldin / Bay Bay sistemi ayarları',
    async executePrefix(message, args) {
        const guildId = message.guild.id;
        if (!hgBbSettings.has(guildId)) {
            hgBbSettings.set(guildId, { aktif: false, foto: null, mesaj: null, kanal: null });
        }

        const settings = hgBbSettings.get(guildId);

        const embed = new EmbedBuilder()
            .setTitle('Hoş Geldin / Bay Bay Ayarları')
            .setDescription(
                `Merhaba ${message.author}\n\n`
                + `Hoş Geldin / Bay Bay Sistemi: ${settings.aktif ? '✅ Aktif' : '❌ Deaktif'}\n`
                + `Hoş Geldin / Bay Bay Fotosu: ${settings.foto ? '✅ Belirlenmiş' : '❌ Belirlenmedi'}\n`
                + `Hoş Geldin / Bay Bay Mesajı: ${settings.mesaj ? '✅ Ayarlanmış' : '❌ Ayarlanmadı'}\n`
                + `Hoş Geldin / Bay Bay Kanalı: ${settings.kanal ? '✅ Ayarlandı' : '❌ Ayarlanmadı'}`
            )
            .setColor('Blue');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hgbb_aktif')
                    .setLabel('Sistemi Aktif Et')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('hgbb_foto')
                    .setLabel('Fotoğraf Ayarla')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('hgbb_mesaj')
                    .setLabel('Hg/Bb Mesajı Belirle')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('hgbb_kanal')
                    .setLabel('Kanal Ayarla')
                    .setStyle(ButtonStyle.Danger)
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            // Sistem aktif/deaktif toggle
            if (i.customId === 'hgbb_aktif') {
                settings.aktif = !settings.aktif;
                await i.update({
                    embeds: [embed.setDescription(
                        `Merhaba ${message.author}\n\n`
                        + `Hoş Geldin / Bay Bay Sistemi: ${settings.aktif ? '✅ Aktif' : '❌ Deaktif'}\n`
                        + `Hoş Geldin / Bay Bay Fotosu: ${settings.foto ? '✅ Belirlenmiş' : '❌ Belirlenmedi'}\n`
                        + `Hoş Geldin / Bay Bay Mesajı: ${settings.mesaj ? '✅ Ayarlanmış' : '❌ Ayarlanmadı'}\n`
                        + `Hoş Geldin / Bay Bay Kanalı: ${settings.kanal ? '✅ Ayarlandı' : '❌ Ayarlanmadı'}`
                    )],
                    components: [row]
                });
            }

            // Fotoğraf ayarlama
            if (i.customId === 'hgbb_foto') {
                await i.reply({ content: 'Lütfen fotoğraf URL\'sini veya dosyayı gönderin', ephemeral: true });
                const fotoFilter = m => m.author.id === message.author.id && (m.attachments.size > 0 || m.content.startsWith('http'));
                const fotoCollector = message.channel.createMessageCollector({ filter: fotoFilter, time: 30000, max: 1 });
                fotoCollector.on('collect', m => {
                    const url = m.attachments.first() ? m.attachments.first().url : m.content;
                    settings.foto = url;
                    i.followUp({ content: 'Fotoğraf başarıyla ayarlandı ✅', ephemeral: true });
                });
            }

            // Mesaj ayarlama modal
            if (i.customId === 'hgbb_mesaj') {
                const modal = new ModalBuilder()
                    .setCustomId('hgbb_mesaj_modal')
                    .setTitle('Hg/Bb Mesajı Ayarla');

                const input = new TextInputBuilder()
                    .setCustomId('hgbb_mesaj_input')
                    .setLabel('Mesajınızı yazın (Kullanıcı için {user} yazabilirsiniz)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Hoş geldin mesajı...')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await i.showModal(modal);
            }

            // Kanal ayarlama
            if (i.customId === 'hgbb_kanal') {
                await i.reply({ content: 'Lütfen Hg/Bb kanalını etiketleyin', ephemeral: true });
                const kanalFilter = m => m.author.id === message.author.id && m.mentions.channels.size > 0;
                const kanalCollector = message.channel.createMessageCollector({ filter: kanalFilter, time: 30000, max: 1 });
                kanalCollector.on('collect', m => {
                    settings.kanal = m.mentions.channels.first().id;
                    i.followUp({ content: 'Kanal başarıyla ayarlandı ✅', ephemeral: true });
                });
            }
        });

        // Modal submit
        message.client.on('interactionCreate', async interaction => {
            if (!interaction.isModalSubmit()) return;
            if (interaction.customId === 'hgbb_mesaj_modal') {
                const msgInput = interaction.fields.getTextInputValue('hgbb_mesaj_input');
                settings.mesaj = msgInput;
                await interaction.reply({ content: 'Hg/Bb mesajı başarıyla ayarlandı ✅', ephemeral: true });
            }
        });
    }
};
