import { LightningElement, track } from 'lwc'
import { allLogin, searchString, azureUsersSearch, azureGetUserPresence, callUserId } from './gcTeamsUsersHelperLwc'

export default class GcTeamsUsersLwc extends LightningElement {
  @track inputText = ''
  @track cards = []

  connectedCallback(component, event) {
    console.log('[mcphee11] OAuth...')
    const genesys_key = sessionStorage.getItem('genesys_accessToken')
    const azure_key = sessionStorage.getItem('azure_accessToken')

    if (genesys_key == null || genesys_key == 'undefined' || azure_key == null || azure_key == 'undefined') {
      console.log('[mcphee11] all login')
      allLogin()
    } else {
      console.log('[mcphee11] Logged in')
    }
  }

  handleInputChange(event) {
    this.inputText = event.target.value
  }

  async handleSearch() {
    this.handleRemoveCards()
    let response = await searchString(this.inputText)

    if (response.total > 0) {
      let azure_search = await azureUsersSearch(this.inputText)
      for (const result of response.results) {
        for (const user of azure_search.value) {
          if (result.email == user.mail) {
            let tel = ''
            let res = await azureGetUserPresence(user.id)
            if (res.status == 401) {
              console.warn('[mcphee11] Unauthorized Attempting to re-authenticate...')
              await allLogin()
              res = await azureGetUserPresence(user.id)
            }
            for (const phone of result.primaryContactInfo) {
              if (phone.mediaType == 'PHONE' && phone.type == 'PRIMARY') {
                tel = phone.address
              }
            }
            this.handleAddCard(result.id, tel, result.name, 'standard:people', res.availability)
            console.log('[mcphee11] ', result.id, tel, result.name, 'standard:people', res.availability)
            continue
          }
        }
      }
    }
  }

  handleAddCard(userId, tel, title, iconName, classType) {
    console.log('[mcphee11] ', this.inputText)
    if (classType == 'Available') {
      classType = 'status-green'
    }
    if (classType == 'Offline') {
      classType = 'status-grey'
    }
    if (classType == 'Busy') {
      classType = 'status-red'
    }
    if (classType == 'Away') {
      classType = 'status-yellow'
    }
    const newCard = {
      userId: userId,
      title: title,
      tel: tel,
      iconName: iconName,
      class: classType,
    }
    this.cards = [...this.cards, newCard]
  }

  handleRemoveCards() {
    this.cards = []
  }

  async handleCallBtn(event) {
    const userId = event.target.userId
    console.log('[mcphee11] Calling: ', userId)

    // Currently cx cloud only supports calling from lightening-click-to-dial element
    let response = await callUserId(userId)
    console.log('[mcphee11] Call response: ', response)
  }
}
