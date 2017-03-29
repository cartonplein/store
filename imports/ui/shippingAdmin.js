import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { moment } from 'meteor/momentjs:moment';
import { Slots, Days, Zones, Modes } from '../api/shipping.js';

import './shippingAdmin.html';
import './menuAdmin.html';

Template.shippingAdmin.onCreated(function() {
  Meteor.subscribe('slots');
  Meteor.subscribe('days');
  Meteor.subscribe('zones');
  Meteor.subscribe('modes');
  
  this.state = new ReactiveDict();
  this.state.setDefault({
    selectedSlot: {deliver : null, pickup : null},
    selectedDay: null,
    selectedZone: null,
    selectedMode: null
  });
  
  this.week = [
      {name:'Lundi', index:1},
      {name:'Mardi', index:2},
      {name:'Mercredi', index:3},
      {name:'Jeudi', index:4},
      {name:'Vendredi', index:5},
      {name:'Samedi', index:6},
      {name:'Dimanche', index:0}]
});

Template.shippingAdmin.helpers({
  /*
    slot
    slot
    slot
  */
  week() {
    const instance = Template.instance();
    return instance.week;
  },
  
  slots(mode) {
    return Slots.find({mode : mode}, { sort: { index: 1 } });    
  },
  
  editedSlot(mode) {
    const instance = Template.instance();
    return instance.state.get("selectedSlot")[mode];
  },

  selectSlot(slot) {
    const instance = Template.instance();
    return {
      slot,
      onSelect() {
        let selectedSlot = instance.state.get("selectedSlot");
        selectedSlot[slot.mode] = slot;
        instance.state.set('selectedSlot', selectedSlot);  
        console.log("Editing slot: ", slot._id);
      },
      onClose() {
        let selectedSlot = instance.state.get("selectedSlot");
        selectedSlot[slot.mode] = null;
        instance.state.set('selectedSlot', selectedSlot); 
        console.log("Close slot: ", slot._id);
      }
    };
  },
  
  toggleSlot(slot, day) {
    return {
      slot,
      day,
      onToggle() {
        // console.log("Toggle slot: ", day.name, slot.name);
        var editSlot = {open: slot.open};
        var index = day.index;
        editSlot.open[index] = !slot.open[index];
        
        // Save slot into the collection
        Meteor.call('slots.update', slot._id, editSlot);
      },
      isOpen() {
        var index = day.index;
        return slot.open[index];
      }
    };
  },
  
  /*
    day
    day
    day
  */
  days() {
    return Days.find({}, { sort: { date: 1 } });    
  },
  
  editedDay() {
    const instance = Template.instance();
    return instance.state.get("selectedDay");
  },

  selectDay(day) {
    const instance = Template.instance();
    return {
      day,
      onSelect() {
        instance.state.set('selectedDay', day);
        console.log("Editing day: ", day._id);
      },
      onClose() {
        instance.state.set('selectedDay', null);
        console.log("Close day: ", day._id);
      }
    };
  },
  
  /*
    zone
    zone
    zone
  */
  zones() {
    return Zones.find({}, { sort: { zip: 1 } });    
  },
  
  editedZone() {
    const instance = Template.instance();
    return instance.state.get("selectedZone");
  },

  selectZone(zone) {
    const instance = Template.instance();
    return {
      zone,
      onSelect() {
        instance.state.set('selectedZone', zone);
        console.log("Editing zone: ", zone._id);
      },
      onClose() {
        instance.state.set('selectedZone', null);
        console.log("Close zone: ", zone._id);
      }
    };
  },
  
  /*
    mode
    mode
    mode
  */
  modes() {
    return Modes.find({}, {sort : { index : 1}});    
  },
  
  editedMode() {
    const instance = Template.instance();
    return instance.state.get("selectedMode");
  },

  selectMode(mode) {
    const instance = Template.instance();
    return {
      mode,
      onSelect() {
        instance.state.set('selectedMode', mode);
        console.log("Editing mode: ", mode._id);
      },
      onClose() {
        instance.state.set('selectedMode', null);
        console.log("Close mode: ", mode._id);
      }
    };
  },
});

