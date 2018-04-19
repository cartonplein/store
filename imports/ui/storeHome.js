import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Products } from '../api/products.js';
import { Zones, Modes } from '../api/shipping.js';
import { Orders } from '../api/orders.js';
import { moment } from 'meteor/momentjs:moment';

import './productCatalog.js';
import './commandForm.js';
import './shippingForm.js';
import './paymentForm.js';

import './storeHome.html';
import './menuAdmin.html';

Template.storeHome.onCreated(function() {
  Meteor.subscribe('products');
  Meteor.subscribe('zones');
  Meteor.subscribe('orders');
  Meteor.subscribe('modes');
  
  this.order = new ReactiveDict();
  this.order.setDefault({
    commands: [],
    shipping: {
      mode: null,
      date: null,
      time: null,
      address: "", 
      details: "", 
      zip: "", 
      city: "",
      free : false,
      min : 60 // free shipping
    },
    invoice: {
      quantity:0, 
      command: 0, 
      shipping:null,
    },
  });
  this.freeShipping = function () {
    return (parseFloat(this.order.get('invoice')['command']) >= this.order.get('shipping')['min'])
  };
  
  this.payment = new ReactiveDict();
  this.payment.setDefault({
    error: false,
    succeed: false,
  });
  
  this.reset = function() {
    this.order.set('commands', []);
    this.order.set('shipping', {
        mode: null,
        date: null,
        time: null,
        address: "", 
        details: "", 
        zip: "", 
        city: "",
        free : false,
    });
    this.order.set('invoice', {
        quantity:0, 
        command: 0, 
        shipping:null,
    });
    $('.ui.dropdown').dropdown('clear');
  };
});

Template.storeHome.onRendered(function() {
  // Enable toggle action
  $('.ui.checkbox').checkbox();
  $('.ui.dropdown').dropdown();
  $('.message .close')
  .on('click', function() {
    $(this).closest('.message').transition('fade');
  });
  $('.ui.sticky').sticky({context: '#context'});
});

