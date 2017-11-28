#! /usr/bin/env node
const RTM = require('rtm-api')
var Workflowy = require('./node_modules/opusfluxus/')
var exec = require('child_process').exec
var prompt = require('prompt')
var fs = require('fs')

var argv = require('minimist')(process.argv.slice(2))

var userhome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
var rc_path = userhome+"/.wfrc"

var exists = fs.existsSync(rc_path)
var rc = exists && fs.readFileSync(rc_path, 'utf8')


function handleErr(reason) {
  while (reason.reason) {reason = reason.reason}
  console.log("Error " + reason.status + ": ", reason.message)
  if (reason.status == 404) {
    console.log("It seems your sessionid has expired. Let's log you in again.")
    auth()
  } else {
    process.exit(1)
  }
}

function printHelp () {
  console.log("usage: wf <command> [<args>]\n")
  console.log("The commands currently available are:\n")
  console.log("  tree n             "+"print your workflowy nodes up to depth n (default: 2)")
  console.log("    [--id=<id>]          "+"print sub nodes under the <id> (default: whole tree)")
  console.log("    [--withnote]         "+"print the note of nodes (default: false)")
  console.log("    [--hiddencompleted]  "+"hide the completed lists (default: false)")
  console.log("    [--withid]           "+"print id of nodes (default: false)")
  console.log("")
  console.log("  capture            "+"add something to a particular node")
  console.log("     --parentid=<id>      "+"<36-digit uuid of parent> (required)")
  console.log("     --name=<str>         "+"what to actually put on the node")
  console.log("    [--priority=#]        "+"0 as first child, 1 as second (default 0 (top))")
  console.log("                          "+"    (use a number like 10000 for bottom)")
  console.log("    [--note=<str>]        "+"a note for the node (default '')")
  console.log("")
}

var withnote = false
var hiddencompleted = false 
var withid = false
var id = null

function recursivePrint (node, prefix, spaces, maxDepth) {
  if (hiddencompleted && node.cp) {return}
  if (!prefix) {prefix = '\u21b3 '}
  if (!spaces) {spaces = ''}
  var println = ''
  println = spaces + prefix + node.nm
  if (withnote && node.no) {
    println += '\n'+spaces+'    '+ node.no
  }

  if (withid) {println += '\n[' + node.id + ']'}

  console.log(println)

  if (maxDepth < 1) {return}

  var children = node.ch
  for (var i in children) {
    recursivePrint(children[i], prefix, spaces+' ', maxDepth-1)
  }
}

function exit () {
  process.exit()
}

var regex = {
  sessionid: /sessionid: (\w+)/,
  rtm_api_key: /rtm_api_key: (\w+)/,
  rtm_shared_secret: /rtm_shared_secret: (\w+)/
}

console.log("~~~~~~~  Workflowy   ~~~~~~~ ")
if (argv.help) {
  printHelp()
} else if (rc && regex.sessionid.test(rc)) {
  var sessionid = rc.match(regex.sessionid)[1]
  var wf = new Workflowy({sessionid: sessionid})

  var command = argv._[0]
  if (command === 'capture') { console.log("• • • creating workflowy node • • •")
    var parentid = argv.parentid
    var priority = argv.priority
    var name = argv.name
    var note = argv.note
    wf.create(parentid, name, priority, note).then(function (result) {
      console.log("created!")
    }, handleErr).fin(exit)
  } else if (command === 'tree') { console.log("• • • fetching workflowy tree • • •")
    depth = argv.depth || argv._[1] || 2
    id = argv.id
    withnote = argv.withnote
    hiddencompleted = argv.hiddencompleted
    withid = argv.withid
    if (id) {
      wf.nodes.then(function (nodes) {
        var node = nodes.find(function (node) {
          return node.id == id
        })
        if (node) {
          //recursivePrint(node, null, '', depth)
        } else {
          console.log('node ' + id + ' not found')
        }
      }, handleErr).fin(exit)
    } else {
      wf.outline.then(function (outline) {
        var rootnode = {
          nm: 'root',
          ch: outline,
          id: ''
        }
        //recursivePrint(rootnode, null, '', depth)
      }, handleErr)
    }
  } else { console.log("• • • fetching workflowy data • • •")
    wf.meta.then(function (meta) {
      console.log("logged in as " + meta.settings.username)
      console.log(meta.projectTreeData.mainProjectTreeInfo.rootProjectChildren.length + " top-level nodes")
      if (command === 'meta') {
        console.log("meta", meta)
      } else {
        console.log("(to view commands, run with --help)")
      }
    }, handleErr)
  }
} else {
  console.log("No ~/.wfrc detected... starting authentication process...")
  auth()
}


console.log("------- RTM ---------")
if (rc && regex.rtm_api_key.test(rc)) {
  var api_key = rc.match(regex.rtm_api_key)[1]
  regex.rtm_shared_secret.test(rc)
  var shared_secret = rc.match(regex.rtm_shared_secret)[1]

  let client = new RTM(api_key,shared_secret,'RTM.PERM_DELETE')

  client.auth.getAuthUrl(function(err, authUrl, frob) {
      if ( err ) {
            return console.error(err.toString());
          }
       console.log("Auth:  " + authUrl);
       console.log("FROB:  " + frob);

  var schema = {
    properties: {
      auth: {
        required: true
      }
    }
  }
  prompt.start()
  prompt.get(schema, function (err, result) {
// Get an Auth Token for the User once they've authorized the frob
client.auth.getAuthToken(frob, function(err, user) {
	console.log("invoked with " + frob)
  if ( err ) {
    return console.error(err.toString());
  }

  // If successful, the returned user will include the property `authToken`
  console.log(user.authToken);
  // Save the user for making authenticated API calls via user.get()
})

            })
  })


  console.log("RTM creds - " + api_key + " " + shared_secret)
} else {
  console.log("No RTM credentials found")
}

function print_lists() {
}


function auth () {
  console.log("What is your workflowy login info? This will not be saved, merely used once to authenticate.")
  var schema = {
    properties: {
      email: {
        required: true
      },
      password: {
        required: true,
        hidden: true
      }
    }
  }
  prompt.start()
  prompt.get(schema, function (err, result) {
    if (err) {console.log('CANCELLED'); return}
    var wf = new Workflowy({username: result.email, password: result.password})
    wf._login.then(function () {
      if (wf.sessionid) {
        console.log("Login successful." + rc_path)
        fs.writeFileSync(rc_path, "sessionid: "+wf.sessionid+"\n")
        /*
          ,  (errf) => {
          if (errf) {
            return console.log("Failed to write sessionid to ~/.wfrc")
          }
          console.log("Successfully wrote sessionid to ~/.wfrc")
        })
      */

      } else {
        console.log("Failed to get sessionid. Check your username/password.")
      }
    }, handleErr).fin(exit)
  })
}