Template.shippingAdmin.events({
  /*
    .js.slot
    .js.slot
    .js.slot
  */
  'click .js-slot-deliver-create'(event, instance) {
    // Add slot into the collection
    Meteor.call('slots.create', {open : [false,false,false,false,false,false,false], mode : 'deliver'},
      function(error, result){
          if (error) { console.log("Error adding slot: ", error);}
          else {
            console.log("Adding new slot: ", result);
            // Editing this new slot
            let selectedSlot = instance.state.get('selectedSlot');
            selectedSlot['deliver'] = {_id: result, mode : 'deliver'};
            instance.state.set('selectedSlot', selectedSlot);
          }
    });
  },
  'click .js-slot-deliver-close'(event, instance) {
    // Close slot
    let selectedSlot = instance.state.get("selectedSlot");
    selectedSlot['deliver'] = null;
    instance.state.set('selectedSlot', selectedSlot); 
  },
  'click .js-slot-pickup-create'(event, instance) {
    // Add slot into the collection
    Meteor.call('slots.create', {open : [false,false,false,false,false,false,false], mode : 'pickup'},
      function(error, result){
          if (error) { console.log("Error adding slot: ", error);}
          else {
            console.log("Adding new slot: ", result);
            // Editing this new slot
            let selectedSlot = instance.state.get('selectedSlot');
            selectedSlot['pickup'] = {_id: result, mode : 'pickup'};
            instance.state.set('selectedSlot', selectedSlot);
          }
    });
  },
  'click .js-slot-pickup-close'(event, instance) {
    // Close slot
    let selectedSlot = instance.state.get("selectedSlot");
    selectedSlot['pickup'] = null;
    instance.state.set('selectedSlot', selectedSlot); 
  },

  /*
    .js.day
    .js.day
    .js.day
  */
  'click .js-day-create'(event, instance) {
    // Add day into the collection
    Meteor.call('days.create', {},
      function(error, result){
          if (error) { console.log("Error adding day: ", error);}
          else {
            console.log("Adding new day: ", result);
            // Editing this new day
            instance.state.set('selectedDay', {_id: result});
          }
    });
  },
  'click .js-day-close'(event, instance) {
    // Close day
    instance.state.set('selectedDay', null);
  },
  
  /*
    .js.zone
    .js.zone
    .js.zone
  */
  'click .js-zone-create'(event, instance) {
    // Add zone into the collection
    Meteor.call('zones.create', {},
      function(error, result){
          if (error) { console.log("Error adding zone: ", error);}
          else {
            console.log("Adding new zone: ", result);
            // Editing this new zone
            instance.state.set('selectedZone', {_id: result});
          }
    });
  },
  'click .js-zone-close'(event, instance) {
    // Close zone
    instance.state.set('selectedZone', null);
  },
  
  /*
    .js.mode
    .js.mode
    .js.mode
  */
  'click .js-mode-create'(event, instance) {
    // Add mode into the collection
    Meteor.call('modes.create', {},
      function(error, result){
          if (error) { console.log("Error adding mode: ", error);}
          else {
            console.log("Adding new mode: ", result);
            // Editing this new mode
            this.onSelect()
            instance.state.set('selectedMode', {_id: result});
          }
    });
  },
  'click .js-mode-close'(event, instance) {
    // Close day
    instance.state.set('selectedMode', null);
  },
});

/*
    Template slotCell
    Template slotCell
    Template slotCell
*/
Template.slotCell.onRendered(function() {
    const instance = Template.instance();
    instance.$('.ui.checkbox').checkbox();
});

Template.slotCell.events({
    'change .js-slot-open'(event, instance) {
        this.onToggle();
    },
});

/*
    Template slotList
    Template slotList
    Template slotList
*/
Template.slotList.events({
  'click .slot'() {
    console.log("Selecting slot: ", this.slot._id);
    this.onSelect();
  }
});

/*
    Template slotEdit
    Template slotEdit
    Template slotEdit
*/
Template.slotEdit.events({
  'click .js-slot-update'(event, instance) {
    const form = instance.$('.js-slot-edit');
    console.log(instance.$('input[name=name]').val());
    const slot = {
      index : instance.$('input[name=index]').val(),
      name : instance.$('input[name=name]').val(),
    }

    // Save slot into the collection
    Meteor.call('slots.update', this.slot._id, slot);
    
    // Leaving editing slot
    this.onClose();
  },
  
  'click .js-slot-close'() {
    // Cancel editing slot
    this.onClose();
  },
  
  'click .js-slot-delete'() {
    // Delete slot into the collection
    console.log("Deleting slot: ", this.slot._id);
    Meteor.call('slots.delete', this.slot._id);
    
    // Leaving editing slot
    this.onClose();
  }
});

