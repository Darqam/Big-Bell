const { SlashCommandBuilder } = require('discord.js');
const pvpSeason = require('../../functions/pvpSeason.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mmr')
        .setDescription('Updates your user MMR')
        .addStringOption(option =>
            option.setName('mmr')
                .setDescription('MMR value')
                .setRequired(true)),
    async execute(interaction) {
        // Validating argument
        const mmr = parseInt(interaction.options.getString('mmr'));
        
        if (!mmr) {
            return interaction.reply({content: `⚠️ Received mmr value was not a number.`, ephemeral:true});
        }

        if (!interaction.guildId) {
            return interaction.reply({content: `⚠️ Please run this command in a guild.`, ephemeral:true});
        }

        // Create the new mmr object
        const date = new Date();
		date.setHours(date.getHours() - 1);

        const new_hist = {
			date: date.toLocaleString(),
			value: mmr,
		};

        // Grab all seasons associated with this guild
		const seasons = await interaction.client.PvPSeason.findAll({
			where: {
				guildId: interaction.guildId,
			},
		});
		// This sorts such that newest is at entry 0
		seasons.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

		if(!seasons[0] || seasons[0].seasonActive == false) {
            return interaction.reply({content: `⚠️ No active season, aborting.`, ephemeral:true});
		}

		// Fetch an entry by this user's and guild's id
		// Will return null if non existing
		const mmr_entry = await interaction.client.MMR.findOne({
			where: {
				guildId: interaction.guildId,
				userID: interaction.user.id,
				seasonId: seasons[0].seasonId,
			},
		});

		// If the user has no entry, create one
		if(!mmr_entry) {
			try {
				await interaction.client.MMR.create({
					guildId: interaction.guildId,
					userId: interaction.user.id,
					seasonId: seasons[0].seasonId,
					mmrValue: mmr,
					userHistory: JSON.stringify([new_hist]),
					lastUpdate: date.toString(),
				});

				interaction.reply({content: `Created your MMR score with ${mmr}`, ephemeral:true});
			}
			catch(e) {
				console.log(e);
				return interaction.reply({content: `⚠️ There was an error creating MMR score. This shouldn\'t happen.`, ephemeral:true});
			}
		}
		else {
            // Grab user mmr history and append new score
			const history = JSON.parse(mmr_entry.userHistory);
			history.push(new_hist);

			try {
				const updated = await interaction.client.MMR.update({
					mmrValue: mmr,
					userHistory: JSON.stringify(history),
					lastUpdate: date.toString(),
				}, {
					where: {
						guildId: interaction.guildId,
                        userId: interaction.user.id,
                        seasonId: seasons[0].seasonId,
					},
				});

                // Update failed
				if(updated == [0]) {
					return interaction.reply({content: '⚠️ There was an error updating the MMR value. This shouldn\'t happen.', ephemeral:true});
				}

                // All good
                interaction.reply({content: `Updated your MMR score to ${mmr}`, ephemeral: true});
			}
			catch(e) {
				console.log(e);
                return interaction.reply({content: 'There was an error updating MMR score. This shouldn\'t happen', ephemeral: true})
			}
		}
		pvpSeason.updateLeaderboard(interaction.client, interaction.guild, seasons[0]);
    }
}