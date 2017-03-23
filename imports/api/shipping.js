import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';


// DAYS
// DAYS
// DAYS
export const Days = new Mongo.Collection('days');
let dayType = "day";

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('days', function() {
    return Days.find({});
  });
} 
 
Meteor.methods({
  'days.create'(item) {
    const id = Days.insert(item);
    console.log("CREATE ", dayType ,": ", id);
    return id;
  },
  'days.read'(id) {
    console.log("READ ", dayType ,": ", id);
    return Days.findOne(id);
  },
  'days.update'(id, item) {
    console.log("UPDATE ", dayType ,": ", id);
    Days.update(id, {$set: item});
  },
  'days.delete'(id) {
    console.log("DELETE ", dayType ,": ", id);
    Days.remove(id);
  },
});


// SLOTS
// SLOTS
// SLOTS
export const Slots = new Mongo.Collection('slots');
let slotType = "slot";

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('slots', function() {
    return Slots.find({});
  });
} 
 
Meteor.methods({
  'slots.create'(item) {
    const id = Slots.insert(item);
    console.log("CREATE ", slotType ,": ", id);
    return id;
  },
  'slots.read'(id) {
    console.log("READ ", slotType ,": ", id);
    return Slots.findOne(id);
  },
  'slots.update'(id, item) {
    console.log("UPDATE ", slotType ,": ", id);
    Slots.update(id, {$set: item});
  },
  'slots.delete'(id) {
    console.log("DELETE ", slotType ,": ", id);
    Slots.remove(id);
  },
});

// ZONES
// ZONES
// ZONES
export const Zones = new Mongo.Collection('zones');
let zoneType = "zone";

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('zones', function() {
    return Zones.find({});
  });
} 
 
Meteor.methods({
  'zones.create'(item) {
    const id = Zones.insert(item);
    console.log("CREATE ", zoneType ,": ", id);
    return id;
  },
  'zones.read'(id) {
    console.log("READ ", zoneType ,": ", id);
    return Zones.findOne(id);
  },
  'zones.update'(id, item) {
    console.log("UPDATE ", zoneType ,": ", id);
    Zones.update(id, {$set: item});
  },
  'zones.delete'(id) {
    console.log("DELETE ", zoneType ,": ", id);
    Zones.remove(id);
  },
});

// MODES
// MODES
// MODES
export const Modes = new Mongo.Collection('modes');
let modeType = "mode";

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('modes', function() {
    return Modes.find({});
  });
} 
 
Meteor.methods({
  'modes.create'(item) {
    const id = Modes.insert(item);
    console.log("CREATE ", modeType ,": ", id);
    return id;
  },
  'modes.read'(id) {
    console.log("READ ", modeType ,": ", id);
    return Modes.findOne(id);
  },
  'modes.update'(id, item) {
    console.log("UPDATE ", modeType ,": ", id);
    Modes.update(id, {$set: item});
  },
  'modes.delete'(id) {
    console.log("DELETE ", modeType ,": ", id);
    Modes.remove(id);
  },
});