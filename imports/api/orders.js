import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
 
export const Orders = new Mongo.Collection('orders');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('orders', function() {
    return Orders.find({});
  });
} 
 
Meteor.methods({
  'Orders.create'(order) {
    const orderId = Orders.insert(order);
    console.log("CREATE order:", orderId);
    return orderId;
  },
  'Orders.read'(orderId) {
    console.log("READ order:", orderId);
    return Orders.findOne(orderId);
  },
  'Orders.update'(orderId, order) {
    console.log("UPDATE order:", orderId);
    Orders.update(orderId, {$set: order});
  },
  'Orders.delete'(orderId) {
    console.log("DELETE order:", orderId);
    Orders.remove(orderId);
  },
});