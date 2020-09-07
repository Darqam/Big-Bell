let pokemons = require('../data/pokemons.json');

module.exports = {
	getChanGym: function(channel) {
		pokemons = pokemons.map(p => p.toLowerCase());
		const channel_array = channel.name.split('-');
		let channel_gym;
		let channelMon = [];
		let eggLvl = '';
		let isMega = false;

		// If we have a mega, toggle flag and remove mega prefix
		if(channel_array[0].toLowerCase() == 'mega') {
			isMega = true;
			channel_array.shift();
		}

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
		if(!channel_gym && num && (num >= 1 && num <= 7)) {
			eggLvl = channel_array[0];
			channel_gym = channel_array.slice(1).join(' ');
		}

		// Case 2.5, mega raid egg. m-park-name
		if(!channel_gym && channel_array[0] == 'm') {
			eggLvl = '7';
			channel_gym = channel_array.slice(1).join(' ');
		}

		// Case 3, hatched raid egg: hatched-X-gym-name-here
		num = parseInt(channel_array[1]);
		if(!channel_gym && channel_array[0].toLowerCase() == 'hatched' && num && (num >= 1 && num <= 7)) {
			eggLvl = channel_array[1];
			channel_gym = channel_array.slice(2).join(' ');
		}

		// Case 4, mega raid egg: mega-gym-name
		// note that due to slice channel_arr would be just gym-name
		if(!channel_gym && isMega) {
			channel_gym = channel_array.join(' ');
		}

		return [channel_gym, (isMega ? 'mega ' : '') + channelMon.join('-'), eggLvl];
	},
};
