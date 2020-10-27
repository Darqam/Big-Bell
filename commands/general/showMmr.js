const { Command } = require('discord-akairo');

class ShowMmrCommand extends Command {
	constructor() {
		super('ShowMmr', {
			aliases: ['showmmr', 'mmrshow'],
			category: 'general',
			description: {
				content: 'display user MMR',
				usage: '',
			},
			args: [
				{
					id: 'user_id',
					match: 'content',
					type: 'lowercase',
				},
			],
			channelRestriction: 'guild',
		});
	}

	async exec(message, args) {
		if(message.channel.id === '732373210636746832') {
			return message.channel.send('Please use <#409858495840649246> for this command.').then(async msg => {
				await msg.delete({ timeout: 5000 });
				message.delete();
			});
		}

		const member = await message.guild.members.fetch(message.author);

		if(!member.roles.cache.has('428292301429669890') && args.user_id) {
			return message.channel.send('Only mods may check other\'s history.');
		}

		const seasons = await message.client.PvPSeason.findAll({
			where: {
				guildId: message.guild.id,
			},
		});
		// This sorts such that newest is at entry 0
		seasons.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

		if(!seasons[0] || seasons[0].seasonActive == false) {
			return message.channel.send('No active season, aborting.');
		}

		const user_id = args.user_id ? args.user_id : message.author.id;

		// Fetch an entry by this user's and guild's id
		// Will return null if non existing
		const mmr_entry = await message.client.MMR.findOne({
			where: {
				guildId: message.guild.id,
				userID: user_id,
				seasonId: seasons[0].seasonId,
			},
		});

		// If the user has no entry, create one
		if(!mmr_entry) {
			return message.channel.send('Could not find an MMR entry for your user id in this season.');
		}
		else {
			const history = JSON.parse(mmr_entry.userHistory);
			const out = history.map(h => `${h.date} - ${h.value}`);
			message.channel.send(out.join('\n'));
		}
	}
}

module.exports = ShowMmrCommand;
