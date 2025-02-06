const genesys_region = 'ENTER_YOUR_REGION' // mypurecloud.com.au
const genesys_clientId = 'ENTER_YOUR_CLIENTID'
const genesys_redirectUrl = 'ENTER_YOUR_HOSTED_INDEX_PAGE' // https://yourhosting.com/oauth/index.html

const azure_tenantId = 'ENTER_YOUR_ID' // Azure AD Tenant ID
const azure_clientId = 'ENTER_YOUR_ID' // Azure AD Application ID
const azure_redirectUrl = 'ENTER_YOUR_REDIRECT_URL' // https://yourhosting.com/oauth/index.html
const azure_scope = 'Presence.Read.All%20User.ReadBasic.All' // Azure scope for Microsoft Graph API

export function allLogin() {
  // prettier-ignore
  const genesys_url = `https://login.${genesys_region}/oauth/authorize?&client_id=${genesys_clientId}&response_type=token&redirect_uri=${genesys_redirectUrl}&state=gc_temp_auth_redirect`
  const genesys_popup = window.open(genesys_url, 'popup', 'popup=true, height=400, width=400')
  window.addEventListener('message', function (genesys_event) {
    const genesys_data = JSON.stringify(genesys_event.data)
    const genesys_jsonResponse = JSON.parse(genesys_data)
    if (genesys_jsonResponse.access_token && genesys_jsonResponse.from === 'genesys') {
      console.log('[mcphee11] ', genesys_jsonResponse)
      genesys_popup.close()
      clearInterval(genesys_checkPopup)
      sessionStorage.setItem('genesys_accessToken', genesys_jsonResponse.access_token)
      console.log('[mcphee11] ', sessionStorage.getItem('genesys_accessToken'))
      // Login to Azure after Genesys
      azureLogin()
    }
  })
  const genesys_checkPopup = setInterval(
    function () {
      console.log('[mcphee11] genesys interval')
      genesys_popup.postMessage('give me a access_token pls', '*')
      console.log('[mcphee11] genesys after post')
    }.bind(this),
    1000
  )
}

export function azureLogin() {
  // prettier-ignore
  const url = `https://login.microsoftonline.com/${azure_tenantId}/oauth2/v2.0/authorize?client_id=${azure_clientId}&response_type=token&redirect_uri=${azure_redirectUrl}&scope=${azure_scope}&response_mode=fragment`
  const popup = window.open(url, 'popup', 'popup=true, height=400, width=400')
  window.addEventListener('message', function (event) {
    const data = JSON.stringify(event.data)
    const jsonResponse = JSON.parse(data)
    if (jsonResponse.access_token && jsonResponse.from === 'azure') {
      console.log('[mcphee11] ', jsonResponse)
      popup.close()
      clearInterval(checkPopup)
      sessionStorage.setItem('azure_accessToken', jsonResponse.access_token)
      console.log('[mcphee11] ', sessionStorage.getItem('azure_accessToken'))
      return
    }
  })
  const checkPopup = setInterval(
    function () {
      console.log('[mcphee11] azure interval')
      popup.postMessage('give me a access_token pls', '*')
      console.log('[mcphee11] azure after post')
    }.bind(this),
    1000
  )
}

export async function searchString(text) {
  let query = {
    query: [
      {
        type: 'CONTAINS',
        fields: ['name'],
        value: text,
        operator: 'AND',
      },
      {
        operator: 'AND',
        type: 'EXACT',
        fields: ['integration'],
        value: 'microsoftteams',
      },
    ],
    sortOrder: 'ASC',
  }

  let users = await fetch(`https://api.${genesys_region}/api/v2/users/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('genesys_accessToken')}`,
    },
    body: JSON.stringify(query),
  })
  users = await users.json()
  return users
}

export async function azureUsersSearch(text) {
  let users = await fetch(`https://graph.microsoft.com/v1.0/users?$count=true&$search="displayName:${text}"&$orderBy=displayName&$select=id,displayName,mail`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('azure_accessToken')}`,
      ConsistencyLevel: 'eventual',
    },
  })
  users = await users.json()
  return users
}

export async function azureGetUserPresence(userId) {
  let presence = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/presence`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('azure_accessToken')}`,
      ConsistencyLevel: 'eventual',
    },
  })
  presence = await presence.json()
  return presence
}

export async function callUserId(userId) {
  // NOTE in cx cloud outbound calls are not supported unless triggered by the core package currently
  // or you can use the click to dial feature in salesforce
  let call = await fetch(`https://api.${genesys_region}/api/v2/conversations/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('genesys_accessToken')}`,
    },
    body: JSON.stringify({
      callUserId: userId,
      //sessionType: 'softphone',
    }),
  })
  response = await call.json()
  return response
}
