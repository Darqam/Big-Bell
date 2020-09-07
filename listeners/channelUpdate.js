const { Listener } = require('discord-akairo');
const { Permissions } = require('discord.js');

let pokemons = require('../data/pokemons.json');

class ChannelUpdateListener extends Listener {
	constructor() {
		super('channelUpdate', {
			emitter: 'client',
			event: 'channelUpdate',
		});
	}

	async exec(oldChannel, newChannel) {
		// if(newChannel.guild.id !== '338745842028511235') return;
		const perm = new Permissions(newChannel.permissionsFor(newChannel.guild.me));
		if(!perm.has('VIEW_CHANNEL')) return;
		const liveChannel = await oldChannel.client.LiveRaids.findOne({
			where: {
				channelId: oldChannel.id,
				guildId: oldChannel.guild.id,
			},
		});
		if(!liveChannel) return;
		// From here on we should only be treating proper raid channels already in the live raid tracker

		// Check if this update was to archive the channel, if yes, delete.
		if(newChannel.name.toLowerCase().startsWith('archived')) {
			const rowCount = await newChannel.client.LiveRaids.destroy({ where:
				{ channelId: newChannel.id,
					guildId: newChannel.guild.id,
				},
			});
			if(!rowCount) return console.log(`Could not delete channel ${newChannel.name} from live raid database for some reason.`);
			else return console.log(`Deleted channel ${newChannel.name} from live raids.`);
		}
		// Really the only thing that gets updated is timers and pokemon name

		pokemons = pokemons.map(p => p.toLowerCase());
		let pokemon = '';
		let isEgg = false;
		let isMega = false;

		const channelArr = newChannel.name.split('-');
		// return because current setup is weird
		if(channelArr[0] == 'm' && (oldChannel.name == newChannel.name)) return;

		// If we have a mega, toggle flag and remove mega prefix
		if(channelArr[0].toLowerCase() == 'mega') {
			isMega = true;
			channelArr.shift();
		}

		if(channelArr[2]) isEgg = (channelArr[2].toLowerCase() == 'egg') ? true : false;
		const isHatched = (channelArr[0].toLowerCase() == 'hatched') ? true : false;
		const isExpired = (channelArr[0].toLowerCase() == 'expired') ? true : false;

		const regex = /(\d\d:\d\d)/g;
		let times;
		await newChannel.messages.fetch();
		const msg = newChannel.messages.first();
		if(msg.embeds[0]) {
			times = msg.embeds[0].footer.text.match(regex);
		}
		let timeHatch;
		let timeEnd;
		if(times) {
			timeHatch = (isEgg && times) ? times[1] : '';
			timeEnd = times ? times[times.length - 1] : '';
		}
		else {
			timeHatch = (isEgg && times) ? '00:00' : '';
			timeEnd = times ? '00:00' : '';
		}

		// If the channel is expired, the word `expired` is pre-pended to channel name
		// Offset deals with the extra word
		const offset = isExpired ? 1 : 0;

		if(!isEgg && !isHatched) {
			if(pokemons.includes(channelArr[0 + offset] + '-' + channelArr[1 + offset])) {
				pokemon = channelArr.slice(0 + offset, 2).join('-');
			}
			else if(pokemons.includes(channelArr[0 + offset])) {
				pokemon = channelArr.slice(0 + offset, 1).join('');
			}
			pokemon = (isMega ? 'mega ' : '') + pokemon;
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
	}
}

module.exports = ChannelUpdateListener;
