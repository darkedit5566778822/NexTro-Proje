import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Komut koleksiyonları
client.commands = new Collection();

// Komut dosyalarını yükleme (ban.js ve hg-bb.js)
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if (command.data) { // slash komut
        client.commands.set(command.data.name, command);
    } else if (command.name) { // prefix komut
        client.commands.set(command.name, command);
    }
}

// Prefix
const prefix = 'n!';

// Mesaj ve slash komut kontrolü
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    if (command.executePrefix) {
        command.executePrefix(message, args);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isModalSubmit()) return;

    // Slash komut çalıştırma
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
        }
    }

    // Button ve modal olayları hg-bb ve ban komutlarında handle edilir
});

// Bot hazır mesajı
client.once(Events.ClientReady, () => {
    console.log(`${client.user.tag} hazır ve çevrimiçi!`);
});

// Botu başlat
client.login(process.env.TOKEN);
