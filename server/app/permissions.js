var rbac = require('mongoose-rbac');

module.export = rbac.init({
    admin: [
        { action: 'read', subject: 'profile' },
        { action: 'read', subject: 'unlink' },
        { action: 'create', subject: 'profile' },
        { action: 'update', subject: 'profile' },
        { action: 'delete', subject: 'profile' }
    ],
    developer: [
        // we can also specify permissions as an object
        { action: 'read', subject: 'profile' }
    ],
    operator: [
        // we can also specify permissions as an object
        { action: 'read', subject: 'profile' }
    ]

}, function (err, admin, readonly) {
    console.log(admin);
    /*
     { __v: 1,
     name: 'admin',
     _id: 513c14dbc90000d10100004e,
     permissions: [ 513c14dbc90000d101000044,
     513c14dbc90000d101000045,
     513c14dbc90000d101000046,
     513c14dbc90000d101000047 ] }
     */
    console.log(readonly);
    /*
     { __v: 1,
     name: 'readonly',
     _id: 513c14dbc90000d10100004f,
     permissions: [ 513c14dbc90000d101000045 ] }
     */
});