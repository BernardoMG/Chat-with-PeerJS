// variables
/* global $:false */

let isChatOwner = false
let isCallOwner = false
let peer
let socket
let userIDs = new Map()
let myIdentity = []
let activeChatConnection
let activeCallConnection

// TESTS
const arrayMessagesTest = []

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
function getUserMedia (constraints) {
  return new Promise(function (resolve, reject) {
    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (mediaStream) {
        resolve(mediaStream)
      })
      .catch(function (reason) {
        reject(reason)
      })
  })
}

$(document).ready(function () {
  socket = io()
  let peerID = $('#peer').text().split('PeerJS ID: ')

  peer = new Peer(peerID[1], {
    host: 'localhost',
    port: 9000,
    path: '/peerjs',
    debug: 3,
    config: {'iceServers': [
      { url: 'stun:stun1.l.google.com:19302' },
      { url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com' }
    ]}
  })

  // My identity
  myIdentity.name = $('#name').text()
  myIdentity.email = $('#email').text().split('Email: ')[1]
  myIdentity.peer = $('#peer').text().split('PeerJS ID: ')[1]

  // Invitation & Join Callbacks
  peer.on('connection', function (connection) {
    if (connection.metadata.join) {
      let conn = connection
      let peerID = connection.peer
      userIDs.set(peerID, connection.metadata.inviter)
      activeChatConnection = conn
      processAddUser(connection.metadata.inviter)

      conn.on('data', function (data) {
        handleMessage(data, conn.peer)
      })

      conn.on('close', function () {
        processUserRemoved(userIDs.get(conn.peer))
      })
    } else {
      onInvitation(connection)
    }
  })

  // Call Ofer callback
  peer.on('call', function (call) {
    let inviterName = $('.invitation-call-name')
    let acceptInvitation = $('#accept-call-invitation')
    let rejectInvitatio = $('#reject-call-invitation')
    let calleeIdentity = '<p>' + call.metadata.email + '</p>'
    inviterName.append(calleeIdentity)
    $('#myModal7').modal('show')

    acceptInvitation.on('click', function () {
      inviterName.children().remove()
      $('#call-button').hide()
      $('#leave-call').show()
      acceptCallInvitation(call)
      acceptInvitation.unbind('click')
      rejectInvitatio.unbind('click')
    })

    $('#reject-call-invitation').on('click', function () {
      // Auto Accept Call
      call.answer(null)
      setTimeout(() => {
        call.close()
      }, 500)
      inviterName.children().remove()
      acceptInvitation.unbind('click')
      rejectInvitatio.unbind('click')
    })
  })

  $('#create-chat').on('click', chatCreateForm)
  $('#join-chat').on('click', joinChatRoom)
  $('#call-button').on('click', callForm)
  $('#logout').on('click', logout)
})

/*
  Modal Setup - Create Chat
*/
function chatCreateForm () {
  $('#create-chat-form').on('click', createChatRoom)
  $('#add-friend-form').on('click', addParticipant)
}

/*
  Modal Setup - Create Call
*/
function callForm () {
  let starCallForm = $('#call-form')
  let inputEmails = $('#emails-invitation-call')
  starCallForm.on('click', function () {
    let emails = inputEmails.val().replace(/ /g, '')
    let users = []
    inputEmails.val('')

    if (emails.indexOf(',') > -1) {
      users = emails.split(',')
    } else if (emails !== '') { users[0] = emails }

    startCall(users)
    $('#leave-call').show()
    $('#call-button').hide()
    starCallForm.unbind('click')
  })
}

/*
  Logout Request
*/
function logout () {
  window.location = 'http://' + window.location.host + '/logout'
  $('#logout').unbind('click')
}

/*
  Extract all the info and fire the chat connection
*/
function createChatRoom () {
  let chatName = $('#chat-name')
  let name = chatName.val()
  chatName.val('')
  let emails = $('#emails').val().replace(/ /g, '')

  let users = []
  if (emails.indexOf(',') > -1) {
    users = emails.split(',')
  } else if (emails !== '') { users[0] = emails }

  $('#emails').val('')
  $('#create-chat').hide()
  $('#join-chat').hide()
  $('#add-friend-label').hide()
  $('#emails').hide()
  $('#add-friend-form').show()

  fireConnection(name, users[0])
}

/*
  Allow the addition of participants
*/
function addParticipant () {
  $('#add-friend-label').show()
  $('#emails').show()
  $('#add-friend-form').hide()
}

/*
  Start call and initialize all callbacks
*/
function startCall (emails) {
  generateVideoCallSpace()
  let options = {video: true, audio: true}
  let localStream
  getUserMedia(options).then(function (mediaStream) {
    localStream = mediaStream
    let video = $('.my-video')
    video[0].src = window.URL.createObjectURL(mediaStream)

    socket.emit('ID request', emails)
    socket.on('ID response', function (peerID) {
      let call = peer.call(peerID, localStream, {
        metadata: {
          'email': myIdentity.email,
          'inviter': emails
        }
      })
      activeCallConnection = call

      call.on('stream', function (stream) {
        let video = $('.video')
        video[0].src = window.URL.createObjectURL(stream)
      })

      call.on('close', function () {
        if (!isCallOwner) {
          let email = '<p>' + 'Closed by: ' + call.metadata.inviter + '</p>'
          $('.close-call-identity').append(email)
          $('#myModal8').modal('show')
        }
        $('#my-video-content').remove()
        $('#video-content').remove()
        $('#leave-call').hide()
        $('#call-button').show()
      })

      $('#leave-call').on('click', function () {
        isCallOwner = true
        call.close()
        $('#leave-call').unbind('click')
      })
      socket.off('ID response')
    })
  })
}

/*
  Video Call Space Generation
*/
function generateVideoCallSpace () {
  let displayVideoSquares =
                            '<div class="col-md-2" id="my-video-content">' +
                              '<video class="my-video responsive-video" muted style="background-color: black; position: absolute; top: 10px; left: 10%; height: 110px;" autoplay></video>' +
                            '</div>' +
                            '<div class="col-md-3" id="video-content">' +
                              '<video class="video responsive-video" style="background-color: black;" autoplay></video>' +
                            '</div>'
  $('#chat-room-row').append(displayVideoSquares)
}

/*
  The user accepted the call invitation
*/
function acceptCallInvitation (call) {
  generateVideoCallSpace()
  let options = {video: true, audio: true}
  let localStream
  getUserMedia(options).then(function (mediaStream) {
    localStream = mediaStream
    var video = $('.my-video')
    video[0].src = window.URL.createObjectURL(mediaStream)

    call.answer(localStream)
    call.on('stream', function (stream) {
      var video = $('.video')
      video[0].src = window.URL.createObjectURL(stream)
    })

    call.on('close', function () {
      if (!isCallOwner) {
        let email = '<p>' + 'Closed by: ' + call.metadata.email + '</p>'
        $('.close-call-identity').append(email)
        $('#myModal8').modal('show')
      }
      $('#my-video-content').remove()
      $('#video-content').remove()
      $('#leave-call').hide()
      $('#call-button').show()
    })

    $('#leave-call').on('click', function () {
      isCallOwner = true
      call.close()
      $('#leave-call').unbind('click')
    })
  })
}

/*
  Invitation to some chat room
*/
function onInvitation (connection) {
  let chatName = $('.invitation-chat-name')
  let chatURL = $('.invitation-chat-url')
  let chatParticipants = $('.invitation-chat-participants')
  chatName.append('<h2>' + connection.metadata.chat + '</h2>')
  chatParticipants.append('<p style="font-weight: bold;"> Sended by: </p>' + '<p>' + connection.metadata.email + '</p>')
  chatURL.append('<p>' + connection.metadata.url + '</p>')

  $('#myModal3').modal('show')

  $('#accept-chat-invitation').on('click', function () {
    let peerID = connection.peer
    userIDs.set(peerID, connection.metadata.email)
    activeChatConnection = connection
    isChatOwner = false

    connection.on('data', function (data) {
      handleMessage(data, connection.peer)
      // messageReceivedTest(data, (new Date().getTime()))
    })

    connection.on('close', function () {
      processDeleteChat(connection.metadata.chat, connection.metadata.email)
      deleteChat()
    })

    $('#reject-chat-invitation').unbind('click')
    $('#accept-chat-invitation').unbind('click')
    $('#create-chat').hide()
    $('#join-chat').hide()
    $('#leave-chat').show()
    $('.invitation-chat-name').empty()
    $('.invitation-chat-participants').empty()

    buildChat(connection.metadata.chat, connection.metadata.url, connection.metadata.email)
  })

  $('#reject-chat-invitation').on('click', function () {
    connection.close()
    $('#reject-chat-invitation').unbind('click')
    $('#accept-chat-invitation').unbind('click')
    $('.invitation-chat-name').empty()
    $('.invitation-chat-participants').empty()
  })
}

/*
  Start chat room with or without users
*/
function fireConnection (name, users) {
  $('#create-chat-form').unbind('click')
  $('#add-friend-form').unbind('click')
  if (users !== undefined) {
    socket.emit('ID request', users)
    socket.on('ID response', function (peerID) {
      chatRoomGenerator(name, peerID, users)
    })
  } else {
    chatRoomGenerator(name, false)
  }
}

/*
  Start a connection with some peer for some chat room
*/
function chatRoomGenerator (name, peerID, users) {
  socket.off('ID response')
  $('#invite-chat').show()
  $('#close-chat').show()
  $('#invite-form').on('click', inviteFriend)
  isChatOwner = true
  let msg = {
    email: myIdentity.email,
    name: name
  }
  socket.emit('URL request', msg)
  socket.on('URL response', function (chat) {
    if (peerID) {
      let conn = peer.connect(peerID, {
        metadata: {
          'join': false,
          'chat': name,
          'url': chat.url,
          'name': myIdentity.name,
          'email': myIdentity.email,
          'peer': myIdentity.peer
        }
      })
      let peerId = conn.peer
      userIDs.set(peerId, users)
      activeChatConnection = conn
      buildChat(name, chat.url, users)

      conn.on('data', function (data) {
        handleMessage(data, conn.peer)
      })

      conn.on('close', function () {
        processUserRemoved(userIDs.get(conn.peer))
      })
    } else {
      buildChat(name, chat.url)
    }
    socket.off('URL response')
  })
}

/*
  Invitation to some chat room
*/
function joinChatRoom () {
  let joinChatForm = $('#join-chat-form')
  joinChatForm.on('click', function () {
    let url = $('#chat-name-join').val()
    $('#chat-name-join').val('')
    $('#create-chat').hide()
    $('#join-chat').hide()
    $('#leave-chat').show()

    socket.emit('URL search', url)
    socket.on('URL search response', function (chat) {
      socket.emit('ID request', chat.ownerEmail)
      socket.on('ID response', function (peerID) {
        if (peerID) {
          let conn = peer.connect(peerID, {
            metadata: {
              'join': true,
              'url': chat.url,
              'inviter': myIdentity.email,
              'email': chat.ownerEmail,
              'name': chat.name
            }
          })
          activeChatConnection = conn
          userIDs.set(peerID, chat.ownerEmail)
          buildChat(chat.name, chat.url, chat.ownerEmail)
          isChatOwner = false

          conn.on('data', function (data) {
            handleMessage(data, conn.peer)
          })

          conn.on('close', function () {
            processDeleteChat(conn.metadata.name, conn.metadata.email)
            deleteChat()
          })
        }
        socket.off('URL search response')
        socket.off('ID response')
      })
    })
    joinChatForm.unbind('click')
  })
}

/*
  Chat Room UI
*/
function buildChat (name, url, users) {
  let chatRowTitle = $('#chat-room-title')
  let chatTitle = '<div class="col-md-6" id="chat_title">' +
                    '<h3 id="title">' + name + '</h3>' +
                    '<p style="font-weight: bold;"> Give this URL to your friends to participate in this chat room: </p>' +
                    '<p id="url">' + url + '</p>' +
                  '</div>'
  chatRowTitle.append(chatTitle)

  let chatRow = $('#chat-room-row')
  let chatBoardAtiveUsers =
                            '<div class="col-md-2" id="active-users">' +
                            '<p></p>' +
                            '</div>' +
                            '<div class="col-md-3" id="chat-board">' +
                              '<p></p>' +
                            '</div>'
  chatRow.prepend(chatBoardAtiveUsers)

  let messagesInputRow = $('#messages-input-row')
  let chatBoardMessages =
                            '<div class="message col-md-5" id="messages">' +
                              '<div class="form-group" id="enter-message">' +
                                '<label for="message-text-area" style="font-weight: bold; width: 100%;">New Message: </label>' +
                                '<textarea class="form-control" id="message-text-area" rows="3"></textarea>' +
                                '<button type="button" class="btn btn-success" id="send-message">Send</button>' +
                              '</div>' +
                            '</div>'
  messagesInputRow.append(chatBoardMessages)

  if (users) {
    processAddUser(users)
  }

  $('#send-message').on('click', sendMessage)
  // $('#send-message').on('click', messageDeliveryTest)

  $('#message-text-area').keypress(function (e) {
    if (e.keyCode === 13) {
      $('#send-message').click()
    }
  })

  if (isChatOwner) {
    $('#close-chat').on('click', function () {
      if (activeChatConnection) {
        activeChatConnection.close()
      }
      deleteChat()
    })
  } else {
    $('#leave-chat').on('click', function () {
      activeChatConnection.off('close')
      activeChatConnection.close()
      deleteChat()
    })
  }
}

/*
  Message Delivery Test
*/
// function messageDeliveryTest () {
//     async.timesSeries(
//       10,
//       (n, next) => {
//         setTimeout(() => {
//           let start = new Date().getTime()
//           console.log('[TEST START]: ', start)
//           activeChatConnection.send(start)
//           next(null)
//         }, 0) // Try different value here
//       },
//       (err, results) => {
//         if (err) {
//           return console.error(err)
//         }
//         console.log('TEST COMPLETED')
//       }
//     )
// }
//
// function messageReceivedTest (start, time) {
//   console.log('[TEST MESSAGE]: Send-> ' + start + ' Received-> ' + time)
//   let result = time - start
//   arrayMessagesTest.push({time: result})
//   console.log('[TEST MESSAGES]: ', arrayMessagesTest)
// }

/*
  Add user to chat room
*/
function processAddUser (users) {
  let user = '<p class="participant">' + users + '</p>'
  $('#active-users').append(user)
  $('#chat-board').append('<p style=color:red;> *** ' + users + ' entered the chat! ***</p>')
}

/*
  Invite friend to some chat room
*/
function inviteFriend () {
  $('#invite-form').unbind('click')
  let emails = $('#emails-invitation').val().replace(/ /g, '')
  let users = []
  if (emails.indexOf(',') > -1) {
    users = emails.split(',')
  } else if (emails !== '') { users[0] = emails }
  $('#emails-invitation').val('')

  socket.emit('ID request', users[0])
  socket.on('ID response', function (peerID) {
    startConnection(peerID, users[0])
  })
}

/*
  Start connection with some invited user
*/
function startConnection (peerID, email) {
  socket.off('ID response')
  let conn = peer.connect(peerID, {
    metadata: {
      'join': false,
      'chat': $('#title').text(),
      'url': $('#url').text(),
      'name': myIdentity.name,
      'email': myIdentity.email,
      'peer': myIdentity.peer
    }
  })
  let peerId = conn.peer
  userIDs.set(peerId, email)
  activeChatConnection = conn
  processAddUser(email)

  conn.on('data', function (data) {
    handleMessage(data, conn.peer)
  })

  conn.on('close', function () {
    processUserRemoved(userIDs.get(conn.peer))
  })
}

/*
  Send message
*/
function sendMessage () {
  let message = $('#message-text-area').val()
  if (activeChatConnection) {
    activeChatConnection.send(message)
  }
  let messageToAdd = '<p> Me: ' + message + '</p>'
  $('#chat-board').append(messageToAdd)
  $('#chat-board').scrollTop($('#chat-board')[0].scrollHeight)
  $('#message-text-area').val('')
}

/*
  Receive message and add it to the message chat board
*/
function handleMessage (data, peerID) {
  let userEmail = userIDs.get(peerID)
  let messageToAdd = '<p>' + userEmail + ': ' + data + '</p>'
  $('#chat-board').append(messageToAdd)
  $('#chat-board').scrollTop($('#chat-board')[0].scrollHeight)
}

/*
  Delete chat room and all the info added over time
*/
function deleteChat () {
  $('#close-chat').hide()
  $('#leave-chat').hide()
  $('#invite-chat').hide()
  $('#create-chat').show()
  $('#join-chat').show()
  $('#chat-room-title').children().remove()
  $('#active-users').remove()
  $('#chat-board').remove()
  $('#messages-input-row').children().remove()
  $('#close-chat').unbind('click')
  $('#leave-chat').unbind('click')
  $('#create-chat-form').off('click', createChatRoom)
  $('#add-friend-form').off('click', addParticipant)
}

/*
  Delete user
*/
function processUserRemoved (email) {
  let ativeUsers = $('#active-users').children('.participant')
  ativeUsers.map((user) => {
    if (ativeUsers[user].textContent === email) { ativeUsers[user].remove() }
    let messageToAdd = '<p style=color:red;> *** ' + email + ' left this chat room! ***</p>'
    $('#chat-board').append(messageToAdd)
    $('#chat-board').scrollTop($('#chat-board')[0].scrollHeight)
  })
}

/*
  Modal Setup - Some chat room was closed
*/
function processDeleteChat (chatName, identity) {
  let chatClosedName = $('.close-chat-name')
  let chatClosedIdentity = $('.close-chat-identity')
  let name = '<h3 style="font-weight: bold;">' + chatName + '</h3>'
  let owner = '<p>' + 'Closed by: ' + identity + '</p>'
  chatClosedName.append(name)
  chatClosedIdentity.append(owner)
  $('#myModal5').modal('show')
  $('#invitation-chat-invitation-close').on('click', function (event) {
    event.preventDefault()
    chatClosedName.children().remove()
    chatClosedIdentity.children().remove()
  })
}
