let puppeteer = require('puppeteer');
let express = require('express');
var userAgent = require('user-agents');

let base_url = "https://pcbuilder.net/product/";
const categories = ["processor","motherboard","graphics-card","ram","power-supply","storage","case","cpu-cooler"]

const app = express();
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

async function get_data(url) {
  const browser = await puppeteer.launch({  headless: true ,args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  // console.log(url);
  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36");

  await page.goto(url, { waitUntil: 'networkidle0'});    
  const data = await page.$$eval('.items', (elements) => {

      let data = [];
      
      for (let i = 0; i < elements.length; i++) {
        let item_price = elements[i].querySelector('.price').textContent;
        // Ignore items with no price 'N/A'
        if(item_price.includes('N/A') == false){

          let title = elements[i].querySelector('.table_title');
          let item_logo = elements[i].querySelector('.item-logo');
          let brand = elements[i].querySelector('.f_brand');
          let model = elements[i].querySelector('.f_model');
          let buy = elements[i].querySelector('.component-btn');
          data.push({
              name: title.querySelector('a').textContent,
              src: title.querySelector('a').href,
              img: item_logo.querySelector('img').src,
              price: item_price,
              brand: brand.textContent,
              model: model.textContent,
              buy: buy.href

          });
        }
      }
      return data;
      
  })  
  // Length of the data array as first element
  data.unshift({length: data.length});

  await browser.close();
  return data;
}


// required parameters: category
app.get("/search/:category", async (req, res) => {
    try {
        let category = req.params.category;
        let url = base_url + category;
        let data = await get_data(url);
        res.status(200).send(data);
    } catch (error) {
        res.status(404).send(error);
    }
    }
);

// Sorting by brand name
app.get("/search/:category/brand", async (req, res) => {
    try {
        let category = req.params.category;
        let url = base_url + category + "?sort=brand";
        let data = await get_data(url);
        res.status(200).send(data);
    } catch (error) {
        res.status(404).send(error);
    }
    }
);

function categories_url(){
    var arr_json = [];
    let json = {};
    for (let i = 0; i < categories.length; i++) {
        json = {
            id: i+1,
            name: categories[i],
            base_url: base_url + categories[i]
        }
        arr_json.push(json);
    }
    return arr_json;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);