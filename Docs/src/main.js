import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import MathTrainerAbi from "../contract/mathTrainer.abi.json";

// MathTrainer Contract Address
const MathTrainerAddress = "0x905CCc6a19100945670A537436966890eb62bB73";

// Pages
const analyticsPage = document.getElementById('analytics-page');
const gamePage = document.querySelector('.game-page');
const scorePage = document.getElementById('score-page');
const startPage = document.getElementById('start-page');
const countdownPage = document.getElementById('countdown-page');
const accountPage = document.getElementById('account-page');

// Analytics Page
const gameAnalytics = document.getElementById('game-analytics');
const accountLoginBtn = document.getElementById("account-login");
const accountModalBtn = document.getElementById("account-modal-btn");
const accountForm = document.getElementById('account-form');
const accountModal = document.getElementById("account-modal");
const accountModalClose = document.getElementsByClassName("close")[0];
// Account Page
const accountProfile = document.getElementById('account-profile');
// Start Page
let radioContainers;
let radioInputs;
const startForm = document.getElementById('start-form');
// Countdown Page
const countdown = document.querySelector('.countdown');
// Game Page
const itemContainer = document.querySelector('.item-container');
// Score Page
const finalTimeEl = document.querySelector('.final-time');
const baseTimeEl = document.querySelector('.base-time');
const penaltyTimeEl = document.querySelector('.penalty-time');
const playAgainBtn = document.querySelector('.play-again');
const seeAccountBtn = document.querySelector('.see-account');

// Equations
let kit;
let contract;
let categoriesLength;
let questionId;
let questionAmount = 0;
let equationsArray = [];
let bestScoreArray = [];
let playerGuessArray = [];
let accountScoreArray = [];

