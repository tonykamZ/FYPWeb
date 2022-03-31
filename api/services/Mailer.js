module.exports.sendWelcomeMail = function (obj) {
    sails.hooks.email.send(
        "welcomeEmail",
        {
            Name: obj.name
        },
        {
            to: obj.email,
            subject: "Welcome Email"
        },
        function (err) { console.log(err || "Mail Sent!"); }
    )
}

module.exports.sendDealMailtoMember = function (obj) {
    sails.hooks.email.send(
        "dealEmailMember",
        {
            name: obj.name,
            title: obj.title,
            host : obj.host,
            date : obj.date,
        },
        {
            to: obj.email,
            subject: "Your joined post is full of members! Please check out!"
        },
        function (err) { console.log(err || "Mail Sent!"); }
    )
}

module.exports.sendDealMailtoHost = function (obj) {
    sails.hooks.email.send(
        "dealEmailHost",
        {
            name: obj.name,
            title: obj.title,
            id: obj.id,
            date : obj.date,
        },
        {
            to: obj.email,
            subject: "Your hosting post is full of members! Please check out!"
        },
        function (err) { console.log(err || "Mail Sent!"); }
    )
}

module.exports.sendBanMail = function (obj) {
    sails.hooks.email.send(
        "ban",
        {
            name: obj.name,
            date : obj.date,
        },
        {
            to: obj.email,
            subject: "Your account has been banned!"
        },
        function (err) { console.log(err || "Mail Sent!"); }
    )
}