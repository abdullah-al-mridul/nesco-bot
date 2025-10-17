import axios from "axios";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
let currentCredit;
app.get("/", (_, res) => {
  res.status(200).send(
    // `NESCO Bot is running\nCurrent Credit: ${currentCredit} BDT\nDeveloped and maintained by Abdullah Al Mridul`
    `<h1>NESCO bot is running</h1><b>Current Credit: ${currentCredit} BDT</b><p>Developed and maintained by Abdullah Al Mridul</p>`
  );
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

const apiClient = axios.create({
  baseURL: "https://customer.nesco.gov.bd",
  timeout: 10000,
  //   headers: { "X-Custom-Header": "foobar" },
});

if (
  !process.env.cust_no ||
  !process.env.form_index ||
  !process.env.bot_token ||
  !process.env.chat_id ||
  !process.env.interval
) {
  console.error(
    "Please set all required environment variables in the .env file."
  );
  process.exit(1);
}

const cust_no = process.env.cust_no;
const form_index = parseInt(process.env.form_index);
const bot_token = process.env.bot_token;
const chat_id = process.env.chat_id;
// const interval = 3600000;
const interval = parseInt(process.env.interval);

const bot = new TelegramBot(bot_token, { polling: false });

let tokenForSendRequest = "";
let tokenForSplit;

const fetchHomePageData = async () => {
  try {
    tokenForSendRequest = "";
    tokenForSplit = [];

    const response = await apiClient.get("/pre/panel");
    tokenForSplit = response.headers["set-cookie"][1].split("=");
    for (let i = 1; i < tokenForSplit.length; i++) {
      tokenForSendRequest += tokenForSplit[i];
    }

    // console.log("main token ..............  " + tokenForSendRequest);

    // console.log(tokenForSplit);

    // console.log(response.data);

    const doc = parseDocument(response.data);

    const metas = DomUtils.findAll(
      (elem) =>
        elem.name === "meta" &&
        elem.attribs &&
        elem.attribs.name === "csrf-token",
      doc.children
    );

    if (metas.length > 0) {
      const csrfToken = metas[0].attribs.content;
      //   console.log("CSRF Token:", csrfToken);

      try {
        const responseForCredit = await apiClient.post(
          "/pre/panel",
          {
            _token: csrfToken,
            cust_no,
            submit: "রিচার্জ হিস্ট্রি",
          },
          {
            headers: {
              Cookie: "customer_service_portal_session=" + tokenForSendRequest,
            },
          }
        );
        currentCredit = null;
        const creditValue = getInputValueByLabelIndex(
          responseForCredit.data,
          15,
          form_index
        );
        currentCredit = creditValue;
        handleMeterValue(creditValue);
      } catch (error) {
        console.log(error.message);
      }
    } else {
      console.log("No CSRF token found");
    }
  } catch (error) {
    console.error(error.message);
  }
};

function getInputValueByLabelIndex(html, labelIndex, formIndex) {
  const doc = parseDocument(html);

  const labels = DomUtils.findAll((el) => el.name === "label", doc.children);

  if (labelIndex < 0 || labelIndex >= labels.length) return null;

  const label = labels[labelIndex];
  const parentDiv = DomUtils.getParent(label);
  if (!parentDiv) return null;

  const input = DomUtils.findAll(
    (el) => el.name === "input" && el.attribs?.class?.includes("form-control"),
    parentDiv.children
  );

  //   console.log(input);

  return input[formIndex]?.attribs?.value?.trim() || null;
}

function handleMeterValue(meterValue) {
  console.log("Processed Meter Value:", meterValue);

  const today = new Date().toLocaleString();
  const output = `Meter Credit : ${meterValue} BDT\nDate : ${today}`;

  bot
    .sendMessage(chat_id, output)
    .then(() => console.log("Message sent to Telegram"))
    .catch((err) => console.error("Telegram error:", err));
}

setInterval(() => {
  fetchHomePageData();
}, interval);

console.log("Target URL:", apiClient.defaults.baseURL); // print the base URL to verify
