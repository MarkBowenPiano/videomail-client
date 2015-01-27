var merge           = require('merge-recursive'),
    async           = require('async'),

    Resource        = require('./resource'),

    Container       = require('./wrappers/container'),

    VideomailError  = require('./util/videomailError'),
    Browser         = require('./util/browser'),
    standardize     = require('./util/standardize'),
    RecordTimer     = require('./util/timers/record'),

    browser         = new Browser(),
    resource        = new Resource()

// todo: consider using a web component instead!

function factory() {

    return {
        globalOptions: {
            logger:             console,
            debug:              false,
            timeout:            6000,
            baseUrl:            'https://videomail.io',
            socketUrl:          'wss://videomail.io',
            reconnect:          true,
            cache:              true,
            insertCss:          true,
            enablePause:        true,
            enableAutoPause:    true,
            enableSpace:        true,
            selectors: {
                containerId:    'videomail',
                replayClass:    'replay',
                userMediaClass: 'userMedia',
                visualsClass:   'visuals',
                buttonsClass:   'buttons',

                recordButtonClass: 'record',
                pauseButtonClass:  'pause',
                resumeButtonClass: 'resume',
                stopButtonClass:   'stop',
                backButtonClass:   'back',
            },
            audio: {
                enabled: false
            },
            video: {
                fps:            15,
                limitSeconds:   60,
                countdown:      3,
                width:          320,
                height:         240
            },
            image: {
                quality:    .8,
                types:      ['webp', 'jpeg']
            },
            text: {
                paused: 'Paused'
            }
        },

        setGlobalOptions: function(newGlobalOptions) {
            this.globalOptions = merge.recursive(this.globalOptions, newGlobalOptions)
        },

        getOptions: function(localOptions) {
            localOptions = merge.recursive(this.globalOptions, localOptions || {})

            if (localOptions.debug)
                localOptions.debug = localOptions.logger.debug.bind(localOptions.logger)
            else
                localOptions.debug = function() {}

            return localOptions
        },

        init: function(localOptions, cb) {

            if (!cb && typeof localOptions === 'function') {
                cb           = localOptions
                localOptions = this.getOptions()
            } else
                localOptions = this.getOptions(localOptions)

            if (!cb)
                 cb = function(err) {
                    err && localOptions.logger.error(err)
                 }

            async.series({
                controller: function(cb) {
                    var container = new Container(localOptions)
                    container.build(cb)
                },

                videomail: function(cb) {
                    if (localOptions.load)
                        Videomail.get(localOptions.load, localOptions, cb)
                    else
                        cb()
                }

            }, function(err, results) {
                if (err) {
                    results.controller.unload(err)
                    cb(err)
                } else {
                    cb(null, results.controller, results.videomail)
                }
            })
        },

        get: function(identifier, options, cb) {
            if (!cb) {
                cb      = options
                options = this.globalOptions
            }

            resource.get(identifier, options, cb)
        },

        post: function(videomail, options, cb) {
            if (!cb) {
                cb      = options
                options = this.globalOptions
            }

            resource.post(videomail, options, cb)
        },

        canRecord: function() {
            return browser.canRecord()
        },

        createError: function(err) {
            return VideomailError.create(err)
        },

        createRecordTimer: function(localOptions) {
            return new RecordTimer(this.getOptions(localOptions))
        }
    }
}

// UMD (Universal Module Definition)
// Inspired by https://github.com/es-shims/es5-shim
;(function(navigator, factory) {
    standardize(this, navigator)

    this.Videomail = factory()

    if (typeof exports === 'object')
        module.exports = this.Videomail

}(navigator, factory))
