import axios from "axios";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";
import TelegramBot from "node-telegram-bot-api";

const apiClient = axios.create({
  baseURL: "https://customer.nesco.gov.bd",
  timeout: 10000,
  //   headers: { "X-Custom-Header": "foobar" },
});

const cust_no = "40014418";
const form_index = 1;
const bot_token = "8484585856:AAERhjFKB7ugmMFTf_p4NSRkFpQ-d2nws2I";
const chat_id = "7509119403";
// const interval = 3600000;
const interval = 10000;

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

        const creditValue = getInputValueByLabelIndex(
          responseForCredit.data,
          15,
          form_index
        );

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
  bot
    .sendMessage(chat_id, `Meter Credit : ${meterValue + " BDT"}`)
    .then(() => console.log("Message sent to Telegram"))
    .catch((err) => console.error("Telegram error:", err));
}

setInterval(() => {
  fetchHomePageData();
}, interval);

console.log(apiClient.defaults.baseURL); // print the base URL to verify
