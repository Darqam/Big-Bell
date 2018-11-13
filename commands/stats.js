const { Command } = require('discord-akairo');

class StatsCommand extends Command {
	constructor() {
		super('stats', {
			aliases: ['stats', 's', 'stat', 'info'],
			description: 'stats Gym Name\nShows a few stats for the given gym',
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
		let output = '';

		const gym = await this.client.Gyms.findOne({
			where: {
				GymName: gym_name,
			},
		});
		if(gym) {
      const length = gym.userIds.split(',')[0] == '' ? 0 : gym.userIds.split(',').length;
      const user = await this.client.users.fetch(gym.submittedById);
      return message.channel.send(`Gym name: ${gym_name}\nAmount of people monitoring this gym: ${length}\nGym submitted by: ${user.tag}\nGym submission done on ${gym.submittedOn}\nGym list was pinged ${gym.timesPinged} times`);
		}
    else {
      return message.reply(`Could not find a gym by the name of ${gym_name}.`)
    }

		return message.reply(output);
	}
}

module.exports = StatsCommand;
