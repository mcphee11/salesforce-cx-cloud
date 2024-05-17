// prettier-ignore
({
  doInit: function (component, event, helper) {
    console.log('OAuth...')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log(key)
    if (key == null || key == 'undefined') {
      // prettier-ignore
      const url = 'https://login.' + helper.region + '/oauth/authorize?&client_id=' + helper.clientId + '&response_type=token&redirect_uri=' + helper.redirectUrl + '&state=gc_temp_auth_redirect'
      const popup = window.open(url, 'popup', 'popup=true, height=400, width=400')
      window.addEventListener('message', function (event) {
        const data = JSON.stringify(event.data)
        const jsonResponse = JSON.parse(data)
        if (jsonResponse.access_token) {
          console.log(jsonResponse)
          popup.close()
          clearInterval(checkPopup)
          sessionStorage.setItem('gc_accessToken', jsonResponse.access_token)
        }
      })
      const checkPopup = setInterval(
        function () {
          console.log('interval')
          popup.postMessage('give me a access_token pls', '*')
          console.log('after post')
        }.bind(this),
        1000
      )
    }
  },
  secure: function (component, event, helper) {
    console.log('Secure Flow')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log(key)
    if (key == null) {
      console.error('no token')
    }
    if (key != null) {
      //GET ConversationId
      const xhr1 = new XMLHttpRequest()
      xhr1.onload = function () {
        var respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
        if (respJSON1.total == 1) {
          //trigger secure flow
          console.log('starting to trigger secure flow...')
          var conversationId = respJSON1.entities[0].id
          //prettier-ignore
          var customerParticipant = respJSON1.entities[0].participants.slice().reverse().find(function(p) { return (p.purpose == 'customer' && p.calls[0].state == 'connected')})
          //prettier-ignore
          var agentParticipant = respJSON1.entities[0].participants.slice().reverse().find(function(p) { return (p.purpose == 'agent' && p.calls[0].state == 'connected')})
          console.log(customerParticipant)
          console.log(agentParticipant)
          const xhr2 = new XMLHttpRequest()
          xhr2.onload = function () {
            console.log('secure flow done')
            var respJSON2 = JSON.parse(this.responseText)
            console.dir(respJSON2)
          }
          var data = { flowId: helper.secureFlowId, userData: 'hello', disconnect: false, sourceParticipantId: agentParticipant.id }

          xhr2.open('POST', 'https://api.' + helper.region + '/api/v2/conversations/' + conversationId + '/participants/' + customerParticipant.id + '/secureIvrSessions')
          xhr2.setRequestHeader('Content-type', 'application/json')
          xhr2.setRequestHeader('Authorization', 'Bearer ' + key)
          xhr2.send(JSON.stringify(data))
          console.log('secure flow invoked')
        }
      }
      xhr1.open('GET', 'https://api.' + helper.region + '/api/v2/conversations?communicationType=call')
      xhr1.setRequestHeader('Content-type', 'application/json')
      xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr1.send()
    }
  },

  terms: function (component, event, helper) {
    console.log('Conference Terms')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log(key)
    if (key == null) {
      console.error('no token')
    }
    if (key != null) {
      //GET ConversationId
      const xhr1 = new XMLHttpRequest()
      xhr1.onload = function () {
        var respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
        if (respJSON1.total == 1) {
          //Create Conference
          console.log('creating conference...')
          var conversationId = respJSON1.entities[0].id
          const xhr2 = new XMLHttpRequest()
          xhr2.onload = function () {
            console.log('Created Conference')
            var respJSON2 = JSON.parse(this.responseText)
            console.dir(respJSON2)
          }
          var data = { participants: [{ address: helper.conferenceFlowId + '@localhost.com' }] }

          xhr2.open('POST', 'https://api.' + helper.region + '/api/v2/conversations/calls/' + conversationId + '/participants')
          xhr2.setRequestHeader('Content-type', 'application/json')
          xhr2.setRequestHeader('Authorization', 'Bearer ' + key)
          xhr2.send(JSON.stringify(data))
          console.log('Conference Started')
        }
      }
      xhr1.open('GET', 'https://api.' + helper.region + '/api/v2/conversations?communicationType=call')
      xhr1.setRequestHeader('Content-type', 'application/json')
      xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr1.send()
    }
  },
})
