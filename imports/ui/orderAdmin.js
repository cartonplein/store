import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Orders } from '../api/orders.js';
import { moment } from 'meteor/momentjs:moment';
import { Slots, Days, Zones } from '../api/shipping.js';

import './orderAdmin.html';
import './menuAdmin.html';

/*
  orderAdmin
  orderAdmin
  orderAdmin
*/

Template.orderAdmin.onCreated(function() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedOrder: null,
  });
  this.dates = [];
  Meteor.subscribe('orders');
  Meteor.subscribe('zones');
  
  this.formatDate = function(date) {
    return moment(date, "DD/MM/YYYY").format('dddd DD MMMM YYYY');
  };
});

Template.orderAdmin.onRendered(function() {
  // Enable toggle action
  $('.ui.dropdown').dropdown();
  $('.ui.sticky').sticky({context: '#context'});
  // $('.ui.sticky').sticky('refresh');
});

Template.orderAdmin.helpers({
  orders() {
    return Orders.find({}, { sort: { 'shipping.date':1, 'shipping.time':1} });
  },
  
  orders(date) {
    return Orders.find({'shipping.date': date}, {sort: {'shipping.time':1}});
  },

  dates() {
    const orders = Orders.find({}, {sort: { 'shipping.date':1, 'shipping.time':1}}, { fields: {'shipping.date':1}}).fetch();
    var dates = [];
    for (let i=0; i < orders.length; i++) {
      let date = orders[i].shipping.date;
      if (dates.indexOf(date) == -1) {
        dates.push(date);}
      //console.log('dates:', date, orders[i]._id);
    };
    //console.log('dates:', dates);
    return dates;
  },
  
  formatDate(date) {
    const instance = Template.instance();
    return instance.formatDate(date);
  },

  editedOrder() {
    const instance = Template.instance();
    return instance.state.get("selectedOrder");
  },
  
  selectOrder(order) {
    const instance = Template.instance();
    return {
      order,
      command(order) {
        var lines = order.commands;
        if (!lines) {return null}
        
        lines.sort(function(a, b){return a.index - b.index});

        var command = "";
        for (let i=0; i < lines.length; i++) {
          if (i > 0) { command = command + ' | '};
          command = command + lines[i].reference + '=' + lines[i].quantity
        }
        return command;
      },
      total(order) {
        if (!order.invoice || !order.shipping) {return null}
        return parseFloat(order.invoice.command) + (order.shipping.free ? 0 : parseFloat(order.invoice.shipping))
      },
      bicycle(order) {
        if (!order.shipping) {return null}
        return (order.shipping.mode == 'velo');
      },
      done(order){
        return (order.workflow.paid 
        && order.workflow.prepared 
        && order.workflow.delivered)
      },
      exist(order) {
        return (order.workflow !== undefined)
      },
      formatPhone(phone) {
        return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
      },
      formatDate(date) {
        return instance.formatDate(date);
      },
      newDate(date) {
        //console.log("Dates:", dates, date, dates.indexOf(date));
        if (instance.dates.indexOf(date) === -1) {
          //console.log("New date:", date);
          instance.dates.push(date);
          return true;
        } else {
          //console.log("Existing date:", date);
          return false;
        }
      },
      workflow() {
        //console.log('workflow:', instance.state.get("workflow"));
        return instance.state.get("selectedOrder").workflow;
      },
      assignment(order) {
        var assignment = order.workflow.assignment;
        if (!assignment) { 
          // assignement is null
          if (order.shipping.mode == 'nord') { assignment = "nord" };
          if (order.shipping.mode == 'sud') { assignment = "sud" };
          if (order.shipping.mode == 'velo') {
            var zone = Zones.findOne({'zip': order.shipping.zip});
            // console.log('find zone: ', zone);
            assignment = zone.assignment ? zone.assignment : 'aucune';
          }
        }
        if (assignment == 'aucune') {
            assignment = (order.shipping.mode == 'velo') ? order.shipping.zip : order.shipping.mode;
        }
        //console.log('assignment:', assignment);
        return assignment
      },
      onSelect(order) {
        instance.state.set('selectedOrder', order);
        //console.log("Editing order: ", order)
      },
      onCheck(state) {
        var order = instance.state.get('selectedOrder');
        order.workflow[state] = !order.workflow[state];
        instance.state.set('selectedOrder', order);
        //console.log("Toogle workflow: ", order.workflow[state])
      },
      onShipping(field, value) {
        var order = instance.state.get('selectedOrder');
        order.shipping[field] = value;
        instance.state.set('selectedOrder', order);
        console.log("onChange shipping:", order.shipping[field]);
      },
      onClose(editing) {
        instance.state.set('selectedOrder', null);
        instance.state.set('workflow', null);
        //console.log("Close editing: ", order._id)
      }
    };
  }
});

Template.orderAdmin.events({
  'click .js-order-create'(event, instance) {

    // Add order into the collection
    Meteor.call('Orders.create', {},
      function(error, result){
          if (error) { console.log("Error adding order: ", error);}
          else {
            console.log("Adding new order: ", result);
            // Editing this new order
            instance.state.set('selectedOrder', {_id: result});
          }
    });
  },
  'click .js-order-close'(event, instance) {
    // Close order
    instance.state.set('selectedOrder', null);
  },
});

