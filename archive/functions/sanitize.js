module.exports = {
	sanitizeArgs: function(args) {
		const timeRegex = /^[0-2]?[0-9]:[0-5][0-9]$/;
		// Let's check time parameters
		if(args.start) {
			args.start = args.start.match(timeRegex)[0];
			if(!args.start) return [1, 'I could not match your start time in the format ##:##, aborting. Please try again.'];
		}
		if(args.end) {
			args.end = args.end.match(timeRegex)[0];
			if(!args.end) return [1, 'I could not match your end time in the format ##:##, aborting. Please try again.'];
		}

		if(args.end && args.start) {
			const endSplit = args.end.match(timeRegex)[0].split(':');
			const startSplit = args.start.match(timeRegex)[0].split(':');
			if(endSplit[0] < startSplit[0] || (endSplit[0] == startSplit[0] && endSplit[1] <= startSplit[1])) {
				return [1, 'Got an end time before or equal to start time, aborting. Please try again.'];
			}
		}

		// Now we check level args
		if(args.levels) {
			let levels = args.levels ? args.levels.split(',') : [];
			// Remove duplicates
			levels = [...new Set(levels)];
			// Keep only 1-5 values
			if(levels.filter(n => parseInt(n) < 1 || parseInt(n) > 5 || isNaN(parseInt(n))).length > 0) levels = null;
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

		return [0, '', args];
	},
};
