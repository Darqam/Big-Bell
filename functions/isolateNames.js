let pokemons = require('../data/pokemons.json');

module.exports = {
	getChanGym: function(channel) {
		pokemons = pokemons.map(p => p.toLowerCase());
		const channel_array = channel.name.split('-');
		let channel_gym;
		let channelMon = [];
		let eggLvl = '';

		// Let's start isolating channel name here
		// Case 1, regular raid. Assume format pokemonName-gym-name-here
		// There is only (so far) a few pokemons with `-` in their name,
		// when they do it's only there once
		if(pokemons.includes(channel_array[0] + '-' + channel_array[1])) {
			channelMon = channel_array.splice(0, 2);
			channel_gym = channel_array.join(' ');
		}
		else if(pokemons.includes(channel_array[0])) {
			channelMon = channel_array.splice(0, 1);
			channel_gym = channel_array.join(' ');
		}

		// Case 2, raid egg. Assume format X-park-name
		let num = parseInt(channel_array[0]);
		if(!channel_gym && num && (num >= 1 && num <= 5)) {
			eggLvl = channel_array[0];
			channel_gym = channel_array.slice(1).join(' ');
		}

		// Case 3, hatched raid egg: hatched-level-X-egg-gym-name-here
		num = parseInt(channel_array[1]);
		if(!channel_gym && channel_array[0].toLowerCase() == 'hatched' && num && (num >= 1 && num <= 5)) {
			eggLvl = channel_array[1];
			channel_gym = channel_array.slice(2).join(' ');
		}
		return [channel_gym, channelMon.join('-'), eggLvl];
	},
};
