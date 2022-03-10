const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('season_start')
        .setDescription('Starts a new PvP')
        .setDefaultPermission(false),
    
    async execute(interaction) {
        // Validating argument
        if (!interaction.guildId) {
            return interaction.reply({content: `⚠️ Please run this command in a guild.`, ephemeral:true});
        }

        // Fetch all entries for MMR
		const entries = await interaction.client.PvPSeason.findAll({
			where: {
				guildId: interaction.guildId,
			},
		});
		// This sorts such that newest is at entry 0
		entries.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

		if(entries[0] && entries[0].seasonActive) {
			return interaction.reply({content: '⚠️ Latest season is still active, aborting.', ephemeral: true});
		}

        const date = new Date();
		const embed = new MessageEmbed()
		    .setTitle('Current MMR leaderboard')
		    .setDescription(`As of ${date.toDateString()}`)
		    .addField('Placement', '*empty for now*');

        const lead_message = await interaction.reply({
            content: 'New season started!',
            embeds: [embed],
            fetchReply: true,
        });

		try{
			await interaction.client.PvPSeason.create({
				seasonId: entries[0] ? entries[0].seasonId + 1 : 0,
				guildId: interaction.guildId,
				leaderboardMessageId: lead_message?.id,
				leaderboardChannelId: interaction.channel.id,
				seasonActive: true,
				seasonStart: date.toDateString(),
				seasonEnd: null,
			});

			return;
		}
		catch(e) {
			console.log(e);
			return interaction.reply('There was an error creating a new season. This shouldn\'t happen, <@129714945238630400> you need to see this.');
		}

        
    }
}