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
            (client.firstname !== '') && (client.lastname !== '')
            && (client.email !== '') && (client.phone !== '')
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
    //console.log("Change payment:", event.target.name, "=", event.target.value);
    instance.payment.set(event.target.name, event.target.value);
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
        Stripe.setPublishableKey('pk_test_r0ZOieLnU8Ll7ueQut6qKK7l'); // TEST key
        mode = 'TEST';
    } else {
        Stripe.setPublishableKey('pk_live_5H6fe7uZfsYWu8qjHYrF25ls'); // LIVE key  
        mode = 'LIVE';
    }
    
    // Send card charge
    Stripe.card.createToken(
        card,
        function(status, response) {
            const stripeToken = response.id;
    	    //console.log(status, response);
    	    
    	    Meteor.call('charge.create', stripeToken, mode, client.email, total, 
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
    	                onError();
    	            }
    	            
    	            instance.processing.set(false);
    	        });
        }
    );
  }
});