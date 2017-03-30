import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker'
import { check } from 'meteor/check';
import { moment } from 'meteor/momentjs:moment';
import { Slots, Days, Modes } from '../api/shipping.js';
import { Orders } from '../api/orders.js';

import './shippingForm.html';

Template.shippingForm.onCreated(function() {
  Meteor.subscribe('slots');
  Meteor.subscribe('days');
  Meteor.subscribe('orders');
  Meteor.subscribe('modes');

  this.state = new ReactiveDict();
  this.state.setDefault({
      slots : []
  });
  
  this.shippingOptions = new ReactiveDict();
  
  this.updateUI = function () {
    // Update UI callback after DOM change (for specific semantic UI behavior)
    // console.log("Update UI DOM");
    Tracker.flush();
    this.$('.ui.dropdown').dropdown();
  };
});


Template.shippingForm.helpers({
    shippingOptions() {
        return { 
            modes : Modes.find({}, { sort: { index: 1 } })
        };
    },
    
    shippingMode() {
        if (this.shipping.mode) {
            return (this.shipping.mode == "velo") ? 'deliver' : 'pickup';
        } else {return null}       
    },
    
    isBicycle() {
        return (this.shipping.mode == "velo");
    },
    
    isFree() {
        return (this.invoice.command >= 40);
    },
    
    shippingDates(mode) {
        var MAX_DATES = 30;
        var MAX_BOOKING = 2;
        
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
        var shippingDate = moment().add(12, 'hours');
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
        const selectedDate = this.shipping.date;
        //console.log("Updated date slots: ", selectedDate)
        return(instance.state.get('slots')[selectedDate])
    },
});

Template.shippingForm.events({
    'change .js-deliver-mode'(event, instance) {
        //console.log("Change deliver", event.target.name, "=", event.target.value);
        this.onChange(event.target.name, event.target.value);
        
        this.onChange('date', null);
        instance.$('.js-deliver-date').dropdown('clear');
        this.onChange('time', null);
        instance.$('.js-deliver-time').dropdown('clear');
        instance.updateUI();
    },
    
    'change .js-deliver-date'(event, instance) {
        //console.log("Change deliver", event.target.name, "=", event.target.value);
        this.onChange(event.target.name, event.target.value);
        //this.onChange('time', null);
        instance.$('.js-deliver-time').dropdown('clear');
        instance.updateUI();
    },

    'change .js-deliver-time'(event, instance) {
        //console.log("Change deliver", event.target.name, "=", event.target.value);
        this.onChange(event.target.name, event.target.value);
    },
    
    'change .js-deliver-location'(event, instance) {
        //console.log("Change deliver:", event.target.name, "=", event.target.value);
        this.onChange(event.target.name, event.target.value);
    }
});