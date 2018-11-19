const { Command } = require('discord-akairo');
const { plotly_token, plotly_username } = require('../../config.json');
const plotly = require('plotly')(plotly_username, plotly_token);

class TestCommand extends Command {
	constructor() {
		super('test', {
			aliases: ['test'],
			category: 'owner',
			description: {
				content: 'Testing.',
				usage: '',
			},
			ownerOnly: true,
		});
	}

	async exec(message) {
		// https://github.com/plotly/plotly-nodejs
		const trace1 = {
			x: [1, 2, 3, 4],
			y: [10, 15, 13, 17],
			type: 'scatter',
		};

		const layout = {
			paper_bgcolor: 'rgba(0,0,0,0)',
			plot_bgcolor: 'rgba(0,0,0,0)',
		};

		const figure = { 'data': [trace1], 'layout': layout };

		const imgOpts = {
			format: 'png',
			width: 1000,
			height: 500,
		};

		plotly.getImage(figure, imgOpts, async function(error, imageStream) {
			if (error) return console.log (error);

			message.channel.send('test', {
				files: [{
					attachment: imageStream,
					name: '1.png',
				}],
			});
		});
	}
}

module.exports = TestCommand;
