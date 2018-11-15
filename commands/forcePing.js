const { Command } = require('discord-akairo');
const chanName = require('../functions/isolateNames.js');
const multiResult = require('../functions/multiResult.js');
const chanList = require('../functions/findGyms.js');
const prodOut = require('../functions/prodOut.js');

class PingCommand extends Command {
	constructor() {
		super('alert', {
			aliases: ['alert', 'forcePing'],
			description: 'alert\nWill alert players about the gym. Must be used in a raid channel. Can only be used 2 minutes after channel creation and only if the ping hasn\'t already occured',
		});
	}

	async exec(message) {
		// Time in seconds
		const minimalTime = 120;
		// - Can only be called in raid-looking channels
		// - check creation timestamp to make sure people aren't jumping the gun
		// - fetch messages to make sure ping hasn't happened before.
		let channel_gym = chanName.getChanGym(message.channel);
		if(!channel_gym) return console.log('Not in a proper channel.');

		// Time difference in seconds
		const time_diff = (new Date() - message.channel.createdAt) / 1000;

		if(time_diff < minimalTime) {
			await message.react('⏲');
			return console.log('Elapsed time was not long enough.');
		}

		// Check in db if an announcement for this channel was made
		const is_ann = await this.client.Announcements.findOne({
			where: {
				channelId: message.channel.id,
			},
		});
		if(is_ann) {
			await message.react('511174899969032193');
			return console.log('Not pinging, ping for this already happened.');
		}

		// Now we deal with the logic
		let found = false;
		let results = [];
		let selection_done = false;

		let gym = await this.client.Gyms.findOne({
			where: {
				GymName: channel_gym,
			},
		});
		if(!gym) {
			const func_return = await chanList.getGymNames(this.client, channel_gym);
			results = func_return[0];
			found = func_return[1];
			gym = func_return[2];
			channel_gym = func_return[3];
		}
		else {
			found = true;
		}

		if(found) {
			if(results.length > 1) {
				const f_r = await multiResult.doQuery(`<@${message.author.id}>`, results, gym, channel_gym, message.channel, selection_done);
				results = f_r[0];
				gym = f_r[1];
				channel_gym = f_r[2];
				selection_done = f_r[3];
			}
			const fi_r = await prodOut.produceOut(gym, message.channel, channel_gym, selection_done, message.author.id, message.channel);
			const final_return = fi_r[0];
			channel_gym = fi_r[1];
			const disabled = fi_r[2];

			if(!disabled) message.channel.send(final_return, { split: { maxLength: 1900, char: ',' } });
			else return message.channel.send('List was already pinged, let\'s not bother them again.');
		}
		else {
			return message.channel.send('Could not find a gym based on the channel name.');
		}
	}
}

module.exports = PingCommand;
