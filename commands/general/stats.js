const { Command } = require('discord-akairo');
const { plotly_token, plotly_username } = require('../../config.json');
const plotly = require('plotly')(plotly_username, plotly_token);

function compressArray(original) {
	const compressed = [];
	// make a copy of the input array
	const copy = original.slice(0);

	// first loop goes over every element
	for (let i = 0; i < original.length; i++) {
		let myCount = 0;
		for (let w = 0; w < copy.length; w++) {
			if (original[i] == copy[w]) {
				// increase amount of times duplicate is found
				myCount++;
				delete copy[w];
			}
		}
		if (myCount > 0) {
			const a = new Object();
			a.value = original[i];
			a.count = myCount;
			compressed.push(a);
		}
	}
	return compressed;
}

function formatDate(date) {
	const d = new Date(date);
	let month = '' + (d.getMonth() + 1);
	let day = '' + d.getDate();
	const year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
}

class StatsCommand extends Command {
	constructor() {
		super('stats', {
			aliases: ['stats', 's', 'stat'],
			category: 'general',
			description: {
				content: 'Shows some stats about the gyms used in this group.',
				usage: '<gym name>',
				examples: ['', 'Gym Name'],
			},
			args: [
				{
					id: 'gym',
					match: 'content',
					type: 'lowercase',
				},
			],
		});
	}

	async exec(message, { gym }) {
		if(gym && gym.toLowerCase() == 'all') gym = null;

		let allGyms;
		if(!gym) {
			allGyms = await message.client.Stats.findAll({
				attributes: ['timestamp'],
			});
		}
		else {
			allGyms = await message.client.Stats.findAll({
				attributes: ['timestamp'], where: {
					gymName: gym.toLowerCase(),
				},
			});
		}
		if(gym && !allGyms) return message.channel.send('could not find a gym by that name');

		// Grab dates and format them for plotly to be happy
		const gymTimes = allGyms.map(y => formatDate((new Date(parseInt(y.timestamp))).toUTCString()));

		// will format things of the style [{value: 'gymName', count: #}]
		const compressed = compressArray(gymTimes);

		const xAxis = compressed.map(time => time.value);
		const yAxis = compressed.map(time => time.count);

		// https://github.com/plotly/plotly-nodejs
		const trace1 = {
			x: xAxis,
			y: yAxis,
			mode: 'markers',
			type: 'scatter',
		};

		// Define the range to be one count above and below from max and min
		const range = [Math.min(yAxis) - 1, Math.max(yAxis) + 1];
		const layout = {
			title: { text: gym ? gym : 'All gyms' },
			xaxis: {
				title: 'Raid callout dates',
				autorange: true,
				showline: true,
			},
			yaxis: {
				title: '# of occurences',
				range: range,
				rangemode: 'tozero',
				showline: true,
			},
			paper_bgcolor: 'rgba(230,230,230,0.9)',
			plot_bgcolor: 'rgba(183,183,183,0.9)',
		};

		const figure = { 'data': [trace1], 'layout': layout };

		const imgOpts = {
			format: 'png',
			width: 1000,
			height: 500,
		};

		plotly.getImage(figure, imgOpts, async function(error, imageStream) {
			if (error) {
				message.channel.send('Something went horribly wrong with my plotting.');
				return console.log (error);
			}
			message.channel.send({
				files: [{
					attachment: imageStream,
					name: '1.png',
				}],
			});
		});
	}
}

module.exports = StatsCommand;
