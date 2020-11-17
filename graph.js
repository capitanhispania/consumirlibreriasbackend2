// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var graph = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

module.exports = {
  getUserDetails: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);
    console.log('authenticatedClient obtained');
    const user = await client
      .api('/me')
      .get();
      console.log('user info obtained');
    return user;
  },
  getSharePointList: async function(accessToken) {
    const client = getAuthenticatedClient(accessToken);
    var SPSiteID = "auditasa.sharepoint.com,701dc476-809c-4f99-a86a-a9d06ad1e086,f8847ec1-1c42-4f09-bd00-4dc6cbf57875";   // Sharepoint Site ID  
    var ListID = "07f64111-6d12-47d0-9672-7124bdddce3b"; // List/LibraryID  
    var GraphURL = "/sites/"+ SPSiteID +"/lists/"+ ListID +"/items";  //Constructed URL  
    const user = await client
      .api(GraphURL)
      .get();
      console.log('getSharePointList info obtained');
    return user;
  }, 

  // <GetCalendarViewSnippet>
  getCalendarView: async function(accessToken, start, end, timeZone) {
    const client = getAuthenticatedClient(accessToken);

    const events = await client
      .api('/me/calendarview')
      // Add Prefer header to get back times in user's timezone
      .header("Prefer", `outlook.timezone="${timeZone}"`)
      // Add the begin and end of the calendar window
      .query({ startDateTime: start, endDateTime: end })
      // Get just the properties used by the app
      .select('subject,organizer,start,end')
      // Order by start time
      .orderby('start/dateTime')
      // Get at most 50 results
      .top(50)
      .get();

    return events;
  },
  // </GetCalendarViewSnippet>

  // <CreateEventSnippet>
  createEvent: async function(accessToken, formData, timeZone) {
    const client = getAuthenticatedClient(accessToken);

    // Build a Graph event
    const newEvent = {
      subject: formData.subject,
      start: {
        dateTime: formData.start,
        timeZone: timeZone
      },
      end: {
        dateTime: formData.end,
        timeZone: timeZone
      },
      body: {
        contentType: 'text',
        content: formData.body
      }
    };

    // Add attendees if present
    if (formData.attendees) {
      newEvent.attendees = [];
      formData.attendees.forEach(attendee => {
        newEvent.attendees.push({
          type: 'required',
          emailAddress: {
            address: attendee
          }
        });
      });
    }

    // POST /me/events
    await client
      .api('/me/events')
      .post(newEvent);
  },
  // </CreateEventSnippet>
};

function getAuthenticatedClient(accessToken) {
  // Initialize Graph client
  const client = graph.Client.init({
    // Use the provided access token to authenticate
    // requests
    authProvider: (done) => {
      done(null, accessToken);
    }
  });

  return client;
}
