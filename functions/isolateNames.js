let pokemons = require('../data/pokemons.json');

module.exports = {
	getChanGym: function(channel) {
		pokemons = pokemons.map(p => p.toLowerCase());
		const channel_array = channel.name.split('-');
		let channel_gym;

		// Let's start isolating channel name here
		// Case 1, regular raid. Assume format pokemonName-gym-name-here
		// There is only (so far) a few pokemons with `-` in their name,
		// when they do it's only there once
		if(pokemons.includes(channel_array[0] + '-' + channel_array[1])) {
			channel_array.splice(0, 2);
			channel_gym = channel_array.join(' ');
		}
		else if(pokemons.includes(channel_array[0])) {
			channel_array.splice(0, 1);
			channel_gym = channel_array.join(' ');
		}

		// Case 2, raid egg. Assume format level-X-egg-park-name
		if(!channel_gym && channel_array[0].toLowerCase() == 'level' && channel_array[2].toLowerCase() == 'egg') {
			channel_gym = channel_array.slice(3).join(' ');
		}

		// Case 3, hatched raid egg: hatched-level-X-egg-gym-name-here
		if(!channel_gym && channel_array[0].toLowerCase() == 'hatched' && channel_array[1].toLowerCase() == 'level' && channel_array[3].toLowerCase() == 'egg') {
			channel_gym = channel_array.slice(4).join(' ');
		}
		return channel_gym;
	},
};
