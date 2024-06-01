let puppeteer;
let chrome = {};
const { executablePath } = require("chrome-aws-lambda");
let express = require("express");
let options = {};
let base_url;

require("dotenv").config();

puppeteer = require("puppeteer");

const categories = [
  "processor",
  "motherboard",
  "graphics-card",
  "ram",
  "power-supply",
  "storage",
  "case",
  "cpu-cooler",
];

const app = express();

// set middleware for CORS
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});
app.get("/", (req, res) => {
  res.status(200).send({
    status: 200,
    message: "server is up and running",
  });
});

app.get("/categories", async (req, res) => {
  try {
    res.status(200).send(categories_url());
  } catch (error) {
    res.status(404).send(error);
  }
});
// category of the product
async function get_category(url) {
  options = {
    headless: true,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox","--single-process", "--no-zygote"],
  };

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle0" });
  const data = await page.$$eval(".items", (elements) => {
    let data = [];

    for (let i = 0; i < elements.length; i++) {
      let item_price = elements[i].querySelector(".price").textContent;
      // Ignore items with no price 'N/A'
      if (item_price.includes("N/A") == false) {
        let title = elements[i].querySelector(".table_title");
        let item_logo = elements[i].querySelector(".item-logo");
        let brand = elements[i].querySelector(".f_brand");
        let model = elements[i].querySelector(".f_model");
        let buy = elements[i].querySelector(".component-btn");
        data.push({
          id: title.querySelector("a").href.split("/")[5],
          name: title.querySelector("a").textContent,
          src: title.querySelector("a").href,
          img: item_logo.querySelector("img").src,
          price: item_price,
          brand: brand.textContent,
          model: model.textContent,
          buy: buy.href,
          category: title.querySelector("a").href.split("/")[4],
        });
      }
    }
    return data;
  });
  // Length of the data array as first element
  data.unshift({ length: data.length });

  await browser.close();
  return data;
}

// product details
async function get_product(url) {
  options = {
    headless: true,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox","--single-process", "--no-zygote"],
  };
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle0" });
  const data = await page.evaluate(() => {
    let data = [];

    let title = document
      .querySelector(".pcb-breadcrumb")
      .querySelector("h2").textContent;
    let long_title = document.querySelector("h1").textContent;
    let star_rating = document.querySelector(".stars-rating").title;
    let desc_p = document.querySelector(".description").querySelectorAll("p");
    let desc;
    for (let i = 0; i < desc_p.length; i++) {
      desc += desc_p[i].textContent;
    }
    let images = [];
    let images_src = document.querySelectorAll(".img-gradient");
    for (let i = 0; i < images_src.length; i++) {
      let img = images_src[i].querySelector("img").src;
      if (img != null && img != undefined && img != "") {
        images.push(images_src[i].querySelector("img").src);
      } else {
        images.push(images_src[i].querySelector("img").dataset.src);
      }
    }
    let price = document.querySelector(".budget-price").textContent;
    let buy = document
      .querySelector(".align-button")
      .querySelectorAll("a")[1].href;
    let product_info = document.querySelector(".product-info");
    let product_info_level_1 = product_info.querySelectorAll(".level1");
    let product_info_data = [];
    for (let i = 0; i < product_info_level_1.length; i++) {
      let title = product_info_level_1[i].querySelector(".title").textContent;
      let level2 = product_info_level_1[i].querySelectorAll(".level2");
      let level2_data = [];
      for (let j = 0; j < level2.length; j++) {
        let level2_span = level2[j].querySelectorAll("span");
        let level2_title = level2_span[0].textContent;
        let level2_value = level2_span[1].textContent;

        level2_data.push({
          title: level2_title,
          value: level2_value,
        });
      }
      product_info_data.push({
        title: title,
        data: level2_data,
      });
    }
    data.push({
      title: title,
      long_title: long_title,
      star_rating: star_rating,
      desc: desc,
      price: price,
      buy: buy,
      images: images,
      product_info: product_info_data,
    });

    return data;
  });

  await browser.close();
  return data;
}

// required parameters: category
app.get("/categories/:category", async (req, res) => {
  try {
    base_url = "https://pcbuilder.net/product/";
    let category = req.params.category;
    let url = base_url + category;
    let data = await get_category(url);
    res.status(200).send(data);
  } catch (error) {
    res.status(404).send(error);
  }
});

// get the product details
app.get("/product/:category/:id", async (req, res) => {
  try {
    base_url = "https://pcbuilder.net/component-details/";
    let id = req.params.id;
    let category = req.params.category;
    let url = base_url + category + "/" + id;
    let data = await get_product(url);
    res.status(200).send(data);
  } catch (error) {
    res.status(404).send(error);
  }
});

function categories_url() {
  var arr_json = [];
  let json = {};
  for (let i = 0; i < categories.length; i++) {
    json = {
      id: i + 1,
      name: categories[i],
      base_url: base_url + categories[i],
    };
    arr_json.push(json);
  }
  return arr_json;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
