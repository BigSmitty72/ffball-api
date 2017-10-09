import ffballServicesV1 from './services/v1/ffball';
const express = require('express');
const router = express.Router();

router.use(function(req, res, next) {
  //TODO: Logging
  //TODO: API Validation?
  console.log('request made: ', res);
  next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});



// export default {
//   // Define the array of web endpoint routes to expose with the   following format:
//   // {
//   //   'route': <String>(required) route name,
//   //   'controller': <Function<Request, Response, next>>(required) a function that handles the route,
//   //   'verb': <String> get|put|post|delete (defaults to 'get'),
//   //   'authType': <String> 'auth_token|login|anonymous whether or not authentication is required (defaults to 'anonymous')
//   // }
//   // NOTE: For consistency, place your controllers in files in the /controllers directory
//   endpoints: [
//   ],

//   // Define the array of service routes to expose with the following format:
//   // {
//   //   'route': <String>(required) route name,
//   //   'handler': <Function<Request>>(required) a function that handles the route,
//   //   'verb': <String> get|put|post|delete (defaults to 'post'),
//   //   'authType': <String> 'auth_token|login|anonymous whether or not authentication is required (defaults to 'anonymous')
//   // }
//   // NOTE: For consistency, place your controllers in files in the /services directory
//   services: [
//     {
//       'route': '/v1/payout',
//       'serviceHandler': ffballServicesV1.getPayout
//     },
//     {
//       'route': '/v2/categories/get',
//       'serviceHandler': categoryServicesV2.getCategories
//     }
//   ],

//   // Define the array of event topics to listen to with the following format:
//   // {
//   //   'topic': <String>(required) route name,
//   //   'eventHandler': <Function<Request>>(required) a function that handles the event topic,
//   // }
//   // NOTE: For consistency, place your controllers in files in the /events directory
//   events: [
//   ]
// };
