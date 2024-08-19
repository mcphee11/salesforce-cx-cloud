// prettier-ignore
({
  region: 'ENTER_YOUR_REGION', // mypurecloud.com.au
  clientId: 'ENTER_YOUR_CLIENTID',
  redirectUrl: 'ENTER_YOUR_HOSTED_INDEX_PAGE', // https://yourhosting.com/oauth/index.html
  secureFlowId: 'ENTER_SECURE_FLOW_ID',
  conferenceFlowId: 'ENTER_CALL_FLOW_ID',
  workFlowId: 'ENTER_WORK_FLOW_ID',
  helperConst: function () {},

  setup: function (component, event, helper) {
    var selfSetup = this
    var channelId = sessionStorage.getItem('gc_channelId')
    var userId = sessionStorage.getItem('gc_userId')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log(channelId)
    console.log(userId)
    console.log(key)
    if (userId == null || userId == 'undefined') {
      //Get UserId
      const xhr = new XMLHttpRequest()
      xhr.onload = function () {
        console.log('Getting userId')
        var respJSON = JSON.parse(this.responseText)
        console.dir(respJSON)
        sessionStorage.setItem('gc_userId', respJSON.id)
        userId = respJSON.id
      }
      xhr.open('GET', 'https://api.' + selfSetup.region + '/api/v2/users/me')
      xhr.setRequestHeader('Content-type', 'application/json')
      xhr.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr.send()
    }
    if (channelId == null || channelId == 'undefined') {
      //create channelId
      const xhr1 = new XMLHttpRequest()
      xhr1.onload = function () {
        var respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
        sessionStorage.setItem('gc_channelId', respJSON1.id)
        channelId = respJSON1.id
        selfSetup.createTopic(component, userId, channelId, key, selfSetup.region)
      }
      xhr1.open('POST', 'https://api.' + selfSetup.region + '/api/v2/notifications/channels')
      xhr1.setRequestHeader('Content-type', 'application/json')
      xhr1.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr1.send()
      console.log('creating channel')
    }
    if (channelId && userId) {
      //sub to topic
      console.log('channel already exists')
      selfSetup.createTopic(component, userId, channelId, key, selfSetup.region)
    }
  },

  createTopic: function (component, userId, channelId, key, region) {
    //sub to topic
    var selfCreateTopic = this
    const xhr = new XMLHttpRequest()
    xhr.onload = function () {
      console.log('SUB Done')
      var respJSON = JSON.parse(this.responseText)
      console.dir(respJSON)
      selfCreateTopic.wss(component, channelId)
    }
    var data2 = [{ id: 'v2.users.' + userId + '.conversations.summaries' }]

    xhr.open('POST', 'https://api.' + region + '/api/v2/notifications/channels/' + channelId + '/subscriptions')
    xhr.setRequestHeader('Content-type', 'application/json')
    xhr.setRequestHeader('Authorization', 'Bearer ' + key)
    xhr.send(JSON.stringify(data2))
    console.log('topic sent')
  },

  wss: function (component, channelId) {
    var selfWss = this
    socket = true
    console.log('creating wss: wss://streaming.' + selfWss.region + '/channels/' + channelId)
    //create wss
    var socket = new WebSocket('wss://streaming.' + selfWss.region + '/channels/' + channelId)

    socket.onmessage = function (event) {
      var jsonData = JSON.parse(event.data)
      //Capture incoming events
      if (jsonData.eventBody.message === 'WebSocket Heartbeat') {
        //ignore
        return
      } else {
        console.log(jsonData)
        selfWss.uiUpdate(component, jsonData.eventBody)
        selfWss.workFlow(selfWss.region, selfWss.workFlowId, jsonData.eventBody)
      }
    }
  },

  workFlow: function (region, workFlowId, response) {
    console.log('Trigger workflow')
    const key = sessionStorage.getItem('gc_accessToken')
    console.log(key)
    if (key == null) {
      console.error('no token')
    }
    if (key != null) {
      //Trigger workflow
      const xhr = new XMLHttpRequest()
      xhr.onload = function () {
        var respJSON1 = JSON.parse(this.responseText)
        console.dir(respJSON1)
      }
      var data = {
        flowId: workFlowId,
        inputData: { 'flow.conversationId': response.conversationId, 'flow.summary': response.summary.text, 'flow.reason': response.reason.text, 'flow.resolution': response.resolution.text },
      }

      xhr.open('POST', 'https://api.' + region + '/api/v2/flows/executions')
      xhr.setRequestHeader('Content-type', 'application/json')
      xhr.setRequestHeader('Authorization', 'Bearer ' + key)
      xhr.send(JSON.stringify(data))
    }
  },

  uiUpdate: function (component, response) {
    component.set("v.summary", response.summary.text)
    component.set("v.reason", response.reason.text)
    component.set("v.resolution", response.resolution.text)
  }
})
