const { Command } = require('discord-akairo');

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

		// Now we have a valid gym name, and gym object.
		// We need to fix liveRaids
		// We should probably edit stats
		// We need to fetch user list to ping.
		// Need to output maps + info for the right gym
	}
}

module.exports = ChangeCommand;
