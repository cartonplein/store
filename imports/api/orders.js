import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { SimpleRest } from 'meteor/simple:rest';
import { moment } from 'meteor/momentjs:moment';
 
export const Orders = new Mongo.Collection('orders');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('orders', function() {
    const filterDay = moment("20180101", "YYYYMMDD");
    
    // Fetch unique dates
    var dates = _.uniq(Orders.find({}, {
        sort: {'shipping.date':1}, fields: {'shipping.date': true}
      }).fetch().map(function(x) {
        if (moment(x.shipping.date, "DD/MM/YYYY") >= moment("01/01/2018", "DD/MM/YYYY"))
          {return x.shipping.date};
        }), true);
    // Sort dates
    //console.log('dates:', dates);
    
    const query = {'shipping.date': { $in : dates } };
    //console.log (query);
    return Orders.find(query);
  });
}
 
Meteor.methods({
  'orders.create'(order) {
    const orderId = Orders.insert(order);
    console.log("CREATE order:", orderId);
    return orderId;
  },
  'orders.read'(orderId) {
    console.log("READ order:", orderId);
    return Orders.findOne(orderId);
  },
  'orders.update'(orderId, order) {
    console.log("UPDATE order:", orderId);
    Orders.update(orderId, {$set: order});
  },
  'orders.delete'(orderId) {
    console.log("DELETE order:", orderId);
    Orders.remove(orderId);
  },
});