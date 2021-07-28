// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract MathTrainer {

  struct Score {
    uint score;
    bool exist;
  }

  struct Account {
    bool exist;
    address user;
    string username;
    uint gamePlayed;
    mapping (uint => Score) scores;
  }

  struct Category {
    uint id;
    uint value;
    bool exist;
  }

  uint public usersLength = 0;
  uint public totalGamePlayed = 0;
  uint public categoriesLength = 0;

  mapping (uint => Score) internal bestscores;
  mapping (address => Account) internal users;
  mapping (uint => Category) internal categories;

  function writeCategory(uint _value) public {
    bool _exist = true;

    categories[categoriesLength] = Category(
      categoriesLength,
      _value,
      _exist
    );

    categoriesLength++;
  }

  function createAccount(string memory _username) public {
    require(! users[msg.sender].exist, "Account User Found");
    
    bool _exist = true;
    uint _gamePlayed = 0;

    Account storage newAccount = users[msg.sender];
    newAccount.exist = _exist;
    newAccount.user = msg.sender;
    newAccount.username = _username;
    newAccount.gamePlayed = _gamePlayed;

    usersLength++;
  }

  function processGame(
    uint _categoryId,
    uint _score
  ) public {
    require(categories[_categoryId].exist, "Category Not Found");

    updateAccountScore(_categoryId, _score);

    updateBestScore(_categoryId, _score);
    
    totalGamePlayed++;
  }

  function getAccount() public view returns (
    address user,
    string memory username,
    uint gamePlayed
  ) {
    require(users[msg.sender].exist, "Account User Not Found");

    return (
      users[msg.sender].user,
      users[msg.sender].username,
      users[msg.sender].gamePlayed
    );
  }

  function readAccountScore(uint _categoryId) public view returns (
    uint category,
    uint score
  ) {
    require(users[msg.sender].exist, "Account User Not Found");
    require(categories[_categoryId].exist, "Category Not Found");

    return(
      categories[_categoryId].value,
      users[msg.sender].scores[_categoryId].score
    );
  }

  function readBestScore(uint _categoryId) public view returns (
    uint category,
    uint score
   ) {
    require(categories[_categoryId].exist, "Category Not Found");

    return (
      categories[_categoryId].value,
      bestscores[_categoryId].score
    );
  }

  function updateAccountScore(
    uint _categoryId,
    uint _score
  ) internal {
    bool _exist = true;

    Score storage userScore = users[msg.sender].scores[_categoryId];

    if (userScore.exist && userScore.score > _score) {
      userScore.score = _score;
    }

    if (! userScore.exist) {
      users[msg.sender].scores[_categoryId] = Score(
        _score,
        _exist
      );
    }

    users[msg.sender].gamePlayed++;
  }

  function updateBestScore(
    uint _categoryId,
    uint _score
  ) internal {
    bool _exist = true;
    
    Score storage bestScore = bestscores[_categoryId];

    if (bestScore.exist && bestScore.score > _score) {
      bestScore.score = _score;
    }

    if (! bestScore.exist) {
      bestscores[_categoryId] = Score(
        _score,
        _exist
      );
    }
  }
}