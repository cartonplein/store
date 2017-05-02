import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { GoogleMaps } from 'meteor/dburles:google-maps';
import { Orders } from '../api/orders.js';
import { moment } from 'meteor/momentjs:moment';
import { Slots, Days, Zones, Modes } from '../api/shipping.js';
import { Beacons } from '../api/beacons.js';
import './storeAdmin.html';
import './menuAdmin.html';

/*
  storeAdmin
  storeAdmin
  storeAdmin
*/

Template.storeAdmin.onCreated(function() {
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
  this.updateUI = function () {
    // Update UI callback after DOM change (for specific semantic UI behavior)
    // console.log("Update UI DOM");
    Tracker.flush();
    this.$('.ui.dropdown').dropdown();
  };
});

Template.storeAdmin.onRendered(function() {
  // Enable toggle action
  $('.ui.dropdown').dropdown();
  $('.ui.sticky').sticky({context: '#context'});
  $('.menu .item').tab();
  // $('.ui.sticky').sticky('refresh');
});

Template.storeAdmin.helpers({
  orders() {
    return Orders.find({}, { sort: { 'shipping.date':1, 'shipping.time':1} });
  },
  
  count(state) {
    return Orders.find(state).fetch().length;
  },
  
  orders(state, date) {
    var filter = Object.assign({}, state, {'shipping.date': date});
    return Orders.find(filter, {sort: {'shipping.date':1, 'shipping.time':1, '_id':1}});
  },
  
  states() {
    return ['unpaid', 'unprepared', 'undelivered', 'done', 'cancel', 'all'];
  },
  
  filter(state) {
    var filter = {};
    if (state == 'unpaid') {
      filter = {'workflow.paid': false, 'workflow.canceled': false}
    }
    if (state == 'unprepared') {
      filter = {'workflow.prepared': false, 'workflow.canceled': false}
    }
    if (state == 'undelivered') {
      filter = {'workflow.delivered': false, 'workflow.canceled': false}
    }
    if (state == 'done') {
      filter = {'workflow.paid': true, 'workflow.prepared': true, 'workflow.delivered': true, 'workflow.canceled': false}
    }
    if (state == 'cancel') {
      filter = {'workflow.canceled': true}
    }
    if (state == 'all') {
      filter = {}
    }
    return filter;
  },
  
  dates(filter) {
    // Fetch unique dates
    var dates = _.uniq(Orders.find(filter, {
        sort: {'shipping.date':1}, fields: {'shipping.date': true}
      }).fetch().map(function(x) {
        return x.shipping.date;
        }), true);
    // Sort dates
    dates.sort(function (a, b) {
      return moment(a, "DD/MM/YYYY") - moment(b, "DD/MM/YYYY");
    });
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
      shippingMode(order) {
        if (order) {
          return (order.shipping.mode == "velo") ? 'deliver' : 'pickup';
        } else {return null}       
      },
      assignment(order) {
        var workflow = order.workflow;
        var assignment = '';
        if (workflow['assignment'] == '') { 
          // assignment is empty
          if (order.shipping.mode == 'velo') {
            var zone = Zones.findOne({'zip': order.shipping.zip});
            //console.log('Deliver: ', order.shipping.mode, zone);
            assignment = zone ? zone.assignment : '';
          } else {
            //console.log('On place: ', order.shipping.mode);
            assignment = order.shipping.mode
          }
        } else {
          //console.log('Assignement: ', workflow.assignment);
          assignment = workflow.assignment;
        }
        //console.log('assignment:', assignment);
        return (assignment ? assignment : order.shipping.zip);
      },
      onSelect(order) {
        instance.state.set('selectedOrder', order);
        instance.updateUI();
      },
      onCheck(state) {
        var order = instance.state.get('selectedOrder');
        order.workflow[state] = !order.workflow[state];
        instance.state.set('selectedOrder', order);
        //console.log("Toogle workflow: ", order.workflow[state])
      },
      onChange(dimension, field, value) {
        var order = instance.state.get('selectedOrder');
        if (order) {
          order[dimension][field] = value;
          instance.state.set('selectedOrder', order);
          console.log("onChange:", field, order[dimension][field]);
        }
      },
      onClose(editing) {
        instance.state.set('selectedOrder', null);
        //console.log("Close editing: ", order._id)
      }
    };
  }
});

