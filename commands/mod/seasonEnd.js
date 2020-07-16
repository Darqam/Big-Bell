const { Command } = require('discord-akairo');

class SeasonEndCommand extends Command {
	constructor() {
		super('seasonEnd', {
			aliases: ['seasonend'],
			category: 'mod',
			description: {
				content: 'Finishes the current pvp season leaderboard.',
				usage: '',
			},
			channelRestriction: 'guild',
		});
	}

	async exec(message) {
		// Fetch all entries for MMR
		const entries = await message.client.PvPSeason.findAll({
			where: {
				guildId: message.guild.id,
			},
		});
		// This sorts such that newest is at entry 0
		entries.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

		if(!entries[0] || entries[0].seasonActive == false) {
			return message.channel.send('No active season, aborting.');
		}
		const date = new Date();

		try{
			const updated = await this.client.PvPSeason.update({
				seasonActive: false,
				seasonEnd: date.toDateString(),
			}, {
				where: {
					seasonId: entries[0].seasonId,
					guildId: message.guild.id,
				},
			});
			if(updated == [0]) {
				return message.channel.send('There was an error updating the season status. This shouldn\'t happen, <@129714945238630400> you need to see this.');
			}

			return message.channel.send('Season ended.');
		}
		catch(e) {
			console.log(e);
			return message.channel.send('There was an error ending the season. This shouldn\'t happen, <@129714945238630400> you need to see this.');
		}
	}
}

module.exports = SeasonEndCommand;
