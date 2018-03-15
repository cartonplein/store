import { Template } from 'meteor/templating';
import { moment } from 'meteor/momentjs:moment';
import { Orders } from '../../api/orders.js';

import './customers.html';
import '../menuAdmin.html';

Template.customers.onCreated(function() {
  Meteor.subscribe('orders');
})

Template.customers.helpers({
  orders() {
    var orders = Orders.find({'workflow.paid': true, 'workflow.canceled': false}, {sort: {'_id':1}}).fetch();
    orders.sort(function (a, b) {
        var dateA = a.charge.created ? moment.unix(a.charge.created) : moment(a.shipping.date, "DD/MM/YYYY");
        var dateB = b.charge.created ? moment.unix(b.charge.created) : moment(b.shipping.date, "DD/MM/YYYY");
        return dateA.diff(dateB);
    });
    return orders;
  },
  
  date(order) {
      return moment.unix(order.charge.created).format("DD/MM/YYYY");
  },
  
  command(order) {
    var lines = order.commands;
    if (!lines) {return null}
    
    var command = {
        'C':0, 
        'L':0, 
        'S':0, 
        'XL':0, 
        'XXL':0, 
        'A':0, 
        'P':0, 
        'T':0, 
        'PL':0
    };
    
    for (let i=0; i < lines.length; i++) {
      let reference = lines[i].reference
      command[reference] = lines[i].quantity
    }
    
    return command;
  },
  
  total(order) {
    if (!order.invoice || !order.shipping) {return null}
        return (parseFloat(order.invoice.command) + (order.shipping.free ? 0 : parseFloat(order.invoice.shipping))).toFixed(2).replace('.', ',');
  },
  
  shipping(order) {
    if (!order.shipping) {return 0}
        return (order.shipping.free ? 0 : parseFloat(order.invoice.shipping)).toFixed(2).replace('.', ',');
  },
  
  location(order) {
        return order.shipping.zip !== '' ? order.shipping.zip : order.shipping.mode;
  }
})