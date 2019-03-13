let pokemons = require('../data/pokemons.json');

module.exports = {
	saveLiveRaids: async function(channel, gymName, gym) {
		// To be safe, first fetch the db to see if this already exists
		// If it does, quit the function.
		const liveChannel = await channel.client.LiveRaids.findOne({
			where: {
				channelId: channel.id,
				guildId: channel.guild.id,
			},
		});
		if(liveChannel) return;

		const channelArr = channel.name.split('-');
		pokemons = pokemons.map(p => p.toLowerCase());

		let pokemon = '';
		let level = 0;
		let timeEnd = '';
		let timeHatch = '';
		/*
		The channel names will be in one of the following forms
		1) Level X egg gym name goes here
		2) Hatched Level X egg gym name goes here
		3) pokemonName gym name goes here
		*/
		const isEgg = (channelArr[2].toLowerCase() == 'egg') ? true : false;
		const isHatched = (channelArr[0].toLowerCase() == 'hatched') ? true : false;

		if(isEgg) level = parseInt(channelArr[1]);
		else if(isHatched) level = parseInt(channelArr[2]);

		// There is only (so far) a few pokemons with `-` in their name,
		// when they do it's only there once
		if(!isEgg && !isHatched) {
			if(pokemons.includes(channelArr[0] + '-' + channelArr[1])) {
				pokemon = channelArr.slice(0, 2).join('-');
			}
			else if(pokemons.includes(channelArr[0])) {
				pokemon = channelArr.slice(0, 1).join('');
			}
		}

		// if channel does not start with 'level' or 'pokemonName'
		if(channelArr[0].toLowerCase() != 'level' && !pokemon) return;

		/* Basically have 2 formats
		1) Hatches on March 10 at 10:04 AM (10:04) | Ends on March 10 at 10:49 AM (10:49)
		2)Ends on March 10 at 10:49 AM (10:49) */

		if(channel.topic) {
			const regex = /(\d\d:\d\d)/g;
			const times = channel.topic.match(regex);

			if(isEgg) timeHatch = times[1];
			timeEnd = times[times.length - 1];
		}
		const gymMap = gym.gymMap.split('/');
		const coordinates = gymMap[gymMap.length - 1];

		channel.client.LiveRaids.create({
			guildId: channel.guild.id,
			channelId: channel.id,
			isEgg: isEgg,
			isExpired: false,
			level: level,
			name: gymName,
			pokemon: pokemon,
			coordinates: coordinates,
			timeEnd: timeEnd,
			timeHatch: timeHatch,
		}).catch (e => {
			console.log('Error saving gym creation to stats.', e);
		});
	},
};
