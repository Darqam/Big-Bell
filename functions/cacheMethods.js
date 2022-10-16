async function cacheGymList(client) {
    client.gymList = await client.Gyms.findAll();
}

async function cacheStopList(client) {
    client.stopList = await client.Pokestops.findAll();
}

async function cacheUserGymList(client, user) {
    // If it does not exist, make it an empty object
    if (!client.userGymList) client.userGymList = {};

    client.userGymList[user.id] = await client.UserGyms.findAll({
        where: {
            userId: user.id,
        }
    });
}

async function cacheRocketLeaders(client) {
    client.rocketLeaders = await client.RocketLeaders.findAll();
}

module.exports = {
	cacheGymList: cacheGymList,
    cacheStopList: cacheStopList,
    cacheUserGymList: cacheUserGymList,
    cacheRocketLeaders: cacheRocketLeaders,
}