const { PermissionsBitField } = require('discord.js');

async function deleteLiveRaid(channel) {
	// if(channel.guild.id !== '338745842028511235') return;
	const liveChannel = await channel.client.LiveRaids.findOne({
		where: {
			channelId: channel.id,
			guildId: channel.guild.id,
		},
	});
	if(liveChannel) {
		const rowCount = await channel.client.LiveRaids.destroy({ where:
			{ channelId: channel.id,
				guildId: channel.guild.id,
			},
		});
		if(!rowCount) return console.log(`Could not delete channel ${channel.name} from live raid database for some reason.`);
		else return console.log(`Deleted channel ${channel.name} from live raids.`);
	}
	return console.log(`Could not find channel ${channel.name} in live raids`);
}

module.exports = {
    name: 'channelDelete',
	async execute(channel) {
		const perm = new PermissionsBitField(channel.permissionsFor(channel.guild.members.me));
		if(!perm.has('VIEW_CHANNEL')) return;
		deleteLiveRaid(channel);
		const channelConfig = await channel.client.Announcements.findOne({
			where: {
				channelId: channel.id,
			},
		});
		if(channelConfig) {
			const rowCount = await channel.client.Announcements.destroy({ where:
				{ channelId: channel.id },
			});
			if(!rowCount) return console.log('Could not delete channel from pinged database for some reason.');
			else return console.log('Deleted channel from pinged database.');
		}
		return console.log('Channel was deleted, not held within ping database.');
	}
}