Template.storeHome.helpers({
  products() {
    return Products.find({ available: true }, { sort: { index: 1 } });
  },
  
  order() {
    const instance = Template.instance();
    return {
      commands: instance.order.get('commands'),
      shipping: instance.order.get('shipping'),
      invoice: instance.order.get('invoice'),
    };
  },
  
  freeShipping() {
    const instance = Template.instance();
    return (instance.freeShipping());
  },

  total() {
    const instance = Template.instance();
    const invoice = instance.order.get('invoice');
    const shipping = instance.order.get('shipping');
    
    if (invoice['shipping'] == null) {
      return null;
    } else {
      const total = parseFloat(invoice['command']) + (shipping['free'] ? 0 : parseFloat(invoice['shipping'])); 
      return total.toFixed(2);      
    }
  },
  
  payment() {
    const instance = Template.instance();
    return { 
      error : instance.payment.get('error'),
      succeed : instance.payment.get('succeed'),
    };
  },
  
  editCommand(product) {
    const instance = Template.instance();
    
    function findCommand(command) {
      return command._id === product._id;
    };
    
    function updateShipping() {
      var shipping = instance.order.get('shipping');

      shipping['free'] = instance.freeShipping();
      instance.order.set('shipping', shipping);
      
      // console.log("updateShipping: ", shipping); 
    };
    
    function updateInvoice (quantity, price) {
      var invoice = instance.order.get('invoice');
      // Update the quantity of the invoice
      invoice['quantity'] = invoice['quantity'] + quantity;
      
      // Update the command of the invoice
      const command = parseFloat(invoice['command']) + price;
      invoice['command'] = command.toFixed(2);
      
      instance.order.set('invoice', invoice);
      //console.log("Update invoice:", invoice)
      //console.log("Update invoice quantity: ", invoice['quantity']);
      //console.log("Update invoice command: ", invoice['command'],' €'); 
    };
    
    return {
      product,
      onChange(product, step) {
        // Add the product to the command
        var line = product;
        var commands = instance.order.get("commands");
        var index = commands.findIndex(findCommand);
        if (index < 0) {
          line['quantity'] = 0;
          line['command'] = 0;
          commands.push(line);
        }
        index = commands.findIndex(findCommand);
        line = commands[index];
        line['quantity'] = line['quantity'] + step;
        
        if (line['quantity'] <= 0) {
          commands.splice(index, 1);
        } else {
          var subtotal = line['quantity'] * parseFloat(line['price']);
          line['command'] = subtotal.toFixed(2);
          commands[index] = line;
        }
        instance.order.set("commands", commands);
        // console.log("Update product to commands: ", instance.order.get('commands'));
        
        updateInvoice (step, parseFloat(line['price']) * step);
        updateShipping();
      }
    };
  },
  
  editShipping(shipping, invoice) {
    const instance = Template.instance();
    
    function updateInvoice (shipping) {
      var invoice = instance.order.get('invoice');

      // Mode, date and time required
      if (!shipping['mode'] 
        || !shipping['date'] 
        || !shipping['time']) { 
        invoice['shipping'] = null } 
      else {
        // Locally delivered
        if (shipping['mode'] !== 'velo') {
          //console.log("retrait sur place");
          invoice['shipping'] = 0;
        } else {
          // Bicycle delivered
          if ((shipping['address'].length > 0) 
            && (shipping['zip'].length > 0) 
            && (shipping['city'].length > 0)) {
              //console.log("livraison à vélo");
              const zone = Zones.find({zip : shipping['zip']}).fetch();
              invoice['shipping'] = zone[0] ? parseFloat(zone[0].price).toFixed(2) : null;
          } else {
            invoice['shipping'] = null};
        }
      }; 
      
      instance.order.set('invoice', invoice);
      //console.log("updateInvoice: ", invoice); 
    };
    
    return {
      shipping,
      invoice,
      onChange(field, value) {
        var shipping = instance.order.get('shipping');
        shipping[field] = value;
        updateInvoice(shipping);
        instance.order.set('shipping', shipping);
        //console.log("onChange shipping:", shipping);
      }
    };
  },
  
  editOrder(total) {
    const instance = Template.instance();
    return {
      total,
      onAdd(client, status, charge) {
        // Define assignment
        var assignment = '';
        const shipping = instance.order.get('shipping');
        if (shipping.mode == 'velo') {
          var zone = Zones.findOne({'zip': shipping.zip});
          // console.log('find zone: ', zone);
          assignment = zone.assignment ? zone.assignment : '';
        } else {
          assignment = shipping.mode
        }
        const order = {
          commands: instance.order.get('commands'),
          client: client,
          shipping: instance.order.get('shipping'),
          invoice: instance.order.get('invoice'),
          charge : charge,
          workflow : {paid: (status == 'LIVE'), prepared:false, delivered:false, canceled:false, assignment:assignment, comments:""}
        };
        //console.log("onAdd order:", charge, client, instance.order.keys);
        // Add product into the collection
        Meteor.call('orders.create', order,
          function(error, result){
              if (error) { console.log("Error adding order: ", order, error);}
              else {
                console.log("Adding new order: ", result);

                // In your client code: asynchronously send an email
                const mode = Modes.findOne({ tag:order.shipping.mode });
                var email = {
                  from: 'Carton plein <bonjour@cartonplein.org>',
                  to: order.client.firstname + ' ' + order.client.lastname + '<' + order.client.email + '>',
                  subject: 'Carton plein : confirmation de commande',
                  text: 'Votre commande a bien été reçue',
                  html: "",
                };
                var data = {
                  title: 'Reçu de commande',
                  date : moment().format('DD MMMM YYYY'),
                  client: order.client,
                  products : order.commands,
                  shipping: {
                    mode: mode.name, 
                    date:order.shipping.date, 
                    time: order.shipping.time,
                    address : (mode.tag == 'velo') ? 
                      order.shipping.address + ' ' + order.shipping.zip + ' ' + order.shipping.city : mode.address, 
                    price: (order.shipping.free) ? 0 : order.invoice.shipping},
                  total: total,
                };
                var template = 'email-billing.html';
                if (status !== 'ERROR') {
                  console.log("Send email to: ", order.client.email);
                  Meteor.call('mail.send', email, data, template)
                };
              }
        });
      },
      onSucceed() {
        //console.log("onSucceed order");
        instance.payment.set('succeed', true);
        instance.payment.set('error', false);
        instance.reset();
        $('html, body').animate({
            scrollTop: 0
        }, 0);
      },
      onError() {
        console.log("onError order");
        instance.payment.set('succeed', false);
        instance.payment.set('error', true);
        $('html, body').animate({
            scrollTop: $('.ui.negative.message').offset().top
        }, 0);
      }
    };
  },
});