/*
    Template dayList
    Template dayList
    Template dayList
*/
Template.dayList.helpers({
  formatDate(day) {
    return moment(day).format('DD/MM/YYYY');
  }
});

Template.dayList.events({
  'click .item'() {
    console.log("Selecting day: ", this.day._id);
    this.onSelect();
  }
});

/*
    Template dayEdit
    Template dayEdit
    Template dayEdit
*/
Template.dayEdit.events({
  'click .js-day-update'(event, instance) {
    const form = instance.$('.js-day-edit');
    console.log(instance.$('input[name=name]').val());
    const day = {
      date : instance.$('input[name=date]').val(),
      name : instance.$('input[name=name]').val(),
    }
    console.log("Saved closing day: ", day);

    // Save day into the collection
    Meteor.call('days.update', this.day._id, day);
    
    // Leaving editing day
    this.onClose();
  },
  
  'click .js-day-cancel'() {
    // Cancel editing day
    this.onClose();
  },
  
  'click .js-day-delete'() {
    // Delete day into the collection
    console.log("Deleting day: ", this.day._id);
    Meteor.call('days.delete', this.day._id);
    
    // Leaving editing day
    this.onClose();
  }
});

/*
    Template zoneList
    Template zoneList
    Template zoneList
*/
Template.zoneList.events({
  'click .item'() {
    console.log("Selecting zone: ", this.zone._id);
    this.onSelect();
  }
});

/*
    Template zoneEdit
    Template zoneEdit
    Template zoneEdit
*/
Template.zoneEdit.onRendered(function() {
  // Enable toggle action
  $('.ui.dropdown').dropdown();
});

Template.zoneEdit.events({
  'click .js-zone-update'(event, instance) {
    const zone = {
      zip : instance.$('input[name=zip]').val(),
      price : instance.$('input[name=price]').val(),
      color : instance.$('input[name=color]').val(),
      assignment : instance.$('input[name=assignment]').val(),
    }
    console.log("Saved shipment zone price: ", zone);

    // Save day into the collection
    Meteor.call('zones.update', this.zone._id, zone);
    
    // Leaving editing zone
    this.onClose();
  },
  
  'click .js-zone-cancel'() {
    // Cancel editing zone
    this.onClose();
  },
  
  'click .js-zone-delete'() {
    // Delete day into the collection
    console.log("Deleting zone: ", this.zone._id);
    Meteor.call('zones.delete', this.zone._id);

    // Leaving editing zone
    this.onClose();
  }
});

/*
    Template modeList
    Template modeList
    Template modeList
*/
Template.modeList.helpers({
});

Template.modeList.events({
  'click .item'() {
    console.log("Selecting mode: ", this.mode);
    //console.log("Selecting mode: ", this.mode._id);
    this.onSelect();
  }
});

/*
    Template modeEdit
    Template modeEdit
    Template modeEdit
*/
Template.modeEdit.onRendered(function() {
  // Enable toggle action
  $('.ui.checkbox').checkbox();
});

Template.modeEdit.events({
  'click .js-mode-update'(event, instance) {
    const mode = {
      tag : instance.$('input[name=tag]').val(),
      index : instance.$('input[name=index]').val(),
      name : instance.$('input[name=name]').val(),
      description : instance.$('input[name=description]').val(),
      address : instance.$('input[name=address]').val(),
      color : instance.$('input[name=color]').val(),
      icon : instance.$('input[name=icon]').val(),
      delivered : instance.$('input[name=delivered]').is(':checked'),
    }
    console.log("Saved closing mode: ", mode);

    // Save day into the collection
    Meteor.call('modes.update', this.mode._id, mode);
    
    // Leaving editing day
    this.onClose();
  },
  
  'click .js-mode-cancel'() {
    // Cancel editing mode
    this.onClose();
  },
  
  'click .js-mode-delete'() {
    // Delete day into the collection
    console.log("Deleting mode: ", this.mode._id);
    Meteor.call('modes.delete', this.mode._id);
    
    // Leaving editing day
    this.onClose();
  }
});
