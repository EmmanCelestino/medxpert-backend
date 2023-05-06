const functions = require("firebase-functions");
const admin = require('firebase-admin')

const axios = require('axios')
const moment = require('moment')
const generator = require("generate-password") 
const mailer = require('nodemailer')

admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

exports.onUserCreate = functions.firestore.document('users/{userId}').onCreate( (snap , context) => {

  let newUser = snap.data()

  const smtpTransport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().gmail.email_address,
      pass: functions.config().gmail.passkey
    }
  })

  if(newUser.type==="patient"){

    const emailAddress = newUser.emailAddress;

    const emailContent = `
      <html>
        <body>
            <div style="width: 100%; font-family: Roboto;" class="content">
              <div>
                <h2 style="text-align: center; font-weight: 700; color : #3E6680; ">Welcome to medXpert!</h2>
              </div>
              <div style="margin-top: 50px; color: black;">
                <p>Hi ${newUser.firstName},</p>
                <br/>
                <p>Our team would like to extend gratitude for registering for our web app. We will do our best to provide you streamline care which is fast, efficient, and effective.</p>
                <br/>
                <br/>
                <p>Yours truly,</p>
                <p>Our medXpert team</p>
              </div>
            </div>
        </body>
      </html>
    `
  
    const mail = {
      from: functions.config().gmail.email_address,
      to: emailAddress,
      subject: "Welcome to medXpert",
      text: emailContent,
      html: emailContent
    }
    
    smtpTransport.sendMail(mail, (error, response) => {

      let code = 200
      let message = "Email sent successfully!"

      if (error) {
        console.error(error);
        console.error("[ERROR] Email not sent.")
        code = 500
        message = "Email not sent. Something went wrong"
        
      } else {
        console.info("[SUCCESS] Welcome email sent to "+emailAddress)
      }

      smtpTransport.close();
      return { code : code, message : message }
      
    })

  }

})