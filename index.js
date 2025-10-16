const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const participants = new Set();
let giveawayActive = false;

client.once('ready', async () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('giveaway')
      .setDescription('Starte ein Giveaway mit Button'),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });
    console.log('Slash-Command registriert');
  } catch (err) {
    console.error(err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'giveaway') {
    if (giveawayActive) {
      return interaction.reply({ content: 'Ein Giveaway läuft bereits.', ephemeral: true });
    }

    giveawayActive = true;
    participants.clear();

    const button = new ButtonBuilder()
      .setCustomId('join_giveaway')
      .setLabel('🎉 Teilnehmen')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: '🎁 Giveaway gestartet! Drücke den Button!',
      components: [row],
    });
  }

  if (interaction.isButton() && interaction.customId === 'join_giveaway') {
    const userId = interaction.user.id;

    if (participants.has(userId)) {
      return interaction.reply({ content: 'Du hast schon teilgenommen!', ephemeral: true });
    }

    participants.add(userId);
    await interaction.reply({ content: '✅ Du bist jetzt dabei!', ephemeral: true });

    if (participants.size >= 20) {
      giveawayActive = false;
      const winners = Array.from(participants).sort(() => 0.5 - Math.random()).slice(0, 4);
      const mentions = winners.map(id => `<@${id}>`).join('\n');
      await interaction.channel.send(`🎉 Das Giveaway ist vorbei! Glückwunsch an:\n${mentions}`);
    }
  }
});

client.login(process.env.TOKEN);
