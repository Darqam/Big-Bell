module.exports = {
	sanitizeArgs: function(args, client=null) {
		const timeRegex = /^[0-2]?[0-9]:[0-5][0-9]$/;
		// Let's check time parameters

		if(args.start) {
			startMatch = args.start.match(timeRegex);

			if (!startMatch || startMatch.length < 1) {
				return [1, 'I could not match your start time in the format ##:##, aborting. Please try again.'];
			} else {
				args.start = startMatch[0]
			}
		}
		if(args.end) {
			endMatch = args.end.match(timeRegex);

			if (!endMatch || endMatch.length < 1) {
				return [1, 'I could not match your end time in the format ##:##, aborting. Please try again.'];
			} else {
				args.end = endMatch[0]
			}
		}

		if(args.end && args.start) {
			let endSplit = args.end.match(timeRegex)[0].split(':');
			let startSplit = args.start.match(timeRegex)[0].split(':');
			
			// Convert the strings to numbers
			endSplit = endSplit.map(e => parseInt(e))
			startSplit = startSplit.map(e => parseInt(e))

			if(endSplit[0] < startSplit[0] || (endSplit[0] == startSplit[0] && endSplit[1] <= startSplit[1])) {
				return [1, 'Got an end time before or equal to start time, aborting. Please try again.'];
			}
		}

		// Now we check level args
		if(args.levels) {
			let levels = args.levels ? args.levels.split(',') : [];
			levels = levels.map(l => l.trim());

			// Remove duplicates
			levels = [...new Set(levels)];

			// Keep only 1-7 values
			if(levels.filter(n => parseInt(n) < 1 || parseInt(n) > 7 || isNaN(parseInt(n))).length > 0) levels = null;
			if(!levels) return [1, 'I could not match your levels format in the format `#,#,#`, aborting. Please try again.'];
			args.levels = levels;
		}

		// Now we check pokemon list
		if(args.pokemons) {
			args.pokemons = args.pokemons ? args.pokemons.match(/['a-zA-Z\s\-\u00C0-\u017F.]+/g) : [];
			if(args.pokemons.length == 0) return [1, 'I could not match the pokemon name formats (alphabetical, with accents, spaces, and `.-` allowed), aborting. Please try again.'];
		}

		// Check if disable is proper
		if(args.disabled) {
			if(args.disabled.toLowerCase() !== 'true' && args.disabled.toLowerCase() !== 'false') {
				return [1, 'Could not understand your disabled input, please state either `true` or `false`.'];
			}
			args.disabled = args.disabled.toLowerCase();
		}

		if(args.pokestop_name) {
			let stopName = args.pokestop_name.trim().replace('’', '\'');
			if(!stopName) {
				return [1, 'Could not understand the stop name.'];
			}
			
			args.pokestop_name = stopName;
		}

		if(args.leader) {
			let leader = args.leader.trim();
			// ensure starts with capital, rest lowercase
			leader = `${leader[0].toUpperCase()}${leader.substring(1).toLowerCase()}`;

			const validLeaders = client.ValidRocketLeaders;
			if (!validLeaders.includes(leader.toLowerCase())) {
				return [1, `⚠️ The rocket leader name is not one of \`${validLeaders.join(', ')}\``];
			}

			args.leader = leader;

		}

		if(args.loadout) {
			args.loadout = args.loadout?.trim();
			args.loadout = args.loadout.replace(/\n/i, '');
			// This just to avoid null in db
			if (!args.loadout) args.loadout = '';
		}

		return [0, '', args];
	},
};
