const { cacheGymList, cacheStopList } = require('../functions/cacheMethods.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Make sure we cache our lists
        await cacheGymList(client);
        await cacheStopList(client);

        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}