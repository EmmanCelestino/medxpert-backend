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

exports.onAppointmentCreate = functions.firestore.document('appointments/{appointmentId}').onCreate( async (snap , context) => {

  let newAppointment = snap.data()

  const smtpTransport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().gmail.email_address,
      pass: functions.config().gmail.passkey
    }
  })

  let patient = await admin.firestore().collection('patients').doc(newAppointment.patientUid).get()
  let clinic = await admin.firestore().collection('clinics').doc(newAppointment.clinicUid).get()
  let doctor = await admin.firestore().collection('doctors').doc(newAppointment.doctorUid).get()

  let user

  if(patient.data()){
    user = await admin.firestore().collection('users').doc(patient.data().userUid).get()
  }

  if(user){

    const emailAddress = user.data().emailAddress;

    const emailContent = `
      <html>
        <body>
            <div style="width: 100%; font-family: Roboto;" class="content">
              <div>
                <h2 style="text-align: center; font-weight: 700; color : #3E6680; ">Appointment Details</h2>
              </div>
              <div style="margin-top: 50px; color: black;">
                <p>Hi ${user.data().firstName},</p>
                <br/>
                <p>Thank you for booking with ${clinic.data().name} - Dr. ${doctor.data().firstName} ${doctor.data().lastName}. Your appointment is confirmed for ${moment.unix(newAppointment.appointmentDate.seconds).format("dddd, LL")}. If you are unable to make this appointment or would like to change your appointment to a different date, please call ${clinic.data().contactNumber} or email us at ${clinic.data().emailAddress}.</p>
                <p>Thank you for trusting medXpert.</p>
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
      subject: "Appointment confirmation",
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
        console.info("[SUCCESS] Appointment creation email sent to "+emailAddress)
      }

      smtpTransport.close();
      return { code : code, message : message }
      
    })

  }

})

exports.onAppointmentCancellation = functions.firestore.document('appointments/{appointmentId}').onUpdate( async (snap , context) => {

  let newAppointment = snap.after.data()

  const smtpTransport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().gmail.email_address,
      pass: functions.config().gmail.passkey
    }
  })

  let patient = await admin.firestore().collection('patients').doc(newAppointment.patientUid).get()
  let clinic = await admin.firestore().collection('clinics').doc(newAppointment.clinicUid).get()
  let doctor = await admin.firestore().collection('doctors').doc(newAppointment.doctorUid).get()

  let user

  if(patient.data()){
    user = await admin.firestore().collection('users').doc(patient.data().userUid).get()
  }

  if(user){

    const emailAddress = user.data().emailAddress;

    let emailContent = ``

    if(newAppointment.status=="cancelled"){
      emailContent = `
        <html>
          <body>
              <div style="width: 100%; font-family: Roboto;" class="content">
                <div>
                  <h2 style="text-align: center; font-weight: 700; color : #3E6680; ">Appointment Cancellation</h2>
                </div>
                <div style="margin-top: 50px; color: black;">
                  <p>Hi ${user.data().firstName},</p>
                  <br/>
                  <p>Your appointment with ${clinic.data().name} - Dr. ${doctor.data().firstName} ${doctor.data().lastName} on ${moment.unix(newAppointment.appointmentDate.seconds).format("dddd, LL")} is now cancelled.</p>
                  <p>${newAppointment.cancellationReason?`The reason for cancellation is : `:``}</p>
                  <br/>
                  <br/>
                  <p>Yours truly,</p>
                  <p>Our medXpert team</p>
                </div>
              </div>
          </body>
        </html>
      `
    }

    const mail = {
      from: functions.config().gmail.email_address,
      to: emailAddress,
      subject: "Appointment cancellation",
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
        console.info("[SUCCESS] Email sent to "+emailAddress)
      }

      smtpTransport.close();
      return { code : code, message : message }
      
    })

  }

})

exports.onClinicCreate = functions.firestore.document('clinics/{userId}').onCreate( async (snap , context) => {

  let newClinic = snap.data()

  let subscriptionPlan = await admin.firestore().collection('subscriptionPlans').doc(newClinic.planId).get()

  const smtpTransport = mailer.createTransport({
    service: "gmail",
    auth: {
      user: functions.config().gmail.email_address,
      pass: functions.config().gmail.passkey
    }
  })

  const emailAddress = newClinic.emailAddress;

  const emailContent = `
    <html>
      <body>
          <div style="width: 100%; font-family: Roboto;" class="content">
            <div>
              <h2 style="text-align: center; font-weight: 700; color : #3E6680; ">Welcome to medXpert!</h2>
            </div>
            <div style="margin-top: 50px; color: black;">
              <p>Hi ${newClinic.name},</p>
              <br/>
              <p>Our team would like to extend gratitude for registering for our web app. We will do our best to provide you streamline care which is fast, efficient, and effective.</p>
              <br/>
              <p>Subscription details</p>
              <table style="width: 100%">
                <thead>
                  <tr>
                    <th style="text-align: center; border: 1px solid black;">Description</th>
                    <th style="text-align: center; border: 1px solid black;">No. of users</th>
                    <th style="text-align: center; border: 1px solid black;">Monthly Fees</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: center; border: 1px solid black;">${subscriptionPlan.data().description}</td>
                    <td style="text-align: center; border: 1px solid black;">${subscriptionPlan.data().noOfUsers}</td>
                    <td style="text-align: center; border: 1px solid black;">PhP ${subscriptionPlan.data().monthlyFees.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <br/>
              <p>If you wish to upgrade your plan. Contact us through email at medexpert.noreplymail@gmail.com</p>
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

})