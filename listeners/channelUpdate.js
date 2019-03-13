const { Listener } = require('discord-akairo');

let pokemons = require('../data/pokemons.json');

class ChannelUpdateListener extends Listener {
	constructor() {
		super('channelUpdate', {
			emitter: 'client',
			event: 'channelUpdate',
		});
	}

	async exec(oldChannel, newChannel) {
		if(newChannel.guild.id !== '338745842028511235') return;
		const liveChannel = await oldChannel.client.LiveRaids.findOne({
			where: {
				channelId: oldChannel.id,
				guildId: oldChannel.guild.id,
			},
		});
		if(!liveChannel) return;
		// From here on we should only be treating proper raid channels already in the live raid tracker
		// Really the only thing that gets updated is timers and pokemon name

		pokemons = pokemons.map(p => p.toLowerCase());
		let pokemon = '';
		let isEgg = false;

		const channelArr = newChannel.name.split('-');
		if(channelArr[2]) isEgg = (channelArr[2].toLowerCase() == 'egg') ? true : false;
		const isHatched = (channelArr[0].toLowerCase() == 'hatched') ? true : false;
		const isExpired = (channelArr[0].toLowerCase() == 'expired') ? true : false;

		const regex = /(\d\d:\d\d)/g;
		const times = newChannel.topic.match(regex);

		const timeHatch = isEgg ? times[1] : '';
		const timeEnd = times[times.length - 1];

		// If the channel is expired, the word `expired` is pre-pended to channel name
		// Offset deals with the extra word
		const offset = isExpired ? 1 : 0;

		if(!isEgg && !isHatched) {
			if(pokemons.includes(channelArr[0 + offset] + '-' + channelArr[1 + offset])) {
				pokemon = channelArr.slice(0, 2).join('-');
			}
			else if(pokemons.includes(channelArr[0 + offset])) {
				pokemon = channelArr.slice(0, 1).join('');
			}
		}
		const affectedRows = await oldChannel.client.LiveRaids.update({
			isEgg: isEgg,
			isExpired: isExpired,
			pokemon: pokemon,
			timeEnd: timeEnd,
			timeHatch: timeHatch,
		}, {
			where: {
				channelId: oldChannel.id,
				guildId: oldChannel.guild.id,
			},
		});
		if(affectedRows > 0) return console.log(`Updated live raids entry for ${newChannel.name}`);
		return console.log(`Could not update live raids entry for ${newChannel.name}`);
		/*
		const affectedRows = await Tags.update({ description: tagDescription }, { where: { name: tagName } });
		if (affectedRows > 0) {
			return message.reply(`Tag ${tagName} was edited.`);
		}
		return message.reply(`Could not find a tag with name ${tagName}.`);
		*/
	}
}

module.exports = ChannelUpdateListener;
