const { Command } = require('discord-akairo');
const { plotly_token, plotly_username } = require('../../config.json');
const plotly = require('plotly')(plotly_username, plotly_token);

function formatDate(timestamp) {
	const d = new Date(parseInt(timestamp));
	let day = d.getDate();
	let month = d.getMonth() + 1;
	const year = d.getFullYear();
	let hours = d.getHours();
	let minutes = d.getMinutes();
	let seconds = d.getSeconds();

	if(month < 10) month = `0${month}`;
	if(day < 10) day = `0${day}`;
	if(hours < 10) hours = `0${hours}`;
	if(minutes < 10) minutes = `0${minutes}`;
	if(seconds < 10) seconds = `0${seconds}`;

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

class SystemCommand extends Command {
	constructor() {
		super('system', {
			aliases: ['system', 'sys'],
			category: 'general',
			description: {
				content: 'Provides information about the bot process.',
				usage: '<memory|botUptime|processUptime>',
			},
			args: [
				{
					id: 'detail',
					match: 'content',
					optional: true,
				},
			],
		});
	}

	async exec(message, args) {
		if(!args.detail) args.detail = 'memory';
		const valid_values = ['memory', 'botUptime', 'processUptime'];
		if(!valid_values.includes(args.detail)) return message.channel.send('Invalid parameter');

		message.channel.startTyping();
		const memory = await this.client.Memory.findAll();

		let yAxisTitle;
		let rangemode;

		// new Set schenanigans to remove possible duplicates
		const xAxis = [...new Set(memory.map(entry => formatDate(entry.timestamp)))];

		const yAxis = memory.map(entry => {
			if(args.detail == 'memory') {
				yAxisTitle = 'MB';
				rangemode = 'auto';
				return entry[args.detail] / 1024 / 1024;
			}
			yAxisTitle = 'Hours';
			rangemode = 'tozero';
			return entry[args.detail] / 360000;
		});
		console.log(yAxis);

		// https://github.com/plotly/plotly-nodejs
		const trace1 = {
			x: xAxis,
			y: yAxis,
			mode: 'markers',
			type: 'scatter',
		};

		const range = [Math.min(yAxis) - 1, Math.max(yAxis) + 1];
		const layout = {
			title: { text: args.detail },
			xaxis: {
				title: 'System time',
				autorange: true,
				showline: true,
			},
			yaxis: {
				title: yAxisTitle,
				range: range,
				rangemode: rangemode,
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
			if (error) return console.log (error);

			message.channel.send({
				files: [{
					attachment: imageStream,
					name: '1.png',
				}],
			});
		});
		message.channel.stopTyping();
	}
}

module.exports = SystemCommand;
