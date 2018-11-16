const { Command } = require('discord-akairo');
const { stripIndents } = require('common-tags');

class StatsCommand extends Command {
	constructor() {
		super('stats', {
			aliases: ['stats', 's', 'stat', 'info'],
			description: 'stats Gym Name\nShows a few stats for the given gym.',
			args: [
				{
					id: 'gym_name',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.gym_name) return message.reply('No gyms found in query');
		const gym_name = args.gym_name.split(',')[0].trim();

		const gym = await this.client.Gyms.findOne({
			where: {
				GymName: gym_name,
			},
		});
		if(gym) {
			const length = gym.userIds.split(',')[0] == '' ? 0 : gym.userIds.split(',').length;
			const user = await this.client.users.fetch(gym.submittedById);
			return message.channel.send(stripIndents`Gym name: ${gym_name}
				Amount of people monitoring this gym: ${length}
				Gym submitted by: ${user.tag}
				Gym submission done on ${gym.submittedOn}
				Gym list was pinged ${gym.timesPinged} times
				Map to the gym: <${gym.gymDirections}>
				Times this gym hosted an Ex Raid: ${gym.exRaidNumber}
				Eligibility of gym for Ex Raids: ${gym.exRaidEligibility}
				`);
		}
		else {
			return message.reply(`Could not find a gym by the name of ${gym_name}.`);
		}
	}
}

module.exports = StatsCommand;
