import { LightningElement, api } from 'lwc'
import { setup, region, clientId, redirectUrl, secureFlowId } from './gcSummaryHelperLwc'

export default class GcSummaryLwc extends LightningElement {
  @api interactionId
  @api summary
  @api reason
  @api resolution

  connectedCallback(component, event) {
    console.log('[mcphee11] OAuth...')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log('[mcphee11] ', key)
    if (key == null || key == 'undefined') {
      // prettier-ignore
      const url = 'https://login.' + region + '/oauth/authorize?&client_id=' + clientId + '&response_type=token&redirect_uri=' + redirectUrl + '&state=gc_temp_auth_redirect'
      const popup = window.open(url, 'popup', 'popup=true, height=400, width=400')
      window.addEventListener('message', function (event) {
        const data = JSON.stringify(event.data)
        const jsonResponse = JSON.parse(data)
        if (jsonResponse.access_token) {
          console.log('[mcphee11] ', jsonResponse)
          popup.close()
          clearInterval(checkPopup)
          sessionStorage.setItem('gc_accessToken', jsonResponse.access_token)
          setup(component, event, this)
        }
      })
      const checkPopup = setInterval(
        function () {
          console.log('[mcphee11] interval')
          popup.postMessage('give me a access_token pls', '*')
          console.log('[mcphee11] after post')
        }.bind(this),
        1000
      )
    } else {
      setup(component, event, this)
    }
  }

  secure(component, event) {
    console.log('[mcphee11] Secure Flow')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log('[mcphee11] ', key)
    if (key == null) {
      console.error('[mcphee11] no token')
    }
    if (key != null) {
      //GET ConversationId
      const xhr1 = new XMLHttpRequest()
      xhr1.onload = function () {
        let respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
        if (respJSON1.total == 1) {
          //trigger secure flow
          console.log('[mcphee11] starting to trigger secure flow...')
          let conversationId = respJSON1.entities[0].id
          //prettier-ignore
          let customerParticipant = respJSON1.entities[0].participants.slice().reverse().find(function(p) { return (p.purpose == 'customer' && p.calls[0].state == 'connected')})
          //prettier-ignore
          let agentParticipant = respJSON1.entities[0].participants.slice().reverse().find(function(p) { return (p.purpose == 'agent' && p.calls[0].state == 'connected')})
          console.log('[mcphee11] ', customerParticipant)
          console.log('[mcphee11] ', agentParticipant)
          const xhr2 = new XMLHttpRequest()
          xhr2.onload = function () {
            console.log('[mcphee11] secure flow done')
            let respJSON2 = JSON.parse(this.responseText)
            console.dir('[mcphee11] ', respJSON2)
          }
          let data = { flowId: secureFlowId, userData: 'hello', disconnect: false, sourceParticipantId: agentParticipant.id }

          xhr2.open('POST', 'https://api.' + region + '/api/v2/conversations/' + conversationId + '/participants/' + customerParticipant.id + '/secureIvrSessions')
          xhr2.setRequestHeader('Content-type', 'application/json')
          xhr2.setRequestHeader('Authorization', 'Bearer ' + key)
          xhr2.send(JSON.stringify(data))
          console.log('[mcphee11] secure flow invoked')
        }
      }
      xhr1.open('GET', 'https://api.' + region + '/api/v2/conversations?communicationType=call')
      xhr1.setRequestHeader('Content-type', 'application/json')
      xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr1.send()
    }
  }

  terms(component, event) {
    console.log('[mcphee11] Conference Terms')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log('[mcphee11] ', key)
    if (key == null) {
      console.error('no token')
    }
    if (key != null) {
      //GET ConversationId
      const xhr1 = new XMLHttpRequest()
      xhr1.onload = function () {
        let respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
        if (respJSON1.total == 1) {
          //Create Conference
          console.log('[mcphee11] creating conference...')
          let conversationId = respJSON1.entities[0].id
          const xhr2 = new XMLHttpRequest()
          xhr2.onload = function () {
            console.log('[mcphee11] Created Conference')
            let respJSON2 = JSON.parse(this.responseText)
            console.dir(respJSON2)
          }
          let data = { participants: [{ address: conferenceFlowId + '@localhost.com' }] }

          xhr2.open('POST', 'https://api.' + region + '/api/v2/conversations/calls/' + conversationId + '/participants')
          xhr2.setRequestHeader('Content-type', 'application/json')
          xhr2.setRequestHeader('Authorization', 'Bearer ' + key)
          xhr2.send(JSON.stringify(data))
          console.log('[mcphee11] Conference Started')
        }
      }
      xhr1.open('GET', 'https://api.' + region + '/api/v2/conversations?communicationType=call')
      xhr1.setRequestHeader('Content-type', 'application/json')
      xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr1.send()
    }
  }
}
