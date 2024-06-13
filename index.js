let puppeteer;
let express = require("express");
let options = {};
let base_url;

require("dotenv").config();

puppeteer = require("puppeteer");

const categories = [
  {
    name: "storage",
    img_src: "https://static.pcbuilder.net/assets/images/megamenu/storage.png",
  },
  {
    name: "processor",
    img_src:
      "https://static.pcbuilder.net/assets/images/mega-menu/nav-processor.png",
  },
  {
    name: "motherboard",
    img_src:
      "https://static.pcbuilder.net/assets/images/megamenu/motherboard.png",
  },
  {
    name: "graphics-card",
    img_src:
      "https://static.pcbuilder.net/assets/images/megamenu/graphics-card.png",
  },
  {
    name: "ram",
    img_src: "https://static.pcbuilder.net/assets/images/megamenu/memory.png",
  },
  {
    name: "power-supply",
    img_src:
      "https://static.pcbuilder.net/assets/images/megamenu/power-supply.png",
  },
  {
    name: "case",
    img_src: "https://static.pcbuilder.net/assets/images/megamenu/case.png",
  },
  {
    name: "cpu-cooler",
    img_src:
      "https://static.pcbuilder.net/assets/images/megamenu/cpu-cooler.png",
  },
];

const app = express();
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   res.setHeader("Access-Control-Allow-Private-Network", true);
//   //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
//   res.setHeader("Access-Control-Max-Age", 7200);

//   next();
// });
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
async function get_category(url, num) {
  options = {
    headless: true,
  };
  if (num === undefined) {
    num = 100;
  }
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle0" });

  // Pass num as an argument to the evaluate function to get the number of products
  const data = await page.evaluate((num) => {
    let data = [];
    let elements = document.querySelectorAll(".items");
    if (num > elements.length) {
      num = elements.length;
    }
    for (let i = 0; i < num; i++) {
      let item_price = elements[i].querySelector(".price").textContent;
      // Ignore items with no price 'N/A'
      if (item_price.includes("N/A") == false) {
        let title = elements[i].querySelector(".table_title");
        let item_logo = elements[i]
          .querySelector(".item-logo")
          .querySelector("img").src;
        if (
          item_logo === "https://static.pcbuilder.net/assets/images/blank.jpg"
        ) {
          item_logo = elements[i]
            .querySelector(".item-logo")
            .querySelector("img").dataset.src;
        }
        let brand = elements[i].querySelector(".f_brand");
        let model = elements[i].querySelector(".f_model");
        let buy = elements[i].querySelector(".component-btn");
        data.push({
          id: title.querySelector("a").href.split("/")[5],
          name: title.querySelector("a").textContent,
          src: title.querySelector("a").href,
          img: item_logo,
          price: item_price,
          brand: brand.textContent,
          model: model.textContent,
          buy: buy.href,
          category: title.querySelector("a").href.split("/")[4],
        });
      }
    }
    return data;
  }, num);

  // Length of the data array as first element
  data.unshift({ length: data.length });
  await browser.close();
  return data;
}

// product details it will return the product details { title, long_title, star_rating, desc, price, buy, images, product_info }
async function get_product(url) {
  options = {
    headless: true,
  };
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle0" });
  const data = await page.evaluate(() => {
    let data = [];

    let title = document.querySelector(".pcb-breadcrumb h2").textContent;
    let long_title = document.querySelector("h1").textContent;
    let star_rating = document.querySelector(".stars-rating").title;

    let desc_p = document.querySelectorAll(".description p");
    let desc = "";
    for (let i = 0; i < desc_p.length; i++) {
      desc += desc_p[i].textContent;
    }

    let images = [];
    let images_src = document.querySelectorAll(".img-gradient img");
    for (let i = 0; i < images_src.length; i++) {
      let img = images_src[i].src;
      if (img) {
        images.push(img);
      } else {
        images.push(images_src[i].dataset.src);
      }
    }

    let sticky_top = document.querySelectorAll(".sticky-top ul li");
    let product_features = [];
    for (let i = 0; i < sticky_top.length; i++) {
      product_features.push(sticky_top[i].textContent);
    }

    let price = document.querySelector(".budget-price").textContent;
    let buy = document.querySelector(".align-button a:nth-of-type(2)").href;

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
      product_features: product_features,
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
    let num = req.query.num;

    let url = base_url + category;
    let data = await get_category(url, num);
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

app.get("/price-tracker", async (req, res) => {
  try {
    let amazon_url = req.query.url;
    let data = await price_tracker(amazon_url).catch((error) =>
      console.error("Error:", error)
    );
    res.status(200).send(data);
    // as html element
  } catch (error) {
    res.status(404).send(error);
  }
});

async function price_tracker(amazon_url) {
  options = {
    headless: false,
    args: [
      "--enable-automation",
      "--ignore-certificate-errors",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1200,800",
    ],
  };
  var url = "https://buyhatke.com/";
  const { default: clipboardy } = await import("clipboardy");
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );

  // Grant clipboard permissions
  const client = await page.target().createCDPSession();
  await client.send("Browser.setPermission", {
    origin: url,
    permission: {
      name: "clipboard-write",
      allowWithoutSanitization: true,
    },
    setting: "granted",
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForSelector("#product-search-bar", {
    visible: true,
    timeout: 3000,
  });

  // const paste = await page.evaluate((amazon_url) => {
  //   document.getElementById("product-search-bar").focus();

  //   // copy the url
  //   navigator.clipboard.writeText(amazon_url);
  //   // paste the url
  //   navigator.clipboard.readText().then(text => // Simulate paste using execCommand
  //     document.execCommand('paste'));
  //   // return navigator.clipboard.readText();
  //   // console.log(navigator.clipboard.readText().then(text => console.log(text)));
  // }, amazon_url);
  // Debugging step: Take a screenshot before pasting
  await page.screenshot({ path: "before-paste.png" });
  await clipboardy.write(amazon_url);

  await page.hover("#product-search-bar");

  await page.focus("#product-search-bar");
  await page.keyboard.down("Control");
  await page.keyboard.press("V");
  await page.keyboard.up("Control");

  // Debugging step: Take a screenshot after pasting
  await page.screenshot({ path: "after-paste.png" });

  // Wait for the page to navigate and the chart to appear
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  await page.waitForSelector(".highcharts-root");
  // // // send svg innerhtml as json
  const svg = await page.evaluate(() => {
    return document.querySelector(".highcharts-root").innerHTML;
  });
  console.log(svg);

  // wait for 1min

  await browser.close();

  let data = {
    // "Message": paste,
    svg: svg,
  };
  return data;
}

function categories_url() {
  var arr_json = [];

  base_url = "https://pcbuilder.net/product/";
  let json = {};
  for (let i = 0; i < categories.length; i++) {
    json = {
      id: i + 1,
      name: categories[i]["name"],
      base_url: base_url + categories[i]["name"],
      img_src: categories[i]["img_src"],
    };
    arr_json.push(json);
  }
  return arr_json;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
