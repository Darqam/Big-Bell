const { Command } = require('discord-akairo');

class StatsCommand extends Command {
	constructor() {
		super('test', {
			aliases: ['test'],
			description: 'testing',
		});
	}

	async exec(message) {
		const sheet_position = 6;
		let GoogleSpreadsheet = require('google-spreadsheet');
		var async = require('async');
		var sheet;

		// Create a document object using the ID of the spreadsheet - obtained from its URL.
		var doc = new GoogleSpreadsheet('1k6Gt4J323JnEB3oud_vK8gGyELoC0jha4etYXvFSbAk');

		// Authenticate with the Google Spreadsheets API.
		async.series([
			function setAuth(step) {
				// see notes below for authentication instructions!
				var creds = require('../saskPokemonGym-5a6d9b796bde.json');

				doc.useServiceAccountAuth(creds, step);
			},
			function getInfoAndWorksheets(step) {
				doc.getInfo(function(err, info) {
					console.log('Loaded doc: '+info.title+' by '+info.author.email);
					sheet = info.worksheets[sheet_position];
					console.log('sheet 6: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
					step();
				});
			},
			function workingWithRows(step) {
				// google provides some query options
				sheet.getRows({
					offset: 1,
					orderby: 'col2'
				}, function(err, rows) {
					console.log('Read ' + rows.length + ' rows');

					step();
				});
			},
		], function(err) {
			if(err) {
				console.log('Error: ' + err);
			}
		});
		return message.reply('done');
	}
}

module.exports = StatsCommand;
