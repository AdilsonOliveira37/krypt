require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    goerli: {
      url: "https://eth-goerli.alchemyapi.io/v2/P4-3pj8WtT8gAen-9OHIR4yrNN_cgyKX",
      accounts: [
        "c0267bc53a461189640c71627bc4c8e337247b7d8cbb92cffc25972f280affbe",
      ],
    },
  },
};
