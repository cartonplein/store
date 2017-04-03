import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SSR } from 'meteor/meteorhacks:ssr';

import '../imports/api/products.js';
import '../imports/api/shipping.js';
import '../imports/api/orders.js';
import '../imports/api/beacon.js';

var mg_api_key = Meteor.settings.private.mailgun.api_key;
var mg_domain = Meteor.settings.private.mailgun.domain;
var mailgun = require('mailgun-js')({apiKey: mg_api_key, domain: mg_domain});

Meteor.methods({
    'charge.create'(token, mode, client, amount) {
        //console.log('Creating charge:', email, amount);
        var sk = '';
        if (mode == 'TEST') {sk = Meteor.settings.private.stripe.sk_test};
        if (mode == 'LIVE') {sk = Meteor.settings.private.stripe.sk_live};
        var stripe = require("stripe")(sk);
        return stripe.charges.create({
            amount: parseInt(amount * 100),
            currency: "eur",
            source: token, // obtained with Stripe.js
            description: "[cartons] " + client.firstname + ' ' + client.lastname + ' <' + client.email + '> ' + client.phone,
            //receipt_email: email,
            }).then(function(charge) {
                // asynchronously called
                console.log('CREATE charge:', charge.id, amount, client.email);
                return charge;    
            });
    },
    
    sendEmail: function (email, data, template) {
        check([email.from, email.to, email.subject, email.text], [String]);
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        //console.log("Send email: ", email, data);
        SSR.compileTemplate('htmlEmail', Assets.getText(template));
        
        Template.htmlEmail.helpers({
          subtotal(a, b) {
            //console.log('subtotal: ', a, b);
            return (parseFloat(a) * parseFloat(b));
          }
        });

        email.html = SSR.render('htmlEmail', data);

        mailgun.messages().send(email, function (error, body) {
          console.log('SEND email to:', email.to);
        });
    }
})
