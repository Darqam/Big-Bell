module.exports = {
	debugList: async function(message, gymName, file, isChan = false) {
		try {
			const debugChan = message.client.channels.get('540922544429989922');
			const gymObject = await message.client.Gyms.findOne(
				{ where: { GymName: gymName } }
			);
			let gymList = gymObject.userIds.split(',').map(u =>message.client.users.get(u));
			gymList = gymList[0] ? gymList.map(u => u.username) : ['No more users'];
			const whatIs = isChan ? 'Channel called by name: ' : 'Message content was: ';
			debugChan.send(`${whatIs}\`${message.content}\`\nFrom user: ${message.author.username}\nNew user list for \`${gymName}\` is: \n\`\`\`\n${gymList.join('\n')}\n\`\`\`Ran in file \`${file}\``);
		}
		catch (e) {
			console.log('Error saving gym creation to stats.', e);
		}
	},
};
