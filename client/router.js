import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

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