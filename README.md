# salesforce-cx-cloud

A collection of custom code examples for extending on top of the OOTB CX Cloud integration with Salesforce and Genesys Cloud

### UPDATE:

**I have also created a `lwc` version of this code in the `\lwc` Dir of this project. It does the same as the Aura Component below but as its a LWC supports the newer Lightning Web Security that is being enforced more and more in environments.**

In this example you will find a folder `src` that has 4 files in it

```
  GC_Mcphee11.cmp
  GC_Mcphee11Controller.js
  GC_Mcphee11Helper.js
  GC_Mcphee11.css
  index.html
```

The `index.html` file is separate and needs to be hosted on a cloud web server to provide the HTML page for the OAuth redirect. In my case I put mine on a simple GCP Bucket but you could also use a AWS S3 Bucket if you prefer or really any hosting option. As this HTML file does NOT include any of the authentication information itself and uses 'postMessage' to communicate there is no need to create separate ones for difference ORGs as well as you can have this publicly accessible. Of course look at the code and make your own call on that for security.

The other 3x files are the Salesforce lightening component that will render the buttons required for these use cases. Right now these use cases include [Secure Flow](https://help.mypurecloud.com/articles/secure-flows/) and [conference terms](https://github.com/mcphee11/conference-terms-conditions) as native buttons inside of salesforce

![](docs/images/component.png?raw=true)

## OAuth

The first and most complex part is setting up the OAuth as currently the CX Cloud Product does NOT expose the existing OAuth token to be used via the SDK so we need to generate our own so we can then use the Platform SDK. To do this I find the best process to be is buy using a popup redirect OAuth window. This then removes the need to enforce a page refresh to the parent page. This is the `index.html` file and as mentioned above it needs to be hosted somewhere for this purpose I will assume your running it on your `localhost:8080` for this guide. The popup will look like this:

![](docs/images/popup.png?raw=true)

If the browser already has a OAuth token in its storage then it will only flash for a few ms then disappear, this token but the default code I've written will be stored in the `sessionStorage` of the browser. For this to work you will need to create a `Implicit Grant` OAuth token in Genesys Cloud with the redirect set to the URL where your hosting that index.html page.

![](docs/images/oauth.png?raw=true)

Ensure that it has the required "scopes" in this case it needs to get a users token so "employee & user" should be selected. Now save and copy the

```
clientId
```

as you will need it later.

## Secure Flow

Open up a secure flow that you need to use and get the flowId from the URL bar. Your id will be different of course

![](docs/images/secureFlowId.png?raw=true)

copy this down as you will need it later.

## Conference Flow

Create and get the FlowId similar to the secure flow. For details on the use case for the conference flow and how to build it you can see more details [here](https://github.com/mcphee11/conference-terms-conditions)

## Workflow (used for Copilot summary saving)

Create a workflow and ensure that you create data with a "Direction" of `input` with the below names.

```
Flow.conversationId
Flow.reason
Flow.resolution
Flow.summary
```

NOTE the `Flow.` part will auto append to the name as long as you create it from the Resources -> Data section. These are all of `type` string.

![](/docs/images/workflow.png?raw=true)

Copy the workflowId like the above from teh URL when you have it open and save it as you will need it later on in the helper.js code.

This Workflow will get triggered at the end of a conversation with Copilot active for the conversation summary... this will then send not just the summary created by the GenAI but also the resolution, reason and conversationId. From here you can then do what you want with the data. For example use a DataAction to create a "Task Activity" on the contact record with the data to be saved in Salesforce. or really whatever you want to do with it in a automated way.

## Creating the Salesforce Component

In the Salesforce Developer Console create a new Lightning Component Bundle and use each of the objects in the src folder for the

```
Component (GC_Mcphee11.cmp)
Controller (GC_Mcphee11Controller.js)
Helper (GC_Mcphee11Helper.js)
Styles (GC_Mcphee11.css)
```

Its probably easiest to simply copy and paste the contents from each file into your files you have created as part of the bundle. Then save the changes.

## Update the config in helper

Open up the `GC_Mcphee11Helper.js` file and update the items with your information from above into the fields then save the file.

```
region: 'ENTER_YOUR_REGION',  // mypurecloud.com.au
clientId: 'ENTER_YOUR_CLIENTID',
redirectUrl: 'ENTER_YOUR_HOSTED_INDEX_PAGE',  // https://yourhosting.com/oauth/index.html
secureFlowId: 'ENTER_SECURE_FLOW_ID',
conferenceFlowId: 'ENTER_CALL_FLOW_ID',
workFlowId: 'ENTER_WORK_FLOW_ID',
```

Now add the component to the `Voice Call` Object in Salesforce for the button to appear and be used.

## Final thoughts

So while this repo is only 2x use cases that are quite basic, using this method of integrating into the Genesys Cloud Platform API you can then really start to offer all sorts of customizations on top of what CX Cloud offers OOTB.

## New use case added: Teams Presence

I recently added a LWC example of you you can integrate into both the Genesys Cloud API and the Microsoft Teams Graph API to show teams users presence in salesforce that have the Genesys & Teams integration on them.

This can be found in the `teams-lwc` folder and the `teams-oauth-pages` are where the HTML pages are used for the OAuth redirects like in the above examples.

![](/docs/images/teams.png?raw=true)

As this uses the Microsoft API you will need to create a Implicit Grant OAuth in Azure as well as add the Microsoft URL to the `trusted` list in salesforce.
