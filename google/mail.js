// @ts-check
const aws = require('aws-sdk');
const ses = new aws.SES({
  region: 'eu-west-1'
});

const toList = destinators => destinators.join(', ');

const toTwoDigits = value => value < 10 ? `0${value}` : value;

const DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const toDate = date => {
  // Fri, 21 Nov 1997 09:55:06 -0600
  const day = date.getDay();
  const weekDay = DAYS[day];
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = toTwoDigits(date.getHours());
  const minutes = toTwoDigits(date.getMinutes());
  const seconds = toTwoDigits(date.getSeconds());
  return `${weekDay}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} -0000`;
};

const createMessageId = () => `<${Date.now()}@clovis-lambda>`;

const createMail = (content) => `
From: ${content.originator}
To: ${toList(content.destinators)}
Subject: ${content.subject}
Date: ${toDate(new Date())}
Message-ID: ${createMessageId()}

${content.body}
`;

const sendMail = (content) => new Promise((resolve, reject) => {
  var eParams = {
    Destination: {
      ToAddresses: content.destinators
    },
    Message: {
      Body: {
        Text: {
          Data: content.body
        }
      },
      Subject: {
        Data: content.subject
      }
    },
    Source: content.originator
  };

  console.log('===SENDING EMAIL===');
  ses.sendEmail(eParams, (err, data) => {
      if (err) {
        console.error('Cannot send email', err);
        reject(err);
      } else {
        console.log("===EMAIL SENT===");
        resolve();
      }
  });
});

module.exports = {
  createMail,
  sendMail
};
