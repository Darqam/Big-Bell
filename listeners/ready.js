const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            eventName: 'ready',
            type: 'once'
        });
    }

    exec() {
        console.log('I\'m ready!');
    }
}

module.exports = ReadyListener;
