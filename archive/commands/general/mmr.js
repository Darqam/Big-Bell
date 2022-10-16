const { Command } = require('discord-akairo');
const pvpSeason = require('../../functions/pvpSeason.js');

class MmrCommand extends Command {
	constructor() {
		super('Mmr', {
			aliases: ['mmr'],
			category: 'general',
			description: {
				content: 'Updates your user MMR',
				usage: '123',
			},
			args: [
				{
					id: 'mmr_value',
					match: 'content',
					type: 'lowercase',
				},
			],
			channelRestriction: 'guild',
		});
	}

	async exec(message, args) {
		if(!args.mmr_value) {
			return message.channel.send('No mmr value provided.').then(async msg => {
				await msg.delete({ timeout:5000 });
				message.delete();
			});
		}

		// Check if argument is only numbers
		const reg = new RegExp('^[0-9]+$');
		if(!reg.test(args.mmr_value)) {
			return message.channel.send('Value was not a number.').then(async msg => {
				await msg.delete({ timeout:5000 });
				message.delete();
			});
		}

		const date = new Date();
		date.setHours(date.getHours() - 1);

		const seasons = await message.client.PvPSeason.findAll({
			where: {
				guildId: message.guild.id,
			},
		});
		// This sorts such that newest is at entry 0
		seasons.sort((a, b) => (a.seasonId > b.seasonId) ? -1 : 1);

		if(!seasons[0] || seasons[0].seasonActive == false) {
			return message.channel.send('No active season, aborting.').then(async msg => {
				await msg.delete({ timeout:5000 });
				message.delete();
			});
		}

		// Fetch an entry by this user's and guild's id
		// Will return null if non existing
		const mmr_entry = await message.client.MMR.findOne({
			where: {
				guildId: message.guild.id,
				userID: message.author.id,
				seasonId: seasons[0].seasonId,
			},
		});

		const mmr = parseInt(args.mmr_value);

		const new_hist = {
			date: date.toLocaleString(),
			value: mmr,
		};

		// If the user has no entry, create one
		if(!mmr_entry) {
			try{
				await this.client.MMR.create({
					guildId: message.guild.id,
					userId: message.author.id,
					seasonId: seasons[0].seasonId,
					mmrValue: mmr,
					userHistory: JSON.stringify([new_hist]),
					lastUpdate: date.toString(),
				});

				message.channel.send(`Created your MMR score with ${args.mmr_value}`).then(async msg => {
					await msg.delete({ timeout:5000 });
					message.delete();
				});
			}
			catch(e) {
				console.log(e);
				return message.channel.send('There was an error creating MMR score. This shouldn\'t happen, <@129714945238630400> you need to see this.');
			}
		}
		else {
			const history = JSON.parse(mmr_entry.userHistory);
			history.push(new_hist);

			try{
				const updated = await this.client.MMR.update({
					mmrValue: mmr,
					userHistory: JSON.stringify(history),
					lastUpdate: date.toString(),
				}, {
					where: {
						guildId: message.guild.id,
						userID: message.author.id,
						seasonId: seasons[0].seasonId,
					},
				});
				if(updated == [0]) {
					return message.channel.send('There was an error updating the MMR value. This shouldn\'t happen, <@129714945238630400> you need to see this.');
				}
				message.channel.send(`Updated your MMR score to ${args.mmr_value}`).then(async msg => {
					await msg.delete({ timeout:5000 });
					message.delete();
				});
			}
			catch(e) {
				console.log(e);
				return message.channel.send('There was an error updating MMR score. This shouldn\'t happen, <@129714945238630400> you need to see this.');
			}
		}
		pvpSeason.updateLeaderboard(message.client, message.guild, seasons[0]);
	}
}

module.exports = MmrCommand;
