import '../imports/startup/accounts-config.js';
import '../imports/ui/storeHome.js';
import '../imports/ui/storeAdmin.js';
import '../imports/ui/productAdmin.js';
import '../imports/ui/shippingAdmin.js';
import '../imports/ui/extract/sell.js';
import '../imports/ui/extract/customers.js';

Template.registerHelper( 'equals', ( a1, a2 ) => {
  return a1 === a2;
});