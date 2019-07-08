const { Command } = require('discord-akairo');
const prodOut = require('../../functions/prodOut.js');

class ChangeCommand extends Command {
	constructor() {
		super('change', {
			aliases: ['correct', 'fix'],
			category: 'general',
			description: {
				content: 'Allows to edit which gym is recognized by Victreebel.',
				usage: 'gym name',
			},
			args: [
				{
					id: 'gym',
					match: 'content',
					type: 'lowercase',
				},
			],
			channelRestriction: 'guild',
		});
	}

	async exec(message, args) {
		if(!args.gym) return message.channel.send('There was no provided gym name, aborting.');

		const ann = await this.client.Announcements.findOne({
			where: {
				channelId: message.channel.id,
			},
		});
		if(!ann) return message.channel.send('This channel was not alerted before, please use the `alert` command instead.');

		const gym = await this.client.Gyms.findOne({
			where: {
				guildId: message.guild.id,
				gymName: args.gym.toLowerCase(),
			},
		});
		if(!gym) return message.channel.send(`Could not find a gym by the name of ${args.gym}.`);

		const fi_r = await prodOut.produceOut(gym, message.channel, gym.gymName, message.author.id);
		const final_return = fi_r[0];
		message.channel.send(final_return, { split: { maxLength: 1900, char: ',' } });

		// Now we update LiveRaids
		const gymMap = gym.gymMap.split('/');
		const coordinates = gymMap[gymMap.length - 1];
		try{
			await this.client.LiveRaids.update({
				name: gym.gymName,
				coordinates: coordinates,
			}, {
				where: {
					channelId: message.channel.id,
				},
			});
		}
		catch(e) {
			console.log(`Could not updae liveRaids for ${gym.gymName}, ${message.channel}`);
		}
	}
}

module.exports = ChangeCommand;
