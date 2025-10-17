import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://customer.nesco.gov.bd",
  timeout: 10000,
  //   headers: { "X-Custom-Header": "foobar" },
});

const fetchHomePageData = async () => {
  try {
    const response = await apiClient.get("/pre/panel");
    console.log(response.headers["set-cookie"][1]);
  } catch (error) {
    console.error(error);
  }
};

fetchHomePageData();

console.log(apiClient.defaults.baseURL); // print the base URL to verify
