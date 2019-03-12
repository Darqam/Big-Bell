const { Listener } = require('discord-akairo');

const chanName = require('../functions/isolateNames.js');
const chanList = require('../functions/findGyms.js');
const multiResult = require('../functions/multiResult.js');
const prodOut = require('../functions/prodOut.js');
const stats = require('../functions/writeStats.js');
let pokemons = require('../data/pokemons.json');


function saveLiveRaids(channel, gymName, gym) {
	const channelArr = channel.name.split('-');
	pokemons = pokemons.map(p => p.toLowerCase());

	let pokemon = '';
	let level = 0;
	let timeEnd = '';
	let timeHatch = '';
	/*
	The channel names will be in one of the following forms
	1) Level X egg gym name goes here
	2) Hatched Level X egg gym name goes here
	3) pokemonName gym name goes here
	*/
	const isEgg = (channelArr[2].toLowerCase() == 'egg') ? true : false;
	const isHatched = (channelArr[0].toLowerCase() == 'hatched') ? true : false;

	if(isEgg) level = parseInt(channelArr[1]);
	else if(isHatched) level = parseInt(channelArr[2]);

	// There is only (so far) a few pokemons with `-` in their name,
	// when they do it's only there once
	if(!isEgg && !isHatched) {
		if(pokemons.includes(channelArr[0] + '-' + channelArr[1])) {
			pokemon = channelArr.slice(0, 2).join('-');
		}
		else if(pokemons.includes(channelArr[0])) {
			pokemon = channelArr.slice(0, 1).join('');
		}
	}

	// if channel does not start with 'level' or 'pokemonName'
	if(channelArr[0].toLowerCase() != 'level' && !pokemon) return;

	/* Basically have 2 formats
	1) Hatches on March 10 at 10:04 AM (10:04) | Ends on March 10 at 10:49 AM (10:49)
	2)Ends on March 10 at 10:49 AM (10:49) */

	if(channel.topic) {
		const regex = /(\d\d:\d\d)/g;
		const times = channel.topic.match(regex);

		if(isEgg) timeHatch = times[1];
		timeEnd = times[times.length - 1];
	}
	const gymMap = gym.gymMap.split('/');
	const coordinates = gymMap[gymMap.length - 1];

	channel.client.LiveRaids.create({
		guildId: channel.guild.id,
		channelId: channel.id,
		isEgg: isEgg,
		isExpired: false,
		level: level,
		name: gymName,
		pokemon: pokemon,
		coordinates: coordinates,
		timeEnd: timeEnd,
		timeHatch: timeHatch,
	}).catch (e => {
		console.log('Error saving gym creation to stats.', e);
	});
}

class ChannelCreateListener extends Listener {
	constructor() {
		super('channelCreate', {
			emitter: 'client',
			event: 'channelCreate',
		});
	}

	async exec(channel) {

		if(!channel.guild) return;

		// hard code ignore other guilds
		if(channel.guild.id !== '338745842028511235') return;
		// Figure out which channel to send this to

		/* let send_chan = await this.client.Config.findOne({
			where: { guildId: channel.guild.id },
		});
		// If there is nothing configured for this guild, do nothing
		if(!send_chan) return console.log('No configs set, returning.');
		else send_chan = this.client.channels.get(send_chan.announcementChan); */

		// Choice was made to make it send to raid channel instead, so here is bypass.
		const send_chan = channel;

		let results = [];
		const delay = 5 * 1000;
		let found = false;
		let selection_done = false;

		let channel_gym = chanName.getChanGym(channel);
		console.log(`New channel created with the name ${channel.name}`);

		if(!channel_gym) {
			console.log(`Could not match a gym pattern for ${channel.name}`);
			return;
		}

		// From here on, we *should* only have the gym name
		let gym = await this.client.Gyms.findOne({
			where: {
				GymName: channel_gym,
			},
		});
		if(!gym) {
			const func_return = await chanList.getGymNames(this.client, channel_gym);
			results = func_return[0];
			found = func_return[1];
			gym = func_return[2];
			channel_gym = func_return[3];
		}
		else {
			found = true;
		}

		if(found) {
			setTimeout(async () => {
				// This is run X seconds after channel create to give meowth time to post
				const messages = await channel.messages.fetch();
				const first = messages.last();

				let author_id = '';
				let author_mention = '';
				if(first && first.mentions.users.first()) {
					author_id = first.mentions.users.first().id;
					author_mention = ` <@${author_id}> `;
				}

				if(results.length > 1) {
					const f_r = await multiResult.doQuery(author_mention, results, gym, channel_gym, send_chan);

					// f_r[3] is basically an abort boolean
					if(f_r[3] == true) return undefined;

					results = f_r[0];
					gym = f_r[1];
					channel_gym = f_r[2];
					selection_done = true;
				}
				// At this point channel_gym will be the 'valid' gym name

				// This doesn't need to resolve before the rest can go, so no await
				stats.writeStats(this.client, channel_gym);
				saveLiveRaids(channel, channel_gym, gym);

				const fi_r = await prodOut.produceOut(gym, channel, channel_gym, selection_done, author_id, send_chan);
				const final_return = fi_r[0];
				channel_gym = fi_r[1];

				return send_chan.send(final_return, { split: { maxLength: 1900, char: ',' } });
			}, delay);
		}
		else {
			console.log(`Found nothing for ${channel_gym}.`);
		}
	}
}

module.exports = ChannelCreateListener;
