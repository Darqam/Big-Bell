const { MessageEmbed } = require('discord.js');

module.exports = {
	updateLeaderboard: async function(client, guild, season = null) {

		if(!season) {
			// Fetch all entries for MMR
			const entries = await client.PvPSeason.findAll({
				where: {
					guildId: guild.id,
				},
			});
			// This sorts such that newest is at entry 0
			entries.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

			season = entries[0];
		}

		const message = await client.channels.cache.get(season.leaderboardChannelId).messages.fetch(season.leaderboardMessageId);

		// Grab all MMR values for current season
		const user_mmrs = await client.MMR.findAll({
			where: {
				seasonId: season.seasonId,
				guildId: guild.id,
			},
		});
		// Sort such that highest mmrvalue is at [0]
		user_mmrs.sort((a, b) => (a.mmrValue > b.mmrValue) ? -1 : 1);

		const date = new Date();
		date.setHours(date.getHours() - 1);

		const user_placement = [];
		for(let i = 0; i < user_mmrs.length; i++) {
			try {
				const member = await guild.members.fetch(user_mmrs[i].userId);
				user_placement.push(`#${i + 1} ${member.displayName} - ${user_mmrs[i].mmrValue}`);
			}
			catch (e) {
				const user = await client.users.fetch(user_mmrs[i].userId);
				user_placement.push(`#${i + 1} ${user.username} - ${user_mmrs[i].mmrValue}`);
			}
		}

		const new_value = message.embeds[0].fields[0].value = user_placement.join('\n');
		const new_title = message.embeds[0].fields[0].name = 'Placement';
		const new_desc = `As of ${date.toLocaleString()}`;

		const embed = new MessageEmbed();
		embed.setTitle(message.embeds[0].title);
		embed.setDescription(new_desc);
		embed.addField(new_title, new_value);

		return message.edit({ embed });
	},
};
