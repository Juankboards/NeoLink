// content.js - currently this gets injected into all web pages when extension
// is running]

// Listen for messages from the page to do smart contract invocations.
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return
  }

  if (event.data.type && (event.data.type === 'NEOLINK_GET_EXTENSION_STATUS')) {
    getExtensionStatus()
  }

  // TODO: this should first do a test to determine gas cost and THEN do send
  if (event.data.type && (event.data.type === 'NEOLINK_SEND_INVOKE')) {
    let scriptHash = event.data.text.scriptHash
    let operation = event.data.text.operation
    let assetType = event.data.text.assetType
    let assetAmount = event.data.text.assetAmount
    let arg1 = event.data.text.arg1
    let arg2 = event.data.text.arg2

    // Send an invoke to the extension background page.
    sendInvoke(scriptHash, operation, arg1, arg2, assetType, assetAmount)
  }
})

function getExtensionStatus() {
  chrome.runtime.sendMessage(
    { type: 'NEOLINK_GET_EXTENSION_STATUS' },
    (response) => {
      if (response.error) {
        console.log(`NEOLINK_GET_EXTENSION_STATUS error: ${response.error}`)
      } else {
        const extState = {
          type: 'NEOLINK_GET_EXTENSION_STATUS_RESPONSE',
          result: response,
        }

        // send message back to api page
        window.postMessage(extState, '*')
      }
    }
  )
}

// Call it once to let the page know.
getExtensionStatus()

// Send a message to background.js to run a smart contract send invoke
function sendInvoke (scriptHash, operation, arg1, arg2, assetType, assetAmount) {
  console.log('invoking contract from content script')
  let args = [arg1, arg2]

  let tx = {
    'operation': operation,
    'args': args,
    'scriptHash': scriptHash,
    'amount': assetAmount,
    'type': assetType,
  }

  // send invoke contract
  chrome.runtime.sendMessage({ 'type': 'NEOLINK_SEND_INVOKE', 'tx': tx }, (response) => {
    if (response && response.error) {
      console.log('NEOLINK_SEND_INVOKE error: ' + response.error)
      window.postMessage(response, '*')
    } else if (response && response.type) {
      console.log('NEOLINK_SEND_INVOKE response: ' + response.type)
      window.postMessage(response, '*')
    } else {
      console.log('NEOLINK_SEND_INVOKE unexpected error', response)
    }
  })
}
