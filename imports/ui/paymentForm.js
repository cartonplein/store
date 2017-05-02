import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

import './paymentForm.html';

Template.paymentForm.onCreated(function() {
    this.processing = new ReactiveVar(false);
    this.payment = new ReactiveDict ();
    this.payment.setDefault({
        firstname : '',
        lastname : '',
        email : '',
        phone: '',
        number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
    });
});

Template.paymentForm.onRendered(function() {
});

Template.paymentForm.helpers({
    client() {
        const instance = Template.instance();
        return {    
            firstname: instance.payment.get('firstname'),
            lastname: instance.payment.get('lastname'),
            email: instance.payment.get('email'),
            phone: instance.payment.get('phone')
        };
    },
    
    card() {
        const instance = Template.instance();
        return {    
            number: instance.payment.get('number'),
            exp_month: instance.payment.get('exp_month'),
            exp_year: instance.payment.get('exp_year'),
            cvc: instance.payment.get('cvc')
        };
    },
    
    valid() {
        function isEmail(email) {
          var validation = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return validation.test(email);
        };
        function isPhone(phone) {
          return phone.replace(/\s+/g, '').length >= 10;
        };
        const instance = Template.instance();
        const client = {
            firstname: instance.payment.get('firstname'),
            lastname: instance.payment.get('lastname'),
            email: instance.payment.get('email'),
            phone: instance.payment.get('phone')
        }
        const card = {    
            number: instance.payment.get('number'),
            exp_month: instance.payment.get('exp_month'),
            exp_year: instance.payment.get('exp_year'),
            cvc: instance.payment.get('cvc')
        };
        return (
            this.total > 0
            && (client.firstname !== '') && (client.lastname !== '')
            && (isEmail(client.email) && isPhone(client.phone))
            && Stripe.card.validateCardNumber(card.number)
            && Stripe.card.validateExpiry(card.exp_month, card.exp_year)
            && Stripe.card.validateCVC(card.cvc))
    },
    
    processing() {
        const instance = Template.instance();
        return instance.processing.get();
    },
});

Template.paymentForm.events({
  'keyup .js-pay-form' (event, instance) {
    //console.log("Change payment:", event.target.className, "=", event.target.value);
    instance.payment.set(event.target.className, event.target.value);
  },

  'click .js-pay-button'(event, instance) {
    instance.processing.set(true);  
    const client = {
        firstname: instance.payment.get('firstname'),
        lastname: instance.payment.get('lastname'),
        email: instance.payment.get('email'),
        phone: instance.payment.get('phone')
    };
    const card = {    
        number: instance.payment.get('number'),
        exp_month: instance.payment.get('exp_month'),
        exp_year: instance.payment.get('exp_year'),
        cvc: instance.payment.get('cvc')
    };
    
    const total = this.total;
    const onAdd = this.onAdd;
    const onSucceed = this.onSucceed;
    const onError = this.onError;
    //console.log(client, card, total);
    
    // Delete card infos
    instance.payment.set('number', '');
    instance.payment.set('exp_month', '');
    instance.payment.set('exp_year', '');
    instance.payment.set('cvc', '');
    
    // Set TEST or LIVE key
    var mode = '';
    if (card.number == "4242424242424242") {
        var pk = Meteor.settings.public.stripe.pk_test
        Stripe.setPublishableKey(pk); // TEST key
        mode = 'TEST';
    } else {
        var pk = Meteor.settings.public.stripe.pk_live
        Stripe.setPublishableKey(pk); // LIVE key  
        mode = 'LIVE';
    }
    
    // Send card charge
    Stripe.card.createToken(
        card,
        function(status, response) {
            const stripeToken = response.id;
    	    //console.log(status, response);
    	    
    	    Meteor.call('charge.create', stripeToken, mode, client, total, 
    	        function(error, charge) {
    	            if (charge) {
    	                console.log('Paiement réussi:', charge.id)
    	                onAdd(client, mode, charge);
    	                onSucceed();
    	                
    	                // Delete user infos
                        instance.payment.set('firstname', '');
                        instance.payment.set('lastname', '');
                        instance.payment.set('email', '');
                        instance.payment.set('phone', '');
    	            }
    	            else {
    	                console.log('Echec du paiement !', error)
    	                onAdd(client, 'ERROR', '');
    	                onError();
    	            }
    	            
    	            instance.processing.set(false);
    	        });
        }
    );
  }
});