/*
  OrderList
  OrderList
  OrderList
*/
Template.orderList.onRendered(function() {
});

Template.orderList.events({
  'click .item'() {
    console.log("Selecting order: ", this.order._id);
    this.onSelect(this.order);
  }
});


/*
  OrderEdit
  OrderEdit
  OrderEdit
*/

Template.orderEdit.onCreated(function() {
  Meteor.subscribe('slots');
  Meteor.subscribe('days');

  this.state = new ReactiveDict();
  this.state.setDefault({
      slots : []
  });
  
  this.updateUI = function () {
    // Update UI callback after DOM change (for specific semantic UI behavior)
    // console.log("Update UI DOM");
    Tracker.flush();
    this.$('.ui.dropdown').dropdown();
  };
});

Template.orderEdit.onRendered(function() {
  // Enable toggle action
  $('.ui.dropdown').dropdown();
  $('.ui.sticky').sticky({context: '#context'});
});

Template.orderEdit.helpers({
  shippingDates() {
    var maxDates = 10;
    
    // Jours de fermetures
    const days = Days.find({}, { sort: { date: 1 } });
    var closingDays = {};
    days.forEach(function (day) {
        //console.log("Closed day:", day.date);
        closingDays[day.date] = true;
    });
    
    // Créneaux ouverts
    const slots = Slots.find({}, { sort: { index: 1 } });
    var openingSlots = {};
    slots.forEach(function (slot) {
        //console.log("Opening slot:", slot.name, slot.open);
        //closingDays[day.date] = true;
        
        for (var day=0; day < slot.open.length; day++) {
            if (!openingSlots[day]) {openingSlots[day] = []};
            if (slot.open[day]) {openingSlots[day].push(slot.name)};
        }
    });

    var openDates = [];
    var availableSlots = {};
    var i = 0;
    while (i < maxDates) {
        var shippingDate = moment().add(i, 'd');
        if (closingDays[shippingDate.format('YYYY-MM-DD')]) {
            //console.log('Date is closed: ', shippingDate.format('DD/MM/YYYY'));
            maxDates++;
        } else {
            const openSlots = openingSlots[shippingDate.day()];
            if (!openSlots) { return null };
            if (openSlots.length > 0) {
                //console.log('Available slots : ', shippingDate.format('DD/MM/YYYY'), openingSlots[shippingDate.day()]);    
                const openDate = {text: shippingDate.format('dddd DD MMMM YYYY'), 
                    value: shippingDate.format('DD/MM/YYYY'), 
                    slots: openingSlots[shippingDate.day()]};
                availableSlots[openDate.value] = openDate.slots
                openDates.push(openDate);
            }
            else {
                //console.log('No slots: ', shippingDate.format('DD/MM/YYYY'));
                maxDates++;
            }
        }
        i++;    
    };
    //console.log('availableSlots: ', availableSlots);
    const instance = Template.instance();
    instance.state.set('slots', availableSlots);
    //console.log('openDates: ', openDates);
    return openDates;
  },
  
  shippingSlots() {
      const instance = Template.instance();
      const selectedDate = this.order.shipping.date;
      console.log("Updated date slots: ", selectedDate)
      return(instance.state.get('slots')[selectedDate])
  },
});

Template.orderEdit.events({
  'click .js-order-workflow'(event, instance) {
    //console.log("Change workflow", event.target.name);
    this.onCheck(event.target.name);
  },
  
  'change .js-order-date'(event, instance) {
        //console.log("Change deliver", event.target.name, "=", event.target.value);
        this.onShipping(event.target.name, event.target.value);
        this.onShipping('time', null);
        instance.$('.js-order-time').dropdown('clear');
        instance.updateUI();
    },

  'change .js-order-time'(event, instance) {
      //console.log("Change deliver", event.target.name, "=", event.target.value);
      this.onShipping(event.target.name, event.target.value);
  },
  
  'click .js-order-update'(event, instance) {
    var shipping = this.order.shipping;
    var workflow = this.workflow();
    shipping['date'] = instance.$('input[name=date]').val();
    shipping['time'] = instance.$('input[name=time]').val();
    shipping['details'] = instance.$('textarea[name=details]').val();
    workflow['assignment'] = instance.$('input[name=assignment]').val();
    workflow['comments'] = instance.$('textarea[name=comments]').val();
    
    const order = {
      shipping : shipping,
      workflow : workflow,
    };

    // Save order into the collection
    Meteor.call('Orders.update', this.order._id, order);
    
    // Leaving editing order
    this.onClose();
  },
  
  'click .js-order-cancel'() {
    // Cancel editing order
    this.onClose();
  },
  
  'click .js-order-delete'() {
    // Delete order into the collection
    console.log("Deleting order: ", this.order._id);
    Meteor.call('Orders.delete', this.order._id);
    
    // Leaving editing order
    this.onClose();
  },
});