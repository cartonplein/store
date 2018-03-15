import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { HTTP } from 'meteor/http';

FlowRouter.route('/', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "storeHome"});
  }
});

FlowRouter.route('/product', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "productAdmin"});
  }
});

FlowRouter.route('/shipping', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "shippingAdmin"});
  }
});

FlowRouter.route('/backoffice', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "storeAdmin"});
  }
});

FlowRouter.route('/sell', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "sell"});
  }
});

FlowRouter.route('/customers', {
  action: function() {
    BlazeLayout.render("mainLayout", {content: "customers"});
  }
});

FlowRouter.route('/beacon', {
  action: function() {
    HTTP.post("/api/beacon", {
      data: {
        "event": "LOCATION_CHANGED",
        "beacon": {
          "name": "My TiFiz",
          "serialNumber": "E555",
          "location": {
            "latitude": 43.83883,
            "longitude": 3.641531,
            "timestamp": 1478187361745
          }
        }
      }
    }, function (err, res) {
      console.log('beacon', res);
    });
  }
});