// variables
/* globals $:false */

const NUMBER_OF_EXECUTIONS = 100
const NUMBER_OF_CONCORRENT_EXECUTIONS = 1

$(document).ready(function () {
  login()
})

function login () {
  $('#login-facebook').on('click', function (event) {
    window.location = '/auth/facebook'
  })

  $('#google').on('click', function (event) {
    window.location = '/auth/google'
  })

  // loadingTest()
  //searchUserTest()
}

function loadingTest () {
  window.onload = function () {
    setTimeout(function () {
      let socketTest = io()
      const loadTime = (window.performance.timing.loadEventEnd) - (window.performance.timing.navigationStart)
      console.log('LOAD : ', loadTime)
      socketTest.emit('save time', loadTime)
      socketTest.on('save time response', function (data) {
        // console.log('DATA UPDATED: ', data)
        if (data.length !== 100) {
          window.location.reload()
        } else {
          console.log('FINAL ARRAY: ', data)
        }
      })
    }, 0)
  }
}

function searchUserTest () {
  const arrayResult = []
  async.timesLimit(
    NUMBER_OF_EXECUTIONS,
    NUMBER_OF_CONCORRENT_EXECUTIONS,
    (n, next) => {
      let socketTest = io()
      const start = window.performance.now()
      socketTest.emit('ID request', 'bernardo.marquesg@gmail.com')
      socketTest.on('ID response', function (peerID) {
        const finished = window.performance.now() - start
        arrayResult.push({time: finished})
        next(null, arrayResult)
      })
    },
    (err, results) => {
      if (err) {
        return console.error(err)
      }
      console.log('Result:', arrayResult)
    }
  )
}
