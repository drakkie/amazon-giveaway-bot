//imports
const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');

//settings
const AMAZON_GIVEAWAY_URL = 'https://www.amazon.com/ga/giveaways';
const HEADLESS_MODE = false;

const DEFAULT_USER_NAME = null;
const DEFAULT_USER_PASSWORD = null;
//singletons
let page;

(async () => {
    const username = DEFAULT_USER_NAME ||  readlineSync.question('Uusername: ');
    const password = DEFAULT_USER_PASSWORD || readlineSync.question('Password: ', { hideEchoBack: true });
    
    //set up browser
    const browser = await puppeteer.launch({ headless: HEADLESS_MODE });
    page = await browser.newPage();


    await page.goto(AMAZON_GIVEAWAY_URL);
    await bot.goToSignInPage();

    await bot.signIn(username, password);

    for (let i = 0; i < 24; i++) {
        await bot.enterItemPage(i);
        const entryType = await bot.determineEntryType();
        console.log('this entry type is: ' + entryType.type);

        await bot.enterLottery(entryType);

        //wait 5 seconods
        console.log('entered!');

        await sleep(8000);

        page.goBack();
    }



})();


//procs
//TODO: figure out what to do about catching promises
let bot = {
    goToSignInPage: async () => {
        await page
            .waitForSelector('[data-nav-ref="nav_ya_signin"]')
            .then(async () => {
                const signinButton = await page.$('[data-nav-ref="nav_ya_signin"]');
                signinButton.click();
            });
    },
    signIn: async (username, password) => {
        const signInButtonId = '#signInSubmit';

        await page
            .waitForSelector(signInButtonId)
            .then(async () => {
                const emailFieldId = '#ap_email';
                const passwordFieldId = '#ap_password';

                await page.type(emailFieldId, username);
                await page.type(passwordFieldId, password);

                const signInButton = await page.$(signInButtonId);
                signInButton.click();
            });
    }
    ,
    enterItemPage: async (index) => {
        const itemsSelector = 'a.a-link-normal.item-link';

        await page
            .waitForSelector(itemsSelector)
            .then(async () => {
                await page.evaluate((itemsSelector, index) => {

                    const items = document.querySelectorAll(itemsSelector);
                    items[index].click();

                }, itemsSelector, index);
            });
    },
    waitForSubmition: async () => {
        const finishedElementSelector = '#title';

        await page.waitForSelector(finishedElementSelector);
    },
    determineEntryType: async () => {
        //intializing with default value
        let type = { type: "undetermined", element: null };

        const continueButtonSelector = '[aria-labelledby="enter-youtube-video-button-announce"]';
        const prizeBoxSelector = '#box_click_target';
        const followButtonSelector = '[aria-labelledby="en_fo_follow-announce"]';
        const alreadyEnteredSelector = '#title';

        let buttonSelectors = [continueButtonSelector, prizeBoxSelector, followButtonSelector, alreadyEnteredSelector]
        await page
            .waitForSelector(buttonSelectors.join(','))
            .then(async () => {
                const continueButton = await page.$(continueButtonSelector);
                const prizeBox = await page.$(prizeBoxSelector);
                const followButton = await page.$(followButtonSelector);

                const alreadyEntered = await page.$(alreadyEnteredSelector);

                if (continueButton)
                    type = { type: "video", element: continueButton || prizeBox || followButton };
                if (prizeBox)
                    type = { type: "entry", element: prizeBox };
                if (followButton)
                    type = { type: "follow", element: followButton };
                if (alreadyEntered)
                    type = { type: "already entered", element: null };
            });

        return type;
    },
    enterLottery: async (entryType) => {
        switch (entryType.type) {
            case "video":
                const continueButtonSelector = '[aria-labelledby="enter-youtube-video-button-announce"]';

                await page
                    .waitForSelector(continueButtonSelector)
                    .then(async () => {
                        await sleep(17000);

                        await page.click(continueButtonSelector);

                        await sleep(2000);

                        bot.clickEntry();

                        await sleep(3000);
                    });

                break;
            case "entry":
                await bot.clickEntry();
                break;
            default:
                enteredItemContest = false;
                break;
        }
    },
    clickEntry: async () => {
        const prizeBoxId = '#box_click_target';

        await page
            .waitForSelector(prizeBoxId)
            .then(async () => {
                const prizeBox = await page.$(prizeBoxId);
                prizeBox.click();
            });
    }
};


//utility procs
const sleep = ms => new Promise(r => setTimeout(r, ms))