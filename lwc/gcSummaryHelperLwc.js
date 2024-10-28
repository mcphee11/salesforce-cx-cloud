export const region = 'ENTER_YOUR_REGION' // mypurecloud.com.au
export const clientId = 'ENTER_YOUR_CLIENTID'
export const redirectUrl = 'ENTER_YOUR_HOSTED_INDEX_PAGE' // https://yourhosting.com/oauth/index.html
export const secureFlowId = 'ENTER_SECURE_FLOW_ID'
export const conferenceFlowId = 'ENTER_CALL_FLOW_ID'
const workFlowId = 'ENTER_WORK_FLOW_ID'

export function setup(component, event, comp) {
  let channelId = sessionStorage.getItem('gc_channelId')
  let userId = sessionStorage.getItem('gc_userId')
  const key = sessionStorage.getItem('gc_accessToken')
  console.log('[mcphee11] ', channelId)
  console.log('[mcphee11] ', userId)
  console.log('[mcphee11] ', key)
  if (userId == null || userId == 'undefined') {
    //Get UserId
    const xhr = new XMLHttpRequest()
    xhr.onload = function () {
      console.log('[mcphee11] Getting userId')
      let respJSON = JSON.parse(this.responseText)
      console.dir('[mcphee11] ', respJSON)
      sessionStorage.setItem('gc_userId', respJSON.id)
      userId = respJSON.id
    }
    xhr.open('GET', 'https://api.' + region + '/api/v2/users/me')
    xhr.setRequestHeader('Content-type', 'application/json')
    xhr.setRequestHeader('Authorization', 'Bearer ' + key)
    xhr.send()
  }
  if (channelId == null || channelId == 'undefined') {
    //create channelId
    const xhr1 = new XMLHttpRequest()
    xhr1.onload = function () {
      let respJSON1 = JSON.parse(this.responseText)
      console.dir('[mcphee11] ', respJSON1)
      sessionStorage.setItem('gc_channelId', respJSON1.id)
      channelId = respJSON1.id
      createTopic(component, sessionStorage.getItem('gc_userId'), channelId, key, region, comp)
    }
    xhr1.open('POST', 'https://api.' + region + '/api/v2/notifications/channels')
    xhr1.setRequestHeader('Content-type', 'application/json')
    xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
    xhr1.send()
    console.log('[mcphee11] creating channel')
  }
  if (channelId && userId) {
    //sub to topic
    console.log('[mcphee11] channel already exists')
    createTopic(component, userId, channelId, key, region, comp)
  }
}

export function createTopic(component, userId, channelId, key, region, comp) {
  //sub to topic
  const xhr = new XMLHttpRequest()
  xhr.onload = function () {
    console.log('[mcphee11] SUB Done')
    let respJSON = JSON.parse(this.responseText)
    console.dir(respJSON)
    wss(component, channelId, comp)
  }
  let data2 = [{ id: 'v2.users.' + userId + '.conversations.summaries' }]

  xhr.open('POST', 'https://api.' + region + '/api/v2/notifications/channels/' + channelId + '/subscriptions')
  xhr.setRequestHeader('Content-type', 'application/json')
  xhr.setRequestHeader('Authorization', 'Bearer ' + key)
  xhr.send(JSON.stringify(data2))
  console.log('[mcphee11] topic sent')
}

export function wss(component, channelId, comp) {
  socket = true
  console.log('[mcphee11] creating wss: wss://streaming.' + region + '/channels/' + channelId)
  //create wss
  let socket = new WebSocket('wss://streaming.' + region + '/channels/' + channelId)

  socket.onmessage = function (event) {
    let jsonData = JSON.parse(event.data)
    //Capture incoming events
    if (jsonData.eventBody.message === 'WebSocket Heartbeat') {
      //ignore
      return
    } else {
      console.log(jsonData)
      uiUpdate(comp, jsonData.eventBody)
      workFlow(region, workFlowId, jsonData.eventBody)
    }
  }
}

export function workFlow(region, workFlowId, response) {
  console.log('[mcphee11] Trigger workflow')
  const key = sessionStorage.getItem('gc_accessToken')
  console.log('[mcphee11] ', key)
  if (key == null) {
    console.error('[mcphee11] no token')
  }
  if (key != null) {
    //Trigger workflow
    const xhr = new XMLHttpRequest()
    xhr.onload = function () {
      let respJSON1 = JSON.parse(this.responseText)
      console.dir('[mcphee11] ', respJSON1)
    }
    let data = {
      flowId: workFlowId,
      inputData: { 'flow.conversationId': response.conversationId, 'flow.summary': response.summary.text, 'flow.reason': response.reason.text, 'flow.resolution': response.resolution.text },
    }

    xhr.open('POST', 'https://api.' + region + '/api/v2/flows/executions')
    xhr.setRequestHeader('Content-type', 'application/json')
    xhr.setRequestHeader('Authorization', 'Bearer ' + key)
    xhr.send(JSON.stringify(data))
  }
}

export function uiUpdate(comp, response) {
  console.log('[mcphee11] updating UI')
  comp.summary = response.summary.text
  comp.reason = response.reason.text
  comp.resolution = response.resolution.text
}
