var State = require('../../node_modules/buildy').State,
    mobstor = require('mobstor');

/**
 * Send content to MObStor. Simple Buildy wrapper for ynodejs_mobstor.
 * See http://devel.corp.yahoo.com/ynodejs_mobstor/
 *
 * Example:
 *
 * var Registry = require('../../node_modules/buildy').Registry,
 *     Queue = require('../../node_modules/buildy').Queue,
 *     reg = new Registry(),
 *     mobstor_config = {
 *         host: 'playground.yahoofs.com',
 *         proxy: {host : "yca-proxy.corp.yahoo.com", port : 3128}
 *     };
 *
 * reg.load(__dirname + '/mobstor.js'); // Mobstor task
 *
 * new Queue('deploy', {registry: reg})
 *     .task('files', ['mobstor.js'])
 *     .task('concat')
 *     .task('jsminify')
 *     .task('mobstor', {name: '/foo/bar/baz.js', config: mobstor_config})
 *     .task('write', {name: 'baz.js'})
 *     .task('inspect')
 *     .run();
 *
 * View output here: http://playground.yahoofs.com/foo/bar/baz.js
 *
 * @method mobstorTask
 * @param options {Object} MObStor task options.
 * @param options.name {String} Resource name.
 * @param options.config {Object} MObStor config (host, port, certificate, proxy).
 * @param status {EventEmitter} Status object, handles 'complete' and 'failed' task exit statuses.
 * @param logger {winston.Logger} Logger instance, if additional logging required (other than task exit status)
 * @return {undefined}
 * @public
 */
function mobstorTask(options, status, logger) {
    var self = this,
        name = options.name,
        client = mobstor.createClient(options.config);

    // Send content to mobstor.
    function storeFile(filename, content) {
        client.storeFile(filename, content, function(err, data) {
            if (err) {
                status.emit('failed', 'mobstor', 'error sending file: ' + err);
            } else {
                self._state.set(State.TYPES.STRING, content);
                status.emit('complete', 'mobstor', 'sent ' + filename);
            }
        });
    }

    switch (this._state.get().type) {
        case State.TYPES.FILES:
            storeFile(name, self._state.get().value.join("\n"));
            break;

        case State.TYPES.STRING:
            storeFile(name, self._state.get().value);
            break;

        case State.TYPES.STRINGS:
            storeFile(name, self._state.get().value.join(""));
            break;

        case State.TYPES.UNDEFINED:
            storeFile(name, "");
            break;

        default:
            status.emit('failed', 'mobstor', 'unrecognised input type: ' + this._type);
            break;
    }
}

exports.tasks = {
    'mobstor' : {
        callback: mobstorTask
    }
};