import axios from "axios";

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

    console.log(tokenForSendRequest);
    console.log(tokenForSplit);

    const response2 = await apiClient.post("/pre/panel", {
      headers: {
        Cookie: tokenForSendRequest,
      },
    });
    console.log(response2.data);
  } catch (error) {
    console.error(error);
  }
};

fetchHomePageData();

console.log(apiClient.defaults.baseURL); // print the base URL to verify
