const { cacheGymList, cacheStopList } = require('../functions/cacheMethods.js');
const util = require('util');

const mod_command_names = ['season_start'];
const mod_roles = ['215955553007042560'];

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Make sure we cache our lists
        await cacheGymList(client);
        await cacheStopList(client);

        const guild_commands = await client.guilds.cache.get('208330829435240449').commands.fetch();
        const mod_commands = guild_commands.filter(c => mod_command_names.includes(c.name));

        const role_permissions = []
        for(role of mod_roles) {
            role_permissions.push({
                id: role,
                type: 'ROLE',
                permission: true,
            });
        }

        let full_permissions = []
        for(const id of mod_commands.keys()) {
            full_permissions.push({
                id: id,
                permissions: role_permissions,
            });
        }

        await client.guilds.cache.get('208330829435240449').commands.permissions.set({fullPermissions: full_permissions});

        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}