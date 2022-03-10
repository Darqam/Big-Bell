const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('season_end')
        .setDescription('Ends the PvP season')
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

		if(!entries[0] || entries[0].seasonActive == false) {
			return interaction.reply({content: '⚠️ No active season, aborting.', ephemeral: true});
		}
		const date = new Date();

		try{
			const updated = await interaction.client.PvPSeason.update({
				seasonActive: false,
				seasonEnd: date.toDateString(),
			}, {
				where: {
					seasonId: entries[0].seasonId,
					guildId: interaction.guildId,
				},
			});
			if(updated == [0]) {
				return interaction.reply({content: '⚠️ There was an error updating the season status. This shouldn\'t happen, <@129714945238630400> you need to see this.'});
			}

			return interaction.reply('Season ended!');
		}
		catch(e) {
			console.log(e);
			return interaction.reply('⚠️ There was an error ending the season. This shouldn\'t happen, <@129714945238630400> you need to see this.');
		}
        
    }
}