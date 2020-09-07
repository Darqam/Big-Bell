const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');

class SeasonStartCommand extends Command {
	constructor() {
		super('seasonStart', {
			aliases: ['seasonstart'],
			category: 'mod',
			description: {
				content: 'Starts a new pvp season leaderboard',
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

		if(entries[0] && entries[0].seasonActive) {
			return message.channel.send('Latest season is still active, aborting.');
		}
		await message.channel.send('New season started!');
		const date = new Date();
		const embed = new MessageEmbed();
		embed.setTitle('Current MMR leaderboard');
		embed.setDescription(`As of ${date.toDateString()}`);
		embed.addField('Placement', '*empty for now*');

		const lead_message = await message.channel.send({ embed });

		try{
			await this.client.PvPSeason.create({
				seasonId: entries[0] ? entries[0].seasonId + 1 : 0,
				guildId: message.guild.id,
				leaderboardMessageId: lead_message.id,
				leaderboardChannelId: lead_message.channel.id,
				seasonActive: true,
				seasonStart: date.toDateString(),
				seasonEnd: null,
			});

			return;
		}
		catch(e) {
			console.log(e);
			return message.channel.send('There was an error creating a new season. This shouldn\'t happen, <@129714945238630400> you need to see this.');
		}
	}
}

module.exports = SeasonStartCommand;
