import axios from "axios";
import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

const apiClient = axios.create({
  baseURL: "https://customer.nesco.gov.bd",
  timeout: 10000,
  //   headers: { "X-Custom-Header": "foobar" },
});

let tokenForSendRequest = "";
let tokenForSplit;

const fetchHomePageData = async () => {
  try {
    const response = await apiClient.get("/pre/panel");
    tokenForSplit = response.headers["set-cookie"][1].split("=");
    for (let i = 1; i < tokenForSplit.length; i++) {
      tokenForSendRequest += tokenForSplit[i];
    }

    console.log("main token ..............  " + tokenForSendRequest);

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
      console.log("CSRF Token:", csrfToken);

      const response2 = await apiClient.post("/pre/panel", {
        headers: {
          Cookie: tokenForSendRequest,
        },
      });
    } else {
      console.log("No CSRF token found");
    }
  } catch (error) {
    console.error(error.message);
  }
};

fetchHomePageData();

console.log(apiClient.defaults.baseURL); // print the base URL to verify
