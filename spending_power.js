const Cache = importModule('cache');

// Configuration //
const CACHE_NAME = "OmniMoneyWidget";
const CACHE_ACCESS_TOKEN_KEY_NAME = "accessToken";
const CACHE_DATA_NAME = "spendingPower";
const CACHE_EXPIRATION_HOURS = 2; // data is cached for 2 hours so that the api isn't polled too frequently

const API_BASE_URL = "https://api.omnimoney.app/v1";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Helper Functions //
const getAccessToken = async () => {
  let accessToken = await cache.read(CACHE_ACCESS_TOKEN_KEY_NAME);
  
  if ( accessToken ) {
    return accessToken  
  }
  
  const alert = new Alert();
  alert.addSecureTextField("Access Token", "");
  alert.addAction("Save");
  alert.title = "OmniMoney Access Token";
  alert.message = "Please enter your OmniMoney access token.";
  
  await alert.present();
  accessToken = alert.textFieldValue(0);
  
  cache.write(CACHE_ACCESS_TOKEN_KEY_NAME, accessToken);
  return accessToken;
}


// Setup //
const cache = new Cache(CACHE_NAME);
const accessToken = await getAccessToken();

if (config.runsInWidget) {
  let widget = await createWidget()
  Script.setWidget(widget)
  Script.complete()
}

// fetch data
async function fetchData(){
  const cachedData = await cache.read(CACHE_DATA_NAME, CACHE_EXPIRATION_HOURS);
  if ( cachedData ) return cachedData;

  const url = `${API_BASE_URL}/budget/spending_power`  
  const headers = { 'Authorization': `Bearer ${accessToken}` }  
  const request = new Request(url);
  request.headers = headers;
  const result = await request.loadJSON();

  cache.write(CACHE_DATA_NAME, result);

  return result;
}


// Widget
async function createWidget() {
  // Date info
  const today = new Date();
  const endOfMonth = new Date();
  endOfMonth.setMonth(today.getMonth() + 1);
  endOfMonth.setDate(0);
  const remainingDays = endOfMonth.getDate() - today.getDate() + 1;
  const currentMonth = MONTHS[today.getMonth()];
  
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });

  const data = await fetchData();
  const freeToSpendTotal = data.spending_power;
  const todayFreeToSpend = freeToSpendTotal / remainingDays;  
  
  const widget = new ListWidget();
  const logo = widget.addText("💰");
  logo.centerAlignText();
  logo.font = Font.systemFont(24);
  
  const title = widget.addText("Today's Free to Spend");  
  title.font = Font.semiboldSystemFont(16);
  title.textOpacity = 0.8;
  title.centerAlignText();

  const ftsText = widget.addText(currencyFormatter.format(todayFreeToSpend));
  ftsText.font = Font.semiboldSystemFont(32);
  ftsText.centerAlignText();
  
  widget.addSpacer(10);
  
  const totalFtsText = widget.addText(`${currencyFormatter.format(freeToSpendTotal)} remaining for ${currentMonth}`);  
  totalFtsText.textOpacity = 0.8;
  totalFtsText.font = Font.footnote();
  totalFtsText.centerAlignText();
      
  // Widget background
  const startColor = new Color("#AFBBF3");
  const endColor = new Color("#7476E2");
  let gradient = new LinearGradient();
  gradient.colors = [startColor, endColor];
  gradient.locations = [0.0, 1];
  widget.backgroundGradient = gradient;
  
  return widget;
}