Template.storeAdmin.events({
  'click .js-order-create'(event, instance) {

    // Add order into the collection
    Meteor.call('orders.create', {},
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
  'click .item'(event, instance) {
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
  Meteor.subscribe('modes');
  Meteor.subscribe('beacons');

  this.state = new ReactiveDict();
  this.state.setDefault({
      slots : []
  });
  
  this.updateUI = function (dropdown) {
    // Update UI callback after DOM change (for specific semantic UI behavior)
    // console.log("Update UI DOM");
    Tracker.flush();
    this.$(dropdown).dropdown();
  };
});

Template.orderEdit.onRendered(function() {
  // Enable action
  $('.ui.dropdown').dropdown();
  //$('.ui.sticky').sticky({context: '#context'});
});

Template.orderEdit.helpers({
  shippingDates(mode) {
      var MAX_DATES = 30;
      var MAX_BOOKING = 10;
      var MIN_HOUR = -48;
      
      // Closing days (1)
      const days = Days.find({}, { sort: { date: 1 } });
      var closingDays = {};
      days.forEach(function (day) {
          //console.log("Closed day:", day.date);
          closingDays[day.date] = true;
      });

      // Booked slots (2)
      const nextDay = moment().format('DD/MM/YYYY')
      const booking = Orders.find({'shipping.date': { $gte : nextDay }, 'shipping.mode' : 'velo'}, { sort: { 'shipping.date': 1, 'shipping.time': 1} });
      var bookedSlots = {};
      booking.forEach(function (order) {
          let date = order.shipping.date;
          let time = order.shipping.time;
          if (!bookedSlots[date]) {bookedSlots[date] = {}};
          if (!bookedSlots[date][time]) {bookedSlots[date][time] = 0}
          bookedSlots[date][time]++;
      });
      //console.log('bookedSlots:', nextDay, bookedSlots);
      
      // Open slots (3)
      const slots = Slots.find({mode : mode}, { sort: { index: 1 } });
      var openingSlots = {};
      slots.forEach(function (slot) {
          //console.log("Opening slot:", slot.name, slot.open);
          //closingDays[day.date] = true;
          
          for (var day=0; day < slot.open.length; day++) {
              if (!openingSlots[day]) {openingSlots[day] = []};
              if (slot.open[day]) {openingSlots[day].push(slot.name)};
          }
      });
      
      // Next days and slots available (4) = (3) - (2) - (1)
      var openDates = [];
      var availableSlots = {};
      var shippingDate = moment().add(MIN_HOUR, 'hours');
      var i = 0;
      while (i < MAX_DATES) {
          // Open days
          // Open days
          // Open days
          if (!closingDays[shippingDate.format('YYYY-MM-DD')]) { 
              // Open slots
              // Open slots
              // Open slots
              let openSlots = openingSlots[shippingDate.day()];
              if (!openSlots) { return null };
              //console.log('Available slots : ', shippingDate.format('DD/MM/YYYY'), openingSlots[shippingDate.day()]);
              
              if (openSlots.length > 0) {
                  // Free slots
                  // Free slots
                  // Free slots
                  let date = shippingDate.format('DD/MM/YYYY');
                  //console.log('openSlots:', date, openSlots, bookedSlots[date]);
                  var freeSlots = [];
                  if (bookedSlots[date]) {
                      // Removing full booking slots
                      for (let s = 0; s < openSlots.length; s++) {
                          let slot = openSlots[s];
                          if (bookedSlots[date][slot] < MAX_BOOKING || !bookedSlots[date][slot]) {
                              freeSlots.push(slot);
                          }
                      }
                  } else {
                      // Keeping all slots
                      freeSlots = openSlots;
                  }
                  if (freeSlots.length > 0) {
                      const openDate = {
                          text: shippingDate.format('dddd DD MMMM YYYY'), 
                          value: date, 
                          slots: freeSlots};
                      availableSlots[openDate.value] = openDate.slots
                      openDates.push(openDate);
                  }
              }
          }
          shippingDate.add(1, 'days');
          i++;    
      };
      //console.log('availableSlots: ', availableSlots);
      const instance = Template.instance();
      instance.state.set('slots', availableSlots);
      return openDates;
  },
  
  shippingSlots() {
      const instance = Template.instance();
      const selectedDate = this.order.shipping.date;
      // console.log("Updated date slots: ", selectedDate)
      return(instance.state.get('slots')[selectedDate])
  },
  
  shippingOrigin() {
    if (!this.order.workflow.assignment) {
      return null;
    } else {
      const mode = Modes.findOne({ tag:this.order.workflow.assignment });
      return (mode ? mode.address : null);
    }
  },
  
  shippingDestination() {
      const mode = Modes.findOne({ tag:this.order.shipping.mode });
      if (mode) {
        const address = (mode.tag == 'velo') ? 
                  this.order.shipping.address + ' ' + this.order.shipping.zip + ' ' + this.order.shipping.city : mode.address
        return address;
      } else {
        return null;
      }
  },
  
  shippingVehicle() {
      const vehicle = Beacons.findOne({ serialNumber:this.order.workflow.vehicle });
      if (vehicle) {
        return vehicle;
      } else {
        return null;
      }
  },
  
  vehicles() {
      const vehicles = Beacons.find({}, { sort: { 'name':1 } });
      //console.log('vehicles:', vehicles);
      return vehicles;
  }
});

Template.orderEdit.events({
  'click .js-order-workflow'(event, instance) {
    //console.log("Change workflow", event.target.name);
    this.onCheck(event.target.name);
  },
  
  'change .js-order-date'(event, instance) {
    //console.log("Change deliver", event.target.name, "=", event.target.value);
    this.onChange('shipping', event.target.name, event.target.value);
    //this.onChange('shipping', 'time', '');
    instance.$('.js-order-time').dropdown('clear');
    instance.updateUI('.ui.dropdown');
  },
  
  'change .js-order-time'(event, instance) {
    this.onChange('shipping', event.target.name, event.target.value);
    instance.updateUI('.ui.dropdown');  
  },
  
  'change .js-order-assignment'(event, instance) {
    this.onChange('workflow', event.target.name, event.target.value);
    instance.updateUI('.ui.dropdown');
  },
  
  'change .js-order-vehicle'(event, instance) {
    this.onChange('workflow', event.target.name, event.target.value);
    instance.updateUI('.ui.dropdown');
  },
  
  'click .js-order-update'(event, instance) {
    var shipping = this.order.shipping;
    var workflow = this.order.workflow;
    shipping['date'] = instance.$('input[name=date]').val();
    shipping['time'] = instance.$('input[name=time]').val();
    shipping['details'] = instance.$('textarea[name=details]').val();
    workflow['assignment'] = instance.$('input[name=assignment]').val();
    workflow['vehicle'] = instance.$('input[name=vehicle]').val();
    workflow['comments'] = instance.$('textarea[name=comments]').val();
    
    const order = {
      shipping : shipping,
      workflow : workflow,
    };

    // Save order into the collection
    Meteor.call('orders.update', this.order._id, order);
    
    // Leaving editing order
    this.onClose();
  },
  
  'click .js-order-close'(event, instance) {
    // Cancel editing order
    this.onClose();
  },
  
  'click .js-order-delete'(event, instance) {
    // Delete order into the collection
    console.log("Deleting order: ", this.order._id);
    Meteor.call('orders.delete', this.order._id);
    
    // Leaving editing order
    this.onClose();
  },
});

/*
  orderMap
  orderMap
  orderMap
*/
Template.orderMap.onCreated(function() { 
  // We can use the `ready` callback to interact with the map API once the map is ready.
  GoogleMaps.ready('Map', function(map) {
    // Add a marker to the map once it's ready
    var marker = new google.maps.Marker({
      position: map.options.center,
      map: map.instance
    });
  });
  
  this.state = new ReactiveDict();
  this.state.setDefault({
      location : {lat : 48.856614, lng:2.3522219000000177},
  });
});

Template.orderMap.onRendered(function() {
  // Load Google Maps
  GoogleMaps.load({ v: '3', key: Meteor.settings.public.googleMaps.api_key});
});

Template.orderMap.helpers({
  geocode(address) {
    const instance = Template.instance();
    
    // Geocode address
    Meteor.call('map.geocode', address, 
      function(error, response) {
        if (response) { 
          //console.log("Geocoding address: ", address, response.json.results[0].geometry.location);
          instance.state.set('location', response.json.results[0].geometry.location);
          GoogleMaps.ready('Map', function(map) {
            map.instance.setZoom(15);
            map.instance.setCenter(response.json.results[0].geometry.location);
            var marker = new google.maps.Marker({
                position: response.json.results[0].geometry.location,
                map: map.instance
            });
          })
        } else {
          //console.log("Error geocoding: ", address, error);
          instance.state.set('location', null);
        }
      }
    )
  },
  location() {
    //geocode(this.destination);
    const instance = Template.instance();
    return instance.state.get('location');
  },
  MapOptions(location) {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // Map initialization options
      return {
        center: new google.maps.LatLng(location.lat, location.lng),
        zoom: 15
      };            
    }
  }
});