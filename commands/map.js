const { Command } = require('discord-akairo');
const chanName = require('../functions/isolateNames.js');


class MapCommand extends Command {
	constructor() {
		super('map', {
			aliases: ['map', 'maps', 'ex', 'exinfo'],
			description: 'map <gym name>\nProvides the map and ex raid info for the given gym. Defaults to gym in channel name if none are provided.',
			args: [
				{
					id: 'gym_name',
					match: 'content',
					type: 'lowercase',
					default: '',
				},
			],
		});
	}

	async exec(message, args) {
		const gym_name = args.gym_name ? args.gym_name.trim() : chanName.getChanGym(message.channel);

		const gym = await this.client.Gyms.findOne({
			where: {
				GymName: gym_name,
			},
		});
		if(gym) {
			const ex_out = gym.exRaidNumber > 0 ? `Times this gym hosted an Ex Raid: ${gym.exRaidNumber}` : `Eligibility of gym for Ex Raids: ${gym.exRaidEligibility}`;

      return message.channel.send(`Gym name: ${gym_name}\nMap to the gym: <${gym.gymDirections}>\n${ex_out}`);
		}
		else {
			return message.reply(args.gym_name ? `Could not find a gym by the name of ${args.gym_name.trim()}` : `Could not find a gym based on channel name: ${message.channel.name}`);
		}
	}
}

module.exports = MapCommand;
