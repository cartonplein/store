import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SSR } from 'meteor/meteorhacks:ssr';

import '../imports/api/products.js';
import '../imports/api/shipping.js';
import '../imports/api/orders.js';

//var stripe = require("stripe")("sk_test_9DnLGIZQ59VuPsFkezye8wxY"); // TEST key
//var stripe = require("stripe")("sk_live_Jsjnw69DrCWZojtIoXZ8vfjt"); // LIVE key

var api_key = 'key-876d2256bb08c568ac133b36a46b3886';
var domain = 'mg.cartonplein.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
 
Meteor.methods({
    'charge.create'(token, mode, client, amount) {
        //console.log('Creating charge:', email, amount);
        var sk = '';
        if (mode == 'TEST') {sk = "sk_test_9DnLGIZQ59VuPsFkezye8wxY"};
        if (mode == 'LIVE') {sk = "sk_live_Jsjnw69DrCWZojtIoXZ8vfjt"};
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
            console.log('subtotal: ', a, b);
            return (parseFloat(a) * parseFloat(b));
          }
        });

        email.html = SSR.render('htmlEmail', data);

        mailgun.messages().send(email, function (error, body) {
          console.log('SEND email to:', email.to);
        });
    }
})
