module.exports = {
	getTriggers: async function(guild) {
		return new Promise(async (resolve) => {
			// Find roles that start with `EXtrigger`
			const triggerRoles = guild.roles.filter(x => x.name.startsWith('EXtrigger'));
			// Grab all stored gyms and grab their names
			const allGyms = await guild.client.Gyms.findAll({ attributes: ['GymName'] });
			const allGymNames = allGyms.map(x => x.GymName);
			const roles = [];

			triggerRoles.forEach(role => {
				const validGyms = [];
				const invalidGyms = [];
				const triggerNum = role.name.split(' ')[1];
				const roleGymName = role.name.split('-')[1].trim().toLowerCase();
				const gyms = roleGymName.split('/');
				gyms.forEach(gymName => {
					if(allGymNames.includes(gymName.trim())) {
						validGyms.push(gymName.trim());
					}
					else {
						invalidGyms.push(gymName.trim());
					}
				});
				roles.push({ number: triggerNum, validGymNames: validGyms, invalidGymNames: invalidGyms, role: role });
			});
			resolve(roles);
		});
	},
};