// Countdown Page
let count = 3;
let counting;
// Game Page
let firstNumber = 0;
let secondNumber = 0;
let equationObject = {};
const wrongFormat = [];
// Time
let timer;
let timePlayed = 0;
let baseTime = 0;
let penaltyTime = 0;
let finalTime = 0;
let finalTimeDisplay = '0';
// Scroll
let valueY = 0;
// Toast Notification Configurations
toastr.options = {
  "newestOnTop": true,
  "progressBar": true,
  "preventDuplicates": true,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

const connectCeloWallet = async () => {
  if (window.celo) {
    toastr.warning('Please approve this dApp to use it');
    try {
      await window.celo.enable();
      // getting the celo kit from web3 and storing it in the global kit variable
      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      // getting accounts from the kit and setting default account as the first accounts in array
      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      // getting the contract already written and deployed on the blockchain.
      contract = new kit.web3.eth.Contract(MathTrainerAbi, MathTrainerAddress);

      toastr.success('Wallet Connected Successfully');
    } catch (error) {
      toastr.error(`${error}.`);
    }
  } else {
    toastr.warning('Please install the CeloExtensionWallet');
  }
}

// Get Game Analytics from the contract
const getGameAnalytics = async () => {
  categoriesLength = await contract.methods.categoriesLength().call();
  let usersLength = await contract.methods.usersLength().call();
  let totalGamePlayed = await contract.methods.totalGamePlayed().call();

  gameAnalytics.innerHTML = `
    <p class="item">${categoriesLength} game categories</p>
    <p class="item">${usersLength} total users</p>
    <p class="item">${totalGamePlayed} total games played</p>
    <p class="item" style="text-align: center;">${kit.defaultAccount}<br>account found</p>
  `
}

// Create user Account and show Start Page
const createUserAccount = async (e) => {
  e.preventDefault();

  let accountUsername = document.getElementById('account-username').value;

  await contract.methods.createAccount(accountUsername).send({
    from: kit.defaultAccount
  }).then(() => {
    analyticsPage.hidden = true;
    startPage.hidden = false;
    toastr.success(`${accountUsername} account created successfully.`);
  }).catch((err) => {
    toastr.error(`${err}.`);
  });
}

// Get Account Scores details from the contract
const getaccountScores = async () => {
  const _accountScores = [];
  for (let i = 0; i < categoriesLength; i++) {
    let _score = new Promise(async (resolve, reject) => {
      let s = await contract.methods.readAccountScore(i).call();

      resolve({
        category: s.category,
        score: s.score
      });
    })
    _accountScores.push(_score);
  }

  accountScoreArray = await Promise.all(_accountScores);
  accountScoresToDOM();
}

// Get bestscores details from the contract
const getBestscores = async () => {
  const _bestScores = [];
  for (let i = 0; i < categoriesLength; i++) {
    let _score = new Promise(async (resolve, reject) => {
      let bs = await contract.methods.readBestScore(i).call();

      resolve({
        id: i,
        category: bs.category,
        score: bs.score
      });
    })
    _bestScores.push(_score);
  }

  bestScoreArray = await Promise.all(_bestScores);
  bestScoresToDOM();
}

// Update Game Analytics
const processUserGame = async (_categoryId, _score) => {
  await contract.methods.processGame(_categoryId, _score).send({
    from: kit.defaultAccount
  }).then(async () => {
    await getBestscores();
    toastr.success("Game successfully Recorded.");
  }).catch((err) => {
    toastr.error(`${err}.`);
  });
}

// Refresh Account Page scores
function accountScoresToDOM() {
  document.getElementById("account-score").innerHTML = "";
  accountScoreArray.forEach((_accountScore) => {
    const newP = document.createElement("p");
    newP.className = "account-score";
    newP.innerHTML = accountScoreTemplate(_accountScore);
    document.getElementById("account-score").appendChild(newP);
  });
}

// Refresh start page best scores
function bestScoresToDOM() {
  document.getElementById("best-score").innerHTML = "";
  bestScoreArray.forEach((_bestScore) => {
    const newDiv = document.createElement("div");
    newDiv.className = "radio-container";
    newDiv.innerHTML = bestscoreTemplate(_bestScore);
    document.getElementById("best-score").appendChild(newDiv);
  });
  radioContainers = document.querySelectorAll('.radio-container');
  radioInputs = document.querySelectorAll('input');
}

// Populate Account Score details
function accountScoreTemplate(_accountScore) {
  return `
    <b>${_accountScore.category} Questions</b>
    <span>${_accountScore.score}s</span>
  `
}

// Populate Bestscore details
function bestscoreTemplate(_bestScore) {
  return `
    <label for="${_bestScore.category}">${_bestScore.category} Questions</label>
    <input type="radio" name="questions" value="${_bestScore.category}" id="${_bestScore.id}">
    <span class="best-score">
      <span>Best Score</span>
      <span class="best-score-value">${_bestScore.score}s</span>
    </span>
  `
}

// Populate Account details
function accountProfileTemplate (userInfo) {
  const icon = blockies.create({
    seed: userInfo.user,
    size: 8,
    scale: 16,
  }).toDataURL();

  return `
    <div style="text-align: center;">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${userInfo.user}/transactions" target="_blank" class="account-blockies">
        <img src="${icon}" width="120" alt="${userInfo.user}">
      </a>
      <p>${userInfo.user}</p>
      <p>${userInfo.gamePlayed} games played</p>
    </div>
    <div>
      <h4 style="text-align: center;">${userInfo.username} Scores</h4>
      <div id="account-score">${getaccountScores()}</div>
    </div>
  `
}

// Get Account details from the contract
const getAccountDetails = async (currentPage) => {
  await contract.methods.getAccount().call().then((userInfo) => {
    accountProfile.innerHTML = accountProfileTemplate(userInfo);

    currentPage.hidden = true;
    accountPage.hidden = false;
  }).catch(() => {
    toastr.error("Account User Not Found");
  })
}

// Login user Account and show Start page
const accountLogin = async () => {
  await getAccountDetails(analyticsPage);
}

// Show Start Page from Account Page
window.startGame = function () {
  accountPage.hidden = true;
  startPage.hidden = false;
}

// Show Profile Page from Score Page
window.seeAccount = async function () {
  await getAccountDetails(scorePage);
  seeAccountBtn.hidden = true;
}

// Reset game
window.playAgain = function () {
  count = 3;
  gamePage.addEventListener('click', startTimer);
  scorePage.hidden = true;
  startPage.hidden = false;
  equationsArray = [];
  playerGuessArray = [];
  valueY = 0;
  playAgainBtn.hidden = true;
}

// Scroll, store user selection in palyerGuessArray
window.select = function (guessedTrue) {
  // Scroll 80px
  valueY += 80;
  itemContainer.scroll(0, valueY);
  // Add player guess to array
  return guessedTrue ? playerGuessArray.push('true') : playerGuessArray.push('false');
}

function showScorePage() {
  // Show play again button after 1 second
  setTimeout(() => {
    playAgainBtn.hidden = false;
    seeAccountBtn.hidden = false;
  }, 1000);
  gamePage.hidden = true;
  scorePage.hidden = false;
}

// Format and display time in DOM
function scoresToDOM() {
  finalTimeDisplay = finalTime.toFixed(0);
  baseTime = timePlayed.toFixed(0);
  penaltyTime = penaltyTime.toFixed(0);
  baseTimeEl.textContent = `Base Time: ${baseTime}s`;
  penaltyTimeEl.textContent = `Penalty: +${penaltyTime}s`;
  finalTimeEl.textContent = `${finalTimeDisplay}s`;
  processUserGame(questionId, finalTimeDisplay);
  // Scroll to top, go to score page
  itemContainer.scrollTo({ top: 0, behavior: 'instant' });
  showScorePage();
}

// Stop timer, process results, go to score page
function checkTime() {
  if (playerGuessArray.length == questionAmount) {
    clearInterval(timer);
    // Check for wrong guesses, add penalty time
    equationsArray.forEach((equation, index) => {
      if (equation.evaluated === playerGuessArray[index]) {
        // Correct guess, no penalty
      } else {
        // Incorrect guess, add penalty
        penaltyTime += .5;
      }
    });
    finalTime = timePlayed + penaltyTime;
    scoresToDOM();
  }
}

// Add a tenth of a second to timePlayed
function addTime() {
  timePlayed += .1;
  checkTime();
}

// Start timer when game page is clicked
function startTimer() {
  // Reset time
  timePlayed = 0;
  penaltyTime = 0;
  finalTime = 0;
  timer = setInterval(addTime, 100);
  gamePage.removeEventListener('click', startTimer);
}

// Display game page
function showGamePage() {
  gamePage.hidden = false;
  countdownPage.hidden = true;
  clearInterval(counting);
}
// Get random number up to a max number
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
// Create Correct/Incorrect Random Equations
function createEquations() {
  // Randomly choose how many correct equations there should be
  const correctEquations = getRandomInt(questionAmount);
  // Set amount of wrong equations
  const wrongEquations = questionAmount - correctEquations;
  // Loop through, multiply random numbers up to 9, push to array
  for (let i = 0; i < correctEquations; i++) {
    firstNumber = getRandomInt(9);
    secondNumber = getRandomInt(9);
    const equationValue = firstNumber * secondNumber;
    const equation = `${firstNumber} x ${secondNumber} = ${equationValue}`;
    equationObject = { value: equation, evaluated: 'true' };
    equationsArray.push(equationObject);
  }
  // Loop through, mess with the equation results, push to array
  for (let i = 0; i < wrongEquations; i++) {
    firstNumber = getRandomInt(9);
    secondNumber = getRandomInt(9);
    const equationValue = firstNumber * secondNumber;
    wrongFormat[0] = `${firstNumber} x ${secondNumber + 1} = ${equationValue}`;
    wrongFormat[1] = `${firstNumber} x ${secondNumber} = ${equationValue - 1}`;
    wrongFormat[2] = `${firstNumber + 1} x ${secondNumber} = ${equationValue}`;
    const formatChoice = getRandomInt(3);
    const equation = wrongFormat[formatChoice];
    equationObject = { value: equation, evaluated: 'false' };
    equationsArray.push(equationObject);
  }
  shuffle(equationsArray);
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Add equations to DOM
function equationToDOM() {
  equationsArray.forEach(equation => {
    // Item
    const item = document.createElement('div');
    item.classList.add('item');
    // Equation text
    const equationText = document.createElement('h1');
    equationText.textContent = equation.value;
    // Append
    item.appendChild(equationText);
    itemContainer.appendChild(item);
  });
}

// Dynamically adding correct/incorrect equations
function populateGamePage() {
  // Reset DOM, Set Blank Space Above
  itemContainer.textContent = '';
  // Spacer
  const topSpacer = document.createElement('div');
  topSpacer.classList.add('height-240');
  // Selected Item
  const selectedItem = document.createElement('div');
  selectedItem.classList.add('selected-item');
  // Append
  itemContainer.append(topSpacer, selectedItem);

  // Create Equations, Build Elements in DOM
  createEquations();
  equationToDOM();

  // Set Blank Space Below
  const bottomSpacer = document.createElement('div');
  bottomSpacer.classList.add('height-500');
  itemContainer.appendChild(bottomSpacer);
}

function countdownStart() {
  countdown.textContent = count;
  counting = setInterval(function () {
    count > 1 ? count-- : count = 'GO!';
    countdown.textContent = count;
  }, 1000);
}

// Navigate from start page to Countdown page
function showCountdown() {
  countdownPage.hidden = false;
  startPage.hidden = true;
  countdownStart();
  populateGamePage();
  setTimeout(showGamePage, 4000);
}

// Get the value from selected radio button
function getRadioData() {
  let radioData = [];
  radioInputs.forEach(radioInput => {
    if (radioInput.checked) {
      radioData['id'] = radioInput.id;
      radioData['amount'] = radioInput.value;
    }
  });
  return radioData;
}

// Form that decides amount of question data
function selectQuestionData(e) {
  e.preventDefault();
  questionId = getRadioData().id;
  questionAmount = getRadioData().amount;
  if (questionAmount) showCountdown();
}

// Change Selected Game Option 
startForm.addEventListener('click', () => {
  radioContainers.forEach(radioEl => {
    // Remove Selected Label styling
    radioEl.classList.remove('selected-label');
    // Add it back if  radio input is checked
    if (radioEl.children[1].checked) {
      radioEl.classList.add('selected-label');
    }
  })
});

// Event Listeners
accountForm.addEventListener('submit', createUserAccount);
accountLoginBtn.addEventListener('click', accountLogin);
startForm.addEventListener('submit', selectQuestionData);
gamePage.addEventListener('click', startTimer);
window.addEventListener("load", async () => {
  await connectCeloWallet();
  await getGameAnalytics();
  await getBestscores();
})

// Modal Trigger
accountModalBtn.onclick = function() {
  accountModal.style.display = "block";
}
accountModalClose.onclick = function() {
  accountModal.style.display = "none";
}