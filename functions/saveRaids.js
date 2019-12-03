const chanName = require('../functions/isolateNames.js');


module.exports = {
	saveLiveRaids: async function(channel, gymName, gym, veto = false) {
		// To be safe, first fetch the db to see if this already exists
		// If it does, quit the function.
		const liveChannel = await channel.client.LiveRaids.findOne({
			where: {
				channelId: channel.id,
				guildId: channel.guild.id,
			},
		});
		if(liveChannel && !veto) return;

		// eslint-disable-next-line
		let [channel_gym, pokemon, eggLevel] = chanName.getChanGym(channel);
		const channelArr = channel.name.split('-');

		let timeEnd = '';
		let timeHatch = '';
		/*
		The channel names will be in one of the following forms
		1) # gym name goes here
		2) Hatched # gym name goes here
		3) pokemonName gym name goes here
		*/
		const isHatched = (channelArr[0].toLowerCase() == 'hatched') ? true : false;

		// if channel does not start with 'level' or 'pokemonName'
		if(!isHatched && !eggLevel && !pokemon) return;

		/* Basically have 2 formats
		1) Hatches on March 10 at 10:04 AM | Ends on March 10 at 10:49 AM
		2)Ends on March 10 at 10:49 AM */
		if(channel.topic) {
			const regex = /(\d\d:\d\d)/g;
			const times = channel.topic.match(regex);

			if(eggLevel) timeHatch = times[0];
			timeEnd = times[times.length - 1];
		}
		const gymMap = gym.gymMap.split('/');
		const coordinates = gymMap[gymMap.length - 1];

		channel.client.LiveRaids.create({
			guildId: channel.guild.id,
			channelId: channel.id,
			isEgg: eggLevel ? true : false,
			isExpired: false,
			level: eggLevel,
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
